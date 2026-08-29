const fs = require("fs");
const path = require("path");

const BASE =
  "https://site.api.espn.com/apis/site/v2/sports/soccer";

const competitions = [
  ["eng.1", "Premier League", "league"],
  ["eng.2", "Championship", "league"],
  ["eng.3", "League One", "league"],
  ["eng.4", "League Two", "league"],
  ["eng.trophy", "EFL Trophy", "cup"],
  ["eng.league_cup", "Carabao Cup", "cup"],
  ["eng.fa", "FA Cup", "cup"]
];

function dateString(date) {
  return date.toISOString().slice(0, 10).replace(/-/g, "");
}

function addDays(date, days) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
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

      await new Promise(resolve =>
        setTimeout(resolve, 1000 * attempt)
      );
    }
  }
}

function convertMatch(event, competition) {
  const game = event.competitions?.[0];

  if (!game) return null;

  const home = game.competitors?.find(
    team => team.homeAway === "home"
  );

  const away = game.competitors?.find(
    team => team.homeAway === "away"
  );

  if (!home || !away) return null;

  return {
    id: String(event.id),
    competition: competition[1],
    competitionCode: competition[0],
    type: competition[2],
    date: event.date || null,
    completed: Boolean(event.status?.type?.completed),
    status: event.status?.type?.name || null,
    statusDetail: event.status?.type?.detail || null,

home: {
  id: home.team?.id || null,
  name: home.team?.displayName || home.team?.name || "",
  score:
    event.status?.type?.completed && home.score !== undefined
      ? Number(home.score)
      : null
},

away: {
  id: away.team?.id || null,
  name: away.team?.displayName || away.team?.name || "",
  score:
    event.status?.type?.completed && away.score !== undefined
      ? Number(away.score)
      : null
},

    venue: game.venue?.fullName || null,
    source: "ESPN"
  };
}

async function fetchCompetitionSeason(competition) {
  const start = new Date("2026-07-01T00:00:00Z");
  const end = new Date("2027-06-30T23:59:59Z");

  const matches = [];

  // Request the season in monthly chunks instead of
  // making one ESPN request for every single day.
  for (
    let monthStart = new Date(start);
    monthStart <= end;
    monthStart = addDays(monthStart, 32)
  ) {
    const monthEnd = new Date(monthStart);
    monthEnd.setUTCDate(1);
    monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1);
    monthEnd.setUTCDate(monthEnd.getUTCDate() - 1);

    if (monthEnd > end) {
      monthEnd.setTime(end.getTime());
    }

    const from = dateString(monthStart);
    const to = dateString(monthEnd);

    const url =
      `${BASE}/${competition[0]}/scoreboard?dates=${from}-${to}`;

    try {
      const data = await getJson(url);

      const chunkMatches = (data.events || [])
        .map(event => convertMatch(event, competition))
        .filter(Boolean);

      matches.push(...chunkMatches);

      console.log(
        `${competition[1]} ${from} to ${to}: ${chunkMatches.length} matches`
      );
    } catch (error) {
      console.error(
        `${competition[1]} ${from} to ${to} failed: ${error.message}`
      );
    }
  }

  return matches;
}

async function fetchMatchDetail(match) {
  const url =
    `${BASE}/${match.competitionCode}/summary?event=${match.id}`;
  try {
    const data = await getJson(url);

    const details = data.header?.competitions?.[0]?.details;

    if (!Array.isArray(details)) {
      // The response came back, but not in the shape we expected —
      // log exactly what keys ARE there so we can fix the parsing.
      console.log(
        `[match-detail] ${match.home.name} v ${match.away.name} (${match.id}): ` +
        `no "details" array found. header keys: ${Object.keys(data.header || {}).join(", ")}. ` +
        `competitions[0] keys: ${Object.keys(data.header?.competitions?.[0] || {}).join(", ")}`
      );
      return { goals: [], cards: [] };
    }

    console.log(
      `[match-detail] ${match.home.name} v ${match.away.name} (${match.id}): ` +
      `found ${details.length} raw detail entries`
    );

    const goals = [];
    const cards = [];
    let skipped = 0;

    for (const d of details) {
      const scorer = d.participants?.[0]?.athlete?.displayName || null;
      const minute = d.clock?.displayValue || null;
      const teamName = d.team?.displayName || null;

      if (!scorer || !minute) {
        skipped++;
        continue;
      }

      if (d.scoringPlay) {
        goals.push({ player: scorer, minute, team: teamName, ownGoal: Boolean(d.ownGoal) });
      } else if (d.redCard) {
        cards.push({ player: scorer, minute, team: teamName, card: "red" });
      } else if (d.yellowCard) {
        cards.push({ player: scorer, minute, team: teamName, card: "yellow" });
      }
    }

    console.log(
      `[match-detail] ${match.home.name} v ${match.away.name}: ` +
      `${goals.length} goals, ${cards.length} cards extracted from ${details.length} entries (${skipped} skipped)`
    );

    return { goals, cards };
  } catch (error) {
    console.log(
      `[match-detail] ${match.home.name} v ${match.away.name} (${match.id}) FAILED: ${error.message}`
    );
    return { goals: [], cards: [] };
  }
}

async function addRecentMatchDetail(matches) {
  // Fetching goal/card detail for every match all season would mean
  // thousands of extra requests. The "Last Result" feature on team pages
  // only ever needs this for genuinely recent matches, so scope it to
  // completed league matches within the last 5 days.
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - 5);

  const recentMatches = matches.filter(m =>
    m.completed && m.type === "league" && new Date(m.date) >= cutoff
  );

  console.log(`Fetching goal/card detail for ${recentMatches.length} recent matches...`);

  for (const match of recentMatches) {
    const detail = await fetchMatchDetail(match);
    match.goals = detail.goals;
    match.cards = detail.cards;
  }
}

async function main() {
  const output = {
    updatedAt: new Date().toISOString(),
    source: "ESPN",
    season: "2026/27",
    matches: [],
    competitions: {}
  };

  for (const competition of competitions) {
    try {
      const matches = await fetchCompetitionSeason(competition);

      output.matches.push(...matches);

      output.competitions[competition[0]] = {
        name: competition[1],
        success: true,
        matches: matches.length
      };

      console.log(
        `${competition[1]}: ${matches.length} matches`
      );
    } catch (error) {
      console.error(
        `${competition[1]} failed: ${error.message}`
      );

      output.competitions[competition[0]] = {
        name: competition[1],
        success: false,
        error: error.message
      };
    }
  }

  // Remove duplicate ESPN events.
  const seen = new Set();

  output.matches = output.matches.filter(match => {
    const key = match.id;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });

  // Sort chronologically.
  output.matches.sort(
    (a, b) =>
      new Date(a.date || 0) - new Date(b.date || 0)
  );

  await addRecentMatchDetail(output.matches);

  const file = path.join(
    process.cwd(),
    "data",
    "football-data.json"
  );

  fs.mkdirSync(path.dirname(file), {
    recursive: true
  });

  fs.writeFileSync(
    file,
    JSON.stringify(output, null, 2)
  );

  console.log(
    `Saved ${output.matches.length} matches to ${file}`
  );
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
