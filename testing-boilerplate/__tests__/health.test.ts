/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  HEALTH / SMOKE TEST TEMPLATE                                ║
 * ║  Verify critical files exist, export correctly, and          ║
 * ║  the project structure is intact.                            ║
 * ║  Replace paths with YOUR project's critical files.           ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Health tests should:
 *  ✅ Run FAST (< 1s total)
 *  ✅ Catch broken imports, deleted files, missing exports
 *  ✅ Be the FIRST tests to run in CI
 *  ✅ Cover every API route and critical library
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// ─── Adjust to YOUR project root ────────────────────────────────
const ROOT = path.resolve(__dirname, '..');

// ════════════════════════════════════════════════════════════════
// PATTERN 1: Critical files exist
// ════════════════════════════════════════════════════════════════

describe('Critical Files Exist', () => {
  const criticalFiles = [
    // --- Config ---
    'package.json',
    'tsconfig.json',
    // 'next.config.js',            // Uncomment for Next.js
    // 'prisma/schema.prisma',      // Uncomment if using Prisma

    // --- Core Libraries ---
    // 'lib/db.ts',
    // 'lib/auth.ts',
    // 'lib/utils.ts',

    // --- API Routes (adjust to your framework) ---
    // 'app/api/auth/[...nextauth]/route.ts',
    // 'app/api/users/route.ts',
    // 'app/api/transactions/route.ts',

    // --- Pages ---
    // 'app/page.tsx',
    // 'app/layout.tsx',
    // 'app/dashboard/page.tsx',
  ];

  for (const file of criticalFiles) {
    it(`${file} exists`, () => {
      const fullPath = path.join(ROOT, file);
      expect(fs.existsSync(fullPath), `Missing critical file: ${file}`).toBe(true);
    });
  }
});

// ════════════════════════════════════════════════════════════════
// PATTERN 2: Libraries export expected functions
// ════════════════════════════════════════════════════════════════

describe('Library Exports', () => {
  // Uncomment and adjust to YOUR project's libraries:

  // it('lib/utils exports cn()', async () => {
  //   const mod = await import('@/lib/utils');
  //   expect(mod.cn).toBeDefined();
  //   expect(typeof mod.cn).toBe('function');
  // });

  // it('lib/db exports prisma client', async () => {
  //   const mod = await import('@/lib/db');
  //   expect(mod.prisma).toBeDefined();
  // });

  // it('lib/auth exports requireUserId()', async () => {
  //   const mod = await import('@/lib/auth');
  //   expect(mod.requireUserId).toBeDefined();
  //   expect(typeof mod.requireUserId).toBe('function');
  // });

  it('placeholder — replace with your exports', () => {
    expect(true).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════
// PATTERN 3: API route files are valid TypeScript modules
// ════════════════════════════════════════════════════════════════

describe('API Route Structure', () => {
  // List your API route directories
  const apiDirs: string[] = [
    // 'app/api/auth',
    // 'app/api/users',
    // 'app/api/transactions',
    // 'app/api/health-score',
  ];

  for (const dir of apiDirs) {
    it(`${dir}/ has route.ts`, () => {
      const routePath = path.join(ROOT, dir, 'route.ts');
      if (fs.existsSync(path.join(ROOT, dir))) {
        expect(fs.existsSync(routePath), `Missing route.ts in ${dir}/`).toBe(true);
      }
    });
  }
});

// ════════════════════════════════════════════════════════════════
// PATTERN 4: package.json has required scripts
// ════════════════════════════════════════════════════════════════

describe('package.json scripts', () => {
  let pkg: Record<string, any>;

  try {
    pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));
  } catch {
    pkg = {};
  }

  const requiredScripts = [
    'dev',
    'build',
    'test',
    // 'lint',
    // 'test:daily',
  ];

  for (const script of requiredScripts) {
    it(`has "${script}" script`, () => {
      expect(pkg.scripts?.[script], `Missing script: "${script}"`).toBeDefined();
    });
  }
});

// ════════════════════════════════════════════════════════════════
// PATTERN 5: Environment variables check (non-secret)
// ════════════════════════════════════════════════════════════════

describe('Environment Setup', () => {
  it('.env.example or .env.local exists', () => {
    const hasEnvExample = fs.existsSync(path.join(ROOT, '.env.example'));
    const hasEnvLocal = fs.existsSync(path.join(ROOT, '.env.local'));
    const hasEnv = fs.existsSync(path.join(ROOT, '.env'));
    expect(
      hasEnvExample || hasEnvLocal || hasEnv,
      'No .env file found — create .env.example with required variables',
    ).toBe(true);
  });

  // Check that critical env vars are documented (not their values!)
  it('.env.example documents required variables', () => {
    const envExamplePath = path.join(ROOT, '.env.example');
    if (!fs.existsSync(envExamplePath)) return; // Skip if no .env.example

    const content = fs.readFileSync(envExamplePath, 'utf-8');
    const requiredVars: string[] = [
      // 'DATABASE_URL',
      // 'NEXTAUTH_SECRET',
      // 'NEXTAUTH_URL',
    ];

    for (const varName of requiredVars) {
      expect(content, `${varName} not documented in .env.example`).toContain(varName);
    }
  });
});

// ════════════════════════════════════════════════════════════════
// PATTERN 6: No circular dependencies (lightweight check)
// ════════════════════════════════════════════════════════════════

describe('Import Health', () => {
  it('critical modules can be imported without circular dependency errors', async () => {
    // Uncomment and adjust:
    // await expect(import('@/lib/utils')).resolves.toBeDefined();
    // await expect(import('@/lib/db')).resolves.toBeDefined();

    expect(true).toBe(true); // placeholder
  });
});

// ════════════════════════════════════════════════════════════════
// PATTERN 7: File size sanity checks
// ════════════════════════════════════════════════════════════════

describe('Bundle Sanity', () => {
  it('no single source file exceeds 500KB (likely accidental data)', () => {
    const checkDir = (dir: string) => {
      if (!fs.existsSync(dir)) return;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory() && !['node_modules', '.next', '.git', 'coverage'].includes(entry.name)) {
          checkDir(fullPath);
        } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
          const stats = fs.statSync(fullPath);
          const sizeKB = stats.size / 1024;
          expect(sizeKB, `${fullPath} is ${sizeKB.toFixed(0)}KB — suspiciously large`).toBeLessThan(500);
        }
      }
    };
    checkDir(ROOT);
  });
});
