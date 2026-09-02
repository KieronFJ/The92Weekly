const fs = require('fs');
const path = require('path');

const BASE_FEEDS = [
  ['BBC Sport','https://feeds.bbci.co.uk/sport/football/rss.xml','media'],
  ['Sky Sports','https://www.skysports.com/rss/12040','media'],
  ['The 72','https://the72.co.uk/feed','media'],
  ['Vital Football','https://vitalfootball.co.uk/feed','fan'],
  ['The League Paper','https://www.theleaguepaper.com/feed','media'],
  ['90min','https://www.90min.com/posts.rss','media'],
  ['CaughtOffside','https://www.caughtoffside.com/feed','media'],
  ['Football League World','https://footballleagueworld.co.uk/feed','media'],
  ['Football365','https://www.football365.com/feed','media'],
  ['The Real EFL','https://therealefl.co.uk/feed/','fan']
].map(([name,url,category]) => ({name,url,category}));


// ============================================================
// THE 92 CLUBS
// ============================================================

const CLUB_NAMES = [
  'Arsenal','Aston Villa','Bournemouth','Brentford',
  'Brighton & Hove Albion','Chelsea','Coventry City',
  'Crystal Palace','Everton','Fulham','Hull City',
  'Ipswich Town','Leeds United','Liverpool','Manchester City',
  'Manchester United','Newcastle United','Nottingham Forest',
  'Sunderland','Tottenham Hotspur',

  'Birmingham City','Blackburn Rovers','Bolton Wanderers',
  'Bristol City','Burnley','Cardiff City','Charlton Athletic',
  'Derby County','Lincoln City','Middlesbrough','Millwall',
  'Norwich City','Portsmouth','Preston North End',
  'Queens Park Rangers','Sheffield United','Southampton',
  'Stoke City','Swansea City','Watford',
  'West Bromwich Albion','West Ham United',
  'Wolverhampton Wanderers','Wrexham',

  'AFC Wimbledon','Barnsley','Blackpool','Bradford City',
  'Bromley','Burton Albion','Cambridge United',
  'Doncaster Rovers','Huddersfield Town','Leicester City',
  'Leyton Orient','Luton Town','Mansfield Town',
  'Milton Keynes Dons','Notts County','Oxford United',
  'Peterborough United','Plymouth Argyle','Reading',
  'Sheffield Wednesday','Stevenage','Stockport County',
  'Wigan Athletic','Wycombe Wanderers',

  'Accrington Stanley','Barnet','Bristol Rovers',
  'Cheltenham Town','Chesterfield','Colchester United',
  'Crawley Town','Crewe Alexandra','Exeter City',
  'Fleetwood Town','Gillingham','Grimsby Town',
  'Newport County','Northampton Town','Oldham Athletic',
  'Port Vale','Rochdale','Rotherham United','Salford City',
  'Shrewsbury Town','Swindon Town','Tranmere Rovers',
  'Walsall','York City'
];


// ============================================================
// CLUB ALIASES
// ============================================================

const ALIASES = {

  'Aston Villa': ['aston villa','villa'],

  'Crystal Palace': ['crystal palace','palace'],

  'Hull City': ['hull city','hull'],

  'Manchester City': ['manchester city','man city'],

  'Manchester United': [
    'manchester united',
    'man utd',
    'man united'
  ],

  'Nottingham Forest': [
    'nottingham forest',
    'forest'
  ],

  'Tottenham Hotspur': [
    'tottenham',
    'spurs'
  ],

  'Derby County': [
    'derby county',
    'derby'
  ],

  'Lincoln City': [
    'lincoln city',
    'lincoln'
  ],

  'Middlesbrough': [
    'middlesbrough',
    'boro'
  ],

  'Portsmouth': [
    'portsmouth',
    'pompey'
  ],

  'Preston North End': [
    'preston north end',
    'preston'
  ],

  'Queens Park Rangers': [
    'queens park rangers',
    'qpr'
  ],

  'Sheffield United': [
    'sheffield united',
    'sheff utd',
    'sheff united'
  ],

  'West Bromwich Albion': [
    'west bromwich albion',
    'west brom'
  ],

  'West Ham United': [
    'west ham united',
    'west ham'
  ],

  'Wolverhampton Wanderers': [
    'wolverhampton wanderers',
    'wolverhampton',
    'wolves'
  ],

  'AFC Wimbledon': [
    'afc wimbledon',
    'wimbledon'
  ],

  'Bradford City': [
    'bradford city',
    'bradford'
  ],

  'Burton Albion': [
    'burton albion',
    'burton'
  ],

  'Cambridge United': [
    'cambridge united',
    'cambridge'
  ],

  'Doncaster Rovers': [
    'doncaster rovers',
    'doncaster'
  ],

  'Leyton Orient': [
    'leyton orient'
  ],

  'Luton Town': [
    'luton town',
    'luton'
  ],

  'Milton Keynes Dons': [
    'milton keynes dons',
    'mk dons',
    'milton keynes'
  ],

  'Notts County': [
    'notts county'
  ],

  'Oxford United': [
    'oxford united',
    'oxford'
  ],

  'Peterborough United': [
    'peterborough united',
    'peterborough'
  ],

  'Plymouth Argyle': [
    'plymouth argyle',
    'plymouth'
  ],

  'Sheffield Wednesday': [
    'sheffield wednesday',
    'sheff wed'
  ],

  'Stockport County': [
    'stockport county',
    'stockport'
  ],

  'Wigan Athletic': [
    'wigan athletic',
    'wigan'
  ],

  'Wycombe Wanderers': [
    'wycombe wanderers',
    'wycombe'
  ],

  'Newport County': [
    'newport county',
    'newport'
  ],

  'Northampton Town': [
    'northampton town',
    'northampton'
  ],

  'Oldham Athletic': [
    'oldham athletic',
    'oldham'
  ],

  'Port Vale': [
    'port vale'
  ],

  'Rotherham United': [
    'rotherham united',
    'rotherham'
  ],

  'Salford City': [
    'salford city',
    'salford'
  ],

  'Shrewsbury Town': [
    'shrewsbury town',
    'shrewsbury'
  ],

  'Swindon Town': [
    'swindon town',
    'swindon'
  ],

  'Tranmere Rovers': [
    'tranmere rovers',
    'tranmere'
  ],

  'York City': [
    'york city'
  ]
};


// Give every remaining club its full name as an alias.
for (const club of CLUB_NAMES) {
  if (!ALIASES[club]) {
    ALIASES[club] = [club.toLowerCase()];
  }
}


// ============================================================
// GOOGLE NEWS
// ============================================================

function googleNewsUrl(query) {

  return (
    'https://news.google.com/rss/search?q=' +
    encodeURIComponent(query) +
    '&hl=en-GB&gl=GB&ceid=GB:en'
  );

}


// ============================================================
// CLUB FEEDS
// ============================================================

const CLUB_FEEDS = CLUB_NAMES.flatMap(club => [

  {
    name: `Official – ${club}`,

    url: googleNewsUrl(
      `"${club}" football (official OR "official website" OR "club statement" OR announcement)`
    ),

    clubHint: club,

    category: 'official'
  },

  {
    name: `Fan – ${club}`,

    url: googleNewsUrl(
      `"${club}" football (supporters OR fans OR fanzine OR "fan site" OR "fan blog" OR podcast)`
    ),

    clubHint: club,

    category: 'fan'
  },

  {
    name: `Media – ${club}`,

    url: googleNewsUrl(
      `"${club}" football news`
    ),

    clubHint: club,

    category: 'media'
  }

]);


const FEEDS = [
  ...BASE_FEEDS,
  ...CLUB_FEEDS
];


// ============================================================
// RSS HELPERS
// ============================================================

function stripTags(value = '') {

  return value
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

}


function decodeEntities(value = '') {

  return value
    .replace(/<!\[CDATA\[/g, '')
    .replace(/\]\]>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#x2F;/gi, '/');

}


function getTag(block, name) {

  const match = block.match(
    new RegExp(
      `<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`,
      'i'
    )
  );

  return match
    ? decodeEntities(stripTags(match[1]))
    : '';

}


function safeDate(value) {

  const date = new Date(value || '');

  if (Number.isNaN(date.getTime())) {

    return new Date().toISOString();

  }

  return date.toISOString();

}


// ============================================================
// RSS PARSER
// ============================================================

function parseRSS(xml, fallbackSource) {

  const items = [];

  const blocks =
    xml.match(
      /<item(?:\s[^>]*)?>[\s\S]*?<\/item>/gi
    ) || [];

  for (const block of blocks) {

    const title = getTag(block, 'title');

    const link = getTag(block, 'link');

    if (!title || !link) {
      continue;
    }

    const summary =
      getTag(block, 'description');

    const date =
      getTag(block, 'pubDate') ||
      getTag(block, 'published') ||
      getTag(block, 'updated');

    const source =
      getTag(block, 'source') ||
      fallbackSource;

    items.push({

      title,

      link,

      summary:
        summary.length > 220
          ? summary.slice(0, 217) + '...'
          : summary,

      date: safeDate(date),

      source,

      feedSource: fallbackSource

    });

  }

  return items;

}


// ============================================================
// FEED FETCHING
// ============================================================

const FETCH_TIMEOUT_MS = 8000;


async function fetchFeedOnce(feed) {

  const controller =
    new AbortController();

  const timer =
    setTimeout(
      () => controller.abort(),
      FETCH_TIMEOUT_MS
    );

  try {

    const response =
      await fetch(
        feed.url,
        {
          signal: controller.signal,

          headers: {
            'User-Agent':
              'Mozilla/5.0 (compatible; The92WeeklyBot/2.0; +https://the92weekly.com)',

            'Accept':
              'application/rss+xml, application/xml, text/xml;q=0.9,*/*;q=0.8'
          }
        }
      );

    if (!response.ok) {

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

  } catch (error) {

    const message =
      error &&
      error.name === 'AbortError'

        ? `timeout after ${FETCH_TIMEOUT_MS / 1000}s`

        : (
            error.message ||
            String(error)
          );

    console.log(
      `Skipped ${feed.name}: ${message}`
    );

    return {

      success: false,

      items: [],

      error: message

    };

  } finally {

    clearTimeout(timer);

  }

}


function isTransientError(message) {
  if (!message) return false;
  return (
    message.includes('timeout') ||
    message.includes('503') ||
    message.includes('502') ||
    message.includes('429')
  );
}

async function fetchFeed(feed) {

  const first = await fetchFeedOnce(feed);

  if (first.success || !isTransientError(first.error)) {
    return first;
  }

  // Transient failures (timeouts, 502/503/429) are often just a source
  // being briefly overwhelmed — especially likely across ~280 small,
  // individually-hosted club/fan sites hit in one run. One short-delayed
  // retry recovers a meaningful chunk of these without much extra cost.
  await new Promise(resolve => setTimeout(resolve, 1500));

  console.log(`Retrying ${feed.name}...`);
  return fetchFeedOnce(feed);

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
// SPAM NORMALISATION
// ============================================================

function normaliseSpamText(value = '') {

  return value

    .toLowerCase()

    .normalize('NFKD')

    .replace(
      /[\u0300-\u036f]/g,
      ''
    )

    .replace(
      /[^a-z0-9]+/g,
      ' '
    )

    .replace(
      /\s+/g,
      ' '
    )

    .trim();

}


// ============================================================
// STREAMING / SEO SPAM FILTER
// ============================================================

function isStreamingSpam(item) {

  const title =
    normaliseSpamText(
      item.title
    );

  const summary =
    normaliseSpamText(
      item.summary
    );

  const source =
    normaliseSpamText(
      item.source
    );

  const link =
    (
      item.link ||
      ''
    ).toLowerCase();

  const text =
    `${title} ${summary} ${source}`;


  // ----------------------------------------------------------
  // DEFINITE STREAMING TERMS
  // ----------------------------------------------------------

  const hardPhrases = [

    'live stream',
    'live streams',
    'live streaming',

    'live broadcast',
    'live broadcasts',

    'football streams',
    'soccer streams',

    'stream online',
    'streaming online',

    'free live stream',
    'free live',

    'free broadcast',
    'free broadcasts',

    'football live online',
    'football live free',

    'live online tv',

    'live tv stream',
    'live tv streaming',

    'live sports',

    'watch live online',
    'watch live stream',

    'hd stream',
    'hd streams',

    'live soccer stream'

  ];


  if (
    hardPhrases.some(
      phrase =>
        title.includes(phrase) ||
        text.includes(phrase)
    )
  ) {

    return true;

  }


  // ----------------------------------------------------------
  // "HOW TO WATCH" / SEO STREAMING ARTICLES
  // ----------------------------------------------------------

  if (
    title.includes(
      'how to watch'
    )
  ) {

    return true;

  }


  if (
    title.includes(
      'where to watch'
    )
  ) {

    return true;

  }


  if (
    title.includes('watch') &&
    (
      title.includes('free') ||
      title.includes('live')
    )
  ) {

    return true;

  }


  if (
    title.includes('broadcast') &&
    (
      title.includes('live') ||
      title.includes('free')
    )
  ) {

    return true;

  }


  if (
    title.includes('tv channel') &&
    (
      title.includes('live') ||
      title.includes('football') ||
      title.includes('soccer')
    )
  ) {

    return true;

  }


  // ----------------------------------------------------------
  // KNOWN JUNK SOURCE
  // ----------------------------------------------------------

  const blockedSources = [

    'air and space museum'

  ];


  if (
    blockedSources.some(
      value =>
        source.includes(value)
    )
  ) {

    return true;

  }


  // ----------------------------------------------------------
  // STREAMING-LOOKING URLS
  // ----------------------------------------------------------

  const blockedUrlBits = [

    'livestream',
    'live-stream',
    'watch-live',
    'free-live',
    'streaming',
    'stream-',
    '-stream'

  ];


  if (
    blockedUrlBits.some(
      value =>
        link.includes(value)
    )
  ) {

    return true;

  }


  // ----------------------------------------------------------
  // OBVIOUS SEO GARBAGE
  // ----------------------------------------------------------

  const punctuation =
    (
      item.title || ''
    ).match(
      /[!$+#@]/g
    ) || [];


  if (
    punctuation.length >= 3
  ) {

    return true;

  }


  return false;

}


// ============================================================
// FIND CLUBS
// ============================================================

function findMatchingClubs(text) {

  const lower =
    text.toLowerCase();

  const matches = [];


  for (
    const club of CLUB_NAMES
  ) {

    if (
      ALIASES[club].some(
        alias =>
          lower.includes(alias)
      )
    ) {

      matches.push(club);

    }

  }


  return matches;

}


// ============================================================
// DEDUPLICATION
// ============================================================

function dedupe(items) {

  const seen =
    new Set();

  return items.filter(
    item => {

      const key =
        (
          item.link ||
          item.title ||
          ''
        )
          .toLowerCase()
          .replace(
            /\/$/,
            ''
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
// BALANCE ALL 92 CLUBS
// ============================================================

function balanceForAllClubs(items) {

  const MAX_PER_CLUB = 12;

  const PER_CATEGORY = 4;

  const selected = [];

  const selectedKeys =
    new Set();

  const counts =
    Object.fromEntries(

      CLUB_NAMES.map(
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
        new Date(b.date) - new Date(a.date)
    );


  // ----------------------------------------------------------
  // FIRST: give every club up to 4 from each category
  // ----------------------------------------------------------

  for (
    const club of CLUB_NAMES
  ) {

    for (
      const category of [
        'official',
        'fan',
        'media'
      ]
    ) {

      for (
        const item of sorted
      ) {

        if (
          !item.clubs.includes(
            club
          )
        ) {
          continue;
        }

        if (
          item.category !==
          category
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
          (
            item.link ||
            item.title
          ).toLowerCase();


        if (
          selectedKeys.has(key)
        ) {
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
  // SECOND: fill remaining places with any good news
  // ----------------------------------------------------------

  for (
    const club of CLUB_NAMES
  ) {

    for (
      const item of sorted
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
        selectedKeys.has(key)
      ) {

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


  return {

    items:
      selected.slice(
        0,
        1200
      ),

    counts

  };

}


// ============================================================
// MAIN
// ============================================================

async function main() {

  console.log(
    `Fetching ${FEEDS.length} news feeds with concurrency limit 12 and ${FETCH_TIMEOUT_MS / 1000}s timeout...`
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
      index
    ) => {

      const result =
        results[index];


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
          clubs.length === 0
        ) {

          continue;

        }


        allItems.push({

          ...item,

          clubs,

          category:
            feed.category ||
            'media'

        });

      }

    }
  );


  // ==========================================================
  // REMOVE STREAMING / SEO SPAM
  // ==========================================================

  const before =
    allItems.length;


  const filtered =
    allItems.filter(
      item =>
        !isStreamingSpam(item)
    );


  const removed =
    before -
    filtered.length;


  console.log(
    `Removed ${removed} streaming/spam articles.`
  );


  // ==========================================================
  // DEDUPE
  // ==========================================================

  const deduped =
    dedupe(filtered);


  // ==========================================================
  // BALANCE
  // ==========================================================

  const balanced =
    balanceForAllClubs(
      deduped
    );


  const successfulFeeds =
    Object.values(
      sourceStatus
    ).filter(
      source =>
        source.success
    ).length;


  // ==========================================================
  // SAFETY CHECK
  // ==========================================================
  //
  // If Google News or another upstream service has a major
  // outage, NEVER replace the live data with an empty dataset.
  // ==========================================================

  const minimumSuccessful =
    Math.max(
      10,
      Math.floor(
        FEEDS.length * 0.05
      )
    );


  if (
    successfulFeeds <
    minimumSuccessful
  ) {

    throw new Error(
      `Only ${successfulFeeds}/${FEEDS.length} feeds succeeded. Existing club-news.json was left untouched.`
    );

  }


  // ==========================================================
  // CLUB COUNTS
  // ==========================================================

  const clubCounts =
    Object.fromEntries(

      CLUB_NAMES.map(
        club => [
          club,
          balanced.counts[
            club
          ].total
        ]
      )

    );


  // ==========================================================
  // CATEGORY COUNTS
  // ==========================================================

  const categoryCounts =
    Object.fromEntries(

      CLUB_NAMES.map(
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


  balanced.items.forEach(
    item => {

      item.clubs.forEach(
        club => {

          if (
            !categoryCounts[club]
          ) {

            return;

          }


          const category =
            [
              'official',
              'fan',
              'media'
            ].includes(
              item.category
            )
              ? item.category
              : 'media';


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

    successfulFeeds,

    removedStreamingSpam:
      removed,

    sources:
      sourceStatus,

    clubCounts,

    categoryCounts,

    items:
      balanced.items

  };


  const outPath =
    path.join(
      __dirname,
      '..',
      'data',
      'club-news.json'
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
    `Wrote ${balanced.items.length} balanced club-news items from ${successfulFeeds}/${FEEDS.length} feeds.`
  );


  console.log(
    `Streaming/spam articles removed: ${removed}`
  );

}


// ============================================================
// RUN
// ============================================================

main().catch(
  error => {

    console.error(
      'Club news update failed:',
      error
    );

    process.exit(1);

  }
);
