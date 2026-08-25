const fs = require("fs");
const path = require("path");

const BASE =
  "https://site.api.espn.com/apis/site/v2/sports/soccer";

const LEAGUES = [
  ["eng.1", "Premier League"],
  ["eng.2", "Championship"],
  ["eng.3", "League One"],
  ["eng.4", "League Two"]
];

const START_DATE = "2026-07-01T00:00:00Z";
const END_DATE = "2027-06-30T23:59:59Z";

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getJson(url) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (attempt === 4) {
        throw error;
      }

      await sleep(attempt * 1000);
    }
  }
}

function inSeason(dateString) {
  if (!dateString) return false;

  const date = new Date(dateString);
  const start = new Date(START_DATE);
  const end = new Date(END_DATE);

  return date >= start && date <= end;
}

function getCompetition(event) {
  const competition =
    event.competitions?.[0];

  if (!competition) {
    return "Football";
  }

  /*
    ESPN can expose the competition name in
    slightly different places depending on
    the event.
  */

  return (
    competition.type?.text ||
    competition.type?.name ||
    competition.league?.name ||
    competition.league?.abbreviation ||
    "Football"
  );
}

function convertMatch(event) {
  const competition =
    event.competitions?.[0];

  if (!competition) {
    return null;
  }

  const competitors =
    competition.competitors || [];

  const home =
    competitors.find(
      team => team.homeAway === "home"
    );

  const away =
    competitors.find(
      team => team.homeAway === "away"
    );

  if (!home || !away) {
    return null;
  }

  if (!event.date || !inSeason(event.date)) {
    return null;
  }

  const homeScore =
    home.score !== undefined &&
    home.score !== null &&
    home.score !== ""
      ? Number(home.score)
      : null;

  const awayScore =
    away.score !== undefined &&
    away.score !== null &&
    away.score !== ""
      ? Number(away.score)
      : null;

  return {
    id: String(event.id),

    competition:
      getCompetition(event),

    competitionCode:
      competition.type?.abbreviation ||
      competition.league?.abbreviation ||
      null,

    type:
      competition.type?.name ||
      "league",

    date:
      event.date,

    completed:
      Boolean(
        event.status?.type?.completed
      ),

    status:
      event.status?.type?.name ||
      null,

    statusDetail:
      event.status?.type?.detail ||
      null,

    home: {
      id:
        home.team?.id ||
        null,

      name:
        home.team?.displayName ||
        home.team?.name ||
        "",

      score:
        homeScore
    },

    away: {
      id:
        away.team?.id ||
        null,

      name:
        away.team?.displayName ||
        away.team?.name ||
        "",

      score:
        awayScore
    },

    venue:
      competition.venue?.fullName ||
      event.venue?.fullName ||
      null,

    source:
      "ESPN"
  };
}


/* -------------------------------------------------
   Get all 92 English clubs
------------------------------------------------- */

async function getAllTeams() {
  const teams = [];

  for (const [leagueCode, leagueName] of LEAGUES) {

    const url =
      `${BASE}/${leagueCode}/teams?limit=50`;

    console.log(
      `Loading ${leagueName} teams...`
    );

    const data = await getJson(url);

    const leagueTeams =
      data.sports?.[0]
        ?.leagues?.[0]
        ?.teams || [];

    for (const entry of leagueTeams) {

      const team = entry.team;

      if (!team?.id) {
        continue;
      }

      teams.push({
        id: String(team.id),
        name:
          team.displayName ||
          team.name ||
          "",
        leagueCode,
        leagueName
      });
    }
  }

  /*
    Remove duplicate team IDs.
  */

  const unique =
    new Map();

  for (const team of teams) {
    unique.set(team.id, team);
  }

  return Array.from(
    unique.values()
  );
}


/* -------------------------------------------------
   Get one team's complete schedule
   across ALL competitions.
------------------------------------------------- */

async function getTeamSchedule(team) {

  const matches = [];

  /*
    Played / live matches
  */

  const resultsUrl =
    `${BASE}/all/teams/${team.id}/schedule`;

  /*
    Future fixtures

    IMPORTANT:
    "all" is intentional.

    We do NOT use eng.1 / eng.2 /
    eng.3 / eng.4 here because that
    would exclude cup competitions.
  */

  const fixturesUrl =
    `${BASE}/all/teams/${team.id}/schedule?fixture=true`;

  try {

    const results =
      await getJson(resultsUrl);

    for (const event of results.events || []) {

      const match =
        convertMatch(event);

      if (match) {
        matches.push(match);
      }
    }

  } catch (error) {

    console.error(
      `${team.name} results failed: ${error.message}`
    );
  }


  try {

    const fixtures =
      await getJson(fixturesUrl);

    for (const event of fixtures.events || []) {

      const match =
        convertMatch(event);

      if (match) {
        matches.push(match);
      }
    }

  } catch (error) {

    console.error(
      `${team.name} fixtures failed: ${error.message}`
    );
  }

  return matches;
}


/* -------------------------------------------------
   Process teams with limited concurrency
------------------------------------------------- */

async function processTeams(teams) {

  const allMatches = [];

  const concurrency = 8;

  for (
    let i = 0;
    i < teams.length;
    i += concurrency
  ) {

    const batch =
      teams.slice(
        i,
        i + concurrency
      );

    console.log(
      `Processing teams ${i + 1}-${Math.min(
        i + concurrency,
        teams.length
      )} of ${teams.length}...`
    );

    const results =
      await Promise.all(
        batch.map(team =>
          getTeamSchedule(team)
        )
      );

    for (const matches of results) {
      allMatches.push(...matches);
    }
  }

  return allMatches;
}


/* -------------------------------------------------
   Main
------------------------------------------------- */

async function main() {

  console.log(
    "Starting ESPN football data update..."
  );

  const teams =
    await getAllTeams();

  console.log(
    `Found ${teams.length} English clubs.`
  );

  if (teams.length !== 92) {

    console.warn(
      `WARNING: expected 92 clubs but found ${teams.length}.`
    );

  } else {

    console.log(
      "Confirmed all 92 clubs."
    );
  }


  const matches =
    await processTeams(teams);


  /*
    Deduplicate by ESPN event ID.

    Each match appears in both teams'
    schedules, so this is essential.
  */

  const uniqueMatches =
    new Map();

  for (const match of matches) {

    if (!match?.id) {
      continue;
    }

    uniqueMatches.set(
      match.id,
      match
    );
  }


  const finalMatches =
    Array.from(
      uniqueMatches.values()
    );


  /*
    Sort chronologically.
  */

  finalMatches.sort(
    (a, b) =>
      new Date(a.date) -
      new Date(b.date)
  );


  /*
    Build competition summary.
  */

  const competitionSummary = {};

  for (const match of finalMatches) {

    const key =
      match.competitionCode ||
      match.competition ||
      "unknown";

    if (!competitionSummary[key]) {

      competitionSummary[key] = {
        name:
          match.competition ||
          key,

        matches: 0
      };
    }

    competitionSummary[key].matches++;
  }


  const output = {

    updatedAt:
      new Date().toISOString(),

    source:
      "ESPN",

    season:
      "2026/27",

    teams:
      teams.length,

    matches:
      finalMatches,

    competitions:
      competitionSummary
  };


  const file =
    path.join(
      process.cwd(),
      "data",
      "football-data.json"
    );


  fs.mkdirSync(
    path.dirname(file),
    {
      recursive: true
    }
  );


  fs.writeFileSync(
    file,
    JSON.stringify(
      output,
      null,
      2
    )
  );


  console.log(
    `Saved ${finalMatches.length} unique matches.`
  );

  console.log(
    `Saved to ${file}`
  );
}


main().catch(error => {

  console.error(
    "Football data update failed:"
  );

  console.error(error);

  process.exit(1);
});
