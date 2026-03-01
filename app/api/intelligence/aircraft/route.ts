import { NextResponse } from 'next/server';

// OpenSky Network API - FREE, no key needed
// Returns aircraft positions worldwide
// Anonymous rate limit: ~10 req/min, we cache for 2 minutes

const CACHE: { data: any; ts: number } = { data: null, ts: 0 };
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

// Military callsign prefixes (common patterns)
const MILITARY_PREFIXES = [
  'RCH', 'REACH', 'FORTE', 'JAKE', 'RRR', 'DUKE', 'VIPER', 'TIGER',
  'NAVY', 'ARMY', 'USAF', 'RAF', 'IAF', 'PAF', 'RSAF', 'FAB',
  'MAGMA', 'HOMER', 'NCHO', 'EVAC', 'SPAR', 'SAM', 'EXEC',
  'TOPCAT', 'COBRA', 'STORM', 'HAWK', 'EAGLE', 'RAVEN', 'WOLF',
  'CVN', 'DDG', 'CG', 'LHA', 'LHD', 'MCM',
  'NATO', 'MMF', 'CNV', 'ASCOT', 'KITTY', 'NINJA',
];

// Military country origins (countries with active military operations)
const MILITARY_COUNTRIES = [
  'United States', 'Russia', 'China', 'United Kingdom', 'France',
  'Israel', 'Turkey', 'India', 'Saudi Arabia', 'Iran',
  'South Korea', 'Japan', 'Australia', 'Germany', 'Italy',
];

// Zones: [lamin, lomin, lamax, lomax]
// "military" zones filter for military-only; "all" zones show all aircraft (sampled)
const ZONES = [
  // Conflict/military zones — filter for military only
  { name: 'Middle East', box: [12, 25, 42, 65], mode: 'military' as const },
  { name: 'Ukraine', box: [44, 22, 53, 40], mode: 'military' as const },
  // Global civilian + military — show ALL aircraft (visually impressive)
  { name: 'US East', box: [25, -90, 48, -65], mode: 'all' as const },
  { name: 'US West', box: [30, -125, 50, -95], mode: 'all' as const },
  { name: 'Brazil', box: [-33, -74, 5, -34], mode: 'all' as const },
  { name: 'UK & Ireland', box: [49, -11, 60, 2], mode: 'all' as const },
  { name: 'W. Europe', box: [36, -10, 52, 15], mode: 'all' as const },
  { name: 'Central Europe', box: [45, 5, 55, 25], mode: 'all' as const },
  { name: 'East Asia', box: [20, 100, 45, 145], mode: 'all' as const },
  { name: 'Africa', box: [-35, -18, 15, 52], mode: 'all' as const },
  { name: 'India', box: [8, 68, 35, 90], mode: 'all' as const },
  { name: 'Australia', box: [-45, 110, -10, 155], mode: 'all' as const },
];

function isMilitaryCallsign(callsign: string): boolean {
  if (!callsign) return false;
  const cs = callsign.trim().toUpperCase();
  return MILITARY_PREFIXES.some(p => cs.startsWith(p));
}

export async function GET() {
  if (CACHE.data && Date.now() - CACHE.ts < CACHE_TTL) {
    return NextResponse.json(CACHE.data);
  }

  try {
    const allAircraft: any[] = [];

    // Fetch aircraft from all zones in parallel
    const fetches = ZONES.map(async (zone) => {
      const url = `https://opensky-network.org/api/states/all?lamin=${zone.box[0]}&lomin=${zone.box[1]}&lamax=${zone.box[2]}&lomax=${zone.box[3]}`;
      try {
        const res = await fetch(url, {
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(10000),
        });
        if (!res.ok) return [];
        const data = await res.json();
        if (!data.states) return [];

        let states = data.states.filter((s: any[]) => {
          const lng = s[5];
          const lat = s[6];
          const onGround = s[8];
          if (onGround || !lng || !lat) return false;
          return true;
        });

        if (zone.mode === 'military') {
          // Conflict zones: only military callsigns or military countries
          states = states.filter((s: any[]) => {
            const callsign = s[1]?.trim() || '';
            const country = s[2] || '';
            return isMilitaryCallsign(callsign) || MILITARY_COUNTRIES.includes(country);
          });
        } else {
          // Global zones: sample to keep it manageable — take every Nth aircraft
          // so the map looks full but we don't send thousands
          const maxPerZone = 60;
          if (states.length > maxPerZone) {
            const step = Math.ceil(states.length / maxPerZone);
            states = states.filter((_: any, i: number) => i % step === 0);
          }
        }

        return states.map((s: any[]) => ({
          icao24: s[0],
          callsign: s[1]?.trim() || '',
          country: s[2],
          lng: s[5],
          lat: s[6],
          altitude: s[7] ? Math.round(s[7]) : null,
          velocity: s[9] ? Math.round(s[9] * 3.6) : null,
          heading: s[10] ? Math.round(s[10]) : null,
          zone: zone.name,
          military: isMilitaryCallsign(s[1]?.trim() || ''),
        }));
      } catch {
        return [];
      }
    });

    const results = await Promise.all(fetches);
    results.forEach(r => allAircraft.push(...r));

    // Deduplicate by icao24
    const seen = new Set<string>();
    const unique = allAircraft.filter(a => {
      if (seen.has(a.icao24)) return false;
      seen.add(a.icao24);
      return true;
    });

    // Sort: military first, then by altitude
    const sorted = unique.sort((a, b) => {
      if (a.military !== b.military) return b.military ? 1 : -1;
      return (b.altitude || 0) - (a.altitude || 0);
    });

    const result = {
      aircraft: sorted.slice(0, 500),
      total: sorted.length,
      zones: ZONES.map(z => z.name),
      fetchedAt: new Date().toISOString(),
    };

    CACHE.data = result;
    CACHE.ts = Date.now();

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[Aircraft API] Error:', error.message);
    return NextResponse.json({ aircraft: [], total: 0, error: error.message }, { status: 200 });
  }
}
