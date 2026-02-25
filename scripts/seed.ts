import { PrismaClient, ProviderType, AccountType, BillFrequency, ActionType, ActionStatus, ActionPriority, ExpenseType, CategoryType } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_CATEGORIES = [
  // Expense categories
  { name: 'Utilities', description: 'Gas, electricity, water', icon: 'Zap', color: '#f59e0b', type: CategoryType.expense },
  { name: 'Telecoms', description: 'Phone, broadband, TV', icon: 'Phone', color: '#3b82f6', type: CategoryType.expense },
  { name: 'Council Tax', description: 'Local authority council tax', icon: 'Building', color: '#8b5cf6', type: CategoryType.expense },
  { name: 'Insurance', description: 'Home, car, life insurance', icon: 'Shield', color: '#10b981', type: CategoryType.expense },
  { name: 'Subscriptions', description: 'Streaming, magazines, memberships', icon: 'Tv', color: '#ec4899', type: CategoryType.expense },
  { name: 'Transport', description: 'Car, fuel, public transport', icon: 'Car', color: '#6366f1', type: CategoryType.expense },
  { name: 'Groceries', description: 'Food and household items', icon: 'ShoppingCart', color: '#14b8a6', type: CategoryType.expense },
  { name: 'Housing', description: 'Rent, mortgage payments', icon: 'Home', color: '#f97316', type: CategoryType.expense },
  { name: 'Healthcare', description: 'NHS, dentist, prescriptions', icon: 'Heart', color: '#ef4444', type: CategoryType.expense },
  { name: 'Entertainment', description: 'Leisure activities', icon: 'Music', color: '#a855f7', type: CategoryType.expense },
  { name: 'TV License', description: 'BBC TV License', icon: 'Monitor', color: '#0ea5e9', type: CategoryType.expense },
  { name: 'Bank Charges', description: 'Bank fees and charges', icon: 'CreditCard', color: '#64748b', type: CategoryType.expense },
  { name: 'Other Expenses', description: 'Miscellaneous expenses', icon: 'MoreHorizontal', color: '#6b7280', type: CategoryType.expense },
  // Income categories
  { name: 'Salary', description: 'Employment income', icon: 'Briefcase', color: '#22c55e', type: CategoryType.income },
  { name: 'Dividends', description: 'Investment dividends', icon: 'TrendingUp', color: '#16a34a', type: CategoryType.income },
  { name: 'Interest', description: 'Bank interest, savings', icon: 'PiggyBank', color: '#15803d', type: CategoryType.income },
  { name: 'Rental Income', description: 'Property rental income', icon: 'Building2', color: '#166534', type: CategoryType.income },
  { name: 'Refunds', description: 'Tax refunds, returns', icon: 'RotateCcw', color: '#14532d', type: CategoryType.income },
  { name: 'Benefits', description: 'Government benefits', icon: 'Landmark', color: '#84cc16', type: CategoryType.income },
  { name: 'Other Income', description: 'Miscellaneous income', icon: 'Plus', color: '#65a30d', type: CategoryType.income },
];

const providers = [
  {
    name: 'Barclays',
    type: ProviderType.bank,
    logoUrl: 'https://static.vecteezy.com/system/resources/previews/069/864/336/non_2x/barclays-bank-logo-glossy-rounded-square-icon-free-png.png',
    contactInfo: '0345 734 5345',
  },
  {
    name: 'British Gas',
    type: ProviderType.utility,
    logoUrl: 'https://cdn.freebiesupply.com/logos/large/2x/british-gas-logo-png-transparent.png',
    contactInfo: '0333 202 9802',
  },
  {
    name: 'Netflix',
    type: ProviderType.subscription,
    logoUrl: 'https://www.citypng.com/public/uploads/preview/512-netflix-n-sign-logo-701751694792620xxe0ucbues.png',
    contactInfo: 'help.netflix.com',
  },
  {
    name: 'Aviva',
    type: ProviderType.insurance,
    logoUrl: 'https://cdn.freebiesupply.com/logos/large/2x/aviva-01-logo-png-transparent.png',
    contactInfo: '0800 051 3606',
  },
  {
    name: 'Tesco Mobile',
    type: ProviderType.utility,
    logoUrl: 'https://static.vecteezy.com/system/resources/previews/071/673/751/non_2x/glossy-tesco-mobile-logo-rounded-square-app-icon-free-png.png',
    contactInfo: '0345 301 4455',
  },
];

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data
  await prisma.event.deleteMany();
  await prisma.invoice.deleteMany();
  // Transaction model removed — using BankTransaction instead
  await prisma.action.deleteMany();
  await prisma.bill.deleteMany();
  await prisma.account.deleteMany();
  await prisma.provider.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.category.deleteMany();

  console.log('✅ Cleared existing data');

  // Create categories
  const createdCategories: { [key: string]: { id: string } } = {};
  for (const cat of DEFAULT_CATEGORIES) {
    const created = await prisma.category.create({
      data: {
        name: cat.name,
        description: cat.description,
        icon: cat.icon,
        color: cat.color,
        type: cat.type,
        isDefault: true,
      },
    });
    createdCategories[cat.name] = created;
    console.log(`✅ Created category: ${cat.name} (${cat.type})`);
  }

  // Create providers
  const createdProviders: { [key: string]: { id: string } } = {};
  for (const provider of providers) {
    const created = await prisma.provider.create({ data: provider });
    createdProviders[provider.name] = created;
    console.log(`✅ Created provider: ${provider.name}`);

    await prisma.event.create({
      data: {
        eventType: 'provider.created',
        entityType: 'provider',
        entityId: created.id,
        payload: { name: provider.name, type: provider.type },
      },
    });
  }

  // Create accounts for Barclays
  const barclaysCurrentAccount = await prisma.account.create({
    data: {
      providerId: createdProviders['Barclays'].id,
      accountName: 'Barclays Current Account',
      accountNumber: '****4532',
      accountType: AccountType.current,
      balance: 2450.75,
      currency: 'GBP',
      isActive: true,
    },
  });
  console.log(`✅ Created account: Barclays Current Account`);

  await prisma.event.create({
    data: {
      eventType: 'account.created',
      entityType: 'account',
      entityId: barclaysCurrentAccount.id,
      payload: { name: 'Barclays Current Account', type: 'current' },
    },
  });

  const barclaysCreditCard = await prisma.account.create({
    data: {
      providerId: createdProviders['Barclays'].id,
      accountName: 'Barclays Credit Card',
      accountNumber: '****7891',
      accountType: AccountType.credit_card,
      balance: -342.50,
      currency: 'GBP',
      isActive: true,
    },
  });
  console.log(`✅ Created account: Barclays Credit Card`);

  await prisma.event.create({
    data: {
      eventType: 'account.created',
      entityType: 'account',
      entityId: barclaysCreditCard.id,
      payload: { name: 'Barclays Credit Card', type: 'credit_card' },
    },
  });

  // Create bills with categories
  const bills = [
    {
      accountId: barclaysCurrentAccount.id,
      billName: 'British Gas Energy',
      amount: 120.00,
      currency: 'GBP',
      frequency: BillFrequency.monthly,
      dueDay: 15,
      categoryId: createdCategories['Utilities'].id,
      expenseType: ExpenseType.recurring,
      isActive: true,
    },
    {
      accountId: barclaysCurrentAccount.id,
      billName: 'Netflix Premium',
      amount: 15.99,
      currency: 'GBP',
      frequency: BillFrequency.monthly,
      dueDay: 1,
      categoryId: createdCategories['Subscriptions'].id,
      expenseType: ExpenseType.fixed,
      isActive: true,
    },
    {
      accountId: barclaysCurrentAccount.id,
      billName: 'Aviva Home Insurance',
      amount: 45.00,
      currency: 'GBP',
      frequency: BillFrequency.monthly,
      dueDay: 20,
      categoryId: createdCategories['Insurance'].id,
      expenseType: ExpenseType.fixed,
      isActive: true,
    },
    {
      accountId: barclaysCreditCard.id,
      billName: 'Tesco Mobile',
      amount: 25.00,
      currency: 'GBP',
      frequency: BillFrequency.monthly,
      dueDay: 28,
      categoryId: createdCategories['Telecoms'].id,
      expenseType: ExpenseType.recurring,
      isActive: true,
    },
  ];

  for (const bill of bills) {
    const created = await prisma.bill.create({ data: bill });
    console.log(`✅ Created bill: ${bill.billName}`);

    await prisma.event.create({
      data: {
        eventType: 'bill.created',
        entityType: 'bill',
        entityId: created.id,
        payload: { name: bill.billName, amount: bill.amount, frequency: bill.frequency },
      },
    });
  }

  // Create action
  const action = await prisma.action.create({
    data: {
      actionType: ActionType.bill_payment,
      title: 'Review British Gas Bill',
      description: 'Energy bill seems higher than usual. Compare with previous months and consider switching provider.',
      status: ActionStatus.pending,
      priority: ActionPriority.high,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdBy: 'system',
    },
  });
  console.log(`✅ Created action: ${action.title}`);

  await prisma.event.create({
    data: {
      eventType: 'action.created',
      entityType: 'action',
      entityId: action.id,
      payload: { title: action.title, priority: action.priority },
    },
  });

  console.log('\n🎉 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
