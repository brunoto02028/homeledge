const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const sections = [
  {
    sectionKey: 'meta',
    title: 'HomeLedger — Simplify Your UK Finances',
    subtitle: 'Manage bank statements, invoices, HMRC tax reports, bills, and more.',
    content: { description: 'Free UK personal and business finance platform with AI-powered tools.', keywords: 'UK finance, HMRC, tax reports, invoices, bank statements, AI' },
    isPublished: true, sortOrder: 0
  },
  {
    sectionKey: 'hero',
    title: 'Hero Section',
    subtitle: '',
    content: { headline: 'Your UK Finances, Finally Simplified', subheadline: 'Bank statements, invoices, HMRC reports, tax deadlines, secure vault and AI assistant — all in one platform built for UK individuals and businesses.' },
    isPublished: true, sortOrder: 1
  },
  {
    sectionKey: 'stats',
    title: 'Stats Bar',
    subtitle: '',
    content: { items: [{ number: '16+', label: 'Financial Modules' }, { number: 'AI', label: 'Powered Automation' }, { number: 'HMRC', label: 'Compliant Reports' }, { number: '256-bit', label: 'AES Encryption' }] },
    isPublished: true, sortOrder: 2
  },
  {
    sectionKey: 'features',
    title: 'Everything You Need in One Place',
    subtitle: '16 powerful modules designed specifically for UK personal and business finance.',
    content: { items: [
      { icon: 'FileSpreadsheet', title: 'Bank Statements', description: 'Upload CSV, PDF or Excel statements. AI categorises every transaction and maps it to your accounts automatically.' },
      { icon: 'FileText', title: 'Invoices', description: 'Create professional invoices, track payments and overdue amounts. Scan paper invoices with AI document processing.' },
      { icon: 'Receipt', title: 'Bills & Subscriptions', description: 'Manage recurring bills, set due-date reminders and track spending by provider. Never miss a payment.' },
      { icon: 'BarChart3', title: 'HMRC Tax Reports', description: 'Generate SA103, CT600 and tax summaries with automatic HMRC box mapping. Export to PDF in one click.' },
      { icon: 'KeyRound', title: 'Secure Vault', description: 'Store passwords, API keys and credentials with AES-256-GCM encryption. Bank-grade security for all your secrets.' },
      { icon: 'TrendingUp', title: 'Financial Projections', description: 'Cash flow forecasting, budget tracking, savings goals and debt payoff plans. See your financial future.' },
      { icon: 'CalendarClock', title: 'Tax Timeline', description: 'Visual calendar of HMRC deadlines — Self Assessment, VAT, Corporation Tax, PAYE. Alerts before every due date.' },
      { icon: 'Camera', title: 'Snap & Forget', description: 'Photograph receipts and documents with your phone. AI extracts all the data — zero manual entry required.' },
      { icon: 'Link2', title: 'Government APIs', description: 'Connect to Companies House and HMRC. View company profiles, filing history, tax obligations and submit returns.' },
      { icon: 'Home', title: 'UK Life Events', description: 'Track life milestones — buying a home, marriage, starting a business. Personalised financial checklists.' },
      { icon: 'Landmark', title: 'Multi-Entity', description: 'Manage personal finances alongside multiple Ltd companies, CICs or sole-trader businesses — all in one account.' },
      { icon: 'MessageSquare', title: 'AI Assistant', description: 'Context-aware AI chat that understands your data. Ask about your finances and get instant, accurate answers.' },
      { icon: 'Tag', title: 'Smart Categories', description: 'Custom categories with HMRC tax-box mapping. AI suggests the right category for every transaction.' },
      { icon: 'FolderOpen', title: 'Document Storage', description: 'Upload and organise financial documents. Full-text search, entity linking and secure cloud storage.' },
      { icon: 'ArrowLeftRight', title: 'Transfers', description: 'Track inter-account transfers and reconcile balances across all your bank accounts and entities.' },
      { icon: 'GraduationCap', title: 'Financial Learning', description: 'Built-in guides on UK tax, self-assessment, VAT registration, company accounts and personal finance.' }
    ] },
    isPublished: true, sortOrder: 3
  },
  {
    sectionKey: 'business',
    title: 'Run Your Business Finances with Confidence',
    subtitle: 'Whether you are a sole trader, limited company, or CIC — HomeLedger handles invoices, tax reports, Companies House filings, and HMRC obligations.',
    content: { bullets: [
      'Manage multiple entities — Ltd, CIC, sole trader, personal',
      'SA103 & CT600 reports with automatic box mapping',
      'Companies House & HMRC API integration',
      'Tax deadline alerts — SA, VAT, CT, PAYE',
      'Professional invoices with payment tracking',
      'AI categorisation with tax-regime awareness'
    ] },
    isPublished: true, sortOrder: 4
  },
  {
    sectionKey: 'howItWorks',
    title: 'Up and Running in Minutes',
    subtitle: 'Three simple steps to take control of your finances',
    content: { steps: [
      { step: '1', title: 'Create Your Free Account', description: 'Sign up in under a minute. No credit card required. Add your personal profile or business entities.' },
      { step: '2', title: 'Upload Your Data', description: 'Import bank statements, scan invoices and receipts, or connect to HMRC & Companies House directly.' },
      { step: '3', title: 'Get AI-Powered Insights', description: 'AI categorises everything, generates tax reports, tracks deadlines and gives you a clear financial picture.' }
    ] },
    isPublished: true, sortOrder: 5
  },
  {
    sectionKey: 'accountants',
    title: 'Manage All Your Clients in One Place',
    subtitle: 'Dedicated dashboard to onboard clients, view financial data, and generate HMRC-ready reports — without sharing login credentials.',
    content: { bullets: [
      'Invite clients by email — they keep their own account',
      'View statements, invoices, bills & entities in real-time',
      'HMRC SA103 & CT600 reports at your fingertips',
      'Granular permissions — read-only by default',
      'Multi-entity support for complex client portfolios'
    ] },
    isPublished: true, sortOrder: 6
  },
  {
    sectionKey: 'pricing',
    title: 'Simple, Transparent Pricing',
    subtitle: 'Start free. Upgrade when you need more power.',
    content: {},
    isPublished: true, sortOrder: 7
  },
  {
    sectionKey: 'faq',
    title: 'Frequently Asked Questions',
    subtitle: '',
    content: { items: [
      { question: 'Is HomeLedger really free?', answer: 'Yes! Our Free plan includes full access to statements, invoices, bills, categories, and basic reports. Premium plans add advanced features like AI chat, financial projections, and priority support.' },
      { question: 'Is my financial data secure?', answer: 'Absolutely. All data is encrypted in transit (TLS 1.3) and at rest. Vault entries use AES-256-GCM encryption. We never share your data with third parties.' },
      { question: 'Can I manage multiple businesses?', answer: 'Yes. HomeLedger supports unlimited entities — personal accounts, limited companies, CICs, sole-trader businesses — all from one login.' },
      { question: 'Does it generate HMRC-ready reports?', answer: 'Yes. We generate SA103 (Self Assessment), CT600 (Corporation Tax), and detailed tax summaries with automatic box mapping. Export to PDF anytime.' },
      { question: 'Can my accountant access my data?', answer: 'Yes. Invite your accountant via email. They get a dedicated dashboard to view your data with read-only permissions — no credential sharing needed.' },
      { question: 'What file formats do you support?', answer: 'We accept CSV, PDF, Excel (.xlsx), and image files (JPG, PNG) for bank statements, invoices, and documents. Our AI processes them all.' },
      { question: 'Can I install HomeLedger as a desktop app?', answer: 'Yes! HomeLedger is a Progressive Web App (PWA). Click Install in your browser to add it to your desktop or mobile home screen.' },
      { question: 'How does the AI Assistant work?', answer: 'Our AI understands the context of the page you are on. Ask it about your statements, tax obligations, or spending patterns and it gives personalised answers.' }
    ] },
    isPublished: true, sortOrder: 8
  },
  {
    sectionKey: 'cta',
    title: 'Final CTA',
    subtitle: '',
    content: { headline: 'Ready to Take Control of Your Finances?', subheadline: 'Join UK individuals, sole traders and businesses already using HomeLedger.' },
    isPublished: true, sortOrder: 9
  },
  {
    sectionKey: 'footer',
    title: 'Footer',
    subtitle: '',
    content: { copyright: '2025 HomeLedger. All rights reserved.', columns: { product: ['Features', 'Pricing', 'FAQ'], solutions: ['For Business', 'For Accountants', 'Personal Finance'], legal: ['Privacy Policy', 'Terms of Service'], account: ['Sign In', 'Create Account'] } },
    isPublished: true, sortOrder: 10
  }
];

async function seed() {
  for (const s of sections) {
    await prisma.landingPageSection.upsert({
      where: { sectionKey: s.sectionKey },
      update: { title: s.title, subtitle: s.subtitle, content: s.content, isPublished: s.isPublished, sortOrder: s.sortOrder },
      create: s
    });
    console.log('Upserted:', s.sectionKey);
  }
  await prisma.$disconnect();
  console.log('All CMS sections seeded!');
}
seed().catch(e => { console.error(e); process.exit(1); });
