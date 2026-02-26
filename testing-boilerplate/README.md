# Testing Boilerplate — Reusable Template for Any Next.js / Node.js Project

## What's Included

| File | Type | Purpose |
|------|------|---------|
| `vitest.config.ts` | Config | Vitest setup with path aliases and coverage |
| `__tests__/unit.test.ts` | Unit Tests | Pure function testing patterns |
| `__tests__/integration.test.ts` | Integration Tests | Module testing with mocks (DB, API) |
| `__tests__/health.test.ts` | Health / Smoke Tests | Verify critical files exist and export correctly |
| `__tests__/security.test.ts` | Security Tests | Crypto round-trip, input sanitisation, token validation |
| `e2e/app.test.ts` | E2E Tests | Full browser testing with Playwright |
| `.github/workflows/daily-tests.yml` | CI/CD | Automated daily testing + bug reporting |
| `scripts/run-tests.sh` | Script | Run all test suites locally |

## Quick Setup

### 1. Install Dependencies

```bash
# Vitest (unit + integration + health + security)
npm install -D vitest @vitejs/plugin-react

# Playwright (E2E)
npm install -D playwright @playwright/test
npx playwright install chromium

# Coverage (optional)
npm install -D @vitest/coverage-v8
```

### 2. Copy Files

Copy the files you need into your project:

```bash
# Copy vitest config
cp testing-boilerplate/vitest.config.ts ./vitest.config.ts

# Copy test templates
cp -r testing-boilerplate/__tests__/ ./__tests__/
cp -r testing-boilerplate/e2e/ ./e2e/

# Copy CI/CD workflow
mkdir -p .github/workflows
cp testing-boilerplate/.github/workflows/daily-tests.yml .github/workflows/

# Copy run script
mkdir -p scripts
cp testing-boilerplate/scripts/run-tests.sh scripts/
chmod +x scripts/run-tests.sh
```

### 3. Add npm Scripts to package.json

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:unit": "vitest run __tests__/unit",
    "test:integration": "vitest run __tests__/integration",
    "test:health": "vitest run __tests__/health",
    "test:security": "vitest run __tests__/security",
    "test:e2e": "npx playwright test",
    "test:coverage": "vitest run --coverage",
    "test:daily": "npm run test:health && npm run test && npm run test:e2e"
  }
}
```

### 4. Configure GitHub Actions

Set these secrets in your GitHub repo (Settings → Secrets → Actions):

| Secret | Purpose |
|--------|---------|
| `DATABASE_URL` | Test database connection string |
| `NEXTAUTH_SECRET` | Auth secret for testing |
| Any API keys | Your project-specific secrets |

## Test Naming Convention

```
__tests__/
  unit/
    utils.test.ts          # Pure utility functions
    validators.test.ts     # Input validation
    formatters.test.ts     # Data formatting
  integration/
    api-auth.test.ts       # Auth flow with mocked DB
    data-pipeline.test.ts  # Data processing with mocked services
  health/
    routes.test.ts         # API routes exist
    libs.test.ts           # Libraries export correctly
  security/
    crypto.test.ts         # Encryption round-trips
    auth.test.ts           # Token validation, CSRF
e2e/
  auth.test.ts             # Login, register, logout flows
  navigation.test.ts       # Page navigation, links
  forms.test.ts            # Form submission, validation
```

## When to Use Each Test Type

| Scenario | Test Type | Example |
|----------|-----------|---------|
| Testing a pure function | **Unit** | `formatCurrency(1234.5)` → `"£1,234.50"` |
| Testing module with DB | **Integration** | Create user → fetch user → verify fields |
| After refactoring | **Health** | All routes still exist, all exports correct |
| Testing encryption | **Security** | Encrypt → decrypt → compare |
| Testing user flows | **E2E** | Login → navigate → submit form → see result |
| Preventing regressions | **CI/CD** | All of the above, daily + on push |

## Coverage Targets

| Type | Target | Why |
|------|--------|-----|
| Unit | ≥ 80% | Core business logic must be covered |
| Integration | ≥ 60% | Key workflows covered |
| E2E | Critical paths | Login, main features, payment flows |
| Health | 100% | Every route and lib must be checked |
