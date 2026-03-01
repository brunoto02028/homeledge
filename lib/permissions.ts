/**
 * Permission system for HomeLedger
 * Each sidebar item has a permission key. Admin controls which permissions each user has.
 * Admin users always have ALL permissions. Empty permissions array = all permissions (owner/admin default).
 */

/** All available permission keys — each maps to a sidebar item and route in the application. */
export const ALL_PERMISSIONS = [
  'dashboard',
  'household',
  'entities',
  'statements',
  'documents',
  'life_events',
  'invoices',
  'bills',
  'providers',
  'actions',
  'categories',
  'reports',
  'files',
  'vault',
  'projections',
  'transfers',
  'properties',
  'product_calculator',
  'tax_timeline',
  'learn',
  'academy',
  'relocation',
  'services',
  'english_hub',
  'email',
  'intelligence',
  'settings',
] as const;

export type PermissionKey = typeof ALL_PERMISSIONS[number];

/** Maps sidebar href paths to their corresponding permission key for route-level access control. */
export const ROUTE_PERMISSION_MAP: Record<string, PermissionKey> = {
  '/dashboard': 'dashboard',
  '/household': 'household',
  '/entities': 'entities',
  '/statements': 'statements',
  '/documents': 'documents',
  '/life-events': 'life_events',
  '/invoices': 'invoices',
  '/bills': 'bills',
  '/providers': 'providers',
  '/actions': 'actions',
  '/categories': 'categories',
  '/reports': 'reports',
  '/files': 'files',
  '/vault': 'vault',
  '/projections': 'projections',
  '/transfers': 'transfers',
  '/properties': 'properties',
  '/product-calculator': 'product_calculator',
  '/tax-timeline': 'tax_timeline',
  '/learn': 'learn',
  '/academy': 'academy',
  '/relocation': 'relocation',
  '/services': 'services',
  '/english-hub': 'english_hub',
  '/email': 'email',
  '/intelligence': 'intelligence',
  '/settings': 'settings',
};

/** Human-readable labels for each permission key, used in the admin UI permission grid. */
export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  dashboard: 'Dashboard',
  household: 'Household',
  entities: 'Entities',
  statements: 'Statements',
  documents: 'Documents',
  life_events: 'Life Events',
  invoices: 'Invoices',
  bills: 'Bills',
  providers: 'Providers / Banking',
  actions: 'Actions',
  categories: 'Categories',
  reports: 'Reports',
  files: 'Files',
  vault: 'Secure Vault',
  projections: 'Projections',
  transfers: 'Transfers',
  properties: 'Properties',
  product_calculator: 'Product Calculator',
  tax_timeline: 'Tax Timeline',
  learn: 'Learn',
  academy: 'Accounting Academy',
  relocation: 'Relocation Hub',
  services: 'Services',
  english_hub: 'English Hub',
  email: 'Email',
  intelligence: 'Global Intelligence',
  settings: 'Settings',
};

/** Modules reserved for admin only — not available in any customer plan. */
export const ADMIN_ONLY_MODULES: PermissionKey[] = ['learn', 'academy', 'relocation', 'english_hub'];

/** All modules available to customers (excludes admin-only). */
export const CUSTOMER_MODULES = ALL_PERMISSIONS.filter(
  p => !ADMIN_ONLY_MODULES.includes(p)
) as PermissionKey[];

/**
 * Default permission sets for each subscription plan.
 * - `none`: Expired / no plan — dashboard + settings only (forces upgrade)
 * - `starter`: Personal finance essentials (11 modules)
 * - `pro`: Full self-service for sole traders & freelancers (19 modules)
 * - `business`: Everything + gov APIs, team, advanced features (all customer modules)
 * - `managed`: Everything in business + professional bookkeeping service
 *
 * Learning modules (learn, academy, relocation, english_hub) are admin-only.
 * All plans include 7-day free trial, then auto-charge via Stripe.
 */
export const PLAN_PERMISSIONS: Record<string, PermissionKey[]> = {
  none: ['dashboard', 'settings'],
  intelligence: ['dashboard', 'intelligence', 'settings'],
  starter: [
    'dashboard', 'statements', 'categories', 'invoices', 'bills',
    'documents', 'files', 'actions', 'life_events', 'vault', 'intelligence', 'settings',
  ],
  pro: [
    'dashboard', 'statements', 'categories', 'invoices', 'bills',
    'documents', 'files', 'actions', 'life_events', 'vault', 'settings',
    'entities', 'household', 'reports', 'projections', 'properties',
    'product_calculator', 'tax_timeline', 'email', 'transfers',
    'providers', 'services',
  ],
  business: [...CUSTOMER_MODULES] as PermissionKey[],
  managed: [...CUSTOMER_MODULES] as PermissionKey[],
};

/**
 * Check if a user has a specific permission.
 *
 * @param userRole - The user's role (`'admin'`, `'accountant'`, `'user'`)
 * @param userPermissions - Array of permission keys assigned to the user
 * @param permission - The permission key to check
 * @returns `true` if the user has the permission
 *
 * @remarks
 * - Admin role always returns `true` regardless of permissions array
 * - Empty or null permissions array grants all permissions (backward compat for existing owners)
 * - Otherwise checks if the specific permission is in the user's array
 *
 * @example
 * ```ts
 * hasPermission('admin', [], 'vault') // true (admin always has access)
 * hasPermission('user', [], 'vault')  // true (empty = all access)
 * hasPermission('user', ['dashboard', 'statements'], 'vault') // false
 * ```
 */
export function hasPermission(
  userRole: string,
  userPermissions: string[],
  permission: PermissionKey,
): boolean {
  // Admin always has all permissions
  if (userRole === 'admin') return true;

  // Empty array = all permissions (backward compat for existing users)
  if (!userPermissions || userPermissions.length === 0) return true;

  return userPermissions.includes(permission);
}

/**
 * Check if a user can access a given route path.
 *
 * @param userRole - The user's role
 * @param userPermissions - Array of permission keys assigned to the user
 * @param pathname - The route pathname to check (e.g. `'/academy'`, `'/reports'`)
 * @returns `true` if the user can access the route
 *
 * @remarks
 * - `/admin/*` routes require `'admin'` role
 * - `/accountant/*` routes require `'accountant'` or `'admin'` role
 * - Routes not in `ROUTE_PERMISSION_MAP` are unrestricted
 * - Sub-routes inherit the parent route's permission (e.g. `/statements/upload` → `statements`)
 */
export function canAccessRoute(
  userRole: string,
  userPermissions: string[],
  pathname: string,
): boolean {
  // Admin routes handled separately
  if (pathname.startsWith('/admin')) return userRole === 'admin';

  // Accountant routes
  if (pathname.startsWith('/accountant')) return userRole === 'accountant' || userRole === 'admin';

  // Find matching permission for this route
  const matchedRoute = Object.keys(ROUTE_PERMISSION_MAP).find(
    route => pathname === route || (route !== '/' && pathname.startsWith(route))
  );

  if (!matchedRoute) return true; // Routes not in map are unrestricted

  const permission = ROUTE_PERMISSION_MAP[matchedRoute];
  return hasPermission(userRole, userPermissions, permission);
}

/**
 * Get the list of permissions for a given subscription plan.
 *
 * @param plan - The plan name (`'none'`, `'starter'`, `'pro'`, `'business'`, `'managed'`)
 * @returns Array of permission keys for the plan. Falls back to `none` plan for unknown names.
 */
export function getPermissionsForPlan(plan: string): PermissionKey[] {
  return PLAN_PERMISSIONS[plan] || PLAN_PERMISSIONS.none;
}

/** Plan display names for UI. */
export const PLAN_LABELS: Record<string, string> = {
  none: 'No Plan',
  intelligence: 'Intelligence',
  starter: 'Starter',
  pro: 'Pro',
  business: 'Business',
  managed: 'Managed',
};

/** Plan prices in pence (base price before Stripe fee). */
export const PLAN_PRICES: Record<string, number> = {
  none: 0,
  intelligence: 299,
  starter: 799,
  pro: 1499,
  business: 2999,
  managed: 9999,
};

/** All plans available for customer purchase (excludes 'none'). */
export const PURCHASABLE_PLANS = ['starter', 'pro', 'business', 'managed'] as const;
