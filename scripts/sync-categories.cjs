const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const cats = [
  // HMRC SA103 Business Expenses
  { name: 'Office Costs', description: 'Stationery, printing, postage, office supplies (SA103 Box 17)', icon: 'Briefcase', color: '#6366f1', type: 'expense', hmrcMapping: 'office_costs', defaultDeductibilityPercent: 100 },
  { name: 'Travel', description: 'Train, bus, taxi, uber, flights for business (SA103 Box 20)', icon: 'MapPin', color: '#8b5cf6', type: 'expense', hmrcMapping: 'travel_costs', defaultDeductibilityPercent: 100 },
  { name: 'Vehicle Costs', description: 'Fuel, MOT, car insurance, parking for business (SA103 Box 18)', icon: 'Car', color: '#7c3aed', type: 'expense', hmrcMapping: 'travel_costs', defaultDeductibilityPercent: 50 },
  { name: 'Clothing', description: 'Uniforms, protective clothing, workwear (SA103 Box 19)', icon: 'Shirt', color: '#a78bfa', type: 'expense', hmrcMapping: 'clothing', defaultDeductibilityPercent: 100 },
  { name: 'Staff Costs', description: 'Wages, salaries, subcontractors (SA103 Box 21)', icon: 'Users', color: '#c084fc', type: 'expense', hmrcMapping: 'staff_costs', defaultDeductibilityPercent: 100 },
  { name: 'Goods for Resale', description: 'Stock, inventory, materials for resale (SA103 Box 22)', icon: 'Package', color: '#e879f9', type: 'expense', hmrcMapping: 'reselling_goods', defaultDeductibilityPercent: 100 },
  { name: 'Premises Costs', description: 'Rent, rates, utilities for business premises (SA103 Box 23)', icon: 'Building2', color: '#f472b6', type: 'expense', hmrcMapping: 'premises_costs', defaultDeductibilityPercent: 100 },
  { name: 'Marketing & Advertising', description: 'Ads, SEO, promotions, business cards (SA103 Box 24)', icon: 'Megaphone', color: '#fb7185', type: 'expense', hmrcMapping: 'advertising', defaultDeductibilityPercent: 100 },
  { name: 'Bank & Finance Charges', description: 'Bank fees, interest, finance charges (SA103 Box 25)', icon: 'CreditCard', color: '#64748b', type: 'expense', hmrcMapping: 'financial_charges', defaultDeductibilityPercent: 100 },
  { name: 'Professional Fees', description: 'Accountant, solicitor, consultant fees (SA103 Box 26)', icon: 'Scale', color: '#475569', type: 'expense', hmrcMapping: 'legal_professional', defaultDeductibilityPercent: 100 },
  { name: 'Software & IT', description: 'Software subscriptions, hosting, domains (SA103 Box 17)', icon: 'Monitor', color: '#0ea5e9', type: 'expense', hmrcMapping: 'office_costs', defaultDeductibilityPercent: 100 },
  { name: 'Other Business Expenses', description: 'Miscellaneous allowable business expenses (SA103 Box 27)', icon: 'FileText', color: '#94a3b8', type: 'expense', hmrcMapping: 'none', defaultDeductibilityPercent: 100 },

  // Household Expenses
  { name: 'Utilities', description: 'Gas, electricity, water', icon: 'Zap', color: '#f59e0b', type: 'expense', hmrcMapping: 'none', defaultDeductibilityPercent: 0 },
  { name: 'Telecoms', description: 'Phone, broadband, TV packages', icon: 'Phone', color: '#3b82f6', type: 'expense', hmrcMapping: 'none', defaultDeductibilityPercent: 0 },
  { name: 'Council Tax', description: 'Local authority council tax', icon: 'Building', color: '#8b5cf6', type: 'expense', hmrcMapping: 'none', defaultDeductibilityPercent: 0 },
  { name: 'Insurance', description: 'Home, car, life, health insurance', icon: 'Shield', color: '#10b981', type: 'expense', hmrcMapping: 'none', defaultDeductibilityPercent: 0 },
  { name: 'Subscriptions', description: 'Netflix, Spotify, memberships', icon: 'Tv', color: '#ec4899', type: 'expense', hmrcMapping: 'none', defaultDeductibilityPercent: 0 },
  { name: 'Groceries', description: 'Tesco, Sainsbury, Asda, Aldi, Lidl, food shopping', icon: 'ShoppingCart', color: '#14b8a6', type: 'expense', hmrcMapping: 'none', defaultDeductibilityPercent: 0 },
  { name: 'Dining & Takeaway', description: 'Restaurants, cafes, Deliveroo, Uber Eats', icon: 'UtensilsCrossed', color: '#f97316', type: 'expense', hmrcMapping: 'none', defaultDeductibilityPercent: 0 },
  { name: 'Shopping', description: 'Amazon, retail, clothing, general purchases', icon: 'ShoppingBag', color: '#e11d48', type: 'expense', hmrcMapping: 'none', defaultDeductibilityPercent: 0 },
  { name: 'Housing', description: 'Rent, mortgage, home improvement', icon: 'Home', color: '#f97316', type: 'expense', hmrcMapping: 'none', defaultDeductibilityPercent: 0 },
  { name: 'Healthcare', description: 'NHS prescriptions, dentist, optician, pharmacy', icon: 'Heart', color: '#ef4444', type: 'expense', hmrcMapping: 'none', defaultDeductibilityPercent: 0 },
  { name: 'Education', description: 'Courses, training, books, school fees', icon: 'GraduationCap', color: '#2563eb', type: 'expense', hmrcMapping: 'none', defaultDeductibilityPercent: 0 },
  { name: 'Entertainment', description: 'Cinema, concerts, gaming, leisure', icon: 'Music', color: '#a855f7', type: 'expense', hmrcMapping: 'none', defaultDeductibilityPercent: 0 },
  { name: 'Personal Care', description: 'Hair, beauty, salon, gym, fitness', icon: 'Sparkles', color: '#d946ef', type: 'expense', hmrcMapping: 'none', defaultDeductibilityPercent: 0 },
  { name: 'TV License', description: 'BBC TV License', icon: 'Tv2', color: '#0ea5e9', type: 'expense', hmrcMapping: 'none', defaultDeductibilityPercent: 0 },
  { name: 'Childcare', description: 'Nursery, childminder, after-school', icon: 'Baby', color: '#f472b6', type: 'expense', hmrcMapping: 'none', defaultDeductibilityPercent: 0 },
  { name: 'Transfers', description: 'Bank transfers, standing orders between own accounts', icon: 'ArrowLeftRight', color: '#9ca3af', type: 'expense', hmrcMapping: 'none', defaultDeductibilityPercent: 0 },
  { name: 'Other Expenses', description: 'Miscellaneous personal expenses', icon: 'MoreHorizontal', color: '#6b7280', type: 'expense', hmrcMapping: 'none', defaultDeductibilityPercent: 0 },

  // Income
  { name: 'Salary', description: 'Employment salary, wages, PAYE income', icon: 'Briefcase', color: '#22c55e', type: 'income', hmrcMapping: 'none', defaultDeductibilityPercent: 0 },
  { name: 'Client Payments', description: 'Freelance/self-employment income from clients', icon: 'Banknote', color: '#16a34a', type: 'income', hmrcMapping: 'none', defaultDeductibilityPercent: 0 },
  { name: 'Business Income', description: 'Revenue, sales, trade income', icon: 'TrendingUp', color: '#15803d', type: 'income', hmrcMapping: 'none', defaultDeductibilityPercent: 0 },
  { name: 'Dividends', description: 'Investment dividends', icon: 'PieChart', color: '#059669', type: 'income', hmrcMapping: 'none', defaultDeductibilityPercent: 0 },
  { name: 'Interest', description: 'Bank interest, savings interest', icon: 'PiggyBank', color: '#047857', type: 'income', hmrcMapping: 'none', defaultDeductibilityPercent: 0 },
  { name: 'Rental Income', description: 'Property rental income', icon: 'Building2', color: '#166534', type: 'income', hmrcMapping: 'none', defaultDeductibilityPercent: 0 },
  { name: 'Refunds', description: 'Tax refunds, purchase returns, cashback', icon: 'RotateCcw', color: '#14532d', type: 'income', hmrcMapping: 'none', defaultDeductibilityPercent: 0 },
  { name: 'Benefits', description: 'Universal Credit, tax credits, government payments', icon: 'Landmark', color: '#84cc16', type: 'income', hmrcMapping: 'none', defaultDeductibilityPercent: 0 },
  { name: 'Other Income', description: 'Miscellaneous income', icon: 'Plus', color: '#65a30d', type: 'income', hmrcMapping: 'none', defaultDeductibilityPercent: 0 },
];

async function run() {
  let created = 0, updated = 0;
  const existing = await prisma.category.findMany({ select: { name: true } });
  const names = new Set(existing.map(c => c.name.toLowerCase()));

  for (const c of cats) {
    if (names.has(c.name.toLowerCase())) {
      await prisma.category.update({
        where: { name: c.name },
        data: {
          description: c.description,
          hmrcMapping: c.hmrcMapping,
          defaultDeductibilityPercent: c.defaultDeductibilityPercent,
          icon: c.icon,
          color: c.color,
        },
      });
      updated++;
    } else {
      await prisma.category.create({
        data: { ...c, isDefault: true },
      });
      created++;
    }
  }

  // Also update Bank Charges if it exists with old name
  try {
    await prisma.category.update({
      where: { name: 'Bank Charges' },
      data: { hmrcMapping: 'financial_charges', defaultDeductibilityPercent: 100, description: 'Bank fees, overdraft charges (SA103 Box 25)' },
    });
  } catch (e) {}

  // Update Transport if it exists
  try {
    await prisma.category.update({
      where: { name: 'Transport' },
      data: { hmrcMapping: 'travel_costs', defaultDeductibilityPercent: 50, description: 'Car, fuel, public transport (mixed personal/business use)' },
    });
  } catch (e) {}

  const total = await prisma.category.count();
  console.log(JSON.stringify({ created, updated, total }));
  await prisma.$disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });
