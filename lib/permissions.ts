/**
 * Permission system for HomeLedger
 * Each sidebar item has a permission key. Admin controls which permissions each user has.
 * Admin users always have ALL permissions. Empty permissions array = all permissions (owner/admin default).
 */

// All available permission keys — each maps to a sidebar item and route
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
  'settings',
] as const;

export type PermissionKey = typeof ALL_PERMISSIONS[number];

// Map sidebar href → permission key
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
  '/settings': 'settings',
};

// Permission labels for admin UI
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
  settings: 'Settings',
};

// Default plan permissions
export const PLAN_PERMISSIONS: Record<string, PermissionKey[]> = {
  free: ['dashboard', 'statements', 'categories', 'settings', 'learn'],
  starter: ['dashboard', 'household', 'entities', 'statements', 'documents', 'invoices', 'bills', 'actions', 'categories', 'reports', 'files', 'settings', 'learn'],
  pro: [...ALL_PERMISSIONS] as PermissionKey[],
  enterprise: [...ALL_PERMISSIONS] as PermissionKey[],
};

/**
 * Check if a user has a specific permission.
 * - Admin role always has all permissions
 * - Empty permissions array = all permissions (backward compat / owner default)
 * - Otherwise check if permission is in the user's permissions array
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
 * Get the list of permissions for a given plan.
 */
export function getPermissionsForPlan(plan: string): PermissionKey[] {
  return PLAN_PERMISSIONS[plan] || PLAN_PERMISSIONS.free;
}
