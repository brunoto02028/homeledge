import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// System rules: global (userId=null), source="system", auto-matched by the engine
// These cover ~60-70% of UK household and business transactions
const SYSTEM_RULES: Array<{
  keyword: string;
  matchType: 'contains' | 'exact' | 'starts_with';
  categoryName: string;
  transactionType?: 'credit' | 'debit';
  description: string;
  priority?: number;
}> = [
  // ═══════════════════════════════════════════════════════════════
  // INCOME (credit)
  // ═══════════════════════════════════════════════════════════════
  { keyword: 'salary', matchType: 'contains', categoryName: 'Salary', transactionType: 'credit', description: 'Salary/wages payment', priority: 10 },
  { keyword: 'wages', matchType: 'contains', categoryName: 'Salary', transactionType: 'credit', description: 'Wages payment', priority: 10 },
  { keyword: 'payroll', matchType: 'contains', categoryName: 'Salary', transactionType: 'credit', description: 'Payroll payment', priority: 10 },
  { keyword: 'universal credit', matchType: 'contains', categoryName: 'Benefits', transactionType: 'credit', description: 'DWP Universal Credit', priority: 10 },
  { keyword: 'child benefit', matchType: 'contains', categoryName: 'Benefits', transactionType: 'credit', description: 'HMRC Child Benefit', priority: 10 },
  { keyword: 'tax credit', matchType: 'contains', categoryName: 'Benefits', transactionType: 'credit', description: 'HMRC Tax Credit', priority: 10 },
  { keyword: 'dwp', matchType: 'contains', categoryName: 'Benefits', transactionType: 'credit', description: 'DWP payment', priority: 8 },
  { keyword: 'refund', matchType: 'contains', categoryName: 'Refunds', transactionType: 'credit', description: 'Refund payment', priority: 5 },
  { keyword: 'interest earned', matchType: 'contains', categoryName: 'Interest', transactionType: 'credit', description: 'Bank interest', priority: 8 },
  { keyword: 'dividend', matchType: 'contains', categoryName: 'Dividends', transactionType: 'credit', description: 'Dividend payment', priority: 8 },

  // ═══════════════════════════════════════════════════════════════
  // GROCERIES / SUPERMARKETS
  // ═══════════════════════════════════════════════════════════════
  { keyword: 'tesco', matchType: 'contains', categoryName: 'Groceries', description: 'Tesco supermarket', priority: 10 },
  { keyword: 'sainsbury', matchType: 'contains', categoryName: 'Groceries', description: 'Sainsburys supermarket', priority: 10 },
  { keyword: 'asda', matchType: 'contains', categoryName: 'Groceries', description: 'Asda supermarket', priority: 10 },
  { keyword: 'morrisons', matchType: 'contains', categoryName: 'Groceries', description: 'Morrisons supermarket', priority: 10 },
  { keyword: 'aldi', matchType: 'contains', categoryName: 'Groceries', description: 'Aldi supermarket', priority: 10 },
  { keyword: 'lidl', matchType: 'contains', categoryName: 'Groceries', description: 'Lidl supermarket', priority: 10 },
  { keyword: 'waitrose', matchType: 'contains', categoryName: 'Groceries', description: 'Waitrose supermarket', priority: 10 },
  { keyword: 'co-op', matchType: 'contains', categoryName: 'Groceries', description: 'Co-op supermarket', priority: 10 },
  { keyword: 'ocado', matchType: 'contains', categoryName: 'Groceries', description: 'Ocado delivery', priority: 10 },
  { keyword: 'iceland', matchType: 'contains', categoryName: 'Groceries', description: 'Iceland frozen foods', priority: 9 },
  { keyword: 'costco', matchType: 'contains', categoryName: 'Groceries', description: 'Costco wholesale', priority: 9 },

  // ═══════════════════════════════════════════════════════════════
  // DINING & TAKEAWAY
  // ═══════════════════════════════════════════════════════════════
  { keyword: 'deliveroo', matchType: 'contains', categoryName: 'Dining & Takeaway', description: 'Deliveroo food delivery', priority: 10 },
  { keyword: 'uber eats', matchType: 'contains', categoryName: 'Dining & Takeaway', description: 'Uber Eats food delivery', priority: 10 },
  { keyword: 'just eat', matchType: 'contains', categoryName: 'Dining & Takeaway', description: 'Just Eat food delivery', priority: 10 },
  { keyword: 'mcdonalds', matchType: 'contains', categoryName: 'Dining & Takeaway', description: 'McDonalds', priority: 10 },
  { keyword: 'kfc', matchType: 'contains', categoryName: 'Dining & Takeaway', description: 'KFC', priority: 10 },
  { keyword: 'greggs', matchType: 'contains', categoryName: 'Dining & Takeaway', description: 'Greggs bakery', priority: 10 },
  { keyword: 'nandos', matchType: 'contains', categoryName: 'Dining & Takeaway', description: 'Nandos restaurant', priority: 10 },
  { keyword: 'dominos', matchType: 'contains', categoryName: 'Dining & Takeaway', description: 'Dominos Pizza', priority: 10 },
  { keyword: 'starbucks', matchType: 'contains', categoryName: 'Dining & Takeaway', description: 'Starbucks coffee', priority: 10 },
  { keyword: 'costa', matchType: 'contains', categoryName: 'Dining & Takeaway', description: 'Costa Coffee', priority: 10 },
  { keyword: 'pret', matchType: 'contains', categoryName: 'Dining & Takeaway', description: 'Pret A Manger', priority: 10 },

  // ═══════════════════════════════════════════════════════════════
  // SUBSCRIPTIONS
  // ═══════════════════════════════════════════════════════════════
  { keyword: 'netflix', matchType: 'contains', categoryName: 'Subscriptions', description: 'Netflix streaming', priority: 10 },
  { keyword: 'spotify', matchType: 'contains', categoryName: 'Subscriptions', description: 'Spotify music', priority: 10 },
  { keyword: 'amazon prime', matchType: 'contains', categoryName: 'Subscriptions', description: 'Amazon Prime', priority: 10 },
  { keyword: 'disney+', matchType: 'contains', categoryName: 'Subscriptions', description: 'Disney+ streaming', priority: 10 },
  { keyword: 'apple.com/bill', matchType: 'contains', categoryName: 'Subscriptions', description: 'Apple subscription', priority: 10 },
  { keyword: 'youtube premium', matchType: 'contains', categoryName: 'Subscriptions', description: 'YouTube Premium', priority: 10 },
  { keyword: 'audible', matchType: 'contains', categoryName: 'Subscriptions', description: 'Audible audiobooks', priority: 9 },

  // ═══════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════
  { keyword: 'british gas', matchType: 'contains', categoryName: 'Utilities', description: 'British Gas energy', priority: 10 },
  { keyword: 'edf', matchType: 'contains', categoryName: 'Utilities', description: 'EDF Energy', priority: 10 },
  { keyword: 'octopus energy', matchType: 'contains', categoryName: 'Utilities', description: 'Octopus Energy', priority: 10 },
  { keyword: 'ovo energy', matchType: 'contains', categoryName: 'Utilities', description: 'OVO Energy', priority: 10 },
  { keyword: 'eon', matchType: 'contains', categoryName: 'Utilities', description: 'E.ON energy', priority: 9 },
  { keyword: 'thames water', matchType: 'contains', categoryName: 'Utilities', description: 'Thames Water', priority: 10 },

  // ═══════════════════════════════════════════════════════════════
  // TELECOMS
  // ═══════════════════════════════════════════════════════════════
  { keyword: 'vodafone', matchType: 'contains', categoryName: 'Telecoms', description: 'Vodafone mobile/broadband', priority: 10 },
  { keyword: 'virgin media', matchType: 'contains', categoryName: 'Telecoms', description: 'Virgin Media', priority: 10 },
  { keyword: 'bt broadband', matchType: 'contains', categoryName: 'Telecoms', description: 'BT Broadband', priority: 10 },
  { keyword: 'sky', matchType: 'contains', categoryName: 'Telecoms', description: 'Sky TV/Broadband', priority: 8 },
  { keyword: 'giffgaff', matchType: 'contains', categoryName: 'Telecoms', description: 'GiffGaff mobile', priority: 10 },
  { keyword: 'three', matchType: 'exact', categoryName: 'Telecoms', description: 'Three mobile', priority: 10 },

  // ═══════════════════════════════════════════════════════════════
  // TRAVEL
  // ═══════════════════════════════════════════════════════════════
  { keyword: 'uber', matchType: 'contains', categoryName: 'Travel', description: 'Uber ride', priority: 7 },
  { keyword: 'tfl', matchType: 'contains', categoryName: 'Travel', description: 'Transport for London', priority: 10 },
  { keyword: 'trainline', matchType: 'contains', categoryName: 'Travel', description: 'Trainline tickets', priority: 10 },
  { keyword: 'national express', matchType: 'contains', categoryName: 'Travel', description: 'National Express coach', priority: 10 },
  { keyword: 'easyjet', matchType: 'contains', categoryName: 'Travel', description: 'EasyJet flights', priority: 10 },
  { keyword: 'ryanair', matchType: 'contains', categoryName: 'Travel', description: 'Ryanair flights', priority: 10 },

  // ═══════════════════════════════════════════════════════════════
  // VEHICLE / FUEL
  // ═══════════════════════════════════════════════════════════════
  { keyword: 'shell', matchType: 'contains', categoryName: 'Vehicle Costs', description: 'Shell fuel station', priority: 9 },
  { keyword: 'bp ', matchType: 'contains', categoryName: 'Vehicle Costs', description: 'BP fuel station', priority: 9 },
  { keyword: 'esso', matchType: 'contains', categoryName: 'Vehicle Costs', description: 'Esso fuel station', priority: 10 },
  { keyword: 'euro car parks', matchType: 'contains', categoryName: 'Vehicle Costs', description: 'Euro Car Parks parking', priority: 10 },
  { keyword: 'ringo', matchType: 'contains', categoryName: 'Vehicle Costs', description: 'RingGo parking', priority: 10 },
  { keyword: 'halfords', matchType: 'contains', categoryName: 'Vehicle Costs', description: 'Halfords car parts', priority: 10 },

  // ═══════════════════════════════════════════════════════════════
  // SHOPPING
  // ═══════════════════════════════════════════════════════════════
  { keyword: 'amazon.co.uk', matchType: 'contains', categoryName: 'Shopping', description: 'Amazon UK', priority: 9 },
  { keyword: 'amazon marketplace', matchType: 'contains', categoryName: 'Shopping', description: 'Amazon Marketplace', priority: 9 },
  { keyword: 'ebay', matchType: 'contains', categoryName: 'Shopping', description: 'eBay', priority: 9 },
  { keyword: 'argos', matchType: 'contains', categoryName: 'Shopping', description: 'Argos', priority: 10 },
  { keyword: 'john lewis', matchType: 'contains', categoryName: 'Shopping', description: 'John Lewis', priority: 10 },
  { keyword: 'currys', matchType: 'contains', categoryName: 'Shopping', description: 'Currys electronics', priority: 10 },
  { keyword: 'asos', matchType: 'contains', categoryName: 'Shopping', description: 'ASOS fashion', priority: 10 },

  // ═══════════════════════════════════════════════════════════════
  // COUNCIL TAX / GOVERNMENT
  // ═══════════════════════════════════════════════════════════════
  { keyword: 'council tax', matchType: 'contains', categoryName: 'Council Tax', description: 'Council tax payment', priority: 10 },
  { keyword: 'hmrc', matchType: 'contains', categoryName: 'Benefits', transactionType: 'credit', description: 'HMRC payment received', priority: 9 },

  // ═══════════════════════════════════════════════════════════════
  // INSURANCE
  // ═══════════════════════════════════════════════════════════════
  { keyword: 'admiral', matchType: 'contains', categoryName: 'Insurance', description: 'Admiral insurance', priority: 10 },
  { keyword: 'direct line', matchType: 'contains', categoryName: 'Insurance', description: 'Direct Line insurance', priority: 10 },
  { keyword: 'aviva', matchType: 'contains', categoryName: 'Insurance', description: 'Aviva insurance', priority: 10 },

  // ═══════════════════════════════════════════════════════════════
  // HEALTHCARE
  // ═══════════════════════════════════════════════════════════════
  { keyword: 'boots', matchType: 'contains', categoryName: 'Healthcare', description: 'Boots pharmacy', priority: 8 },
  { keyword: 'specsavers', matchType: 'contains', categoryName: 'Healthcare', description: 'Specsavers optician', priority: 10 },

  // ═══════════════════════════════════════════════════════════════
  // PERSONAL CARE / FITNESS
  // ═══════════════════════════════════════════════════════════════
  { keyword: 'puregym', matchType: 'contains', categoryName: 'Personal Care', description: 'PureGym membership', priority: 10 },
  { keyword: 'david lloyd', matchType: 'contains', categoryName: 'Personal Care', description: 'David Lloyd gym', priority: 10 },

  // ═══════════════════════════════════════════════════════════════
  // SOFTWARE / IT (business)
  // ═══════════════════════════════════════════════════════════════
  { keyword: 'adobe', matchType: 'contains', categoryName: 'Software & IT', description: 'Adobe Creative Cloud', priority: 10 },
  { keyword: 'microsoft 365', matchType: 'contains', categoryName: 'Software & IT', description: 'Microsoft 365', priority: 10 },
  { keyword: 'openai', matchType: 'contains', categoryName: 'Software & IT', description: 'OpenAI API', priority: 10 },
  { keyword: 'github', matchType: 'contains', categoryName: 'Software & IT', description: 'GitHub', priority: 10 },
  { keyword: 'aws', matchType: 'contains', categoryName: 'Software & IT', description: 'Amazon Web Services', priority: 9 },
  { keyword: 'google workspace', matchType: 'contains', categoryName: 'Software & IT', description: 'Google Workspace', priority: 10 },

  // ═══════════════════════════════════════════════════════════════
  // BANK CHARGES
  // ═══════════════════════════════════════════════════════════════
  { keyword: 'stripe fee', matchType: 'contains', categoryName: 'Bank & Finance Charges', description: 'Stripe processing fee', priority: 10 },
  { keyword: 'paypal fee', matchType: 'contains', categoryName: 'Bank & Finance Charges', description: 'PayPal fee', priority: 10 },
  { keyword: 'bank fee', matchType: 'contains', categoryName: 'Bank & Finance Charges', description: 'Bank fee', priority: 10 },
  { keyword: 'overdraft', matchType: 'contains', categoryName: 'Bank & Finance Charges', description: 'Overdraft charge', priority: 10 },

  // ═══════════════════════════════════════════════════════════════
  // TRANSFERS (neutral)
  // ═══════════════════════════════════════════════════════════════
  { keyword: 'transfer to', matchType: 'contains', categoryName: 'Transfers', description: 'Bank transfer', priority: 6 },
  { keyword: 'standing order', matchType: 'contains', categoryName: 'Transfers', description: 'Standing order', priority: 6 },
  { keyword: 'internal transfer', matchType: 'contains', categoryName: 'Transfers', description: 'Internal transfer', priority: 8 },

  // ═══════════════════════════════════════════════════════════════
  // HOUSING
  // ═══════════════════════════════════════════════════════════════
  { keyword: 'b&q', matchType: 'contains', categoryName: 'Housing', description: 'B&Q home improvement', priority: 10 },
  { keyword: 'ikea', matchType: 'contains', categoryName: 'Housing', description: 'IKEA furniture', priority: 10 },
  { keyword: 'screwfix', matchType: 'contains', categoryName: 'Housing', description: 'Screwfix trade supplies', priority: 10 },

  // ═══════════════════════════════════════════════════════════════
  // ENTERTAINMENT
  // ═══════════════════════════════════════════════════════════════
  { keyword: 'steam', matchType: 'contains', categoryName: 'Entertainment', description: 'Steam gaming', priority: 9 },
  { keyword: 'playstation', matchType: 'contains', categoryName: 'Entertainment', description: 'PlayStation Store', priority: 10 },
  { keyword: 'xbox', matchType: 'contains', categoryName: 'Entertainment', description: 'Xbox Store', priority: 10 },

  // ═══════════════════════════════════════════════════════════════
  // CHILDCARE
  // ═══════════════════════════════════════════════════════════════
  { keyword: 'nursery', matchType: 'contains', categoryName: 'Childcare', description: 'Nursery fees', priority: 9 },
  { keyword: 'childminder', matchType: 'contains', categoryName: 'Childcare', description: 'Childminder fees', priority: 10 },
];

async function main() {
  console.log('🔧 Seeding categorization rules...\n');

  // Load all categories for name→id mapping
  const categories = await prisma.category.findMany({ select: { id: true, name: true, type: true } });
  const catMap = new Map(categories.map(c => [c.name.toLowerCase(), c]));

  let created = 0;
  let skipped = 0;

  for (const rule of SYSTEM_RULES) {
    const cat = catMap.get(rule.categoryName.toLowerCase());
    if (!cat) {
      console.log(`  ⚠️  Category "${rule.categoryName}" not found — skipping "${rule.keyword}"`);
      skipped++;
      continue;
    }

    try {
      // Check if rule already exists (can't use upsert with nullable unique fields)
      const existing = await (prisma as any).categorizationRule.findFirst({
        where: { keyword: rule.keyword, matchType: rule.matchType, userId: null, entityId: null },
      });

      if (existing) {
        await (prisma as any).categorizationRule.update({
          where: { id: existing.id },
          data: {
            categoryId: cat.id,
            description: rule.description,
            priority: rule.priority ?? 0,
            transactionType: rule.transactionType ?? null,
            source: 'system',
            isActive: true,
          },
        });
        console.log(`  🔄 "${rule.keyword}" → ${rule.categoryName} (updated)`);
      } else {
        await (prisma as any).categorizationRule.create({
          data: {
            keyword: rule.keyword,
            matchType: rule.matchType,
            categoryId: cat.id,
            transactionType: rule.transactionType ?? null,
            description: rule.description,
            priority: rule.priority ?? 0,
            source: 'system',
            confidence: 1.0,
            autoApprove: true,
            isActive: true,
            patternField: 'description',
          },
        });
        console.log(`  ✅ "${rule.keyword}" → ${rule.categoryName}`);
      }
      created++;
    } catch (error: any) {
      console.error(`  ❌ "${rule.keyword}": ${error.message}`);
      skipped++;
    }
  }

  console.log(`\n✅ Seeding complete: ${created} created, ${skipped} skipped`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
