import { describe, it, expect } from 'vitest';
import {
  cn,
  calculateMonthlyEquivalent,
  formatCurrency,
  formatDate,
  getFrequencyLabel,
  isOverdue,
  getUpcomingDueDate,
  getDaysUntilDue,
} from '@/lib/utils';

// ============================================================
// cn() — Tailwind class merge
// ============================================================

describe('cn()', () => {
  it('merges simple classes', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1');
  });

  it('resolves conflicting Tailwind classes', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', true && 'visible')).toBe('base visible');
  });

  it('handles empty input', () => {
    expect(cn()).toBe('');
  });

  it('handles undefined/null inputs', () => {
    expect(cn('base', undefined, null)).toBe('base');
  });
});

// ============================================================
// calculateMonthlyEquivalent()
// ============================================================

describe('calculateMonthlyEquivalent()', () => {
  it('weekly: £100 × 52 / 12 = £433.33', () => {
    expect(calculateMonthlyEquivalent(100, 'weekly')).toBeCloseTo(433.33, 1);
  });

  it('monthly: returns same amount', () => {
    expect(calculateMonthlyEquivalent(100, 'monthly')).toBe(100);
  });

  it('quarterly: £300 × 4 / 12 = £100', () => {
    expect(calculateMonthlyEquivalent(300, 'quarterly')).toBe(100);
  });

  it('yearly: £1200 / 12 = £100', () => {
    expect(calculateMonthlyEquivalent(1200, 'yearly')).toBe(100);
  });

  it('one_time: returns 0', () => {
    expect(calculateMonthlyEquivalent(500, 'one_time')).toBe(0);
  });

  it('handles zero amount', () => {
    expect(calculateMonthlyEquivalent(0, 'monthly')).toBe(0);
    expect(calculateMonthlyEquivalent(0, 'weekly')).toBe(0);
  });

  it('handles negative amounts', () => {
    expect(calculateMonthlyEquivalent(-120, 'yearly')).toBe(-10);
  });
});

// ============================================================
// formatCurrency()
// ============================================================

describe('formatCurrency()', () => {
  it('formats GBP by default', () => {
    const result = formatCurrency(1234.56);
    expect(result).toContain('1,234.56');
    expect(result).toContain('£');
  });

  it('formats zero', () => {
    expect(formatCurrency(0)).toContain('0.00');
  });

  it('formats negative values', () => {
    const result = formatCurrency(-500);
    expect(result).toContain('500.00');
  });

  it('formats with explicit currency', () => {
    const eur = formatCurrency(100, 'EUR');
    expect(eur).toContain('100.00');
  });

  it('rounds to 2 decimal places', () => {
    const result = formatCurrency(99.999);
    expect(result).toContain('100.00');
  });

  it('formats large numbers with commas', () => {
    const result = formatCurrency(1000000);
    expect(result).toContain('1,000,000.00');
  });
});

// ============================================================
// formatDate()
// ============================================================

describe('formatDate()', () => {
  it('formats ISO date string to UK format', () => {
    const result = formatDate('2025-01-15T00:00:00Z');
    expect(result).toContain('15');
    expect(result).toContain('Jan');
    expect(result).toContain('2025');
  });

  it('formats another date', () => {
    const result = formatDate('2024-12-25T12:00:00Z');
    expect(result).toContain('25');
    expect(result).toContain('Dec');
    expect(result).toContain('2024');
  });
});

// ============================================================
// getFrequencyLabel()
// ============================================================

describe('getFrequencyLabel()', () => {
  it('returns correct labels', () => {
    expect(getFrequencyLabel('one_time')).toBe('One-time');
    expect(getFrequencyLabel('weekly')).toBe('Weekly');
    expect(getFrequencyLabel('monthly')).toBe('Monthly');
    expect(getFrequencyLabel('quarterly')).toBe('Quarterly');
    expect(getFrequencyLabel('yearly')).toBe('Yearly');
  });
});

// ============================================================
// isOverdue()
// ============================================================

describe('isOverdue()', () => {
  it('returns false for null dueDate', () => {
    expect(isOverdue(null, 'pending')).toBe(false);
    expect(isOverdue(undefined, 'pending')).toBe(false);
  });

  it('returns false for completed status', () => {
    expect(isOverdue('2020-01-01', 'completed')).toBe(false);
  });

  it('returns false for rejected status', () => {
    expect(isOverdue('2020-01-01', 'rejected')).toBe(false);
  });

  it('returns true for past date with pending status', () => {
    expect(isOverdue('2020-01-01', 'pending')).toBe(true);
  });

  it('returns false for future date', () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    expect(isOverdue(future.toISOString(), 'pending')).toBe(false);
  });
});

// ============================================================
// getUpcomingDueDate()
// ============================================================

describe('getUpcomingDueDate()', () => {
  it('returns a date in the current month if due day has not passed', () => {
    const now = new Date();
    const dueDay = 28; // usually in the future unless it's late in the month
    const result = getUpcomingDueDate(dueDay);
    expect(result instanceof Date).toBe(true);
    expect(result.getDate()).toBe(dueDay);
  });

  it('returns a date object', () => {
    const result = getUpcomingDueDate(15);
    expect(result instanceof Date).toBe(true);
  });
});

// ============================================================
// getDaysUntilDue()
// ============================================================

describe('getDaysUntilDue()', () => {
  it('returns a number', () => {
    const result = getDaysUntilDue(15);
    expect(typeof result).toBe('number');
  });

  it('returns non-negative for future due dates', () => {
    // Due day 28 is almost always ahead or at most a month away
    const result = getDaysUntilDue(28);
    expect(result).toBeGreaterThanOrEqual(0);
  });
});
