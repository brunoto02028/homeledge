import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Companies House / Corporation Tax categories for Limited Companies & LLPs
const CH_CATEGORIES = [
  // === INCOME ===
  { name: 'Turnover / Revenue', type: 'income', taxRegime: 'companies_house', chMapping: 'turnover', description: 'Sales revenue from trading activities', defaultDeductibilityPercent: 0 },
  { name: 'Other Operating Income', type: 'income', taxRegime: 'companies_house', chMapping: 'other_operating_income', description: 'Non-trading income (grants, royalties)', defaultDeductibilityPercent: 0 },
  { name: 'Interest Receivable', type: 'income', taxRegime: 'companies_house', chMapping: 'interest_receivable', description: 'Bank interest and investment income', defaultDeductibilityPercent: 0 },
  { name: 'Director Loan Repayment In', type: 'income', taxRegime: 'companies_house', chMapping: 'director_loan_in', description: 'Director repaying company loan', defaultDeductibilityPercent: 0 },
  { name: 'Shareholder Investment', type: 'income', taxRegime: 'companies_house', chMapping: 'share_capital', description: 'Capital invested by shareholders', defaultDeductibilityPercent: 0 },

  // === EXPENSES (P&L / CT600) ===
  { name: 'Cost of Sales', type: 'expense', taxRegime: 'companies_house', chMapping: 'cost_of_sales', description: 'Direct costs of goods/services sold', defaultDeductibilityPercent: 100 },
  { name: 'Directors Remuneration', type: 'expense', taxRegime: 'companies_house', chMapping: 'directors_remuneration', description: 'Salaries and fees paid to directors', defaultDeductibilityPercent: 100 },
  { name: 'Employee Costs', type: 'expense', taxRegime: 'companies_house', chMapping: 'employee_costs', description: 'Staff wages, NI contributions, pensions', defaultDeductibilityPercent: 100 },
  { name: 'Rent & Rates', type: 'expense', taxRegime: 'companies_house', chMapping: 'rent_rates', description: 'Office/premises rent and business rates', defaultDeductibilityPercent: 100 },
  { name: 'Repairs & Maintenance', type: 'expense', taxRegime: 'companies_house', chMapping: 'repairs_maintenance', description: 'Building and equipment repairs', defaultDeductibilityPercent: 100 },
  { name: 'Motor Expenses', type: 'expense', taxRegime: 'companies_house', chMapping: 'motor_expenses', description: 'Company vehicle fuel, insurance, maintenance', defaultDeductibilityPercent: 100 },
  { name: 'Travel & Subsistence', type: 'expense', taxRegime: 'companies_house', chMapping: 'travel_subsistence', description: 'Business travel, hotels, meals while travelling', defaultDeductibilityPercent: 100 },
  { name: 'Telephone & Internet', type: 'expense', taxRegime: 'companies_house', chMapping: 'telephone_internet', description: 'Business phone lines and broadband', defaultDeductibilityPercent: 100 },
  { name: 'Postage & Stationery', type: 'expense', taxRegime: 'companies_house', chMapping: 'postage_stationery', description: 'Office supplies, printing, postage', defaultDeductibilityPercent: 100 },
  { name: 'Advertising & Marketing', type: 'expense', taxRegime: 'companies_house', chMapping: 'advertising_marketing', description: 'Ads, website, promotional materials', defaultDeductibilityPercent: 100 },
  { name: 'Professional Fees (Company)', type: 'expense', taxRegime: 'companies_house', chMapping: 'professional_fees', description: 'Accountant, solicitor, consultant fees', defaultDeductibilityPercent: 100 },
  { name: 'Bank Charges & Interest Payable', type: 'expense', taxRegime: 'companies_house', chMapping: 'bank_charges_interest', description: 'Bank fees, loan interest, overdraft charges', defaultDeductibilityPercent: 100 },
  { name: 'Insurance (Company)', type: 'expense', taxRegime: 'companies_house', chMapping: 'insurance', description: 'Business insurance (PI, PL, employers liability)', defaultDeductibilityPercent: 100 },
  { name: 'Software & Subscriptions (Company)', type: 'expense', taxRegime: 'companies_house', chMapping: 'software_subscriptions', description: 'Business software, SaaS, cloud services', defaultDeductibilityPercent: 100 },
  { name: 'Depreciation', type: 'expense', taxRegime: 'companies_house', chMapping: 'depreciation', description: 'Fixed asset depreciation (add back for tax)', defaultDeductibilityPercent: 0 },
  { name: 'Entertainment (Non-Allowable)', type: 'expense', taxRegime: 'companies_house', chMapping: 'entertainment', description: 'Client entertainment (not tax deductible)', defaultDeductibilityPercent: 0 },
  { name: 'Dividend Payments', type: 'expense', taxRegime: 'companies_house', chMapping: 'dividends', description: 'Dividends paid to shareholders', defaultDeductibilityPercent: 0 },
  { name: 'Corporation Tax Payment', type: 'expense', taxRegime: 'companies_house', chMapping: 'corporation_tax', description: 'CT payment to HMRC', defaultDeductibilityPercent: 0 },
  { name: 'VAT Payment', type: 'expense', taxRegime: 'companies_house', chMapping: 'vat_payment', description: 'VAT payments to HMRC', defaultDeductibilityPercent: 0 },
  { name: 'PAYE/NI Payment', type: 'expense', taxRegime: 'companies_house', chMapping: 'paye_ni', description: 'PAYE and NI payments to HMRC', defaultDeductibilityPercent: 100 },
  { name: 'Pension Contributions (Company)', type: 'expense', taxRegime: 'companies_house', chMapping: 'pension_contributions', description: 'Employer pension contributions', defaultDeductibilityPercent: 100 },
  { name: 'Director Loan Out', type: 'expense', taxRegime: 'companies_house', chMapping: 'director_loan_out', description: 'Company lending to director (S455 tax)', defaultDeductibilityPercent: 0 },
  { name: 'Fixed Asset Purchase', type: 'expense', taxRegime: 'companies_house', chMapping: 'capital_expenditure', description: 'Equipment, computers, machinery purchases', defaultDeductibilityPercent: 100 },
  { name: 'Training & Development', type: 'expense', taxRegime: 'companies_house', chMapping: 'training', description: 'Staff and director training courses', defaultDeductibilityPercent: 100 },
  { name: 'Sundry Expenses', type: 'expense', taxRegime: 'companies_house', chMapping: 'sundry', description: 'Miscellaneous small business expenses', defaultDeductibilityPercent: 100 },
];

// Update existing categories to mark them as HMRC (individual/sole trader)
const HMRC_CATEGORY_NAMES = [
  'Office Costs', 'Travel', 'Vehicle Costs', 'Staff Costs', 'Premises Costs',
  'Marketing & Advertising', 'Bank & Finance Charges', 'Professional Fees',
  'Software & IT',
];

// Universal categories (apply to both companies and individuals)
const UNIVERSAL_CATEGORY_NAMES = [
  'Salary', 'Client Payments', 'Business Income', 'Refunds', 'Interest', 'Dividends', 'Benefits',
  'Utilities', 'Telecoms', 'Council Tax', 'Insurance', 'Subscriptions',
  'Groceries', 'Dining & Takeaway', 'Shopping', 'Housing', 'Healthcare',
  'Education', 'Entertainment', 'Personal Care', 'Childcare', 'Transfers',
];

async function main() {
  console.log('🏢 Seeding Companies House categories...');

  for (const cat of CH_CATEGORIES) {
    try {
      await (prisma.category as any).upsert({
        where: { name: cat.name },
        update: {
          taxRegime: cat.taxRegime,
          chMapping: cat.chMapping,
          description: cat.description,
          defaultDeductibilityPercent: cat.defaultDeductibilityPercent,
        },
        create: {
          name: cat.name,
          type: cat.type,
          taxRegime: cat.taxRegime,
          chMapping: cat.chMapping,
          description: cat.description,
          defaultDeductibilityPercent: cat.defaultDeductibilityPercent,
        },
      });
      console.log(`  ✅ ${cat.name}`);
    } catch (error: any) {
      console.error(`  ❌ ${cat.name}: ${error.message}`);
    }
  }

  // Mark existing HMRC categories
  console.log('\n📋 Marking HMRC Self Assessment categories...');
  for (const name of HMRC_CATEGORY_NAMES) {
    try {
      await (prisma.category as any).updateMany({
        where: { name },
        data: { taxRegime: 'hmrc' },
      });
      console.log(`  ✅ ${name} → hmrc`);
    } catch { console.log(`  ⚠️ ${name} not found (skip)`); }
  }

  // Mark universal categories
  console.log('\n🌍 Marking universal categories...');
  for (const name of UNIVERSAL_CATEGORY_NAMES) {
    try {
      await (prisma.category as any).updateMany({
        where: { name },
        data: { taxRegime: 'universal' },
      });
      console.log(`  ✅ ${name} → universal`);
    } catch { console.log(`  ⚠️ ${name} not found (skip)`); }
  }

  console.log('\n✅ Category seeding complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
