const fs = require("fs");
const path = require("path");

// RSS feeds that publishers explicitly offer for syndication. Each item is
// shown as a headline + short summary + link back to the original source,
// never the full article — the same pattern every legitimate news
// aggregator (Google News, Apple News, NewsNow) uses.
//
// To add another source later: confirm the feed URL actually works first
// (open it in a browser, check it's real XML), then add a line here. A
// wrong URL just gets skipped gracefully, it won't break the others.
const FEEDS = [
  { name: "BBC Sport", url: "https://feeds.bbci.co.uk/sport/football/rss.xml" },
  { name: "Sky Sports", url: "https://www.skysports.com/rss/12040" },
  { name: "The 72", url: "https://the72.co.uk/feed" },
  { name: "90min", url: "https://www.90min.com/posts.rss" },
  { name: "CaughtOffside", url: "https://www.caughtoffside.com/feed" },
  // Football League World is specifically dedicated to the Championship/
  // League One/League Two, which should help lower-league coverage — this
  // exact URL isn't independently confirmed the way the others above are,
  // so it's included as a best-effort attempt. If it's wrong, this one
  // source just contributes nothing; it won't affect the others.
  { name: "Football League World", url: "https://footballleagueworld.co.uk/feed" },
  // football.co.uk runs genuinely dedicated section feeds per division —
  // these should meaningfully improve League One/Two coverage specifically,
  // since general sources barely mention lower-league clubs. Same as above,
  // best-effort URLs — if wrong, they simply contribute nothing.
  { name: "League One News", url: "https://www.football.co.uk/league-1-news" },
  { name: "League Two News", url: "https://www.football.co.uk/league-2-news" },
  { name: "Championship News", url: "https://www.football.co.uk/championship-news" }
];

// Every club in the 92, with common short names/aliases the way headlines
// actually refer to them, so "Man Utd" and "Spurs" both match correctly.
const CLUBS = {
  "Arsenal": ["arsenal"],
  "Aston Villa": ["aston villa", "villa"],
  "Bournemouth": ["bournemouth"],
  "Brentford": ["brentford"],
  "Brighton & Hove Albion": ["brighton"],
  "Chelsea": ["chelsea"],
  "Coventry City": ["coventry"],
  "Crystal Palace": ["crystal palace", "palace"],
  "Everton": ["everton"],
  "Fulham": ["fulham"],
  "Hull City": ["hull city", "hull"],
  "Ipswich Town": ["ipswich"],
  "Leeds United": ["leeds"],
  "Liverpool": ["liverpool"],
  "Manchester City": ["manchester city", "man city"],
  "Manchester United": ["manchester united", "man utd", "man united"],
  "Newcastle United": ["newcastle"],
  "Nottingham Forest": ["nottingham forest", "forest"],
  "Sunderland": ["sunderland"],
  "Tottenham Hotspur": ["tottenham", "spurs"],
  "Birmingham City": ["birmingham"],
  "Blackburn Rovers": ["blackburn"],
  "Bolton Wanderers": ["bolton"],
  "Bristol City": ["bristol city"],
  "Burnley": ["burnley"],
  "Cardiff City": ["cardiff"],
  "Charlton Athletic": ["charlton"],
  "Derby County": ["derby county", "derby"],
  "Lincoln City": ["lincoln city", "lincoln"],
  "Middlesbrough": ["middlesbrough", "boro"],
  "Millwall": ["millwall"],
  "Norwich City": ["norwich"],
  "Portsmouth": ["portsmouth", "pompey"],
  "Preston North End": ["preston"],
  "Queens Park Rangers": ["queens park rangers", "qpr"],
  "Sheffield United": ["sheffield united", "sheff utd", "sheff united"],
  "Southampton": ["southampton"],
  "Stoke City": ["stoke"],
  "Swansea City": ["swansea"],
  "Watford": ["watford"],
  "West Bromwich Albion": ["west brom", "west bromwich"],
  "West Ham United": ["west ham"],
  "Wolverhampton Wanderers": ["wolves", "wolverhampton"],
  "Wrexham": ["wrexham"],
  "AFC Wimbledon": ["afc wimbledon"],
  "Barnsley": ["barnsley"],
  "Blackpool": ["blackpool"],
  "Bradford City": ["bradford"],
  "Bromley": ["bromley"],
  "Burton Albion": ["burton albion", "burton"],
  "Cambridge United": ["cambridge united", "cambridge"],
  "Doncaster Rovers": ["doncaster"],
  "Huddersfield Town": ["huddersfield"],
  "Leicester City": ["leicester"],
  "Leyton Orient": ["leyton orient"],
  "Luton Town": ["luton"],
  "Mansfield Town": ["mansfield"],
  "Milton Keynes Dons": ["mk dons", "milton keynes"],
  "Notts County": ["notts county"],
  "Oxford United": ["oxford united", "oxford"],
  "Peterborough United": ["peterborough"],
  "Plymouth Argyle": ["plymouth"],
  "Reading": ["reading"],
  "Sheffield Wednesday": ["sheffield wednesday", "sheff wed"],
  "Stevenage": ["stevenage"],
  "Stockport County": ["stockport"],
  "Wigan Athletic": ["wigan"],
  "Wycombe Wanderers": ["wycombe"],
  "Accrington Stanley": ["accrington"],
  "Barnet": ["barnet"],
  "Bristol Rovers": ["bristol rovers"],
  "Cheltenham Town": ["cheltenham"],
  "Chesterfield": ["chesterfield"],
  "Colchester United": ["colchester"],
  "Crawley Town": ["crawley"],
  "Crewe Alexandra": ["crewe"],
  "Exeter City": ["exeter"],
  "Fleetwood Town": ["fleetwood"],
  "Gillingham": ["gillingham"],
  "Grimsby Town": ["grimsby"],
  "Newport County": ["newport county", "newport"],
  "Northampton Town": ["northampton"],
  "Oldham Athletic": ["oldham"],
  "Port Vale": ["port vale"],
  "Rochdale": ["rochdale"],
  "Rotherham United": ["rotherham"],
  "Salford City": ["salford"],
  "Shrewsbury Town": ["shrewsbury"],
  "Swindon Town": ["swindon"],
  "Tranmere Rovers": ["tranmere"],
  "Walsall": ["walsall"],
  "York City": ["york city"]
};

function stripTags(str) {
  return (str || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function safeDate(pubDate) {
  if (pubDate) {
    const parsed = new Date(pubDate);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }
  // Missing or unparseable date — fall back to now rather than crash
  // the whole feed over one bad item.
  return new Date().toISOString();
}

function decodeEntities(str) {
  return (str || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function parseRSS(xml, sourceName) {
  const items = [];
  const itemBlocks = xml.split("<item>").slice(1);

  for (const block of itemBlocks) {
    const titleMatch = block.match(/<title>([\s\S]*?)<\/title>/);
    const linkMatch = block.match(/<link>([\s\S]*?)<\/link>/);
    const descMatch = block.match(/<description>([\s\S]*?)<\/description>/);
    const dateMatch = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/);

    if (!titleMatch || !linkMatch) continue;

    const title = decodeEntities(stripTags(titleMatch[1])).replace(/^<!\[CDATA\[|\]\]>$/g, "");
    const link = decodeEntities(stripTags(linkMatch[1])).replace(/^<!\[CDATA\[|\]\]>$/g, "");
    const description = descMatch ? decodeEntities(stripTags(descMatch[1])).replace(/^<!\[CDATA\[|\]\]>$/g, "") : "";
    const pubDate = dateMatch ? dateMatch[1].trim() : null;

    items.push({
      title,
      link,
      summary: description.length > 180 ? description.slice(0, 177) + "..." : description,
      date: safeDate(pubDate),
      source: sourceName
    });
  }

  return items;
}

function findMatchingClubs(text) {
  const lower = text.toLowerCase();
  const matches = [];
  for (const [club, aliases] of Object.entries(CLUBS)) {
    if (aliases.some(alias => lower.includes(alias))) {
      matches.push(club);
    }
  }
  return matches;
}

async function fetchFeed(feed) {
  try {
    const response = await fetch(feed.url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; The92WeeklyBot/1.0)" }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const xml = await response.text();
    return { success: true, items: parseRSS(xml, feed.name) };
  } catch (error) {
    console.error(`Failed to fetch ${feed.name}:`, error.message);
    return { success: false, items: [], error: error.message };
  }
}

async function main() {
  const results = await Promise.all(FEEDS.map(fetchFeed));

  const allItems = [];
  const sourceStatus = {};

  FEEDS.forEach((feed, i) => {
    const result = results[i];
    sourceStatus[feed.name] = { success: result.success, itemsFound: result.items.length, error: result.error };
    for (const item of result.items) {
      const clubs = findMatchingClubs(item.title + " " + item.summary);
      if (clubs.length > 0) {
        allItems.push({ ...item, clubs });
      }
    }
  });

  // Deduplicate by title (different feeds sometimes carry the same story)
  const seen = new Set();
  const deduped = allItems.filter(item => {
    const key = item.title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  deduped.sort((a, b) => new Date(b.date) - new Date(a.date));

  const output = {
    updatedAt: new Date().toISOString(),
    sources: sourceStatus,
    items: deduped.slice(0, 150)
  };

  const outPath = path.join(__dirname, "..", "data", "club-news.json");
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`Wrote ${output.items.length} club news items to ${outPath}`);
}

main().catch(error => {
  console.error("Club news update failed:", error);
  process.exit(1);
});
