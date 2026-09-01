const fs = require('fs');
const path = require('path');

const FEEDS = [
  ['BBC Sport', 'https://feeds.bbci.co.uk/sport/football/rss.xml'],
  ['Sky Sports', 'https://www.skysports.com/rss/12040'],
  ['The 72', 'https://the72.co.uk/feed'],
  ['Football365', 'https://www.football365.com/feed'],
  ['90min', 'https://www.90min.com/posts.rss'],
  ['Football League World', 'https://footballleagueworld.co.uk/feed']
];

const DIVISIONS = {
  1: 'Premier League',
  2: 'Championship',
  3: 'League One',
  4: 'League Two'
};

const CLUBS = {
  1: [
    'Arsenal','Aston Villa','Bournemouth','Brentford',
    'Brighton','Chelsea','Crystal Palace','Everton',
    'Fulham','Leeds United','Liverpool','Manchester City',
    'Manchester United','Newcastle United','Nottingham Forest',
    'Sunderland','Tottenham','West Ham','Wolves'
  ],
  2: [
    'Birmingham','Blackburn','Bolton','Bristol City',
    'Burnley','Cardiff','Charlton','Coventry','Derby',
    'Hull','Leicester','Middlesbrough','Millwall','Norwich',
    'Oxford','Portsmouth','Preston','QPR','Sheffield United',
    'Southampton','Stoke','Swansea','Watford','West Brom',
    'Wrexham'
  ],
  3: [
    'AFC Wimbledon','Barnsley','Blackpool','Bradford',
    'Bristol Rovers','Burton','Cambridge','Doncaster',
    'Huddersfield','Leyton Orient','Luton','Mansfield',
    'MK Dons','Notts County','Peterborough','Plymouth',
    'Reading','Rotherham','Sheffield Wednesday','Stevenage',
    'Stockport','Wigan','Wycombe'
  ],
  4: [
    'Accrington','Barnet','Bromley','Cheltenham','Chesterfield',
    'Colchester','Crawley','Crewe','Exeter','Fleetwood',
    'Gillingham','Grimsby','Newport','Northampton','Oldham',
    'Port Vale','Salford','Shrewsbury','Swindon','Tranmere',
    'Walsall','York'
  ]
};

const TRANSFER =
  /\b(transfer|transfers|sign|signs|signed|signing|joins|joined|loan|loaned|deal|agreed|agreement|bid|bids|offer|offers|move|moves|departure|leaves|released|contract|free agent|target|targets|interest|interested|talks)\b/i;

const RUMOUR =
  /\b(rumour|rumor|reportedly|could|might|potential|linked|target|targets|interest|interested|talks|bid|offer|considering|wanted|wants|set to)\b/i;

const CONFIRMED =
  /\b(signed|signs|joins|joined|completed|agreed|official|confirmed|announced|seals|sealed)\b/i;

function googleNews(query) {
  return 'https://news.google.com/rss/search?q=' +
    encodeURIComponent(query) +
    '&hl=en-GB&gl=GB&ceid=GB:en';
}

const ALL_FEEDS = [
  ...FEEDS.map(x => ({ name: x[0], url: x[1], division: 0 })),
  { name:'Google News Premier League', url:googleNews('Premier League transfer signing loan deal'), division:1 },
  { name:'Google News Championship', url:googleNews('Championship transfer signing loan deal'), division:2 },
  { name:'Google News League One', url:googleNews('League One transfer signing loan deal'), division:3 },
  { name:'Google News League Two', url:googleNews('League Two transfer signing loan deal'), division:4 }
];

function clean(s) {
  return (s || '')
    .replace(/<!\[CDATA\[/g,'')
    .replace(/\]\]>/g,'')
    .replace(/<[^>]+>/g,' ')
    .replace(/&amp;/g,'&')
    .replace(/&quot;/g,'"')
    .replace(/&#39;/g,"'")
    .replace(/&apos;/g,"'")
    .replace(/\s+/g,' ')
    .trim();
}

function tag(block, name) {
  const m = block.match(
    new RegExp('<' + name + '(?:\\s[^>]*)?>([\\s\\S]*?)<\\/' + name + '>','i')
  );
  return m ? clean(m[1]) : '';
}

function parse(xml, source) {
  const blocks = xml.match(/<item(?:\s[^>]*)?>[\s\S]*?<\/item>/gi) || [];

  return blocks.map(block => ({
    title: tag(block,'title'),
    link: tag(block,'link'),
    summary: tag(block,'description'),
    date: tag(block,'pubDate'),
    source
  })).filter(x => x.title && x.link);
}

async function fetchFeed(feed) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(feed.url, {
      signal: controller.signal,
      headers: {
        'User-Agent':'The92Weekly Transfer News Bot',
        'Accept':'application/rss+xml, application/xml, text/xml'
      }
    });

    clearTimeout(timer);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    return {
      feed,
      items: parse(await response.text(), feed.name)
    };
  } catch (e) {
    console.log(`Failed: ${feed.name} - ${e.message}`);
    return { feed, items: [] };
  }
}

function getClubs(text) {
  const found = [];

  for (const clubs of Object.values(CLUBS)) {
    for (const club of clubs) {
      if (text.toLowerCase().includes(club.toLowerCase())) {
        found.push(club);
      }
    }
  }

  return [...new Set(found)];
}

function getDivisions(clubs, hint) {
  if (hint) return [hint];

  const result = [];

  for (const [division, names] of Object.entries(CLUBS)) {
    if (clubs.some(c => names.includes(c))) {
      result.push(Number(division));
    }
  }

  return result;
}

function status(title) {
  if (/loan|loaned/i.test(title) && !RUMOUR.test(title)) {
    return 'Loan';
  }

  if (CONFIRMED.test(title) && !RUMOUR.test(title)) {
    return 'Confirmed';
  }

  return 'Rumour';
}

async function main() {
  console.log(`Checking ${ALL_FEEDS.length} sources...`);

  const results = await Promise.all(
    ALL_FEEDS.map(fetchFeed)
  );

  let successful = 0;
  const stories = [];

  for (const result of results) {
    if (result.items.length) successful++;

    for (const item of result.items) {
      const text = `${item.title} ${item.summary}`;

      if (!TRANSFER.test(text)) continue;

      if (/how to watch|live stream|tv channel|fantasy football|betting tips/i.test(text)) {
        continue;
      }

      const clubs = getClubs(text);
      const divisions = getDivisions(
        clubs,
        result.feed.division
      );

      for (const division of divisions) {
        stories.push({
          division,
          divisionName: DIVISIONS[division],
          clubs,
          title: item.title,
          summary: item.summary.slice(0,260),
          link: item.link,
          source: item.source,
          publishedAt: (() => {
  const date = new Date(item.date);
  return Number.isNaN(date.getTime())
    ? new Date().toISOString()
    : date.toISOString();
})(),
          status: status(item.title)
        });
      }
    }
  }

  const seen = new Set();
  const unique = stories
    .sort((a,b) =>
      new Date(b.publishedAt) -
      new Date(a.publishedAt)
    )
    .filter(story => {
      const key = story.link.replace(/[?#].*$/,'');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  const byDivision = {};

  for (const division of [1,2,3,4]) {
    byDivision[division] = unique
      .filter(x => x.division === division)
      .slice(0,30);
  }

  const total = Object.values(byDivision)
    .reduce((n,x) => n + x.length, 0);

  const output = path.join(
    __dirname,
    '..',
    'data',
    'transfers.json'
  );

  if (successful < 2 || total === 0) {
    console.log('Not enough successful sources. Existing data preserved.');
    return;
  }

  fs.writeFileSync(
    output,
    JSON.stringify({
      updatedAt: new Date().toISOString(),
      sourceCount: successful,
      byDivision
    }, null, 2) + '\n'
  );

  console.log(`Saved ${total} transfer stories.`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
