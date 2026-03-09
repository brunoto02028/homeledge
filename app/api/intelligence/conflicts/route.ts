import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GDELT v2 DOC API — FREE, no key needed
// Fetches conflict/war articles with source country, then maps to coordinates

const CACHE: { data: any; ts: number } = { data: null, ts: 0 };
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

const COUNTRY_COORDS: Record<string, [number, number]> = {
  'United States': [-95.71, 37.09], 'United Kingdom': [-1.17, 52.35],
  'Russia': [105.32, 61.52], 'Ukraine': [31.17, 48.38], 'China': [104.20, 35.86],
  'Israel': [34.85, 31.05], 'Palestine': [35.23, 31.95], 'Iran': [53.69, 32.43],
  'Iraq': [43.68, 33.22], 'Syria': [38.99, 34.80], 'Lebanon': [35.86, 33.85],
  'Yemen': [48.52, 15.55], 'Saudi Arabia': [45.08, 23.89], 'Turkey': [35.24, 38.96],
  'Egypt': [30.80, 26.82], 'Libya': [17.23, 26.34], 'Sudan': [30.22, 12.86],
  'South Sudan': [31.60, 6.88], 'Somalia': [46.20, 5.15], 'Ethiopia': [40.49, 9.15],
  'Nigeria': [8.68, 9.08], 'Congo': [21.76, -4.04], 'Myanmar': [95.96, 21.91],
  'Afghanistan': [67.71, 33.94], 'Pakistan': [69.35, 30.38], 'India': [78.96, 20.59],
  'France': [2.21, 46.60], 'Germany': [10.45, 51.17], 'Poland': [19.15, 51.92],
  'Japan': [138.25, 36.20], 'South Korea': [127.77, 35.91], 'Taiwan': [120.96, 23.70],
  'Brazil': [-51.93, -14.24], 'Mexico': [-102.55, 23.63], 'Colombia': [-74.30, 4.57],
  'Indonesia': [113.92, -0.79], 'Philippines': [121.77, 12.88], 'Thailand': [100.99, 15.87],
  'Australia': [133.78, -25.27], 'Canada': [-106.35, 56.13], 'South Africa': [22.94, -30.56],
  'Morocco': [-7.09, 31.79], 'Algeria': [1.66, 28.03], 'Tunisia': [9.54, 33.89],
  'Jordan': [36.24, 30.59], 'Mozambique': [35.53, -18.67], 'Kenya': [37.91, -1.29],
  'Venezuela': [-66.59, 6.42], 'Cuba': [-77.78, 21.52], 'North Korea': [127.51, 40.34],
  'Italy': [12.57, 41.87], 'Spain': [-3.75, 40.46], 'Greece': [21.82, 39.07],
  'Romania': [24.97, 45.94], 'Bulgaria': [25.49, 42.73], 'Serbia': [21.00, 44.02],
  'Armenia': [44.95, 40.07], 'Azerbaijan': [47.58, 40.14], 'Georgia': [43.36, 42.32],
};

const TITLE_LOCATION_MAP: [string, [number, number]][] = [
  ['gaza', [34.47, 31.50]], ['kyiv', [30.52, 50.45]], ['kharkiv', [36.25, 49.99]],
  ['donbas', [38.00, 48.00]], ['crimea', [34.10, 44.95]], ['odesa', [30.73, 46.48]],
  ['taipei', [121.56, 25.03]], ['tehran', [51.39, 35.69]], ['beirut', [35.50, 33.89]],
  ['damascus', [36.29, 33.51]], ['baghdad', [44.37, 33.31]], ['kabul', [69.17, 34.53]],
  ['moscow', [37.62, 55.76]], ['jerusalem', [35.22, 31.77]], ['rafah', [34.25, 31.30]],
  ['west bank', [35.25, 31.95]], ['aleppo', [37.16, 36.20]], ['red sea', [38.50, 20.00]],
  ['houthi', [44.20, 15.35]], ['south china sea', [114.00, 12.00]], ['horn of africa', [45.00, 8.00]],
  ['sahel', [2.00, 15.00]], ['mogadishu', [45.34, 2.05]], ['khartoum', [32.53, 15.59]],
  ['mariupol', [37.55, 47.10]], ['zaporizhzhia', [35.14, 47.84]], ['belgorod', [36.59, 50.60]],
];

function getConflictCoords(title: string, country: string): [number, number] | null {
  const lower = title.toLowerCase();
  for (const [kw, coords] of TITLE_LOCATION_MAP) {
    if (lower.includes(kw)) return coords;
  }
  if (country && COUNTRY_COORDS[country]) return COUNTRY_COORDS[country];
  return null;
}

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function GET() {
  if (CACHE.data && Date.now() - CACHE.ts < CACHE_TTL) {
    return NextResponse.json(CACHE.data);
  }

  try {
    const allEvents: any[] = [];

    // Single GDELT query to avoid rate-limiting (5s rule)
    try {
      const url = 'https://api.gdeltproject.org/api/v2/doc/doc?query=war+OR+airstrike+OR+missile+OR+conflict+OR+bombing&mode=ArtList&format=json&timespan=24h&maxrecords=120&sourcelang=english';
      const res = await fetch(url, {
        signal: AbortSignal.timeout(15000),
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      if (res.ok) {
        const text = (await res.text()).trim();
        if (text && !text.startsWith('<') && !text.startsWith('Please')) {
          let data;
          try { data = JSON.parse(text); } catch { data = null; }
          if (data) {
            const articles = data.articles || [];
            for (const a of articles) {
              const coords = getConflictCoords(a.title || '', a.sourcecountry || '');
              if (!coords) continue;
              const jitter = () => (Math.random() - 0.5) * 2;
              allEvents.push({
                lat: coords[1] + jitter(),
                lng: coords[0] + jitter(),
                name: a.sourcecountry || 'Unknown',
                count: 1,
                url: a.url || null,
                captionfull: a.title || null,
              });
            }
            console.log(`[Conflicts] GDELT → ${articles.length} articles, ${allEvents.length} geolocated`);
          }
        }
      } else {
        console.log(`[Conflicts] GDELT status ${res.status}`);
      }
    } catch (err: any) {
      console.error(`[Conflicts] GDELT fetch error:`, err.message);
    }

    // Fallback: if GDELT returned nothing, derive conflict zones from news API
    if (allEvents.length === 0) {
      console.log('[Conflicts] GDELT empty, using news fallback');
      try {
        const newsRes = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/news`);
        if (newsRes.ok) {
          const newsData = await newsRes.json();
          const conflictKws = ['war', 'airstrike', 'missile', 'bombing', 'conflict', 'troops', 'military', 'attack', 'killed', 'strike', 'invasion'];
          for (const art of (newsData.articles || [])) {
            const text = `${art.title || ''} ${art.description || ''}`.toLowerCase();
            const isConflict = conflictKws.some(kw => text.includes(kw));
            if (isConflict && art.coordinates) {
              allEvents.push({
                lat: art.coordinates[1],
                lng: art.coordinates[0],
                name: art.country?.toUpperCase() || 'Unknown',
                count: 1,
                url: art.url || null,
                captionfull: art.title || null,
              });
            }
          }
          console.log(`[Conflicts] News fallback → ${allEvents.length} conflict events`);
        }
      } catch (err: any) {
        console.error('[Conflicts] News fallback error:', err.message);
      }
    }

    // Deduplicate by proximity (~50km)
    const merged: any[] = [];
    const used = new Set<number>();

    for (let i = 0; i < allEvents.length; i++) {
      if (used.has(i)) continue;
      const cluster = { ...allEvents[i], eventCount: allEvents[i].count };

      for (let j = i + 1; j < allEvents.length; j++) {
        if (used.has(j)) continue;
        const dist = Math.sqrt(
          Math.pow(allEvents[i].lat - allEvents[j].lat, 2) +
          Math.pow(allEvents[i].lng - allEvents[j].lng, 2)
        );
        if (dist < 0.5) {
          cluster.eventCount += allEvents[j].count;
          if (!cluster.captionfull && allEvents[j].captionfull) cluster.captionfull = allEvents[j].captionfull;
          used.add(j);
        }
      }

      merged.push(cluster);
      used.add(i);
    }

    merged.sort((a, b) => b.eventCount - a.eventCount);

    const result = {
      conflicts: merged.slice(0, 200),
      total: merged.length,
      fetchedAt: new Date().toISOString(),
    };

    CACHE.data = result;
    CACHE.ts = Date.now();

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[Conflicts API] Error:', error.message);
    return NextResponse.json({ conflicts: [], total: 0, error: error.message }, { status: 200 });
  }
}
