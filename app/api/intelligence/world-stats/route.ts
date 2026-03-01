import { NextResponse } from 'next/server';

// REST Countries API (free, no key) + World Bank API (free, no key)

const CACHE: { data: any; ts: number } = { data: null, ts: 0 };
const CACHE_TTL = 60 * 60 * 1000; // 1 hour (demographics don't change fast)

interface CountryData {
  name: string;
  code: string;
  population: number;
  area: number;
  region: string;
  subregion: string;
  capital: string;
  languages: string[];
  currencies: string[];
  flag: string;
}

export async function GET() {
  if (CACHE.data && Date.now() - CACHE.ts < CACHE_TTL) {
    return NextResponse.json(CACHE.data);
  }

  try {
    // Fetch from REST Countries API
    const res = await fetch(
      'https://restcountries.com/v3.1/all?fields=name,cca2,population,area,region,subregion,capital,languages,currencies,flag',
      { signal: AbortSignal.timeout(10000) }
    );

    if (!res.ok) throw new Error(`REST Countries API: ${res.status}`);
    const countries = await res.json();

    const processed: CountryData[] = countries.map((c: any) => ({
      name: c.name?.common || '',
      code: c.cca2 || '',
      population: c.population || 0,
      area: c.area || 0,
      region: c.region || '',
      subregion: c.subregion || '',
      capital: c.capital?.[0] || '',
      languages: c.languages ? Object.values(c.languages) : [],
      currencies: c.currencies ? Object.keys(c.currencies) : [],
      flag: c.flag || '',
    }));

    // Compute aggregates
    const worldPop = processed.reduce((s, c) => s + c.population, 0);
    const totalArea = processed.reduce((s, c) => s + c.area, 0);

    const regionStats: Record<string, { countries: number; population: number }> = {};
    processed.forEach(c => {
      if (!regionStats[c.region]) regionStats[c.region] = { countries: 0, population: 0 };
      regionStats[c.region].countries++;
      regionStats[c.region].population += c.population;
    });

    const top15byPop = [...processed]
      .sort((a, b) => b.population - a.population)
      .slice(0, 15)
      .map(c => ({
        name: c.name,
        code: c.code,
        flag: c.flag,
        population: c.population,
        capital: c.capital,
      }));

    const top10byArea = [...processed]
      .sort((a, b) => b.area - a.area)
      .slice(0, 10)
      .map(c => ({
        name: c.name,
        code: c.code,
        flag: c.flag,
        area: c.area,
      }));

    // Try to fetch World Bank GDP data (latest available year)
    let gdpData: any[] = [];
    try {
      const gdpRes = await fetch(
        'https://api.worldbank.org/v2/country/all/indicator/NY.GDP.MKTP.CD?format=json&per_page=300&date=2023&mrv=1',
        { signal: AbortSignal.timeout(8000) }
      );
      if (gdpRes.ok) {
        const gdpJson = await gdpRes.json();
        if (gdpJson[1]) {
          gdpData = gdpJson[1]
            .filter((d: any) => d.value && d.countryiso3code && d.countryiso3code.length === 3)
            .sort((a: any, b: any) => (b.value || 0) - (a.value || 0))
            .slice(0, 15)
            .map((d: any) => ({
              country: d.country?.value || '',
              code: d.countryiso3code,
              gdp: d.value,
              year: d.date,
            }));
        }
      }
    } catch {
      // GDP data is optional
    }

    const result = {
      worldPopulation: worldPop,
      totalCountries: processed.length,
      totalArea,
      regionStats,
      top15byPopulation: top15byPop,
      top10byArea,
      topGDP: gdpData,
      fetchedAt: new Date().toISOString(),
    };

    CACHE.data = result;
    CACHE.ts = Date.now();

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[World Stats API] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
