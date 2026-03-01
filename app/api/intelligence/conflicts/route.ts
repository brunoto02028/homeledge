import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GDELT Project API - 100% FREE, no key needed
// Global Database of Events, Language, and Tone
// Returns geolocated conflict/war events worldwide

const CACHE: { data: any; ts: number } = { data: null, ts: 0 };
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

export async function GET() {
  if (CACHE.data && Date.now() - CACHE.ts < CACHE_TTL) {
    return NextResponse.json(CACHE.data);
  }

  try {
    // GDELT GEO API — returns GeoJSON of geolocated events
    const queries = ['war', 'airstrike', 'missile'];
    const allEvents: any[] = [];

    // Fetch sequentially to avoid GDELT rate limiting
    for (const q of queries) {
      try {
        const url = `https://api.gdeltproject.org/api/v2/geo/geo?query=${encodeURIComponent(q)}&format=GeoJSON&timespan=24h&maxpoints=60`;
        console.log(`[Conflicts] Fetching GDELT: ${q}`);
        const res = await fetch(url, {
          signal: AbortSignal.timeout(15000),
          headers: { 'User-Agent': 'Mozilla/5.0 HomeledgerIntel/1.0' },
        });
        console.log(`[Conflicts] ${q} status: ${res.status}`);
        if (!res.ok) { console.log(`[Conflicts] ${q} not ok`); continue; }
        const text = (await res.text()).trim();
        console.log(`[Conflicts] ${q} response length: ${text.length}, starts: ${text.substring(0, 40)}`);
        if (!text || text.startsWith('<')) continue;
        let data;
        try { data = JSON.parse(text); } catch (e) { console.log(`[Conflicts] ${q} parse error:`, e); continue; }
        const features = (data.features || []).map((f: any) => ({
          lat: f.geometry?.coordinates?.[1],
          lng: f.geometry?.coordinates?.[0],
          name: f.properties?.name || 'Unknown Location',
          count: f.properties?.count || 1,
          shareimage: f.properties?.shareimage || null,
          url: f.properties?.url || null,
          captionfull: f.properties?.captionfull || null,
        })).filter((e: any) => e.lat && e.lng);
        console.log(`[Conflicts] ${q} got ${features.length} features`);
        allEvents.push(...features);
      } catch (err: any) {
        console.error(`[Conflicts] ${q} fetch error:`, err.message);
      }
    }

    // Deduplicate by proximity (combine events within ~50km)
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
        if (dist < 0.5) { // ~50km
          cluster.eventCount += allEvents[j].count;
          used.add(j);
        }
      }

      merged.push(cluster);
      used.add(i);
    }

    // Sort by event count (hotspots first)
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
