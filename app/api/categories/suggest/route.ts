import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';
import { callAI } from '@/lib/ai-client';

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { description, amount, type, transactionId, userContext, entityId } = await request.json();

    // Determine entity tax regime for regime-specific categorization
    let entityRegime = 'universal';
    let entityName = '';
    let entityType = '';
    if (entityId) {
      try {
        const entity = await (prisma as any).entity.findUnique({
          where: { id: entityId },
          select: { name: true, type: true, taxRegime: true },
        });
        if (entity) {
          entityName = entity.name;
          entityType = entity.type;
          const companyTypes = ['limited_company', 'llp', 'partnership'];
          entityRegime = companyTypes.includes(entity.type) ? 'companies_house' : 'hmrc';
        }
      } catch { /* default universal */ }
    }

    if (!description) {
      return NextResponse.json({ error: 'Transaction description is required' }, { status: 400 });
    }

    // Fetch categories filtered by entity tax regime
    const catWhere: any = entityRegime !== 'universal'
      ? { taxRegime: { in: [entityRegime, 'universal'] } }
      : {};
    const categories: any[] = await (prisma as any).category.findMany({
      where: catWhere,
      select: { id: true, name: true, description: true, type: true, hmrcMapping: true, defaultDeductibilityPercent: true, taxRegime: true, chMapping: true, costType: true },
    });

    const expenseCategories = categories.filter(c => c.type === 'expense');
    const incomeCategories = categories.filter(c => c.type === 'income');

    const formatCats = (cats: typeof categories) => cats.map(c => {
      let mapping = '';
      if (entityRegime === 'companies_house' && c.chMapping) {
        mapping = ` [CT600: ${c.chMapping}, ${c.defaultDeductibilityPercent}% deductible, ${c.costType}]`;
      } else if (c.hmrcMapping && c.hmrcMapping !== 'none') {
        mapping = ` [HMRC SA103: ${c.hmrcMapping}, ${c.defaultDeductibilityPercent}% deductible, ${c.costType}]`;
      }
      return `- "${c.name}" (ID: ${c.id}) — ${c.description || 'No description'}${mapping}`;
    }).join('\n');

    const userContextSection = userContext 
      ? `\nIMPORTANT - The user has provided additional context about this transaction:
"${userContext}"

You MUST take this context into account. The user knows their business better than you.
For example:
- If user says "this is a dividend payment" → use Dividends category
- If user says "this is a refund" → use Refunds category  
- If user says "this is a director loan" → suggest Transfers or a new category
- If user says "this is owner drawings" → suggest Transfers or Owner Drawings
- The transaction type shown (INCOME/EXPENSE) reflects the bank statement direction, but the user's explanation should determine the correct category.
`
      : '';

    const regimeContext = entityRegime === 'companies_house'
      ? `This transaction belongs to a LIMITED COMPANY (${entityName || 'Company'}). Use Corporation Tax CT600 rules for categorization.
Key CT600 categories: Cost of Sales, Administrative Expenses, Distribution Costs, Finance Costs, Directors Remuneration.
For companies, most legitimate business expenses are 100% deductible against Corporation Tax.`
      : entityRegime === 'hmrc'
      ? `This transaction belongs to ${entityType === 'sole_trader' ? 'a SOLE TRADER' : 'an INDIVIDUAL'} (${entityName || 'Person'}). Use HMRC Self Assessment SA100/SA103 rules.
Key SA103 boxes: Box 24 (Turnover), Box 25 (Other income), Box 26-30 (Allowable expenses), Box 31 (Other expenses).
For sole traders, expenses must be "wholly and exclusively" for business purposes.`
      : 'Determine the appropriate HMRC or Companies House categorization based on the transaction context.';

    const prompt = `You are a UK chartered accountant advising on HMRC Self Assessment (SA103) and Companies House CT600 compliance.

${regimeContext}

A user needs help categorizing this bank transaction:
- Description: "${description}"
- Amount: £${amount}
- Type: ${type === 'credit' ? 'INCOME (credit to account)' : 'EXPENSE (debit from account)'}
${entityName ? `- Entity: ${entityName} (${entityType})` : ''}
${userContextSection}
EXPENSE CATEGORIES available:
${formatCats(expenseCategories)}

INCOME CATEGORIES available:
${formatCats(incomeCategories)}

YOUR TASK:
1. Recommend the BEST matching existing category based on the transaction AND any user context provided
2. Explain WHY this is the correct HMRC/Companies House classification
3. State the HMRC SA103 box reference if applicable
4. Note the tax deductibility percentage
5. If user provided context, acknowledge it in your reasoning

RESPONSE FORMAT (JSON only, no markdown):
{
  "suggestedCategoryId": "existing_category_id_or_null",
  "suggestedCategoryName": "Category Name",
  "confidence": 0.95,
  "reasoning": "Brief explanation of why this category is correct under HMRC rules, referencing user context if provided",
  "hmrcBox": "SA103 Box 26" or null,
  "deductibilityPercent": 100,
  "isBusinessExpense": true/false,
  "suggestNewCategory": false,
  "newCategoryDetails": null,
  "applyToSimilar": true,
  "similarKeyword": "JOHN SMITH",
  "followUpQuestion": null
}

If the transaction is ambiguous even with user context, set:
"followUpQuestion": "A helpful follow-up question to clarify"

If NO existing category is appropriate, set suggestedCategoryId to null and provide:
"suggestNewCategory": true,
"newCategoryDetails": {
  "name": "Suggested Category Name",
  "description": "HMRC-compliant description",
  "hmrcMapping": "legal_professional",
  "deductibilityPercent": 100,
  "type": "expense" or "income"
}

Return raw JSON only:`;

    const aiResult = await callAI(
      [{ role: 'user', content: prompt }],
      { maxTokens: 2000, temperature: 0.1 }
    );

    let content = aiResult.content || '';
    
    // Clean markdown fences
    content = content.trim();
    if (content.startsWith('```')) {
      content = content.replace(/^```[\w]*\n?/, '').replace(/```$/, '').trim();
    }

    const suggestion = JSON.parse(content);

    return NextResponse.json({
      success: true,
      suggestion,
      categories, // Return categories for reference
    });
  } catch (error: any) {
    console.error('[CategorySuggest] Error:', error);
    return NextResponse.json({ error: 'Failed to get AI suggestion' }, { status: 500 });
  }
}
