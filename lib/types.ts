export type ProviderType = 'bank' | 'utility' | 'subscription' | 'insurance' | 'other';
export type AccountType = 'current' | 'savings' | 'credit_card' | 'loan' | 'other';
export type BillFrequency = 'one_time' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type ActionType = 'bill_payment' | 'account_review' | 'budget_adjustment' | 'other';
export type ActionStatus = 'pending' | 'approved' | 'rejected' | 'completed';
export type ActionPriority = 'low' | 'medium' | 'high';
export type TransactionType = 'debit' | 'credit';
export type ExpenseType = 'fixed' | 'recurring' | 'variable' | 'one_off';
export type InvoiceStatus = 'pending' | 'processed' | 'error' | 'reviewed';
export type CategoryType = 'expense' | 'income';
export type DocumentType = 'bill' | 'reminder' | 'fine' | 'information' | 'contract' | 'tax_return' | 'check' | 'other';
export type DocumentStatus = 'pending' | 'processed' | 'filed' | 'action_required';

export type HMRCMapping = 
  | 'office_costs' 
  | 'travel_costs' 
  | 'clothing' 
  | 'staff_costs' 
  | 'reselling_goods' 
  | 'premises_costs' 
  | 'advertising' 
  | 'financial_charges' 
  | 'legal_professional' 
  | 'none';

export interface Category {
  id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  type: CategoryType;
  hmrcMapping?: HMRCMapping;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  amount: number;
  period: string;
  alertAt: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category?: Category;
}

export interface BankStatementTransaction {
  id?: string;
  date: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  balance?: number;
  suggestedCategory?: string;
  categoryId?: string;
  categoryType?: CategoryType;
}

export interface Invoice {
  id: string;
  fileName: string;
  cloudStoragePath: string;
  isPublic: boolean;
  status: InvoiceStatus;
  providerName?: string | null;
  invoiceNumber?: string | null;
  invoiceDate?: string | null;
  dueDate?: string | null;
  amount?: number | null;
  currency: string;
  categoryId?: string | null;
  expenseType?: ExpenseType | null;
  description?: string | null;
  extractedData?: Record<string, unknown> | null;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
  processedAt?: string | null;
  category?: Category | null;
}

export interface Provider {
  id: string;
  name: string;
  type: ProviderType;
  logoUrl?: string | null;
  contactInfo?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Account {
  id: string;
  providerId: string;
  accountName: string;
  accountNumber?: string | null;
  accountType: AccountType;
  balance: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  provider?: Provider;
}

export interface Bill {
  id: string;
  accountId: string;
  billName: string;
  iconUrl?: string | null;
  amount: number;
  currency: string;
  frequency: BillFrequency;
  dueDay: number;
  categoryId?: string | null;
  expenseType: ExpenseType;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  account?: Account & { provider?: Provider };
  category?: Category | null;
  monthlyEquivalent?: number;
}

export interface Transaction {
  id: string;
  accountId: string;
  billId?: string | null;
  amount: number;
  currency: string;
  transactionDate: string;
  description?: string | null;
  type: TransactionType;
  createdAt: string;
}

export interface Action {
  id: string;
  actionType: ActionType;
  title: string;
  description?: string | null;
  status: ActionStatus;
  priority: ActionPriority;
  dueDate?: string | null;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  isOverdue?: boolean;
}

export interface Event {
  id: string;
  eventType: string;
  entityType: string;
  entityId: string;
  occurredAt: string;
  payload?: Record<string, unknown> | null;
  createdAt: string;
}

export interface MonthlyCommitments {
  totalMonthly: number;
  currency: string;
  byCategory: { category: string; amount: number; color?: string }[];
  upcomingBills: Bill[];
  recentActions: Action[];
  stats: {
    totalAccounts: number;
    activeBills: number;
    pendingActions: number;
    totalInvoices: number;
  };
}

export interface BillFilters {
  categoryId?: string;
  frequency?: BillFrequency;
  accountId?: string;
  isActive?: boolean;
  expenseType?: ExpenseType;
}

export interface ActionFilters {
  status?: ActionStatus;
  priority?: ActionPriority;
  dateFrom?: string;
  dateTo?: string;
}

export interface InvoiceFilters {
  status?: InvoiceStatus;
  categoryId?: string;
  dateFrom?: string;
  dateTo?: string;
}

// UK categories aligned with HMRC SA103 Self Assessment + common household expenses
// hmrcMapping matches the HMRCMapping enum in prisma schema
// deductibilityPercent: 0 = personal, 100 = fully deductible, 50 = mixed use
export const DEFAULT_CATEGORIES = [
  // === HMRC SA103 BUSINESS EXPENSE CATEGORIES (Box 17-27) ===
  { name: 'Office Costs', description: 'Stationery, printing, postage, office supplies (SA103 Box 17)', icon: 'Briefcase', color: '#6366f1', type: 'expense' as CategoryType, hmrcMapping: 'office_costs', deductibilityPercent: 100 },
  { name: 'Travel', description: 'Train, bus, taxi, uber, flights for business (SA103 Box 20)', icon: 'MapPin', color: '#8b5cf6', type: 'expense' as CategoryType, hmrcMapping: 'travel_costs', deductibilityPercent: 100 },
  { name: 'Vehicle Costs', description: 'Fuel, MOT, car insurance, parking for business (SA103 Box 18)', icon: 'Car', color: '#7c3aed', type: 'expense' as CategoryType, hmrcMapping: 'travel_costs', deductibilityPercent: 50 },
  { name: 'Clothing', description: 'Uniforms, protective clothing, workwear (SA103 Box 19)', icon: 'Shirt', color: '#a78bfa', type: 'expense' as CategoryType, hmrcMapping: 'clothing', deductibilityPercent: 100 },
  { name: 'Staff Costs', description: 'Wages, salaries, subcontractors (SA103 Box 21)', icon: 'Users', color: '#c084fc', type: 'expense' as CategoryType, hmrcMapping: 'staff_costs', deductibilityPercent: 100 },
  { name: 'Goods for Resale', description: 'Stock, inventory, materials for resale (SA103 Box 22)', icon: 'Package', color: '#e879f9', type: 'expense' as CategoryType, hmrcMapping: 'reselling_goods', deductibilityPercent: 100 },
  { name: 'Premises Costs', description: 'Rent, rates, utilities for business premises (SA103 Box 23)', icon: 'Building2', color: '#f472b6', type: 'expense' as CategoryType, hmrcMapping: 'premises_costs', deductibilityPercent: 100 },
  { name: 'Marketing & Advertising', description: 'Ads, SEO, promotions, business cards (SA103 Box 24)', icon: 'Megaphone', color: '#fb7185', type: 'expense' as CategoryType, hmrcMapping: 'advertising', deductibilityPercent: 100 },
  { name: 'Bank & Finance Charges', description: 'Bank fees, interest, finance charges (SA103 Box 25)', icon: 'CreditCard', color: '#64748b', type: 'expense' as CategoryType, hmrcMapping: 'financial_charges', deductibilityPercent: 100 },
  { name: 'Professional Fees', description: 'Accountant, solicitor, consultant fees (SA103 Box 26)', icon: 'Scale', color: '#475569', type: 'expense' as CategoryType, hmrcMapping: 'legal_professional', deductibilityPercent: 100 },
  { name: 'Software & IT', description: 'Software subscriptions, hosting, domains (SA103 Box 17)', icon: 'Monitor', color: '#0ea5e9', type: 'expense' as CategoryType, hmrcMapping: 'office_costs', deductibilityPercent: 100 },
  { name: 'Other Business Expenses', description: 'Miscellaneous allowable business expenses (SA103 Box 27)', icon: 'FileText', color: '#94a3b8', type: 'expense' as CategoryType, hmrcMapping: 'none', deductibilityPercent: 100 },

  // === HOUSEHOLD EXPENSE CATEGORIES (non-deductible personal) ===
  { name: 'Utilities', description: 'Gas, electricity, water', icon: 'Zap', color: '#f59e0b', type: 'expense' as CategoryType, hmrcMapping: 'none', deductibilityPercent: 0 },
  { name: 'Telecoms', description: 'Phone, broadband, TV packages', icon: 'Phone', color: '#3b82f6', type: 'expense' as CategoryType, hmrcMapping: 'none', deductibilityPercent: 0 },
  { name: 'Council Tax', description: 'Local authority council tax', icon: 'Building', color: '#8b5cf6', type: 'expense' as CategoryType, hmrcMapping: 'none', deductibilityPercent: 0 },
  { name: 'Insurance', description: 'Home, car, life, health insurance', icon: 'Shield', color: '#10b981', type: 'expense' as CategoryType, hmrcMapping: 'none', deductibilityPercent: 0 },
  { name: 'Subscriptions', description: 'Netflix, Spotify, memberships', icon: 'Tv', color: '#ec4899', type: 'expense' as CategoryType, hmrcMapping: 'none', deductibilityPercent: 0 },
  { name: 'Groceries', description: 'Tesco, Sainsbury, Asda, Aldi, Lidl, food shopping', icon: 'ShoppingCart', color: '#14b8a6', type: 'expense' as CategoryType, hmrcMapping: 'none', deductibilityPercent: 0 },
  { name: 'Dining & Takeaway', description: 'Restaurants, cafes, Deliveroo, Uber Eats', icon: 'UtensilsCrossed', color: '#f97316', type: 'expense' as CategoryType, hmrcMapping: 'none', deductibilityPercent: 0 },
  { name: 'Shopping', description: 'Amazon, retail, clothing, general purchases', icon: 'ShoppingBag', color: '#e11d48', type: 'expense' as CategoryType, hmrcMapping: 'none', deductibilityPercent: 0 },
  { name: 'Housing', description: 'Rent, mortgage, home improvement', icon: 'Home', color: '#f97316', type: 'expense' as CategoryType, hmrcMapping: 'none', deductibilityPercent: 0 },
  { name: 'Healthcare', description: 'NHS prescriptions, dentist, optician, pharmacy', icon: 'Heart', color: '#ef4444', type: 'expense' as CategoryType, hmrcMapping: 'none', deductibilityPercent: 0 },
  { name: 'Education', description: 'Courses, training, books, school fees', icon: 'GraduationCap', color: '#2563eb', type: 'expense' as CategoryType, hmrcMapping: 'none', deductibilityPercent: 0 },
  { name: 'Entertainment', description: 'Cinema, concerts, gaming, leisure', icon: 'Music', color: '#a855f7', type: 'expense' as CategoryType, hmrcMapping: 'none', deductibilityPercent: 0 },
  { name: 'Personal Care', description: 'Hair, beauty, salon, gym, fitness', icon: 'Sparkles', color: '#d946ef', type: 'expense' as CategoryType, hmrcMapping: 'none', deductibilityPercent: 0 },
  { name: 'TV License', description: 'BBC TV License', icon: 'Tv2', color: '#0ea5e9', type: 'expense' as CategoryType, hmrcMapping: 'none', deductibilityPercent: 0 },
  { name: 'Childcare', description: 'Nursery, childminder, after-school', icon: 'Baby', color: '#f472b6', type: 'expense' as CategoryType, hmrcMapping: 'none', deductibilityPercent: 0 },
  { name: 'Transfers', description: 'Bank transfers, standing orders between own accounts', icon: 'ArrowLeftRight', color: '#9ca3af', type: 'expense' as CategoryType, hmrcMapping: 'none', deductibilityPercent: 0 },
  { name: 'Other Expenses', description: 'Miscellaneous personal expenses', icon: 'MoreHorizontal', color: '#6b7280', type: 'expense' as CategoryType, hmrcMapping: 'none', deductibilityPercent: 0 },

  // === INCOME CATEGORIES ===
  { name: 'Salary', description: 'Employment salary, wages, PAYE income', icon: 'Briefcase', color: '#22c55e', type: 'income' as CategoryType, hmrcMapping: 'none', deductibilityPercent: 0 },
  { name: 'Client Payments', description: 'Freelance/self-employment income from clients', icon: 'Banknote', color: '#16a34a', type: 'income' as CategoryType, hmrcMapping: 'none', deductibilityPercent: 0 },
  { name: 'Business Income', description: 'Revenue, sales, trade income', icon: 'TrendingUp', color: '#15803d', type: 'income' as CategoryType, hmrcMapping: 'none', deductibilityPercent: 0 },
  { name: 'Dividends', description: 'Investment dividends', icon: 'PieChart', color: '#059669', type: 'income' as CategoryType, hmrcMapping: 'none', deductibilityPercent: 0 },
  { name: 'Interest', description: 'Bank interest, savings interest', icon: 'PiggyBank', color: '#047857', type: 'income' as CategoryType, hmrcMapping: 'none', deductibilityPercent: 0 },
  { name: 'Rental Income', description: 'Property rental income', icon: 'Building2', color: '#166534', type: 'income' as CategoryType, hmrcMapping: 'none', deductibilityPercent: 0 },
  { name: 'Refunds', description: 'Tax refunds, purchase returns, cashback', icon: 'RotateCcw', color: '#14532d', type: 'income' as CategoryType, hmrcMapping: 'none', deductibilityPercent: 0 },
  { name: 'Benefits', description: 'Universal Credit, tax credits, government payments', icon: 'Landmark', color: '#84cc16', type: 'income' as CategoryType, hmrcMapping: 'none', deductibilityPercent: 0 },
  { name: 'Other Income', description: 'Miscellaneous income', icon: 'Plus', color: '#65a30d', type: 'income' as CategoryType, hmrcMapping: 'none', deductibilityPercent: 0 },
];

export const CATEGORY_TYPE_LABELS: Record<CategoryType, string> = {
  expense: 'Expense',
  income: 'Income',
};

export const EXPENSE_TYPE_LABELS: Record<ExpenseType, string> = {
  fixed: 'Fixed',
  recurring: 'Recurring',
  variable: 'Variable',
  one_off: 'One-off',
};

export const EXPENSE_TYPE_DESCRIPTIONS: Record<ExpenseType, string> = {
  fixed: 'Same amount every period (e.g., rent, mortgage)',
  recurring: 'Regular but amount may vary (e.g., utilities)',
  variable: 'Irregular timing and amount (e.g., repairs)',
  one_off: 'Single payment (e.g., appliance purchase)',
};