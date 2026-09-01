const fs = require('fs');
const path = require('path');

// The Ins & Outs updater reuses the same RSS/Google News approach
// as the existing Club News system, but with fewer major sources.
// It is designed to run every 10 minutes in GitHub Actions.

const BASE_FEEDS = [
  ['BBC Sport', 'https://feeds.bbci.co.uk/sport/football/rss.xml'],
  ['Sky Sports', 'https://www.skysports.com/rss/12040'],
  ['The 72', 'https://the72.co.uk/feed'],
  ['Football365', 'https://www.football365.com/feed'],
  ['90min', 'https://www.90min.com/posts.rss'],
  ['Football League World', 'https://footballleagueworld.co.uk/feed']
].map(([name, url]) => ({
  name,
  url,
  divisionHint: 0
}));

const DIVISIONS = {
  1: 'Premier League',
  2: 'Championship',
  3: 'League One',
  4: 'League Two'
};

const CLUBS_BY_DIVISION = {
  1: [
    'Arsenal',
    'Aston Villa',
    'Bournemouth',
    'Brentford',
    'Brighton & Hove Albion',
    'Chelsea',
    'Coventry City',
    'Crystal Palace',
    'Everton',
    'Fulham',
    'Hull City',
    'Ipswich Town',
    'Leeds United',
    'Liverpool',
    'Manchester City',
    'Manchester United',
    'Newcastle United',
    'Nottingham Forest',
    'Sunderland',
    'Tottenham Hotspur'
  ],

  2: [
    'Birmingham City',
    'Blackburn Rovers',
    'Bolton Wanderers',
    'Bristol City',
    'Burnley',
    'Cardiff City',
    'Charlton Athletic',
    'Derby County',
    'Lincoln City',
    'Middlesbrough',
    'Millwall',
    'Norwich City',
    'Portsmouth',
    'Preston North End',
    'Queens Park Rangers',
    'Sheffield United',
    'Southampton',
    'Stoke City',
    'Swansea City',
    'Watford',
    'West Bromwich Albion',
    'West Ham United',
    'Wolverhampton Wanderers',
    'Wrexham'
  ],

  3: [
    'AFC Wimbledon',
    'Barnsley',
    'Blackpool',
    'Bradford City',
    'Bromley',
    'Burton Albion',
    'Cambridge United',
    'Doncaster Rovers',
    'Huddersfield Town',
    'Leicester City',
    'Leyton Orient',
    'Luton Town',
    'Mansfield Town',
    'Milton Keynes Dons',
    'Notts County',
    'Oxford United',
    'Peterborough United',
    'Plymouth Argyle',
    'Reading',
    'Sheffield Wednesday',
    'Stevenage',
    'Stockport County',
    'Wigan Athletic',
    'Wycombe Wanderers'
  ],

  4: [
    'Accrington Stanley',
    'Barnet',
    'Bristol Rovers',
    'Cheltenham Town',
    'Chesterfield',
    'Colchester United',
    'Crawley Town',
    'Crewe Alexandra',
    'Exeter City',
    'Fleetwood Town',
    'Gillingham',
    'Grimsby Town',
    'Newport County',
    'Northampton Town',
    'Oldham Athletic',
    'Port Vale',
    'Rochdale',
    'Rotherham United',
    'Salford City',
    'Shrewsbury Town',
    'Swindon Town',
    'Tranmere Rovers',
    'Walsall',
    'York City'
  ]
};

const ALIASES = {};

function addAliases(club, aliases) {
  ALIASES[club] = aliases;
}

for (const clubs of Object.values(CLUBS_BY_DIVISION)) {
  for (const club of clubs) {
    addAliases(club, [club.toLowerCase()]);
  }
}

addAliases('Aston Villa', ['aston villa', 'villa']);
addAliases('Crystal Palace', ['crystal palace', 'palace']);
addAliases('Hull City', ['hull city', 'hull']);
addAliases('Manchester City', ['manchester city', 'man city']);
addAliases('Manchester United', [
  'manchester united',
  'man utd',
  'man united'
]);
addAliases('Nottingham Forest', ['nottingham forest', 'forest']);
addAliases('Tottenham Hotspur', ['tottenham', 'spurs']);

addAliases('Derby County', ['derby county', 'derby']);
addAliases('Lincoln City', ['lincoln city', 'lincoln']);
addAliases('Middlesbrough', ['middlesbrough', 'boro']);
addAliases('Portsmouth', ['portsmouth', 'pompey']);
addAliases('Preston North End', ['preston north end', 'preston']);
addAliases('Queens Park Rangers', [
  'queens park rangers',
  'qpr'
]);
addAliases('Sheffield United', [
  'sheffield united',
  'sheff utd',
  'sheff united'
]);
addAliases('West Bromwich Albion', [
  'west bromwich albion',
  'west brom'
]);
addAliases('West Ham United', ['west ham united', 'west ham']);
addAliases('Wolverhampton Wanderers', [
  'wolverhampton wanderers',
  'wolverhampton',
  'wolves'
]);

addAliases('AFC Wimbledon', ['afc wimbledon', 'wimbledon']);
addAliases('Bradford City', ['bradford city', 'bradford']);
addAliases('Burton Albion', ['burton albion', 'burton']);
addAliases('Cambridge United', ['cambridge united', 'cambridge']);
addAliases('Doncaster Rovers', ['doncaster rovers', 'doncaster']);
addAliases('Luton Town', ['luton town', 'luton']);
addAliases('Milton Keynes Dons', [
  'milton keynes dons',
  'mk dons',
  'milton keynes'
]);
addAliases('Notts County', ['notts county']);
addAliases('Oxford United', ['oxford united', 'oxford']);
addAliases('Peterborough United', [
  'peterborough united',
  'peterborough'
]);
addAliases('Plymouth Argyle', ['plymouth argyle', 'plymouth']);
addAliases('Sheffield Wednesday', [
  'sheffield wednesday',
  'sheff wed'
]);
addAliases('Stockport County', ['stockport county', 'stockport']);
addAliases('Wigan Athletic', ['wigan athletic', 'wigan']);
addAliases('Wycombe Wanderers', [
  'wycombe wanderers',
  'wycombe'
]);

addAliases('Newport County', ['newport county', 'newport']);
addAliases('Northampton Town', [
  'northampton town',
  'northampton'
]);
addAliases('Oldham Athletic', ['oldham athletic', 'oldham']);
addAliases('Port Vale', ['port vale']);
addAliases('Rotherham United', [
  'rotherham united',
  'rotherham'
]);
addAliases('Salford City', ['salford city', 'salford']);
addAliases('Shrewsbury Town', [
  'shrewsbury town',
  'shrewsbury'
]);
addAliases('Swindon Town', ['swindon town', 'swindon']);
addAliases('Tranmere Rovers', [
  'tranmere rovers',
  'tranmere'
]);
addAliases('York City', ['york city']);

const DIVISION_SEARCHES = [
  {
    division: 1,
    query:
      'Premier League transfer OR signing OR signs OR loan OR "joins" OR "deal agreed" OR "transfer news"'
  },
  {
    division: 2,
    query:
      'Championship transfer OR signing OR signs OR loan OR "joins" OR "deal agreed" OR "transfer news"'
  },
  {
    division: 3,
    query:
      'League One transfer OR signing OR signs OR loan OR "joins" OR "deal agreed" OR "transfer news"'
  },
  {
    division: 4,
    query:
      'League Two transfer OR signing OR signs OR loan OR "joins" OR "deal agreed" OR "transfer news"'
  }
];

function googleNewsUrl(query) {
  return (
    'https://news.google.com/rss/search?q=' +
    encodeURIComponent(query) +
    '&hl=en-GB&gl=GB&ceid=GB:en'
  );
}

const FEEDS = [
  ...BASE_FEEDS,

  ...DIVISION_SEARCHES.map(item => ({
    name: `Google News – ${DIVISIONS[item.division]}`,
    url: googleNewsUrl(item.query),
    divisionHint: item.division
  }))
];

const TRANSFER_WORDS =
  /transfer|sign|signing|signed|signs|joins|joined|join|deal|loan|loanee|bid|bids|offer|offers|move|moves|moved|exit|exits|leaves|leave|depart|departure|agreed|agreement|target|targets|interest|interested|talks|released|release|contract|free agent/i;

const RUMOUR_WORDS =
  /rumour|rumor|report|reports|reportedly|could|might|set to|eye|eyes|target|targets|interest|interested|talks|bid|bids|offer|offers|linked|wants|want|considering|monitoring|pursue|pursuing/i;

const CONFIRMED_WORDS =
  /signed|signs|joins|joined|completed|completes|agreed|agreement reached|official|confirmed|seals|sealed|announced|released/i;

function stripTags(value = '') {
  return value
    .replace(/<[^>]*>/g, ' ')
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

  return Number.isNaN(date.getTime())
    ? new Date().toISOString()
    : date.toISOString();
}

function parseRSS(xml, fallbackSource) {
  const items = [];

  const blocks =
    xml.match(
      /<item(?:\s[^>]*)?>[\s\S]*?<\/item>/gi
    ) || [];

  for (const block of blocks) {
    const title = getTag(block, 'title');
    const link = getTag(block, 'link');

    if (!title || !link) continue;

    const summary = getTag(block, 'description');

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
        summary.length > 260
          ? summary.slice(0, 257) + '...'
          : summary,
      date: safeDate(date),
      source,
      feedSource: fallbackSource
    });
  }

  return items;
}

const FETCH_TIMEOUT_MS = 8000;

async function fetchFeedOnce(feed) {
  const controller = new AbortController();

  const timer = setTimeout(
    () => controller.abort(),
    FETCH_TIMEOUT_MS
  );

  try {
    const response = await fetch(feed.url, {
      signal: controller.signal,

      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; The92WeeklyBot/3.0; +https://the92weekly.com)',

        Accept:
          'application/rss+xml, application/xml, text/xml;q=0.9,*/*;q=0.8'
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
    const message =
      error && error.name === 'AbortError'
        ? `timeout after ${FETCH_TIMEOUT_MS / 1000}s`
        : error.message || String(error);

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
  return (
    !!message &&
    /timeout|503|502|429/.test(message)
  );
}

async function fetchFeed(feed) {
  const first = await fetchFeedOnce(feed);

  if (
    first.success ||
    !isTransientError(first.error)
  ) {
    return first;
  }

  await new Promise(resolve =>
    setTimeout(resolve, 1500)
  );

  console.log(`Retrying ${feed.name}...`);

  return fetchFeedOnce(feed);
}

async function mapWithConcurrency(
  list,
  limit,
  fn
) {
  const results = new Array(list.length);

  let next = 0;

  async function worker() {
    while (true) {
      const index = next++;

      if (index >= list.length) {
        return;
      }

      results[index] =
        await fn(list[index]);
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

function findMatchingClubs(text) {
  const lower = text.toLowerCase();
  const matches = [];

  for (const [club, aliases] of Object.entries(
    ALIASES
  )) {
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

function divisionForClubs(clubs) {
  const divisions = [];

  for (const [division, names] of Object.entries(
    CLUBS_BY_DIVISION
  )) {
    if (
      clubs.some(club =>
        names.includes(club)
      )
    ) {
      divisions.push(Number(division));
    }
  }

  return divisions;
}

function classifyStatus(title) {
  const lower = title.toLowerCase();

  if (
    /loan|loaned|loan move|season-long loan/.test(
      lower
    ) &&
    !RUMOUR_WORDS.test(lower)
  ) {
    return 'Loan';
  }

  if (
    CONFIRMED_WORDS.test(title) &&
    !RUMOUR_WORDS.test(title)
  ) {
    return 'Confirmed';
  }

  return 'Rumour';
}

function isUsefulTransferStory(item) {
  const text =
    `${item.title} ${item.summary}`.toLowerCase();

  if (!TRANSFER_WORDS.test(text)) {
    return false;
  }

  const junk = [
    'how to watch',
    'where to watch',
    'live stream',
    'live-stream',
    'tv channel',
    'kick-off time',
    'kickoff time',
    'broadcast',
    'fantasy football',
    'betting tips'
  ];

  if (
    junk.some(x =>
      text.includes(x)
    )
  ) {
    return false;
  }

  return true;
}

function canonicalKey(item) {
  return (
    (item.link || '').replace(/[?#].*$/, '') ||
    `${item.source}|${item.title}`.toLowerCase()
  );
}

function dedupe(items) {
  const seen = new Set();
  const output = [];

  for (const item of items) {
    const key = canonicalKey(item);

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    output.push(item);
  }

  return output;
}

function loadExisting(outPath) {
  try {
    return JSON.parse(
      fs.readFileSync(outPath, 'utf8')
    );
  } catch {
    return null;
  }
}

async function main() {
  console.log(
    `Fetching ${FEEDS.length} major news/search feeds...`
  );

  const results =
    await mapWithConcurrency(
      FEEDS,
      8,
      fetchFeed
    );

  const successfulFeeds =
    results.filter(
      result => result.success
    ).length;

  const candidates = [];

  results.forEach(
    (result, index) => {
      const feed = FEEDS[index];

      if (!result.success) {
        return;
      }

      for (const item of result.items) {
        if (
          !isUsefulTransferStory(item)
        ) {
          continue;
        }

        const text =
          `${item.title} ${item.summary}`;

        const clubs =
          findMatchingClubs(text);

        let divisions =
          divisionForClubs(clubs);

        if (
          !divisions.length &&
          feed.divisionHint
        ) {
          divisions = [
            feed.divisionHint
          ];
        }

        if (!divisions.length) {
          continue;
        }

        for (const division of divisions) {
          candidates.push({
            id:
              `${canonicalKey(item)}|${division}`,

            division,

            divisionName:
              DIVISIONS[division],

            clubs,

            title: item.title,

            summary: item.summary,

            link: item.link,

            source:
              item.source ||
              feed.name,

            publishedAt:
              item.date,

            status:
              classifyStatus(
                item.title
              )
          });
        }
      }
    }
  );

  const deduped =
    dedupe(candidates).sort(
      (a, b) =>
        new Date(b.publishedAt) -
        new Date(a.publishedAt)
    );

  const byDivision = {};

  for (const division of [
    1,
    2,
    3,
    4
  ]) {
    byDivision[division] =
      deduped
        .filter(
          item =>
            item.division ===
            division
        )
        .slice(0, 30);
  }

  const totalStories =
    Object.values(byDivision).reduce(
      (total, stories) =>
        total + stories.length,
      0
    );

  const outPath =
    path.join(
      __dirname,
      '..',
      'data',
      'transfers.json'
    );

  const existing =
    loadExisting(outPath);

  // Never wipe existing data because of
  // a temporary source outage.
  if (
    successfulFeeds < 2 ||
    totalStories === 0
  ) {
    console.log(
      `Only ${successfulFeeds}/${FEEDS.length} feeds succeeded or no transfer stories were found. Existing data left untouched.`
    );

    return;
  }

  const output = {
    updatedAt:
      new Date().toISOString(),

    sourceCount:
      successfulFeeds,

    feedCount:
      FEEDS.length,

    byDivision
  };

  // Preserve previous division data if
  // that division temporarily returns nothing.
  if (
    existing &&
    existing.byDivision
  ) {
    for (const division of [
      1,
      2,
      3,
      4
    ]) {
      if (
        !output.byDivision[
          division
        ].length &&
        Array.isArray(
          existing.byDivision[
            division
          ]
        )
      ) {
        output.byDivision[
          division
        ] =
          existing.byDivision[
            division
          ];
      }
    }
  }

  fs.writeFileSync(
    outPath,
    JSON.stringify(
      output,
      null,
      2
    ) + '\n'
  );

  console.log(
    `Wrote ${totalStories} transfer stories from ${successfulFeeds}/${FEEDS.length} feeds.`
  );
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
