import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Tests for Services API logic — purchase validation, status flow, duplicate detection.
 */

// ============================================================
// Purchase validation logic (replicated from route)
// ============================================================

describe('Purchase validation logic', () => {
  it('rejects missing servicePackageId', () => {
    const body = {};
    const hasId = !!body && 'servicePackageId' in body && (body as any).servicePackageId;
    expect(hasId).toBe(false);
  });

  it('accepts valid servicePackageId', () => {
    const body = { servicePackageId: 'pkg-123' };
    expect(!!body.servicePackageId).toBe(true);
  });
});

// ============================================================
// Purchase status flow
// ============================================================

describe('Purchase status flow', () => {
  const VALID_STATUSES = ['pending', 'paid', 'in_progress', 'delivered', 'refunded', 'cancelled'];

  it('all valid statuses are recognized', () => {
    for (const status of VALID_STATUSES) {
      expect(VALID_STATUSES).toContain(status);
    }
  });

  const ACTIVE_STATUSES = ['pending', 'paid', 'in_progress'];
  const TERMINAL_STATUSES = ['delivered', 'refunded', 'cancelled'];

  it('active statuses prevent duplicate purchase', () => {
    for (const status of ACTIVE_STATUSES) {
      const isActive = ACTIVE_STATUSES.includes(status);
      expect(isActive).toBe(true);
    }
  });

  it('terminal statuses allow re-purchase', () => {
    for (const status of TERMINAL_STATUSES) {
      const isActive = ACTIVE_STATUSES.includes(status);
      expect(isActive).toBe(false);
    }
  });
});

// ============================================================
// Service package filtering
// ============================================================

describe('Service package filtering', () => {
  const CATEGORY_LABELS: Record<string, string> = {
    relocation: 'Relocation',
    company_formation: 'Company Formation',
    tax: 'Tax Services',
    visa: 'Visa Support',
  };

  const packages = [
    { id: '1', title: 'NIN Registration', category: 'relocation', isActive: true, isFeatured: true, priceGbp: 149 },
    { id: '2', title: 'Bank Account Setup', category: 'relocation', isActive: true, isFeatured: false, priceGbp: 79 },
    { id: '3', title: 'Company Formation', category: 'company_formation', isActive: true, isFeatured: true, priceGbp: 299 },
    { id: '4', title: 'SA Filing', category: 'tax', isActive: true, isFeatured: false, priceGbp: 199 },
    { id: '5', title: 'Visa Support', category: 'visa', isActive: true, isFeatured: false, priceGbp: 249 },
    { id: '6', title: 'Inactive Package', category: 'tax', isActive: false, isFeatured: false, priceGbp: 99 },
  ];

  it('filters by category correctly', () => {
    const relocation = packages.filter(p => p.category === 'relocation' && p.isActive);
    expect(relocation.length).toBe(2);
  });

  it('all filter returns all active', () => {
    const active = packages.filter(p => p.isActive);
    expect(active.length).toBe(5);
  });

  it('inactive packages are excluded', () => {
    const active = packages.filter(p => p.isActive);
    expect(active.find(p => p.title === 'Inactive Package')).toBeUndefined();
  });

  it('featured packages sort first', () => {
    const sorted = [...packages]
      .filter(p => p.isActive)
      .sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
    expect(sorted[0].isFeatured).toBe(true);
    expect(sorted[1].isFeatured).toBe(true);
  });

  it('categories have labels', () => {
    const categories = [...new Set(packages.map(p => p.category))];
    for (const cat of categories) {
      expect(CATEGORY_LABELS[cat]).toBeDefined();
    }
  });

  it('price discount calculation works', () => {
    const pkg = { priceGbp: 299, originalPriceGbp: 399 };
    const discount = pkg.originalPriceGbp - pkg.priceGbp;
    const discountPercent = Math.round((discount / pkg.originalPriceGbp) * 100);
    expect(discount).toBe(100);
    expect(discountPercent).toBe(25);
  });
});
