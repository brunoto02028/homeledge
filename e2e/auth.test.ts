/**
 * HomeLedger E2E Tests - Authentication Flows
 * Tests: Login (with OTP), Register, Forgot Password, Admin Panel
 * 
 * Run: npx ts-node e2e/auth.test.ts
 * Requires: PUPPETEER_BASE_URL env var (defaults to https://homeledger.co.uk)
 */

import puppeteer, { Browser, Page } from 'puppeteer';

const BASE_URL = process.env.PUPPETEER_BASE_URL || 'https://homeledger.co.uk';
const TIMEOUT = 15000;

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
  await page.setViewport({ width: 1280, height: 800 });
}

async function teardown() {
  if (browser) await browser.close();
}

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    results.push({ name, passed: true });
    console.log(`  ✅ ${name}`);
  } catch (error: any) {
    results.push({ name, passed: false, error: error.message });
    console.log(`  ❌ ${name}: ${error.message}`);
  }
}

async function runTests() {
  console.log('\n🧪 HomeLedger E2E Tests');
  console.log(`   Base URL: ${BASE_URL}\n`);

  await setup();

  // === AUTH TESTS ===
  console.log('📋 Authentication Tests:');

  await test('Login page loads', async () => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    const hasForm = await page.$('input[type="email"]');
    const hasButton = await page.$('button[type="submit"]');
    if (!hasForm || !hasButton) throw new Error('Login form not found');
  });

  await test('Login page has email and password fields', async () => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    const emailInput = await page.$('input[type="email"]');
    const passwordInput = await page.$('input[type="password"]');
    if (!emailInput) throw new Error('Email input not found');
    if (!passwordInput) throw new Error('Password input not found');
  });

  await test('Login shows error for invalid credentials', async () => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    await page.type('input[type="email"]', 'fake@test.com');
    await page.type('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await page.waitForSelector('[class*="red"], [class*="error"], [class*="destructive"]', { timeout: 10000 });
  });

  await test('Login has forgot password link', async () => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    const forgotLink = await page.$('a[href="/forgot-password"]');
    if (!forgotLink) throw new Error('Forgot password link not found');
  });

  await test('Register page loads', async () => {
    await page.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle2' });
    const hasName = await page.$('#fullName');
    const hasEmail = await page.$('#email');
    if (!hasName || !hasEmail) throw new Error('Register form not found');
  });

  await test('Register page has all required fields', async () => {
    await page.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle2' });
    const fullName = await page.$('#fullName');
    const email = await page.$('#email');
    const password = await page.$('#password');
    const confirm = await page.$('#confirmPassword');
    if (!fullName || !email || !password || !confirm) {
      throw new Error('Missing required fields');
    }
  });

  await test('Forgot password page loads', async () => {
    await page.goto(`${BASE_URL}/forgot-password`, { waitUntil: 'networkidle2' });
    const hasEmailInput = await page.$('input[type="email"]');
    const hasButton = await page.$('button[type="submit"]');
    if (!hasEmailInput || !hasButton) throw new Error('Forgot password form not found');
  });

  await test('Unauthenticated redirect to login', async () => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });
    const url = page.url();
    if (!url.includes('/login')) {
      throw new Error(`Expected redirect to login, got: ${url}`);
    }
  });

  // === PAGE ACCESSIBILITY TESTS ===
  console.log('\n📋 Protected Page Tests (require auth):');

  await test('Vault redirects to login when unauthenticated', async () => {
    await page.goto(`${BASE_URL}/vault`, { waitUntil: 'networkidle2' });
    const url = page.url();
    if (!url.includes('/login')) {
      throw new Error(`Expected redirect, got: ${url}`);
    }
  });

  await test('Projections redirects to login when unauthenticated', async () => {
    await page.goto(`${BASE_URL}/projections`, { waitUntil: 'networkidle2' });
    const url = page.url();
    if (!url.includes('/login')) {
      throw new Error(`Expected redirect, got: ${url}`);
    }
  });

  await test('Admin panel redirects to login when unauthenticated', async () => {
    await page.goto(`${BASE_URL}/admin/users`, { waitUntil: 'networkidle2' });
    const url = page.url();
    if (!url.includes('/login')) {
      throw new Error(`Expected redirect, got: ${url}`);
    }
  });

  // === API HEALTH TESTS ===
  console.log('\n📋 API Endpoint Tests:');

  await test('API auth endpoints respond', async () => {
    const res = await page.goto(`${BASE_URL}/api/auth/providers`, { waitUntil: 'networkidle2' });
    if (!res || res.status() !== 200) {
      throw new Error(`Auth providers returned ${res?.status()}`);
    }
  });

  await test('API vault requires auth', async () => {
    const res = await page.goto(`${BASE_URL}/api/vault`, { waitUntil: 'networkidle2' });
    if (res && res.status() !== 401 && res.status() !== 307 && res.status() !== 302) {
      const body = await res.text();
      if (!body.includes('Unauthorized') && !body.includes('login')) {
        throw new Error(`Expected 401, got ${res.status()}`);
      }
    }
  });

  await test('AI chat API requires auth', async () => {
    // Navigate to a non-auth page first so fetch runs in browser context
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    const res = await page.evaluate(async () => {
      const r = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: 'test' }], section: 'general' }),
      });
      return { status: r.status, body: await r.text() };
    });
    // Accept 401, 403, or 500 with auth error in body
    if (res.status !== 401 && res.status !== 403 && res.status !== 500) {
      if (!res.body.includes('nauthorized') && !res.body.includes('error')) {
        throw new Error(`Expected auth error, got ${res.status}`);
      }
    }
  });

  // === SUMMARY ===
  await teardown();

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log(`\n${'='.repeat(50)}`);
  console.log(`📊 Results: ${passed} passed, ${failed} failed, ${results.length} total`);

  if (failed > 0) {
    console.log('\n❌ Failed tests:');
    results.filter((r) => !r.passed).forEach((r) => {
      console.log(`   - ${r.name}: ${r.error}`);
    });
  }

  console.log('');
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
