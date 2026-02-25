import { NextResponse } from 'next/server';
import { parseMonzoStatement, isMonzoStatement } from '@/lib/parsers/monzo-parser';
import { extractBankStatement, checkDoclingHealth } from '@/lib/docling-client';
import { callAI } from '@/lib/ai-client';
import { categorizeTransactionsBatch, type TransactionInput } from '@/lib/categorization-engine';
import { spawn } from 'child_process';
import path from 'path';
import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';

// Common UK transaction keywords for automatic categorization
// Category names MUST exactly match DEFAULT_CATEGORIES in lib/types.ts
const HMRC_KEYWORDS: Record<string, string[]> = {
  // === INCOME CATEGORIES ===
  'Salary': ['salary', 'wages', 'payroll', 'pay slip', 'paye'],
  'Client Payments': ['client', 'invoice paid', 'payment received', 'faster payments received', 'bacs credit'],
  'Business Income': ['revenue', 'sales', 'trade income', 'receipt'],
  'Refunds': ['refund', 'reimbursement', 'cashback', 'reversal', 'returned payment'],
  'Interest': ['interest earned', 'savings interest', 'bank interest'],
  'Dividends': ['dividend'],
  'Benefits': ['universal credit', 'tax credit', 'dwp', 'hmrc', 'child benefit'],

  // === HMRC SA103 BUSINESS EXPENSES (tax deductible) ===
  'Office Costs': ['office', 'stationery', 'supplies', 'royal mail', 'post office', 'printing', 'instantprint', 'vistaprint', 'postage', 'stamps'],
  'Travel': ['train', 'uber', 'taxi', 'tfl', 'railway', 'national express', 'megabus', 'easyjet', 'ryanair', 'flight'],
  'Vehicle Costs': ['fuel', 'petrol', 'diesel', 'parking', 'euro car parks', 'mot', 'car wash', 'halfords', 'kwik fit'],
  'Staff Costs': ['payroll', 'subcontractor', 'freelancer fee', 'contractor'],
  'Premises Costs': ['office rent', 'business rates', 'commercial'],
  'Marketing & Advertising': ['advertising', 'google ads', 'facebook ads', 'meta ads', 'marketing', 'promotion', 'canva', 'mailchimp'],
  'Bank & Finance Charges': ['bank fee', 'overdraft fee', 'finance charge', 'merchant fee', 'stripe fee', 'paypal fee'],
  'Professional Fees': ['accountant', 'solicitor', 'lawyer', 'consultant', 'legal fee', 'audit'],
  'Software & IT': ['software', 'adobe', 'microsoft 365', 'quickbooks', 'intuit', 'zoom', 'slack', 'hosting', 'domain', 'aws', 'google workspace', 'notion', 'figma', 'github'],

  // === HOUSEHOLD EXPENSES (personal, non-deductible) ===
  'Utilities': ['electric', 'gas bill', 'water bill', 'edf', 'british gas', 'eon', 'octopus energy', 'ovo', 'thames water', 'utility'],
  'Telecoms': ['vodafone', 'ee', 'three', 'o2', 'giffgaff', 'bt broadband', 'sky', 'virgin media', 'broadband', 'mobile phone'],
  'Council Tax': ['council tax', 'local authority'],
  'Insurance': ['insurance', 'aviva', 'admiral', 'direct line', 'axa', 'zurich', 'cover note'],
  'Subscriptions': ['netflix', 'spotify', 'amazon prime', 'disney+', 'apple.com/bill', 'google storage', 'icloud', 'youtube premium', 'audible'],
  'Groceries': ['tesco', 'sainsbury', 'asda', 'morrisons', 'aldi', 'lidl', 'co-op', 'waitrose', 'grocery', 'supermarket', 'costco', 'ocado', 'm&s food', 'iceland'],
  'Dining & Takeaway': ['restaurant', 'cafe', 'coffee', 'starbucks', 'costa', 'mcdonalds', 'kfc', 'deliveroo', 'uber eats', 'just eat', 'greggs', 'pret', 'nandos', 'dominos', 'pizza'],
  'Shopping': ['amazon.co.uk', 'ebay', 'argos', 'john lewis', 'next', 'primark', 'h&m', 'zara', 'asos', 'tk maxx', 'currys', 'screwfix'],
  'Housing': ['rent', 'mortgage', 'b&q', 'homebase', 'ikea', 'furniture', 'home improvement', 'rightmove'],
  'Healthcare': ['pharmacy', 'boots', 'superdrug', 'nhs', 'doctor', 'dentist', 'optician', 'specsavers'],
  'Education': ['school', 'college', 'university', 'course', 'tuition', 'training', 'udemy', 'coursera'],
  'Entertainment': ['cinema', 'theatre', 'concert', 'ticket', 'leisure', 'gaming', 'steam', 'playstation', 'xbox'],
  'Personal Care': ['salon', 'barber', 'beauty', 'spa', 'hair', 'gym', 'puregym', 'david lloyd', 'fitness'],
  'Childcare': ['nursery', 'childminder', 'after school', 'childcare'],
  'Transfers': ['transfer to', 'standing order', 'internal transfer', 'transfer between'],
};

// Companies House / Corporation Tax keywords for company bank statements
const CH_KEYWORDS: Record<string, string[]> = {
  // === INCOME ===
  'Turnover / Revenue': ['invoice paid', 'payment received', 'bacs credit', 'faster payments received', 'client payment', 'sales receipt', 'fee income'],
  'Other Operating Income': ['grant', 'royalty', 'commission received', 'rental income'],
  'Interest Receivable': ['interest earned', 'savings interest', 'bank interest'],
  'Director Loan Repayment In': ['director loan repay', 'loan repayment from director'],
  'Shareholder Investment': ['share capital', 'shareholder inject', 'capital contribution'],

  // === EXPENSES ===
  'Cost of Sales': ['stock purchase', 'materials', 'raw materials', 'wholesale', 'manufacturer', 'components'],
  'Directors Remuneration': ['director salary', 'director pay', 'director fee'],
  'Employee Costs': ['payroll', 'wages', 'salary', 'pension contribution', 'employer ni', 'staff pay'],
  'Rent & Rates': ['office rent', 'business rates', 'commercial rent', 'warehouse rent'],
  'Repairs & Maintenance': ['repair', 'maintenance', 'plumber', 'electrician', 'building work'],
  'Motor Expenses': ['fuel', 'petrol', 'diesel', 'parking', 'company car', 'vehicle insurance', 'mot'],
  'Travel & Subsistence': ['train', 'uber', 'taxi', 'tfl', 'flight', 'hotel', 'accommodation', 'easyjet', 'ryanair'],
  'Telephone & Internet': ['vodafone', 'ee', 'three', 'o2', 'bt broadband', 'sky business', 'broadband', 'mobile phone'],
  'Postage & Stationery': ['royal mail', 'post office', 'stationery', 'stamps', 'printing', 'supplies'],
  'Advertising & Marketing': ['google ads', 'facebook ads', 'meta ads', 'advertising', 'marketing', 'canva', 'mailchimp'],
  'Professional Fees (Company)': ['accountant', 'solicitor', 'lawyer', 'consultant', 'legal fee', 'audit fee', 'companies house fee'],
  'Bank Charges & Interest Payable': ['bank fee', 'bank charge', 'overdraft fee', 'loan interest', 'merchant fee', 'stripe fee', 'paypal fee'],
  'Insurance (Company)': ['business insurance', 'professional indemnity', 'public liability', 'employers liability'],
  'Software & Subscriptions (Company)': ['software', 'adobe', 'microsoft 365', 'quickbooks', 'zoom', 'slack', 'hosting', 'aws', 'github', 'saas'],
  'Entertainment (Non-Allowable)': ['restaurant', 'client entertainment', 'hospitality', 'client dinner'],
  'Dividend Payments': ['dividend', 'shareholder distribution'],
  'Corporation Tax Payment': ['corporation tax', 'hmrc ct', 'ct payment'],
  'VAT Payment': ['vat payment', 'hmrc vat', 'vat return'],
  'PAYE/NI Payment': ['paye', 'employer ni', 'hmrc paye'],
  'Pension Contributions (Company)': ['pension', 'workplace pension', 'auto enrolment'],
  'Director Loan Out': ['director loan', 'loan to director'],
  'Fixed Asset Purchase': ['computer', 'laptop', 'equipment', 'machinery', 'furniture', 'capital purchase'],
  'Training & Development': ['training', 'course', 'cpd', 'seminar', 'conference'],
  'Sundry Expenses': [],
  'Transfers': ['transfer to', 'standing order', 'internal transfer', 'transfer between'],
};

// Select keyword set based on entity regime
function getKeywordsForRegime(regime: string): Record<string, string[]> {
  return regime === 'companies_house' ? CH_KEYWORDS : HMRC_KEYWORDS;
}

// Smart categorization based on transaction description
function suggestCategoryByKeywords(description: string, type: 'credit' | 'debit', categories: any[], regime: string = 'hmrc'): string | null {
  const descLower = description.toLowerCase();
  const keywordSet = getKeywordsForRegime(regime);
  
  for (const [categoryName, keywords] of Object.entries(keywordSet)) {
    for (const keyword of keywords) {
      if (descLower.includes(keyword.toLowerCase())) {
        // Find matching category in database
        const matchingCategory = categories.find(c => 
          c.name.toLowerCase() === categoryName.toLowerCase() ||
          c.name.toLowerCase().includes(categoryName.toLowerCase().split(' ')[0])
        );
        if (matchingCategory) {
          // Check if category type matches transaction type
          if ((type === 'credit' && matchingCategory.type === 'income') ||
              (type === 'debit' && matchingCategory.type === 'expense')) {
            return matchingCategory.id;
          }
        }
      }
    }
  }
  return null;
}

// AI-powered batch categorization for remaining uncategorized transactions
async function categorizeWithAI(transactions: any[], categories: any[], regime: string = 'hmrc'): Promise<Map<number, string>> {
  const categoryMap = new Map<number, string>();
  
  // Filter uncategorized transactions
  const uncategorizedIndices = transactions
    .map((tx, i) => tx.suggestedCategoryId ? null : i)
    .filter((i): i is number => i !== null);
  
  if (uncategorizedIndices.length === 0) return categoryMap;
  
  // Prepare category list for AI
  const categoryList = categories.map(c => `${c.id}: ${c.name} (${c.type})`).join('\n');
  
  // Prepare transactions for AI (max 100 at a time for efficiency)
  const transactionsToCategories = uncategorizedIndices.slice(0, 100).map(i => ({
    index: i,
    description: transactions[i].description,
    amount: transactions[i].amount,
    type: transactions[i].type
  }));
  
  if (transactionsToCategories.length === 0) return categoryMap;

  // Format transaction lines
  const txLines = transactionsToCategories.map((t, i) => 
    i + '. [' + t.type.toUpperCase() + '] £' + t.amount + ' - "' + t.description + '"'
  ).join('\n');

  // Build regime-specific prompt
  const isCompany = regime === 'companies_house';
  
  let prompt: string;
  if (isCompany) {
    prompt = `You are a UK chartered accountant specializing in Companies House annual accounts and Corporation Tax (CT600).
Your task: categorize COMPANY bank transactions for statutory accounts and CT600 filing.

CRITICAL RULES:
1. INCOME transactions (credits) MUST only be assigned to income-type categories
2. EXPENSE transactions (debits) MUST only be assigned to expense-type categories
3. This is a COMPANY bank account - categorize for P&L / CT600
4. Director salary payments = "Directors Remuneration"
5. Staff wages = "Employee Costs"
6. HMRC CT payments = "Corporation Tax Payment"
7. HMRC VAT payments = "VAT Payment"
8. HMRC PAYE/NI = "PAYE/NI Payment"
9. Dividend payments to shareholders = "Dividend Payments"
10. Client/customer payments IN = "Turnover / Revenue"
11. Bank transfers between company accounts = "Transfers"
12. Equipment/computer purchases = "Fixed Asset Purchase"
13. Accountant/solicitor fees = "Professional Fees (Company)"
14. Office rent = "Rent & Rates"
15. Software/SaaS = "Software & Subscriptions (Company)"

Available categories (ID: Name (type)):
${categoryList}

Transactions to categorize:
${txLines}

Return a JSON array: [[index, "categoryId"], ...]
Use null for categoryId if genuinely uncertain.
Return raw JSON array only, no markdown:`;
  } else {
    prompt = `You are a UK chartered accountant specializing in HMRC Self Assessment (SA103) and personal tax.
Your task: categorize bank transactions with precision for tax reporting.

CRITICAL RULES:
1. INCOME transactions (credits) MUST only be assigned to income-type categories
2. EXPENSE transactions (debits) MUST only be assigned to expense-type categories
3. For business expenses, prefer HMRC SA103 categories (Office Costs, Travel, Professional Fees, etc.)
4. Personal expenses go to household categories (Groceries, Shopping, Dining & Takeaway, etc.)
5. Bank transfers between own accounts = "Transfers" category
6. If description contains LTD/LIMITED and it's income = "Client Payments"
7. If description contains LTD/LIMITED and it's expense = match to best business category

UK MERCHANT KNOWLEDGE:
- TESCO/SAINSBURY/ASDA/ALDI/LIDL/MORRISONS/WAITROSE/CO-OP/OCADO = Groceries
- AMAZON = Shopping (unless description says "AWS" = Software & IT)
- STARBUCKS/COSTA/GREGGS/PRET/MCDONALDS/KFC/NANDOS/DELIVEROO/UBER EATS/JUST EAT = Dining & Takeaway
- NETFLIX/SPOTIFY/DISNEY+/APPLE.COM/BILL = Subscriptions
- BT/SKY/VIRGIN MEDIA/VODAFONE/EE/THREE/O2 = Telecoms
- UBER (ride) / TFL / TRAINLINE = Travel
- BOOTS/SUPERDRUG = Healthcare
- EDF/BRITISH GAS/OCTOPUS/EON/OVO = Utilities
- COUNCIL TAX = Council Tax
- Faster Payments IN from personal names = could be Client Payments or Transfers (use context)
- HMRC/DWP payments IN = Benefits
- Salary/wages payments IN = Salary

Available categories (ID: Name (type)):
${categoryList}

Transactions to categorize:
${txLines}

Return a JSON array: [[index, "categoryId"], ...]
Use null for categoryId if genuinely uncertain.
Return raw JSON array only, no markdown:`;
  }

  try {
    const result = await callAI(
      [{ role: 'user', content: prompt }],
      { maxTokens: 4000, temperature: 0.1 }
    );

    let content = result.content || '[]';
    
    // Clean up response
    content = content.trim();
    if (content.startsWith('```json')) content = content.slice(7);
    else if (content.startsWith('```')) content = content.slice(3);
    if (content.endsWith('```')) content = content.slice(0, -3);
    
    const mappings = JSON.parse(content.trim());
    
    for (const [localIdx, categoryId] of mappings) {
      if (categoryId && transactionsToCategories[localIdx]) {
        const originalIdx = transactionsToCategories[localIdx].index;
        categoryMap.set(originalIdx, categoryId);
      }
    }
  } catch (err) {
    console.error('[Categorize] AI categorization error:', err);
  }
  
  return categoryMap;
}

// Extract text from PDF using spawned Node.js process (avoids worker issues in Next.js)
async function extractPdfText(pdfBuffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const base64Data = pdfBuffer.toString('base64');
    const scriptPath = path.join(process.cwd(), 'lib', 'pdf-extractor.cjs');
    
    const child = spawn('node', [scriptPath, '--stdin'], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data: Buffer) => {
      stdout += data.toString();
    });
    
    child.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });
    
    child.on('close', (code: number) => {
      if (code !== 0) {
        console.error('[PDF] stderr:', stderr);
        try {
          const errorData = JSON.parse(stderr || stdout);
          reject(new Error(errorData.error || 'PDF extraction failed'));
        } catch {
          reject(new Error(`PDF extraction failed with code ${code}`));
        }
        return;
      }
      
      try {
        const result = JSON.parse(stdout);
        if (result.success) {
          resolve(result.text);
        } else {
          reject(new Error(result.error || 'Unknown extraction error'));
        }
      } catch {
        console.error('[PDF] Failed to parse output:', stdout.substring(0, 200));
        reject(new Error('Failed to parse PDF extraction output'));
      }
    });
    
    child.on('error', (err: Error) => {
      console.error('[PDF] Spawn error:', err);
      reject(err);
    });
    
    // Write base64 data to stdin and close it
    child.stdin.write(base64Data);
    child.stdin.end();
  });
}

export async function POST(request: Request) {
  try {
    await requireUserId();
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const cloudStoragePath = formData.get('cloudStoragePath') as string;
    const entityId = formData.get('entityId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    // Convert file to buffer
    const fileBuffer = await file.arrayBuffer();
    
    const mimeType = file.type || 'application/octet-stream';
    const isPdf = mimeType === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isCsv = mimeType === 'text/csv' || file.name.toLowerCase().endsWith('.csv');
    
    let extractedText = '';
    let parseStatus: 'success' | 'needs_review' | 'failed' = 'needs_review';
    let parseError: string | null = null;

    // Extract text based on file type
    let doclingTables: any[] = [];
    if (isPdf) {
      try {
        // Try Docling first (better OCR, table extraction)
        const doclingAvailable = await checkDoclingHealth();
        if (doclingAvailable) {
          const pdfBuffer = Buffer.from(fileBuffer);
          const doclingResult = await extractBankStatement(pdfBuffer, file.name);
          if (doclingResult.success) {
            extractedText = doclingResult.plain_text;
            doclingTables = doclingResult.tables_structured || [];
          } else {
            throw new Error(doclingResult.error || 'Docling extraction returned no data');
          }
        } else {
          // Fallback to old PDF extractor
          const pdfBuffer = Buffer.from(fileBuffer);
          extractedText = await extractPdfText(pdfBuffer);
        }
      } catch (pdfError: any) {
        console.error('[ProcessStatement] PDF extraction failed:', pdfError.message);
        // Try fallback if Docling failed
        try {
          const pdfBuffer = Buffer.from(fileBuffer);
          extractedText = await extractPdfText(pdfBuffer);
        } catch (fallbackError: any) {
          parseError = `PDF extraction failed: ${pdfError.message}`;
          parseStatus = 'failed';
        }
      }
    } else if (isCsv) {
      extractedText = Buffer.from(fileBuffer).toString('utf-8');
    } else {
      extractedText = Buffer.from(fileBuffer).toString('utf-8');
    }

    // Check if we have enough text
    if (!extractedText || extractedText.trim().length < 50) {
      return NextResponse.json({
        transactions: [],
        extractedText: extractedText || '',
        parseStatus: 'failed',
        parseError: 'Could not extract enough text from file. PDF might be image-based or protected.',
      });
    }

    // Try Monzo parser first if detected
    let transactions: any[] = [];
    let accountInfo: any = null;
    let summary: any = null;

    if (isMonzoStatement(extractedText)) {
      const result = parseMonzoStatement(extractedText);
      
      transactions = result.transactions;
      accountInfo = result.accountInfo;
      summary = result.summary;
      
      if (result.success) {
        parseStatus = 'success';
        parseError = null;
      } else {
        parseStatus = 'needs_review';
        parseError = result.parseError;
      }
    } else {
      // Fall back to LLM API for other banks
      try {
        const llmResult = await callLLMParser(extractedText);
        transactions = llmResult.transactions || [];
        accountInfo = llmResult.accountInfo;
        summary = llmResult.summary;
        
        if (transactions.length > 0) {
          parseStatus = 'success';
        } else {
          parseStatus = 'needs_review';
          parseError = 'LLM could not extract transactions';
        }
      } catch (llmError: any) {
        console.error('[ProcessStatement] LLM parsing failed:', llmError.message);
        parseStatus = 'needs_review';
        parseError = `LLM parsing failed: ${llmError.message}`;
      }
    }

    // Determine entity regime for categorization
    let entityRegime = 'hmrc'; // default to individual/sole trader
    if (entityId) {
      try {
        const entity = await (prisma as any).entity.findUnique({
          where: { id: entityId },
          select: { type: true },
        });
        if (entity) {
          const companyTypes = ['limited_company', 'llp', 'partnership'];
          entityRegime = companyTypes.includes(entity.type) ? 'companies_house' : 'hmrc';
        }
      } catch { /* default to hmrc */ }
    }
    // ═══════════════════════════════════════════════════════════
    // 4-Layer Categorization Engine
    // Layer 1: Deterministic Rules (DB stored)
    // Layer 2: Smart Pattern Detection (user feedback history)
    // Layer 3: AI Supervised (Gemini/Abacus with confidence)
    // Layer 4: Feedback Loop (applied on category change in UI)
    // ═══════════════════════════════════════════════════════════
    if (transactions.length > 0) {
      try {
        const userId = await requireUserId();

        // Get user's categorization mode
        let catMode: 'conservative' | 'smart' | 'autonomous' = 'smart';
        try {
          const user = await prisma.user.findUnique({ where: { id: userId }, select: { categorizationMode: true } as any });
          if (user && (user as any).categorizationMode) catMode = (user as any).categorizationMode;
        } catch { /* default smart */ }

        // Prepare transactions for the engine
        const engineInputs: TransactionInput[] = transactions.map((tx: any) => ({
          description: tx.description || '',
          amount: tx.amount || 0,
          type: tx.type === 'credit' ? 'credit' : 'debit',
          date: tx.date,
          reference: tx.reference,
        }));

        // Run the 4-layer engine
        const catResults = await categorizeTransactionsBatch(engineInputs, {
          userId,
          entityId: entityId || undefined,
          regime: entityRegime,
          mode: catMode,
        });

        // Apply results to transactions
        transactions = transactions.map((tx: any, i: number) => {
          const result = catResults[i];
          if (result && result.categoryId) {
            return {
              ...tx,
              suggestedCategoryId: result.categoryId,
              confidenceScore: result.confidence,
              aiReasoning: result.justification,
              categorizationSource: result.source,
              needsReview: result.needsReview,
              autoApproved: result.autoApprove,
            };
          }
          return { ...tx, needsReview: true, categorizationSource: 'none' };
        });

        const bySource = { rule: 0, pattern: 0, ai: 0, none: 0 };
        catResults.forEach(r => { if (r.source in bySource) bySource[r.source as keyof typeof bySource]++; });
        console.log(`[CatEngine] Results: ${bySource.rule} rules, ${bySource.pattern} patterns, ${bySource.ai} AI, ${bySource.none} uncategorized`);
      } catch (catError: any) {
        console.error('[ProcessStatement] Categorization error (non-fatal):', catError.message);
      }
    }

    return NextResponse.json({
      transactions,
      accountInfo,
      summary,
      extractedText,
      parseStatus,
      parseError,
      entityId: entityId || null,
    });
  } catch (error: any) {
    console.error('[ProcessStatement] Unexpected error:', error);
    return NextResponse.json({
      transactions: [],
      extractedText: '',
      parseStatus: 'failed',
      parseError: `Unexpected error: ${error.message}`,
    });
  }
}

// LLM parser for non-Monzo statements
async function callLLMParser(text: string): Promise<any> {
  const STATEMENT_PROMPT = `You are an expert at analyzing UK bank statements.

Analyze this bank statement and extract ALL transactions.
For each transaction, determine if it's INCOME (credit) or EXPENSE (debit).

Return JSON:
{
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "Transaction description",
      "amount": 123.45,
      "type": "debit" or "credit",
      "balance": 1234.56
    }
  ],
  "accountInfo": {
    "bankName": "Bank name",
    "accountNumber": "Last 4 digits",
    "statementPeriod": "Date range"
  },
  "summary": {
    "totalIncome": 0,
    "totalExpenses": 0
  }
}

IMPORTANT: Respond with raw JSON only.`;

  const result = await callAI(
    [{ role: 'user', content: STATEMENT_PROMPT + '\n\nBank statement text:\n```\n' + text.substring(0, 30000) + '\n```' }],
    { maxTokens: 16000, temperature: 0.1 }
  );

  // Clean up response
  let cleanedText = result.content.trim();
  if (cleanedText.startsWith('```json')) cleanedText = cleanedText.slice(7);
  else if (cleanedText.startsWith('```')) cleanedText = cleanedText.slice(3);
  if (cleanedText.endsWith('```')) cleanedText = cleanedText.slice(0, -3);
  
  return JSON.parse(cleanedText.trim());
}
