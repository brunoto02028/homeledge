import { NextResponse } from 'next/server';

// USGS Earthquake Hazards API - 100% FREE, no key needed
// https://earthquake.usgs.gov/fdsnws/event/1/

const CACHE: { data: any; ts: number } = { data: null, ts: 0 };
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes for live feel

export async function GET() {
  if (CACHE.data && Date.now() - CACHE.ts < CACHE_TTL) {
    return NextResponse.json(CACHE.data);
  }

  try {
    // Fetch: significant (7d) + M4.5+ (1d) + M2.5+ (1d) + M1.0+ (1h)
    const [significant, m45day, m25day, m1hour] = await Promise.all([
      fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_week.geojson', {
        signal: AbortSignal.timeout(8000),
      }).then(r => r.json()).catch(() => ({ features: [] })),
      fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson', {
        signal: AbortSignal.timeout(8000),
      }).then(r => r.json()).catch(() => ({ features: [] })),
      fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson', {
        signal: AbortSignal.timeout(8000),
      }).then(r => r.json()).catch(() => ({ features: [] })),
      fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/1.0_hour.geojson', {
        signal: AbortSignal.timeout(8000),
      }).then(r => r.json()).catch(() => ({ features: [] })),
    ]);

    const seen = new Set<string>();
    const allQuakes = [
      ...(significant.features || []),
      ...(m45day.features || []),
      ...(m25day.features || []),
      ...(m1hour.features || []),
    ]
      .filter((f: any) => {
        if (seen.has(f.id)) return false;
        seen.add(f.id);
        return true;
      })
      .map((f: any) => ({
        id: f.id,
        magnitude: f.properties.mag,
        place: f.properties.place,
        time: f.properties.time,
        url: f.properties.url,
        tsunami: f.properties.tsunami,
        alert: f.properties.alert,
        felt: f.properties.felt,       // number of felt reports
        cdi: f.properties.cdi,         // community decimal intensity
        mmi: f.properties.mmi,         // max modified mercalli intensity
        sig: f.properties.sig,         // significance 0-1000
        status: f.properties.status,   // reviewed, automatic
        type: f.properties.type,
        lng: f.geometry.coordinates[0],
        lat: f.geometry.coordinates[1],
        depth: f.geometry.coordinates[2],
      }))
      .sort((a: any, b: any) => b.time - a.time);

    const result = {
      earthquakes: allQuakes,
      total: allQuakes.length,
      significant: significant.features?.length || 0,
      fetchedAt: new Date().toISOString(),
    };

    CACHE.data = result;
    CACHE.ts = Date.now();

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[Earthquakes API] Error:', error.message);
    return NextResponse.json({ earthquakes: [], total: 0 }, { status: 200 });
  }
}
