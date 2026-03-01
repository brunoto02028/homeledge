import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PLANS = [
  {
    name: 'starter',
    displayName: 'Starter',
    price: 7.90,
    interval: 'monthly',
    sortOrder: 1,
    isDefault: true,
    features: [
      'Bank Statement Upload & AI Categorisation',
      'Invoice & Bill Management',
      'Secure Vault (10 entries)',
      'Capture & Classify (5/month)',
      'Financial Dashboard',
      'Categories Management',
      'File Manager',
      'Product Calculator',
      'Light Mode / Dark Mode',
      'Mobile PWA App',
    ],
    limits: { statements: 10, invoices: 20, vault: 10, documents: 5, entities: 2 },
  },
  {
    name: 'pro',
    displayName: 'Pro',
    price: 14.90,
    interval: 'monthly',
    sortOrder: 2,
    isDefault: false,
    features: [
      'Everything in Starter +',
      'Unlimited Statements & Invoices',
      'Tax Reports & SA103 Mapping',
      'Email Client (IMAP/SMTP)',
      'Open Banking Sync (3x daily)',
      'Financial Projections',
      'Budget Alerts',
      'Tax Timeline & Reminders',
      'Accounting Academy Access',
      'AI Chat Assistant',
      'Secure Vault (unlimited)',
    ],
    limits: { statements: -1, invoices: -1, vault: -1, documents: 50, entities: 5 },
  },
  {
    name: 'business',
    displayName: 'Business',
    price: 29.90,
    interval: 'monthly',
    sortOrder: 3,
    isDefault: false,
    features: [
      'Everything in Pro +',
      'HMRC API Integration',
      'Companies House Filing (AD01, CS01)',
      'Multi-Entity Management (unlimited)',
      'Accountant Portal & Shared Links',
      'Smart Categorisation Rules',
      'Household Finance Hub',
      'Property Management',
      'Life Events Planning',
      'Unlimited Documents & Vault',
      'Priority Support',
    ],
    limits: { statements: -1, invoices: -1, vault: -1, documents: -1, entities: -1 },
  },
  {
    name: 'managed',
    displayName: 'Managed',
    price: 99.90,
    interval: 'monthly',
    sortOrder: 4,
    isDefault: false,
    features: [
      'Everything in Business +',
      'Dedicated Bookkeeping Support',
      'Monthly Financial Review',
      'Tax Return Preparation (SA100)',
      'Companies House Annual Filing',
      'Compliance Dashboard & KYC',
      'Custom Integrations',
      'Dedicated Account Manager',
      'Phone & Video Support',
      'SLA Response < 4 hours',
    ],
    limits: { statements: -1, invoices: -1, vault: -1, documents: -1, entities: -1 },
  },
];

async function main() {
  console.log('Seeding subscription plans...');

  for (const plan of PLANS) {
    await prisma.subscriptionPlan.upsert({
      where: { name: plan.name },
      update: {
        displayName: plan.displayName,
        price: plan.price,
        interval: plan.interval,
        features: plan.features,
        limits: plan.limits,
        isActive: true,
        isDefault: plan.isDefault,
        sortOrder: plan.sortOrder,
      },
      create: plan,
    });
    console.log(`  ✓ ${plan.displayName} — £${plan.price.toFixed(2)}/mo`);
  }

  console.log('Done! 4 plans seeded.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
