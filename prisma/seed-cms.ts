import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const sections = [
  {
    sectionKey: 'meta',
    title: 'HomeLedger — UK Finance Management',
    subtitle: null,
    content: {
      pageTitle: 'HomeLedger — Simplify Your UK Finances',
      metaDescription: 'Manage bank statements, invoices, HMRC tax reports, bills, and more. Free UK personal and business finance platform with AI-powered tools.',
      ogTitle: 'HomeLedger — Your Finances, Simplified',
      ogDescription: 'The all-in-one UK finance platform for individuals and small businesses. Bank statements, invoices, tax reports, secure vault, and AI tools.',
      keywords: ['UK finance', 'personal finance', 'HMRC tax', 'self assessment', 'invoice management', 'bank statements', 'bill tracker', 'financial projections', 'HomeLedger'],
    },
    sortOrder: 0,
  },
  {
    sectionKey: 'hero',
    title: 'Your UK Finances, Finally Simplified',
    subtitle: 'Bank statements, invoices, HMRC tax reports, bills, secure vault — all in one beautiful platform. Powered by AI.',
    content: {
      headline: 'Your UK Finances, Finally Simplified',
      subheadline: 'Stop juggling spreadsheets, receipts, and HMRC deadlines. HomeLedger brings everything together — bank statements, invoices, tax reports, bills, and more — so you can focus on what matters.',
      ctaPrimary: 'Start Free',
      ctaSecondary: 'See How It Works',
    },
    sortOrder: 1,
  },
  {
    sectionKey: 'features',
    title: 'Everything You Need',
    subtitle: 'Powerful tools designed for UK individuals and small businesses',
    content: {
      items: [
        { icon: 'FileSpreadsheet', title: 'Smart Bank Statements', description: 'Upload PDF, CSV, or OFX files. Our AI automatically categorises every transaction and maps them to HMRC boxes.' },
        { icon: 'FileText', title: 'Professional Invoices', description: 'Create, send, and track invoices with custom templates. Auto-calculate VAT and generate PDF downloads.' },
        { icon: 'Receipt', title: 'Bill Tracking', description: 'Never miss a payment. Track recurring bills, set reminders, and see your monthly outgoings at a glance.' },
        { icon: 'BarChart3', title: 'HMRC Tax Reports', description: 'Self Assessment ready. See your income, expenses, and tax liability mapped to SA103 boxes in real time.' },
        { icon: 'KeyRound', title: 'Secure Vault', description: 'Bank-grade AES-256 encryption for your passwords, credentials, and sensitive documents. All stored safely.' },
        { icon: 'Camera', title: 'Capture & Classify', description: 'Scan receipts and documents from your phone. AI extracts, categorises, and files everything automatically.' },
        { icon: 'TrendingUp', title: 'Financial Projections', description: 'Set savings goals, track budgets, and forecast your financial future with interactive charts and alerts.' },
        { icon: 'Home', title: 'Property Portfolio', description: 'Track property values, mortgages, rental income, and equity. Perfect for landlords and homeowners.' },
      ],
    },
    sortOrder: 2,
  },
  {
    sectionKey: 'howItWorks',
    title: 'Up and Running in Minutes',
    subtitle: 'Three simple steps to take control of your finances',
    content: {
      steps: [
        { step: 1, title: 'Create Your Free Account', description: 'Sign up in seconds. No credit card required. Choose personal or business mode.' },
        { step: 2, title: 'Import Your Data', description: 'Upload bank statements, scan receipts, or add bills manually. Our AI does the heavy lifting.' },
        { step: 3, title: 'Stay in Control', description: 'Track spending, generate tax reports, set budgets, and never miss an HMRC deadline again.' },
      ],
    },
    sortOrder: 3,
  },
  {
    sectionKey: 'pricing',
    title: 'Simple, Transparent Pricing',
    subtitle: 'Start free. Upgrade when you need more.',
    content: {
      plans: [
        {
          name: 'Free',
          price: '£0',
          period: '/month',
          features: ['3 bank statements/month', '5 invoices/month', '10 vault entries', 'Basic tax reports', 'Bill tracking'],
          cta: 'Get Started Free',
          highlighted: false,
        },
        {
          name: 'Pro',
          price: '£9.99',
          period: '/month',
          features: ['Unlimited statements', 'Unlimited invoices', 'Unlimited vault', 'Full HMRC reports + PDF export', 'Financial projections', '3 team members', 'Priority AI chat'],
          cta: 'Start Pro Trial',
          highlighted: true,
        },
        {
          name: 'Business',
          price: '£24.99',
          period: '/month',
          features: ['Everything in Pro', 'Unlimited AI chat', '10 team members', 'Unlimited entities', 'Property portfolio', 'Product calculator', 'Priority support', 'Accountant portal'],
          cta: 'Contact Sales',
          highlighted: false,
        },
      ],
    },
    sortOrder: 4,
  },
  {
    sectionKey: 'testimonials',
    title: 'Loved by Thousands',
    subtitle: 'See what our users say about HomeLedger',
    content: {
      items: [
        { name: 'Sarah Mitchell', role: 'Freelance Designer, London', quote: 'HomeLedger saved me hours every month on Self Assessment. The AI categorisation is scarily accurate.', rating: 5 },
        { name: 'James Okonkwo', role: 'Landlord, Manchester', quote: 'Finally a tool that handles multiple properties AND personal finances. The property portfolio feature is brilliant.', rating: 5 },
        { name: 'Priya Sharma', role: 'Small Business Owner, Birmingham', quote: 'I switched from Xero for my personal stuff. HomeLedger is simpler, faster, and the vault feature is a game-changer.', rating: 5 },
      ],
    },
    sortOrder: 5,
  },
  {
    sectionKey: 'faq',
    title: 'Frequently Asked Questions',
    subtitle: null,
    content: {
      items: [
        { question: 'Is HomeLedger really free?', answer: 'Yes! The Free plan includes bank statement uploads, invoice creation, bill tracking, and basic tax reports. No credit card required.' },
        { question: 'Is my data secure?', answer: 'Absolutely. We use AES-256 encryption for vault entries, HTTPS everywhere, and your data is stored on secure UK/EU servers. We never share your data with third parties.' },
        { question: 'Can I use it for Self Assessment?', answer: 'Yes. HomeLedger maps your income and expenses to HMRC SA103 boxes automatically. You can export PDF reports ready for your tax return.' },
        { question: 'Does it work with my bank?', answer: 'HomeLedger supports PDF, CSV, OFX, and QIF bank statement formats from any UK bank including HSBC, Barclays, Lloyds, NatWest, Monzo, Starling, and more.' },
        { question: 'Can I invite my accountant?', answer: 'Yes! With the Accountant Portal feature, you can generate secure read-only links to share specific data with your accountant — no login required.' },
        { question: 'What about VAT?', answer: 'HomeLedger supports VAT-registered businesses. Invoices auto-calculate VAT, and reports show your VAT liability. We support Standard, Flat Rate, and Cash Accounting schemes.' },
      ],
    },
    sortOrder: 6,
  },
  {
    sectionKey: 'cta',
    title: 'Ready to Take Control?',
    subtitle: 'Join thousands of UK users and businesses already using HomeLedger.',
    content: {
      headline: 'Ready to Take Control of Your Finances?',
      subheadline: 'Join thousands of UK users and businesses already using HomeLedger. Free forever — no credit card required.',
      buttonText: 'Create Your Free Account',
    },
    sortOrder: 7,
  },
  {
    sectionKey: 'footer',
    title: null,
    subtitle: null,
    content: {
      tagline: 'Your finances, simplified.',
      copyright: `© ${new Date().getFullYear()} HomeLedger. All rights reserved.`,
      links: [
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Terms of Service', href: '/terms' },
        { label: 'Contact', href: 'mailto:hello@homeledger.co.uk' },
      ],
    },
    sortOrder: 8,
  },
];

async function main() {
  console.log('Seeding CMS landing page sections...');
  for (const section of sections) {
    await prisma.landingPageSection.upsert({
      where: { sectionKey: section.sectionKey },
      update: { ...section },
      create: { ...section },
    });
    console.log(`  ✓ ${section.sectionKey}`);
  }
  console.log('Done!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
