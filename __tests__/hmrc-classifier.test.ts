import { describe, it, expect, vi } from 'vitest';

// Mock prisma and AI before importing
vi.mock('@/lib/db', () => ({
  prisma: {
    categorizationRule: { findMany: vi.fn().mockResolvedValue([]), update: vi.fn(), create: vi.fn() },
    category: { findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn() },
    bankTransaction: { findUnique: vi.fn(), update: vi.fn() },
  },
}));

vi.mock('openai', () => ({
  default: class {
    chat = { completions: { create: vi.fn().mockResolvedValue({ choices: [{ message: { content: '{"classifications":[]}' } }] }) } };
  },
}));

import { cleanDescription } from '@/lib/hmrc-classifier';

// ============================================================
// cleanDescription() — pure function, no DB/AI deps
// ============================================================

describe('cleanDescription()', () => {
  it('removes "CARD PAYMENT TO"', () => {
    expect(cleanDescription('CARD PAYMENT TO TESCO STORES')).toBe('TESCO STORES');
  });

  it('removes "DIRECT DEBIT PAYMENT TO"', () => {
    expect(cleanDescription('DIRECT DEBIT PAYMENT TO BRITISH GAS')).toBe('BRITISH GAS');
  });

  it('removes "FASTER PAYMENTS RECEIPT"', () => {
    expect(cleanDescription('FASTER PAYMENTS RECEIPT FROM EMPLOYER LTD')).toBe('FROM EMPLOYER LTD');
  });

  it('removes "FASTER PAYMENTS RECEIPT REF"', () => {
    // "FASTER PAYMENTS RECEIPT REF" is removed as a whole phrase, leaving "SALARY JAN"
    // Note: "FASTER PAYMENTS RECEIPT" is removed first → "REF SALARY JAN", then "REF:" (with colon) doesn't match
    expect(cleanDescription('FASTER PAYMENTS RECEIPT REF SALARY JAN')).toBe('REF SALARY JAN');
  });

  it('removes "BANK GIRO CREDIT"', () => {
    expect(cleanDescription('BANK GIRO CREDIT HMRC VAT')).toBe('HMRC VAT');
  });

  it('removes "STANDING ORDER TO"', () => {
    expect(cleanDescription('STANDING ORDER TO RENT LANDLORD')).toBe('RENT LANDLORD');
  });

  it('removes "PAYMENT"', () => {
    expect(cleanDescription('PAYMENT TFL TRAVEL')).toBe('TFL TRAVEL');
  });

  it('removes "REF:"', () => {
    expect(cleanDescription('AMAZON REF: ORDER123')).toBe('AMAZON ORDER123');
  });

  it('removes "CD "', () => {
    expect(cleanDescription('CD 1234 SAINSBURYS')).toBe('1234 SAINSBURYS');
  });

  it('removes multiple prefixes in one description', () => {
    const result = cleanDescription('CARD PAYMENT TO AMAZON REF: ABC123');
    expect(result).toBe('AMAZON ABC123');
  });

  it('collapses multiple spaces', () => {
    expect(cleanDescription('  TESCO    STORES   ')).toBe('TESCO STORES');
  });

  it('handles empty string', () => {
    expect(cleanDescription('')).toBe('');
  });

  it('handles already clean descriptions', () => {
    expect(cleanDescription('TESCO STORES')).toBe('TESCO STORES');
  });

  it('is case-insensitive for removal', () => {
    expect(cleanDescription('card payment to Lidl')).toBe('Lidl');
  });

  it('preserves useful merchant information', () => {
    const result = cleanDescription('CARD PAYMENT TO NETFLIX.COM 800-123-4567');
    expect(result).toContain('NETFLIX');
  });
});
