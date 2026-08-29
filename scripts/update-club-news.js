const fs = require("fs");
const path = require("path");

// The92 Weekly club-news updater.
//
// NEWS MODEL
// ----------
// Every one of the 92 clubs gets three separate discovery pools:
//
//   1. OFFICIAL  - club announcements, official-site stories and statements
//   2. FAN       - established supporter/fan coverage, blogs, fanzines,
//                  podcasts and supporter publications
//   3. MEDIA     - local, regional and national football media
//
// The important difference from the old system is that we search for each
// club individually instead of relying mainly on a small number of general
// football RSS feeds.
//
// Each club is given an equal allocation so high-volume Premier League clubs
// cannot crowd League One and League Two clubs out of the news dataset.
//
// The script stores headlines, summaries and links back to the original
// publisher. It does not copy full articles.

const BASE_FEEDS = [
  {
    name: "BBC Sport",
    url: "https://feeds.bbci.co.uk/sport/football/rss.xml",
    category: "media"
  },
  {
    name: "Sky Sports",
    url: "https://www.skysports.com/rss/12040",
    category: "media"
  },
  {
    name: "The 72",
    url: "https://the72.co.uk/feed",
    category: "media"
  },
  {
    name: "Vital Football",
    url: "https://vitalfootball.co.uk/feed",
    category: "fan"
  },
  {
    name: "The League Paper",
    url: "https://www.theleaguepaper.com/feed",
    category: "media"
  },
  {
    name: "90min",
    url: "https://www.90min.com/posts.rss",
    category: "media"
  },
  {
    name: "CaughtOffside",
    url: "https://www.caughtoffside.com/feed",
    category: "media"
  },
  {
    name: "Football League World",
    url: "https://footballleagueworld.co.uk/feed",
    category: "media"
  },
  {
    name: "Football365",
    url: "https://www.football365.com/feed",
    category: "media"
  },
  {
    name: "The Real EFL",
    url: "https://therealefl.co.uk/feed/",
    category: "fan"
  }
];

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

  "AFC Wimbledon": ["afc wimbledon", "wimbledon"],
  "Barnsley": ["barnsley"],
  "Blackpool": ["blackpool"],
  "Bradford City": ["bradford city", "bradford"],
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

function googleNewsUrl(query) {
  return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-GB&gl=GB&ceid=GB:en`;
}

/*
 * Every club receives three separate Google News discovery feeds.
 *
 * OFFICIAL:
 * Searches for official-site language, club announcements and statements.
 *
 * FAN:
 * Searches specifically for supporter/fan-site style coverage.
 *
 * MEDIA:
 * Searches broadly for current news about the club.
 *
 * Google News is deliberately used here because the source landscape changes
 * constantly, particularly for League One and League Two clubs.
 */
const CLUB_SOURCE_FEEDS = Object.keys(CLUBS).flatMap(club => [
  {
    name: `Official – ${club}`,
    url: googleNewsUrl(
      `"${club}" football (official OR "official website" OR "official site" OR "club statement" OR announcement)`
    ),
    clubHint: club,
    category: "official"
  },

  {
    name: `Fan – ${club}`,
    url: googleNewsUrl(
      `"${club}" football (supporters OR supporters' OR fans OR fanzine OR "fan site" OR "fan blog" OR podcast)`
    ),
    clubHint: club,
    category: "fan"
  },

  {
    name: `Media – ${club}`,
    url: googleNewsUrl(
      `"${club}" football news`
    ),
    clubHint: club,
    category: "media"
  }
]);

const FEEDS = [...BASE_FEEDS, ...CLUB_SOURCE_FEEDS];

function stripTags(str) {
  return (str || "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeEntities(str) {
  return (str || "")
    .replace(/<!\[CDATA\[/g, "")
    .replace(/\]\]>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#x2F;/gi, "/");
}

function textFromTag(block, tag) {
  const re = new RegExp(
    `<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`,
    "i"
  );

  const match = block.match(re);

  return match
    ? decodeEntities(stripTags(match[1]))
    : "";
}

function safeDate(value) {
  const parsed = new Date(value || "");

  return isNaN(parsed.getTime())
    ? new Date().toISOString()
    : parsed.toISOString();
}

function parseRSS(xml, fallbackSource) {
  const items = [];

  const blocks =
    xml.match(/<item(?:\s[^>]*)?>[\s\S]*?<\/item>/gi) || [];

  for (const block of blocks) {
    const title = textFromTag(block, "title");
    const link = textFromTag(block, "link");

    if (!title || !link) continue;

    const description =
      textFromTag(block, "description");

    const date =
      textFromTag(block, "pubDate") ||
      textFromTag(block, "published") ||
      textFromTag(block, "updated");

    const publisher =
      textFromTag(block, "source") ||
      fallbackSource;

    items.push({
      title,
      link,
      summary:
        description.length > 220
          ? description.slice(0, 217) + "..."
          : description,
      date: safeDate(date),
      source: publisher,
      feedSource: fallbackSource
    });
  }

  return items;
}

function findMatchingClubs(text) {
  const lower = text.toLowerCase();
  const matches = [];

  for (const [club, aliases] of Object.entries(CLUBS)) {
    if (
      aliases.some(alias =>
        lower.includes(alias)
      )
    ) {
      matches.push(club);
    }
  }

  return matches;
}

async function fetchFeed(feed) {
  try {
    const response = await fetch(feed.url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; The92WeeklyBot/1.0; +https://the92weekly.com)"
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const xml = await response.text();

    return {
      success: true,
      items: parseRSS(xml, feed.name)
    };
  } catch (error) {
    console.error(
      `Failed to fetch ${feed.name}: ${error.message}`
    );

    return {
      success: false,
      items: [],
      error: error.message
    };
  }
}

async function mapWithConcurrency(list, limit, fn) {
  const results = new Array(list.length);
  let next = 0;

  async function worker() {
    while (true) {
      const index = next++;

      if (index >= list.length) {
        return;
      }

      results[index] =
        await fn(list[index], index);
    }
  }

  await Promise.all(
    Array.from(
      {
        length: Math.min(
          limit,
          list.length
        )
      },
      worker
    )
  );

  return results;
}

function dedupe(items) {
  const seen = new Set();

  return items.filter(item => {
    const key =
      (item.link || item.title)
        .toLowerCase()
        .replace(/\/$/, "");

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

/*
 * Equal club allocation.
 *
 * Each club initially receives:
 *
 *   4 official
 *   4 fan
 *   4 media
 *
 * = up to 12 stories per club.
 *
 * If one category does not have enough genuine stories, the unused capacity
 * is filled with the freshest remaining stories from the other categories.
 *
 * This prevents a club with lots of national-media coverage from taking all
 * of the available space while smaller clubs receive nothing.
 */
function balanceForAllClubs(items) {
  const PER_CATEGORY = 4;
  const MAX_PER_CLUB =
    PER_CATEGORY * 3;

  const selected = [];
  const selectedKeys = new Set();

  const counts = Object.fromEntries(
    Object.keys(CLUBS).map(club => [
      club,
      {
        official: 0,
        fan: 0,
        media: 0,
        total: 0
      }
    ])
  );

  const sorted = [...items].sort(
    (a, b) =>
      new Date(b.date) -
      new Date(a.date)
  );

  /*
   * PASS 1
   *
   * Every club gets the same opportunity in every category.
   */
  for (const club of Object.keys(CLUBS)) {
    for (const category of [
      "official",
      "fan",
      "media"
    ]) {
      for (const item of sorted) {
        if (
          !item.clubs.includes(club) ||
          item.category !== category
        ) {
          continue;
        }

        const key =
          (item.link || item.title)
            .toLowerCase();

        if (selectedKeys.has(key)) {
          continue;
        }

        if (
          counts[club][category] >=
          PER_CATEGORY
        ) {
          break;
        }

        selected.push(item);
        selectedKeys.add(key);

        counts[club][category]++;
        counts[club].total++;
      }
    }
  }

  /*
   * PASS 2
   *
   * If a club does not have enough stories in one category, use the freshest
   * remaining stories from any category rather than leaving the club empty.
   */
  for (const club of Object.keys(CLUBS)) {
    for (const item of sorted) {
      if (
        counts[club].total >=
        MAX_PER_CLUB
      ) {
        break;
      }

      if (!item.clubs.includes(club)) {
        continue;
      }

      const key =
        (item.link || item.title)
          .toLowerCase();

      if (selectedKeys.has(key)) {
        continue;
      }

      selected.push(item);
      selectedKeys.add(key);

      counts[club].total++;
    }
  }

  /*
   * Allow enough capacity for all 92 clubs.
   *
   * 92 × 12 = 1,104 theoretical stories.
   */
  selected.sort(
    (a, b) =>
      new Date(b.date) -
      new Date(a.date)
  );

  return selected.slice(0, 1200);
}

async function main() {
  console.log(
    `Fetching ${FEEDS.length} news feeds with concurrency limit 12...`
  );

  const results =
    await mapWithConcurrency(
      FEEDS,
      12,
      fetchFeed
    );

  const allItems = [];
  const sourceStatus = {};

  FEEDS.forEach((feed, i) => {
    const result = results[i];

    sourceStatus[feed.name] = {
      success: result.success,
      itemsFound:
        result.items.length,
      error:
        result.error || null
    };

    for (const item of result.items) {
      const clubs =
        feed.clubHint
          ? [feed.clubHint]
          : findMatchingClubs(
              `${item.title} ${item.summary}`
            );

      if (clubs.length === 0) {
        continue;
      }

      allItems.push({
        ...item,
        clubs,
        category:
          feed.category || "media"
      });
    }
  });

  const deduped =
    dedupe(allItems);

  const balanced =
    balanceForAllClubs(
      deduped
    );

  /*
   * Count how much coverage each club received.
   */
  const clubCounts =
    Object.fromEntries(
      Object.keys(CLUBS).map(
        club => [club, 0]
      )
    );

  balanced.forEach(item => {
    item.clubs.forEach(club => {
      if (
        clubCounts[club] !==
        undefined
      ) {
        clubCounts[club]++;
      }
    });
  });

  /*
   * Count the source categories for every club.
   */
  const categoryCounts =
    Object.fromEntries(
      Object.keys(CLUBS).map(
        club => [
          club,
          {
            official: 0,
            fan: 0,
            media: 0,
            total: 0
          }
        ]
      )
    );

  balanced.forEach(item => {
    item.clubs.forEach(club => {
      if (!categoryCounts[club]) {
        return;
      }

      const category =
        [
          "official",
          "fan",
          "media"
        ].includes(item.category)
          ? item.category
          : "media";

      categoryCounts[club][category]++;
      categoryCounts[club].total++;
    });
  });

  const output = {
    updatedAt:
      new Date().toISOString(),

    feedCount:
      FEEDS.length,

    successfulFeeds:
      Object.values(
        sourceStatus
      ).filter(
        s => s.success
      ).length,

    sources:
      sourceStatus,

    clubCounts,

    categoryCounts,

    items:
      balanced
  };

  const outPath =
    path.join(
      __dirname,
      "..",
      "data",
      "club-news.json"
    );

  fs.writeFileSync(
    outPath,
    JSON.stringify(
      output,
      null,
      2
    )
  );

  console.log(
    `Wrote ${output.items.length} balanced club news items from ${output.successfulFeeds}/${output.feedCount} feeds.`
  );

  console.log(
    "Club coverage:",
    clubCounts
  );
}

main().catch(error => {
  console.error(
    "Club news update failed:",
    error
  );

  process.exit(1);
});
