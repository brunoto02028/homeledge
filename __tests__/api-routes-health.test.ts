import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * API Route Health Check — verifies all route files exist and export valid HTTP methods.
 * This catches deleted/broken route files BEFORE deployment.
 */

const API_DIR = path.resolve(__dirname, '..', 'app', 'api');

// All known API route files (relative to app/api/)
const EXPECTED_ROUTES = [
  // Auth
  'auth/[...nextauth]/route.ts',
  'auth/forgot-password/route.ts',
  'auth/reset-password/route.ts',
  'auth/send-login-code/route.ts',
  'auth/verify-email/route.ts',
  // Academy
  'academy/courses/route.ts',
  'academy/exam/route.ts',
  'academy/exam/submit/route.ts',
  'academy/ai-practice/route.ts',
  'academy/modules/[moduleId]/questions/route.ts',
  // Admin
  'admin/users/route.ts',
  'admin/users/[id]/route.ts',
  'admin/plans/route.ts',
  'admin/plans/[id]/route.ts',
  'admin/plans/assign/route.ts',
  'admin/compliance/route.ts',
  'admin/credentials/route.ts',
  'admin/credentials/[id]/route.ts',
  'admin/integrations/route.ts',
  'admin/integrations/[id]/route.ts',
  'admin/integrations/[id]/sync/route.ts',
  // Core
  'accounts/route.ts',
  'accounts/[id]/route.ts',
  'actions/route.ts',
  'actions/[id]/route.ts',
  'bills/route.ts',
  'bills/[id]/route.ts',
  // AI
  'ai/ask/route.ts',
  'ai/chat/route.ts',
  // Accountant
  'accountant/clients/route.ts',
  'accountant/clients/[id]/route.ts',
  'accountant/clients/[id]/data/route.ts',
];

describe('API Route Files Exist', () => {
  for (const route of EXPECTED_ROUTES) {
    it(`${route} exists`, () => {
      const fullPath = path.join(API_DIR, route);
      expect(fs.existsSync(fullPath)).toBe(true);
    });
  }
});

describe('API Route Files Export HTTP Methods', () => {
  const VALID_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

  for (const route of EXPECTED_ROUTES) {
    it(`${route} exports at least one HTTP method`, () => {
      const fullPath = path.join(API_DIR, route);
      if (!fs.existsSync(fullPath)) return; // skip if file missing (caught above)

      const content = fs.readFileSync(fullPath, 'utf-8');
      const hasMethod = VALID_METHODS.some(
        method => content.includes(`export async function ${method}`) || content.includes(`export function ${method}`)
      );
      // NextAuth uses a default export pattern
      const isNextAuth = route.includes('[...nextauth]');
      expect(hasMethod || isNextAuth).toBe(true);
    });
  }
});

describe('No Duplicate Route Files', () => {
  it('each route path is unique in the expected list', () => {
    const unique = new Set(EXPECTED_ROUTES);
    expect(unique.size).toBe(EXPECTED_ROUTES.length);
  });
});

describe('Critical Lib Files Exist', () => {
  const LIB_DIR = path.resolve(__dirname, '..', 'lib');
  const CRITICAL_LIBS = [
    'auth.ts',
    'db.ts',
    'utils.ts',
    'permissions.ts',
    'vault-crypto.ts',
    'ai-client.ts',
    'categorization-engine.ts',
    'hmrc-classifier.ts',
    'email.ts',
    'notifications.ts',
    's3.ts',
    'types.ts',
  ];

  for (const lib of CRITICAL_LIBS) {
    it(`lib/${lib} exists`, () => {
      expect(fs.existsSync(path.join(LIB_DIR, lib))).toBe(true);
    });
  }
});

describe('Prisma Schema Health', () => {
  const SCHEMA_PATH = path.resolve(__dirname, '..', 'prisma', 'schema.prisma');

  it('schema.prisma exists', () => {
    expect(fs.existsSync(SCHEMA_PATH)).toBe(true);
  });

  it('schema contains essential models', () => {
    const content = fs.readFileSync(SCHEMA_PATH, 'utf-8');
    const essentialModels = [
      'model User',
      'model Account',
      'model BankStatement',
      'model BankTransaction',
      'model Category',
      'model Entity',
      'model Household',
      'model CourseLevel',
      'model ExamModule',
      'model Question',
    ];
    for (const model of essentialModels) {
      expect(content).toContain(model);
    }
  });

  it('schema has a datasource block', () => {
    const content = fs.readFileSync(SCHEMA_PATH, 'utf-8');
    expect(content).toContain('datasource db');
  });

  it('schema has a generator block', () => {
    const content = fs.readFileSync(SCHEMA_PATH, 'utf-8');
    expect(content).toContain('generator client');
  });
});

describe('Package.json Health', () => {
  const PKG_PATH = path.resolve(__dirname, '..', 'package.json');

  it('package.json exists', () => {
    expect(fs.existsSync(PKG_PATH)).toBe(true);
  });

  it('has required scripts', () => {
    const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf-8'));
    expect(pkg.scripts.dev).toBeDefined();
    expect(pkg.scripts.build).toBeDefined();
    expect(pkg.scripts.start).toBeDefined();
    expect(pkg.scripts.test).toBeDefined();
  });

  it('has essential dependencies', () => {
    const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf-8'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    expect(deps.next).toBeDefined();
    expect(deps.react).toBeDefined();
    expect(deps['@prisma/client']).toBeDefined();
    expect(deps.vitest).toBeDefined();
    expect(deps.typescript).toBeDefined();
  });
});
