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

// ─── GDELT country name → code mapping ──────────────────────────────────────
const GDELT_COUNTRY: Record<string, string> = {
  'united states': 'us', 'united kingdom': 'gb', 'canada': 'ca', 'australia': 'au',
  'germany': 'de', 'france': 'fr', 'italy': 'it', 'spain': 'es', 'portugal': 'pt',
  'netherlands': 'nl', 'belgium': 'be', 'switzerland': 'ch', 'austria': 'at',
  'sweden': 'se', 'norway': 'no', 'denmark': 'dk', 'finland': 'fi',
  'poland': 'pl', 'czech republic': 'cz', 'romania': 'ro', 'greece': 'gr',
  'hungary': 'hu', 'bulgaria': 'bg', 'ukraine': 'ua', 'russia': 'ru', 'turkey': 'tr',
  'ireland': 'ie', 'india': 'in', 'china': 'cn', 'japan': 'jp', 'south korea': 'kr',
  'taiwan': 'tw', 'hong kong': 'hk', 'singapore': 'sg', 'malaysia': 'my',
  'thailand': 'th', 'indonesia': 'id', 'philippines': 'ph', 'vietnam': 'vn',
  'pakistan': 'pk', 'bangladesh': 'bd', 'sri lanka': 'lk', 'nepal': 'np',
  'israel': 'il', 'iran': 'ir', 'iraq': 'iq', 'saudi arabia': 'sa',
  'united arab emirates': 'ae', 'qatar': 'qa', 'kuwait': 'kw', 'egypt': 'eg',
  'syria': 'sy', 'lebanon': 'lb', 'jordan': 'jo', 'yemen': 'ye',
  'brazil': 'br', 'argentina': 'ar', 'mexico': 'mx', 'colombia': 'co',
  'chile': 'cl', 'peru': 'pe', 'venezuela': 've', 'cuba': 'cu', 'ecuador': 'ec',
  'south africa': 'za', 'nigeria': 'ng', 'kenya': 'ke', 'ethiopia': 'et',
  'ghana': 'gh', 'tanzania': 'tz', 'morocco': 'ma', 'algeria': 'dz',
  'libya': 'ly', 'sudan': 'sd', 'south sudan': 'ss', 'somalia': 'so',
  'new zealand': 'nz', 'afghanistan': 'af', 'myanmar': 'mm', 'cambodia': 'kh',
  'kazakhstan': 'kz', 'uzbekistan': 'uz', 'palestine': 'ps',
};

function gdeltCountryToCode(name: string): string | null {
  if (!name) return null;
  const lower = name.toLowerCase().trim();
  return GDELT_COUNTRY[lower] || null;
}

// ─── Source fetchers ─────────────────────────────────────────────────────────

async function fetchGDELT(): Promise<any[]> {
  const queries = [
    { q: 'sourcelang:english', max: 75, label: 'general' },
    { q: '(war OR military OR missile OR airstrike) sourcelang:english', max: 50, label: 'general' },
    { q: '(economy OR trade OR "central bank" OR inflation) sourcelang:english', max: 30, label: 'business' },
    { q: '(earthquake OR tsunami OR hurricane OR disaster) sourcelang:english', max: 20, label: 'science' },
  ];
  const results: any[] = [];
  await Promise.all(queries.map(async ({ q, max, label }) => {
    try {
      const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(q)}&mode=artlist&maxrecords=${max}&format=json&sort=DateDesc&timespan=24h`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) return;
      const data = await res.json();
      if (!data.articles) return;
      for (const a of data.articles) {
        const cc = gdeltCountryToCode(a.sourcecountry || '');
        results.push({
          title: a.title, description: null, url: a.url,
          urlToImage: a.socialimage || null,
          publishedAt: a.seendate ? new Date(a.seendate.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/, '$1-$2-$3T$4:$5:$6Z')).toISOString() : new Date().toISOString(),
          source: { id: '', name: a.domain || 'GDELT', country: cc || '' },
          newsCategory: label, _src: 'gdelt',
        });
      }
    } catch (e: any) { console.error('[GDELT]', e.message); }
  }));
  return results;
}

async function fetchCurrentsAPI(): Promise<any[]> {
  const apiKey = process.env.CURRENTS_API_KEY;
  if (!apiKey) return [];
  const results: any[] = [];
  const endpoints = [
    `https://api.currentsapi.services/v1/latest-news?apiKey=${apiKey}&language=en`,
    `https://api.currentsapi.services/v1/search?apiKey=${apiKey}&language=en&keywords=war+military+conflict&type=1`,
    `https://api.currentsapi.services/v1/search?apiKey=${apiKey}&language=en&keywords=economy+trade+sanctions&type=1`,
  ];
  await Promise.all(endpoints.map(async (url) => {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) return;
      const data = await res.json();
      if (!data.news) return;
      for (const a of data.news) {
        const cat = Array.isArray(a.category) ? a.category[0] : (a.category || 'general');
        results.push({
          title: a.title, description: a.description, url: a.url,
          urlToImage: a.image && a.image !== 'None' ? a.image : null,
          publishedAt: a.published ? new Date(a.published).toISOString() : new Date().toISOString(),
          source: { id: '', name: a.author || 'Currents', country: '' },
          newsCategory: cat === 'general' ? 'general' : cat === 'business' ? 'business' : cat === 'technology' ? 'technology' : cat === 'science' ? 'science' : 'general',
          _src: 'currents',
        });
      }
    } catch (e: any) { console.error('[Currents]', e.message); }
  }));
  return results;
}

async function fetchNewsAPI(apiKey: string, category: string, query: string): Promise<any[]> {
  const results: any[] = [];

  if (query) {
    try {
      const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=50&language=en&apiKey=${apiKey}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      const data = await res.json();
      if (data.articles) results.push(...data.articles.map((a: any) => ({ ...a, newsCategory: 'general', _src: 'newsapi' })));
    } catch (e: any) { console.error('[NewsAPI search]', e.message); }
    return results;
  }

  if (category === 'prophecy') {
    const qs = ['war OR conflict', 'earthquake OR disaster', 'Israel OR Jerusalem', 'famine OR economic collapse'];
    await Promise.all(qs.map(async (q) => {
      try {
        const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&sortBy=publishedAt&pageSize=12&language=en&apiKey=${apiKey}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
        const data = await res.json();
        if (data.articles) results.push(...data.articles.map((a: any) => ({ ...a, newsCategory: 'prophecy', _src: 'newsapi' })));
      } catch {}
    }));
    return results;
  }

  if (category) {
    try {
      const url = `https://newsapi.org/v2/top-headlines?category=${category}&pageSize=30&language=en&apiKey=${apiKey}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      const data = await res.json();
      if (data.articles) results.push(...data.articles.map((a: any) => ({ ...a, newsCategory: category, _src: 'newsapi' })));
    } catch {}
    return results;
  }

  // Global dashboard — optimized: 8 country fetches + 3 consolidated searches = 11 requests
  const countryFetches = [
    { country: 'us', size: 5 }, { country: 'gb', size: 5 },
    { country: 'in', size: 4 }, { country: 'br', size: 4 },
    { country: 'de', size: 3 }, { country: 'fr', size: 3 },
    { country: 'au', size: 3 }, { country: 'il', size: 3 },
  ];
  const warSearches = [
    { q: 'war OR military OR airstrike OR missile OR conflict OR sanctions', size: 15 },
    { q: 'Iran OR Ukraine OR Gaza OR Taiwan OR "South China Sea" OR NATO', size: 12 },
    { q: 'oil OR OPEC OR inflation OR recession OR "central bank" OR BRICS', size: 10 },
  ];

  await Promise.all([
    ...countryFetches.map(async ({ country, size }) => {
      try {
        const url = `https://newsapi.org/v2/top-headlines?country=${country}&pageSize=${size}&apiKey=${apiKey}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
        const data = await res.json();
        if (data.articles) results.push(...data.articles.map((a: any) => ({
          ...a, newsCategory: 'general', source: { ...a.source, country }, _src: 'newsapi',
        })));
      } catch {}
    }),
    ...warSearches.map(async ({ q, size }) => {
      try {
        const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&sortBy=publishedAt&pageSize=${size}&language=en&apiKey=${apiKey}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
        const data = await res.json();
        if (data.articles) results.push(...data.articles.map((a: any) => ({ ...a, newsCategory: 'general', _src: 'newsapi' })));
      } catch {}
    }),
  ]);
  return results;
}

// ─── API Handler ────────────────────────────────────────────────────────────
const CACHE: Record<string, { data: any; ts: number }> = {};
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes — client polls every 60s

export async function GET(req: NextRequest) {
  const newsApiKey = process.env.NEWSAPI_KEY;

  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category') || '';
  const query = searchParams.get('q') || '';

  const cacheKey = `v2:${category}:${query}`;

  // Return cached if fresh
  if (CACHE[cacheKey] && Date.now() - CACHE[cacheKey].ts < CACHE_TTL) {
    return NextResponse.json(CACHE[cacheKey].data);
  }

  try {
    // Fetch from all 3 sources in parallel
    const [gdeltArticles, currentsArticles, newsApiArticles] = await Promise.all([
      category || query ? Promise.resolve([]) : fetchGDELT(),
      category || query ? Promise.resolve([]) : fetchCurrentsAPI(),
      newsApiKey ? fetchNewsAPI(newsApiKey, category, query) : Promise.resolve([]),
    ]);

    const allArticles = [...newsApiArticles, ...currentsArticles, ...gdeltArticles];

    console.log(`[News] Sources: NewsAPI=${newsApiArticles.length}, Currents=${currentsArticles.length}, GDELT=${gdeltArticles.length}, Total raw=${allArticles.length}`);

    // Deduplicate by normalized title
    const seen = new Set<string>();
    const unique = allArticles.filter(a => {
      if (!a.title || a.title === '[Removed]') return false;
      const key = a.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 60);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Enrich with coordinates, sentiment, uk impact
    const enriched = unique.map((article, i) => {
      const sourceId = article.source?.id || '';
      const country = article.source?.country || '';
      const textCountry = extractCountryFromText(article.title || '', article.description || '');
      const countryCode = SOURCE_COUNTRY[sourceId] || (country ? country.toLowerCase() : '') || textCountry || '';
      const coords = getCoords(sourceId, country, article.title, article.description);
      const sentiment = analyzeSentiment(article.title || '', article.description || '');
      const ukImpact = isUkImpact(article.title || '', article.description || '');
      const continent = CONTINENT_MAP[countryCode] || (countryCode ? 'Europe' : '');

      const jitter = () => (Math.random() - 0.5) * 4;
      const prophecyRelated = isProphecyRelated(article.title || '', article.description || '');
      const prophecyRef = getProphecyRef(article.title || '', article.description || '');

      return {
        id: `${article._src || 'news'}-${i}-${Date.now()}`,
        title: article.title,
        description: article.description,
        url: article.url,
        imageUrl: article.urlToImage,
        source: article.source?.name || 'Unknown',
        sourceId,
        publishedAt: article.publishedAt,
        category: article.newsCategory || category || 'general',
        country: countryCode || 'us',
        continent: continent || 'Americas',
        coordinates: coords ? [coords[0] + jitter(), coords[1] + jitter()] : null,
        sentiment,
        ukImpact,
        prophecyRelated,
        prophecyRef,
      };
    });

    // Sort by publishedAt descending (newest first)
    enriched.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    const result = {
      articles: enriched,
      total: enriched.length,
      sources: {
        newsapi: newsApiArticles.length,
        currents: currentsArticles.length,
        gdelt: gdeltArticles.length,
      },
      fetchedAt: new Date().toISOString(),
    };

    CACHE[cacheKey] = { data: result, ts: Date.now() };
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[News API] Error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch news', details: error.message }, { status: 500 });
  }
}
