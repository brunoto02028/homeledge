/**
 * Seed script for Accounting Academy — UK AAT Levels 2-6
 * Based on real AAT/ACCA qualification structure and UK legal permissions.
 * Run: npx tsx prisma/seed-academy.ts
 */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🎓 Seeding Accounting Academy...');

  // ==================== COURSE LEVELS ====================
  const levels = [
    {
      level: 2,
      name: 'AAT Level 2 Foundation Certificate in Accounting',
      shortName: 'Level 2 — Foundation',
      description: `The entry point into professional accounting. Level 2 covers the fundamentals of bookkeeping, basic costing, and the principles of working in accounting and finance. No prior experience needed.\n\nThis qualification is ideal for those starting a career in finance or looking to understand the basics of business accounting. You'll learn double-entry bookkeeping, process sales and purchase transactions, and understand the importance of control accounts.`,
      hmrcPermissions: ['Basic bookkeeping for sole traders', 'Recording financial transactions', 'Processing receipts and payments'],
      chPermissions: [],
      professionalBody: 'AAT',
      qualificationTitle: 'AAT Foundation Certificate in Accounting',
      estimatedStudyHours: 200,
      examCostGbp: 240,
      prerequisites: 'None — open to all',
      careerPaths: ['Accounts Assistant', 'Trainee Bookkeeper', 'Finance Assistant', 'Accounts Clerk'],
      salaryRangeMin: 18000,
      salaryRangeMax: 24000,
      iconEmoji: '📗',
      color: '#22c55e',
      sortOrder: 1,
    },
    {
      level: 3,
      name: 'AAT Level 3 Advanced Diploma in Accounting',
      shortName: 'Level 3 — Advanced',
      description: `Build on your foundation knowledge with advanced bookkeeping, preparing final accounts, and VAT processing. Level 3 is where you gain the skills to work with HMRC directly.\n\nAt this level you'll learn to prepare final accounts for sole traders, process VAT returns, and use accounting software professionally. This is the minimum level typically required by HMRC for submitting VAT returns and Self Assessment tax returns on behalf of clients.`,
      hmrcPermissions: ['VAT return preparation and submission', 'Self Assessment (SA100) for sole traders', 'PAYE processing basics', 'MTD (Making Tax Digital) VAT submissions'],
      chPermissions: ['Prepare basic financial statements'],
      professionalBody: 'AAT',
      qualificationTitle: 'AAT Advanced Diploma in Accounting',
      estimatedStudyHours: 350,
      examCostGbp: 420,
      prerequisites: 'AAT Level 2 or equivalent experience',
      careerPaths: ['Bookkeeper', 'Accounts Payable/Receivable Clerk', 'Assistant Accountant', 'Payroll Administrator', 'VAT Administrator'],
      salaryRangeMin: 22000,
      salaryRangeMax: 30000,
      iconEmoji: '📘',
      color: '#3b82f6',
      sortOrder: 2,
    },
    {
      level: 4,
      name: 'AAT Level 4 Professional Diploma in Accounting',
      shortName: 'Level 4 — Professional',
      description: `The highest AAT qualification. Level 4 covers management accounting, drafting financial statements, budgeting, and business tax. Completing this level grants you AAT Full Membership (MAAT) and the right to set up your own accountancy practice.\n\nYou'll learn to prepare financial statements for limited companies, understand corporation tax, apply management accounting techniques, and handle complex VAT scenarios. This is the level where you can file micro-entity and small company accounts with Companies House.`,
      hmrcPermissions: ['Corporation Tax (CT600) returns', 'Complex Self Assessment (partnerships, rental income)', 'Capital Gains Tax calculations', 'All VAT schemes including Flat Rate and Margin'],
      chPermissions: ['File micro-entity accounts (AA02)', 'File small company abbreviated accounts', 'Prepare statutory financial statements', 'File annual Confirmation Statements (CS01)'],
      professionalBody: 'AAT',
      qualificationTitle: 'AAT Professional Diploma in Accounting — MAAT',
      estimatedStudyHours: 450,
      examCostGbp: 580,
      prerequisites: 'AAT Level 3 or equivalent',
      careerPaths: ['Professional Bookkeeper (MAAT)', 'Practice Owner', 'Management Accountant', 'Financial Accountant', 'Tax Advisor', 'Audit Assistant'],
      salaryRangeMin: 28000,
      salaryRangeMax: 42000,
      iconEmoji: '📙',
      color: '#f59e0b',
      sortOrder: 3,
    },
    {
      level: 5,
      name: 'ACCA Applied Knowledge & Skills (Strategic Level Entry)',
      shortName: 'Level 5 — ACCA Strategic',
      description: `The bridge between AAT professional status and chartered accountancy. Level 5 covers advanced financial reporting (IFRS), audit and assurance, performance management, and taxation at a strategic level.\n\nThis is equivalent to the ACCA Applied Knowledge and Applied Skills exams (F1-F9). You'll study International Financial Reporting Standards, advanced audit procedures, corporate law, and strategic business analysis. Successful completion qualifies you for senior accounting roles and opens the path to ACCA membership.`,
      hmrcPermissions: ['All HMRC submissions including complex group structures', 'Transfer pricing advisory', 'R&D Tax Relief claims', 'International tax planning basics'],
      chPermissions: ['File full statutory accounts for any UK company', 'Audit exempt company accounts', 'Prepare group consolidated accounts', 'File dormant company accounts'],
      professionalBody: 'ACCA',
      qualificationTitle: 'ACCA Diploma in Accounting and Business',
      estimatedStudyHours: 700,
      examCostGbp: 1200,
      prerequisites: 'AAT Level 4 (MAAT) or relevant degree',
      careerPaths: ['Senior Accountant', 'Financial Controller', 'Tax Manager', 'Audit Senior', 'Finance Business Partner'],
      salaryRangeMin: 38000,
      salaryRangeMax: 60000,
      iconEmoji: '📕',
      color: '#ef4444',
      sortOrder: 4,
    },
    {
      level: 6,
      name: 'ACCA Professional Level — Chartered Certified Accountant',
      shortName: 'Level 6 — Chartered (FCCA/ACCA)',
      description: `The pinnacle of accounting qualification. Level 6 represents full ACCA Professional membership, covering Strategic Business Leader, Strategic Business Reporting, and optional advanced papers in taxation, audit, performance, and financial management.\n\nChartered Certified Accountants can sign statutory audit reports, provide regulated financial advice, and hold senior leadership positions. This level requires 36 months of relevant practical experience (PER) alongside exam completion. ACCA members are recognised in over 180 countries.`,
      hmrcPermissions: ['Full unrestricted HMRC practice rights', 'Sign audit reports for HMRC purposes', 'Act as tax advisor for any entity structure', 'Represent clients in HMRC tribunals and disputes'],
      chPermissions: ['Sign statutory audit reports', 'File accounts for any company type including PLCs', 'Prepare and certify group consolidated accounts under IFRS', 'Act as registered auditor (with practising certificate)'],
      professionalBody: 'ACCA',
      qualificationTitle: 'ACCA — Associate Chartered Certified Accountant',
      estimatedStudyHours: 1000,
      examCostGbp: 2500,
      prerequisites: 'ACCA Applied Knowledge & Skills or equivalent',
      careerPaths: ['Chartered Accountant (ACCA)', 'Finance Director', 'CFO', 'Partner in Practice', 'Audit Partner', 'Head of Tax', 'Financial Consultant'],
      salaryRangeMin: 55000,
      salaryRangeMax: 120000,
      iconEmoji: '🏆',
      color: '#a855f7',
      sortOrder: 5,
    },
  ];

  for (const lvl of levels) {
    await (prisma as any).courseLevel.upsert({
      where: { level: lvl.level },
      update: lvl,
      create: lvl,
    });
    console.log(`  ✅ Level ${lvl.level}: ${lvl.shortName}`);
  }

  // ==================== EXAM MODULES ====================
  const allLevels = await (prisma as any).courseLevel.findMany({ orderBy: { level: 'asc' } });
  const levelMap = new Map(allLevels.map((l: any) => [l.level, l.id]));

  const modules = [
    // Level 2
    { courseLevel: 2, title: 'Bookkeeping Transactions', code: 'BTRN', description: 'Record and process double-entry bookkeeping transactions. Covers sales day books, purchase day books, cash books, and the general ledger.', learningOutcomes: ['Understand double-entry bookkeeping', 'Process customer and supplier transactions', 'Prepare a trial balance from the general ledger', 'Understand the role of source documents'], topicsCovered: ['Double Entry Principles', 'Books of Prime Entry', 'Sales & Purchase Day Books', 'Cash Book', 'Petty Cash', 'Trial Balance', 'Source Documents'], estimatedHours: 60, passMarkPercent: 70, timeLimitMinutes: 90, totalQuestions: 40, sortOrder: 1 },
    { courseLevel: 2, title: 'Bookkeeping Controls', code: 'BKCL', description: 'Maintain control accounts and reconcile bank statements. Understand the importance of the trial balance and error correction.', learningOutcomes: ['Prepare bank reconciliation statements', 'Maintain control accounts (SLCA, PLCA)', 'Identify and correct errors in the trial balance', 'Understand the purpose of the journal'], topicsCovered: ['Bank Reconciliation', 'Sales Ledger Control Account', 'Purchase Ledger Control Account', 'VAT Control Account', 'Journal Entries', 'Error Correction', 'Suspense Accounts'], estimatedHours: 60, passMarkPercent: 70, timeLimitMinutes: 90, totalQuestions: 40, sortOrder: 2 },
    { courseLevel: 2, title: 'Elements of Costing', code: 'ELCO', description: 'Understand the basic principles of cost accounting. Calculate costs of products and services using different costing methods.', learningOutcomes: ['Distinguish between different cost classifications', 'Calculate unit costs using absorption and marginal costing', 'Understand materials, labour, and overhead costs', 'Prepare basic cost reports'], topicsCovered: ['Cost Classification', 'Materials Costing (FIFO, LIFO, AVCO)', 'Labour Costs', 'Overheads Absorption', 'Marginal vs Absorption Costing', 'Break-even Analysis'], estimatedHours: 40, passMarkPercent: 70, timeLimitMinutes: 90, totalQuestions: 40, sortOrder: 3 },
    { courseLevel: 2, title: 'Using Accounting Software', code: 'UACS', description: 'Practical assessment using accounting software (Sage/Xero). Set up accounts, process transactions, and generate reports.', learningOutcomes: ['Set up company data in accounting software', 'Process sales invoices, credit notes, and receipts', 'Process purchase invoices and payments', 'Perform bank reconciliation in software', 'Generate trial balance and reports'], topicsCovered: ['Software Setup', 'Chart of Accounts', 'Customer Invoicing', 'Supplier Payments', 'Bank Reconciliation', 'VAT Returns', 'Report Generation'], estimatedHours: 40, passMarkPercent: 70, timeLimitMinutes: 120, totalQuestions: 0, sortOrder: 4 },

    // Level 3
    { courseLevel: 3, title: 'Advanced Bookkeeping', code: 'AVBK', description: 'Prepare accounts from incomplete records, understand depreciation, and apply accruals and prepayments concepts.', learningOutcomes: ['Apply the accruals concept and prepare adjustments', 'Calculate depreciation using straight-line and reducing balance', 'Prepare extended trial balances', 'Account for irrecoverable debts and allowances'], topicsCovered: ['Accruals & Prepayments', 'Depreciation Methods', 'Disposal of Non-Current Assets', 'Irrecoverable Debts', 'Allowance for Doubtful Debts', 'Extended Trial Balance', 'Accounting Standards (IAS)'], estimatedHours: 70, passMarkPercent: 70, timeLimitMinutes: 120, totalQuestions: 40, sortOrder: 1 },
    { courseLevel: 3, title: 'Final Accounts Preparation', code: 'FAPR', description: 'Prepare final accounts for sole traders and partnerships including the statement of profit or loss and statement of financial position.', learningOutcomes: ['Prepare final accounts for sole traders', 'Prepare partnership accounts with profit sharing', 'Understand the accounting equation', 'Apply year-end adjustments'], topicsCovered: ['Statement of Profit or Loss', 'Statement of Financial Position', 'Partnership Accounts', 'Appropriation Accounts', 'Year-End Adjustments', 'Capital & Revenue Expenditure', 'Closing Inventory'], estimatedHours: 70, passMarkPercent: 70, timeLimitMinutes: 150, totalQuestions: 40, sortOrder: 2 },
    { courseLevel: 3, title: 'Indirect Tax (VAT)', code: 'IDRX', description: 'Understand and apply UK VAT legislation. Calculate VAT, prepare VAT returns, and understand different VAT schemes.', learningOutcomes: ['Understand UK VAT legislation and thresholds', 'Calculate output and input VAT', 'Prepare a VAT return', 'Identify different VAT schemes (standard, flat rate, cash)'], topicsCovered: ['VAT Registration & Deregistration', 'Standard-Rated, Zero-Rated, Exempt Supplies', 'Input & Output VAT', 'VAT Return (Box 1-9)', 'Flat Rate Scheme', 'Cash Accounting Scheme', 'VAT Penalties & Surcharges', 'Making Tax Digital (MTD)'], estimatedHours: 60, passMarkPercent: 70, timeLimitMinutes: 90, totalQuestions: 40, sortOrder: 3 },
    { courseLevel: 3, title: 'Ethics for Accountants', code: 'ETHC', description: 'Understand the ethical principles and standards expected of professional accountants. Apply ethical frameworks to real-world scenarios.', learningOutcomes: ['Understand the AAT Code of Professional Ethics', 'Apply the 5 fundamental principles', 'Identify threats to ethical behaviour', 'Apply safeguards and resolve ethical conflicts'], topicsCovered: ['5 Fundamental Principles (Integrity, Objectivity, Confidentiality, Professional Competence, Professional Behaviour)', 'Threats & Safeguards', 'Ethical Conflict Resolution', 'Money Laundering Regulations', 'Whistleblowing', 'CPD Requirements'], estimatedHours: 30, passMarkPercent: 70, timeLimitMinutes: 75, totalQuestions: 32, sortOrder: 4 },
    { courseLevel: 3, title: 'Spreadsheets for Accounting', code: 'SPSH', description: 'Use spreadsheet software effectively for accounting tasks. Build formulas, pivot tables, and financial models.', learningOutcomes: ['Design and structure accounting spreadsheets', 'Use VLOOKUP, IF, and SUMIF functions', 'Create pivot tables and charts', 'Protect and share workbooks securely'], topicsCovered: ['Spreadsheet Design', 'Formulas & Functions', 'Conditional Formatting', 'Pivot Tables', 'Charts & Graphs', 'Data Validation', 'Workbook Security'], estimatedHours: 30, passMarkPercent: 70, timeLimitMinutes: 120, totalQuestions: 0, sortOrder: 5 },

    // Level 4
    { courseLevel: 4, title: 'Drafting and Interpreting Financial Statements', code: 'FASL', description: 'Prepare financial statements for limited companies in accordance with accounting standards. Analyse financial performance using ratios.', learningOutcomes: ['Prepare financial statements for limited companies', 'Apply IAS/IFRS standards', 'Calculate and interpret financial ratios', 'Prepare consolidated financial statements (basic)'], topicsCovered: ['Limited Company Accounts', 'IAS 1 Presentation', 'IAS 16 Property Plant & Equipment', 'IAS 38 Intangible Assets', 'Statement of Cash Flows (IAS 7)', 'Ratio Analysis', 'Consolidated Accounts Introduction'], estimatedHours: 90, passMarkPercent: 70, timeLimitMinutes: 150, totalQuestions: 40, sortOrder: 1 },
    { courseLevel: 4, title: 'Business Tax', code: 'BSTX', description: 'Calculate and understand UK business taxation including corporation tax, capital allowances, and trading losses.', learningOutcomes: ['Calculate corporation tax for UK companies', 'Apply capital allowance rules', 'Understand trading loss relief', 'Prepare a CT600 corporation tax computation'], topicsCovered: ['Corporation Tax Computation', 'Trading Income Adjustments', 'Capital Allowances (AIA, WDA)', 'Trading Loss Relief', 'Chargeable Gains for Companies', 'CT600 Return', 'Payment Dates & Penalties'], estimatedHours: 80, passMarkPercent: 70, timeLimitMinutes: 150, totalQuestions: 40, sortOrder: 2 },
    { courseLevel: 4, title: 'Personal Tax', code: 'PSTX', description: 'Calculate personal tax liabilities including income tax, National Insurance, and capital gains tax for individuals.', learningOutcomes: ['Calculate income tax for individuals', 'Apply National Insurance Contributions rules', 'Calculate capital gains tax', 'Prepare Self Assessment tax returns (SA100)'], topicsCovered: ['Income Tax Computation', 'Tax Bands & Rates', 'Employment Income (P11D)', 'Trading Income', 'Property Income', 'Dividend Income', 'Capital Gains Tax', 'NIC Classes 2 & 4', 'SA100/SA103 Returns', 'Payment on Account'], estimatedHours: 80, passMarkPercent: 70, timeLimitMinutes: 150, totalQuestions: 40, sortOrder: 3 },
    { courseLevel: 4, title: 'Management Accounting: Budgeting', code: 'MABU', description: 'Prepare budgets and forecasts for organisations. Understand variance analysis and performance reporting.', learningOutcomes: ['Prepare functional budgets (sales, production, cash)', 'Calculate and interpret variances', 'Understand budgeting methodologies', 'Prepare performance reports for management'], topicsCovered: ['Budget Preparation', 'Cash Budget', 'Flexed Budgets', 'Variance Analysis (Material, Labour, Overhead)', 'Standard Costing', 'Performance Indicators', 'Budget Methodologies (Incremental, Zero-based, Activity-based)'], estimatedHours: 70, passMarkPercent: 70, timeLimitMinutes: 150, totalQuestions: 40, sortOrder: 4 },
    { courseLevel: 4, title: 'Management Accounting: Decision and Control', code: 'MDCL', description: 'Apply management accounting techniques to support business decision-making. Covers pricing, investment appraisal, and performance measurement.', learningOutcomes: ['Apply cost-volume-profit analysis', 'Evaluate short-term decisions (make vs buy, limiting factors)', 'Apply investment appraisal techniques (NPV, IRR, payback)', 'Measure performance using financial and non-financial indicators'], topicsCovered: ['CVP Analysis', 'Limiting Factors', 'Make vs Buy Decisions', 'Pricing Strategies', 'Investment Appraisal (NPV, IRR, Payback)', 'Life Cycle Costing', 'Activity-Based Costing', 'Balanced Scorecard'], estimatedHours: 70, passMarkPercent: 70, timeLimitMinutes: 150, totalQuestions: 40, sortOrder: 5 },

    // Level 5
    { courseLevel: 5, title: 'Financial Reporting (FR)', code: 'FR', description: 'Prepare and analyse financial statements using IFRS. Covers group accounts, complex transactions, and interpretation.', learningOutcomes: ['Apply International Financial Reporting Standards', 'Prepare group consolidated financial statements', 'Account for complex transactions (leases, provisions, deferred tax)', 'Analyse and interpret financial statements'], topicsCovered: ['IFRS Framework', 'Consolidated Statement of Financial Position', 'Consolidated Statement of Profit or Loss', 'Associates & Joint Ventures', 'IFRS 16 Leases', 'IAS 37 Provisions', 'IAS 12 Deferred Tax', 'Earnings Per Share', 'Financial Analysis'], estimatedHours: 120, passMarkPercent: 50, timeLimitMinutes: 180, totalQuestions: 40, sortOrder: 1 },
    { courseLevel: 5, title: 'Taxation (TX-UK)', code: 'TX', description: 'Advanced UK taxation covering income tax, corporation tax, CGT, inheritance tax, and tax planning.', learningOutcomes: ['Calculate complex income tax computations', 'Advise on corporation tax planning', 'Calculate inheritance tax', 'Understand tax planning vs tax avoidance vs tax evasion'], topicsCovered: ['Income Tax (Complex)', 'Corporation Tax (Groups, Losses)', 'Capital Gains Tax (Reliefs)', 'Inheritance Tax', 'National Insurance', 'Tax Planning', 'Self Assessment Procedures', 'HMRC Powers & Penalties'], estimatedHours: 120, passMarkPercent: 50, timeLimitMinutes: 180, totalQuestions: 40, sortOrder: 2 },
    { courseLevel: 5, title: 'Audit and Assurance (AA)', code: 'AA', description: 'Understand the principles and processes of external audit. Plan and perform audit procedures and evaluate evidence.', learningOutcomes: ['Explain the purpose and scope of an audit', 'Plan an audit engagement', 'Perform audit procedures on key financial statement areas', 'Evaluate audit evidence and form conclusions'], topicsCovered: ['Audit Framework & Regulation', 'Professional Ethics in Audit', 'Audit Planning & Risk Assessment', 'Internal Controls', 'Substantive Procedures', 'Audit Evidence', 'Audit Reports', 'Going Concern'], estimatedHours: 100, passMarkPercent: 50, timeLimitMinutes: 180, totalQuestions: 40, sortOrder: 3 },
    { courseLevel: 5, title: 'Performance Management (PM)', code: 'PM', description: 'Advanced management accounting techniques for planning, decision-making, and performance evaluation.', learningOutcomes: ['Apply advanced costing techniques', 'Evaluate performance using financial and non-financial measures', 'Apply decision-making tools under uncertainty', 'Design management reporting systems'], topicsCovered: ['Activity-Based Costing', 'Target Costing', 'Life Cycle Costing', 'Throughput Accounting', 'Transfer Pricing', 'Divisional Performance', 'Balanced Scorecard', 'Value Chain Analysis'], estimatedHours: 100, passMarkPercent: 50, timeLimitMinutes: 180, totalQuestions: 40, sortOrder: 4 },

    // Level 6
    { courseLevel: 6, title: 'Strategic Business Leader (SBL)', code: 'SBL', description: 'The integrated case study exam. Apply professional skills in leadership, governance, strategy, risk management, and technology to a realistic business scenario.', learningOutcomes: ['Evaluate governance and ethical frameworks', 'Analyse strategic position and options', 'Manage risk and internal controls', 'Lead change and innovation', 'Apply technology to business transformation'], topicsCovered: ['Corporate Governance', 'Strategic Analysis (PESTEL, Porter, SWOT)', 'Risk Management', 'Internal Audit', 'Information Technology', 'Project Management', 'Integrated Reporting', 'Leadership & Ethics', 'Change Management'], estimatedHours: 150, passMarkPercent: 50, timeLimitMinutes: 240, totalQuestions: 0, sortOrder: 1 },
    { courseLevel: 6, title: 'Strategic Business Reporting (SBR)', code: 'SBR', description: 'Advanced financial reporting including complex group structures, current issues in reporting, and ethical considerations in professional judgement.', learningOutcomes: ['Apply IFRS to complex transactions', 'Prepare advanced consolidated financial statements', 'Evaluate current reporting issues and developments', 'Exercise professional judgement in financial reporting'], topicsCovered: ['Complex Group Structures', 'Business Combinations (IFRS 3)', 'Foreign Operations (IAS 21)', 'Financial Instruments (IFRS 9)', 'Revenue Recognition (IFRS 15)', 'Current Issues in Reporting', 'Integrated Reporting', 'Ethics in Financial Reporting'], estimatedHours: 150, passMarkPercent: 50, timeLimitMinutes: 195, totalQuestions: 0, sortOrder: 2 },
    { courseLevel: 6, title: 'Advanced Taxation (ATX-UK)', code: 'ATX', description: 'Complex UK tax planning including cross-border transactions, trust taxation, and advising individuals and businesses on tax-efficient strategies.', learningOutcomes: ['Advise on complex personal and corporate tax planning', 'Calculate tax on trusts and estates', 'Handle cross-border tax issues', 'Apply stamp duty and VAT to complex scenarios'], topicsCovered: ['Advanced Income Tax Planning', 'Advanced Corporation Tax', 'Capital Gains Tax Reliefs', 'Inheritance Tax Planning', 'Trusts Taxation', 'Stamp Duty & SDLT', 'Cross-Border Taxation', 'Tax-Efficient Business Structures'], estimatedHours: 130, passMarkPercent: 50, timeLimitMinutes: 195, totalQuestions: 0, sortOrder: 3 },
    { courseLevel: 6, title: 'Advanced Audit and Assurance (AAA)', code: 'AAA', description: 'Complex audit engagements including group audits, quality control, and professional responsibility.', learningOutcomes: ['Plan and manage complex audit engagements', 'Evaluate group audit and component auditor issues', 'Apply ethical principles to complex scenarios', 'Prepare audit reports for various engagements'], topicsCovered: ['Regulatory Environment', 'Quality Management (ISQM)', 'Group Audits', 'Transnational Audits', 'Current Issues in Audit', 'Ethics and Professional Liability', 'Forensic Auditing', 'Reporting on Special Purpose Engagements'], estimatedHours: 130, passMarkPercent: 50, timeLimitMinutes: 195, totalQuestions: 0, sortOrder: 4 },
  ];

  for (const mod of modules) {
    const courseId = levelMap.get(mod.courseLevel);
    if (!courseId) continue;
    const { courseLevel, ...moduleData } = mod;
    const existing = await (prisma as any).examModule.findFirst({
      where: { courseId, code: mod.code },
    });
    if (existing) {
      await (prisma as any).examModule.update({ where: { id: existing.id }, data: { ...moduleData, courseId } });
    } else {
      await (prisma as any).examModule.create({ data: { ...moduleData, courseId } });
    }
    console.log(`  📚 L${mod.courseLevel} — ${mod.title} (${mod.code})`);
  }

  // ==================== SAMPLE QUESTIONS (Level 2 — Bookkeeping Transactions) ====================
  const btrnModule = await (prisma as any).examModule.findFirst({ where: { code: 'BTRN' } });
  if (btrnModule) {
    const questions = [
      {
        questionText: 'What is the fundamental principle of double-entry bookkeeping?',
        topic: 'Double Entry Principles',
        difficulty: 'easy',
        syllabusRef: '1.1',
        aiExplanation: 'Double-entry bookkeeping is based on the principle that every financial transaction has two equal and opposite effects. For every debit entry, there must be a corresponding credit entry of the same amount. This ensures the accounting equation (Assets = Liabilities + Equity) always balances. The system was first documented by Luca Pacioli in 1494 and remains the foundation of modern accounting worldwide.',
        options: [
          { optionText: 'Every transaction is recorded once in the ledger', isCorrect: false, explanation: 'This describes single-entry bookkeeping, not double-entry. Single-entry only records one side of each transaction.' },
          { optionText: 'Every transaction has two equal and opposite entries — a debit and a credit', isCorrect: true, explanation: 'Correct! This is the fundamental principle. A debit entry in one account must always be matched by a credit entry of the same amount in another account.' },
          { optionText: 'Transactions are recorded twice — once when invoiced and once when paid', isCorrect: false, explanation: 'This describes the timing of recording, not the double-entry principle. While accrual accounting does record at invoice and payment, this is a separate concept.' },
          { optionText: 'The business owner must check every entry twice', isCorrect: false, explanation: 'While verification is good practice, this is not what double-entry means. The "double" refers to two accounting entries, not two checks.' },
        ],
      },
      {
        questionText: 'Which of the following is a book of prime entry?',
        topic: 'Books of Prime Entry',
        difficulty: 'easy',
        syllabusRef: '1.2',
        aiExplanation: 'Books of prime entry (also called books of original entry or day books) are the first place where transactions are recorded before being posted to the general ledger. The main books of prime entry are: Sales Day Book, Purchase Day Book, Sales Returns Day Book, Purchase Returns Day Book, Cash Book, Petty Cash Book, and the Journal. They provide a chronological record of transactions and serve as the source for ledger postings.',
        options: [
          { optionText: 'The trial balance', isCorrect: false, explanation: 'The trial balance is a list of all ledger account balances at a point in time. It is NOT a book of prime entry — it is prepared FROM the ledger.' },
          { optionText: 'The statement of financial position', isCorrect: false, explanation: 'The statement of financial position (balance sheet) is a financial statement prepared at year-end. It is a report, not a book of prime entry.' },
          { optionText: 'The sales day book', isCorrect: true, explanation: 'Correct! The sales day book is a book of prime entry where credit sales are first recorded before being posted to the sales ledger and general ledger.' },
          { optionText: 'The general ledger', isCorrect: false, explanation: 'The general ledger contains all the accounts of the business. Entries are posted TO the general ledger FROM the books of prime entry, making it a secondary record.' },
        ],
      },
      {
        questionText: 'A business purchases office furniture for £2,400 on credit from Office World. What is the correct double-entry?',
        topic: 'Double Entry Principles',
        difficulty: 'medium',
        syllabusRef: '1.3',
        aiExplanation: 'When a business buys a non-current asset (like furniture) on credit:\n\n1. DEBIT Office Furniture (Non-Current Asset) — the business now owns the asset, increasing its assets\n2. CREDIT Trade Payables (Liability) — the business owes money to Office World, increasing its liabilities\n\nRemember: Debits increase assets and expenses. Credits increase liabilities, equity, and income. Since the purchase is on credit (not paid immediately), we credit trade payables, not the bank account.',
        options: [
          { optionText: 'Debit Office Furniture £2,400, Credit Bank £2,400', isCorrect: false, explanation: 'This would be correct if the purchase was paid immediately by bank transfer or cheque. But the question says "on credit", meaning it has not been paid yet.' },
          { optionText: 'Debit Office Furniture £2,400, Credit Trade Payables £2,400', isCorrect: true, explanation: 'Correct! The asset increases (debit) and a liability is created because the business owes Office World (credit trade payables).' },
          { optionText: 'Debit Trade Payables £2,400, Credit Office Furniture £2,400', isCorrect: false, explanation: 'This is the wrong way round. It would mean we are reducing a liability and reducing an asset — the opposite of what happened.' },
          { optionText: 'Debit Purchases £2,400, Credit Trade Payables £2,400', isCorrect: false, explanation: 'Purchases account is used for goods bought for resale (inventory). Office furniture is a non-current asset, not a purchase for resale.' },
        ],
      },
      {
        questionText: 'A business receives a cheque for £500 from a credit customer, J Smith. What is the correct double-entry?',
        topic: 'Double Entry Principles',
        difficulty: 'medium',
        syllabusRef: '1.4',
        aiExplanation: 'When a credit customer pays what they owe:\n\n1. DEBIT Bank £500 — money is coming into the business bank account (asset increases)\n2. CREDIT Trade Receivables £500 — J Smith no longer owes the business (asset decreases)\n\nThe original sale would have been: DR Trade Receivables, CR Sales. Now the customer is paying, so we reverse the receivable. Note: we do NOT credit Sales again — the sale was already recorded when the invoice was raised.',
        options: [
          { optionText: 'Debit Bank £500, Credit Sales £500', isCorrect: false, explanation: 'The sale was already recorded when the invoice was originally raised. Receiving payment does not create new revenue — it settles an existing receivable.' },
          { optionText: 'Debit Bank £500, Credit Trade Receivables £500', isCorrect: true, explanation: 'Correct! Bank increases (money received) and trade receivables decrease (J Smith\'s debt is settled).' },
          { optionText: 'Debit Trade Receivables £500, Credit Bank £500', isCorrect: false, explanation: 'This is backwards — it would mean we are increasing the amount J Smith owes and decreasing our bank balance.' },
          { optionText: 'Debit Cash £500, Credit Trade Receivables £500', isCorrect: false, explanation: 'The question says a cheque was received, which goes through the bank account, not the petty cash account. Cash and bank are different accounts.' },
        ],
      },
      {
        questionText: 'What is the purpose of a trial balance?',
        topic: 'Trial Balance',
        difficulty: 'easy',
        syllabusRef: '2.1',
        aiExplanation: 'A trial balance is a list of all the debit and credit balances extracted from the general ledger at a specific date. Its primary purpose is to check that the total debits equal the total credits, confirming the arithmetic accuracy of the double-entry system.\n\nHowever, a trial balance has limitations — it will NOT detect:\n- Errors of omission (transaction completely missed)\n- Errors of commission (posted to wrong account of same type)\n- Errors of principle (posted to wrong type of account)\n- Compensating errors (two errors that cancel each other out)\n- Errors of original entry (wrong amount in both entries)\n- Complete reversal of entries',
        options: [
          { optionText: 'To record transactions in chronological order', isCorrect: false, explanation: 'This describes a book of prime entry (day book), not a trial balance.' },
          { optionText: 'To check that total debits equal total credits in the ledger', isCorrect: true, explanation: 'Correct! The trial balance verifies the arithmetic accuracy of the double-entry bookkeeping system.' },
          { optionText: 'To calculate the profit or loss of the business', isCorrect: false, explanation: 'The statement of profit or loss calculates profit. The trial balance provides the data for preparing this, but does not calculate profit itself.' },
          { optionText: 'To guarantee that no errors have been made in the accounts', isCorrect: false, explanation: 'A trial balance only checks that debits = credits. It does NOT guarantee zero errors — several types of errors will not be detected by a trial balance.' },
        ],
      },
      {
        questionText: 'Which of the following errors would be detected by the trial balance?',
        topic: 'Trial Balance',
        difficulty: 'medium',
        syllabusRef: '2.2',
        aiExplanation: 'A trial balance will only detect errors that cause total debits to not equal total credits. These include:\n- Single-entry errors (only one side recorded)\n- Casting (addition) errors in ledger accounts\n- Transposition errors in ONE side only (e.g., £560 posted as £650 on debit side only)\n- Extraction errors (wrong balance taken to trial balance)\n\nErrors NOT detected: omission, commission, principle, compensating, original entry, reversal of entries — because in all these cases, debits still equal credits.',
        options: [
          { optionText: 'An error of omission — a transaction was completely missed', isCorrect: false, explanation: 'If a transaction is completely omitted, neither the debit nor the credit is recorded. Debits still equal credits, so the trial balance will still balance.' },
          { optionText: 'An error of commission — a payment to A Smith was posted to B Smith', isCorrect: false, explanation: 'Both A Smith and B Smith are receivable accounts (same type). The total receivables balance is correct even though the individual accounts are wrong.' },
          { optionText: 'A casting error — the sales account was incorrectly added up', isCorrect: true, explanation: 'Correct! If the sales account balance is wrong due to an addition error, the credit total will not match the debit total, and the trial balance will not balance.' },
          { optionText: 'An error of original entry — £340 was recorded as £430 in both accounts', isCorrect: false, explanation: 'Since the wrong amount was used for BOTH the debit and credit, debits still equal credits. The trial balance will balance despite the error.' },
        ],
      },
      {
        questionText: 'A petty cash float is maintained at £150 using the imprest system. At the end of the week, vouchers total £117.50. How much cash should be in the petty cash tin?',
        topic: 'Petty Cash',
        difficulty: 'easy',
        syllabusRef: '1.5',
        aiExplanation: 'The imprest system works by maintaining a fixed float amount. At any time:\n\nCash in tin + Value of vouchers = Imprest amount (float)\n\nSo: Cash in tin = £150 - £117.50 = £32.50\n\nAt the end of the period, the cashier is reimbursed £117.50 to restore the float to £150. This system provides excellent internal control because the float should always reconcile to the imprest amount.',
        options: [
          { optionText: '£32.50', isCorrect: true, explanation: 'Correct! £150 float minus £117.50 in vouchers = £32.50 remaining cash. Cash + Vouchers must always equal the imprest amount.' },
          { optionText: '£117.50', isCorrect: false, explanation: 'This is the total of the vouchers (amounts spent), not the cash remaining. The vouchers represent money that has already been paid out.' },
          { optionText: '£150.00', isCorrect: false, explanation: '£150 is the total imprest amount. The cash in the tin will be less than this because some has been spent (covered by vouchers).' },
          { optionText: '£267.50', isCorrect: false, explanation: 'This adds the float and vouchers together, which is incorrect. You need to subtract vouchers from the float.' },
        ],
      },
      {
        questionText: 'VAT at 20% is charged on a sale of goods priced at £800 (excluding VAT). What is the total amount the customer must pay?',
        topic: 'VAT Basics',
        difficulty: 'easy',
        syllabusRef: '1.6',
        aiExplanation: 'To calculate VAT:\n\n1. Net amount (excluding VAT): £800\n2. VAT at 20%: £800 × 20/100 = £160\n3. Gross amount (including VAT): £800 + £160 = £960\n\nUseful shortcuts:\n- To add VAT: multiply by 1.20\n- To find VAT in a gross amount: multiply by 20/120 (or divide by 6)\n- To find net from gross: multiply by 100/120 (or divide by 1.20)\n\nThe double-entry for this sale would be:\nDR Trade Receivables £960\nCR Sales £800\nCR VAT Control Account £160',
        options: [
          { optionText: '£800', isCorrect: false, explanation: '£800 is the net amount before VAT. The customer must also pay the VAT amount on top.' },
          { optionText: '£160', isCorrect: false, explanation: '£160 is just the VAT amount (20% of £800). The customer pays the total: net + VAT.' },
          { optionText: '£960', isCorrect: true, explanation: 'Correct! £800 + (20% × £800) = £800 + £160 = £960. The customer pays the gross amount including VAT.' },
          { optionText: '£640', isCorrect: false, explanation: 'This subtracts 20% from £800, which is incorrect. VAT is added to the price, not deducted from it.' },
        ],
      },
    ];

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const existing = await (prisma as any).question.findFirst({
        where: { moduleId: btrnModule.id, questionText: q.questionText },
      });
      if (!existing) {
        const created = await (prisma as any).question.create({
          data: {
            moduleId: btrnModule.id,
            questionText: q.questionText,
            topic: q.topic,
            difficulty: q.difficulty,
            syllabusRef: q.syllabusRef,
            aiExplanation: q.aiExplanation,
            sortOrder: i + 1,
          },
        });
        for (let j = 0; j < q.options.length; j++) {
          await (prisma as any).questionOption.create({
            data: {
              questionId: created.id,
              optionText: q.options[j].optionText,
              isCorrect: q.options[j].isCorrect,
              explanation: q.options[j].explanation,
              sortOrder: j + 1,
            },
          });
        }
        console.log(`  ❓ Q${i + 1}: ${q.questionText.substring(0, 60)}...`);
      }
    }
  }

  // ==================== SERVICE PACKAGES ====================
  const packages = [
    {
      title: 'National Insurance Number (NIN) Registration Support',
      slug: 'nin-registration',
      description: 'Complete guidance and administrative support for obtaining your UK National Insurance Number. We handle the application process, prepare your documents, and guide you through the DWP interview.\n\nIncludes:\n- Pre-application eligibility check\n- Document preparation and verification\n- Application form completion\n- Interview preparation guide\n- Follow-up until NIN letter received',
      shortDescription: 'Get your NIN sorted — we handle the paperwork and guide you through the process.',
      priceGbp: 149,
      deliverables: ['Eligibility assessment', 'Application form completed', 'Document checklist & verification', 'DWP interview preparation guide', 'Post-interview follow-up', 'NIN confirmation tracking'],
      requirements: ['Valid passport or BRP', 'Proof of UK address', 'Right to work in the UK'],
      estimatedDays: 14,
      category: 'relocation',
      iconEmoji: '🔢',
      isFeatured: true,
      sortOrder: 1,
    },
    {
      title: 'UK Bank Account Setup Guide & Support',
      slug: 'bank-account-setup',
      description: 'Struggling to open a UK bank account as a newcomer? We provide step-by-step guidance tailored to your situation, including which banks are most immigrant-friendly and how to prepare your documents.\n\nCovers: Monzo, Starling, Barclays, HSBC, Lloyds, NatWest — with specific advice for each bank\'s requirements.',
      shortDescription: 'Open your first UK bank account with expert guidance on document requirements.',
      priceGbp: 79,
      deliverables: ['Bank comparison guide (fees, features, requirements)', 'Document preparation for your chosen bank', 'Application walkthrough', 'Alternative options if initial application is declined', 'Digital bank setup assistance (Monzo/Starling)'],
      requirements: ['Valid passport or BRP', 'Proof of UK address (we help if you don\'t have one yet)'],
      estimatedDays: 7,
      category: 'relocation',
      iconEmoji: '🏦',
      isFeatured: false,
      sortOrder: 2,
    },
    {
      title: 'UK Limited Company Formation for Expats',
      slug: 'company-formation-expats',
      description: 'Start your UK business the right way. We handle the full Companies House registration process, set up your company structure, and ensure compliance from day one.\n\nPerfect for entrepreneurs, freelancers, and contractors who need a UK limited company.',
      shortDescription: 'Full UK company formation including Companies House registration and compliance setup.',
      priceGbp: 299,
      originalPriceGbp: 399,
      deliverables: ['Companies House registration (same-day)', 'Memorandum & Articles of Association', 'Certificate of Incorporation', 'Registered office address (1 year)', 'HMRC Corporation Tax registration', 'VAT registration guidance', 'First year compliance calendar'],
      requirements: ['Valid passport or BRP', 'Proof of UK address', 'Chosen company name (we check availability)', 'Director details'],
      estimatedDays: 3,
      category: 'company_formation',
      iconEmoji: '🏢',
      isFeatured: true,
      sortOrder: 3,
    },
    {
      title: 'Self-Assessment Tax Return Filing',
      slug: 'self-assessment-filing',
      description: 'Let our qualified team prepare and submit your Self-Assessment tax return to HMRC. We calculate your tax liability, identify all allowable deductions, and file before the deadline.\n\nIncludes a personalised tax efficiency review.',
      shortDescription: 'Professional SA100 tax return preparation and HMRC submission.',
      priceGbp: 199,
      deliverables: ['Tax return preparation (SA100/SA103)', 'Allowable expenses review', 'Tax liability calculation', 'HMRC online submission', 'Tax payment schedule', 'Tax efficiency recommendations'],
      requirements: ['UTR number', '12 months of income records', 'Expense receipts or bank statements', 'P60/P45 if employed'],
      estimatedDays: 7,
      category: 'tax',
      iconEmoji: '📋',
      isFeatured: false,
      sortOrder: 4,
    },
    {
      title: 'UK Visa Administrative Support',
      slug: 'visa-admin-support',
      description: 'Administrative preparation support for UK visa applications. We help organise your documents, fill out application forms, and prepare you for your appointment.\n\n⚠️ IMPORTANT: This is NOT immigration advice. We provide administrative support only. For legal immigration advice, you must consult an OISC-registered advisor or solicitor.',
      shortDescription: 'Document preparation and administrative support for UK visa applications.',
      priceGbp: 249,
      deliverables: ['Application form assistance', 'Document checklist preparation', 'Document organisation and translation guidance', 'Appointment booking guidance', 'Timeline and process overview', 'Post-submission tracking guidance'],
      requirements: ['Valid passport', 'Supporting documents for your visa category', 'English language test results (if applicable)'],
      estimatedDays: 10,
      category: 'visa',
      iconEmoji: '✈️',
      isFeatured: true,
      sortOrder: 5,
    },
    {
      title: 'Complete Newcomer Relocation Pack',
      slug: 'newcomer-relocation-pack',
      description: 'Everything you need to settle in the UK — bundled into one comprehensive package. From NIN registration to bank account setup to council tax registration, we guide you through every step.\n\nThis is our most popular package for new arrivals.',
      shortDescription: 'All-in-one relocation bundle: NIN + Bank + Council Tax + GP + more.',
      priceGbp: 399,
      originalPriceGbp: 599,
      deliverables: ['NIN application support', 'Bank account setup guidance', 'Council Tax registration help', 'GP/NHS registration guidance', 'Electoral register enrollment', 'Utility setup guidance', 'TV Licence registration', 'Welcome to the UK orientation call (30 min)'],
      requirements: ['Valid passport or BRP', 'Right to live in the UK', 'UK address (or temporary accommodation)'],
      estimatedDays: 21,
      category: 'relocation',
      iconEmoji: '🎒',
      isFeatured: true,
      sortOrder: 6,
    },
  ];

  for (const pkg of packages) {
    await (prisma as any).servicePackage.upsert({
      where: { slug: pkg.slug },
      update: pkg,
      create: pkg,
    });
    console.log(`  🛍️ ${pkg.title} — £${pkg.priceGbp}`);
  }

  console.log('\n✅ Academy seeding complete!');
  console.log(`  📖 ${levels.length} course levels`);
  console.log(`  📚 ${modules.length} exam modules`);
  console.log(`  🛍️ ${packages.length} service packages`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
