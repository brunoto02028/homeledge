import { NextRequest, NextResponse } from 'next/server';

// ─── Country → Coordinates mapping ───────────────────────────────────────────
const COUNTRY_COORDS: Record<string, [number, number]> = {
  // Europe
  gb: [-1.17, 52.35], uk: [-1.17, 52.35], ie: [-7.69, 53.14], fr: [2.21, 46.60],
  de: [10.45, 51.17], it: [12.57, 41.87], es: [-3.75, 40.46], pt: [-8.22, 39.40],
  nl: [5.29, 52.13], be: [4.47, 50.50], ch: [8.23, 46.82], at: [14.55, 47.52],
  se: [18.64, 60.13], no: [8.47, 60.47], dk: [9.50, 56.26], fi: [25.75, 61.92],
  pl: [19.15, 51.92], cz: [15.47, 49.82], ro: [24.97, 45.94], gr: [21.82, 39.07],
  hu: [19.50, 47.16], bg: [25.49, 42.73], ua: [31.17, 48.38], ru: [105.32, 61.52],
  tr: [35.24, 38.96],
  // Americas
  us: [-95.71, 37.09], ca: [-106.35, 56.13], mx: [-102.55, 23.63],
  br: [-51.93, -14.24], ar: [-63.62, -38.42], co: [-74.30, 4.57],
  cl: [-71.54, -35.68], pe: [-75.02, -9.19], ve: [-66.59, 6.42],
  // Asia
  cn: [104.20, 35.86], jp: [138.25, 36.20], kr: [127.77, 35.91],
  in: [78.96, 20.59], pk: [69.35, 30.38], bd: [90.36, 23.68],
  id: [113.92, -0.79], th: [100.99, 15.87], vn: [108.28, 14.06],
  ph: [121.77, 12.88], my: [101.98, 4.21], sg: [103.82, 1.35],
  tw: [120.96, 23.70], hk: [114.17, 22.32],
  // Middle East
  sa: [45.08, 23.89], ae: [53.85, 23.42], il: [34.85, 31.05],
  ir: [53.69, 32.43], iq: [43.68, 33.22], eg: [30.80, 26.82],
  qa: [51.18, 25.35], kw: [47.48, 29.31], sy: [38.99, 34.80],
  lb: [35.86, 33.85], jo: [36.24, 30.59], ye: [48.52, 15.55],
  om: [55.92, 21.51], bh: [50.56, 26.07], ps: [35.23, 31.95],
  // Africa
  za: [22.94, -30.56], ng: [8.68, 9.08], ke: [37.91, -1.29],
  et: [40.49, 9.15], gh: [-1.02, 7.95], tz: [34.89, -6.37],
  ma: [-7.09, 31.79], dz: [1.66, 28.03], ly: [17.23, 26.34],
  sd: [30.22, 12.86], ss: [31.60, 6.88], so: [46.20, 5.15],
  cd: [21.76, -4.04], cm: [12.35, 7.37], sn: [-14.45, 14.50],
  ci: [-5.55, 7.54], ug: [32.29, 1.37], rw: [29.87, -1.94],
  mz: [35.53, -18.67], zw: [29.15, -19.02], ao: [17.87, -11.20],
  tn: [9.54, 33.89],
  // Oceania
  au: [133.78, -25.27], nz: [174.89, -40.90],
  // Central Asia / Southeast Asia
  af: [67.71, 33.94], mm: [95.96, 21.91], kh: [104.99, 12.57],
  la: [102.50, 19.86], np: [84.12, 28.39], lk: [80.77, 7.87],
  kz: [66.92, 48.02], uz: [64.59, 41.38],
  // Central America / Caribbean
  cu: [-77.78, 21.52], ht: [-72.29, 18.97], pa: [-80.78, 8.54],
  cr: [-83.75, 9.75], gt: [-90.23, 15.78], hn: [-86.24, 15.20],
  ni: [-85.21, 12.87], ec: [-78.18, -1.83], bo: [-65.46, -16.29],
  py: [-58.44, -23.44], uy: [-55.77, -32.52],
};

// ─── Source → Country mapping (for major news sources) ─────────────────────
const SOURCE_COUNTRY: Record<string, string> = {
  'bbc-news': 'gb', 'the-guardian-uk': 'gb', 'independent': 'gb', 'financial-times': 'gb',
  'reuters': 'gb', 'the-telegraph': 'gb', 'daily-mail': 'gb', 'mirror': 'gb', 'sky-news': 'gb',
  'cnn': 'us', 'fox-news': 'us', 'abc-news': 'us', 'nbc-news': 'us', 'cbs-news': 'us',
  'the-washington-post': 'us', 'the-new-york-times': 'us', 'bloomberg': 'us', 'cnbc': 'us',
  'the-wall-street-journal': 'us', 'associated-press': 'us', 'usa-today': 'us', 'politico': 'us',
  'the-verge': 'us', 'techcrunch': 'us', 'wired': 'us', 'ars-technica': 'us', 'engadget': 'us',
  'business-insider': 'us', 'fortune': 'us', 'time': 'us', 'newsweek': 'us',
  'al-jazeera-english': 'qa', 'the-hindu': 'in', 'the-times-of-india': 'in',
  'abc-news-au': 'au', 'cbc-news': 'ca', 'globo': 'br', 'le-monde': 'fr',
  'der-tagesspiegel': 'de', 'die-zeit': 'de', 'el-mundo': 'es', 'ansa': 'it',
  'nrk': 'no', 'aftenposten': 'no', 'google-news-au': 'au', 'google-news-ca': 'ca',
  'google-news-in': 'in', 'google-news-uk': 'gb',
  'the-irish-times': 'ie', 'rte': 'ie', 'south-china-morning-post': 'hk',
  'the-straits-times': 'sg', 'the-japan-times': 'jp', 'yonhap-news-agency': 'kr',
};

// ─── Sentiment Analysis ─────────────────────────────────────────────────────
const NEGATIVE_WORDS = [
  'crisis', 'crash', 'war', 'attack', 'killed', 'death', 'dead', 'collapse',
  'recession', 'inflation', 'sanctions', 'threat', 'bomb', 'terror', 'fraud',
  'scandal', 'layoff', 'bankrupt', 'shutdown', 'emergency', 'catastrophe',
  'disaster', 'explosion', 'conflict', 'violence', 'shooting', 'arrest',
  'decline', 'plunge', 'slump', 'downturn', 'deficit', 'default', 'strike',
  'famine', 'drought', 'flood', 'earthquake', 'pandemic', 'outbreak',
];

const POSITIVE_WORDS = [
  'growth', 'surge', 'boost', 'recovery', 'deal', 'innovation', 'breakthrough',
  'record high', 'profit', 'expansion', 'investment', 'partnership', 'launch',
  'success', 'milestone', 'opportunity', 'progress', 'reform', 'improvement',
  'upgrade', 'rally', 'gain', 'surplus', 'approval', 'cure', 'discovery',
  'achievement', 'winner', 'positive', 'optimistic', 'agreement', 'peace',
];

// ─── UK Impact Detection ────────────────────────────────────────────────────
const UK_IMPACT_KEYWORDS = [
  'uk', 'britain', 'british', 'england', 'scotland', 'wales', 'london',
  'bank of england', 'boe', 'ftse', 'sterling', 'pound', 'gbp', 'nhs',
  'parliament', 'downing street', 'westminster', 'chancellor', 'prime minister',
  'hmrc', 'brexit', 'felixstowe', 'city of london', 'lloyds', 'barclays',
  'hsbc', 'natwest', 'royal mail', 'bt group', 'bp', 'shell', 'astrazeneca',
  'unilever', 'rolls-royce', 'bae systems', 'glencore', 'rio tinto',
  // Global events that affect UK
  'fed rate', 'federal reserve', 'ecb', 'opec', 'suez', 'nato',
  'trade war', 'tariff', 'oil price', 'gas price', 'energy crisis',
  'supply chain', 'semiconductor', 'chip shortage',
];

function analyzeSentiment(title: string, description: string): 'negative' | 'positive' | 'neutral' {
  const text = `${title} ${description}`.toLowerCase();
  let negScore = 0, posScore = 0;
  for (const w of NEGATIVE_WORDS) { if (text.includes(w)) negScore++; }
  for (const w of POSITIVE_WORDS) { if (text.includes(w)) posScore++; }
  if (negScore > posScore && negScore > 0) return 'negative';
  if (posScore > negScore && posScore > 0) return 'positive';
  return 'neutral';
}

function isUkImpact(title: string, description: string): boolean {
  const text = `${title} ${description}`.toLowerCase();
  return UK_IMPACT_KEYWORDS.some(k => text.includes(k));
}

// ─── Biblical Prophecy Cross-Reference ───────────────────────────────────
const PROPHECY_KEYWORDS = [
  'war', 'wars', 'rumor', 'rumours', 'famine', 'earthquake', 'pestilence', 'plague',
  'nation against nation', 'kingdom against', 'persecution', 'false prophet',
  'peace treaty', 'middle east', 'israel', 'jerusalem', 'temple mount',
  'iran', 'russia', 'china', 'turkey', 'syria', 'egypt', 'libya',
  'one world', 'global currency', 'digital currency', 'cbdc', 'mark',
  'surveillance', 'chip', 'biometric', 'ai takeover', 'artificial intelligence',
  'climate disaster', 'flood', 'wildfire', 'tsunami', 'volcano',
  'solar flare', 'asteroid', 'cosmic', 'blood moon', 'eclipse',
  'apostasy', 'persecution of christians', 'church', 'faith',
  'nuclear', 'biological weapon', 'chemical attack',
  'economic collapse', 'hyperinflation', 'food shortage', 'water crisis',
  'gog', 'magog', 'armageddon', 'euphrates', 'babylon',
];

const PROPHECY_REFS: Record<string, string> = {
  'war': 'Matthew 24:6 — "You will hear of wars and rumors of wars"',
  'wars': 'Matthew 24:6 — "You will hear of wars and rumors of wars"',
  'famine': 'Revelation 6:5-6 — Third seal: Black horse of famine',
  'earthquake': 'Matthew 24:7 — "There will be earthquakes in various places"',
  'pestilence': 'Luke 21:11 — "There will be great earthquakes, famines and pestilences"',
  'plague': 'Revelation 16 — The seven bowls of God\'s wrath',
  'nation against nation': 'Matthew 24:7 — "Nation will rise against nation"',
  'israel': 'Ezekiel 37 — The valley of dry bones; Israel restored',
  'jerusalem': 'Zechariah 12:3 — "Jerusalem will be an immovable rock for all nations"',
  'iran': 'Ezekiel 38:5 — Persia in the Gog-Magog coalition',
  'russia': 'Ezekiel 38:2 — "Gog, of the land of Magog" (northern kingdom)',
  'turkey': 'Ezekiel 38:6 — "Gomer and Beth Togarmah" (Anatolia)',
  'syria': 'Isaiah 17:1 — "Damascus will cease to be a city"',
  'egypt': 'Isaiah 19 — Prophecy against Egypt',
  'peace treaty': 'Daniel 9:27 — "He will confirm a covenant with many for one seven"',
  'temple mount': 'Daniel 9:27 — The abomination of desolation',
  'digital currency': 'Revelation 13:17 — "No one could buy or sell unless they had the mark"',
  'cbdc': 'Revelation 13:16-17 — Mark of the beast economic system',
  'one world': 'Revelation 13:7 — "Authority over every tribe, people, language and nation"',
  'nuclear': 'Zechariah 14:12 — "Their flesh will rot while they stand on their feet"',
  'economic collapse': 'Revelation 18 — The fall of Babylon the Great',
  'flood': 'Genesis 6-9 — "As in the days of Noah" (Matthew 24:37)',
  'persecution': 'Matthew 24:9 — "You will be handed over to be persecuted and put to death"',
  'false prophet': 'Matthew 24:11 — "Many false prophets will appear and deceive many"',
  'blood moon': 'Joel 2:31 — "The sun will be turned to darkness and the moon to blood"',
  'eclipse': 'Joel 2:31 — "Before the great and dreadful day of the Lord"',
  'euphrates': 'Revelation 16:12 — "The sixth angel poured out his bowl on the river Euphrates"',
  'armageddon': 'Revelation 16:16 — "They gathered the kings together to the place called Armageddon"',
  'china': 'Revelation 9:16 — "The number of the mounted troops was 200 million" (Kings of the East)',
  'surveillance': 'Revelation 13:16-17 — Total control of buying and selling',
  'ai takeover': 'Revelation 13:15 — "The image of the beast could speak"',
};

function getProphecyRef(title: string, description: string): string | null {
  const text = `${title} ${description}`.toLowerCase();
  for (const [keyword, ref] of Object.entries(PROPHECY_REFS)) {
    if (text.includes(keyword)) return ref;
  }
  return null;
}

function isProphecyRelated(title: string, description: string): boolean {
  const text = `${title} ${description}`.toLowerCase();
  return PROPHECY_KEYWORDS.some(k => text.includes(k));
}

// Extract country from article text when source mapping is unknown
const TEXT_COUNTRY_MAP: [string, string][] = [
  ['ukraine', 'ua'], ['russia', 'ru'], ['china', 'cn'], ['taiwan', 'tw'], ['japan', 'jp'],
  ['south korea', 'kr'], ['north korea', 'kr'], ['india', 'in'], ['pakistan', 'pk'],
  ['israel', 'il'], ['palestine', 'ps'], ['gaza', 'ps'], ['iran', 'ir'], ['iraq', 'iq'],
  ['syria', 'sy'], ['lebanon', 'lb'], ['yemen', 'ye'], ['saudi', 'sa'], ['turkey', 'tr'],
  ['egypt', 'eg'], ['libya', 'ly'], ['sudan', 'sd'], ['south sudan', 'ss'], ['somalia', 'so'],
  ['ethiopia', 'et'], ['nigeria', 'ng'], ['south africa', 'za'], ['kenya', 'ke'],
  ['congo', 'cd'], ['mozambique', 'mz'], ['myanmar', 'mm'], ['afghanistan', 'af'],
  ['brazil', 'br'], ['mexico', 'mx'], ['argentina', 'ar'], ['colombia', 'co'],
  ['venezuela', 've'], ['cuba', 'cu'], ['canada', 'ca'], ['australia', 'au'],
  ['germany', 'de'], ['france', 'fr'], ['italy', 'it'], ['spain', 'es'], ['portugal', 'pt'],
  ['poland', 'pl'], ['netherlands', 'nl'], ['belgium', 'be'], ['sweden', 'se'],
  ['norway', 'no'], ['denmark', 'dk'], ['finland', 'fi'], ['greece', 'gr'],
  ['romania', 'ro'], ['hungary', 'hu'], ['czech', 'cz'], ['switzerland', 'ch'],
  ['austria', 'at'], ['ireland', 'ie'],
  ['pentagon', 'us'], ['white house', 'us'], ['washington', 'us'], ['congress', 'us'],
  ['kremlin', 'ru'], ['moscow', 'ru'], ['beijing', 'cn'], ['tokyo', 'jp'], ['seoul', 'kr'],
  ['london', 'gb'], ['paris', 'fr'], ['berlin', 'de'], ['rome', 'it'], ['madrid', 'es'],
  ['brussels', 'be'], ['jerusalem', 'il'], ['tehran', 'ir'], ['baghdad', 'iq'],
  ['damascus', 'sy'], ['beirut', 'lb'], ['cairo', 'eg'], ['riyadh', 'sa'],
  ['kabul', 'af'], ['new delhi', 'in'], ['islamabad', 'pk'],
  ['aircraft carrier', 'us'], ['nato', 'be'], ['european union', 'be'], ['eu ', 'be'],
  ['red sea', 'ye'], ['black sea', 'ua'], ['south china sea', 'cn'],
  ['strait of hormuz', 'ir'], ['suez canal', 'eg'],
];

function extractCountryFromText(title: string, desc: string): string | null {
  const text = `${title} ${desc}`.toLowerCase();
  for (const [keyword, code] of TEXT_COUNTRY_MAP) {
    if (text.includes(keyword)) return code;
  }
  return null;
}

function getCoords(sourceId: string, country: string, title?: string, desc?: string): [number, number] | null {
  const code = SOURCE_COUNTRY[sourceId] || country?.toLowerCase();
  if (code && COUNTRY_COORDS[code]) return COUNTRY_COORDS[code];
  // Try text-based extraction
  if (title || desc) {
    const textCode = extractCountryFromText(title || '', desc || '');
    if (textCode && COUNTRY_COORDS[textCode]) return COUNTRY_COORDS[textCode];
  }
  return null;
}

// ─── Continent mapping ──────────────────────────────────────────────────────
const CONTINENT_MAP: Record<string, string> = {
  gb: 'Europe', uk: 'Europe', ie: 'Europe', fr: 'Europe', de: 'Europe', it: 'Europe',
  es: 'Europe', pt: 'Europe', nl: 'Europe', be: 'Europe', ch: 'Europe', at: 'Europe',
  se: 'Europe', no: 'Europe', dk: 'Europe', fi: 'Europe', pl: 'Europe', cz: 'Europe',
  ro: 'Europe', gr: 'Europe', hu: 'Europe', bg: 'Europe', ua: 'Europe', ru: 'Europe', tr: 'Europe',
  us: 'Americas', ca: 'Americas', mx: 'Americas', br: 'Americas', ar: 'Americas',
  co: 'Americas', cl: 'Americas', pe: 'Americas', ve: 'Americas',
  cn: 'Asia', jp: 'Asia', kr: 'Asia', in: 'Asia', pk: 'Asia', bd: 'Asia',
  id: 'Asia', th: 'Asia', vn: 'Asia', ph: 'Asia', my: 'Asia', sg: 'Asia',
  tw: 'Asia', hk: 'Asia',
  sa: 'Middle East', ae: 'Middle East', il: 'Middle East', ir: 'Middle East',
  iq: 'Middle East', eg: 'Middle East', qa: 'Middle East', kw: 'Middle East',
  za: 'Africa', ng: 'Africa', ke: 'Africa', et: 'Africa', gh: 'Africa',
  tz: 'Africa', ma: 'Africa', dz: 'Africa', ly: 'Africa', sd: 'Africa',
  ss: 'Africa', so: 'Africa', cd: 'Africa', cm: 'Africa', sn: 'Africa',
  ci: 'Africa', ug: 'Africa', rw: 'Africa', mz: 'Africa', zw: 'Africa',
  ao: 'Africa', tn: 'Africa',
  au: 'Oceania', nz: 'Oceania',
  sy: 'Middle East', lb: 'Middle East', jo: 'Middle East', ye: 'Middle East',
  om: 'Middle East', bh: 'Middle East', ps: 'Middle East',
  af: 'Asia', mm: 'Asia', kh: 'Asia', la: 'Asia', np: 'Asia', lk: 'Asia',
  kz: 'Asia', uz: 'Asia',
  cu: 'Americas', ht: 'Americas', pa: 'Americas', cr: 'Americas', gt: 'Americas',
  hn: 'Americas', ni: 'Americas', ec: 'Americas', bo: 'Americas', py: 'Americas',
  uy: 'Americas',
};

// ─── API Handler ────────────────────────────────────────────────────────────
const CACHE: Record<string, { data: any; ts: number }> = {};
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes — client polls every 60s

export async function GET(req: NextRequest) {
  const apiKey = process.env.NEWSAPI_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'NEWSAPI_KEY not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category') || '';
  const query = searchParams.get('q') || '';

  const cacheKey = `${category}:${query}`;

  // Return cached if fresh
  if (CACHE[cacheKey] && Date.now() - CACHE[cacheKey].ts < CACHE_TTL) {
    return NextResponse.json(CACHE[cacheKey].data);
  }

  try {
    const articles: any[] = [];

    if (query) {
      // Search mode
      const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=50&language=en&apiKey=${apiKey}`;
      const res = await fetch(url, { next: { revalidate: 600 } });
      const data = await res.json();
      if (data.articles) articles.push(...data.articles);
    } else if (category === 'prophecy') {
      // Biblical prophecy mode: search for war, conflict, end-times related news
      const prophecyQueries = [
        'war OR conflict OR military',
        'earthquake OR tsunami OR volcano OR disaster',
        'Israel OR Jerusalem OR Middle East peace',
        'famine OR food crisis OR economic collapse',
        'digital currency OR CBDC OR surveillance',
        'persecution OR religious freedom',
      ];
      const promises = prophecyQueries.map(async (q) => {
        const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&sortBy=publishedAt&pageSize=15&language=en&apiKey=${apiKey}`;
        const res = await fetch(url, { next: { revalidate: 600 } });
        const data = await res.json();
        return (data.articles || []).map((a: any) => ({ ...a, newsCategory: 'prophecy' }));
      });
      const results = await Promise.all(promises);
      results.forEach(r => articles.push(...r));
    } else if (category) {
      // Single category
      const url = `https://newsapi.org/v2/top-headlines?category=${category}&pageSize=30&language=en&apiKey=${apiKey}`;
      const res = await fetch(url, { next: { revalidate: 600 } });
      const data = await res.json();
      if (data.articles) articles.push(...data.articles);
    } else {
      // GLOBAL DASHBOARD: fetch from multiple countries + war/geopolitical searches
      const countryFetches = [
        // Major powers
        { country: 'us', size: 10, cat: 'general' },
        { country: 'gb', size: 8, cat: 'general' },
        { country: 'ru', size: 5, cat: 'general' },
        { country: 'cn', size: 5, cat: 'general' },
        // Europe
        { country: 'de', size: 4, cat: 'general' },
        { country: 'fr', size: 4, cat: 'general' },
        { country: 'it', size: 3, cat: 'general' },
        { country: 'es', size: 3, cat: 'general' },
        { country: 'pt', size: 3, cat: 'general' },
        { country: 'nl', size: 2, cat: 'general' },
        { country: 'pl', size: 2, cat: 'general' },
        { country: 'se', size: 2, cat: 'general' },
        { country: 'no', size: 2, cat: 'general' },
        { country: 'ua', size: 3, cat: 'general' },
        { country: 'ro', size: 2, cat: 'general' },
        { country: 'gr', size: 2, cat: 'general' },
        { country: 'at', size: 2, cat: 'general' },
        { country: 'ch', size: 2, cat: 'general' },
        { country: 'be', size: 2, cat: 'general' },
        { country: 'ie', size: 2, cat: 'general' },
        { country: 'hu', size: 2, cat: 'general' },
        { country: 'cz', size: 2, cat: 'general' },
        // South America
        { country: 'br', size: 5, cat: 'general' },
        { country: 'ar', size: 3, cat: 'general' },
        { country: 'co', size: 3, cat: 'general' },
        { country: 've', size: 2, cat: 'general' },
        // Central America & Caribbean
        { country: 'mx', size: 4, cat: 'general' },
        { country: 'cu', size: 2, cat: 'general' },
        // Middle East
        { country: 'il', size: 4, cat: 'general' },
        { country: 'ae', size: 3, cat: 'general' },
        { country: 'sa', size: 3, cat: 'general' },
        { country: 'eg', size: 3, cat: 'general' },
        { country: 'tr', size: 3, cat: 'general' },
        // Asia-Pacific
        { country: 'in', size: 5, cat: 'general' },
        { country: 'jp', size: 4, cat: 'general' },
        { country: 'kr', size: 3, cat: 'general' },
        { country: 'au', size: 3, cat: 'general' },
        { country: 'nz', size: 2, cat: 'general' },
        { country: 'ph', size: 2, cat: 'general' },
        { country: 'my', size: 2, cat: 'general' },
        { country: 'sg', size: 2, cat: 'general' },
        { country: 'th', size: 2, cat: 'general' },
        { country: 'id', size: 2, cat: 'general' },
        { country: 'tw', size: 2, cat: 'general' },
        { country: 'hk', size: 2, cat: 'general' },
        // Africa
        { country: 'za', size: 3, cat: 'general' },
        { country: 'ng', size: 3, cat: 'general' },
        { country: 'ke', size: 2, cat: 'general' },
        { country: 'ma', size: 2, cat: 'general' },
        { country: 'et', size: 2, cat: 'general' },
      ];

      const warSearches = [
        { q: 'war OR military OR troops OR airstrike OR missile', size: 15, label: 'general' },
        { q: 'aircraft carrier OR navy OR warship OR submarine OR destroyer', size: 10, label: 'general' },
        { q: 'conflict OR sanctions OR ceasefire OR invasion OR bombing', size: 10, label: 'general' },
        { q: 'Iran OR "US military" OR "Iran attack" OR "Middle East tensions" OR Hezbollah', size: 10, label: 'general' },
        { q: 'Ukraine Russia OR Gaza OR "Red Sea" OR "South China Sea" OR Taiwan', size: 10, label: 'general' },
        { q: 'nuclear OR "ballistic missile" OR ICBM OR "weapons of mass destruction"', size: 8, label: 'general' },
        { q: 'NATO OR "military alliance" OR "defense pact" OR BRICS', size: 8, label: 'general' },
        { q: 'coup OR revolution OR protest OR uprising OR civil war', size: 8, label: 'general' },
        { q: 'oil price OR OPEC OR "energy crisis" OR "gas pipeline" OR sanctions', size: 8, label: 'business' },
        { q: 'cyber attack OR hacking OR espionage OR intelligence', size: 6, label: 'technology' },
        { q: '"central bank" OR "interest rate" OR inflation OR recession OR "economic crisis"', size: 8, label: 'business' },
      ];

      const promises = [
        ...countryFetches.map(async ({ country, size, cat }) => {
          const url = `https://newsapi.org/v2/top-headlines?country=${country}&pageSize=${size}&apiKey=${apiKey}`;
          const res = await fetch(url, { next: { revalidate: 180 } });
          const data = await res.json();
          return (data.articles || []).map((a: any) => ({
            ...a,
            newsCategory: cat,
            source: { ...a.source, country },
          }));
        }),
        ...warSearches.map(async ({ q, size, label }) => {
          const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&sortBy=publishedAt&pageSize=${size}&language=en&apiKey=${apiKey}`;
          const res = await fetch(url, { next: { revalidate: 180 } });
          const data = await res.json();
          return (data.articles || []).map((a: any) => ({ ...a, newsCategory: label }));
        }),
      ];

      const results = await Promise.all(promises);
      results.forEach(r => articles.push(...r));
    }

    // Deduplicate by title
    const seen = new Set<string>();
    const unique = articles.filter(a => {
      if (!a.title || a.title === '[Removed]' || seen.has(a.title)) return false;
      seen.add(a.title);
      return true;
    });

    // Enrich with coordinates, sentiment, uk impact
    const enriched = unique.map((article, i) => {
      const sourceId = article.source?.id || '';
      const country = article.source?.country || '';
      const textCountry = extractCountryFromText(article.title || '', article.description || '');
      const countryCode = SOURCE_COUNTRY[sourceId] || country?.toLowerCase() || textCountry || 'us';
      const coords = getCoords(sourceId, country, article.title, article.description);
      const sentiment = analyzeSentiment(article.title || '', article.description || '');
      const ukImpact = isUkImpact(article.title || '', article.description || '');
      const continent = CONTINENT_MAP[countryCode] || 'Europe';

      // Add small random offset to prevent exact overlap
      const jitter = () => (Math.random() - 0.5) * 4;

      const prophecyRelated = isProphecyRelated(article.title || '', article.description || '');
      const prophecyRef = getProphecyRef(article.title || '', article.description || '');

      return {
        id: `news-${i}-${Date.now()}`,
        title: article.title,
        description: article.description,
        url: article.url,
        imageUrl: article.urlToImage,
        source: article.source?.name || 'Unknown',
        sourceId,
        publishedAt: article.publishedAt,
        category: article.newsCategory || category || 'general',
        country: countryCode,
        continent,
        coordinates: coords ? [coords[0] + jitter(), coords[1] + jitter()] : null,
        sentiment,
        ukImpact,
        prophecyRelated,
        prophecyRef,
      };
    });

    const result = {
      articles: enriched,
      total: enriched.length,
      fetchedAt: new Date().toISOString(),
    };

    // Cache results
    CACHE[cacheKey] = { data: result, ts: Date.now() };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[News API] Error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch news', details: error.message }, { status: 500 });
  }
}
