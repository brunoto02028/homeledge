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
  settings: 'Settings',
};

/**
 * Default permission sets for each subscription plan.
 * - `free`: Basic features (8 permissions)
 * - `starter`: Core features (16 permissions)
 * - `pro`: All features
 * - `enterprise`: All features
 */
export const PLAN_PERMISSIONS: Record<string, PermissionKey[]> = {
  free: ['dashboard', 'statements', 'categories', 'settings', 'learn', 'academy', 'relocation', 'services', 'english_hub'],
  starter: ['dashboard', 'household', 'entities', 'statements', 'documents', 'invoices', 'bills', 'actions', 'categories', 'reports', 'files', 'settings', 'learn', 'academy', 'relocation', 'services', 'english_hub'],
  pro: [...ALL_PERMISSIONS] as PermissionKey[],
  enterprise: [...ALL_PERMISSIONS] as PermissionKey[],
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
 * @param plan - The plan name (`'free'`, `'starter'`, `'pro'`, `'enterprise'`)
 * @returns Array of permission keys for the plan. Falls back to `free` plan for unknown names.
 */
export function getPermissionsForPlan(plan: string): PermissionKey[] {
  return PLAN_PERMISSIONS[plan] || PLAN_PERMISSIONS.free;
}
