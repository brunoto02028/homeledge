import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';

// GET /api/postcode-lookup?postcode=SW1A1AA — Lookup addresses by UK postcode
// 3-layer approach:
//   1. postcodes.io — validation + admin area (city, county, country) + lat/lon
//   2. Nominatim (OpenStreetMap) — street-level search by postcode
//   3. Overpass API — fallback: finds all named roads within 500m of postcode centre
export async function GET(request: Request) {
  try {
    await requireUserId();
    const { searchParams } = new URL(request.url);
    const postcode = searchParams.get('postcode')?.trim().replace(/\s+/g, '');

    if (!postcode || postcode.length < 5) {
      return NextResponse.json({ error: 'Valid UK postcode required' }, { status: 400 });
    }

    // ── Step 1: postcodes.io — validate + admin data + coordinates ──
    const pcRes = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`, {
      signal: AbortSignal.timeout(8000),
    });

    if (!pcRes.ok) {
      if (pcRes.status === 404) {
        return NextResponse.json({ error: 'Postcode not found', addresses: [] }, { status: 404 });
      }
      throw new Error(`Postcode API error: ${pcRes.status}`);
    }

    const pcData = await pcRes.json();
    const result = pcData.result;

    if (!result) {
      return NextResponse.json({ error: 'Invalid postcode', addresses: [] }, { status: 404 });
    }

    const postcodeFormatted = result.postcode;
    const adminCity = result.admin_district || result.parliamentary_constituency || '';
    const region = result.region || '';
    const country = result.country || 'England';
    const ward = result.admin_ward || '';
    const parish = result.parish || '';
    const lat = result.latitude;
    const lon = result.longitude;

    // ── Step 2: Nominatim — street-level search by postcode ──
    const addresses: any[] = [];
    const seenKeys = new Set<string>();

    try {
      const nomRes = await fetch(
        `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(postcodeFormatted)}&countrycodes=gb&format=json&addressdetails=1&limit=30`,
        {
          headers: { 'User-Agent': 'HomeLedger/1.0 (https://homeledger.co.uk)' },
          signal: AbortSignal.timeout(8000),
        }
      );

      if (nomRes.ok) {
        const nomResults = await nomRes.json();
        for (const place of nomResults) {
          const addr = place.address || {};
          const road = addr.road || addr.pedestrian || addr.footway || addr.cycleway || '';
          if (!road) continue;
          const village = addr.village || addr.hamlet || addr.suburb || addr.neighbourhood || '';
          const town = addr.town || addr.city || village || adminCity;
          const houseNumber = addr.house_number || '';
          const building = addr.building || addr.amenity || addr.shop || '';
          const key = `${road.toLowerCase()}_${houseNumber}`;
          if (seenKeys.has(key)) continue;
          seenKeys.add(key);

          const addressLine1 = houseNumber ? `${houseNumber} ${road}` : road;
          const addressLine2 = village && village !== town ? village : '';
          const premises = building || '';
          const labelParts = [premises, addressLine1, addressLine2, town, postcodeFormatted].filter(Boolean);

          addresses.push({
            addressLine1, addressLine2, premises,
            city: town || adminCity,
            region: addr.state || region,
            postcode: postcodeFormatted,
            country: mapCountry(addr.country || country),
            label: labelParts.join(', '),
          });
        }
      }
    } catch (nomErr) {
      console.error('[Postcode Lookup] Nominatim error (non-fatal):', nomErr);
    }

    // ── Step 3: Overpass API — find named roads + addressed buildings near postcode ──
    if (addresses.length === 0 && lat && lon) {
      try {
        // Query roads (800m) AND buildings with house numbers (800m)
        const overpassQuery = `[out:json][timeout:12];(way["highway"]["name"](around:800,${lat},${lon});node["addr:housenumber"](around:800,${lat},${lon});way["addr:housenumber"](around:800,${lat},${lon}););out tags;`;
        const ovRes = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          body: `data=${encodeURIComponent(overpassQuery)}`,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          signal: AbortSignal.timeout(14000),
        });

        if (ovRes.ok) {
          const ovData = await ovRes.json();
          const roadNames = new Set<string>();
          const village = parish?.replace(/ CP$/, '') || ward || '';
          const addressLine2 = village && village !== adminCity ? village : '';

          // First pass: collect individual addressed buildings
          for (const el of (ovData.elements || [])) {
            const tags = el.tags || {};
            if (tags['addr:housenumber'] && tags['addr:street']) {
              const hn = tags['addr:housenumber'];
              const street = tags['addr:street'];
              const key = `${hn}_${street.toLowerCase()}`;
              if (seenKeys.has(key)) continue;
              seenKeys.add(key);
              roadNames.add(street.toLowerCase());

              const buildingName = tags.name || tags['addr:housename'] || '';
              const labelParts = [buildingName, `${hn} ${street}`, addressLine2, adminCity, postcodeFormatted].filter(Boolean);

              addresses.push({
                addressLine1: `${hn} ${street}`,
                addressLine2,
                premises: buildingName,
                city: tags['addr:city'] || adminCity,
                region,
                postcode: tags['addr:postcode'] || postcodeFormatted,
                country: mapCountry(country),
                label: labelParts.join(', '),
              });
            }
          }

          // Second pass: collect road names not already covered by buildings
          for (const el of (ovData.elements || [])) {
            const name = el.tags?.name;
            if (!name || !el.tags?.highway) continue;
            const nameLower = name.toLowerCase();
            if (roadNames.has(nameLower)) continue;
            roadNames.add(nameLower);

            const labelParts = [name, addressLine2, adminCity, postcodeFormatted].filter(Boolean);

            addresses.push({
              addressLine1: name,
              addressLine2,
              premises: '',
              city: adminCity,
              region,
              postcode: postcodeFormatted,
              country: mapCountry(country),
              label: labelParts.join(', '),
              isStreetOnly: true,
            });
          }
        }
      } catch (ovErr) {
        console.error('[Postcode Lookup] Overpass error (non-fatal):', ovErr);
      }
    }

    // Sort addresses alphabetically by addressLine1
    addresses.sort((a, b) => a.addressLine1.localeCompare(b.addressLine1));

    // Fallback: if nothing found at all, add a blank entry so city/region still fill
    if (addresses.length === 0) {
      addresses.push({
        addressLine1: '',
        addressLine2: '',
        premises: '',
        city: adminCity,
        region,
        postcode: postcodeFormatted,
        country: mapCountry(country),
        label: `${postcodeFormatted} — ${adminCity}${region ? ', ' + region : ''}, ${mapCountry(country)}`,
      });
    }

    return NextResponse.json({
      postcode: postcodeFormatted,
      locality: adminCity,
      ward,
      parish,
      region,
      country: mapCountry(country),
      lat,
      lon,
      addresses,
    });
  } catch (error: any) {
    console.error('[Postcode Lookup] Error:', error);
    return NextResponse.json({ error: error.message || 'Lookup failed' }, { status: 500 });
  }
}

function mapCountry(country: string): string {
  const c = country.toLowerCase();
  if (c.includes('england')) return 'England';
  if (c.includes('wales')) return 'Wales';
  if (c.includes('scotland')) return 'Scotland';
  if (c.includes('northern ireland')) return 'Northern Ireland';
  return 'England';
}
