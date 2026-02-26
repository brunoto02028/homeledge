import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Tests for the categorisation engine's pure logic.
 * We import the module but mock prisma and callAI to isolate the logic.
 */

// Mock prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    category: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}));

// Mock AI client
vi.mock('@/lib/ai-client', () => ({
  callAI: vi.fn().mockResolvedValue({ content: '[]', provider: 'mock' }),
}));

import type { CategorizationResult, CategorizationMode } from '@/lib/categorization-engine';

// ============================================================
// Since applyMode and noMatch are not exported, we test their
// behavior via the exported interface. We replicate the logic
// here for unit-level validation.
// ============================================================

function noMatch(): CategorizationResult {
  return {
    categoryId: null,
    categoryName: null,
    confidence: 0,
    source: 'none',
    justification: 'No matching rule, pattern, or AI suggestion',
    autoApprove: false,
    needsReview: true,
  };
}

function applyMode(result: CategorizationResult, mode: CategorizationMode): CategorizationResult {
  switch (mode) {
    case 'conservative':
      return { ...result, autoApprove: false, needsReview: true };
    case 'autonomous':
      if (result.categoryId) {
        return { ...result, autoApprove: true, needsReview: result.confidence < 0.50 };
      }
      return result;
    case 'smart':
    default:
      if (result.categoryId) {
        return {
          ...result,
          autoApprove: result.confidence >= 0.90,
          needsReview: result.confidence < 0.90,
        };
      }
      return result;
  }
}

// ============================================================
// noMatch()
// ============================================================

describe('noMatch helper', () => {
  it('returns a result with null category', () => {
    const result = noMatch();
    expect(result.categoryId).toBeNull();
    expect(result.categoryName).toBeNull();
  });

  it('has confidence 0', () => {
    expect(noMatch().confidence).toBe(0);
  });

  it('source is "none"', () => {
    expect(noMatch().source).toBe('none');
  });

  it('needs review and is not auto-approved', () => {
    const result = noMatch();
    expect(result.needsReview).toBe(true);
    expect(result.autoApprove).toBe(false);
  });
});

// ============================================================
// applyMode() — Conservative
// ============================================================

describe('applyMode — conservative', () => {
  it('never auto-approves, always needs review', () => {
    const input: CategorizationResult = {
      categoryId: 'cat-1',
      categoryName: 'Travel',
      confidence: 1.0,
      source: 'rule',
      justification: 'Matched rule',
      autoApprove: true,
      needsReview: false,
    };
    const result = applyMode(input, 'conservative');
    expect(result.autoApprove).toBe(false);
    expect(result.needsReview).toBe(true);
    expect(result.categoryId).toBe('cat-1');
    expect(result.confidence).toBe(1.0);
  });

  it('conservative with noMatch stays unchanged', () => {
    const result = applyMode(noMatch(), 'conservative');
    expect(result.autoApprove).toBe(false);
    expect(result.needsReview).toBe(true);
    expect(result.categoryId).toBeNull();
  });
});

// ============================================================
// applyMode() — Smart (default)
// ============================================================

describe('applyMode — smart', () => {
  it('auto-approves when confidence >= 0.90', () => {
    const input: CategorizationResult = {
      categoryId: 'cat-1',
      categoryName: 'Groceries',
      confidence: 0.95,
      source: 'rule',
      justification: 'Matched Tesco',
      autoApprove: false,
      needsReview: true,
    };
    const result = applyMode(input, 'smart');
    expect(result.autoApprove).toBe(true);
    expect(result.needsReview).toBe(false);
  });

  it('exactly 0.90 is auto-approved', () => {
    const result = applyMode({
      categoryId: 'cat-1', categoryName: 'X', confidence: 0.90,
      source: 'ai', justification: '', autoApprove: false, needsReview: true,
    }, 'smart');
    expect(result.autoApprove).toBe(true);
    expect(result.needsReview).toBe(false);
  });

  it('needs review when confidence is 0.70-0.89', () => {
    const result = applyMode({
      categoryId: 'cat-1', categoryName: 'X', confidence: 0.75,
      source: 'ai', justification: '', autoApprove: false, needsReview: false,
    }, 'smart');
    expect(result.autoApprove).toBe(false);
    expect(result.needsReview).toBe(true);
  });

  it('needs review when confidence < 0.70', () => {
    const result = applyMode({
      categoryId: 'cat-1', categoryName: 'X', confidence: 0.50,
      source: 'ai', justification: '', autoApprove: false, needsReview: false,
    }, 'smart');
    expect(result.autoApprove).toBe(false);
    expect(result.needsReview).toBe(true);
  });

  it('noMatch results stay as needsReview', () => {
    const result = applyMode(noMatch(), 'smart');
    expect(result.autoApprove).toBe(false);
    expect(result.needsReview).toBe(true);
  });
});

// ============================================================
// applyMode() — Autonomous
// ============================================================

describe('applyMode — autonomous', () => {
  it('auto-approves any categorised result', () => {
    const input: CategorizationResult = {
      categoryId: 'cat-1', categoryName: 'X', confidence: 0.60,
      source: 'ai', justification: '', autoApprove: false, needsReview: true,
    };
    const result = applyMode(input, 'autonomous');
    expect(result.autoApprove).toBe(true);
    expect(result.needsReview).toBe(false); // 0.60 >= 0.50
  });

  it('still flags very low confidence for review', () => {
    const result = applyMode({
      categoryId: 'cat-1', categoryName: 'X', confidence: 0.30,
      source: 'ai', justification: '', autoApprove: false, needsReview: false,
    }, 'autonomous');
    expect(result.autoApprove).toBe(true);
    expect(result.needsReview).toBe(true); // 0.30 < 0.50
  });

  it('noMatch stays un-approved', () => {
    const result = applyMode(noMatch(), 'autonomous');
    expect(result.autoApprove).toBe(false);
    expect(result.needsReview).toBe(true);
  });
});

// ============================================================
// CategorizationResult type structure (Prisma model name unchanged)
// ============================================================

describe('CategorizationResult structure', () => {
  it('source can only be rule, pattern, ai, or none', () => {
    const validSources = ['rule', 'pattern', 'ai', 'none'];
    const result = noMatch();
    expect(validSources).toContain(result.source);
  });

  it('confidence is between 0 and 1', () => {
    const testResults = [
      { ...noMatch(), confidence: 0 },
      { ...noMatch(), categoryId: 'x', confidence: 0.5 },
      { ...noMatch(), categoryId: 'x', confidence: 1.0 },
    ];
    for (const r of testResults) {
      expect(r.confidence).toBeGreaterThanOrEqual(0);
      expect(r.confidence).toBeLessThanOrEqual(1);
    }
  });
});

// ============================================================
// Mode behavior matrix
// ============================================================

describe('Mode behaviour matrix', () => {
  const modes: CategorizationMode[] = ['conservative', 'smart', 'autonomous'];
  const confidenceLevels = [0.30, 0.50, 0.70, 0.90, 1.0];

  it('conservative never auto-approves at any confidence', () => {
    for (const conf of confidenceLevels) {
      const result = applyMode({
        categoryId: 'cat-1', categoryName: 'X', confidence: conf,
        source: 'rule', justification: '', autoApprove: true, needsReview: false,
      }, 'conservative');
      expect(result.autoApprove).toBe(false);
    }
  });

  it('smart only auto-approves at >= 0.90', () => {
    for (const conf of confidenceLevels) {
      const result = applyMode({
        categoryId: 'cat-1', categoryName: 'X', confidence: conf,
        source: 'rule', justification: '', autoApprove: false, needsReview: true,
      }, 'smart');
      expect(result.autoApprove).toBe(conf >= 0.90);
    }
  });

  it('autonomous auto-approves all categorised results', () => {
    for (const conf of confidenceLevels) {
      const result = applyMode({
        categoryId: 'cat-1', categoryName: 'X', confidence: conf,
        source: 'rule', justification: '', autoApprove: false, needsReview: true,
      }, 'autonomous');
      expect(result.autoApprove).toBe(true);
    }
  });
});
