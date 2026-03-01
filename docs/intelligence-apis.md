# Intelligence Dashboard — API Sources & Pricing

## FREE APIs (Currently Used)

| API | Data | Rate Limit | Key Required | Notes |
|-----|------|-----------|--------------|-------|
| **OpenSky Network** | Aircraft positions, callsigns, altitude, speed, heading | ~10 req/min (anon) | No | Real-time ADS-B data. Military detection via callsign prefixes. |
| **USGS Earthquake** | Earthquakes worldwide, magnitude, depth, tsunami alerts | Unlimited | No | GeoJSON feed updated every minute. |
| **GDELT Project** | Conflict events, geolocation, event counts | Unlimited | No | Global event database. 15-min data lag. |
| **NewsAPI.org** | News articles from 50+ countries | 100 req/day (free) | Yes (`NEWSAPI_KEY`) | Free tier limited. Upgrade: Developer $449/mo, Business $849/mo. |
| **REST Countries** | Country data, flags, population, region | Unlimited | No | Static demographic data. |
| **World Bank** | GDP, economic indicators | Unlimited | No | Annual data, ~1 year lag. |
| **OpenWeatherMap** | Weather tiles (clouds, precipitation, temp, wind) | 1,000 tile req/day | Yes (`OWM_KEY`) | Free tier. Pro: $40/mo (40k/day). |
| **CartoDB/OpenStreetMap** | Map tiles (dark, voyager, labels) | Unlimited | No | Free for non-commercial. |
| **ArcGIS** | Satellite imagery tiles | Unlimited | No | Free basemap service. |
| **OpenTopoMap** | Terrain/topographic tiles | Fair use | No | Community project. |

## FREE APIs (Can Add)

| API | Data | Rate Limit | Key Required | Notes |
|-----|------|-----------|--------------|-------|
| **NASA FIRMS** | Active fires/hotspots worldwide | Unlimited | Free key | Near real-time satellite fire detection. |
| **ISS Tracker** | International Space Station position | Unlimited | No | `api.open-notify.org` |
| **Open-Meteo** | Weather forecasts, historical data | Unlimited | No | Alternative to OWM, no key needed. |
| **Windy Webcams** | Live webcam feeds worldwide | 1,000/day | Free key | Visual verification of locations. |
| **ADS-B Exchange** | Aircraft tracking (more data than OpenSky) | Fair use | Free key | Community-funded, more military data. |
| **NOAA** | Weather alerts, severe storms, hurricanes | Unlimited | No | US-focused but global tropical cyclones. |

## PAID APIs (For Future Enhancement)

| API | Data | Price | Notes |
|-----|------|-------|-------|
| **FlightAware** | Flight routes, departure/arrival, delays | From $20/mo | Full flight tracking with route lines. |
| **FlightRadar24** | Live flight data, aircraft photos | From $1,500/yr | Most popular flight tracker API. |
| **MarineTraffic** | Real AIS ship tracking | From $99/mo | Live vessel positions, routes, port data. |
| **VesselFinder** | Ship tracking, port calls | From $50/mo | Alternative to MarineTraffic. |
| **Refinitiv/LSEG** | Financial market data, forex | From $500/mo | Real-time market data. |
| **Bloomberg** | Financial terminals, news | $2,000+/mo | Enterprise-grade financial data. |
| **Maxar/Planet** | High-res satellite imagery | Custom pricing | Military-grade imagery, $$$. |
| **Janes** | Defense & security intelligence | Custom pricing | Professional military intelligence. |
| **Dataminr** | AI-powered real-time alerts | Custom pricing | Used by newsrooms, first responders. |
| **Recorded Future** | Threat intelligence | Custom pricing | Cyber threat and geopolitical risk. |
| **NewsAPI Business** | Unlimited news, historical | $849/mo | Full archive, no rate limits. |

## Current Monthly Cost: $0 (all free tiers)

## Recommended Upgrades (Priority Order):
1. **NewsAPI Developer** ($449/mo) — Remove 100 req/day limit, get more articles
2. **MarineTraffic Basic** ($99/mo) — Real AIS ship tracking instead of curated data
3. **FlightAware Personal** ($20/mo) — Flight routes, departure/arrival airports
4. **OpenWeatherMap Pro** ($40/mo) — Higher tile request limits

## Environment Variables Needed:
```
NEWSAPI_KEY=47c2301eb90340bc831bf882fd1ec248
OWM_KEY=9de243494c0b295cca9337e1e96b00e2
```
