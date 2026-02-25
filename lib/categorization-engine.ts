/**
 * 4-Layer Intelligent Categorization Engine
 * 
 * Layer 1: Deterministic Rules (Hard Rules) — DB-stored patterns, 100% confidence
 * Layer 2: Smart Rules (Pattern Detection) — recurring patterns, fuzzy matching
 * Layer 3: AI Supervised — Gemini/Abacus with confidence scoring + justification
 * Layer 4: Feedback Loop — user corrections → auto-rule generation
 */

import { prisma } from '@/lib/db';
import { callAI } from '@/lib/ai-client';

// ============================================================
// Types
// ============================================================

export interface TransactionInput {
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  date?: string;
  reference?: string;
  merchantName?: string;
}

export interface CategorizationResult {
  categoryId: string | null;
  categoryName: string | null;
  confidence: number;          // 0.0 - 1.0
  source: 'rule' | 'pattern' | 'ai' | 'none';
  justification: string;
  autoApprove: boolean;
  needsReview: boolean;
  ruleId?: string;             // if matched by a rule
  alternativeCategories?: Array<{ categoryId: string; categoryName: string; confidence: number }>;
}

export type CategorizationMode = 'conservative' | 'smart' | 'autonomous';

interface CategorizationOptions {
  userId?: string;
  entityId?: string;
  regime?: string;             // 'hmrc' | 'companies_house'
  mode?: CategorizationMode;
  categories?: any[];          // pre-loaded categories
}

// ============================================================
// Main Entry Point
// ============================================================

/**
 * Categorize a single transaction through all 4 layers
 */
export async function categorizeTransaction(
  tx: TransactionInput,
  options: CategorizationOptions = {}
): Promise<CategorizationResult> {
  const mode = options.mode || 'smart';

  // Layer 1: Deterministic Rules
  const ruleResult = await matchDeterministicRule(tx, options);
  if (ruleResult.categoryId) {
    return applyMode(ruleResult, mode);
  }

  // Layer 2: Smart Pattern Detection
  const patternResult = await matchSmartPattern(tx, options);
  if (patternResult.categoryId) {
    return applyMode(patternResult, mode);
  }

  // Layer 3: AI (single transaction — for batch, use categorizeTransactionsBatch)
  const aiResult = await categorizeWithAISingle(tx, options);
  return applyMode(aiResult, mode);
}

/**
 * Categorize a batch of transactions (more efficient for statements)
 */
export async function categorizeTransactionsBatch(
  transactions: TransactionInput[],
  options: CategorizationOptions = {}
): Promise<CategorizationResult[]> {
  const mode = options.mode || 'smart';
  const results: CategorizationResult[] = new Array(transactions.length);
  const uncategorizedIndices: number[] = [];

  // Load categories once
  const categories = options.categories || await loadCategories(options);
  const opts = { ...options, categories };

  // Layer 1 + 2: Apply rules and patterns
  for (let i = 0; i < transactions.length; i++) {
    // Layer 1
    const ruleResult = await matchDeterministicRule(transactions[i], opts);
    if (ruleResult.categoryId) {
      results[i] = applyMode(ruleResult, mode);
      continue;
    }

    // Layer 2
    const patternResult = await matchSmartPattern(transactions[i], opts);
    if (patternResult.categoryId) {
      results[i] = applyMode(patternResult, mode);
      continue;
    }

    uncategorizedIndices.push(i);
  }

  // Layer 3: Batch AI for remaining uncategorized
  if (uncategorizedIndices.length > 0) {
    const uncategorizedTxs = uncategorizedIndices.map(i => transactions[i]);
    const aiResults = await categorizeWithAIBatch(uncategorizedTxs, opts);

    for (let j = 0; j < uncategorizedIndices.length; j++) {
      const idx = uncategorizedIndices[j];
      results[idx] = applyMode(aiResults[j] || noMatch(), mode);
    }
  }

  return results;
}

// ============================================================
// Layer 1: Deterministic Rules
// ============================================================

async function matchDeterministicRule(
  tx: TransactionInput,
  options: CategorizationOptions
): Promise<CategorizationResult> {
  try {
    // Load active rules, ordered by priority desc
    const where: any = {
      isActive: true,
      OR: [{ userId: null }],
    };
    if (options.userId) {
      where.OR.push({ userId: options.userId });
    }

    const rules = await (prisma as any).categorizationRule.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { usageCount: 'desc' }],
      include: { category: { select: { id: true, name: true, type: true } } },
    });

    const descLower = tx.description.toLowerCase();
    const merchantLower = (tx.merchantName || '').toLowerCase();

    for (const rule of rules) {
      // Check transaction type filter
      if (rule.transactionType) {
        if (rule.transactionType === 'credit' && tx.type !== 'credit') continue;
        if (rule.transactionType === 'debit' && tx.type !== 'debit') continue;
      }

      // Check category type matches transaction type
      if (rule.category) {
        if (tx.type === 'credit' && rule.category.type === 'expense') continue;
        if (tx.type === 'debit' && rule.category.type === 'income') continue;
      }

      // Determine which field to match against
      const field = rule.patternField === 'merchant' ? merchantLower : descLower;
      const keyword = rule.keyword.toLowerCase();

      let matched = false;
      switch (rule.matchType) {
        case 'exact':
          matched = field === keyword;
          break;
        case 'contains':
          matched = field.includes(keyword);
          break;
        case 'starts_with':
          matched = field.startsWith(keyword);
          break;
        case 'regex':
          try {
            matched = new RegExp(rule.keyword, 'i').test(field);
          } catch { matched = false; }
          break;
      }

      if (matched) {
        // Update usage count (fire and forget)
        (prisma as any).categorizationRule.update({
          where: { id: rule.id },
          data: { usageCount: { increment: 1 }, lastUsedAt: new Date() },
        }).catch(() => {});

        return {
          categoryId: rule.categoryId,
          categoryName: rule.category?.name || null,
          confidence: rule.confidence,
          source: 'rule',
          justification: `Matched rule: "${rule.keyword}" (${rule.matchType}) → ${rule.category?.name}${rule.description ? '. ' + rule.description : ''}`,
          autoApprove: rule.autoApprove,
          needsReview: false,
          ruleId: rule.id,
        };
      }
    }
  } catch (error) {
    console.error('[CatEngine] Layer 1 error:', error);
  }

  return noMatch();
}

// ============================================================
// Layer 2: Smart Pattern Detection
// ============================================================

async function matchSmartPattern(
  tx: TransactionInput,
  options: CategorizationOptions
): Promise<CategorizationResult> {
  if (!options.userId) return noMatch();

  try {
    // Look for similar past transactions that were manually categorized
    const descWords = tx.description.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    if (descWords.length === 0) return noMatch();

    // Search for feedback entries with similar transaction text
    const feedbackEntries = await (prisma as any).categorizationFeedback.findMany({
      where: {
        userId: options.userId,
        source: 'user_correction',
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    if (feedbackEntries.length === 0) return noMatch();

    // Find best matching feedback by text similarity
    let bestMatch: any = null;
    let bestScore = 0;

    for (const fb of feedbackEntries) {
      const fbWords = fb.transactionText.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
      const commonWords = descWords.filter(w => fbWords.includes(w));
      const score = commonWords.length / Math.max(descWords.length, fbWords.length);

      if (score > bestScore && score >= 0.5) {
        bestScore = score;
        bestMatch = fb;
      }
    }

    if (bestMatch && bestScore >= 0.5) {
      // Count how many times this pattern was corrected to the same category
      const samePatternCount = feedbackEntries.filter((fb: any) => {
        const fbWords = fb.transactionText.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
        const commonWords = descWords.filter(w => fbWords.includes(w));
        const score = commonWords.length / Math.max(descWords.length, fbWords.length);
        return score >= 0.5 && fb.finalCategoryId === bestMatch.finalCategoryId;
      }).length;

      const confidence = Math.min(0.95, 0.70 + (samePatternCount * 0.05));

      return {
        categoryId: bestMatch.finalCategoryId,
        categoryName: bestMatch.finalCategory,
        confidence,
        source: 'pattern',
        justification: `Matched pattern from ${samePatternCount} similar past correction(s): "${bestMatch.transactionText}" → ${bestMatch.finalCategory}`,
        autoApprove: confidence >= 0.90,
        needsReview: confidence < 0.90,
      };
    }
  } catch (error) {
    console.error('[CatEngine] Layer 2 error:', error);
  }

  return noMatch();
}

// ============================================================
// Layer 3: AI Categorization
// ============================================================

async function categorizeWithAISingle(
  tx: TransactionInput,
  options: CategorizationOptions
): Promise<CategorizationResult> {
  const results = await categorizeWithAIBatch([tx], options);
  return results[0] || noMatch();
}

async function categorizeWithAIBatch(
  transactions: TransactionInput[],
  options: CategorizationOptions
): Promise<CategorizationResult[]> {
  if (transactions.length === 0) return [];

  const categories = options.categories || await loadCategories(options);
  const categoryList = categories.map((c: any) => `${c.id}|${c.name}|${c.type}`).join('\n');

  // Build transaction lines (max 80 at a time)
  const batch = transactions.slice(0, 80);
  const txLines = batch.map((t, i) =>
    `${i}|${t.type.toUpperCase()}|£${Math.abs(t.amount).toFixed(2)}|${t.description}`
  ).join('\n');

  const isCompany = options.regime === 'companies_house';

  const prompt = `You are a UK chartered accountant. Categorize these ${isCompany ? 'company' : 'personal/sole trader'} bank transactions.

RULES:
- CREDIT transactions → income-type categories ONLY
- DEBIT transactions → expense-type categories ONLY
- Return confidence 0.0-1.0 (1.0 = certain, 0.5 = guess)
- Provide brief justification for each

CATEGORIES (id|name|type):
${categoryList}

TRANSACTIONS (index|type|amount|description):
${txLines}

Return JSON array ONLY (no markdown):
[{"i":0,"id":"categoryId","n":"categoryName","c":0.85,"j":"brief reason"},...]
Use null for "id" if genuinely uncertain.`;

  try {
    const result = await callAI(
      [{ role: 'user', content: prompt }],
      { maxTokens: 4000, temperature: 0.1 }
    );

    let content = result.content || '[]';
    content = content.trim();
    if (content.startsWith('```json')) content = content.slice(7);
    else if (content.startsWith('```')) content = content.slice(3);
    if (content.endsWith('```')) content = content.slice(0, -3);

    const mappings = JSON.parse(content.trim());
    const results: CategorizationResult[] = new Array(batch.length).fill(null).map(() => noMatch());

    for (const m of mappings) {
      const idx = m.i;
      if (idx >= 0 && idx < batch.length && m.id) {
        // Validate category exists
        const cat = categories.find((c: any) => c.id === m.id);
        if (cat) {
          const confidence = Math.max(0, Math.min(1, m.c || 0.7));
          results[idx] = {
            categoryId: m.id,
            categoryName: m.n || cat.name,
            confidence,
            source: 'ai',
            justification: m.j || 'AI categorization',
            autoApprove: confidence >= 0.90,
            needsReview: confidence < 0.90,
            alternativeCategories: [],
          };
        }
      }
    }

    return results;
  } catch (error) {
    console.error('[CatEngine] Layer 3 AI error:', error);
    return new Array(batch.length).fill(null).map(() => noMatch());
  }
}

// ============================================================
// Layer 4: Feedback Loop
// ============================================================

/**
 * Record user feedback when they correct a category.
 * After 3+ identical corrections for similar text, auto-create a rule.
 */
export async function recordFeedback(params: {
  userId: string;
  entityId?: string;
  transactionId?: string;
  transactionText: string;
  merchantName?: string;
  amount?: number;
  suggestedCategory: string;
  suggestedCategoryId?: string;
  finalCategory: string;
  finalCategoryId: string;
}): Promise<{ feedbackId: string; ruleCreated: boolean }> {
  // Record the feedback
  const feedback = await (prisma as any).categorizationFeedback.create({
    data: {
      userId: params.userId,
      entityId: params.entityId || null,
      transactionId: params.transactionId || null,
      transactionText: params.transactionText,
      merchantName: params.merchantName || null,
      amount: params.amount || null,
      suggestedCategory: params.suggestedCategory,
      suggestedCategoryId: params.suggestedCategoryId || null,
      finalCategory: params.finalCategory,
      finalCategoryId: params.finalCategoryId,
      source: 'user_correction',
    },
  });

  // Check if we should auto-create a rule (3+ identical corrections)
  let ruleCreated = false;
  try {
    // Extract key words from description (merchant-like)
    const words = params.transactionText.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const searchWord = params.merchantName?.toLowerCase() || words[0] || '';

    if (searchWord.length >= 3) {
      const similarCorrections = await (prisma as any).categorizationFeedback.count({
        where: {
          userId: params.userId,
          finalCategoryId: params.finalCategoryId,
          source: 'user_correction',
          transactionText: { contains: searchWord, mode: 'insensitive' },
        },
      });

      if (similarCorrections >= 3) {
        // Check if rule already exists
        const existingRule = await (prisma as any).categorizationRule.findFirst({
          where: {
            keyword: searchWord,
            userId: params.userId,
            categoryId: params.finalCategoryId,
          },
        });

        if (!existingRule) {
          await (prisma as any).categorizationRule.create({
            data: {
              keyword: searchWord,
              matchType: 'contains',
              categoryId: params.finalCategoryId,
              userId: params.userId,
              entityId: params.entityId || null,
              confidence: 0.95,
              autoApprove: true,
              priority: 5,
              source: 'auto_learned',
              description: `Auto-learned from ${similarCorrections} corrections: "${params.transactionText}" → ${params.finalCategory}`,
              isActive: true,
              learnedFrom: params.transactionId || null,
              patternField: 'description',
            },
          });
          ruleCreated = true;

          // Mark feedback as auto-rule-created
          await (prisma as any).categorizationFeedback.updateMany({
            where: {
              userId: params.userId,
              finalCategoryId: params.finalCategoryId,
              transactionText: { contains: searchWord, mode: 'insensitive' },
              autoRuleCreated: false,
            },
            data: { autoRuleCreated: true },
          });

          console.log(`[CatEngine] Auto-created rule: "${searchWord}" → ${params.finalCategory} (from ${similarCorrections} corrections)`);
        }
      }
    }
  } catch (error) {
    console.error('[CatEngine] Feedback auto-rule error:', error);
  }

  return { feedbackId: feedback.id, ruleCreated };
}

// ============================================================
// Metrics
// ============================================================

export async function getCategorizationMetrics(userId: string) {
  try {
    const [
      totalRules,
      systemRules,
      userRules,
      autoLearnedRules,
      totalFeedback,
      corrections,
    ] = await Promise.all([
      (prisma as any).categorizationRule.count({ where: { OR: [{ userId: null }, { userId }], isActive: true } }),
      (prisma as any).categorizationRule.count({ where: { source: 'system', isActive: true } }),
      (prisma as any).categorizationRule.count({ where: { userId, source: 'manual', isActive: true } }),
      (prisma as any).categorizationRule.count({ where: { userId, source: 'auto_learned', isActive: true } }),
      (prisma as any).categorizationFeedback.count({ where: { userId } }),
      (prisma as any).categorizationFeedback.count({ where: { userId, source: 'user_correction' } }),
    ]);

    // Top corrected merchants
    const topCorrected = await (prisma as any).categorizationFeedback.groupBy({
      by: ['transactionText'],
      where: { userId, source: 'user_correction' },
      _count: true,
      orderBy: { _count: { transactionText: 'desc' } },
      take: 10,
    });

    return {
      totalRules,
      systemRules,
      userRules,
      autoLearnedRules,
      totalFeedback,
      corrections,
      correctionRate: totalFeedback > 0 ? (corrections / totalFeedback * 100).toFixed(1) : '0',
      topCorrected: topCorrected.map((t: any) => ({
        text: t.transactionText,
        count: t._count,
      })),
    };
  } catch (error) {
    console.error('[CatEngine] Metrics error:', error);
    return { totalRules: 0, systemRules: 0, userRules: 0, autoLearnedRules: 0, totalFeedback: 0, corrections: 0, correctionRate: '0', topCorrected: [] };
  }
}

// ============================================================
// Helpers
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
      // Nothing auto-approved, everything needs review
      return { ...result, autoApprove: false, needsReview: true };

    case 'autonomous':
      // Auto-approve everything with a category, only review truly unknown
      if (result.categoryId) {
        return { ...result, autoApprove: true, needsReview: result.confidence < 0.50 };
      }
      return result;

    case 'smart':
    default:
      // Auto-approve >= 90%, suggest 70-90%, review < 70%
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

async function loadCategories(options: CategorizationOptions): Promise<any[]> {
  const where: any = {};

  if (options.regime && options.regime !== 'all') {
    where.taxRegime = { in: [options.regime, 'universal'] };
  }

  if (options.userId) {
    where.OR = [{ userId: null }, { userId: options.userId }];
  } else {
    where.userId = null;
  }

  return prisma.category.findMany({
    where: Object.keys(where).length > 0 ? where : undefined,
    orderBy: [{ type: 'asc' }, { name: 'asc' }],
    select: { id: true, name: true, type: true, taxRegime: true, parentId: true, taxNature: true },
  });
}
