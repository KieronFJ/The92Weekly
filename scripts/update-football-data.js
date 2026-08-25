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

function daysFromNow(days) {
  const d = new Date();
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
      if (attempt === 4) throw error;
      await new Promise(resolve => setTimeout(resolve, attempt * 1000));
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
      name: home.team?.displayName || home.team?.name || null,
      score:
        home.score !== undefined ? Number(home.score) : null
    },

    away: {
      id: away.team?.id || null,
      name: away.team?.displayName || away.team?.name || null,
      score:
        away.score !== undefined ? Number(away.score) : null
    },

    venue: game.venue?.fullName || null,
    source: "ESPN"
  };
}

async function main() {
  const start = daysFromNow(-3);
  const end = daysFromNow(2);

  const output = {
    updatedAt: new Date().toISOString(),
    source: "ESPN",
    matches: [],
    competitions: {}
  };

  for (const competition of competitions) {
    try {
      const url =
        `${BASE}/${competition[0]}/scoreboard` +
        `?dates=${dateString(start)}-${dateString(end)}`;

      const data = await getJson(url);

      const matches = (data.events || [])
        .map(event => convertMatch(event, competition))
        .filter(Boolean);

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

  output.matches.sort((a, b) =>
    (a.date || "").localeCompare(b.date || "")
  );

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
    `Saved ${output.matches.length} matches`
  );
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
