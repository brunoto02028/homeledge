import { describe, it, expect } from 'vitest';
import {
  ALL_PERMISSIONS,
  ROUTE_PERMISSION_MAP,
  PERMISSION_LABELS,
  PLAN_PERMISSIONS,
  hasPermission,
  canAccessRoute,
  getPermissionsForPlan,
} from '@/lib/permissions';

// ============================================================
// Constants integrity
// ============================================================

describe('Permission constants', () => {
  it('ALL_PERMISSIONS has 24 entries', () => {
    expect(ALL_PERMISSIONS.length).toBe(24);
  });

  it('every permission has a label', () => {
    for (const perm of ALL_PERMISSIONS) {
      expect(PERMISSION_LABELS[perm]).toBeDefined();
      expect(typeof PERMISSION_LABELS[perm]).toBe('string');
      expect(PERMISSION_LABELS[perm].length).toBeGreaterThan(0);
    }
  });

  it('every route maps to a valid permission', () => {
    for (const [route, perm] of Object.entries(ROUTE_PERMISSION_MAP)) {
      expect(route.startsWith('/')).toBe(true);
      expect(ALL_PERMISSIONS).toContain(perm);
    }
  });

  it('all plan permissions are valid permission keys', () => {
    for (const [plan, perms] of Object.entries(PLAN_PERMISSIONS)) {
      for (const p of perms) {
        expect(ALL_PERMISSIONS).toContain(p);
      }
    }
  });

  it('pro and enterprise plans have ALL permissions', () => {
    expect(PLAN_PERMISSIONS.pro.length).toBe(ALL_PERMISSIONS.length);
    expect(PLAN_PERMISSIONS.enterprise.length).toBe(ALL_PERMISSIONS.length);
  });

  it('free plan includes dashboard and settings', () => {
    expect(PLAN_PERMISSIONS.free).toContain('dashboard');
    expect(PLAN_PERMISSIONS.free).toContain('settings');
  });

  it('free plan includes academy, relocation, services', () => {
    expect(PLAN_PERMISSIONS.free).toContain('academy');
    expect(PLAN_PERMISSIONS.free).toContain('relocation');
    expect(PLAN_PERMISSIONS.free).toContain('services');
  });

  it('starter plan is a superset of free plan', () => {
    for (const perm of PLAN_PERMISSIONS.free) {
      expect(PLAN_PERMISSIONS.starter).toContain(perm);
    }
  });
});

// ============================================================
// hasPermission()
// ============================================================

describe('hasPermission', () => {
  it('admin always has permission regardless of permissions array', () => {
    expect(hasPermission('admin', [], 'vault')).toBe(true);
    expect(hasPermission('admin', ['dashboard'], 'vault')).toBe(true);
    expect(hasPermission('admin', ['statements'], 'reports')).toBe(true);
  });

  it('empty permissions array grants all permissions (backward compat)', () => {
    expect(hasPermission('user', [], 'vault')).toBe(true);
    expect(hasPermission('user', [], 'reports')).toBe(true);
    expect(hasPermission('user', [], 'academy')).toBe(true);
  });

  it('null/undefined permissions grants all permissions', () => {
    expect(hasPermission('user', null as any, 'vault')).toBe(true);
    expect(hasPermission('user', undefined as any, 'vault')).toBe(true);
  });

  it('user with specific permissions can access granted features', () => {
    const perms = ['dashboard', 'statements', 'categories'];
    expect(hasPermission('user', perms, 'dashboard')).toBe(true);
    expect(hasPermission('user', perms, 'statements')).toBe(true);
    expect(hasPermission('user', perms, 'categories')).toBe(true);
  });

  it('user with specific permissions cannot access ungrated features', () => {
    const perms = ['dashboard', 'statements'];
    expect(hasPermission('user', perms, 'vault')).toBe(false);
    expect(hasPermission('user', perms, 'reports')).toBe(false);
    expect(hasPermission('user', perms, 'projections')).toBe(false);
  });

  it('accountant role follows permission array', () => {
    expect(hasPermission('accountant', ['dashboard', 'reports'], 'reports')).toBe(true);
    expect(hasPermission('accountant', ['dashboard', 'reports'], 'vault')).toBe(false);
  });
});

// ============================================================
// canAccessRoute()
// ============================================================

describe('canAccessRoute', () => {
  it('admin can access /admin routes', () => {
    expect(canAccessRoute('admin', [], '/admin/users')).toBe(true);
    expect(canAccessRoute('admin', [], '/admin/plans')).toBe(true);
    expect(canAccessRoute('admin', [], '/admin/compliance')).toBe(true);
  });

  it('non-admin cannot access /admin routes', () => {
    expect(canAccessRoute('user', [], '/admin/users')).toBe(false);
    expect(canAccessRoute('accountant', [], '/admin/users')).toBe(false);
  });

  it('accountant can access /accountant routes', () => {
    expect(canAccessRoute('accountant', [], '/accountant/dashboard')).toBe(true);
  });

  it('admin can also access /accountant routes', () => {
    expect(canAccessRoute('admin', [], '/accountant/dashboard')).toBe(true);
  });

  it('regular user cannot access /accountant routes', () => {
    expect(canAccessRoute('user', [], '/accountant/dashboard')).toBe(false);
  });

  it('routes not in permission map are unrestricted', () => {
    expect(canAccessRoute('user', ['dashboard'], '/login')).toBe(true);
    expect(canAccessRoute('user', ['dashboard'], '/register')).toBe(true);
    expect(canAccessRoute('user', ['dashboard'], '/some-unknown-page')).toBe(true);
  });

  it('mapped routes respect user permissions', () => {
    const perms = ['dashboard', 'statements'];
    expect(canAccessRoute('user', perms, '/dashboard')).toBe(true);
    expect(canAccessRoute('user', perms, '/statements')).toBe(true);
    expect(canAccessRoute('user', perms, '/vault')).toBe(false);
    expect(canAccessRoute('user', perms, '/reports')).toBe(false);
  });

  it('sub-routes inherit parent permission', () => {
    const perms = ['statements'];
    expect(canAccessRoute('user', perms, '/statements')).toBe(true);
    expect(canAccessRoute('user', perms, '/statements/upload')).toBe(true);
    expect(canAccessRoute('user', perms, '/statements/123/edit')).toBe(true);
  });

  it('academy route requires academy permission', () => {
    expect(canAccessRoute('user', ['academy'], '/academy')).toBe(true);
    expect(canAccessRoute('user', ['academy'], '/academy/exam/123')).toBe(true);
    expect(canAccessRoute('user', ['dashboard'], '/academy')).toBe(false);
  });

  it('relocation and services routes work', () => {
    const perms = ['relocation', 'services'];
    expect(canAccessRoute('user', perms, '/relocation')).toBe(true);
    expect(canAccessRoute('user', perms, '/services')).toBe(true);
    expect(canAccessRoute('user', perms, '/academy')).toBe(false);
  });
});

// ============================================================
// getPermissionsForPlan()
// ============================================================

describe('getPermissionsForPlan', () => {
  it('returns correct permissions for known plans', () => {
    expect(getPermissionsForPlan('free')).toEqual(PLAN_PERMISSIONS.free);
    expect(getPermissionsForPlan('starter')).toEqual(PLAN_PERMISSIONS.starter);
    expect(getPermissionsForPlan('pro')).toEqual(PLAN_PERMISSIONS.pro);
    expect(getPermissionsForPlan('enterprise')).toEqual(PLAN_PERMISSIONS.enterprise);
  });

  it('returns free plan for unknown plan names', () => {
    expect(getPermissionsForPlan('nonexistent')).toEqual(PLAN_PERMISSIONS.free);
    expect(getPermissionsForPlan('')).toEqual(PLAN_PERMISSIONS.free);
  });

  it('pro plan returns all 24 permissions', () => {
    const pro = getPermissionsForPlan('pro');
    expect(pro.length).toBe(24);
    expect(pro).toContain('academy');
    expect(pro).toContain('vault');
    expect(pro).toContain('projections');
  });
});
