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
        { icon: 'Brain', title: '4-Layer AI Categorisation', description: 'Deterministic rules, pattern matching, AI classification, and auto-learning — 90%+ accuracy.' },
        { icon: 'Wifi', title: 'Open Banking Sync', description: 'Connect your UK bank accounts. Transactions sync 3x daily. Full 24-month history on first connect.' },
        { icon: 'Shield', title: 'Identity Verification (KYC)', description: 'Document scanning and biometric matching. Verify yourself or clients. Stay compliant.' },
        { icon: 'Building', title: 'Companies House Filing', description: 'File address changes and confirmation statements. View officers, filing history, and company status.' },
        { icon: 'GraduationCap', title: 'Accounting Academy', description: 'AAT & ACCA exam practice with timed tests, study mode, AI tutor, and career roadmap.' },
        { icon: 'Globe', title: 'UK Relocation Hub', description: 'AI-powered guide for newcomers — visas, NI numbers, bank accounts, GP registration.' },
        { icon: 'ShoppingBag', title: 'Service Marketplace', description: 'Professional accounting, tax filing, and bookkeeping services.' },
        { icon: 'HeartPulse', title: 'Financial Health Score', description: 'Real-time score based on 6 components: bills, categorisation, savings, budgets, actions, freshness.' },
        { icon: 'Smartphone', title: 'Install as App (PWA)', description: 'Works offline. Install on phone or desktop — no app store needed.' },
        { icon: 'Link2', title: 'Accountant Portal', description: 'Share data via secure read-only links. No password sharing needed.' },
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
    sectionKey: 'idvHero',
    title: 'Verify Anyone\'s Identity Digitally',
    subtitle: 'Certified Identity Verification (IDV)',
    content: {
      headline: 'Verify Anyone\'s Identity Digitally',
      description: 'Identity Document Verification (IDV) is a certified digital process that confirms a person is who they claim to be. It combines document scanning (passport, driving licence, BRP) with biometric facial matching — all from a smartphone.',
      descriptionDetail: 'The person simply opens a secure link on their phone, takes a photo of their ID document, then takes a selfie. Our AI compares the face on the document with the live selfie in seconds. The result is a government-grade certified report delivered straight to your inbox.',
      ctaPrimary: 'Start Verifying',
      ctaSecondary: 'UK Legal Requirements',
      phoneMockup: {
        steps: ['Scan ID Document', 'Take a Selfie', 'Verification Complete'],
        floatingBadges: ['Face Match: 99.7%', 'GDPR Certified', '~90 seconds'],
      },
    },
    sortOrder: 7,
  },
  {
    sectionKey: 'idvLaw',
    title: 'It\'s Not Optional — It\'s UK Law',
    subtitle: 'UK Legal Requirement',
    content: {
      headline: 'It\'s Not Optional — It\'s UK Law',
      description: 'The UK government requires identity verification in multiple scenarios. Failure to comply can result in unlimited fines, criminal prosecution, and loss of your licence to operate. Every business, landlord, and professional in the UK must comply.',
      laws: [
        { title: 'Right to Work (Employers)', law: 'Immigration, Asylum & Nationality Act 2006', description: 'Every UK employer MUST verify the identity and right to work of all employees before their first day. Penalties: up to £60,000 per illegal worker and criminal prosecution.', penalty: 'Up to £60,000 per worker' },
        { title: 'Right to Rent (Landlords)', law: 'Immigration Act 2014 (Part 3)', description: 'All landlords in England MUST check that tenants have the right to rent in the UK. This includes verifying passports, BRPs, or share codes before signing any tenancy agreement.', penalty: 'Up to £3,000 per tenant' },
        { title: 'AML & KYC (Financial Services)', law: 'Money Laundering Regulations 2017', description: 'Banks, accountants, estate agents, and regulated firms MUST verify customer identity under Anti-Money Laundering regulations. Required by the FCA and enforced by HMRC.', penalty: 'Unlimited fines + prison' },
        { title: 'DBS Checks (Education & Care)', law: 'Safeguarding Vulnerable Groups Act 2006', description: 'Schools, nurseries, care homes and anyone working with children or vulnerable adults MUST undergo identity verification as part of DBS (formerly CRB) checks.', penalty: 'Barred from profession' },
        { title: 'Sponsor Licence (Visa Sponsors)', law: 'UK Points-Based Immigration System', description: 'Businesses holding a Sponsor Licence MUST maintain records of identity checks for all sponsored workers. UKVI audits can revoke your licence if records are missing.', penalty: 'Licence revocation' },
        { title: 'GDPR Data Verification', law: 'UK GDPR & Data Protection Act 2018', description: 'Organisations handling personal data may need to verify identity before granting Subject Access Requests. Proper IDV ensures GDPR compliance and data protection.', penalty: 'Up to £17.5 million' },
      ],
      complianceBanner: 'Since April 2022, the Home Office requires all Right to Work and Right to Rent checks to use a certified Identity Document Validation Technology (IDVT) provider. Manual checks of physical documents are no longer sufficient for most document types. HomeLedger uses Yoti, a UK-government certified IDVT provider.',
    },
    sortOrder: 8,
  },
  {
    sectionKey: 'idvAudience',
    title: 'Who Needs Identity Verification?',
    subtitle: 'Almost every business and professional in the UK.',
    content: {
      headline: 'Who Needs Identity Verification?',
      description: 'Almost every business and professional in the UK. Here are the most common use cases.',
      audiences: [
        { title: 'Employers & HR Teams', description: 'Verify Right to Work for every new hire. From startups to large corporates — it\'s a legal requirement before the employee\'s first day.', people: 'All UK employers' },
        { title: 'Landlords & Letting Agents', description: 'Right to Rent checks before signing tenancy agreements. Applies to all residential lettings in England.', people: '2.6 million UK landlords' },
        { title: 'Accountants & Financial Advisors', description: 'Client onboarding KYC/AML checks. Required under Money Laundering Regulations for all regulated firms.', people: 'FCA regulated firms' },
        { title: 'Solicitors & Law Firms', description: 'Client verification for conveyancing, litigation, and corporate transactions. SRA requires robust ID checks.', people: 'SRA regulated solicitors' },
        { title: 'Immigration Advisors', description: 'Document verification for visa applications, settled status, and naturalisation. Share certified results with the Home Office.', people: 'OISC registered advisors' },
        { title: 'Recruitment Agencies', description: 'Bulk verification for temporary and permanent placements. Process hundreds of checks efficiently with our Business Pack.', people: '30,000+ UK agencies' },
      ],
    },
    sortOrder: 9,
  },
  {
    sectionKey: 'idvProcess',
    title: 'How It Works — Step by Step',
    subtitle: 'The entire process takes less than 90 seconds.',
    content: {
      headline: 'How It Works — Step by Step',
      description: 'The entire process takes less than 90 seconds. No apps to download, no accounts to create.',
      steps: [
        { step: '01', title: 'You Buy a Package', description: 'Choose Single, Business or Enterprise. Pay securely via Stripe. You receive unique verification links instantly.' },
        { step: '02', title: 'Send the Link', description: 'Share the secure verification link via email, WhatsApp, or text. The person to be verified opens it on their phone.' },
        { step: '03', title: 'Scan & Selfie', description: 'They photograph their ID document (passport, driving licence, or BRP) and take a live selfie for biometric matching.' },
        { step: '04', title: 'Certified Result', description: 'AI verifies the document and matches the face. You receive a certified result by email within seconds.' },
      ],
    },
    sortOrder: 10,
  },
  {
    sectionKey: 'idvPricing',
    title: 'Simple, Transparent Verification Pricing',
    subtitle: 'No hidden fees. No subscription. Pay once, verify as needed.',
    content: {
      headline: 'Simple, Transparent Verification Pricing',
      description: 'No hidden fees. No subscription. Pay once, verify as needed. No HomeLedger account required.',
      plans: [
        { id: 'single-check', name: 'Single Check', price: '£2.99', per: '/check', checks: 1, validityDays: 30, features: ['Document scanning', 'Biometric face match', 'Certified PDF result', 'Email delivery', '30-day link validity', 'Passport, DL, or BRP'] },
        { id: 'business-pack', name: 'Business Pack', price: '£19.99', per: '/pack', checks: 10, validityDays: 60, badge: 'Best Value — Save 33%', features: ['Everything in Single', '10 unique verification links', 'Bulk management dashboard', 'Priority processing', '60-day link validity', 'Ideal for SMEs & agencies'] },
        { id: 'enterprise', name: 'Enterprise', price: '£49.99', per: '/pack', checks: 50, validityDays: 90, features: ['Everything in Business', '50 unique verification links', 'Dedicated account support', 'API access for automation', '90-day link validity', 'For large organisations'] },
      ],
      trustBadges: ['Government-Certified (IDVT)', 'UK GDPR Compliant', 'AI Biometric Matching', 'Home Office Approved', 'Results in ~90 Seconds'],
      noAccountBanner: 'No account needed — purchase, send the link, get results. It\'s that simple.',
    },
    sortOrder: 11,
  },
  {
    sectionKey: 'newArrivals',
    title: 'New to the UK? We\'ve Got You Covered',
    subtitle: 'Navigate UK finances, qualifications, and professional services from day one.',
    content: {
      headline: 'New to the UK? We\'ve Got You Covered',
      subheadline: 'Whether you\'re relocating for work, study, or family — HomeLedger helps you navigate UK finances, accounting qualifications, and professional services from day one.',
      features: [
        { icon: 'Globe', title: 'AI Relocation Guide', description: 'Visa advice, NI numbers, bank accounts, GP registration — fully OISC compliant.' },
        { icon: 'GraduationCap', title: 'Accounting Academy', description: 'AAT & ACCA exam practice with AI tutor and career roadmap from Level 2 to Level 6.' },
        { icon: 'ShoppingBag', title: 'Service Marketplace', description: 'Professional accounting, tax filing, and bookkeeping packages.' },
        { icon: 'HeartPulse', title: 'Financial Health Score', description: 'Track your financial wellbeing with a real-time dashboard.' },
        { icon: 'Smartphone', title: 'Install as App', description: 'Access HomeLedger offline from your phone or desktop.' },
      ],
      ctaPrimary: 'Start Free Today',
    },
    sortOrder: 12,
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
    sortOrder: 13,
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
    sortOrder: 14,
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
