/**
 * HomeLedger E2E Tests - Intelligence Dashboard
 * Tests: Page load, APIs, Map, Layers, Filters, Bottom Tabs, Naval, Economic Calendar
 * 
 * Run: npx tsx e2e/intelligence.test.ts
 * Requires: PUPPETEER_BASE_URL env var (defaults to https://homeledger.co.uk)
 */

import puppeteer, { Browser, Page } from 'puppeteer';

const BASE_URL = process.env.PUPPETEER_BASE_URL || 'https://homeledger.co.uk';
const TIMEOUT = 20000;

let browser: Browser;
let page: Page;

const results: { name: string; passed: boolean; error?: string }[] = [];

async function setup() {
  browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  page = await browser.newPage();
  page.setDefaultTimeout(TIMEOUT);
  await page.setViewport({ width: 1440, height: 900 });
}

async function teardown() {
  if (browser) await browser.close();
}

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    results.push({ name, passed: true });
    console.log(`  ✅ ${name}`);
  } catch (err: any) {
    results.push({ name, passed: false, error: err.message });
    console.log(`  ❌ ${name}: ${err.message}`);
  }
}

// ─── API Tests ──────────────────────────────────────────────────────────────

async function testNewsAPI() {
  await test('News API returns articles', async () => {
    const res = await fetch(`${BASE_URL}/api/news`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.articles || !Array.isArray(data.articles)) throw new Error('No articles array');
    if (data.articles.length < 5) throw new Error(`Only ${data.articles.length} articles returned`);
    // Check article structure
    const a = data.articles[0];
    if (!a.title) throw new Error('Article missing title');
    if (!a.sentiment) throw new Error('Article missing sentiment');
    if (!a.country) throw new Error('Article missing country');
  });
}

async function testNewsAPIProphecyCategory() {
  await test('News API prophecy category works', async () => {
    const res = await fetch(`${BASE_URL}/api/news?category=prophecy`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.articles || data.articles.length === 0) throw new Error('No prophecy articles');
  });
}

async function testAircraftAPI() {
  await test('Aircraft API returns data', async () => {
    const res = await fetch(`${BASE_URL}/api/intelligence/aircraft`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.aircraft || !Array.isArray(data.aircraft)) throw new Error('No aircraft array');
  });
}

async function testEarthquakesAPI() {
  await test('Earthquakes API returns data', async () => {
    const res = await fetch(`${BASE_URL}/api/intelligence/earthquakes`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.earthquakes || !Array.isArray(data.earthquakes)) throw new Error('No earthquakes array');
    if (data.earthquakes.length === 0) throw new Error('No earthquakes returned');
    const eq = data.earthquakes[0];
    if (eq.magnitude === undefined) throw new Error('Missing magnitude');
    if (!eq.lat || !eq.lng) throw new Error('Missing coordinates');
  });
}

async function testConflictsAPI() {
  await test('Conflicts API returns data', async () => {
    const res = await fetch(`${BASE_URL}/api/intelligence/conflicts`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.conflicts || !Array.isArray(data.conflicts)) throw new Error('No conflicts array');
  });
}

async function testNavalAPI() {
  await test('Naval API returns vessels', async () => {
    const res = await fetch(`${BASE_URL}/api/intelligence/naval`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.vessels || !Array.isArray(data.vessels)) throw new Error('No vessels array');
    if (data.vessels.length < 10) throw new Error(`Only ${data.vessels.length} vessels`);
    // Check vessel structure
    const v = data.vessels[0];
    if (!v.name) throw new Error('Vessel missing name');
    if (!v.type) throw new Error('Vessel missing type');
    if (!v.nation) throw new Error('Vessel missing nation');
    if (v.lat === undefined || v.lng === undefined) throw new Error('Vessel missing coordinates');
    // Check summary
    if (!data.summary) throw new Error('Missing summary');
    if (!data.summary.carriers) throw new Error('Missing carrier count');
  });
}

async function testNavalAPIVesselTypes() {
  await test('Naval API has carriers, amphibious, patrol zones', async () => {
    const res = await fetch(`${BASE_URL}/api/intelligence/naval`);
    const data = await res.json();
    const types = new Set(data.vessels.map((v: any) => v.type));
    if (!types.has('carrier')) throw new Error('No carriers found');
    if (!types.has('amphibious')) throw new Error('No amphibious found');
    if (!types.has('patrol_zone')) throw new Error('No patrol zones found');
  });
}

async function testEconomicCalendarAPI() {
  await test('Economic Calendar API returns events', async () => {
    const res = await fetch(`${BASE_URL}/api/intelligence/economic-calendar`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.events || !Array.isArray(data.events)) throw new Error('No events array');
    if (data.events.length < 20) throw new Error(`Only ${data.events.length} events`);
    // Check event structure
    const ev = data.events[0];
    if (!ev.date) throw new Error('Event missing date');
    if (!ev.event) throw new Error('Event missing event name');
    if (!ev.country) throw new Error('Event missing country');
    if (!ev.impact) throw new Error('Event missing impact');
    // Check summary
    if (!data.summary) throw new Error('Missing summary');
  });
}

async function testEconomicCalendarHasHighImpact() {
  await test('Economic Calendar has high-impact events', async () => {
    const res = await fetch(`${BASE_URL}/api/intelligence/economic-calendar`);
    const data = await res.json();
    const highImpact = data.events.filter((e: any) => e.impact === 'high');
    if (highImpact.length < 5) throw new Error(`Only ${highImpact.length} high-impact events`);
    // Check central bank events exist
    const centralBank = data.events.filter((e: any) => e.category === 'central_bank');
    if (centralBank.length < 5) throw new Error(`Only ${centralBank.length} central bank events`);
  });
}

async function testWorldStatsAPI() {
  await test('World Stats API returns data', async () => {
    const res = await fetch(`${BASE_URL}/api/intelligence/world-stats`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.worldPopulation) throw new Error('Missing world population');
    if (!data.totalCountries || data.totalCountries < 100) throw new Error('Not enough countries');
    if (!data.regionStats) throw new Error('Missing region stats');
    if (!data.top15byPopulation || data.top15byPopulation.length < 10) throw new Error('Missing top populations');
  });
}

// ─── Page / UI Tests ────────────────────────────────────────────────────────

async function testPageLoads() {
  await test('Intelligence page loads', async () => {
    await page.goto(`${BASE_URL}/intelligence`, { waitUntil: 'networkidle2', timeout: 30000 });
    const title = await page.title();
    if (!title.includes('Intelligence')) throw new Error(`Wrong title: ${title}`);
  });
}

async function testMapRendered() {
  await test('Leaflet map renders', async () => {
    await page.goto(`${BASE_URL}/intelligence`, { waitUntil: 'networkidle2', timeout: 30000 });
    // Wait for Leaflet container
    await page.waitForSelector('.leaflet-container', { timeout: 15000 });
    const mapExists = await page.$('.leaflet-container');
    if (!mapExists) throw new Error('Map container not found');
  });
}

async function testTopBarElements() {
  await test('Top bar has title and controls', async () => {
    const titleEl = await page.$('h1');
    if (!titleEl) throw new Error('No h1 title');
    const titleText = await page.evaluate(el => el?.textContent, titleEl);
    if (!titleText?.includes('COMMAND CENTER')) throw new Error(`Wrong title text: ${titleText}`);
    // Check LIVE badge
    const liveText = await page.evaluate(() => document.body.innerText);
    if (!liveText.includes('LIVE')) throw new Error('No LIVE badge');
  });
}

async function testLayerToggleButtons() {
  await test('Layer toggle buttons exist', async () => {
    const buttons = await page.$$('button');
    const texts = await Promise.all(buttons.map(b => page.evaluate(el => el.textContent || '', b)));
    const expectedLabels = ['SCAN', 'SFX', 'AIR', 'NAV', 'QUAKE', 'WAR'];
    for (const label of expectedLabels) {
      if (!texts.some(t => t.includes(label))) throw new Error(`Missing ${label} toggle`);
    }
  });
}

async function testMapStyleSelector() {
  await test('Map style selector works', async () => {
    const buttons = await page.$$('button');
    const colorBtn = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find(b => b.textContent?.includes('COLOR'))?.textContent;
    });
    if (!colorBtn) throw new Error('COLOR map style button not found');
  });
}

async function testStatsStrip() {
  await test('Stats strip shows tracking numbers', async () => {
    // Wait for news to load
    await page.waitForFunction(() => {
      const text = document.body.innerText;
      return text.includes('TRACKING') && text.includes('CRISIS');
    }, { timeout: 20000 });
    const text = await page.evaluate(() => document.body.innerText);
    if (!text.includes('TRACKING')) throw new Error('No TRACKING stat');
    if (!text.includes('CRISIS')) throw new Error('No CRISIS stat');
    if (!text.includes('POSITIVE')) throw new Error('No POSITIVE stat');
    if (!text.includes('UK IMPACT')) throw new Error('No UK IMPACT stat');
    if (!text.includes('PROPHECY')) throw new Error('No PROPHECY stat');
  });
}

async function testFiltersSidebar() {
  await test('Filters sidebar opens and shows options', async () => {
    // Click FILTERS button
    const filterBtn = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent?.includes('INTEL'));
      if (btn) { btn.click(); return true; }
      return false;
    });
    if (!filterBtn) throw new Error('INTEL button not found');
    await new Promise(r => setTimeout(r, 500));
    // Check sidebar content
    const hasRegion = await page.evaluate(() => document.body.innerText.includes('REGION'));
    if (!hasRegion) throw new Error('Sidebar missing REGION section');
    const hasCategory = await page.evaluate(() => document.body.innerText.includes('CATEGORY'));
    if (!hasCategory) throw new Error('Sidebar missing CATEGORY section');
    const hasNewsFeed = await page.evaluate(() => document.body.innerText.includes('LIVE FEED'));
    if (!hasNewsFeed) throw new Error('Sidebar missing LIVE FEED');
    // Close sidebar
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      btns.find(b => b.querySelector('svg.lucide-x'))?.click();
    });
  });
}

async function testBottomTabCalendar() {
  await test('Bottom tab: Economic Calendar opens', async () => {
    const clicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent?.includes('Economic Calendar'));
      if (btn) { btn.click(); return true; }
      return false;
    });
    if (!clicked) throw new Error('Economic Calendar tab button not found');
    await new Promise(r => setTimeout(r, 1000));
    const hasContent = await page.evaluate(() => document.body.innerText.includes('ECONOMIC CALENDAR'));
    if (!hasContent) throw new Error('Calendar panel content not showing');
    // Close
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      btns.find(b => b.textContent?.includes('Economic Calendar'))?.click();
    });
    await new Promise(r => setTimeout(r, 300));
  });
}

async function testBottomTabNaval() {
  await test('Bottom tab: Naval Tracker opens', async () => {
    const clicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent?.includes('Naval Ops'));
      if (btn) { btn.click(); return true; }
      return false;
    });
    if (!clicked) throw new Error('Naval Ops tab button not found');
    await new Promise(r => setTimeout(r, 1000));
    const hasContent = await page.evaluate(() => document.body.innerText.includes('NAVAL DEPLOYMENTS'));
    if (!hasContent) throw new Error('Naval panel content not showing');
    // Close
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      btns.find(b => b.textContent?.includes('Naval Ops'))?.click();
    });
    await new Promise(r => setTimeout(r, 300));
  });
}

async function testBottomTabCrossRef() {
  await test('Bottom tab: Cross-Reference opens', async () => {
    const clicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent?.includes('Cross-Ref'));
      if (btn) { btn.click(); return true; }
      return false;
    });
    if (!clicked) throw new Error('Cross-Ref tab button not found');
    await new Promise(r => setTimeout(r, 1000));
    const hasContent = await page.evaluate(() => document.body.innerText.includes('INTEL CROSS-REFERENCE'));
    if (!hasContent) throw new Error('Cross-ref panel content not showing');
    // Close
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      btns.find(b => b.textContent?.includes('Cross-Ref'))?.click();
    });
    await new Promise(r => setTimeout(r, 300));
  });
}

async function testBottomTabWorldData() {
  await test('Bottom tab: World Data opens', async () => {
    const clicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent?.includes('World Data'));
      if (btn) { btn.click(); return true; }
      return false;
    });
    if (!clicked) throw new Error('World Data tab button not found');
    await new Promise(r => setTimeout(r, 1500));
    const hasContent = await page.evaluate(() => document.body.innerText.includes('GLOBAL STATISTICS'));
    if (!hasContent) throw new Error('Global statistics panel content not showing');
    // Close
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      btns.find(b => b.textContent?.includes('World Data'))?.click();
    });
  });
}

async function testRefreshButton() {
  await test('Refresh button triggers reload', async () => {
    const clicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent?.includes('REFRESH'));
      if (btn) { btn.click(); return true; }
      return false;
    });
    if (!clicked) throw new Error('REFRESH button not found');
    await new Promise(r => setTimeout(r, 2000));
    // Just verify page didn't crash
    const isAlive = await page.evaluate(() => !!document.querySelector('.leaflet-container'));
    if (!isAlive) throw new Error('Page crashed after refresh');
  });
}

async function testBackButton() {
  await test('Back button links to dashboard', async () => {
    const href = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      const back = links.find(a => a.textContent?.includes('EXIT'));
      return back?.getAttribute('href');
    });
    if (href !== '/dashboard') throw new Error(`Exit button href is ${href}, expected /dashboard`);
  });
}

async function testNewsSentimentAnalysis() {
  await test('News articles have sentiment analysis', async () => {
    const res = await fetch(`${BASE_URL}/api/news`);
    const data = await res.json();
    const sentiments = new Set(data.articles.map((a: any) => a.sentiment));
    if (!sentiments.has('negative') && !sentiments.has('positive') && !sentiments.has('neutral')) {
      throw new Error('No sentiment values found');
    }
    // Check prophecy detection
    const prophecyArticles = data.articles.filter((a: any) => a.prophecyRelated);
    // Prophecy articles may or may not exist, but the field should be present
    const hasField = data.articles.every((a: any) => typeof a.prophecyRelated === 'boolean');
    if (!hasField) throw new Error('prophecyRelated field missing from some articles');
  });
}

async function testNewsGlobalCoverage() {
  await test('News covers multiple countries/regions', async () => {
    const res = await fetch(`${BASE_URL}/api/news`);
    const data = await res.json();
    const countries = new Set(data.articles.map((a: any) => a.country).filter(Boolean));
    if (countries.size < 5) throw new Error(`Only ${countries.size} countries, expected 5+`);
    const continents = new Set(data.articles.map((a: any) => a.continent).filter(Boolean));
    if (continents.size < 3) throw new Error(`Only ${continents.size} continents, expected 3+`);
  });
}

async function testLandingPageIntelligenceSection() {
  await test('Landing page has intelligence promo section', async () => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2', timeout: 30000 });
    const hasSection = await page.evaluate(() => {
      const el = document.querySelector('#intelligence');
      return !!el;
    });
    if (!hasSection) throw new Error('Intelligence section not found on landing page');
    // Check feature cards
    const text = await page.evaluate(() => document.body.innerText);
    if (!text.includes('Naval Tracker')) throw new Error('Missing Naval Tracker feature card');
    if (!text.includes('Economic Calendar')) throw new Error('Missing Economic Calendar feature card');
    if (!text.includes('Aircraft Tracking')) throw new Error('Missing Aircraft Tracking feature card');
  });
}

// ─── Main Runner ────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🌐 HomeLedger Intelligence E2E Tests');
  console.log(`📡 Target: ${BASE_URL}`);
  console.log('─'.repeat(60));

  await setup();

  try {
    // API Tests
    console.log('\n📡 API Tests:');
    await testNewsAPI();
    await testNewsAPIProphecyCategory();
    await testAircraftAPI();
    await testEarthquakesAPI();
    await testConflictsAPI();
    await testNavalAPI();
    await testNavalAPIVesselTypes();
    await testEconomicCalendarAPI();
    await testEconomicCalendarHasHighImpact();
    await testWorldStatsAPI();
    await testNewsSentimentAnalysis();
    await testNewsGlobalCoverage();

    // Page / UI Tests
    console.log('\n🖥️  UI Tests:');
    await testPageLoads();
    await testMapRendered();
    await testTopBarElements();
    await testLayerToggleButtons();
    await testMapStyleSelector();
    await testStatsStrip();
    await testFiltersSidebar();
    await testBottomTabCalendar();
    await testBottomTabNaval();
    await testBottomTabCrossRef();
    await testBottomTabWorldData();
    await testRefreshButton();
    await testBackButton();

    // Landing page
    console.log('\n🏠 Landing Page Tests:');
    await testLandingPageIntelligenceSection();
  } catch (err: any) {
    console.error('Fatal error:', err.message);
  }

  await teardown();

  // Summary
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  console.log('\n' + '─'.repeat(60));
  console.log(`\n📊 Results: ${passed}/${results.length} passed, ${failed} failed`);
  if (failed > 0) {
    console.log('\n❌ Failed tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`   • ${r.name}: ${r.error}`);
    });
  }
  console.log('');
  process.exit(failed > 0 ? 1 : 0);
}

main();
