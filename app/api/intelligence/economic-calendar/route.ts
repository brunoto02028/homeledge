import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Economic Calendar — aggregates from free sources
// 1. Trading Economics concept data (curated key events)
// 2. Central bank rate decisions
// 3. Major economic indicators

const CACHE: { data: any; ts: number } = { data: null, ts: 0 };
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

interface EconomicEvent {
  id: string;
  date: string;
  time: string;
  country: string;
  countryCode: string;
  event: string;
  impact: 'high' | 'medium' | 'low';
  category: string;
  previous?: string;
  forecast?: string;
  actual?: string;
  description?: string;
}

// Central bank meeting dates (2025-2026)
const CENTRAL_BANK_EVENTS: Omit<EconomicEvent, 'id'>[] = [
  // Federal Reserve (FOMC)
  { date: '2026-03-18', time: '18:00', country: 'United States', countryCode: 'US', event: 'FOMC Interest Rate Decision', impact: 'high', category: 'central_bank', description: 'Federal Reserve monetary policy decision' },
  { date: '2026-05-06', time: '18:00', country: 'United States', countryCode: 'US', event: 'FOMC Interest Rate Decision', impact: 'high', category: 'central_bank', description: 'Federal Reserve monetary policy decision' },
  { date: '2026-06-17', time: '18:00', country: 'United States', countryCode: 'US', event: 'FOMC Interest Rate Decision', impact: 'high', category: 'central_bank', description: 'Federal Reserve monetary policy decision' },
  { date: '2026-07-29', time: '18:00', country: 'United States', countryCode: 'US', event: 'FOMC Interest Rate Decision', impact: 'high', category: 'central_bank', description: 'Federal Reserve monetary policy decision' },

  // European Central Bank (ECB)
  { date: '2026-03-06', time: '13:15', country: 'Eurozone', countryCode: 'EU', event: 'ECB Interest Rate Decision', impact: 'high', category: 'central_bank', description: 'ECB monetary policy decision' },
  { date: '2026-04-17', time: '13:15', country: 'Eurozone', countryCode: 'EU', event: 'ECB Interest Rate Decision', impact: 'high', category: 'central_bank', description: 'ECB monetary policy decision' },
  { date: '2026-06-05', time: '13:15', country: 'Eurozone', countryCode: 'EU', event: 'ECB Interest Rate Decision', impact: 'high', category: 'central_bank', description: 'ECB monetary policy decision' },

  // Bank of England (BoE)
  { date: '2026-03-20', time: '12:00', country: 'United Kingdom', countryCode: 'GB', event: 'BoE Interest Rate Decision', impact: 'high', category: 'central_bank', description: 'Bank of England MPC decision' },
  { date: '2026-05-08', time: '12:00', country: 'United Kingdom', countryCode: 'GB', event: 'BoE Interest Rate Decision', impact: 'high', category: 'central_bank', description: 'Bank of England MPC decision' },
  { date: '2026-06-19', time: '12:00', country: 'United Kingdom', countryCode: 'GB', event: 'BoE Interest Rate Decision', impact: 'high', category: 'central_bank', description: 'Bank of England MPC decision' },
  { date: '2026-08-06', time: '12:00', country: 'United Kingdom', countryCode: 'GB', event: 'BoE Interest Rate Decision', impact: 'high', category: 'central_bank', description: 'Bank of England MPC decision' },

  // Bank of Japan (BoJ)
  { date: '2026-03-14', time: '03:00', country: 'Japan', countryCode: 'JP', event: 'BoJ Interest Rate Decision', impact: 'high', category: 'central_bank', description: 'Bank of Japan monetary policy' },
  { date: '2026-04-28', time: '03:00', country: 'Japan', countryCode: 'JP', event: 'BoJ Interest Rate Decision', impact: 'high', category: 'central_bank', description: 'Bank of Japan monetary policy' },
  { date: '2026-06-16', time: '03:00', country: 'Japan', countryCode: 'JP', event: 'BoJ Interest Rate Decision', impact: 'high', category: 'central_bank', description: 'Bank of Japan monetary policy' },

  // People's Bank of China (PBoC)
  { date: '2026-03-20', time: '01:30', country: 'China', countryCode: 'CN', event: 'PBoC Loan Prime Rate', impact: 'high', category: 'central_bank', description: "People's Bank of China rate" },
  { date: '2026-04-20', time: '01:30', country: 'China', countryCode: 'CN', event: 'PBoC Loan Prime Rate', impact: 'high', category: 'central_bank', description: "People's Bank of China rate" },

  // Reserve Bank of Australia
  { date: '2026-04-01', time: '04:30', country: 'Australia', countryCode: 'AU', event: 'RBA Interest Rate Decision', impact: 'high', category: 'central_bank', description: 'Reserve Bank of Australia' },

  // Reserve Bank of India
  { date: '2026-04-09', time: '04:00', country: 'India', countryCode: 'IN', event: 'RBI Interest Rate Decision', impact: 'high', category: 'central_bank', description: 'Reserve Bank of India' },

  // Central Bank of Brazil
  { date: '2026-03-19', time: '21:00', country: 'Brazil', countryCode: 'BR', event: 'BCB Selic Rate Decision', impact: 'high', category: 'central_bank', description: 'Banco Central do Brasil' },
  { date: '2026-05-07', time: '21:00', country: 'Brazil', countryCode: 'BR', event: 'BCB Selic Rate Decision', impact: 'high', category: 'central_bank', description: 'Banco Central do Brasil' },

  // Bank of Canada
  { date: '2026-03-12', time: '14:45', country: 'Canada', countryCode: 'CA', event: 'BoC Interest Rate Decision', impact: 'high', category: 'central_bank', description: 'Bank of Canada' },
  { date: '2026-04-16', time: '14:45', country: 'Canada', countryCode: 'CA', event: 'BoC Interest Rate Decision', impact: 'high', category: 'central_bank', description: 'Bank of Canada' },

  // Swiss National Bank
  { date: '2026-03-20', time: '08:30', country: 'Switzerland', countryCode: 'CH', event: 'SNB Interest Rate Decision', impact: 'high', category: 'central_bank', description: 'Swiss National Bank' },
  { date: '2026-06-18', time: '08:30', country: 'Switzerland', countryCode: 'CH', event: 'SNB Interest Rate Decision', impact: 'high', category: 'central_bank', description: 'Swiss National Bank' },

  // Central Bank of Turkey
  { date: '2026-03-20', time: '11:00', country: 'Turkey', countryCode: 'TR', event: 'TCMB Interest Rate Decision', impact: 'high', category: 'central_bank', description: 'Central Bank of Turkey' },

  // South African Reserve Bank
  { date: '2026-03-27', time: '13:00', country: 'South Africa', countryCode: 'ZA', event: 'SARB Interest Rate Decision', impact: 'high', category: 'central_bank', description: 'South African Reserve Bank' },
];

// Recurring economic indicators (generated dynamically based on current month)
function generateRecurringEvents(): Omit<EconomicEvent, 'id'>[] {
  const now = new Date();
  const events: Omit<EconomicEvent, 'id'>[] = [];
  
  // Generate for current month and next 2 months
  for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
    const d = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');

    // US Non-Farm Payrolls (first Friday of month)
    const firstFriday = getFirstWeekdayOfMonth(year, d.getMonth(), 5);
    events.push({
      date: `${year}-${month}-${String(firstFriday).padStart(2, '0')}`,
      time: '13:30', country: 'United States', countryCode: 'US',
      event: 'Non-Farm Payrolls', impact: 'high', category: 'employment',
      description: 'US employment change, key market mover',
    });

    // US CPI (around 12th-14th)
    events.push({
      date: `${year}-${month}-12`,
      time: '13:30', country: 'United States', countryCode: 'US',
      event: 'CPI (Inflation)', impact: 'high', category: 'inflation',
      description: 'Consumer Price Index — key inflation gauge',
    });

    // US GDP (end of month)
    events.push({
      date: `${year}-${month}-28`,
      time: '13:30', country: 'United States', countryCode: 'US',
      event: 'GDP Growth Rate', impact: 'high', category: 'gdp',
      description: 'Gross Domestic Product quarterly estimate',
    });

    // UK CPI
    events.push({
      date: `${year}-${month}-15`,
      time: '07:00', country: 'United Kingdom', countryCode: 'GB',
      event: 'CPI (Inflation)', impact: 'high', category: 'inflation',
      description: 'UK Consumer Price Index',
    });

    // UK GDP
    events.push({
      date: `${year}-${month}-13`,
      time: '07:00', country: 'United Kingdom', countryCode: 'GB',
      event: 'GDP Growth Rate', impact: 'high', category: 'gdp',
      description: 'UK Gross Domestic Product',
    });

    // UK Employment
    events.push({
      date: `${year}-${month}-18`,
      time: '07:00', country: 'United Kingdom', countryCode: 'GB',
      event: 'Employment Change', impact: 'medium', category: 'employment',
      description: 'UK labour market data',
    });

    // Eurozone CPI
    events.push({
      date: `${year}-${month}-02`,
      time: '10:00', country: 'Eurozone', countryCode: 'EU',
      event: 'CPI Flash Estimate', impact: 'high', category: 'inflation',
      description: 'Eurozone inflation preliminary',
    });

    // China PMI
    events.push({
      date: `${year}-${month}-01`,
      time: '01:30', country: 'China', countryCode: 'CN',
      event: 'Manufacturing PMI', impact: 'high', category: 'manufacturing',
      description: 'China manufacturing purchasing managers index',
    });

    // China GDP (quarterly)
    if (d.getMonth() % 3 === 0) {
      events.push({
        date: `${year}-${month}-17`,
        time: '02:00', country: 'China', countryCode: 'CN',
        event: 'GDP Growth Rate', impact: 'high', category: 'gdp',
        description: 'China quarterly GDP',
      });
    }

    // Japan GDP (quarterly)
    if (d.getMonth() % 3 === 1) {
      events.push({
        date: `${year}-${month}-14`,
        time: '23:50', country: 'Japan', countryCode: 'JP',
        event: 'GDP Growth Rate', impact: 'medium', category: 'gdp',
        description: 'Japan quarterly GDP',
      });
    }

    // Brazil IPCA (inflation)
    events.push({
      date: `${year}-${month}-10`,
      time: '12:00', country: 'Brazil', countryCode: 'BR',
      event: 'IPCA Inflation', impact: 'high', category: 'inflation',
      description: 'Brazilian consumer price index',
    });

    // India CPI
    events.push({
      date: `${year}-${month}-12`,
      time: '12:00', country: 'India', countryCode: 'IN',
      event: 'CPI (Inflation)', impact: 'medium', category: 'inflation',
      description: 'India consumer price index',
    });

    // Germany PMI
    events.push({
      date: `${year}-${month}-22`,
      time: '08:30', country: 'Germany', countryCode: 'DE',
      event: 'Manufacturing PMI', impact: 'medium', category: 'manufacturing',
      description: 'Germany manufacturing PMI flash',
    });

    // US Retail Sales
    events.push({
      date: `${year}-${month}-16`,
      time: '13:30', country: 'United States', countryCode: 'US',
      event: 'Retail Sales', impact: 'medium', category: 'consumer',
      description: 'US monthly retail sales',
    });

    // OPEC Meeting (roughly quarterly)
    if (d.getMonth() % 3 === 0) {
      events.push({
        date: `${year}-${month}-05`,
        time: '10:00', country: 'International', countryCode: 'OPEC',
        event: 'OPEC+ Meeting', impact: 'high', category: 'energy',
        description: 'OPEC+ production decision — affects oil prices globally',
      });
    }

    // G7/G20 summits (approximate)
    if (d.getMonth() === 5) { // June
      events.push({
        date: `${year}-06-15`,
        time: '09:00', country: 'International', countryCode: 'G7',
        event: 'G7 Summit', impact: 'high', category: 'geopolitical',
        description: 'Group of Seven leaders meeting',
      });
    }
    if (d.getMonth() === 10) { // November
      events.push({
        date: `${year}-11-15`,
        time: '09:00', country: 'International', countryCode: 'G20',
        event: 'G20 Summit', impact: 'high', category: 'geopolitical',
        description: 'Group of Twenty leaders meeting',
      });
    }

    // South Africa CPI
    events.push({
      date: `${year}-${month}-20`,
      time: '08:00', country: 'South Africa', countryCode: 'ZA',
      event: 'CPI (Inflation)', impact: 'medium', category: 'inflation',
      description: 'South Africa consumer prices',
    });

    // Mexico CPI
    events.push({
      date: `${year}-${month}-09`,
      time: '12:00', country: 'Mexico', countryCode: 'MX',
      event: 'CPI (Inflation)', impact: 'medium', category: 'inflation',
      description: 'Mexico consumer prices',
    });

    // Argentina CPI
    events.push({
      date: `${year}-${month}-14`,
      time: '18:00', country: 'Argentina', countryCode: 'AR',
      event: 'CPI (Inflation)', impact: 'medium', category: 'inflation',
      description: 'Argentina consumer prices — hyperinflation tracker',
    });

    // Russia CPI
    events.push({
      date: `${year}-${month}-08`,
      time: '04:00', country: 'Russia', countryCode: 'RU',
      event: 'CPI (Inflation)', impact: 'medium', category: 'inflation',
      description: 'Russia consumer prices',
    });

    // Nigeria CPI
    events.push({
      date: `${year}-${month}-15`,
      time: '09:00', country: 'Nigeria', countryCode: 'NG',
      event: 'CPI (Inflation)', impact: 'low', category: 'inflation',
      description: 'Nigeria consumer prices',
    });

    // Australia Employment
    events.push({
      date: `${year}-${month}-20`,
      time: '00:30', country: 'Australia', countryCode: 'AU',
      event: 'Employment Change', impact: 'medium', category: 'employment',
      description: 'Australia labour market data',
    });

    // Canada Employment
    events.push({
      date: `${year}-${month}-${String(firstFriday).padStart(2, '0')}`,
      time: '13:30', country: 'Canada', countryCode: 'CA',
      event: 'Employment Change', impact: 'medium', category: 'employment',
      description: 'Canada labour market data',
    });
  }

  return events;
}

function getFirstWeekdayOfMonth(year: number, month: number, dayOfWeek: number): number {
  const d = new Date(year, month, 1);
  while (d.getDay() !== dayOfWeek) d.setDate(d.getDate() + 1);
  return d.getDate();
}

const CATEGORY_ICONS: Record<string, string> = {
  central_bank: '🏦',
  inflation: '📈',
  employment: '👷',
  gdp: '📊',
  manufacturing: '🏭',
  consumer: '🛒',
  energy: '⛽',
  geopolitical: '🌍',
};

const COUNTRY_FLAGS: Record<string, string> = {
  US: '🇺🇸', GB: '🇬🇧', EU: '🇪🇺', JP: '🇯🇵', CN: '🇨🇳', AU: '🇦🇺',
  IN: '🇮🇳', BR: '🇧🇷', CA: '🇨🇦', CH: '🇨🇭', TR: '🇹🇷', ZA: '🇿🇦',
  DE: '🇩🇪', MX: '🇲🇽', AR: '🇦🇷', RU: '🇷🇺', NG: '🇳🇬', KR: '🇰🇷',
  OPEC: '🛢️', G7: '🌐', G20: '🌐',
};

export async function GET() {
  if (CACHE.data && Date.now() - CACHE.ts < CACHE_TTL) {
    return NextResponse.json(CACHE.data);
  }

  try {
    const recurring = generateRecurringEvents();
    const allEvents = [...CENTRAL_BANK_EVENTS, ...recurring];

    // Assign IDs and enrich
    const enriched: EconomicEvent[] = allEvents.map((e, i) => ({
      ...e,
      id: `econ-${i}-${e.date}-${e.countryCode}`,
    }));

    // Sort by date
    enriched.sort((a, b) => {
      const da = new Date(`${a.date}T${a.time}:00Z`).getTime();
      const db = new Date(`${b.date}T${b.time}:00Z`).getTime();
      return da - db;
    });

    // Separate into past, today, upcoming
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    const past = enriched.filter(e => e.date < todayStr).slice(-20); // last 20
    const today = enriched.filter(e => e.date === todayStr);
    const upcoming = enriched.filter(e => e.date > todayStr).slice(0, 60); // next 60

    // Count by impact
    const highImpact = upcoming.filter(e => e.impact === 'high').length;
    const thisWeek = upcoming.filter(e => {
      const diff = new Date(e.date).getTime() - now.getTime();
      return diff <= 7 * 86400000;
    }).length;

    const result = {
      events: [...past, ...today, ...upcoming],
      today,
      upcoming,
      past,
      summary: {
        total: enriched.length,
        todayCount: today.length,
        upcomingCount: upcoming.length,
        highImpactUpcoming: highImpact,
        thisWeek,
      },
      categoryIcons: CATEGORY_ICONS,
      countryFlags: COUNTRY_FLAGS,
      fetchedAt: new Date().toISOString(),
    };

    CACHE.data = result;
    CACHE.ts = Date.now();

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[Economic Calendar API] Error:', error.message);
    return NextResponse.json({ events: [], summary: {}, error: error.message }, { status: 200 });
  }
}
