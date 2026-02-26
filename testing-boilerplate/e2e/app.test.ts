/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  E2E TEST TEMPLATE (Playwright)                              ║
 * ║  Test full user flows in a real browser.                     ║
 * ║  Replace URLs and selectors with YOUR project's.             ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Setup:
 *   npm install -D playwright @playwright/test
 *   npx playwright install chromium
 *
 * Run:
 *   npx playwright test e2e/app.test.ts
 *
 * E2E tests should:
 *  ✅ Test REAL user journeys (login → action → verify)
 *  ✅ Run against a dev server or staging
 *  ✅ Be independent (each test can run alone)
 *  ✅ Clean up after themselves
 */

import { test, expect, type Page } from '@playwright/test';

// ─── Configuration ──────────────────────────────────────────────
const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

// Test credentials (use env vars in CI)
const TEST_USER = {
  email: process.env.TEST_EMAIL || 'test@example.com',
  password: process.env.TEST_PASSWORD || 'TestPassword123!',
};

// ─── Helper Functions ───────────────────────────────────────────

async function login(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[name="email"], input[type="email"]', TEST_USER.email);
  await page.fill('input[name="password"], input[type="password"]', TEST_USER.password);
  await page.click('button[type="submit"]');
  // Wait for redirect after login
  await page.waitForURL(`${BASE_URL}/**`, { timeout: 10000 });
}

async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
}

// ════════════════════════════════════════════════════════════════
// TEST SUITE 1: Authentication
// ════════════════════════════════════════════════════════════════

test.describe('Authentication', () => {
  test('login page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await expect(page).toHaveTitle(/login|sign in|welcome/i);
    // Or check for a specific element:
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('login with valid credentials redirects to dashboard', async ({ page }) => {
    await login(page);
    // Verify we landed on dashboard or home
    const url = page.url();
    expect(url).toMatch(/\/(dashboard|home|$)/);
  });

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'WrongPassword');
    await page.click('button[type="submit"]');

    // Wait for error message
    const errorMsg = page.locator('[role="alert"], .error, .text-red-500, .text-destructive');
    await expect(errorMsg.first()).toBeVisible({ timeout: 5000 });
  });

  test('protected routes redirect to login when not authenticated', async ({ page }) => {
    // Clear any existing session
    await page.context().clearCookies();

    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForURL(/login|signin|auth/, { timeout: 10000 });
    expect(page.url()).toContain('login');
  });

  test('logout clears session', async ({ page }) => {
    await login(page);

    // Click logout (adjust selector)
    const logoutBtn = page.locator('button:has-text("Logout"), button:has-text("Sign Out"), a:has-text("Logout")');
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await page.waitForURL(/login|\/$/);
    }
  });
});

// ════════════════════════════════════════════════════════════════
// TEST SUITE 2: Navigation
// ════════════════════════════════════════════════════════════════

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('sidebar/navbar has all main links', async ({ page }) => {
    await waitForPageLoad(page);

    // Adjust these to YOUR project's navigation items
    const expectedLinks = [
      // 'Dashboard',
      // 'Transactions',
      // 'Reports',
      // 'Settings',
    ];

    for (const label of expectedLinks) {
      const link = page.locator(`nav a:has-text("${label}"), aside a:has-text("${label}")`);
      await expect(link.first()).toBeVisible();
    }
  });

  test('clicking nav links navigates correctly', async ({ page }) => {
    await waitForPageLoad(page);

    // Example: click "Settings" and verify URL
    // const settingsLink = page.locator('a:has-text("Settings")');
    // if (await settingsLink.isVisible()) {
    //   await settingsLink.click();
    //   await expect(page).toHaveURL(/settings/);
    // }
  });
});

// ════════════════════════════════════════════════════════════════
// TEST SUITE 3: Forms & CRUD Operations
// ════════════════════════════════════════════════════════════════

test.describe('Forms', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('create form validates required fields', async ({ page }) => {
    // Navigate to a create page
    // await page.goto(`${BASE_URL}/items/new`);

    // Submit empty form
    // await page.click('button[type="submit"]');

    // Check for validation messages
    // const validation = page.locator('.field-error, [aria-invalid="true"], .text-red-500');
    // await expect(validation.first()).toBeVisible();
  });

  test('create, read, update, delete flow', async ({ page }) => {
    // --- CREATE ---
    // await page.goto(`${BASE_URL}/items/new`);
    // await page.fill('input[name="title"]', 'E2E Test Item');
    // await page.fill('input[name="amount"]', '99.99');
    // await page.click('button[type="submit"]');
    // await expect(page.locator('text=E2E Test Item')).toBeVisible();

    // --- READ ---
    // await page.goto(`${BASE_URL}/items`);
    // await expect(page.locator('text=E2E Test Item')).toBeVisible();

    // --- UPDATE ---
    // await page.click('text=E2E Test Item');
    // await page.fill('input[name="title"]', 'E2E Updated Item');
    // await page.click('button:has-text("Save")');
    // await expect(page.locator('text=E2E Updated Item')).toBeVisible();

    // --- DELETE ---
    // await page.click('button:has-text("Delete")');
    // await page.click('button:has-text("Confirm")'); // Confirmation dialog
    // await expect(page.locator('text=E2E Updated Item')).not.toBeVisible();
  });
});

// ════════════════════════════════════════════════════════════════
// TEST SUITE 4: API Health from Browser
// ════════════════════════════════════════════════════════════════

test.describe('API Health (from browser)', () => {
  test('API responds to health check', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/api/health`);
    // Some APIs return 200, some don't have a health endpoint — adjust
    if (response.ok()) {
      expect(response.status()).toBe(200);
    }
  });

  test('unauthenticated API calls return 401', async ({ page }) => {
    // Clear cookies to ensure no session
    await page.context().clearCookies();

    const response = await page.request.get(`${BASE_URL}/api/transactions`);
    expect([401, 403, 302]).toContain(response.status());
  });
});

// ════════════════════════════════════════════════════════════════
// TEST SUITE 5: Responsive Design
// ════════════════════════════════════════════════════════════════

test.describe('Responsive Design', () => {
  test('mobile viewport shows hamburger menu', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone X
    await login(page);
    await waitForPageLoad(page);

    // Check for mobile menu toggle (adjust selector)
    // const hamburger = page.locator('button[aria-label="Menu"], button.mobile-menu-toggle');
    // await expect(hamburger).toBeVisible();
  });

  test('desktop viewport shows full sidebar', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page);
    await waitForPageLoad(page);

    // Check sidebar is visible (adjust selector)
    // const sidebar = page.locator('nav, aside.sidebar');
    // await expect(sidebar).toBeVisible();
  });
});

// ════════════════════════════════════════════════════════════════
// TEST SUITE 6: Performance
// ════════════════════════════════════════════════════════════════

test.describe('Performance', () => {
  test('page loads within 5 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto(BASE_URL);
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - start;

    expect(loadTime).toBeLessThan(5000);
    console.log(`Page load time: ${loadTime}ms`);
  });

  test('no console errors on main pages', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await login(page);
    await waitForPageLoad(page);

    // Filter out known/expected errors
    const criticalErrors = errors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('hydration') && // Next.js dev mode
      !e.includes('DevTools')
    );

    if (criticalErrors.length > 0) {
      console.warn('Console errors found:', criticalErrors);
    }
    // Soft check — uncomment to make it fail:
    // expect(criticalErrors).toHaveLength(0);
  });
});
