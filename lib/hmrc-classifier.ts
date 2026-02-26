import OpenAI from 'openai';
import { prisma } from '@/lib/db';

const client = new OpenAI({
  apiKey: process.env.ABACUSAI_API_KEY,
  baseURL: 'https://routellm.abacus.ai/v1',
});

// HMRC Transaction Classifier Prompt (British English)
const HMRC_CLASSIFIER_PROMPT = `# SYSTEM ROLE
You are an expert UK Accountant specialised in HMRC Self Assessment tax returns. Your job is to categorize bank transactions accurately, identifying "Allowable Expenses" for tax deduction purposes.

# CONTEXT
The user is a UK resident (potentially Sole Trader or Freelancer).
Current Tax Year: 6 April to 5 April.

# HMRC ALLOWABLE EXPENSES MAPPING
Map every transaction to one of these keys (use British English throughout):
- "office_costs": Phone, internet, stationery, software subscriptions (Adobe, Microsoft, AWS, Google).
- "travel_costs": Fuel, parking, train/bus tickets (TFL, Trainline, National Rail), hotel, Uber/taxi for business.
- "clothing": Uniforms, protective clothing (NOT everyday wear).
- "staff_costs": Salaries, subcontractor fees.
- "reselling_goods": Items bought specifically to resell (Stock).
- "premises_costs": Rent, business rates, water, lighting (business use).
- "advertising": Website hosting, Google Ads, Facebook Ads, marketing.
- "financial_charges": Bank fees, professional indemnity insurance.
- "legal_professional": Accountants, solicitors, legal fees.
- "none": Personal expenses (Groceries, Gym, Cinema, Regular Clothing, Restaurants for personal use) - NOT DEDUCTIBLE.

# INPUT DATA
You will receive a list of transactions in JSON format:
[{"id": "1", "description": "TFL TRAVEL CHG", "amount": -4.50, "type": "debit"}, ...]

# TASK
For each transaction:
1. Analyse the 'description' and 'amount'.
2. Assign a human-readable 'category_name' (e.g., "Public Transport", "Groceries", "Software").
3. Assign the correct 'hmrc_mapping' from the list above.
4. Determine 'is_tax_deductible': true if it's a business cost, false if personal.
5. Assign a 'confidence_score' (0.0 to 1.0).
6. Provide brief 'reasoning'.

# OUTPUT FORMAT (JSON)
{
  "classifications": [
    {
      "transaction_id": "1",
      "category_name": "Public Transport",
      "hmrc_mapping": "travel_costs",
      "is_tax_deductible": true,
      "reasoning": "TFL indicates Transport for London. Valid travel expense if for business.",
      "confidence_score": 0.95
    }
  ]
}

Return ONLY valid JSON, no markdown code blocks.`;

// Clean bank transaction descriptions
export function cleanDescription(desc: string): string {
  const removeTerms = [
    'CARD PAYMENT TO',
    'DIRECT DEBIT PAYMENT TO',
    'FASTER PAYMENTS RECEIPT',
    'FASTER PAYMENTS RECEIPT REF',
    'BANK GIRO CREDIT',
    'STANDING ORDER TO',
    'PAYMENT',
    'REF:',
    'CD '
  ];
  
  let cleaned = desc;
  for (const term of removeTerms) {
    cleaned = cleaned.replace(new RegExp(term, 'gi'), '').trim();
  }
  
  // Remove multiple spaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
}

// MEMORY LAYER: Apply existing categorisation rules
export async function applyExistingRules(
  description: string,
  cleanDesc: string
): Promise<{
  matched: boolean;
  categoryId?: string;
  hmrcMapping?: string;
  isTaxDeductible?: boolean;
  ruleId?: string;
}> {
  const rules = await prisma.categorizationRule.findMany({
    include: { category: true }
  });

  for (const rule of rules) {
    let match = false;
    const keyword = rule.keyword.toLowerCase();
    const descLower = cleanDesc.toLowerCase();
    const origDescLower = description.toLowerCase();

    switch (rule.matchType) {
      case 'exact':
        match = descLower === keyword || origDescLower === keyword;
        break;
      case 'contains':
        match = descLower.includes(keyword) || origDescLower.includes(keyword);
        break;
      case 'starts_with':
        match = descLower.startsWith(keyword) || origDescLower.startsWith(keyword);
        break;
    }

    if (match) {
      // Update usage count
      await prisma.categorizationRule.update({
        where: { id: rule.id },
        data: { usageCount: { increment: 1 } }
      });

      return {
        matched: true,
        categoryId: rule.categoryId,
        hmrcMapping: rule.hmrcMapping,
        isTaxDeductible: rule.isTaxDeductible,
        ruleId: rule.id
      };
    }
  }

  return { matched: false };
}

// INTELLIGENCE LAYER: Classify transactions with AI (batch)
export async function classifyWithAI(
  transactions: Array<{
    id: string;
    description: string;
    amount: number;
    type: string;
  }>
): Promise<Array<{
  transaction_id: string;
  category_name: string;
  hmrc_mapping: string;
  is_tax_deductible: boolean;
  reasoning: string;
  confidence_score: number;
}>> {
  if (transactions.length === 0) return [];

  // Batch process max 50 transactions at a time
  const batchSize = 50;
  const results: Array<{
    transaction_id: string;
    category_name: string;
    hmrc_mapping: string;
    is_tax_deductible: boolean;
    reasoning: string;
    confidence_score: number;
  }> = [];

  for (let i = 0; i < transactions.length; i += batchSize) {
    const batch = transactions.slice(i, i + batchSize);
    
    try {
      console.log(`[HMRC Classifier] Processing batch ${i / batchSize + 1}/${Math.ceil(transactions.length / batchSize)}`);
      
      const completion = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: HMRC_CLASSIFIER_PROMPT },
          { role: 'user', content: JSON.stringify(batch) }
        ],
        temperature: 0.2,
        max_tokens: 4000,
      });

      const aiResponse = completion.choices[0]?.message?.content || '';
      
      // Clean up response
      let cleanResponse = aiResponse.trim();
      if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```[\w]*\n?/, '').replace(/```$/, '').trim();
      }

      const parsed = JSON.parse(cleanResponse);
      if (parsed.classifications && Array.isArray(parsed.classifications)) {
        results.push(...parsed.classifications);
      }
    } catch (error) {
      console.error('[HMRC Classifier] AI batch error:', error);
      // For failed batch, return default classifications
      for (const tx of batch) {
        results.push({
          transaction_id: tx.id,
          category_name: 'Uncategorized',
          hmrc_mapping: 'none',
          is_tax_deductible: false,
          reasoning: 'Failed to classify automatically',
          confidence_score: 0
        });
      }
    }
  }

  return results;
}

// Get or create category by name (upsert)
export async function getOrCreateCategory(
  name: string,
  hmrcMapping: string,
  isExpense: boolean
): Promise<{ id: string; hmrcMapping: string }> {
  // Try to find existing category (global defaults first)
  let category = await prisma.category.findFirst({
    where: { name, userId: null } as any
  });

  if (!category) {
    // Create new category
    category = await prisma.category.create({
      data: {
        name,
        type: isExpense ? 'expense' : 'income',
        hmrcMapping: hmrcMapping as any,
        isDefault: false
      }
    });
  }

  return { id: category.id, hmrcMapping: category.hmrcMapping };
}

// Main function to classify a list of transactions (orchestrator)
export async function classifyTransactions(
  transactions: Array<{
    id: string;
    description: string;
    amount: number;
    type: 'debit' | 'credit';
  }>
): Promise<Map<string, {
  categoryId: string;
  categoryName: string;
  hmrcMapping: string;
  isTaxDeductible: boolean;
  confidenceScore: number;
  aiReasoning: string;
  needsReview: boolean;
  source: 'rule' | 'ai';
}>> {
  const results = new Map<string, {
    categoryId: string;
    categoryName: string;
    hmrcMapping: string;
    isTaxDeductible: boolean;
    confidenceScore: number;
    aiReasoning: string;
    needsReview: boolean;
    source: 'rule' | 'ai';
  }>();

  const uncategorised: Array<{
    id: string;
    description: string;
    cleanDescription: string;
    amount: number;
    type: string;
  }> = [];

  // Step 1: Try to apply memory rules first
  for (const tx of transactions) {
    const cleanDesc = cleanDescription(tx.description);
    const ruleResult = await applyExistingRules(tx.description, cleanDesc);

    if (ruleResult.matched && ruleResult.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: ruleResult.categoryId }
      });

      if (category) {
        results.set(tx.id, {
          categoryId: category.id,
          categoryName: category.name,
          hmrcMapping: ruleResult.hmrcMapping || 'none',
          isTaxDeductible: ruleResult.isTaxDeductible || false,
          confidenceScore: 1.0, // Rules have 100% confidence
          aiReasoning: 'Matched by learned rule',
          needsReview: false,
          source: 'rule'
        });
        continue;
      }
    }

    // No rule matched, add to AI queue
    uncategorised.push({
      id: tx.id,
      description: cleanDesc,
      cleanDescription: cleanDesc,
      amount: tx.amount,
      type: tx.type
    });
  }

  // Step 2: Classify uncategorised with AI
  if (uncategorised.length > 0) {
    console.log(`[HMRC Classifier] ${uncategorised.length} transactions need AI classification`);
    
    const aiResults = await classifyWithAI(
      uncategorised.map(tx => ({
        id: tx.id,
        description: tx.description,
        amount: tx.amount,
        type: tx.type
      }))
    );

    for (const result of aiResults) {
      const tx = uncategorised.find(t => t.id === result.transaction_id);
      if (!tx) continue;

      // Get or create category
      const isExpense = result.hmrc_mapping !== 'none';
      const { id: categoryId, hmrcMapping } = await getOrCreateCategory(
        result.category_name,
        result.hmrc_mapping,
        isExpense
      );

      results.set(tx.id, {
        categoryId,
        categoryName: result.category_name,
        hmrcMapping,
        isTaxDeductible: result.is_tax_deductible,
        confidenceScore: result.confidence_score,
        aiReasoning: result.reasoning,
        needsReview: result.confidence_score < 0.8, // Mark low confidence for review
        source: 'ai'
      });
    }
  }

  return results;
}

// Learn a new rule from user correction (Layer 4 feedback)
export async function learnFromCorrection(
  transactionId: string,
  newCategoryId: string
): Promise<{ success: boolean; message: string; rule?: { keyword: string; matchType: string } }> {
  // Get the transaction
  const transaction = await prisma.bankTransaction.findUnique({
    where: { id: transactionId }
  });

  if (!transaction) {
    return { success: false, message: 'Transaction not found' };
  }

  // Get the category with HMRC mapping
  const category = await prisma.category.findUnique({
    where: { id: newCategoryId }
  });

  if (!category) {
    return { success: false, message: 'Category not found' };
  }

  // Extract keyword from description
  const cleanDesc = cleanDescription(transaction.description);
  const words = cleanDesc.split(' ');
  
  // Use first meaningful word as keyword (skip common words)
  const skipWords = ['the', 'a', 'an', 'to', 'from', 'for', 'in', 'on', 'at', 'by'];
  let keyword = words.find(w => w.length > 2 && !skipWords.includes(w.toLowerCase())) || words[0];
  keyword = keyword.toUpperCase();

  // Check if rule already exists
  const existingRule = await prisma.categorizationRule.findFirst({
    where: {
      keyword: keyword,
      matchType: 'contains'
    }
  });

  if (existingRule) {
    // Update existing rule if category changed
    if (existingRule.categoryId !== newCategoryId) {
      await prisma.categorizationRule.update({
        where: { id: existingRule.id },
        data: {
          categoryId: newCategoryId,
          hmrcMapping: category.hmrcMapping,
          isTaxDeductible: category.type === 'expense' && category.hmrcMapping !== 'none'
        }
      });
      return {
        success: true,
        message: `Updated rule for "${keyword}" to use category "${category.name}"`,
        rule: { keyword, matchType: 'contains' }
      };
    }
    return {
      success: true,
      message: `Rule for "${keyword}" already exists`,
      rule: { keyword, matchType: 'contains' }
    };
  }

  // Create new rule
  await prisma.categorizationRule.create({
    data: {
      keyword,
      matchType: 'contains',
      categoryId: newCategoryId,
      hmrcMapping: category.hmrcMapping,
      isTaxDeductible: category.type === 'expense' && category.hmrcMapping !== 'none',
      learnedFrom: transactionId
    }
  });

  // Update the transaction
  await prisma.bankTransaction.update({
    where: { id: transactionId },
    data: {
      categoryId: newCategoryId,
      hmrcMapping: category.hmrcMapping,
      isTaxDeductible: category.type === 'expense' && category.hmrcMapping !== 'none',
      needsReview: false
    }
  });

  return {
    success: true,
    message: `Learned! Future transactions containing "${keyword}" will be categorized as "${category.name}"`,
    rule: { keyword, matchType: 'contains' }
  };
}
