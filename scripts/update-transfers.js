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

// Each club maps to a list of names it's commonly referred to by in
// news headlines — plain single-name matching missed too much real
// coverage (e.g. "Man Utd" never matches "Manchester United" as a
// substring, so that story would silently fall through undetected).
const CLUBS = {
  1: {
    'Arsenal': ['arsenal'],
    'Aston Villa': ['aston villa','villa'],
    'Bournemouth': ['bournemouth'],
    'Brentford': ['brentford'],
    'Brighton': ['brighton'],
    'Chelsea': ['chelsea'],
    'Coventry City': ['coventry city','coventry'],
    'Crystal Palace': ['crystal palace','palace'],
    'Everton': ['everton'],
    'Fulham': ['fulham'],
    'Hull City': ['hull city','hull'],
    'Ipswich Town': ['ipswich town','ipswich'],
    'Leeds United': ['leeds united','leeds'],
    'Liverpool': ['liverpool'],
    'Manchester City': ['manchester city','man city'],
    'Manchester United': ['manchester united','man utd','man united'],
    'Newcastle United': ['newcastle united','newcastle'],
    'Nottingham Forest': ['nottingham forest','forest'],
    'Sunderland': ['sunderland'],
    'Tottenham': ['tottenham hotspur','tottenham','spurs']
  },
  2: {
    'Birmingham City': ['birmingham city','birmingham'],
    'Blackburn Rovers': ['blackburn rovers','blackburn'],
    'Bolton Wanderers': ['bolton wanderers','bolton'],
    'Bristol City': ['bristol city'],
    'Burnley': ['burnley'],
    'Cardiff City': ['cardiff city','cardiff'],
    'Charlton Athletic': ['charlton athletic','charlton'],
    'Derby County': ['derby county','derby'],
    'Lincoln City': ['lincoln city','lincoln'],
    'Middlesbrough': ['middlesbrough','boro'],
    'Millwall': ['millwall'],
    'Norwich City': ['norwich city','norwich'],
    'Portsmouth': ['portsmouth','pompey'],
    'Preston North End': ['preston north end','preston'],
    'Queens Park Rangers': ['queens park rangers','qpr'],
    'Sheffield United': ['sheffield united','sheff utd','sheff united'],
    'Southampton': ['southampton'],
    'Stoke City': ['stoke city','stoke'],
    'Swansea City': ['swansea city','swansea'],
    'Watford': ['watford'],
    'West Bromwich Albion': ['west bromwich albion','west brom'],
    'West Ham United': ['west ham united','west ham'],
    'Wolverhampton Wanderers': ['wolverhampton wanderers','wolverhampton','wolves'],
    'Wrexham': ['wrexham']
  },
  3: {
    'AFC Wimbledon': ['afc wimbledon','wimbledon'],
    'Barnsley': ['barnsley'],
    'Blackpool': ['blackpool'],
    'Bradford City': ['bradford city','bradford'],
    'Bromley': ['bromley'],
    'Burton Albion': ['burton albion','burton'],
    'Cambridge United': ['cambridge united','cambridge'],
    'Doncaster Rovers': ['doncaster rovers','doncaster'],
    'Huddersfield Town': ['huddersfield town','huddersfield'],
    'Leicester City': ['leicester city','leicester'],
    'Leyton Orient': ['leyton orient'],
    'Luton Town': ['luton town','luton'],
    'Mansfield Town': ['mansfield town','mansfield'],
    'Milton Keynes Dons': ['milton keynes dons','mk dons','milton keynes'],
    'Notts County': ['notts county'],
    'Oxford United': ['oxford united','oxford'],
    'Peterborough United': ['peterborough united','peterborough'],
    'Plymouth Argyle': ['plymouth argyle','plymouth'],
    'Reading': ['reading'],
    'Sheffield Wednesday': ['sheffield wednesday','sheff wed'],
    'Stevenage': ['stevenage'],
    'Stockport County': ['stockport county','stockport'],
    'Wigan Athletic': ['wigan athletic','wigan'],
    'Wycombe Wanderers': ['wycombe wanderers','wycombe']
  },
  4: {
    'Accrington Stanley': ['accrington stanley','accrington'],
    'Barnet': ['barnet'],
    'Bristol Rovers': ['bristol rovers'],
    'Cheltenham Town': ['cheltenham town','cheltenham'],
    'Chesterfield': ['chesterfield'],
    'Colchester United': ['colchester united','colchester'],
    'Crawley Town': ['crawley town','crawley'],
    'Crewe Alexandra': ['crewe alexandra','crewe'],
    'Exeter City': ['exeter city','exeter'],
    'Fleetwood Town': ['fleetwood town','fleetwood'],
    'Gillingham': ['gillingham'],
    'Grimsby Town': ['grimsby town','grimsby'],
    'Newport County': ['newport county','newport'],
    'Northampton Town': ['northampton town','northampton'],
    'Oldham Athletic': ['oldham athletic','oldham'],
    'Port Vale': ['port vale'],
    'Rochdale': ['rochdale'],
    'Rotherham United': ['rotherham united','rotherham'],
    'Salford City': ['salford city','salford'],
    'Shrewsbury Town': ['shrewsbury town','shrewsbury'],
    'Swindon Town': ['swindon town','swindon'],
    'Tranmere Rovers': ['tranmere rovers','tranmere'],
    'Walsall': ['walsall'],
    'York City': ['york city','york']
  }
};

const TRANSFER =
  /\b(transfer|transfers|sign|signs|signed|signing|joins|joined|loan|loaned|deal|agreed|agreement|bid|bids|offer|offers|move|moves|departure|leaves|released|contract|free agent|target|targets|interest|interested|talks)\b/i;

const RUMOUR =
  /\b(rumour|rumor|reportedly|could|might|potential|linked|target|targets|interest|interested|talks|bid|offer|considering|wanted|wants|set to)\b/i;

const CONFIRMED =
  /\b(signed|signs|joins|joined|completed|agreed|official|confirmed|announced|seals|sealed)\b/i;

// A second safety net alongside whole-word club matching — catches
// stories from other sports that happen to mention a club's home city
// or a word overlapping with a football term (e.g. cricket "signings").
const NON_FOOTBALL =
  /\b(cricket|rugby league|rugby union|county championship|T20 Blast|One Day Cup|test match|wicket|batsman|bowler|snooker|darts|golf|tennis|boxing|Formula 1|F1 Grand Prix|MotoGP|athletics|Olympics)\b/i;

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

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Plain substring matching caused false positives — e.g. "Derby" (Derby
// County) matching inside "Derbyshire" in an unrelated cricket story.
// Whole-word matching fixes that while still catching multi-word club
// names like "Bristol City" correctly.
function getClubs(text) {
  const lower = text.toLowerCase();
  const found = [];

  for (const clubMap of Object.values(CLUBS)) {
    for (const [name, aliases] of Object.entries(clubMap)) {
      const matched = aliases.some(alias => {
        const pattern = new RegExp('\\b' + escapeRegex(alias) + '\\b');
        return pattern.test(lower);
      });
      if (matched) found.push(name);
    }
  }

  return [...new Set(found)];
}

// The Google News feeds are per-division searches (e.g. "League One
// transfer..."), but Google's results sometimes surface stories that
// are actually about a different division's club entirely. Blindly
// trusting which search found the story caused Premier League and
// Championship stories to get force-assigned to League One/Two.
// Detected clubs are the source of truth; the feed's own division is
// only a fallback for the rare story where no club name is recognized.
function getDivisions(clubs, hint) {
  const detected = [];

  for (const [division, clubMap] of Object.entries(CLUBS)) {
    const names = Object.keys(clubMap);
    if (clubs.some(c => names.includes(c))) {
      detected.push(Number(division));
    }
  }

  if (detected.length > 0) return detected;

  if (hint) return [hint];

  return [];
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

    // Google News RSS descriptions are just the article title wrapped in
    // a link, plus the source name (e.g. "Title <a>...Yahoo Sports"),
    // not a real article summary. Showing that as a "summary" reads as
    // garbled, unrelated text — so skip it entirely for these feeds.
    const isGoogleNews = /^Google News/.test(result.feed.name);

    for (const item of result.items) {
      const text = `${item.title} ${item.summary}`;

      if (!TRANSFER.test(text)) continue;

      if (/how to watch|live stream|tv channel|fantasy football|betting tips/i.test(text)) {
        continue;
      }

      if (NON_FOOTBALL.test(text)) {
        continue;
      }

      const clubs = getClubs(text);
      const divisions = getDivisions(
        clubs,
        result.feed.division
      );

      const summary = isGoogleNews ? '' : item.summary.slice(0,260);

      for (const division of divisions) {
        stories.push({
          division,
          divisionName: DIVISIONS[division],
          clubs,
          title: item.title,
          summary,
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

  // Load whatever was already saved so every story ever collected stays
  // on the site permanently, not just what this run happened to fetch —
  // RSS feeds only ever return their most recent ~20-50 items, so
  // without merging, older stories would silently vanish every run.
  const output = path.join(
    __dirname,
    '..',
    'data',
    'transfers.json'
  );

  let previousStories = [];

  try {
    const previous = JSON.parse(fs.readFileSync(output, 'utf8'));
    for (const division of [1,2,3,4]) {
      previousStories.push(...((previous.byDivision && previous.byDivision[division]) || []));
    }
  } catch (e) {
    // No existing file yet, or it's unreadable — start fresh.
  }

  // Re-check previously stored stories against the current rules too.
  // Without this, once-bad entries saved before this fix (wrong sport,
  // wrong division from the old hint-override bug) would stay in the
  // archive forever, since merging only re-validates freshly fetched
  // items — not what's already sitting in the file.
  function revalidateStory(story) {
    const text = `${story.title} ${story.summary || ''}`;

    if (NON_FOOTBALL.test(text)) return [];

    const clubs = getClubs(text);
    const divisions = getDivisions(clubs, 0);

    if (divisions.length === 0) return [];

    return divisions.map(division => ({
      ...story,
      division,
      divisionName: DIVISIONS[division],
      clubs
    }));
  }

  previousStories = previousStories.flatMap(revalidateStory);

  const combined = [...stories, ...previousStories];

  const seen = new Set();
  const unique = combined
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
      .filter(x => x.division === division);
  }

  const total = Object.values(byDivision)
    .reduce((n,x) => n + x.length, 0);

  // Only skip writing if this run failed badly AND there's no existing
  // archive to fall back on — a bad run with an existing archive is
  // safe to save anyway, since merging never loses old data.
  if (successful < 2 && previousStories.length === 0) {
    console.log('Not enough successful sources and no existing archive. Skipping.');
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

  console.log(`Saved ${total} transfer stories total (archive grows every run, no cap).`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
