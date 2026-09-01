const fs = require('fs');
const path = require('path');

const FEEDS = [
  { division: 1, source: 'Football.co.uk', url: 'https://feeds.feedburner.com/PremierLeagueFootballNews' },
  { division: 2, source: 'Football.co.uk', url: 'https://feeds.feedburner.com/ChampionshipFootballNews' },
  { division: 3, source: 'Football.co.uk', url: 'https://feeds.feedburner.com/LeagueOneFootballNews' },
  { division: 4, source: 'Football.co.uk', url: 'https://feeds.feedburner.com/LeagueTwoFootballNews' },
  { division: 0, source: 'BBC Sport', url: 'https://feeds.bbci.co.uk/sport/football/rss.xml' },
  { division: 0, source: 'The Guardian', url: 'https://www.theguardian.com/football/rss' },
  { division: 0, source: 'Transfermarkt', url: 'https://www.transfermarkt.co.uk/rss/news' },

  { division: 1, source: 'Google News', url: 'https://news.google.com/rss/search?q=Premier%20League%20transfer%20news&hl=en-GB&gl=GB&ceid=GB:en' },
  { division: 2, source: 'Google News', url: 'https://news.google.com/rss/search?q=Championship%20transfer%20news&hl=en-GB&gl=GB&ceid=GB:en' },
  { division: 3, source: 'Google News', url: 'https://news.google.com/rss/search?q=League%20One%20transfer%20news&hl=en-GB&gl=GB&ceid=GB:en' },
  { division: 4, source: 'Google News', url: 'https://news.google.com/rss/search?q=League%20Two%20transfer%20news&hl=en-GB&gl=GB&ceid=GB:en' }
];

const DIVISIONS = {
  1: {
    name: 'Premier League',
    clubs: [
      'Arsenal','Aston Villa','Bournemouth','Brentford',
      'Brighton & Hove Albion','Chelsea','Crystal Palace','Everton',
      'Fulham','Leeds United','Liverpool','Manchester City',
      'Manchester United','Newcastle United','Nottingham Forest',
      'Sunderland','Tottenham Hotspur','West Ham United',
      'Wolverhampton Wanderers','Burnley'
    ]
  },

  2: {
    name: 'Championship',
    clubs: [
      'Birmingham City','Blackburn Rovers','Bristol City',
      'Charlton Athletic','Coventry City','Derby County',
      'Hull City','Ipswich Town','Leicester City','Middlesbrough',
      'Millwall','Norwich City','Oxford United','Portsmouth',
      'Preston North End','Queens Park Rangers','Sheffield United',
      'Sheffield Wednesday','Southampton','Stoke City','Swansea City',
      'Watford','West Bromwich Albion','Wrexham'
    ]
  },

  3: {
    name: 'League One',
    clubs: [
      'AFC Wimbledon','Barnsley','Blackpool','Bolton Wanderers',
      'Bradford City','Burton Albion','Cambridge United',
      'Doncaster Rovers','Exeter City','Huddersfield Town',
      'Leyton Orient','Lincoln City','Luton Town','Mansfield Town',
      'Milton Keynes Dons','Northampton Town','Notts County',
      'Peterborough United','Plymouth Argyle','Reading',
      'Rotherham United','Stevenage','Stockport County',
      'Wigan Athletic','Wycombe Wanderers'
    ]
  },

  4: {
    name: 'League Two',
    clubs: [
      'Accrington Stanley','Barnet','Bristol Rovers',
      'Cambridge United','Cheltenham Town','Chesterfield',
      'Colchester United','Crawley Town','Crewe Alexandra',
      'Fleetwood Town','Gillingham','Grimsby Town',
      'Newport County','Oldham Athletic','Port Vale',
      'Salford City','Shrewsbury Town','Swindon Town',
      'Tranmere Rovers','Walsall','York City'
    ]
  }
};

const TRANSFER_WORDS =
  /transfer|sign|signing|signed|joins|joined|join|deal|loan|loanee|bid|bids|offer|offers|move|moves|moved|exit|exits|leaves|leave|depart|departure|agreed|agreement|target|targets|interest|interested|talks|released|release|contract|free agent/i;

const RUMOUR_WORDS =
  /rumour|rumor|report|reports|reportedly|could|might|set to|eye|eyes|target|targets|interest|interested|talks|bid|bids|offer|offers|linked|wants|want|considering|monitoring|pursue|pursuing/i;

const CONFIRMED_WORDS =
  /signs|sign |signed|joins|joined|join |complete|completed|completes|agreed|agreement reached|official|confirmed|seals|sealed|announced|loaned|released/i;

function decode(s = '') {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#x2F;/gi, '/')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function field(block, tag) {
  const re = new RegExp(
    `<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`,
    'i'
  );

  const m = block.match(re);
  return m ? decode(m[1]) : '';
}

function parseFeed(xml, feed) {
  const blocks =
    xml.match(
      /<(?:item|entry)(?:\s[^>]*)?>[\s\S]*?<\/(?:item|entry)>/gi
    ) || [];

  return blocks
    .map(block => {
      const title = field(block, 'title');

      const link =
        field(block, 'link') ||
        ((block.match(/<link[^>]*href=["']([^"']+)["']/i) || [])[1] ||
          '');

      const date =
        field(block, 'pubDate') ||
        field(block, 'published') ||
        field(block, 'updated');

      const description =
        field(block, 'description') ||
        field(block, 'summary');

      const source =
        field(block, 'source') ||
        feed.source;

      return {
        title,
        link,
        date,
        description,
        source,
        feedDivision: feed.division
      };
    })
    .filter(x => x.title && x.link);
}

function normalise(s) {
  return s
    .toLowerCase()
    .replace(/&amp;/g, '&')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function inferDivision(item) {
  if (item.feedDivision) return item.feedDivision;

  const text = normalise(
    `${item.title} ${item.description}`
  );

  const matches = [];

  for (const [division, data] of Object.entries(DIVISIONS)) {
    for (const club of data.clubs) {
      const c = normalise(club);

      if (c && text.includes(c)) {
        matches.push(Number(division));
      }
    }
  }

  return matches.length ? matches[0] : 0;
}

function statusFor(title) {
  if (CONFIRMED_WORDS.test(title)) {
    return 'Confirmed';
  }

  if (/loan/i.test(title) && !RUMOUR_WORDS.test(title)) {
    return 'Loan';
  }

  return 'Rumour';
}

function dateMs(date) {
  const n = Date.parse(date || '');
  return Number.isFinite(n) ? n : 0;
}

async function fetchFeed(feed) {
  try {
    const response = await fetch(feed.url, {
      headers: {
        'User-Agent':
          'The92Weekly/1.0 (+https://the92weekly.com)',

        'Accept':
          'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8'
      }
    });

    if (!response.ok) {
      throw new Error(
        `${response.status} ${response.statusText}`
      );
    }

    return parseFeed(
      await response.text(),
      feed
    );

  } catch (error) {
    console.warn(
      `Feed failed: ${feed.source} ${feed.url} — ${error.message}`
    );

    return [];
  }
}

(async () => {

  const all =
    (await Promise.all(FEEDS.map(fetchFeed))).flat();

  const seen = new Set();
  const items = [];

  for (const item of all) {

    const key =
      item.link.replace(/[?#].*$/, '') ||
      `${item.source}|${item.title}`;

    if (seen.has(key)) continue;

    seen.add(key);

    if (
      !TRANSFER_WORDS.test(
        `${item.title} ${item.description}`
      )
    ) {
      continue;
    }

    const division = inferDivision(item);

    if (!division) continue;

    items.push({
      id: key,
      division,
      divisionName:
        DIVISIONS[division].name,

      title: item.title,

      description:
        item.description.slice(0, 260),

      link: item.link,

      source: item.source,

      publishedAt:
        item.date || null,

      status:
        statusFor(item.title)
    });
  }

  items.sort(
    (a, b) =>
      dateMs(b.publishedAt) -
      dateMs(a.publishedAt)
  );

  const byDivision = {};

  for (let d = 1; d <= 4; d++) {
    byDivision[d] =
      items
        .filter(x => x.division === d)
        .slice(0, 25);
  }

  const output = {
    updatedAt:
      new Date().toISOString(),

    note:
      'Headlines and links are sourced from live RSS feeds. Full articles remain on their original sites.',

    byDivision
  };

  const outPath =
    path.join(
      __dirname,
      '..',
      'data',
      'transfers.json'
    );

  fs.writeFileSync(
    outPath,
    JSON.stringify(output, null, 2) + '\n'
  );

  console.log(
    `Wrote ${items.length} transfer stories to ${outPath}`
  );

})();
