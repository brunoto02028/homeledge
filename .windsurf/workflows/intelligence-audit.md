---
description: Intelligence module audit checklist and regression prevention rules
---

# Intelligence Module — Audit & Regression Prevention

## Critical Rules (NEVER break these)

### 1. Leaflet MUST be self-hosted
- Files at `/public/lib/leaflet/` (leaflet.js, leaflet.css, marker images)
- NEVER load from CDN (unpkg.com, cdnjs, jsdelivr) — CSP blocks external scripts for logged-in users
- All references in code must use `/lib/leaflet/leaflet.js` and `/lib/leaflet/leaflet.css`
- Files: `intelligence-client.tsx`, `page.tsx`, `subscribe/page.tsx`

### 2. Service Worker (sw.js) — CRITICAL
- `/_next/` assets MUST use **network-first** strategy (NOT cache-first)
- Cache-first caused old JS bundles to persist across deploys, breaking ALL UI updates
- Bump `CACHE_NAME` version on breaking changes (currently `clarityco-v6`)
- After deploy, user may need hard refresh (Ctrl+Shift+R) to update SW

### 3. Map defaults
- Default map style: `'dark'` (NOT voyager/COLOR)
- Initial tile layer in useEffect: `MAP_STYLES.find(s => s.id === 'dark')`
- INTEL sidebar: open by default (`useState(true)`)

### 3. CSP (Content Security Policy) in next.config.js
When modifying CSP, ALWAYS include:
- `script-src`: `'self' 'unsafe-inline' 'unsafe-eval'` (Leaflet is self-hosted, no CDN needed)
- `style-src`: `'self' 'unsafe-inline'` (Leaflet CSS is self-hosted)
- `img-src`: `'self' data: blob: https: http:` (map tiles use HTTPS img tags)
- `connect-src`: Must include all API domains:
  - `https://opensky-network.org https://*.opensky-network.org` (aircraft)
  - `https://earthquake.usgs.gov` (earthquakes)
  - `https://api.gdeltproject.org` (conflicts)
  - `https://*.investing.com` (economic calendar)
  - `https://restcountries.com https://api.worldbank.org` (world stats)
  - `https://tile.openweathermap.org` (weather overlay)
  - `https://*.basemaps.cartocdn.com` (CartoDB tiles)
  - `https://server.arcgisonline.com` (satellite tiles)
  - `https://*.tile.opentopomap.org` (terrain tiles)

### 4. Logo upload flow
- Two-step: Select file → Preview in box → Click "Save Logo" → Upload
- `pendingLogo` state holds preview + dataUrl until user confirms
- Cancel button clears pendingLogo without uploading
- Remove button only visible when no pending upload and logo exists

### 5. API endpoints and caching
| Endpoint | Cache TTL | Refresh interval (client) |
|----------|-----------|--------------------------|
| `/api/news` | 3 min | 60s |
| `/api/intelligence/aircraft` | 2 min | 30s (with interpolation) |
| `/api/intelligence/earthquakes` | 5 min | 300s |
| `/api/intelligence/conflicts` | 15 min | 600s |
| `/api/intelligence/naval` | 5 min | 300s |
| `/api/intelligence/economic-calendar` | once | on mount |
| `/api/intelligence/world-stats` | once | on mount |

### 6. Conflicts API fallback
- Primary: GDELT v2 DOC API (`api.gdeltproject.org/api/v2/doc/doc`)
- Fallback: Derive from News API when GDELT fails or returns empty
- Single query to avoid GDELT rate-limiting (5s rule)

---

## Pre-Deploy Checklist

// turbo
1. Verify Leaflet references are self-hosted:
```bash
grep -rn 'unpkg.com/leaflet\|cdnjs.*leaflet\|jsdelivr.*leaflet' app/intelligence/
```
Expected: 0 results

// turbo
2. Verify default map style is dark:
```bash
grep -n "useState.*'dark'\|find.*id.*=.*'dark'" app/intelligence/intelligence-client.tsx
```
Expected: 2 matches (useState + find)

// turbo
3. Verify sidebar opens by default:
```bash
grep -n "sidebarOpen.*useState" app/intelligence/intelligence-client.tsx
```
Expected: `useState(true)`

// turbo
4. Verify CSP includes required domains:
```bash
grep 'Content-Security-Policy' next.config.js | grep -c 'basemaps.cartocdn.com'
```
Expected: 1

5. After deploy, test via Puppeteer or curl:
```bash
# Leaflet JS accessible
curl -sI https://clarityco.co.uk/lib/leaflet/leaflet.js | head -3
# Expected: HTTP 200, Content-Type: application/javascript

# CSP header correct
curl -sI https://clarityco.co.uk/intelligence | grep -i content-security-policy | grep -o "script-src[^;]*"
# Expected: includes 'self'
```

---

## Interactive Elements Reference (44 total)

### Command Bar (Desktop)
- LAYERS: AIR, NAV, QUAKE, WAR — toggle show* states
- WEATHER: Clouds, Rain, Temp, Wind — toggle weatherLayer
- MAP STYLE: COLOR, DARK, SAT, TERRAIN — setMapStyle
- SCAN, SFX — toggle scan line and sound effects
- REFRESH — fetchNews()
- INTEL — toggle sidebar
- EXIT — link to /dashboard

### Stats HUD
- TRACKING, CRISIS, POSITIVE, UK IMPACT, PROPHECY — filter by sentiment

### Bottom Tabs
- Economic Calendar, Naval Ops, Cross-Ref, World Data — setBottomTab

### Sidebar (INTEL Feed)
- Close (X), Search input, Region filters, Category filters, Article buttons

### Popups (4 types)
- Article, Earthquake, Aircraft, Vessel — each with close button and action links

### Map Markers (5 layers)
- News (click → article popup), Aircraft (click → detail popup)
- Earthquake (click → detail popup), Conflict (click → source URL)
- Naval (click → vessel popup)

---

## Known Issues & Workarounds
- **GDELT rate limiting**: Single query only, with news fallback
- **NewsAPI daily limit**: Free tier = 100 req/day, RSS feeds compensate (200+ articles)
- **OpenSky auth**: Works without API key but rate-limited; military detection via callsign patterns
- **Browser cache**: After deploy, user may need Ctrl+F5 to see changes
