const fs = require("fs");
const path = require("path");

/*
============================================================
THE92 WEEKLY — CLUB NEWS UPDATER
============================================================

Purpose:
- Fetch football news for all 92 clubs.
- Use official, fan and media discovery.
- Remove obvious streaming / SEO spam.
- Balance the output so clubs get fair coverage.
- Write the final data to data/club-news.json.

No external npm packages required.
============================================================
*/


// ============================================================
// GENERAL NEWS FEEDS
// ============================================================

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


// ============================================================
// THE 92 CLUBS
// ============================================================

const CLUBS = {

  // PREMIER LEAGUE

  "Arsenal": ["arsenal"],

  "Aston Villa": [
    "aston villa",
    "villa"
  ],

  "Bournemouth": ["bournemouth"],

  "Brentford": ["brentford"],

  "Brighton & Hove Albion": [
    "brighton"
  ],

  "Chelsea": ["chelsea"],

  "Coventry City": [
    "coventry"
  ],

  "Crystal Palace": [
    "crystal palace",
    "palace"
  ],

  "Everton": ["everton"],

  "Fulham": ["fulham"],

  "Hull City": [
    "hull city",
    "hull"
  ],

  "Ipswich Town": ["ipswich"],

  "Leeds United": ["leeds"],

  "Liverpool": ["liverpool"],

  "Manchester City": [
    "manchester city",
    "man city"
  ],

  "Manchester United": [
    "manchester united",
    "man utd",
    "man united"
  ],

  "Newcastle United": ["newcastle"],

  "Nottingham Forest": [
    "nottingham forest",
    "forest"
  ],

  "Sunderland": ["sunderland"],

  "Tottenham Hotspur": [
    "tottenham",
    "spurs"
  ],


  // CHAMPIONSHIP

  "Birmingham City": ["birmingham"],

  "Blackburn Rovers": ["blackburn"],

  "Bolton Wanderers": ["bolton"],

  "Bristol City": ["bristol city"],

  "Burnley": ["burnley"],

  "Cardiff City": ["cardiff"],

  "Charlton Athletic": ["charlton"],

  "Derby County": [
    "derby county",
    "derby"
  ],

  "Lincoln City": [
    "lincoln city",
    "lincoln"
  ],

  "Middlesbrough": [
    "middlesbrough",
    "boro"
  ],

  "Millwall": ["millwall"],

  "Norwich City": ["norwich"],

  "Portsmouth": [
    "portsmouth",
    "pompey"
  ],

  "Preston North End": ["preston"],

  "Queens Park Rangers": [
    "queens park rangers",
    "qpr"
  ],

  "Sheffield United": [
    "sheffield united",
    "sheff utd",
    "sheff united"
  ],

  "Southampton": ["southampton"],

  "Stoke City": ["stoke"],

  "Swansea City": ["swansea"],

  "Watford": ["watford"],

  "West Bromwich Albion": [
    "west brom",
    "west bromwich"
  ],

  "West Ham United": ["west ham"],

  "Wolverhampton Wanderers": [
    "wolves",
    "wolverhampton"
  ],

  "Wrexham": ["wrexham"],


  // LEAGUE ONE

  "AFC Wimbledon": [
    "afc wimbledon",
    "wimbledon"
  ],

  "Barnsley": ["barnsley"],

  "Blackpool": ["blackpool"],

  "Bradford City": [
    "bradford city",
    "bradford"
  ],

  "Bromley": ["bromley"],

  "Burton Albion": [
    "burton albion",
    "burton"
  ],

  "Cambridge United": [
    "cambridge united",
    "cambridge"
  ],

  "Doncaster Rovers": ["doncaster"],

  "Huddersfield Town": ["huddersfield"],

  "Leicester City": ["leicester"],

  "Leyton Orient": ["leyton orient"],

  "Luton Town": ["luton"],

  "Mansfield Town": ["mansfield"],

  "Milton Keynes Dons": [
    "mk dons",
    "milton keynes"
  ],

  "Notts County": ["notts county"],

  "Oxford United": [
    "oxford united",
    "oxford"
  ],

  "Peterborough United": ["peterborough"],

  "Plymouth Argyle": ["plymouth"],

  "Reading": ["reading"],

  "Sheffield Wednesday": [
    "sheffield wednesday",
    "sheff wed"
  ],

  "Stevenage": ["stevenage"],

  "Stockport County": ["stockport"],

  "Wigan Athletic": ["wigan"],

  "Wycombe Wanderers": ["wycombe"],


  // LEAGUE TWO

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

  "Newport County": [
    "newport county",
    "newport"
  ],

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


// ============================================================
// GOOGLE NEWS
// ============================================================

function googleNewsUrl(query) {
  return (
    "https://news.google.com/rss/search?q=" +
    encodeURIComponent(query) +
    "&hl=en-GB&gl=GB&ceid=GB:en"
  );
}


// ============================================================
// CLUB-SPECIFIC FEEDS
// ============================================================

const CLUB_SOURCE_FEEDS = Object.keys(CLUBS).flatMap(club => [

  {
    name: `Official – ${club}`,
    url: googleNewsUrl(
      `"${club}" football (official OR "official website" OR "club statement" OR announcement)`
    ),
    clubHint: club,
    category: "official"
  },

  {
    name: `Fan – ${club}`,
    url: googleNewsUrl(
      `"${club}" football (supporters OR fans OR fanzine OR "fan site" OR "fan blog" OR podcast)`
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


const FEEDS = [
  ...BASE_FEEDS,
  ...CLUB_SOURCE_FEEDS
];


// ============================================================
// TEXT HELPERS
// ============================================================

function stripTags(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}


function decodeEntities(value) {
  return String(value || "")
    .replace(/<!\[CDATA\[/gi, "")
    .replace(/\]\]>/gi, "")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&#39;/gi, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#x2F;/gi, "/");
}


function textFromTag(block, tag) {

  const regex = new RegExp(
    `<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`,
    "i"
  );

  const match = block.match(regex);

  if (!match) {
    return "";
  }

  return decodeEntities(
    stripTags(match[1])
  );
}


function safeDate(value) {

  const date = new Date(value || "");

  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString();
  }

  return date.toISOString();
}


// ============================================================
// RSS PARSER
// ============================================================

function parseRSS(xml, sourceName) {

  const items = [];

  const blocks =
    String(xml || "").match(
      /<item(?:\s[^>]*)?>[\s\S]*?<\/item>/gi
    ) || [];

  for (const block of blocks) {

    const title = textFromTag(block, "title");
    const link = textFromTag(block, "link");

    if (!title || !link) {
      continue;
    }

    const description =
      textFromTag(block, "description");

    const date =
      textFromTag(block, "pubDate") ||
      textFromTag(block, "published") ||
      textFromTag(block, "updated");

    const publisher =
      textFromTag(block, "source") ||
      sourceName;

    items.push({
      title,
      link,
      summary:
        description.length > 220
          ? description.slice(0, 217) + "..."
          : description,
      date: safeDate(date),
      source: publisher,
      feedSource: sourceName
    });
  }

  return items;
}


// ============================================================
// CLUB MATCHING
// ============================================================

function findMatchingClubs(text) {

  const lower = String(text || "").toLowerCase();

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


// ============================================================
// FETCH FEED
// ============================================================

async function fetchFeed(feed) {

  try {

    const response = await fetch(
      feed.url,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; The92WeeklyBot/1.0; +https://the92weekly.com)"
        }
      }
    );

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}`
      );
    }

    const xml = await response.text();

    return {
      success: true,
      items: parseRSS(
        xml,
        feed.name
      )
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


// ============================================================
// CONCURRENCY
// ============================================================

async function mapWithConcurrency(
  list,
  limit,
  fn
) {

  const results =
    new Array(list.length);

  let nextIndex = 0;

  async function worker() {

    while (true) {

      const index = nextIndex++;

      if (index >= list.length) {
        return;
      }

      results[index] =
        await fn(
          list[index],
          index
        );
    }
  }

  const workers =
    Array.from(
      {
        length: Math.min(
          limit,
          list.length
        )
      },
      worker
    );

  await Promise.all(workers);

  return results;
}


// ============================================================
// DEDUPLICATION
// ============================================================

function dedupe(items) {

  const seen = new Set();

  return items.filter(item => {

    const key =
      String(
        item.link ||
        item.title ||
        ""
      )
      .toLowerCase()
      .replace(/\/$/, "");

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);

    return true;
  });
}


// ============================================================
// STREAMING / SEO SPAM FILTER
// ============================================================
//
// This is intentionally strong because we do not want The92Weekly
// linking users to dodgy streaming sites.
//
// Legitimate football journalism remains allowed.
// ============================================================

function isStreamingSpam(item) {

  const title =
    String(item.title || "")
      .toLowerCase();

  const summary =
    String(item.summary || "")
      .toLowerCase();

  const source =
    String(item.source || "")
      .toLowerCase();

  const link =
    String(item.link || "")
      .toLowerCase();

  const text =
    `${title} ${summary} ${source} ${link}`;


  // ----------------------------------------------------------
  // DEFINITE STREAMING PHRASES
  // ----------------------------------------------------------

  const streamingPhrases = [

    "live stream",
    "live streams",
    "live streaming",

    "live broadcast",
    "live broadcasts",

    "free broadcast",
    "free broadcasts",

    "football live free",
    "football live online",

    "live online tv",
    "live online",

    "stream online",
    "streaming online",

    "free live stream",
    "free live",

    "hd stream",
    "hd streams",

    "watch live stream",
    "watch live online",

    "live tv stream",
    "live tv streaming",

    "live soccer stream",

    "football streams",
    "soccer streams",

    "free streaming",

    "watch football live",
    "watch the match live",

    "watch match live",

    "online broadcast",
    "online broadcasts"

  ];


  if (
    streamingPhrases.some(
      phrase =>
        text.includes(phrase)
    )
  ) {
    return true;
  }


  // ----------------------------------------------------------
  // SEO / "HOW TO WATCH" JUNK
  // ----------------------------------------------------------

  const seoPatterns = [

    /how\s+to\s+watch/i,

    /where\s+to\s+watch/i,

    /here'?s\s+how\s+to\s+watch/i,

    /here\s+is\s+how\s+to\s+watch/i,

    /watch.*free.*online/i,

    /football.*live.*free/i,

    /football.*live.*online/i,

    /live.*free.*broadcast/i,

    /free.*broadcast.*tv/i

  ];


  if (
    seoPatterns.some(
      pattern =>
        pattern.test(title)
    )
  ) {
    return true;
  }


  // ----------------------------------------------------------
  // KNOWN JUNK / NON-FOOTBALL SOURCES
  // ----------------------------------------------------------

  const blockedSources = [

    "air and space museum",

    "air & space museum"

  ];


  if (
    blockedSources.some(
      blocked =>
        source.includes(blocked)
    )
  ) {
    return true;
  }


  // ----------------------------------------------------------
  // STREAMING URL PATTERNS
  // ----------------------------------------------------------

  const blockedUrlPatterns = [

    "livestream",
    "live-stream",
    "live_stream",

    "watch-live",
    "watch_live",

    "free-live",
    "free_live",

    "freestream",
    "free-stream",

    "stream-live",
    "streamlive",

    "livetv",
    "live-tv",

    "soccer-stream",
    "football-stream"

  ];


  if (
    blockedUrlPatterns.some(
      pattern =>
        link.includes(pattern)
    )
  ) {
    return true;
  }


  // ----------------------------------------------------------
  // EXCESSIVE SPAM PUNCTUATION
  // ----------------------------------------------------------

  const punctuation =
    (
      title.match(
        /[!$+#@]/g
      ) || []
    ).length;


  if (punctuation >= 4) {
    return true;
  }


  // ----------------------------------------------------------
  // OBVIOUS STREAMING TITLE STRUCTURE
  // ----------------------------------------------------------

  const hasLive =
    /\blive\b/i.test(title);

  const hasWatch =
    /\bwatch\b/i.test(title);

  const hasFree =
    /\bfree\b/i.test(title);

  const hasTv =
    /\btv\b/i.test(title);

  const hasStream =
    /\bstream(s|ing)?\b/i.test(title);


  if (
    hasLive &&
    (
      hasStream ||
      (hasWatch && hasFree) ||
      (hasTv && hasFree)
    )
  ) {
    return true;
  }


  return false;
}


// ============================================================
// BALANCE NEWS ACROSS THE 92 CLUBS
// ============================================================

function balanceForAllClubs(items) {

  const PER_CATEGORY = 4;
  const MAX_PER_CLUB = 12;

  const selected = [];
  const selectedKeys = new Set();

  const counts =
    Object.fromEntries(
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


  const sorted =
    [...items].sort(
      (a, b) =>
        new Date(b.date) -
        new Date(a.date)
    );


  // ----------------------------------------------------------
  // FIRST PASS
  // Give every club an opportunity in each category.
  // ----------------------------------------------------------

  for (const club of Object.keys(CLUBS)) {

    for (
      const category of [
        "official",
        "fan",
        "media"
      ]
    ) {

      for (const item of sorted) {

        if (
          !item.clubs.includes(club) ||
          item.category !== category
        ) {
          continue;
        }

        if (
          counts[club][category] >=
          PER_CATEGORY
        ) {
          break;
        }

        const key =
          String(
            item.link ||
            item.title ||
            ""
          )
          .toLowerCase();

        if (selectedKeys.has(key)) {
          continue;
        }

        selected.push(item);
        selectedKeys.add(key);

        counts[club][category]++;
        counts[club].total++;
      }
    }
  }


  // ----------------------------------------------------------
  // SECOND PASS
  // Fill remaining places with other legitimate articles.
  // ----------------------------------------------------------

  for (const club of Object.keys(CLUBS)) {

    for (const item of sorted) {

      if (
        counts[club].total >=
        MAX_PER_CLUB
      ) {
        break;
      }

      if (
        !item.clubs.includes(club)
      ) {
        continue;
      }

      const key =
        String(
          item.link ||
          item.title ||
          ""
        )
        .toLowerCase();

      if (selectedKeys.has(key)) {
        continue;
      }

      selected.push(item);
      selectedKeys.add(key);

      counts[club].total++;
    }
  }


  selected.sort(
    (a, b) =>
      new Date(b.date) -
      new Date(a.date)
  );


  return selected.slice(
    0,
    1200
  );
}


// ============================================================
// MAIN
// ============================================================

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


  FEEDS.forEach(
    (feed, index) => {

      const result =
        results[index];


      sourceStatus[feed.name] = {

        success:
          result.success,

        itemsFound:
          result.items.length,

        error:
          result.error || null

      };


      for (
        const item of result.items
      ) {

        const clubs =
          feed.clubHint
            ? [feed.clubHint]
            : findMatchingClubs(
                `${item.title} ${item.summary}`
              );


        if (
          clubs.length === 0
        ) {
          continue;
        }


        allItems.push({

          ...item,

          clubs,

          category:
            feed.category ||
            "media"

        });
      }
    }
  );


  // ==========================================================
  // REMOVE STREAMING / SEO SPAM
  // ==========================================================

  const beforeFilter =
    allItems.length;


  const filteredItems =
    allItems.filter(
      item =>
        !isStreamingSpam(item)
    );


  const removedSpam =
    beforeFilter -
    filteredItems.length;


  console.log(
    `Removed ${removedSpam} streaming/spam articles.`
  );


  // ==========================================================
  // REMOVE DUPLICATES
  // ==========================================================

  const deduped =
    dedupe(
      filteredItems
    );


  // ==========================================================
  // BALANCE CLUB COVERAGE
  // ==========================================================

  const balanced =
    balanceForAllClubs(
      deduped
    );


  // ==========================================================
  // CLUB COUNTS
  // ==========================================================

  const clubCounts =
    Object.fromEntries(
      Object.keys(CLUBS).map(
        club => [
          club,
          0
        ]
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


  // ==========================================================
  // CATEGORY COUNTS
  // ==========================================================

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

      if (
        !categoryCounts[club]
      ) {
        return;
      }


      const category =
        [
          "official",
          "fan",
          "media"
        ].includes(
          item.category
        )
          ? item.category
          : "media";


      categoryCounts[club][category]++;
      categoryCounts[club].total++;

    });

  });


  // ==========================================================
  // OUTPUT
  // ==========================================================

  const output = {

    updatedAt:
      new Date().toISOString(),

    feedCount:
      FEEDS.length,

    successfulFeeds:
      Object.values(
        sourceStatus
      ).filter(
        source =>
          source.success
      ).length,

    removedStreamingSpam:
      removedSpam,

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
    `Streaming/spam articles removed: ${removedSpam}`
  );


  console.log(
    "Club coverage:",
    clubCounts
  );
}


// ============================================================
// RUN
// ============================================================

main().catch(error => {

  console.error(
    "Club news update failed:",
    error
  );

  process.exit(1);

});
