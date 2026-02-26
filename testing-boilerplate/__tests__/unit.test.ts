/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  UNIT TEST TEMPLATE                                         ║
 * ║  Test pure functions with no external dependencies.          ║
 * ║  Replace examples with YOUR project's functions.             ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Unit tests should:
 *  ✅ Test ONE function at a time
 *  ✅ Be fast (< 50ms each)
 *  ✅ Have no side effects (no DB, no network, no filesystem)
 *  ✅ Cover: happy path, edge cases, error cases, boundary values
 */

import { describe, it, expect } from 'vitest';

// ─── Import your functions ──────────────────────────────────────
// import { formatCurrency, calculateTax, validateEmail } from '@/lib/utils';

// ════════════════════════════════════════════════════════════════
// PATTERN 1: Simple input → output
// ════════════════════════════════════════════════════════════════

describe('formatCurrency()', () => {
  // --- Happy path ---
  it('formats positive numbers with 2 decimal places', () => {
    // Replace with your actual function
    const format = (n: number) => `£${n.toFixed(2)}`;

    expect(format(1234.5)).toBe('£1234.50');
    expect(format(0)).toBe('£0.00');
    expect(format(99.999)).toBe('£100.00');
  });

  // --- Edge cases ---
  it('handles negative values', () => {
    const format = (n: number) => `£${n.toFixed(2)}`;
    expect(format(-50)).toBe('£-50.00');
  });

  // --- Boundary values ---
  it('handles very large numbers', () => {
    const format = (n: number) => `£${n.toFixed(2)}`;
    expect(format(999999999.99)).toBe('£999999999.99');
  });
});

// ════════════════════════════════════════════════════════════════
// PATTERN 2: Validation functions (returns boolean or throws)
// ════════════════════════════════════════════════════════════════

describe('validateEmail()', () => {
  // Replace with your actual validation function
  const validateEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // --- Valid inputs ---
  it('accepts valid email addresses', () => {
    expect(validateEmail('user@example.com')).toBe(true);
    expect(validateEmail('name.surname@company.co.uk')).toBe(true);
    expect(validateEmail('test+tag@gmail.com')).toBe(true);
  });

  // --- Invalid inputs ---
  it('rejects invalid email addresses', () => {
    expect(validateEmail('')).toBe(false);
    expect(validateEmail('not-an-email')).toBe(false);
    expect(validateEmail('@no-user.com')).toBe(false);
    expect(validateEmail('no-domain@')).toBe(false);
    expect(validateEmail('spaces in@email.com')).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════
// PATTERN 3: String transformation / parsing
// ════════════════════════════════════════════════════════════════

describe('cleanDescription()', () => {
  // Replace with your actual function
  const cleanDescription = (desc: string): string =>
    desc
      .replace(/CARD PAYMENT TO /gi, '')
      .replace(/DIRECT DEBIT PAYMENT TO /gi, '')
      .replace(/\s+/g, ' ')
      .trim();

  it('removes payment prefixes', () => {
    expect(cleanDescription('CARD PAYMENT TO TESCO STORES')).toBe('TESCO STORES');
    expect(cleanDescription('DIRECT DEBIT PAYMENT TO BRITISH GAS')).toBe('BRITISH GAS');
  });

  it('collapses multiple spaces', () => {
    expect(cleanDescription('CARD PAYMENT TO   AMAZON   UK')).toBe('AMAZON UK');
  });

  it('handles empty string', () => {
    expect(cleanDescription('')).toBe('');
  });

  it('preserves already clean descriptions', () => {
    expect(cleanDescription('NETFLIX.COM')).toBe('NETFLIX.COM');
  });

  // --- Case insensitivity ---
  it('is case-insensitive', () => {
    expect(cleanDescription('card payment to Spotify')).toBe('Spotify');
  });
});

// ════════════════════════════════════════════════════════════════
// PATTERN 4: Calculation functions
// ════════════════════════════════════════════════════════════════

describe('calculateTax()', () => {
  // Replace with your actual tax calculation
  const calculateTax = (income: number): number => {
    if (income <= 12570) return 0;                        // Personal allowance
    if (income <= 50270) return (income - 12570) * 0.20;  // Basic rate
    if (income <= 125140) return 7540 + (income - 50270) * 0.40; // Higher rate
    return 7540 + 29948 + (income - 125140) * 0.45;      // Additional rate
  };

  it('returns 0 for income within personal allowance', () => {
    expect(calculateTax(0)).toBe(0);
    expect(calculateTax(12570)).toBe(0);
  });

  it('calculates basic rate correctly', () => {
    expect(calculateTax(20000)).toBeCloseTo(1486, 0);
    expect(calculateTax(50270)).toBeCloseTo(7540, 0);
  });

  it('calculates higher rate correctly', () => {
    expect(calculateTax(60000)).toBeCloseTo(11432, 0);
  });

  // --- Parameterised tests (table-driven) ---
  it.each([
    { income: 0, expected: 0 },
    { income: 12570, expected: 0 },
    { income: 20000, expected: 1486 },
    { income: 50270, expected: 7540 },
  ])('income £$income → tax £$expected', ({ income, expected }) => {
    expect(calculateTax(income)).toBeCloseTo(expected, 0);
  });
});

// ════════════════════════════════════════════════════════════════
// PATTERN 5: Array / object transformation
// ════════════════════════════════════════════════════════════════

describe('groupByCategory()', () => {
  interface Transaction { id: string; category: string; amount: number }

  const groupByCategory = (txs: Transaction[]): Record<string, number> => {
    return txs.reduce((acc, tx) => {
      acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
      return acc;
    }, {} as Record<string, number>);
  };

  it('groups and sums amounts by category', () => {
    const result = groupByCategory([
      { id: '1', category: 'Food', amount: 50 },
      { id: '2', category: 'Transport', amount: 30 },
      { id: '3', category: 'Food', amount: 25 },
    ]);
    expect(result).toEqual({ Food: 75, Transport: 30 });
  });

  it('returns empty object for empty array', () => {
    expect(groupByCategory([])).toEqual({});
  });

  it('handles single transaction', () => {
    const result = groupByCategory([{ id: '1', category: 'Bills', amount: 100 }]);
    expect(result).toEqual({ Bills: 100 });
  });
});

// ════════════════════════════════════════════════════════════════
// PATTERN 6: Date / time functions
// ════════════════════════════════════════════════════════════════

describe('isOverdue()', () => {
  const isOverdue = (dueDate: string | null, status: string): boolean => {
    if (!dueDate || status === 'completed' || status === 'cancelled') return false;
    return new Date(dueDate) < new Date();
  };

  it('returns false for null due date', () => {
    expect(isOverdue(null, 'pending')).toBe(false);
  });

  it('returns false for completed tasks', () => {
    expect(isOverdue('2020-01-01', 'completed')).toBe(false);
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

// ════════════════════════════════════════════════════════════════
// PATTERN 7: Error handling
// ════════════════════════════════════════════════════════════════

describe('parseJSON()', () => {
  const parseJSON = <T>(str: string, fallback: T): T => {
    try {
      return JSON.parse(str);
    } catch {
      return fallback;
    }
  };

  it('parses valid JSON', () => {
    expect(parseJSON('{"a":1}', {})).toEqual({ a: 1 });
  });

  it('returns fallback for invalid JSON', () => {
    expect(parseJSON('not json', { error: true })).toEqual({ error: true });
  });

  it('returns fallback for empty string', () => {
    expect(parseJSON('', [])).toEqual([]);
  });
});
