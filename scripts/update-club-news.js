const fs = require("fs");
const path = require("path");

// ============================================================
// THE92 WEEKLY - CLUB NEWS UPDATER
// ============================================================
//
// Every club gets its own news discovery:
//
//   1. OFFICIAL - official club announcements and club coverage
//   2. FAN      - supporter/fan publications, blogs, fanzines,
//                 podcasts and established supporter sources
//   3. MEDIA    - local, regional and national football media
//
// The system gives every club an equal opportunity to receive news.
//
// It also removes obvious live-streaming / SEO spam before articles
// are published to the site.
//
// ============================================================


// ============================================================
// GENERAL RSS FEEDS
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

  // ==========================================================
  // PREMIER LEAGUE
  // ==========================================================

  "Arsenal": [
    "arsenal"
  ],

  "Aston Villa": [
    "aston villa",
    "villa"
  ],

  "Bournemouth": [
    "bournemouth"
  ],

  "Brentford": [
    "brentford"
  ],

  "Brighton & Hove Albion": [
    "brighton"
  ],

  "Chelsea": [
    "chelsea"
  ],

  "Coventry City": [
    "coventry"
  ],

  "Crystal Palace": [
    "crystal palace",
    "palace"
  ],

  "Everton": [
    "everton"
  ],

  "Fulham": [
    "fulham"
  ],

  "Hull City": [
    "hull city",
    "hull"
  ],

  "Ipswich Town": [
    "ipswich"
  ],

  "Leeds United": [
    "leeds"
  ],

  "Liverpool": [
    "liverpool"
  ],

  "Manchester City": [
    "manchester city",
    "man city"
  ],

  "Manchester United": [
    "manchester united",
    "man utd",
    "man united"
  ],

  "Newcastle United": [
    "newcastle"
  ],

  "Nottingham Forest": [
    "nottingham forest",
    "forest"
  ],

  "Sunderland": [
    "sunderland"
  ],

  "Tottenham Hotspur": [
    "tottenham",
    "spurs"
  ],


  // ==========================================================
  // CHAMPIONSHIP
  // ==========================================================

  "Birmingham City": [
    "birmingham"
  ],

  "Blackburn Rovers": [
    "blackburn"
  ],

  "Bolton Wanderers": [
    "bolton"
  ],

  "Bristol City": [
    "bristol city"
  ],

  "Burnley": [
    "burnley"
  ],

  "Cardiff City": [
    "cardiff"
  ],

  "Charlton Athletic": [
    "charlton"
  ],

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

  "Millwall": [
    "millwall"
  ],

  "Norwich City": [
    "norwich"
  ],

  "Portsmouth": [
    "portsmouth",
    "pompey"
  ],

  "Preston North End": [
    "preston"
  ],

  "Queens Park Rangers": [
    "queens park rangers",
    "qpr"
  ],

  "Sheffield United": [
    "sheffield united",
    "sheff utd",
    "sheff united"
  ],

  "Southampton": [
    "southampton"
  ],

  "Stoke City": [
    "stoke"
  ],

  "Swansea City": [
    "swansea"
  ],

  "Watford": [
    "watford"
  ],

  "West Bromwich Albion": [
    "west brom",
    "west bromwich"
  ],

  "West Ham United": [
    "west ham"
  ],

  "Wolverhampton Wanderers": [
    "wolves",
    "wolverhampton"
  ],

  "Wrexham": [
    "wrexham"
  ],


  // ==========================================================
  // LEAGUE ONE
  // ==========================================================

  "AFC Wimbledon": [
    "afc wimbledon",
    "wimbledon"
  ],

  "Barnsley": [
    "barnsley"
  ],

  "Blackpool": [
    "blackpool"
  ],

  "Bradford City": [
    "bradford city",
    "bradford"
  ],

  "Bromley": [
    "bromley"
  ],

  "Burton Albion": [
    "burton albion",
    "burton"
  ],

  "Cambridge United": [
    "cambridge united",
    "cambridge"
  ],

  "Doncaster Rovers": [
    "doncaster"
  ],

  "Huddersfield Town": [
    "huddersfield"
  ],

  "Leicester City": [
    "leicester"
  ],

  "Leyton Orient": [
    "leyton orient"
  ],

  "Luton Town": [
    "luton"
  ],

  "Mansfield Town": [
    "mansfield"
  ],

  "Milton Keynes Dons": [
    "mk dons",
    "milton keynes"
  ],

  "Notts County": [
    "notts county"
  ],

  "Oxford United": [
    "oxford united",
    "oxford"
  ],

  "Peterborough United": [
    "peterborough"
  ],

  "Plymouth Argyle": [
    "plymouth"
  ],

  "Reading": [
    "reading"
  ],

  "Sheffield Wednesday": [
    "sheffield wednesday",
    "sheff wed"
  ],

  "Stevenage": [
    "stevenage"
  ],

  "Stockport County": [
    "stockport"
  ],

  "Wigan Athletic": [
    "wigan"
  ],

  "Wycombe Wanderers": [
    "wycombe"
  ],


  // ==========================================================
  // LEAGUE TWO
  // ==========================================================

  "Accrington Stanley": [
    "accrington"
  ],

  "Barnet": [
    "barnet"
  ],

  "Bristol Rovers": [
    "bristol rovers"
  ],

  "Cheltenham Town": [
    "cheltenham"
  ],

  "Chesterfield": [
    "chesterfield"
  ],

  "Colchester United": [
    "colchester"
  ],

  "Crawley Town": [
    "crawley"
  ],

  "Crewe Alexandra": [
    "crewe"
  ],

  "Exeter City": [
    "exeter"
  ],

  "Fleetwood Town": [
    "fleetwood"
  ],

  "Gillingham": [
    "gillingham"
  ],

  "Grimsby Town": [
    "grimsby"
  ],

  "Newport County": [
    "newport county",
    "newport"
  ],

  "Northampton Town": [
    "northampton"
  ],

  "Oldham Athletic": [
    "oldham"
  ],

  "Port Vale": [
    "port vale"
  ],

  "Rochdale": [
    "rochdale"
  ],

  "Rotherham United": [
    "rotherham"
  ],

  "Salford City": [
    "salford"
  ],

  "Shrewsbury Town": [
    "shrewsbury"
  ],

  "Swindon Town": [
    "swindon"
  ],

  "Tranmere Rovers": [
    "tranmere"
  ],

  "Walsall": [
    "walsall"
  ],

  "York City": [
    "york city"
  ]

};


// ============================================================
// GOOGLE NEWS DISCOVERY
// ============================================================

function googleNewsUrl(query) {

  return (
    "https://news.google.com/rss/search?q=" +
    encodeURIComponent(query) +
    "&hl=en-GB&gl=GB&ceid=GB:en"
  );

}


// ============================================================
// CREATE THREE SEARCHES FOR EVERY CLUB
// ============================================================

const CLUB_SOURCE_FEEDS =
  Object.keys(CLUBS).flatMap(club => [

    // --------------------------------------------------------
    // OFFICIAL
    // --------------------------------------------------------

    {
      name: `Official – ${club}`,

      url: googleNewsUrl(
        `"${club}" football (official OR "official website" OR "official site" OR "club statement" OR announcement)`
      ),

      clubHint: club,

      category: "official"
    },


    // --------------------------------------------------------
    // FAN
    // --------------------------------------------------------

    {
      name: `Fan – ${club}`,

      url: googleNewsUrl(
        `"${club}" football (supporters OR supporters' OR fans OR fanzine OR "fan site" OR "fan blog" OR podcast)`
      ),

      clubHint: club,

      category: "fan"
    },


    // --------------------------------------------------------
    // MEDIA
    // --------------------------------------------------------

    {
      name: `Media – ${club}`,

      url: googleNewsUrl(
        `"${club}" football news`
      ),

      clubHint: club,

      category: "media"
    }

  ]);


// Combine the general feeds and the club-specific feeds.

const FEEDS = [
  ...BASE_FEEDS,
  ...CLUB_SOURCE_FEEDS
];


// ============================================================
// XML / RSS HELPERS
// ============================================================

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

  const re =
    new RegExp(
      `<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`,
      "i"
    );

  const match =
    block.match(re);

  return match
    ? decodeEntities(
        stripTags(match[1])
      )
    : "";

}


function safeDate(value) {

  const parsed =
    new Date(value || "");

  if (
    isNaN(
      parsed.getTime()
    )
  ) {

    return new Date()
      .toISOString();

  }

  return parsed.toISOString();

}


// ============================================================
// RSS PARSER
// ============================================================

function parseRSS(
  xml,
  fallbackSource
) {

  const items = [];

  const blocks =
    xml.match(
      /<item(?:\s[^>]*)?>[\s\S]*?<\/item>/gi
    ) || [];

  for (
    const block of blocks
  ) {

    const title =
      textFromTag(
        block,
        "title"
      );

    const link =
      textFromTag(
        block,
        "link"
      );

    if (
      !title ||
      !link
    ) {
      continue;
    }

    const description =
      textFromTag(
        block,
        "description"
      );

    const date =
      textFromTag(
        block,
        "pubDate"
      ) ||
      textFromTag(
        block,
        "published"
      ) ||
      textFromTag(
        block,
        "updated"
      );

    const publisher =
      textFromTag(
        block,
        "source"
      ) ||
      fallbackSource;

    items.push({

      title,

      link,

      summary:
        description.length > 220
          ? description.slice(0, 217) + "..."
          : description,

      date:
        safeDate(date),

      source:
        publisher,

      feedSource:
        fallbackSource

    });

  }

  return items;

}


// ============================================================
// FIND CLUBS
// ============================================================

function findMatchingClubs(
  text
) {

  const lower =
    text.toLowerCase();

  const matches = [];

  for (
    const [
      club,
      aliases
    ] of Object.entries(CLUBS)
  ) {

    if (
      aliases.some(
        alias =>
          lower.includes(
            alias
          )
      )
    ) {

      matches.push(
        club
      );

    }

  }

  return matches;

}


// ============================================================
// FETCH FEED
// ============================================================

async function fetchFeed(
  feed
) {

  try {

    const response =
      await fetch(
        feed.url,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (compatible; The92WeeklyBot/1.0; +https://the92weekly.com)"
          }
        }
      );

    if (
      !response.ok
    ) {

      throw new Error(
        `HTTP ${response.status}`
      );

    }

    const xml =
      await response.text();

    return {

      success: true,

      items:
        parseRSS(
          xml,
          feed.name
        )

    };

  } catch (
    error
  ) {

    console.error(
      `Failed to fetch ${feed.name}: ${error.message}`
    );

    return {

      success: false,

      items: [],

      error:
        error.message

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
    new Array(
      list.length
    );

  let next = 0;


  async function worker() {

    while (true) {

      const index =
        next++;

      if (
        index >=
        list.length
      ) {

        return;

      }

      results[index] =
        await fn(
          list[index],
          index
        );

    }

  }


  await Promise.all(

    Array.from(
      {
        length:
          Math.min(
            limit,
            list.length
          )
      },
      worker
    )

  );


  return results;

}


// ============================================================
// DEDUPLICATION
// ============================================================

function dedupe(
  items
) {

  const seen =
    new Set();

  return items.filter(
    item => {

      const key =
        (
          item.link ||
          item.title
        )
          .toLowerCase()
          .replace(
            /\/$/,
            ""
          );

      if (
        seen.has(key)
      ) {

        return false;

      }

      seen.add(key);

      return true;

    }
  );

}


// ============================================================
// STREAMING / SPAM FILTER
// ============================================================
//
// IMPORTANT:
//
// This filter is deliberately BALANCED.
//
// We are NOT trying to eliminate every small website.
//
// We ARE trying to eliminate the obvious junk such as:
//
//   "Football Live Streams"
//   "Live Broadcast HD"
//   "Watch Live Free"
//   "Live Online TV"
//   "Free Broadcast"
//   "Air and Space Museum"
//
// ============================================================

function isStreamingSpam(
  item
) {

  const title =
    (
      item.title ||
      ""
    ).toLowerCase();

  const summary =
    (
      item.summary ||
      ""
    ).toLowerCase();

  const source =
    (
      item.source ||
      ""
    ).toLowerCase();

  const link =
    (
      item.link ||
      ""
    ).toLowerCase();


  const text =
    `${title} ${summary} ${source} ${link}`;


  // ----------------------------------------------------------
  // VERY STRONG STREAMING PHRASES
  // ----------------------------------------------------------

  const streamingPatterns = [

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

    "soccer streams"

  ];


  if (
    streamingPatterns.some(
      pattern =>
        text.includes(
          pattern
        )
    )
  ) {

    return true;

  }


  // ----------------------------------------------------------
  // OBVIOUS STREAMING / SEO TITLES
  // ----------------------------------------------------------

  const spamTitlePatterns = [

    "how to watch",

    "where to watch",

    "live broadcast hd",

    "live broadcasthd",

    "here's how to watch",

    "here is how to watch",

    "free broadcast on tv",

    "watch.*free",

    "football.*live.*free"

  ];


  if (
    spamTitlePatterns.some(
      pattern => {

        try {

          return new RegExp(
            pattern,
            "i"
          ).test(
            title
          );

        } catch {

          return title.includes(
            pattern
          );

        }

      }
    )
  ) {

    return true;

  }


  // ----------------------------------------------------------
  // OBVIOUS NON-FOOTBALL / SPAM PUBLISHERS
  // ----------------------------------------------------------

  const blockedSources = [

    "air and space museum"

  ];


  if (
    blockedSources.some(
      blocked =>
        source.includes(
          blocked
        )
    )
  ) {

    return true;

  }


  // ----------------------------------------------------------
  // OBVIOUS STREAMING URLS
  // ----------------------------------------------------------

  const blockedUrlPatterns = [

    "livestream",

    "live-stream",

    "watch-live",

    "free-live"

  ];


  if (
    blockedUrlPatterns.some(
      pattern =>
        link.includes(
          pattern
        )
    )
  ) {

    return true;

  }


  // ----------------------------------------------------------
  // RIDICULOUS SPAM PUNCTUATION
  //
  // We don't reject normal punctuation.
  // We only reject titles with an unusually high amount.
  // ----------------------------------------------------------

  const punctuationCount =
    (
      title.match(
        /[!$+#@]/
      ) || []
    ).length;


  if (
    punctuationCount >= 4
  ) {

    return true;

  }


  return false;

}


// ============================================================
// BALANCE ALL 92 CLUBS
// ============================================================

function balanceForAllClubs(
  items
) {

  const PER_CATEGORY =
    4;

  const MAX_PER_CLUB =
    PER_CATEGORY * 3;


  const selected = [];

  const selectedKeys =
    new Set();


  const counts =
    Object.fromEntries(

      Object.keys(
        CLUBS
      ).map(
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


  const sorted =
    [...items].sort(

      (a, b) =>
        new Date(b.date) -
        new Date(a.date)

    );


  // ----------------------------------------------------------
  // PASS 1
  //
  // Give every club the same opportunity in every category.
  // ----------------------------------------------------------

  for (
    const club of
    Object.keys(CLUBS)
  ) {

    for (
      const category of [
        "official",
        "fan",
        "media"
      ]
    ) {

      for (
        const item of
        sorted
      ) {

        if (
          !item.clubs.includes(
            club
          ) ||
          item.category !==
            category
        ) {

          continue;

        }


        const key =
          (
            item.link ||
            item.title
          ).toLowerCase();


        if (
          selectedKeys.has(
            key
          )
        ) {

          continue;

        }


        if (
          counts[club][
            category
          ] >=
          PER_CATEGORY
        ) {

          break;

        }


        selected.push(
          item
        );

        selectedKeys.add(
          key
        );


        counts[club][
          category
        ]++;

        counts[club].total++;

      }

    }

  }


  // ----------------------------------------------------------
  // PASS 2
  //
  // If a category doesn't have enough material, fill the
  // remaining places with other legitimate articles.
  // ----------------------------------------------------------

  for (
    const club of
    Object.keys(CLUBS)
  ) {

    for (
      const item of
      sorted
    ) {

      if (
        counts[club].total >=
        MAX_PER_CLUB
      ) {

        break;

      }


      if (
        !item.clubs.includes(
          club
        )
      ) {

        continue;

      }


      const key =
        (
          item.link ||
          item.title
        ).toLowerCase();


      if (
        selectedKeys.has(
          key
        )
      ) {

        continue;

      }


      selected.push(
        item
      );

      selectedKeys.add(
        key
      );

      counts[club].total++;

    }

  }


  // ----------------------------------------------------------
  // Maximum output
  // ----------------------------------------------------------

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
    (
      feed,
      i
    ) => {

      const result =
        results[i];


      sourceStatus[
        feed.name
      ] = {

        success:
          result.success,

        itemsFound:
          result.items.length,

        error:
          result.error ||
          null

      };


      for (
        const item of
        result.items
      ) {

        const clubs =
          feed.clubHint
            ? [
                feed.clubHint
              ]
            : findMatchingClubs(
                `${item.title} ${item.summary}`
              );


        if (
          clubs.length ===
          0
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

  const beforeSpamFilter =
    allItems.length;


  const filteredItems =
    allItems.filter(
      item =>
        !isStreamingSpam(
          item
        )
    );


  const removedSpam =
    beforeSpamFilter -
    filteredItems.length;


  console.log(
    `Removed ${removedSpam} obvious streaming/spam articles.`
  );


  // ==========================================================
  // DEDUPE
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
  // CLUB COVERAGE COUNTS
  // ==========================================================

  const clubCounts =
    Object.fromEntries(

      Object.keys(
        CLUBS
      ).map(
        club => [
          club,
          0
        ]
      )

    );


  balanced.forEach(
    item => {

      item.clubs.forEach(
        club => {

          if (
            clubCounts[
              club
            ] !==
            undefined
          ) {

            clubCounts[
              club
            ]++;

          }

        }
      );

    }
  );


  // ==========================================================
  // CATEGORY COUNTS
  // ==========================================================

  const categoryCounts =
    Object.fromEntries(

      Object.keys(
        CLUBS
      ).map(
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


  balanced.forEach(
    item => {

      item.clubs.forEach(
        club => {

          if (
            !categoryCounts[
              club
            ]
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


          categoryCounts[
            club
          ][
            category
          ]++;


          categoryCounts[
            club
          ].total++;

        }
      );

    }
  );


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
        s => s.success
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

main().catch(
  error => {

    console.error(
      "Club news update failed:",
      error
    );

    process.exit(1);

  }
);
