'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { Category, Budget } from '@/lib/types';
import { useTranslation } from '@/lib/i18n';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Download, FileText, FileSpreadsheet, PieChart, TrendingUp, AlertTriangle, Plus, Loader2, 
  Trash2, FileDown, Info, User, Building, Calculator, Receipt, Landmark, ClipboardCheck, 
  Settings, Save, CheckCircle2, AlertCircle, Calendar, ArrowRight, Briefcase, FileArchive,
  ChevronRight, HelpCircle, TrendingDown, Wallet, Edit2, Check, X, Filter, Eye, Percent,
  BarChart3, Upload, Send
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Slider } from '@/components/ui/slider';
import { useEntityContext } from '@/components/entity-context';

// HMRC Box Mapping for Self Assessment SA103 (2024/25 & 2025/26)
const HMRC_BOX_MAPPING: Record<string, { box: string; label: string; categories: string[] }> = {
  'turnover': { box: 'Box 15', label: 'Turnover / Business Income', categories: ['Sales', 'Revenue', 'Turnover', 'Freelance Income', 'Consulting Income', 'Service Income', 'Contract Income'] },
  'other_income': { box: 'Box 16', label: 'Other Business Income', categories: ['Other Income', 'Interest Received', 'Grants', 'Cashback', 'Refunds', 'Commission'] },
  'office_costs': { box: 'Box 17', label: 'Office, Property & Equipment', categories: ['Office Costs', 'Stationery', 'Software', 'Office Supplies', 'Computer Equipment', 'Printer', 'Phone', 'Internet', 'Broadband', 'Domain', 'Hosting', 'Cloud', 'SaaS'] },
  'vehicle': { box: 'Box 18', label: 'Car, Van & Travel Expenses', categories: ['Vehicle', 'Car', 'Van', 'Petrol', 'Diesel', 'MOT', 'Car Insurance', 'Road Tax', 'Parking', 'Congestion', 'Mileage'] },
  'clothing': { box: 'Box 19', label: 'Clothing Costs', categories: ['Clothing', 'Uniform', 'Workwear', 'PPE', 'Safety Equipment'] },
  'travel': { box: 'Box 20', label: 'Travel & Subsistence', categories: ['Travel', 'Transport', 'Uber', 'Taxi', 'Train', 'TFL', 'Fuel', 'Bus', 'Flight', 'Hotel', 'Meals', 'Subsistence', 'Accommodation'] },
  'staff': { box: 'Box 21', label: 'Staff Costs', categories: ['Staff', 'Wages', 'Salary', 'PAYE', 'Pension', 'NI Contributions', 'Subcontractor', 'Agency', 'Freelancer Costs'] },
  'reselling': { box: 'Box 22', label: 'Construction Industry / Cost of Goods', categories: ['Inventory', 'Stock', 'Goods', 'Resale', 'Raw Materials', 'Supplies', 'CIS', 'Construction'] },
  'premises': { box: 'Box 23', label: 'Premises Costs', categories: ['Rent', 'Premises', 'Rates', 'Utilities', 'Office Rent', 'Business Rates', 'Electricity', 'Gas', 'Water', 'Council Tax', 'Use of Home', 'Home Office'] },
  'admin': { box: 'Box 24', label: 'Repairs & Maintenance', categories: ['Repairs', 'Maintenance', 'Cleaning', 'Servicing'] },
  'advertising': { box: 'Box 25', label: 'Advertising, Marketing & Entertainment', categories: ['Advertising', 'Marketing', 'Promotion', 'SEO', 'Social Media', 'PR', 'Sponsorship', 'Client Entertainment', 'Google Ads', 'Facebook Ads'] },
  'bank_finance': { box: 'Box 26', label: 'Interest on Bank & Other Loans', categories: ['Bank Charges', 'Interest', 'Finance', 'Loan Interest', 'Bank Fees', 'Overdraft', 'Credit Card Interest', 'Merchant Fees', 'Payment Processing'] },
  'professional': { box: 'Box 27', label: 'Accountancy, Legal & Professional', categories: ['Legal', 'Accountant', 'Professional', 'Consulting', 'Solicitor', 'Accountancy', 'Bookkeeping', 'Tax Advice', 'Compliance', 'Audit'] },
  'depreciation': { box: 'Box 28', label: 'Depreciation & Loss on Sale', categories: ['Depreciation', 'Amortisation', 'Asset Disposal', 'Write Off'] },
  'other_expenses': { box: 'Box 29', label: 'Other Allowable Expenses', categories: ['Other', 'Miscellaneous', 'Subscriptions', 'Insurance', 'Professional Subscriptions', 'Trade Subscriptions', 'Membership', 'Training', 'CPD', 'Courses', 'Books', 'Reference Materials', 'Postage', 'Courier', 'Packaging'] },
};

// UK Tax Year Helper Functions
function getTaxYears(): { value: string; label: string; start: Date; end: Date }[] {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const years: { value: string; label: string; start: Date; end: Date }[] = [];
  
  // Determine if we're past April 5th
  const isAfterApril5 = currentMonth > 3 || (currentMonth === 3 && new Date().getDate() > 5);
  const latestTaxYear = isAfterApril5 ? currentYear : currentYear - 1;
  
  for (let i = 0; i < 7; i++) {
    const yearStart = latestTaxYear - i;
    const yearEnd = yearStart + 1;
    const isCurrent = i === 0;
    years.push({
      value: `${yearStart}-${yearEnd}`,
      label: `${yearStart}/${yearEnd}${isCurrent ? ' (Current)' : ''}`,
      start: new Date(yearStart, 3, 6), // April 6th
      end: new Date(yearEnd, 3, 5, 23, 59, 59), // April 5th
    });
  }
  return years;
}

// UK Tax rates 2025/26 (frozen thresholds)
const UK_TAX_CONFIG = {
  personalAllowance: 12570,
  personalAllowanceTaper: 100000, // PA reduced by £1 for every £2 over £100k
  basicRateLimit: 37700, // basic rate band width
  basicRateThreshold: 50270, // PA + basic rate band
  higherRateThreshold: 125140, // additional rate starts
  basicRate: 0.20,
  higherRate: 0.40,
  additionalRate: 0.45,
  // Class 2 NIC (voluntary from 2024/25, but still affects state pension entitlement)
  class2Weekly: 3.45,
  class2Threshold: 12570, // Small profits threshold
  // Class 4 NIC
  class4LowerLimit: 12570,
  class4UpperLimit: 50270,
  class4MainRate: 0.06, // 6% (reduced from 9% in 2024/25)
  class4AdditionalRate: 0.02,
  // Student Loan thresholds (Plan 2 most common)
  studentLoanPlan1Threshold: 22015,
  studentLoanPlan2Threshold: 27295,
  studentLoanPlan4Threshold: 27660,
  studentLoanPlan5Threshold: 25000,
  studentLoanRate: 0.09,
  // Dividend allowance
  dividendAllowance: 500,
  dividendBasicRate: 0.0875,
  dividendHigherRate: 0.3375,
  dividendAdditionalRate: 0.3938,
};

interface TaxCalculationResult {
  incomeTax: number;
  nationalInsurance: number;
  class2NIC: number;
  class4NIC: number;
  studentLoan: number;
  total: number;
  effectiveRate: number;
  marginalRate: number;
  personalAllowanceUsed: number;
  taxableIncome: number;
  breakdown: { band: string; rate: string; taxable: number; amount: number }[];
  niBreakdown: { band: string; rate: string; amount: number }[];
}

function calculateUKTax(netProfit: number, options?: { studentLoanPlan?: string; includeClass2?: boolean }): TaxCalculationResult {
  const cfg = UK_TAX_CONFIG;
  const breakdown: { band: string; rate: string; taxable: number; amount: number }[] = [];
  const niBreakdown: { band: string; rate: string; amount: number }[] = [];
  let incomeTax = 0;
  let class4NIC = 0;
  let class2NIC = 0;
  let studentLoan = 0;

  // Personal Allowance with taper for high earners
  let personalAllowance = cfg.personalAllowance;
  if (netProfit > cfg.personalAllowanceTaper) {
    const reduction = Math.floor((netProfit - cfg.personalAllowanceTaper) / 2);
    personalAllowance = Math.max(0, personalAllowance - reduction);
  }

  breakdown.push({
    band: personalAllowance > 0 
      ? `Personal Allowance (£0 - £${personalAllowance.toLocaleString()})` 
      : 'Personal Allowance (tapered to £0)',
    rate: '0%',
    taxable: Math.min(netProfit, personalAllowance),
    amount: 0,
  });

  if (netProfit > personalAllowance) {
    const taxableIncome = netProfit - personalAllowance;

    // Basic Rate Band (20%)
    const basicBand = Math.min(taxableIncome, cfg.basicRateLimit);
    if (basicBand > 0) {
      const basicTax = basicBand * cfg.basicRate;
      incomeTax += basicTax;
      breakdown.push({
        band: `Basic Rate (£${(personalAllowance + 1).toLocaleString()} - £${Math.min(netProfit, cfg.basicRateThreshold).toLocaleString()})`,
        rate: '20%',
        taxable: basicBand,
        amount: basicTax,
      });
    }

    // Higher Rate Band (40%)
    if (taxableIncome > cfg.basicRateLimit) {
      const higherBand = Math.min(taxableIncome - cfg.basicRateLimit, cfg.higherRateThreshold - cfg.basicRateThreshold);
      if (higherBand > 0) {
        const higherTax = higherBand * cfg.higherRate;
        incomeTax += higherTax;
        breakdown.push({
          band: `Higher Rate (£${(cfg.basicRateThreshold + 1).toLocaleString()} - £${Math.min(netProfit, cfg.higherRateThreshold).toLocaleString()})`,
          rate: '40%',
          taxable: higherBand,
          amount: higherTax,
        });
      }
    }

    // Additional Rate Band (45%)
    if (netProfit > cfg.higherRateThreshold) {
      const additionalBand = netProfit - cfg.higherRateThreshold;
      const additionalTax = additionalBand * cfg.additionalRate;
      incomeTax += additionalTax;
      breakdown.push({
        band: `Additional Rate (£${(cfg.higherRateThreshold + 1).toLocaleString()}+)`,
        rate: '45%',
        taxable: additionalBand,
        amount: additionalTax,
      });
    }
  }

  // Class 2 NIC (flat rate, voluntary but recommended for state pension)
  if (options?.includeClass2 && netProfit >= cfg.class2Threshold) {
    class2NIC = cfg.class2Weekly * 52;
    niBreakdown.push({ band: 'Class 2 NIC (flat rate, 52 weeks)', rate: `£${cfg.class2Weekly}/week`, amount: class2NIC });
  }

  // Class 4 NIC
  if (netProfit > cfg.class4LowerLimit) {
    const class4Lower = Math.min(netProfit, cfg.class4UpperLimit) - cfg.class4LowerLimit;
    const class4Main = class4Lower * cfg.class4MainRate;
    class4NIC += class4Main;
    niBreakdown.push({
      band: `Class 4 NIC (£${cfg.class4LowerLimit.toLocaleString()} - £${Math.min(netProfit, cfg.class4UpperLimit).toLocaleString()})`,
      rate: `${cfg.class4MainRate * 100}%`,
      amount: class4Main,
    });

    if (netProfit > cfg.class4UpperLimit) {
      const class4Additional = (netProfit - cfg.class4UpperLimit) * cfg.class4AdditionalRate;
      class4NIC += class4Additional;
      niBreakdown.push({
        band: `Class 4 NIC (above £${cfg.class4UpperLimit.toLocaleString()})`,
        rate: `${cfg.class4AdditionalRate * 100}%`,
        amount: class4Additional,
      });
    }
  }

  // Student Loan repayment
  if (options?.studentLoanPlan) {
    const thresholds: Record<string, number> = {
      plan1: cfg.studentLoanPlan1Threshold,
      plan2: cfg.studentLoanPlan2Threshold,
      plan4: cfg.studentLoanPlan4Threshold,
      plan5: cfg.studentLoanPlan5Threshold,
    };
    const threshold = thresholds[options.studentLoanPlan] || 0;
    if (threshold > 0 && netProfit > threshold) {
      studentLoan = (netProfit - threshold) * cfg.studentLoanRate;
    }
  }

  const nationalInsurance = class2NIC + class4NIC;
  const total = incomeTax + nationalInsurance + studentLoan;
  const taxableIncome = Math.max(0, netProfit - personalAllowance);

  // Marginal rate calculation
  let marginalRate = 0;
  if (netProfit > cfg.higherRateThreshold) marginalRate = 45;
  else if (netProfit > cfg.basicRateThreshold) marginalRate = 40;
  else if (netProfit > cfg.personalAllowance) marginalRate = 20;
  // Add NIC to marginal rate
  if (netProfit > cfg.class4LowerLimit && netProfit <= cfg.class4UpperLimit) marginalRate += 6;
  else if (netProfit > cfg.class4UpperLimit) marginalRate += 2;
  // PA taper zone effective 60% marginal
  if (netProfit > cfg.personalAllowanceTaper && netProfit <= cfg.personalAllowanceTaper + cfg.personalAllowance * 2) {
    marginalRate = 60; // effective marginal rate in taper zone
  }

  return {
    incomeTax,
    nationalInsurance,
    class2NIC,
    class4NIC,
    studentLoan,
    total,
    effectiveRate: netProfit > 0 ? Math.round((total / netProfit) * 1000) / 10 : 0,
    marginalRate,
    personalAllowanceUsed: personalAllowance,
    taxableIncome,
    breakdown,
    niBreakdown,
  };
}

interface ReportSummary {
  totalMonthlyCommitments: number;
  totalActiveBills: number;
  totalInvoices: number;
  invoiceTotals: { totalIncome: number; totalExpenses: number };
  transactionTotals: { credits: number; debits: number };
  categoryBreakdown: { category: string; type: string; color: string; amount: number; categoryId?: string }[];
  expenseCategoryCount: number;
  incomeCategoryCount: number;
}

interface BudgetWithSpending extends Budget {
  currentSpending: number;
  percentageUsed: number;
  remaining: number;
  isOverBudget: boolean;
  isNearLimit: boolean;
}

interface BankTransaction {
  id: string;
  date: string;
  description: string;
  cleanDescription?: string | null;
  reference?: string | null;
  amount: number;
  type: 'credit' | 'debit';
  categoryId: string | null;
  category: Category | null;
  appliedDeductibilityPercent: number | null;
  isApproved: boolean;
}

interface TaxRealityData {
  bankReality: { totalIncome: number; totalOutflow: number; netPosition: number };
  taxReality: { totalIncome: number; totalAllowableExpenses: number; taxableProfit: number };
  reconciliation: { totalNonDeductible: number; topNonDeductibleCategories: { name: string; amount: number }[]; percentageAllowable: number };
  categoryBreakdown: { id: string; name: string; type: string; bankAmount: number; allowableAmount: number; deductibilityPercent: number; transactionCount: number }[];
}

interface CategoryWithDeductibility extends Category {
  defaultDeductibilityPercent: number;
}

interface TaxpayerProfile {
  id: string;
  fullName: string | null;
  dateOfBirth: string | null;
  nationalInsuranceNumber: string | null;
  utr: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  postcode: string | null;
  country: string | null;
  residencyStatus: string | null;
  companyName: string | null;
  tradingName: string | null;
  companyRegistrationNumber: string | null;
  companyUtr: string | null;
  vatRegistrationNumber: string | null;
  registeredAddress: string | null;
  tradingAddress: string | null;
  accountingPeriodStart: string | null;
  accountingPeriodEnd: string | null;
  agentName: string | null;
  agentReferenceNumber: string | null;
  agentUtr: string | null;
  agentEmail: string | null;
  agentPhone: string | null;
  hasAgentAuthority: boolean;
  accountingBasis: string | null;
  isVatRegistered: boolean;
  vatScheme: string | null;
}

const emptyProfile: TaxpayerProfile = {
  id: '',
  fullName: '',
  dateOfBirth: null,
  nationalInsuranceNumber: '',
  utr: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  postcode: '',
  country: 'United Kingdom',
  residencyStatus: 'UK Resident',
  companyName: '',
  tradingName: '',
  companyRegistrationNumber: '',
  companyUtr: '',
  vatRegistrationNumber: '',
  registeredAddress: '',
  tradingAddress: '',
  accountingPeriodStart: null,
  accountingPeriodEnd: null,
  agentName: '',
  agentReferenceNumber: '',
  agentUtr: '',
  agentEmail: '',
  agentPhone: '',
  hasAgentAuthority: false,
  accountingBasis: 'Cash Basis',
  isVatRegistered: false,
  vatScheme: 'Standard',
};

export default function ReportsClient() {
  const { t } = useTranslation();
  const { selectedEntity, loading: entityLoading } = useEntityContext();
  const [entityRegime, setEntityRegime] = useState<string>('hmrc');
  const [reportSummary, setReportSummary] = useState<ReportSummary | null>(null);
  const [accounts, setAccounts] = useState<{id: string; name: string; bank: string}[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [activeReport, setActiveReport] = useState<string>('overview');
  const [budgets, setBudgets] = useState<BudgetWithSpending[]>([]);
  const [categories, setCategories] = useState<CategoryWithDeductibility[]>([]);
  const [taxpayerProfile, setTaxpayerProfile] = useState<TaxpayerProfile>(emptyProfile);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [showBudgetDialog, setShowBudgetDialog] = useState(false);
  const [newBudget, setNewBudget] = useState({ categoryId: '', amount: '', alertAt: '80' });
  const [allTransactions, setAllTransactions] = useState<BankTransaction[]>([]);
  const [selectedTaxYear, setSelectedTaxYear] = useState<string>('');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const { toast } = useToast();

  // New states for modals and tax reality
  const [taxRealityData, setTaxRealityData] = useState<TaxRealityData | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<{ id: string; name: string; type: string } | null>(null);
  const [selectedHMRCBox, setSelectedHMRCBox] = useState<{ box: string; label: string; categories: string[] } | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showHMRCBoxModal, setShowHMRCBoxModal] = useState(false);
  const [showDeductibilityModal, setShowDeductibilityModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryWithDeductibility | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<BankTransaction | null>(null);
  const [savingTransaction, setSavingTransaction] = useState(false);
  const [editingTxCategory, setEditingTxCategory] = useState<string | null>(null);
  const [newCategoryId, setNewCategoryId] = useState<string>('');
  const [movedTransactionIds, setMovedTransactionIds] = useState<string[]>([]);

  const taxYears = useMemo(() => getTaxYears(), []);

  useEffect(() => {
    // Set default tax year
    if (taxYears.length > 0 && !selectedTaxYear) {
      setSelectedTaxYear(taxYears[0].value);
    }
  }, [taxYears, selectedTaxYear]);

  // Track fetch version to prevent stale responses from overwriting fresh ones
  const fetchVersionRef = useRef(0);

  useEffect(() => {
    // Don't fetch until entity context has finished loading
    if (entityLoading) return;
    fetchData();
  }, [selectedEntity, selectedAccountId, entityLoading]);

  const fetchData = async () => {
    // Increment version — any response from an older version will be ignored
    const thisVersion = ++fetchVersionRef.current;
    try {
      const entityParam = selectedEntity?.id ? `&entityId=${selectedEntity.id}` : '';
      const accountParam = selectedAccountId && selectedAccountId !== 'all' ? `&accountId=${selectedAccountId}` : '';
      const entityQs = selectedEntity?.id ? `?entityId=${selectedEntity.id}` : '';
      const accountQs = selectedAccountId && selectedAccountId !== 'all' ? `${entityQs ? '&' : '?'}accountId=${selectedAccountId}` : '';
      const [summaryRes, budgetsRes, categoriesRes, profileRes, statementsRes, taxRealityRes] = await Promise.all([
        fetch(`/api/reports?type=summary${entityParam}${accountParam}`),
        fetch('/api/budgets'),
        fetch(`/api/categories${entityQs}`),
        fetch('/api/taxpayer-profile'),
        fetch(`/api/statements${entityQs}${accountQs}`),
        fetch(`/api/reports/tax-reality${entityQs}${accountQs}`),
      ]);

      // If a newer fetch was started, discard this stale response
      if (thisVersion !== fetchVersionRef.current) return;

      const summaryData = await summaryRes.json();
      if (thisVersion !== fetchVersionRef.current) return;
      setReportSummary(summaryData.summary);
      if (summaryData.entityRegime) setEntityRegime(summaryData.entityRegime);
      if (summaryData.accounts) setAccounts(summaryData.accounts);
      setBudgets(await budgetsRes.json());
      setCategories(await categoriesRes.json());
      
      const profile = await profileRes.json();
      let mergedProfile = { ...emptyProfile, ...profile };

      // Auto-populate Company Profile from Entity data
      if (selectedEntity?.id) {
        try {
          const entityRes = await fetch(`/api/entities/${selectedEntity.id}`);
          if (entityRes.ok) {
            const entity = await entityRes.json();
            // Merge entity data into profile (entity data takes priority for company fields)
            if (entity.name) mergedProfile.companyName = entity.name;
            if (entity.tradingName) mergedProfile.tradingName = entity.tradingName;
            if (entity.companyNumber) mergedProfile.companyRegistrationNumber = entity.companyNumber;
            if (entity.utr) mergedProfile.companyUtr = entity.utr;
            if (entity.vatNumber) mergedProfile.vatRegistrationNumber = entity.vatNumber;
            if (entity.isVatRegistered) mergedProfile.isVatRegistered = entity.isVatRegistered;
            if (entity.vatScheme) mergedProfile.vatScheme = entity.vatScheme;
            if (entity.niNumber) mergedProfile.nationalInsuranceNumber = entity.niNumber;
            if (entity.accountingBasis) mergedProfile.accountingBasis = entity.accountingBasis;
            // Parse registered address into fields
            // Format: "20 Harlequin Close, Isleworth, England, TW7 7LA"
            if (entity.registeredAddress) {
              const postcodeMatch = entity.registeredAddress.match(/[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}/i);
              // Remove postcode from address for parsing
              const addrWithoutPostcode = entity.registeredAddress.replace(/,?\s*[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}/i, '');
              const parts = addrWithoutPostcode.split(',').map((p: string) => p.trim()).filter((p: string) => p);
              // Remove "England"/"UK"/"United Kingdom" from parts — it's the country, not city
              const countryTerms = ['england', 'uk', 'united kingdom', 'scotland', 'wales', 'northern ireland'];
              const filtered = parts.filter((p: string) => !countryTerms.includes(p.toLowerCase()));
              if (filtered.length >= 1) mergedProfile.addressLine1 = filtered[0];
              if (filtered.length >= 2) mergedProfile.addressLine2 = filtered.length > 2 ? filtered[1] : '';
              if (filtered.length >= 2) mergedProfile.city = filtered[filtered.length - 1];
              if (postcodeMatch) mergedProfile.postcode = postcodeMatch[0];
            }
          }
        } catch { /* entity fetch is optional enhancement */ }
      }
      setTaxpayerProfile(mergedProfile);

      const statements = await statementsRes.json();
      const txs: BankTransaction[] = [];
      statements.forEach((stmt: { transactions: BankTransaction[] }) => {
        stmt.transactions.forEach((tx: BankTransaction) => {
          txs.push({ ...tx, appliedDeductibilityPercent: tx.appliedDeductibilityPercent ?? null, isApproved: tx.isApproved ?? false });
        });
      });
      setAllTransactions(txs);

      const taxReality = await taxRealityRes.json();
      if (!taxReality.error) {
        setTaxRealityData(taxReality);
      }

      // Fetch logo for PDF branding
      try {
        const logoRes = await fetch('/api/settings/logo');
        const logoData = await logoRes.json();
        if (logoData.logoUrl) {
          // Convert logo URL to base64 data URL for PDF embedding
          const imgRes = await fetch(logoData.logoUrl);
          const blob = await imgRes.blob();
          const reader = new FileReader();
          reader.onload = () => setLogoDataUrl(reader.result as string);
          reader.readAsDataURL(blob);
        }
      } catch { /* logo is optional */ }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Transaction handlers
  const handleApproveTransaction = async (txId: string) => {
    setSavingTransaction(true);
    try {
      const res = await fetch(`/api/statements/transactions/${txId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved: true }),
      });
      if (res.ok) {
        setAllTransactions(prev => prev.map(tx => tx.id === txId ? { ...tx, isApproved: true } : tx));
        toast({ title: 'Transaction Approved', description: 'Transaction marked as verified' });
      }
    } catch (error) {
      console.error('Error approving transaction:', error);
      toast({ title: 'Error', description: 'Failed to approve transaction', variant: 'destructive' });
    } finally {
      setSavingTransaction(false);
    }
  };

  const handleDeleteTransaction = async (txId: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    try {
      const res = await fetch(`/api/statements/transactions/${txId}`, { method: 'DELETE' });
      if (res.ok) {
        setAllTransactions(prev => prev.filter(tx => tx.id !== txId));
        toast({ title: 'Transaction Deleted' });
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast({ title: 'Error', description: 'Failed to delete transaction', variant: 'destructive' });
    }
  };

  const handleUpdateTransactionDeductibility = async (txId: string, percent: number) => {
    setSavingTransaction(true);
    try {
      const res = await fetch(`/api/statements/transactions/${txId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appliedDeductibilityPercent: percent }),
      });
      if (res.ok) {
        setAllTransactions(prev => prev.map(tx => tx.id === txId ? { ...tx, appliedDeductibilityPercent: percent } : tx));
        toast({ title: 'Deductibility Updated' });
      }
    } catch (error) {
      console.error('Error updating deductibility:', error);
      toast({ title: 'Error', variant: 'destructive' });
    } finally {
      setSavingTransaction(false);
    }
  };

  const handleUpdateCategoryDeductibility = async (categoryId: string, percent: number) => {
    try {
      const res = await fetch(`/api/categories/${categoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defaultDeductibilityPercent: percent }),
      });
      if (res.ok) {
        setCategories(prev => prev.map(cat => cat.id === categoryId ? { ...cat, defaultDeductibilityPercent: percent } : cat));
        toast({ title: 'Category Deductibility Updated', description: `Default set to ${percent}%` });
        fetchData(); // Refresh tax reality data
      }
    } catch (error) {
      console.error('Error updating category:', error);
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  // Modal helpers
  const openCategoryModal = (categoryId: string, categoryName: string, categoryType: string) => {
    setSelectedCategory({ id: categoryId, name: categoryName, type: categoryType });
    setShowCategoryModal(true);
  };

  const openHMRCBoxModal = (box: string, label: string, categories: string[]) => {
    setSelectedHMRCBox({ box, label, categories });
    setShowHMRCBoxModal(true);
  };

  const openDeductibilityModal = (category: CategoryWithDeductibility) => {
    setEditingCategory(category);
    setShowDeductibilityModal(true);
  };

  // Filter transactions by selected tax year or custom range
  const filteredTransactions = useMemo(() => {
    if (selectedTaxYear === 'custom') {
      if (!customStart && !customEnd) return allTransactions;
      return allTransactions.filter(tx => {
        const txDate = new Date(tx.date);
        if (customStart && txDate < new Date(customStart)) return false;
        if (customEnd && txDate > new Date(customEnd + 'T23:59:59')) return false;
        return true;
      });
    }
    const taxYear = taxYears.find(ty => ty.value === selectedTaxYear);
    if (!taxYear) return allTransactions;
    
    return allTransactions.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate >= taxYear.start && txDate <= taxYear.end;
    });
  }, [allTransactions, selectedTaxYear, taxYears, customStart, customEnd]);

  // Get transactions for selected category (excluding moved ones)
  const categoryTransactions = useMemo(() => {
    if (!selectedCategory) return [];
    return filteredTransactions.filter(tx => {
      // Exclude transactions that have been moved to another category
      if (movedTransactionIds.includes(tx.id)) return false;
      return selectedCategory.id === 'uncategorised' 
        ? !tx.categoryId 
        : tx.categoryId === selectedCategory.id;
    });
  }, [filteredTransactions, selectedCategory, movedTransactionIds]);

  // Get transactions for selected HMRC box (excluding moved ones)
  const hmrcBoxTransactions = useMemo(() => {
    if (!selectedHMRCBox) return [];
    return filteredTransactions.filter(tx => {
      // Exclude transactions that have been moved
      if (movedTransactionIds.includes(tx.id)) return false;
      if (!tx.category || tx.type !== 'debit') return false;
      return selectedHMRCBox.categories.some(cat => 
        tx.category?.name.toLowerCase().includes(cat.toLowerCase()) ||
        cat.toLowerCase().includes(tx.category?.name.toLowerCase() || '')
      );
    });
  }, [filteredTransactions, selectedHMRCBox, movedTransactionIds]);

  // Calculate totals for the selected tax year
  // Separates categorised business income/expenses from raw bank credits/debits
  const taxYearTotals = useMemo(() => {
    let bankCredits = 0, bankDebits = 0;
    let businessIncome = 0, businessExpenses = 0;
    let uncategorisedCredits = 0, uncategorisedDebits = 0;
    let uncategorised = 0;

    filteredTransactions.forEach(tx => {
      if (tx.type === 'credit') {
        bankCredits += tx.amount;
        if (tx.category?.type === 'income') businessIncome += tx.amount;
        else if (tx.category?.type === 'expense') { /* credit on expense category = refund, reduce expenses */ }
        else if (!tx.categoryId) { uncategorised++; uncategorisedCredits += tx.amount; }
      } else {
        bankDebits += tx.amount;
        if (tx.category?.type === 'expense') businessExpenses += tx.amount;
        else if (tx.category?.type === 'income') { /* debit on income category = chargeback, reduce income */ }
        else if (!tx.categoryId) { uncategorised++; uncategorisedDebits += tx.amount; }
      }
    });

    return {
      credits: bankCredits,
      debits: bankDebits,
      businessIncome,
      businessExpenses,
      uncategorisedCredits,
      uncategorisedDebits,
      netProfit: businessIncome - businessExpenses,
      bankNetProfit: bankCredits - bankDebits,
      uncategorised,
      total: filteredTransactions.length,
    };
  }, [filteredTransactions]);

  // Category breakdown for the tax year
  const categoryBreakdown = useMemo(() => {
    const breakdown: Record<string, { name: string; type: string; amount: number; count: number }> = {};
    
    filteredTransactions.forEach(tx => {
      if (tx.category) {
        const key = tx.category.id;
        if (!breakdown[key]) {
          breakdown[key] = { name: tx.category.name, type: tx.category.type, amount: 0, count: 0 };
        }
        breakdown[key].amount += tx.amount;
        breakdown[key].count++;
      }
    });
    
    return Object.values(breakdown).sort((a, b) => b.amount - a.amount);
  }, [filteredTransactions]);

  // Monthly breakdown for P&L and Cash Flow
  const monthlyBreakdown = useMemo(() => {
    const months: Record<string, { month: string; income: number; expenses: number; net: number; txCount: number }> = {};
    filteredTransactions.forEach(tx => {
      const d = new Date(tx.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
      if (!months[key]) months[key] = { month: label, income: 0, expenses: 0, net: 0, txCount: 0 };
      if (tx.type === 'credit') months[key].income += tx.amount;
      else months[key].expenses += tx.amount;
      months[key].net = months[key].income - months[key].expenses;
      months[key].txCount++;
    });
    return Object.entries(months).sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
  }, [filteredTransactions]);

  // Aged Debtors (unpaid invoices) breakdown
  const agedDebtors = useMemo(() => {
    if (!reportSummary) return { current: 0, days30: 0, days60: 0, days90: 0, over90: 0, total: 0, items: [] as { name: string; amount: number; days: number; date: string }[] };
    const now = new Date();
    const invoices = (reportSummary as any)?.invoices || [];
    let current = 0, days30 = 0, days60 = 0, days90 = 0, over90 = 0;
    const items: { name: string; amount: number; days: number; date: string }[] = [];
    invoices.forEach((inv: any) => {
      if (inv.status === 'paid') return;
      const due = inv.dueDate ? new Date(inv.dueDate) : inv.invoiceDate ? new Date(inv.invoiceDate) : now;
      const daysOverdue = Math.max(0, Math.floor((now.getTime() - due.getTime()) / 86400000));
      const amt = inv.amount || 0;
      if (daysOverdue <= 0) current += amt;
      else if (daysOverdue <= 30) days30 += amt;
      else if (daysOverdue <= 60) days60 += amt;
      else if (daysOverdue <= 90) days90 += amt;
      else over90 += amt;
      items.push({ name: inv.providerName || inv.fileName || 'Unknown', amount: amt, days: daysOverdue, date: inv.invoiceDate || '' });
    });
    return { current, days30, days60, days90, over90, total: current + days30 + days60 + days90 + over90, items: items.sort((a, b) => b.days - a.days) };
  }, [reportSummary]);

  // Aged Creditors (unpaid bills) breakdown
  const agedCreditors = useMemo(() => {
    if (!reportSummary) return { current: 0, days30: 0, days60: 0, days90: 0, over90: 0, total: 0, items: [] as { name: string; amount: number; frequency: string }[] };
    const bills = (reportSummary as any)?.bills || [];
    let total = 0;
    const items: { name: string; amount: number; frequency: string }[] = [];
    bills.forEach((bill: any) => {
      if (!bill.isActive) return;
      const amt = bill.amount || 0;
      total += amt;
      items.push({ name: bill.billName || 'Unknown', amount: amt, frequency: bill.frequency || 'monthly' });
    });
    return { current: total, days30: 0, days60: 0, days90: 0, over90: 0, total, items: items.sort((a, b) => b.amount - a.amount) };
  }, [reportSummary]);

  // Trial Balance — debit/credit totals per category (nominal account)
  const trialBalance = useMemo(() => {
    const accounts: Record<string, { name: string; type: string; debits: number; credits: number; net: number; txCount: number }> = {};
    filteredTransactions.forEach(tx => {
      const catName = tx.category?.name || 'Uncategorised';
      const catType = tx.category?.type || 'expense';
      if (!accounts[catName]) accounts[catName] = { name: catName, type: catType, debits: 0, credits: 0, net: 0, txCount: 0 };
      if (tx.type === 'debit') accounts[catName].debits += tx.amount;
      else accounts[catName].credits += tx.amount;
      accounts[catName].net = accounts[catName].credits - accounts[catName].debits;
      accounts[catName].txCount++;
    });
    const rows = Object.values(accounts).sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name));
    const totalDebits = rows.reduce((s, r) => s + r.debits, 0);
    const totalCredits = rows.reduce((s, r) => s + r.credits, 0);
    return { rows, totalDebits, totalCredits, balanced: Math.abs(totalDebits - totalCredits) < 0.01 };
  }, [filteredTransactions]);

  // General Ledger — transactions grouped by category, sorted by date
  const generalLedger = useMemo(() => {
    const ledger: Record<string, { name: string; type: string; transactions: typeof filteredTransactions }> = {};
    filteredTransactions.forEach(tx => {
      const catName = tx.category?.name || 'Uncategorised';
      const catType = tx.category?.type || 'expense';
      if (!ledger[catName]) ledger[catName] = { name: catName, type: catType, transactions: [] };
      ledger[catName].transactions.push(tx);
    });
    // Sort transactions within each group by date
    Object.values(ledger).forEach(g => g.transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    return Object.values(ledger).sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name));
  }, [filteredTransactions]);

  // AI Tax Forecast — projects full-year tax based on current trajectory
  const taxForecast = useMemo(() => {
    if (monthlyBreakdown.length === 0) return null;
    const monthsWithData = monthlyBreakdown.length;
    const avgMonthlyIncome = taxYearTotals.businessIncome / monthsWithData;
    const avgMonthlyExpenses = taxYearTotals.businessExpenses / monthsWithData;
    const projectedAnnualIncome = avgMonthlyIncome * 12;
    const projectedAnnualExpenses = avgMonthlyExpenses * 12;
    const projectedProfit = projectedAnnualIncome - projectedAnnualExpenses;

    // UK tax calculation
    let projectedTax = 0;
    if (entityRegime === 'companies_house') {
      // Corporation Tax
      if (projectedProfit <= 50000) projectedTax = projectedProfit * 0.19;
      else if (projectedProfit <= 250000) projectedTax = projectedProfit * 0.265; // Marginal relief approximation
      else projectedTax = projectedProfit * 0.25;
    } else {
      // Income Tax + NIC (simplified 2025/26)
      const taxable = Math.max(0, projectedProfit - 12570); // Personal allowance
      if (taxable <= 37700) projectedTax = taxable * 0.20;
      else if (taxable <= 125140) projectedTax = 37700 * 0.20 + (taxable - 37700) * 0.40;
      else projectedTax = 37700 * 0.20 + 87440 * 0.40 + (taxable - 125140) * 0.45;
      // Class 4 NIC
      const nicable = Math.max(0, projectedProfit - 12570);
      if (nicable <= 50270 - 12570) projectedTax += nicable * 0.06;
      else projectedTax += (50270 - 12570) * 0.06 + (nicable - (50270 - 12570)) * 0.02;
    }
    projectedTax = Math.max(0, projectedTax);

    const trend = monthlyBreakdown.length >= 2
      ? (monthlyBreakdown[monthlyBreakdown.length - 1].net - monthlyBreakdown[0].net) / monthlyBreakdown.length
      : 0;

    return {
      monthsWithData,
      avgMonthlyIncome,
      avgMonthlyExpenses,
      projectedAnnualIncome,
      projectedAnnualExpenses,
      projectedProfit,
      projectedTax,
      effectiveRate: projectedProfit > 0 ? (projectedTax / projectedProfit) * 100 : 0,
      trend: trend > 0 ? 'improving' as const : trend < 0 ? 'declining' as const : 'stable' as const,
    };
  }, [monthlyBreakdown, taxYearTotals, entityRegime]);

  // Compliance Alerts — smart warnings about filing readiness
  const complianceAlerts = useMemo(() => {
    const alerts: { level: 'error' | 'warning' | 'info'; message: string; action?: string }[] = [];
    // Uncategorised transactions
    if (taxYearTotals.uncategorised > 0) {
      const pct = ((taxYearTotals.uncategorised / taxYearTotals.total) * 100).toFixed(0);
      alerts.push({ level: 'error', message: `${taxYearTotals.uncategorised} uncategorised transactions (${pct}% of total)`, action: '/statements?tab=uncategorised' });
    }
    // Missing company profile data
    if (entityRegime === 'companies_house') {
      if (!taxpayerProfile.companyRegistrationNumber) alerts.push({ level: 'warning', message: 'Company Registration Number (CRN) not set' });
      if (!taxpayerProfile.companyUtr) alerts.push({ level: 'warning', message: 'Company UTR not set — required for CT600 filing' });
    } else {
      if (!taxpayerProfile.utr) alerts.push({ level: 'warning', message: 'UTR not set — required for Self Assessment' });
      if (!taxpayerProfile.nationalInsuranceNumber) alerts.push({ level: 'warning', message: 'National Insurance Number not set' });
    }
    // VAT check
    if (taxYearTotals.businessIncome > 85000 && !taxpayerProfile.isVatRegistered) {
      alerts.push({ level: 'error', message: 'Turnover exceeds £85,000 VAT threshold — you may need to register for VAT' });
    }
    // Low categorisation coverage
    if (taxYearTotals.total > 0 && taxYearTotals.uncategorised / taxYearTotals.total > 0.5) {
      alerts.push({ level: 'error', message: 'Over 50% of transactions are uncategorised — tax calculations are unreliable' });
    }
    // No transactions
    if (taxYearTotals.total === 0) {
      alerts.push({ level: 'info', message: 'No transactions found for this tax year — upload bank statements to get started' });
    }
    // Filing deadline reminders
    const now = new Date();
    const month = now.getMonth();
    if (entityRegime !== 'companies_house' && month >= 9 && month <= 11) {
      alerts.push({ level: 'info', message: 'Self Assessment deadline: 31 January — ensure all data is ready' });
    }
    if (taxpayerProfile.isVatRegistered) {
      alerts.push({ level: 'info', message: 'VAT Return due quarterly — check VAT Return tab for current period' });
    }
    return alerts;
  }, [taxYearTotals, entityRegime, taxpayerProfile]);

  // HMRC Box Breakdown
  const hmrcBreakdown = useMemo(() => {
    const breakdown: { box: string; label: string; categories: string[]; total: number; matched: string[] }[] = [];
    
    Object.entries(HMRC_BOX_MAPPING).forEach(([key, mapping]) => {
      const matchedCategories: string[] = [];
      let total = 0;
      
      categoryBreakdown.forEach(cat => {
        if (cat.type === 'expense') {
          const isMatch = mapping.categories.some(mc => 
            cat.name.toLowerCase().includes(mc.toLowerCase()) ||
            mc.toLowerCase().includes(cat.name.toLowerCase())
          );
          if (isMatch) {
            matchedCategories.push(cat.name);
            total += cat.amount;
          }
        }
      });
      
      if (total > 0 || matchedCategories.length > 0) {
        breakdown.push({ ...mapping, total, matched: matchedCategories });
      }
    });
    
    return breakdown.sort((a, b) => b.total - a.total);
  }, [categoryBreakdown]);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await fetch('/api/taxpayer-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taxpayerProfile),
      });
      if (res.ok) {
        toast({ title: 'Profile Saved', description: 'Taxpayer profile updated successfully' });
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast({ title: 'Error', description: 'Failed to save profile', variant: 'destructive' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleExport = async (type: string, format: 'csv' | 'json' | 'pdf' | 'excel') => {
    setExporting(true);
    try {
      const taxYear = taxYears.find(ty => ty.value === selectedTaxYear);
      const params = new URLSearchParams({
        type,
        format: format === 'pdf' || format === 'excel' ? 'json' : format,
        ...(taxYear && { startDate: taxYear.start.toISOString().split('T')[0] }),
        ...(taxYear && { endDate: taxYear.end.toISOString().split('T')[0] }),
      });

      const res = await fetch(`/api/reports?${params}`);
      
      if (format === 'csv') {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report-${type}-${selectedTaxYear}-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else if (format === 'pdf') {
        const data = await res.json();
        generatePDF(type, data);
      } else if (format === 'excel') {
        const data = await res.json();
        generateExcel(type, data);
      } else {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report-${type}-${selectedTaxYear}-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
      }

      toast({ title: 'Export Complete', description: `${type} report downloaded as ${format.toUpperCase()}` });
    } catch (error) {
      console.error('Export error:', error);
      toast({ title: 'Export Failed', variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  const generateAccountantPack = async () => {
    setExporting(true);
    try {
      toast({ title: 'Generating Accountant Pack...', description: 'This may take a moment' });
      
      // Generate main report PDF
      const taxYear = taxYears.find(ty => ty.value === selectedTaxYear);
      const reportData = {
        taxYear: selectedTaxYear,
        period: taxYear ? `${taxYear.start.toLocaleDateString('en-GB')} - ${taxYear.end.toLocaleDateString('en-GB')}` : '',
        summary: {
          totalIncome: taxYearTotals.businessIncome,
          totalExpenses: taxYearTotals.businessExpenses,
          bankCredits: taxYearTotals.credits,
          bankDebits: taxYearTotals.debits,
          netProfit: taxYearTotals.netProfit,
          estimatedTax: taxEstimate.total,
        },
        hmrcBreakdown,
        categoryBreakdown,
        uncategorisedCount: taxYearTotals.uncategorised,
      };

      // Generate transactions CSV
      const headers = ['Date', 'Description', 'Type', 'Amount', 'Category', 'HMRC Box'];
      const rows = filteredTransactions.map(tx => {
        const hmrcBox = hmrcBreakdown.find(h => h.matched.includes(tx.category?.name || ''));
        return [
          new Date(tx.date).toLocaleDateString('en-GB'),
          tx.description,
          tx.type,
          tx.amount.toFixed(2),
          tx.category?.name || 'Uncategorised',
          hmrcBox?.box || '-',
        ];
      });
      const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

      // Create summary JSON
      const summaryJson = JSON.stringify(reportData, null, 2);

      // Download CSV
      const csvBlob = new Blob([csv], { type: 'text/csv' });
      const csvUrl = URL.createObjectURL(csvBlob);
      const csvLink = document.createElement('a');
      csvLink.href = csvUrl;
      csvLink.download = `accountant-pack-transactions-${selectedTaxYear}.csv`;
      csvLink.click();

      // Download JSON summary
      const jsonBlob = new Blob([summaryJson], { type: 'application/json' });
      const jsonUrl = URL.createObjectURL(jsonBlob);
      const jsonLink = document.createElement('a');
      jsonLink.href = jsonUrl;
      jsonLink.download = `accountant-pack-summary-${selectedTaxYear}.json`;
      setTimeout(() => jsonLink.click(), 500);

      toast({ title: 'Accountant Pack Downloaded', description: 'Transactions CSV and summary JSON exported' });
    } catch (error) {
      console.error('Export error:', error);
      toast({ title: 'Export Failed', variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  const generateExcel = (type: string, data: Record<string, unknown>) => {
    const title = type === 'summary' ? 'Full Summary Report' : 
                  type === 'bills' ? 'Bills Report' :
                  type === 'invoices' ? 'Invoices Report' :
                  type === 'categories' ? 'Categories Report' :
                  type === 'statements' ? 'Bank Statements Report' :
                  type === 'providers' ? 'Providers Report' : 'Financial Report';

    const hdr = 'background:#1e3a8a;color:white;font-weight:bold;font-size:14px;padding:8px';
    const subHdr = 'background:#f3f4f6;font-weight:bold;padding:6px';
    const amt = 'text-align:right;mso-number-format:"\\£\\#\\,\\#\\#0\\.00"';
    const sheets: string[] = [];

    // Sheet 1: Summary
    sheets.push(`
      <div id="Summary">
      <table border="1" cellpadding="4">
        <tr><th colspan="2" style="${hdr}">${taxpayerProfile.companyName || taxpayerProfile.tradingName || 'HomeLedger'} — ${title}</th></tr>
        <tr><td>Report Date</td><td>${new Date().toLocaleDateString('en-GB')}</td></tr>
        <tr><td>Tax Year</td><td>${selectedTaxYear}</td></tr>
        <tr><td>Entity Regime</td><td>${entityRegime === 'companies_house' ? 'Companies House / CT600' : 'HMRC Self Assessment / SA103'}</td></tr>
        ${selectedAccountId !== 'all' ? `<tr><td>Account Filter</td><td>${accounts.find(a => a.id === selectedAccountId)?.name || selectedAccountId}</td></tr>` : ''}
        <tr><td colspan="2"></td></tr>
        <tr><th colspan="2" style="${subHdr}">Financial Summary</th></tr>
        <tr><td>Total Income</td><td style="${amt}">${taxYearTotals.credits.toFixed(2)}</td></tr>
        <tr><td>Total Expenses</td><td style="${amt}">${taxYearTotals.debits.toFixed(2)}</td></tr>
        <tr><td style="font-weight:bold">Net Profit</td><td style="${amt};font-weight:bold">${taxYearTotals.netProfit.toFixed(2)}</td></tr>
        <tr><td>Allowable Expenses</td><td style="${amt}">${dualRealityTotals.allowableExpenses.toFixed(2)}</td></tr>
        <tr><td>Taxable Profit</td><td style="${amt}">${dualRealityTotals.taxableProfit.toFixed(2)}</td></tr>
        <tr><td>Estimated Tax</td><td style="${amt}">${taxEstimate.total.toFixed(2)}</td></tr>
        <tr><td>Effective Rate</td><td>${taxEstimate.effectiveRate}%</td></tr>
        <tr><td>Transactions</td><td>${taxYearTotals.total}</td></tr>
        <tr><td>Uncategorised</td><td>${taxYearTotals.uncategorised}</td></tr>
      </table>
      </div>
    `);

    // Sheet 2: Categories
    sheets.push(`
      <div id="Categories">
      <table border="1" cellpadding="4">
        <tr><th colspan="4" style="${hdr}">Category Breakdown</th></tr>
        <tr style="${subHdr}"><th>Category</th><th>Type</th><th>Transactions</th><th>Amount (£)</th></tr>
        ${categoryBreakdown.map(c => `<tr><td>${c.name}</td><td>${c.type}</td><td>${c.count}</td><td style="${amt}">${c.amount.toFixed(2)}</td></tr>`).join('')}
        <tr style="font-weight:bold;background:#dbeafe"><td colspan="2">Total Income</td><td></td><td style="${amt}">${taxYearTotals.credits.toFixed(2)}</td></tr>
        <tr style="font-weight:bold;background:#fee2e2"><td colspan="2">Total Expenses</td><td></td><td style="${amt}">${taxYearTotals.debits.toFixed(2)}</td></tr>
      </table>
      </div>
    `);

    // Sheet 3: HMRC Boxes / Expense mapping
    sheets.push(`
      <div id="HMRC_Boxes">
      <table border="1" cellpadding="4">
        <tr><th colspan="4" style="${hdr}">${entityRegime === 'companies_house' ? 'CT600 Expense Mapping' : 'SA103 HMRC Box Mapping'}</th></tr>
        <tr style="${subHdr}"><th>Box</th><th>Description</th><th>Your Categories</th><th>Amount (£)</th></tr>
        ${hmrcBreakdown.map(h => `<tr><td>${h.box}</td><td>${h.label}</td><td>${h.matched.join(', ')}</td><td style="${amt}">${h.total.toFixed(2)}</td></tr>`).join('')}
        <tr style="font-weight:bold;background:#dbeafe"><td colspan="3">Total</td><td style="${amt}">${hmrcBreakdown.reduce((s, h) => s + h.total, 0).toFixed(2)}</td></tr>
      </table>
      </div>
    `);

    // Sheet 4: Tax Calculation
    sheets.push(`
      <div id="Tax_Calculation">
      <table border="1" cellpadding="4">
        <tr><th colspan="4" style="${hdr}">Tax Calculation (2025/26)</th></tr>
        <tr style="${subHdr}"><th>Band</th><th>Rate</th><th>Taxable (£)</th><th>Tax (£)</th></tr>
        ${taxEstimate.breakdown.map(b => `<tr><td>${b.band}</td><td>${b.rate}</td><td style="${amt}">${b.taxable.toFixed(2)}</td><td style="${amt}">${b.amount.toFixed(2)}</td></tr>`).join('')}
        <tr style="font-weight:bold;background:#dbeafe"><td colspan="3">Income Tax</td><td style="${amt}">${taxEstimate.incomeTax.toFixed(2)}</td></tr>
        ${taxEstimate.niBreakdown.map(ni => `<tr><td>${ni.band}</td><td>${ni.rate}</td><td></td><td style="${amt}">${ni.amount.toFixed(2)}</td></tr>`).join('')}
        <tr style="font-weight:bold;background:#dbeafe"><td colspan="3">Total NIC</td><td style="${amt}">${taxEstimate.nationalInsurance.toFixed(2)}</td></tr>
        <tr style="font-weight:bold;background:#fef3c7;font-size:14px"><td colspan="3">TOTAL TAX LIABILITY</td><td style="${amt}">${taxEstimate.total.toFixed(2)}</td></tr>
      </table>
      </div>
    `);

    // Sheet 5: Transactions (if type includes statements or summary)
    if (type === 'statements' || type === 'summary') {
      const txData = type === 'statements' && data.transactions
        ? (data.transactions as Array<Record<string, any>>)
        : filteredTransactions;
      sheets.push(`
        <div id="Transactions">
        <table border="1" cellpadding="4">
          <tr><th colspan="5" style="${hdr}">Transactions (${Array.isArray(txData) ? txData.length : 0})</th></tr>
          <tr style="${subHdr}"><th>Date</th><th>Description</th><th>Category</th><th>Type</th><th>Amount (£)</th></tr>
          ${(Array.isArray(txData) ? txData.slice(0, 5000) : []).map((tx: any) => `<tr><td>${tx.date ? new Date(tx.date).toLocaleDateString('en-GB') : ''}</td><td>${tx.description || ''}</td><td>${tx.category?.name || tx.category || 'Uncategorised'}</td><td>${tx.type}</td><td style="${amt}">${(typeof tx.amount === 'number' ? tx.amount : 0).toFixed(2)}</td></tr>`).join('')}
        </table>
        </div>
      `);
    }

    // Add API-specific data if present
    if (type === 'bills' && data.bills) {
      const bills = data.bills as Array<Record<string, unknown>>;
      sheets.push(`
        <div id="Bills">
        <table border="1" cellpadding="4">
          <tr><th colspan="5" style="${hdr}">Bills (${bills.length})</th></tr>
          <tr style="${subHdr}"><th>Bill Name</th><th>Provider</th><th>Amount (£)</th><th>Frequency</th><th>Category</th></tr>
          ${bills.map(b => `<tr><td>${b.billName}</td><td>${b.provider}</td><td style="${amt}">${(b.amount as number)?.toFixed(2)}</td><td>${b.frequency}</td><td>${b.category}</td></tr>`).join('')}
        </table>
        </div>
      `);
    }

    if (type === 'invoices' && data.invoices) {
      const invoices = data.invoices as Array<Record<string, unknown>>;
      sheets.push(`
        <div id="Invoices">
        <table border="1" cellpadding="4">
          <tr><th colspan="5" style="${hdr}">Invoices (${invoices.length})</th></tr>
          <tr style="${subHdr}"><th>Provider</th><th>Invoice #</th><th>Date</th><th>Status</th><th>Amount (£)</th></tr>
          ${invoices.map(i => `<tr><td>${i.providerName || ''}</td><td>${i.invoiceNumber || ''}</td><td>${i.invoiceDate ? new Date(i.invoiceDate as string).toLocaleDateString('en-GB') : ''}</td><td>${i.status || ''}</td><td style="${amt}">${(i.amount as number)?.toFixed(2)}</td></tr>`).join('')}
        </table>
        </div>
      `);
    }

    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets>
        ${sheets.map((_, i) => {
          const names = ['Summary', 'Categories', 'HMRC_Boxes', 'Tax_Calculation', 'Transactions', 'Bills', 'Invoices'];
          return `<x:ExcelWorksheet><x:Name>${names[i] || 'Sheet' + (i+1)}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet>`;
        }).join('')}
        </x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
      </head>
      <body>${sheets.join('\n')}</body></html>
    `;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `homeledger-${type}-${selectedTaxYear}-${new Date().toISOString().split('T')[0]}.xls`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Premium PDF shared styles and header
  const getPremiumPDFStyles = (accentColor: string = '#1e3a8a', accentLight: string = '#eff6ff', accentBorder: string = '#3b82f6') => `
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; max-width: 900px; margin: 0 auto; color: #1f2937; line-height: 1.6; }
    h1 { color: ${accentColor}; border-bottom: 3px solid ${accentBorder}; padding-bottom: 12px; margin-bottom: 5px; font-size: 28px; letter-spacing: -0.5px; }
    h2 { color: ${accentColor}; background: ${accentLight}; padding: 12px 16px; margin: 30px 0 15px 0; border-left: 4px solid ${accentBorder}; border-radius: 0 6px 6px 0; font-size: 16px; }
    h3 { color: #374151; margin: 18px 0 10px 0; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0 24px 0; font-size: 13px; }
    th, td { border: 1px solid #e5e7eb; padding: 10px 12px; text-align: left; }
    th { background: #f9fafb; font-weight: 600; color: #374151; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
    tr:nth-child(even) { background: #fafafa; }
    tr:hover { background: #f3f4f6; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 35px; padding-bottom: 20px; border-bottom: 1px solid #e5e7eb; }
    .logo-area { display: flex; align-items: center; gap: 16px; }
    .logo-area img { max-height: 60px; max-width: 180px; object-fit: contain; }
    .total-row { background: #dbeafe !important; font-weight: bold; }
    .subtotal-row { background: #f0f9ff !important; font-weight: 600; }
    .highlight { background: linear-gradient(135deg, #fef3c7, #fef9c3); padding: 16px; border-radius: 10px; margin: 16px 0; border: 1px solid #fde68a; }
    .tax-box { background: linear-gradient(135deg, #fef2f2, #fff1f2); padding: 16px; border-radius: 10px; border-left: 4px solid #ef4444; }
    .ch-box { background: linear-gradient(135deg, #eff6ff, #e0f2fe); padding: 16px; border-radius: 10px; border-left: 4px solid ${accentBorder}; }
    .amt { text-align: right; font-variant-numeric: tabular-nums; font-family: 'Consolas', 'SF Mono', monospace; }
    .footer { margin-top: 50px; padding-top: 20px; border-top: 2px solid #e5e7eb; color: #9ca3af; font-size: 11px; display: flex; justify-content: space-between; align-items: flex-end; }
    .footer-left { max-width: 60%; }
    .footer-right { text-align: right; }
    .confidential { background: #fef2f2; color: #991b1b; padding: 4px 10px; border-radius: 4px; font-size: 10px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; display: inline-block; margin-bottom: 10px; }
    .watermark { position: fixed; bottom: 20px; right: 20px; opacity: 0.06; font-size: 80px; font-weight: 900; color: ${accentColor}; transform: rotate(-30deg); pointer-events: none; z-index: -1; }
    @media print { body { padding: 15px; } h2 { page-break-after: avoid; } table { page-break-inside: avoid; } .watermark { display: none; } }
    @page { margin: 1.5cm; }
  `;

  const getPremiumHeader = (title: string, subtitle: string, meta: { label: string; value: string }[]) => {
    const logoHtml = logoDataUrl ? `<img src="${logoDataUrl}" alt="Logo" />` : '';
    return `
      <div class="header">
        <div class="logo-area">
          ${logoHtml}
          <div>
            <h1>${taxpayerProfile.companyName || taxpayerProfile.tradingName || 'HomeLedger'}</h1>
            <p style="color:#6b7280;margin:0;font-size:14px;">${subtitle}</p>
          </div>
        </div>
        <div style="text-align:right;color:#6b7280;font-size:13px;">
          <span class="confidential">Confidential</span>
          ${meta.map(m => `<p style="margin:3px 0"><strong>${m.label}:</strong> ${m.value}</p>`).join('')}
        </div>
      </div>
      <div class="watermark">DRAFT</div>
    `;
  };

  const getPremiumFooter = (extra?: string) => `
    <div class="footer">
      <div class="footer-left">
        <p style="margin:0"><strong>Generated by HomeLedger</strong> — homeledger.co.uk</p>
        <p style="margin:2px 0 0 0">This document is generated for management and tax preparation purposes. Professional review is recommended before any statutory submission.</p>
        ${extra ? `<p style="margin:2px 0 0 0">${extra}</p>` : ''}
      </div>
      <div class="footer-right">
        <p style="margin:0;font-size:10px;">${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>
        <p style="margin:2px 0 0 0;font-size:10px;">Ref: ${selectedTaxYear}-${Date.now().toString(36).toUpperCase()}</p>
      </div>
    </div>
  `;

  const generateHMRCReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({ title: 'Error', description: 'Please allow popups to generate PDF', variant: 'destructive' });
      return;
    }

    const tp = taxpayerProfile;
    const taxYear = taxYears.find(ty => ty.value === selectedTaxYear);
    const today = new Date().toLocaleDateString('en-GB');
    const periodStart = taxYear?.start.toLocaleDateString('en-GB') || 'Not set';
    const periodEnd = taxYear?.end.toLocaleDateString('en-GB') || 'Not set';

    const expenseCategories = categoryBreakdown.filter(c => c.type === 'expense');
    const incomeCategories = categoryBreakdown.filter(c => c.type === 'income');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html><head><title>HMRC Financial Report - Tax Year ${selectedTaxYear}</title>
      <style>${getPremiumPDFStyles()}</style>
      </head><body>
        ${getPremiumHeader('HomeLedger', 'HMRC Self Assessment Report — SA103', [
          { label: 'Tax Year', value: selectedTaxYear },
          { label: 'Period', value: `${periodStart} to ${periodEnd}` },
          { label: 'Generated', value: today },
        ])}

        <h2>1. Report Identification</h2>
        <table>
          <tr><td>Report Type</td><td>Self Assessment SA103 (Self Employment)</td></tr>
          <tr><td>Tax Year</td><td>${selectedTaxYear} (${periodStart} to ${periodEnd})</td></tr>
          <tr><td>Accounting Basis</td><td>${tp.accountingBasis || 'Cash Basis'}</td></tr>
        </table>

        <h2>2. Taxpayer Details</h2>
        <table>
          <tr><td>Full Name</td><td>${tp.fullName || '-'}</td></tr>
          <tr><td>UTR</td><td>${tp.utr || '-'}</td></tr>
          <tr><td>NI Number</td><td>${tp.nationalInsuranceNumber || '-'}</td></tr>
          <tr><td>Address</td><td>${[tp.addressLine1, tp.city, tp.postcode].filter(Boolean).join(', ') || '-'}</td></tr>
        </table>

        <h2>3. Income (Turnover)</h2>
        <table>
          <tr><th>Category</th><th>Amount</th></tr>
          ${incomeCategories.map(c => `<tr><td>${c.name}</td><td>\u00a3${c.amount.toFixed(2)}</td></tr>`).join('')}
          <tr class="total-row"><td>Total Turnover</td><td>\u00a3${taxYearTotals.credits.toFixed(2)}</td></tr>
        </table>

        <h2>4. Allowable Expenses (HMRC SA103 Boxes)</h2>
        <table>
          <tr><th>HMRC Box</th><th>Description</th><th>Your Categories</th><th>Amount</th></tr>
          ${hmrcBreakdown.map(h => `<tr><td>${h.box}</td><td>${h.label}</td><td>${h.matched.join(', ') || '-'}</td><td>\u00a3${h.total.toFixed(2)}</td></tr>`).join('')}
          <tr class="total-row"><td colspan="3">Total Allowable Expenses</td><td>\u00a3${taxYearTotals.debits.toFixed(2)}</td></tr>
        </table>

        <h2>5. Profit & Loss Summary</h2>
        <div class="highlight">
          <table style="margin: 0;">
            <tr><td>Total Income</td><td style="text-align: right;">\u00a3${taxYearTotals.credits.toFixed(2)}</td></tr>
            <tr><td>Total Expenses</td><td style="text-align: right;">-\u00a3${taxYearTotals.debits.toFixed(2)}</td></tr>
            <tr style="font-size: 18px; font-weight: bold;"><td>Net Profit</td><td style="text-align: right; color: ${taxYearTotals.netProfit >= 0 ? '#059669' : '#dc2626'};">\u00a3${taxYearTotals.netProfit.toFixed(2)}</td></tr>
          </table>
        </div>

        <h2>5b. Dual Reality — Bank vs Tax</h2>
        <table>
          <tr style="background:#f3f4f6"><th></th><th>Bank Reality</th><th>Tax Reality</th><th>Difference</th></tr>
          <tr><td>Income</td><td style="text-align:right">\u00a3${taxYearTotals.credits.toFixed(2)}</td><td style="text-align:right">\u00a3${taxYearTotals.credits.toFixed(2)}</td><td style="text-align:right">\u00a30.00</td></tr>
          <tr><td>Expenses</td><td style="text-align:right">\u00a3${dualRealityTotals.bankOutflow.toFixed(2)}</td><td style="text-align:right">\u00a3${dualRealityTotals.allowableExpenses.toFixed(2)}</td><td style="text-align:right; color:#dc2626;">\u00a3${dualRealityTotals.nonDeductible.toFixed(2)}</td></tr>
          <tr class="total-row"><td>Net Position</td><td style="text-align:right">\u00a3${(taxYearTotals.credits - dualRealityTotals.bankOutflow).toFixed(2)}</td><td style="text-align:right">\u00a3${dualRealityTotals.taxableProfit.toFixed(2)}</td><td></td></tr>
        </table>
        <p style="font-size:12px;color:#6b7280;margin-top:4px;">
          ${dualRealityTotals.percentAllowable}% of your expenses are tax-deductible. Non-deductible amount: \u00a3${dualRealityTotals.nonDeductible.toFixed(2)}
        </p>

        ${taxYearTotals.netProfit > 0 ? `
        <h2>6. Estimated Tax Liability (2025/26 Rates)</h2>
        <div class="tax-box">
          <h3 style="margin-top:0;color:#1e40af;">Income Tax</h3>
          <table style="margin: 0 0 15px 0;">
            <tr style="background:#f3f4f6"><th>Band</th><th>Rate</th><th style="text-align:right">Taxable</th><th style="text-align:right">Tax</th></tr>
            ${taxEstimate.breakdown.map(b => `<tr><td>${b.band}</td><td>${b.rate}</td><td style="text-align:right">\u00a3${b.taxable.toFixed(2)}</td><td style="text-align:right">\u00a3${b.amount.toFixed(2)}</td></tr>`).join('')}
            <tr class="total-row"><td colspan="3">Income Tax Subtotal</td><td style="text-align:right">\u00a3${taxEstimate.incomeTax.toFixed(2)}</td></tr>
          </table>

          <h3 style="color:#1e40af;">National Insurance Contributions</h3>
          <table style="margin: 0 0 15px 0;">
            <tr style="background:#f3f4f6"><th>Type</th><th>Rate</th><th style="text-align:right">Amount</th></tr>
            ${taxEstimate.niBreakdown.length > 0 
              ? taxEstimate.niBreakdown.map(ni => `<tr><td>${ni.band}</td><td>${ni.rate}</td><td style="text-align:right">\u00a3${ni.amount.toFixed(2)}</td></tr>`).join('')
              : '<tr><td colspan="3">No NIC liability (profit below threshold)</td></tr>'}
            <tr class="total-row"><td colspan="2">NIC Subtotal</td><td style="text-align:right">\u00a3${taxEstimate.nationalInsurance.toFixed(2)}</td></tr>
          </table>

          ${taxEstimate.studentLoan > 0 ? `
          <h3 style="color:#1e40af;">Student Loan Repayment</h3>
          <table style="margin: 0 0 15px 0;">
            <tr><td>Student Loan (9% above threshold)</td><td style="text-align:right">\u00a3${taxEstimate.studentLoan.toFixed(2)}</td></tr>
          </table>
          ` : ''}

          <table style="margin:15px 0 0 0; border-top: 3px solid #1e3a8a;">
            <tr style="font-size:16px;font-weight:bold;background:#dbeafe"><td>Total Estimated Liability</td><td style="text-align:right">\u00a3${taxEstimate.total.toFixed(2)}</td></tr>
            <tr><td>Effective Tax Rate</td><td style="text-align:right">${taxEstimate.effectiveRate}%</td></tr>
            <tr><td>Marginal Tax Rate</td><td style="text-align:right">${taxEstimate.marginalRate}%</td></tr>
            ${taxEstimate.personalAllowanceUsed < 12570 ? `<tr style="color:#dc2626"><td>Personal Allowance (tapered)</td><td style="text-align:right">\u00a3${taxEstimate.personalAllowanceUsed.toLocaleString()}</td></tr>` : ''}
            <tr style="background:#f0fdf4;font-weight:bold"><td>Net Income After Tax</td><td style="text-align:right;color:#059669">\u00a3${(taxYearTotals.netProfit - taxEstimate.total).toFixed(2)}</td></tr>
          </table>
        </div>
        ` : `
        <h2>6. Loss Relief Information</h2>
        <div style="background: #dbeafe; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6;">
          <p><strong>Loss Detected: \u00a3${Math.abs(taxYearTotals.netProfit).toFixed(2)}</strong></p>
          <p>You can carry this loss forward to offset against future profits in subsequent tax years.</p>
          <p>Under Cash Basis rules, losses can be carried forward indefinitely against future trading profits of the same trade.</p>
          <p><em>Tax liability for this year: \u00a30.00</em></p>
        </div>
        `}

        ${taxYearTotals.uncategorised > 0 ? `
        <h2>7. Data Quality Warning</h2>
        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
          <p><strong>\u26a0\ufe0f ${taxYearTotals.uncategorised} uncategorised transaction(s)</strong></p>
          <p>Please review and categorise all transactions for accurate HMRC reporting.</p>
          <p style="font-size:12px;">Uncategorised transactions are excluded from HMRC box mapping and may affect your tax calculation.</p>
        </div>
        ` : ''}

        <h2>8. Key Dates & Payment Schedule</h2>
        <table>
          <tr><td>Tax year end</td><td>${periodEnd}</td></tr>
          <tr><td>Filing deadline (online)</td><td>31 January ${parseInt(selectedTaxYear.split('-')[1]) + 1}</td></tr>
          <tr><td>Payment on account (1st)</td><td>31 January ${parseInt(selectedTaxYear.split('-')[1]) + 1}</td></tr>
          <tr><td>Payment on account (2nd)</td><td>31 July ${parseInt(selectedTaxYear.split('-')[1]) + 1}</td></tr>
          <tr><td>Balancing payment</td><td>31 January ${parseInt(selectedTaxYear.split('-')[1]) + 2}</td></tr>
        </table>

        <h2>9. Declaration</h2>
        <div class="highlight">
          <p>I declare that the information provided is true and complete to the best of my knowledge.</p>
          <br/>
          <table style="margin: 0;">
            <tr><td>Name</td><td>${tp.fullName || '________________________'}</td></tr>
            <tr><td>Date</td><td>${today}</td></tr>
            <tr><td>Signature</td><td>________________________</td></tr>
          </table>
        </div>

        ${getPremiumFooter('UTR: ' + (tp.utr || 'N/A') + ' | NI: ' + (tp.nationalInsuranceNumber || 'N/A'))}
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const generateCT600Report = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({ title: 'Error', description: 'Please allow popups to generate PDF', variant: 'destructive' });
      return;
    }

    const tp = taxpayerProfile;
    const taxYear = taxYears.find(ty => ty.value === selectedTaxYear);
    const today = new Date().toLocaleDateString('en-GB');
    const periodStart = taxYear?.start.toLocaleDateString('en-GB') || 'Not set';
    const periodEnd = taxYear?.end.toLocaleDateString('en-GB') || 'Not set';
    const expenseCats = categoryBreakdown.filter(c => c.type === 'expense');
    const incomeCats = categoryBreakdown.filter(c => c.type === 'income');
    const ctRate = taxYearTotals.netProfit <= 50000 ? 0.19 : taxYearTotals.netProfit <= 250000 ? 0.265 : 0.25;
    const ctRateLabel = taxYearTotals.netProfit <= 50000 ? '19% (Small Profits)' : taxYearTotals.netProfit <= 250000 ? '26.5% (Marginal Relief)' : '25% (Main Rate)';
    const ctAmount = Math.max(0, taxYearTotals.netProfit * ctRate);
    const marginalRelief = taxYearTotals.netProfit > 50000 && taxYearTotals.netProfit <= 250000
      ? (250000 - taxYearTotals.netProfit) * (3/200) : 0;
    const ctAfterRelief = Math.max(0, ctAmount - marginalRelief);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html><head><title>Companies House Statutory Accounts & CT600 - ${selectedTaxYear}</title>
      <style>${getPremiumPDFStyles('#1e3a8a', '#eff6ff', '#2563eb')}</style>
      </head><body>
        ${getPremiumHeader(tp.companyName || tp.tradingName || 'HomeLedger', 'Statutory Accounts & CT600 Corporation Tax Return', [
          { label: 'CRN', value: tp.companyRegistrationNumber || 'Not set' },
          { label: 'Accounting Period', value: selectedTaxYear },
          { label: 'Period', value: `${periodStart} to ${periodEnd}` },
          { label: 'Generated', value: today },
        ])}

        <h2>1. Company Information</h2>
        <table>
          <tr><td style="width:40%">Company Name</td><td>${tp.companyName || tp.tradingName || '-'}</td></tr>
          <tr><td>Registration Number (CRN)</td><td>${tp.companyRegistrationNumber || '-'}</td></tr>
          <tr><td>Company UTR</td><td>${tp.companyUtr || tp.utr || '-'}</td></tr>
          <tr><td>Registered Office</td><td>${[tp.addressLine1, tp.city, tp.postcode].filter(Boolean).join(', ') || '-'}</td></tr>
          <tr><td>Trading Name</td><td>${tp.tradingName || tp.companyName || '-'}</td></tr>
          <tr><td>Accounting Basis</td><td>${tp.accountingBasis || 'Accruals Basis'}</td></tr>
          <tr><td>VAT Registered</td><td>${tp.isVatRegistered ? 'Yes - ' + (tp.vatRegistrationNumber || '') : 'No'}</td></tr>
          ${tp.isVatRegistered ? `<tr><td>VAT Scheme</td><td>${tp.vatScheme || 'Standard'}</td></tr>` : ''}
          <tr><td>Director(s)</td><td>${tp.fullName || '-'}</td></tr>
        </table>

        <h2>2. Profit &amp; Loss Account</h2>
        <table>
          <tr style="background:#f3f4f6"><th>Description</th><th class="amt">Amount (£)</th></tr>
          <tr style="background:#f0fdf4"><td colspan="2" style="font-weight:bold;color:#059669">TURNOVER</td></tr>
          ${incomeCats.map(c => `<tr><td style="padding-left:20px">${c.name}</td><td class="amt">${c.amount.toFixed(2)}</td></tr>`).join('')}
          <tr class="subtotal-row"><td>Total Turnover</td><td class="amt">${taxYearTotals.credits.toFixed(2)}</td></tr>
          
          <tr style="background:#fef2f2"><td colspan="2" style="font-weight:bold;color:#dc2626">COST OF SALES &amp; ADMINISTRATIVE EXPENSES</td></tr>
          ${expenseCats.map(c => `<tr><td style="padding-left:20px">${c.name} <span style="color:#6b7280;font-size:11px">(${c.count} txns)</span></td><td class="amt">(${c.amount.toFixed(2)})</td></tr>`).join('')}
          <tr class="subtotal-row"><td>Total Expenses</td><td class="amt">(${taxYearTotals.debits.toFixed(2)})</td></tr>

          <tr class="total-row" style="font-size:15px"><td>Net Profit / (Loss) Before Tax</td><td class="amt" style="color:${taxYearTotals.netProfit >= 0 ? '#059669' : '#dc2626'}">${taxYearTotals.netProfit >= 0 ? '' : '('}${Math.abs(taxYearTotals.netProfit).toFixed(2)}${taxYearTotals.netProfit < 0 ? ')' : ''}</td></tr>
          <tr><td>Corporation Tax</td><td class="amt">(${ctAfterRelief.toFixed(2)})</td></tr>
          <tr class="total-row" style="font-size:15px"><td>Net Profit / (Loss) After Tax</td><td class="amt" style="color:${(taxYearTotals.netProfit - ctAfterRelief) >= 0 ? '#059669' : '#dc2626'}">${(taxYearTotals.netProfit - ctAfterRelief).toFixed(2)}</td></tr>
        </table>

        <h2>3. Balance Sheet (Summary)</h2>
        <table>
          <tr style="background:#f3f4f6"><th>Description</th><th class="amt">Amount (£)</th></tr>
          <tr style="background:#f0fdf4"><td colspan="2" style="font-weight:bold">CURRENT ASSETS</td></tr>
          <tr><td style="padding-left:20px">Cash at Bank</td><td class="amt">${Math.max(0, taxYearTotals.credits - taxYearTotals.debits).toFixed(2)}</td></tr>
          <tr><td style="padding-left:20px">Trade Debtors</td><td class="amt">${(reportSummary?.invoiceTotals?.totalIncome || 0).toFixed(2)}</td></tr>
          <tr class="subtotal-row"><td>Total Current Assets</td><td class="amt">${(Math.max(0, taxYearTotals.credits - taxYearTotals.debits) + (reportSummary?.invoiceTotals?.totalIncome || 0)).toFixed(2)}</td></tr>

          <tr style="background:#fef2f2"><td colspan="2" style="font-weight:bold">CURRENT LIABILITIES</td></tr>
          <tr><td style="padding-left:20px">Trade Creditors</td><td class="amt">(${(reportSummary?.totalMonthlyCommitments || 0).toFixed(2)})</td></tr>
          <tr><td style="padding-left:20px">Corporation Tax Liability</td><td class="amt">(${ctAfterRelief.toFixed(2)})</td></tr>
          ${tp.isVatRegistered ? `<tr><td style="padding-left:20px">VAT Liability</td><td class="amt">(${((taxYearTotals.credits * 0.20) - (dualRealityTotals.allowableExpenses * 0.20)).toFixed(2)})</td></tr>` : ''}

          <tr class="total-row" style="font-size:15px"><td>NET ASSETS</td><td class="amt">${(taxYearTotals.netProfit - ctAfterRelief).toFixed(2)}</td></tr>
          
          <tr><td colspan="2" style="height:10px;border:none"></td></tr>
          <tr style="background:#f3f4f6"><td colspan="2" style="font-weight:bold">CAPITAL &amp; RESERVES</td></tr>
          <tr><td style="padding-left:20px">Retained Earnings</td><td class="amt">${(taxYearTotals.netProfit - ctAfterRelief).toFixed(2)}</td></tr>
          <tr class="total-row"><td>Total Shareholders' Funds</td><td class="amt">${(taxYearTotals.netProfit - ctAfterRelief).toFixed(2)}</td></tr>
        </table>

        <h2>4. Corporation Tax Computation (CT600)</h2>
        <div class="ct-box">
          <table style="margin:0">
            <tr style="background:#f3f4f6"><th>CT600 Box</th><th>Description</th><th class="amt">Amount (£)</th></tr>
            <tr><td>Box 145</td><td>Turnover</td><td class="amt">${taxYearTotals.credits.toFixed(2)}</td></tr>
            <tr><td>Box 155</td><td>Gross Profit</td><td class="amt">${taxYearTotals.credits.toFixed(2)}</td></tr>
            <tr><td>Box 190</td><td>Total Allowable Expenses</td><td class="amt">${dualRealityTotals.allowableExpenses.toFixed(2)}</td></tr>
            <tr><td>Box 195</td><td>Net Trading Profit</td><td class="amt">${dualRealityTotals.taxableProfit.toFixed(2)}</td></tr>
            <tr><td>Box 235</td><td>Total Profits Chargeable to CT</td><td class="amt">${Math.max(0, dualRealityTotals.taxableProfit).toFixed(2)}</td></tr>
            <tr><td>Box 440</td><td>Tax Chargeable (${ctRateLabel})</td><td class="amt">${ctAmount.toFixed(2)}</td></tr>
            ${marginalRelief > 0 ? `<tr><td>Box 445</td><td>Marginal Relief</td><td class="amt">(${marginalRelief.toFixed(2)})</td></tr>` : ''}
            <tr class="total-row" style="font-size:15px"><td>Box 475</td><td>CT Payable</td><td class="amt">${ctAfterRelief.toFixed(2)}</td></tr>
          </table>
          <p style="font-size:12px;color:#6b7280;margin-top:10px;">
            CT Rate: ${ctRateLabel} | Small Profits Rate applies to profits ≤ £50,000 | Main Rate (25%) for profits > £250,000 | Marginal Relief for profits £50,001 - £250,000
          </p>
        </div>

        <h2>5. Tax Adjustments</h2>
        <div class="ch-box">
          <table style="margin:0">
            <tr><td>Net profit per accounts</td><td class="amt">${taxYearTotals.netProfit.toFixed(2)}</td></tr>
            <tr><td>Add back: Disallowable expenses (${100 - dualRealityTotals.percentAllowable}% non-deductible)</td><td class="amt">${dualRealityTotals.nonDeductible.toFixed(2)}</td></tr>
            <tr><td>Less: Allowable deductions already included</td><td class="amt">(${dualRealityTotals.allowableExpenses.toFixed(2)})</td></tr>
            <tr class="total-row"><td>Adjusted Profit for CT purposes</td><td class="amt">${Math.max(0, dualRealityTotals.taxableProfit).toFixed(2)}</td></tr>
          </table>
        </div>

        ${hmrcBreakdown.length > 0 ? `
        <h2>6. Expense Analysis by Category</h2>
        <table>
          <tr style="background:#f3f4f6"><th>Category Group</th><th>Your Categories</th><th class="amt">Amount (£)</th></tr>
          ${hmrcBreakdown.map(h => `<tr><td>${h.label}</td><td>${h.matched.join(', ') || '-'}</td><td class="amt">${h.total.toFixed(2)}</td></tr>`).join('')}
          <tr class="total-row"><td colspan="2">Total Categorised Expenses</td><td class="amt">${hmrcBreakdown.reduce((s, h) => s + h.total, 0).toFixed(2)}</td></tr>
        </table>
        ` : ''}

        <h2>7. Key Filing Dates</h2>
        <table>
          <tr><td>Accounting period end</td><td>${periodEnd}</td></tr>
          <tr><td>Annual accounts due (Companies House)</td><td>9 months after period end</td></tr>
          <tr><td>CT600 filing deadline (HMRC)</td><td>12 months after period end</td></tr>
          <tr><td>Corporation Tax payment due</td><td>9 months + 1 day after period end</td></tr>
          <tr><td>Confirmation statement due</td><td>Within 14 days of anniversary</td></tr>
        </table>

        <h2>8. Directors' Declaration</h2>
        <div class="highlight">
          <p>The directors acknowledge their responsibility for preparing the accounts in accordance with applicable law and regulations.</p>
          <p>These accounts have been prepared in accordance with the provisions applicable to companies subject to the small companies regime under the Companies Act 2006.</p>
          <br/>
          <table style="margin: 0;">
            <tr><td>Director</td><td>${tp.fullName || '________________________'}</td></tr>
            <tr><td>Approved on</td><td>${today}</td></tr>
            <tr><td>Signature</td><td>________________________</td></tr>
          </table>
        </div>

        ${getPremiumFooter('CRN: ' + (tp.companyRegistrationNumber || 'N/A') + ' | UTR: ' + (tp.companyUtr || tp.utr || 'N/A'))}
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const generateVATReturn = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({ title: 'Error', description: 'Please allow popups to generate PDF', variant: 'destructive' });
      return;
    }

    const tp = taxpayerProfile;
    const taxYear = taxYears.find(ty => ty.value === selectedTaxYear);
    const today = new Date().toLocaleDateString('en-GB');
    const periodStart = taxYear?.start.toLocaleDateString('en-GB') || 'Not set';
    const periodEnd = taxYear?.end.toLocaleDateString('en-GB') || 'Not set';
    const outputVAT = taxYearTotals.credits * 0.20;
    const inputVAT = dualRealityTotals.allowableExpenses * 0.20;
    const netVAT = outputVAT - inputVAT;
    const incomeCats = categoryBreakdown.filter(c => c.type === 'income');
    const expenseCats = categoryBreakdown.filter(c => c.type === 'expense');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html><head><title>VAT Return (VAT100) - ${selectedTaxYear}</title>
      <style>
        ${getPremiumPDFStyles('#6d28d9', '#f5f3ff', '#8b5cf6')}
        .net-row { background: #dbeafe !important; font-weight: bold; font-size: 15px; }
      </style>
      </head><body>
        ${getPremiumHeader(tp.companyName || tp.tradingName || tp.fullName || 'HomeLedger', 'VAT Return (VAT100)', [
          { label: 'VRN', value: tp.vatRegistrationNumber || 'Not set' },
          { label: 'Scheme', value: tp.vatScheme || 'Standard' },
          { label: 'Period', value: `${periodStart} to ${periodEnd}` },
          { label: 'Generated', value: today },
        ])}

        <h2>1. VAT Return Boxes</h2>
        <table>
          <tr style="background:#f3f4f6"><th style="width:80px">Box</th><th>Description</th><th class="amt" style="width:140px">Amount (£)</th></tr>
          <tr><td><strong>Box 1</strong></td><td>VAT due in the period on sales and other outputs</td><td class="amt">${outputVAT.toFixed(2)}</td></tr>
          <tr><td><strong>Box 2</strong></td><td>VAT due on acquisitions from other EC member states</td><td class="amt">0.00</td></tr>
          <tr class="total-row"><td><strong>Box 3</strong></td><td>Total VAT due (Box 1 + Box 2)</td><td class="amt">${outputVAT.toFixed(2)}</td></tr>
          <tr><td><strong>Box 4</strong></td><td>VAT reclaimed on purchases and other inputs</td><td class="amt">${inputVAT.toFixed(2)}</td></tr>
          <tr class="net-row"><td><strong>Box 5</strong></td><td>Net VAT to ${netVAT >= 0 ? 'pay HMRC' : 'reclaim from HMRC'}</td><td class="amt" style="color:${netVAT >= 0 ? '#dc2626' : '#2563eb'}">${netVAT >= 0 ? '' : '('}${Math.abs(netVAT).toFixed(2)}${netVAT < 0 ? ')' : ''}</td></tr>
          <tr><td colspan="3" style="height:5px;border:none"></td></tr>
          <tr><td><strong>Box 6</strong></td><td>Total value of sales excluding VAT</td><td class="amt">${taxYearTotals.credits.toFixed(2)}</td></tr>
          <tr><td><strong>Box 7</strong></td><td>Total value of purchases excluding VAT</td><td class="amt">${taxYearTotals.debits.toFixed(2)}</td></tr>
          <tr><td><strong>Box 8</strong></td><td>Total value of supplies to EC member states excluding VAT</td><td class="amt">0.00</td></tr>
          <tr><td><strong>Box 9</strong></td><td>Total value of acquisitions from EC member states excluding VAT</td><td class="amt">0.00</td></tr>
        </table>

        <h2>2. Output VAT Analysis (Sales)</h2>
        <table>
          <tr style="background:#f3f4f6"><th>Category</th><th class="amt">Net Sales (£)</th><th class="amt">VAT @ 20% (£)</th></tr>
          ${incomeCats.map(c => `<tr><td>${c.name}</td><td class="amt">${c.amount.toFixed(2)}</td><td class="amt">${(c.amount * 0.20).toFixed(2)}</td></tr>`).join('')}
          <tr class="total-row"><td>Total Output VAT</td><td class="amt">${taxYearTotals.credits.toFixed(2)}</td><td class="amt">${outputVAT.toFixed(2)}</td></tr>
        </table>

        <h2>3. Input VAT Analysis (Purchases)</h2>
        <table>
          <tr style="background:#f3f4f6"><th>Category</th><th class="amt">Net Purchases (£)</th><th class="amt">VAT @ 20% (£)</th></tr>
          ${expenseCats.map(c => `<tr><td>${c.name}</td><td class="amt">${c.amount.toFixed(2)}</td><td class="amt">${(c.amount * 0.20).toFixed(2)}</td></tr>`).join('')}
          <tr class="total-row"><td>Total Input VAT</td><td class="amt">${taxYearTotals.debits.toFixed(2)}</td><td class="amt">${inputVAT.toFixed(2)}</td></tr>
        </table>

        <h2>4. Payment Information</h2>
        <table>
          <tr><td>VAT due</td><td class="amt" style="color:${netVAT >= 0 ? '#dc2626' : '#2563eb'};font-weight:bold">\u00a3${Math.abs(netVAT).toFixed(2)} ${netVAT >= 0 ? 'to pay' : 'refund'}</td></tr>
          <tr><td>Payment deadline</td><td>1 month + 7 days after VAT period end</td></tr>
          <tr><td>Payment methods</td><td>Direct Debit, BACS, CHAPS, Online Banking</td></tr>
          <tr><td>MTD submission</td><td>Must be submitted digitally via Making Tax Digital compatible software</td></tr>
        </table>

        <div style="background:#fef3c7;padding:15px;border-radius:8px;border-left:4px solid #f59e0b;margin:20px 0">
          <p style="font-weight:bold;margin:0 0 5px 0">\u26a0\ufe0f Important Notes</p>
          <p style="font-size:13px;margin:0">All VAT has been calculated at the standard rate (20%). If you have reduced-rate (5%), zero-rated, or exempt supplies, these figures will need manual adjustment. This report is for guidance only and should be reviewed before MTD submission.</p>
        </div>

        ${getPremiumFooter('VRN: ' + (tp.vatRegistrationNumber || 'N/A') + ' | ' + (tp.companyName || tp.tradingName || tp.fullName || ''))}
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const generatePDF = (type: string, data: Record<string, unknown>) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({ title: 'Error', description: 'Please allow popups to generate PDF', variant: 'destructive' });
      return;
    }

    const title = type === 'summary' ? 'Full Financial Summary' : 
                  type === 'bills' ? 'Bills Report' :
                  type === 'invoices' ? 'Invoices Report' :
                  type === 'statements' ? 'Bank Statements Report' :
                  type === 'categories' ? 'Categories Breakdown' : 'Financial Report';

    const fmt = (n: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n);
    let content = '';
    
    if (type === 'summary') {
      const s = (data.summary || data) as Record<string, any>;
      content = `
        <h2>Financial Summary</h2>
        <table>
          <tr><td>Total Income (Credits)</td><td class="amt">${fmt(s.totalCredits || taxYearTotals.credits || 0)}</td></tr>
          <tr><td>Total Expenses (Debits)</td><td class="amt">${fmt(s.totalDebits || taxYearTotals.debits || 0)}</td></tr>
          <tr class="total-row"><td>Net Position</td><td class="amt">${fmt(s.netProfit || taxYearTotals.netProfit || 0)}</td></tr>
          <tr><td>Monthly Commitments</td><td class="amt">${fmt(s.totalMonthlyCommitments || 0)}</td></tr>
          <tr><td>Active Bills</td><td>${s.totalActiveBills || 0}</td></tr>
          <tr><td>Total Transactions</td><td>${s.totalTransactions || filteredTransactions.length || 0}</td></tr>
        </table>
        <h2>Category Breakdown</h2>
        <table><tr><th>Category</th><th>Type</th><th class="amt">Amount</th></tr>
        ${categoryBreakdown.map(c => `<tr><td>${c.name}</td><td>${c.type}</td><td class="amt">${fmt(c.amount)}</td></tr>`).join('')}
        </table>
      `;
    } else if (type === 'bills') {
      const bills = (data.bills || []) as Array<Record<string, any>>;
      const total = bills.reduce((s, b) => s + (b.amount || 0), 0);
      content = `
        <h2>Bills (${bills.length})</h2>
        <table><tr><th>Bill Name</th><th>Provider</th><th>Category</th><th>Frequency</th><th class="amt">Amount</th></tr>
        ${bills.map(b => `<tr><td>${b.billName || ''}</td><td>${b.provider || ''}</td><td>${b.category || ''}</td><td>${b.frequency || ''}</td><td class="amt">${fmt(b.amount || 0)}</td></tr>`).join('')}
        <tr class="total-row"><td colspan="4">Total</td><td class="amt">${fmt(total)}</td></tr>
        </table>
      `;
    } else if (type === 'invoices') {
      const invoices = (data.invoices || []) as Array<Record<string, any>>;
      const total = invoices.reduce((s, i) => s + (i.amount || 0), 0);
      content = `
        <h2>Invoices (${invoices.length})</h2>
        <table><tr><th>Provider</th><th>Invoice #</th><th>Date</th><th>Status</th><th class="amt">Amount</th></tr>
        ${invoices.map(i => `<tr><td>${i.providerName || ''}</td><td>${i.invoiceNumber || ''}</td><td>${i.invoiceDate ? new Date(i.invoiceDate).toLocaleDateString('en-GB') : ''}</td><td>${i.status || ''}</td><td class="amt">${fmt(i.amount || 0)}</td></tr>`).join('')}
        <tr class="total-row"><td colspan="4">Total</td><td class="amt">${fmt(total)}</td></tr>
        </table>
      `;
    } else if (type === 'statements') {
      const txs = (data.transactions || []) as Array<Record<string, any>>;
      const credits = txs.filter(t => t.type === 'credit').reduce((s, t) => s + Math.abs(t.amount || 0), 0);
      const debits = txs.filter(t => t.type === 'debit').reduce((s, t) => s + Math.abs(t.amount || 0), 0);
      content = `
        <h2>Transactions (${txs.length})</h2>
        <div class="highlight"><strong>Credits:</strong> ${fmt(credits)} | <strong>Debits:</strong> ${fmt(debits)} | <strong>Net:</strong> ${fmt(credits - debits)}</div>
        <table><tr><th>Date</th><th>Description</th><th>Category</th><th>Type</th><th class="amt">Amount</th></tr>
        ${txs.slice(0, 500).map(t => `<tr><td>${t.date ? new Date(t.date).toLocaleDateString('en-GB') : ''}</td><td>${t.description || ''}</td><td>${t.category || ''}</td><td>${t.type || ''}</td><td class="amt">${fmt(Math.abs(t.amount || 0))}</td></tr>`).join('')}
        </table>
        ${txs.length > 500 ? `<p><em>Showing first 500 of ${txs.length} transactions</em></p>` : ''}
      `;
    } else if (type === 'categories') {
      const cats = (data.categories || categoryBreakdown) as Array<Record<string, any>>;
      content = `
        <h2>Categories</h2>
        <table><tr><th>Category</th><th>Type</th><th>HMRC Mapping</th><th>Transactions</th><th class="amt">Amount</th></tr>
        ${cats.map(c => `<tr><td>${c.name || ''}</td><td>${c.type || ''}</td><td>${c.hmrcMapping || '-'}</td><td>${c.transactionCount || c.count || ''}</td><td class="amt">${fmt(c.amount || c.total || 0)}</td></tr>`).join('')}
        </table>
      `;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html><head><title>${title} - HomeLedger</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 30px; max-width: 900px; margin: 0 auto; color: #333; line-height: 1.5; }
        h1 { color: #1e3a8a; border-bottom: 3px solid #3b82f6; padding-bottom: 10px; }
        h2 { color: #1e40af; background: #eff6ff; padding: 10px; margin: 25px 0 15px; border-left: 4px solid #3b82f6; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0 20px; font-size: 13px; }
        th, td { border: 1px solid #d1d5db; padding: 8px 10px; text-align: left; }
        th { background: #f3f4f6; font-weight: bold; }
        tr:nth-child(even) { background: #f9fafb; }
        .total-row { background: #dbeafe !important; font-weight: bold; }
        .amt { text-align: right; font-variant-numeric: tabular-nums; }
        .highlight { background: #eff6ff; padding: 12px 16px; border-radius: 8px; margin: 10px 0; }
        .footer { margin-top: 40px; padding-top: 15px; border-top: 2px solid #e5e7eb; color: #9ca3af; font-size: 11px; }
        @media print { body { padding: 0; } h2 { page-break-after: avoid; } table { page-break-inside: avoid; } }
      </style>
      </head><body>
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div><h1>HomeLedger</h1><p style="color:#6b7280;margin-top:-10px;">${title}</p></div>
          <div style="text-align:right;color:#6b7280;font-size:13px;">
            <p><strong>Tax Year:</strong> ${selectedTaxYear}</p>
            <p><strong>Generated:</strong> ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>
        ${content}
        <div class="footer">
          <p>Generated by HomeLedger | All amounts in GBP | Verify all figures before use</p>
        </div>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleCreateBudget = async () => {
    if (!newBudget.categoryId || !newBudget.amount) {
      toast({ title: 'Required fields missing', variant: 'destructive' });
      return;
    }
    try {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: newBudget.categoryId,
          amount: parseFloat(newBudget.amount),
          alertAt: parseFloat(newBudget.alertAt) || 80,
        }),
      });
      if (res.ok) {
        toast({ title: 'Budget Created' });
        setShowBudgetDialog(false);
        setNewBudget({ categoryId: '', amount: '', alertAt: '80' });
        fetchData();
      } else {
        const error = await res.json();
        toast({ title: error.error || 'Failed', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Create budget error:', error);
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const handleDeleteBudget = async (id: string) => {
    try {
      await fetch(`/api/budgets/${id}`, { method: 'DELETE' });
      toast({ title: 'Budget Deleted' });
      fetchData();
    } catch (error) {
      console.error('Delete error:', error);
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount);
  };

  const expenseCategories = categories.filter(c => c.type === 'expense');
  const categoriesWithoutBudget = expenseCategories.filter(c => !budgets.some(b => b.categoryId === c.id));
  const alertBudgets = budgets.filter(b => b.isOverBudget || b.isNearLimit);

  // Calculate dual reality totals
  const dualRealityTotals = useMemo(() => {
    let bankOutflow = 0;
    let bankIncome = 0;
    let allowableExpenses = 0;

    filteredTransactions.forEach(tx => {
      const category = categories.find(c => c.id === tx.categoryId);
      const deductPercent = tx.appliedDeductibilityPercent ?? (category?.defaultDeductibilityPercent ?? 0);
      const allowable = tx.amount * (deductPercent / 100);

      if (tx.type === 'debit') {
        bankOutflow += tx.amount;
        allowableExpenses += allowable;
      } else {
        bankIncome += tx.amount;
      }
    });

    return {
      bankOutflow,
      bankIncome,
      allowableExpenses,
      nonDeductible: bankOutflow - allowableExpenses,
      taxableProfit: bankIncome - allowableExpenses,
      percentAllowable: bankOutflow > 0 ? Math.round((allowableExpenses / bankOutflow) * 100) : 0,
    };
  }, [filteredTransactions, categories]);

  // Tax Calculation — uses deductibility-adjusted taxable profit, not raw net profit
  const taxEstimate = useMemo(() => {
    // For HMRC self-assessment: taxable profit = income - allowable expenses (deductibility-adjusted)
    // For Companies House: use raw net profit (CT handles deductibility differently)
    const taxableProfit = entityRegime === 'companies_house'
      ? taxYearTotals.netProfit
      : dualRealityTotals.taxableProfit;
    return calculateUKTax(Math.max(0, taxableProfit));
  }, [taxYearTotals.netProfit, dualRealityTotals.taxableProfit, entityRegime]);

  if (loading) {
    return (<div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>);
  }

  // Handle category change for a transaction - transaction disappears from current list immediately
  const handleChangeTransactionCategory = async (txId: string, newCatId: string) => {
    setSavingTransaction(true);
    try {
      const res = await fetch(`/api/statements/transactions/${txId}/categorize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId: newCatId, learn: false }),
      });
      if (res.ok) {
        const newCategory = categories.find(c => c.id === newCatId);
        const deductPercent = (newCategory as CategoryWithDeductibility)?.defaultDeductibilityPercent || 0;
        
        // IMMEDIATELY mark this transaction as moved so it disappears from the list
        setMovedTransactionIds(prev => [...prev, txId]);
        
        // Also update the underlying data
        setAllTransactions(prev => prev.map(tx => 
          tx.id === txId 
            ? { 
                ...tx, 
                categoryId: newCatId, 
                category: newCategory ? {
                  id: newCategory.id,
                  name: newCategory.name,
                  type: newCategory.type,
                  color: newCategory.color,
                  icon: newCategory.icon,
                  description: newCategory.description,
                } as Category : null 
              } 
            : tx
        ));
        
        setEditingTxCategory(null);
        setNewCategoryId('');
        
        toast({ 
          title: '✅ Moved!', 
          description: `Transaction moved to "${newCategory?.name}" (${deductPercent}% deductible)` 
        });
      }
    } catch (error) {
      console.error('Error updating category:', error);
      toast({ title: 'Error', description: 'Failed to update category', variant: 'destructive' });
    } finally {
      setSavingTransaction(false);
    }
  };

  // Get deductibility color based on percentage
  const getDeductibilityColor = (percent: number) => {
    if (percent === 100) return 'text-green-600';
    if (percent >= 50) return 'text-amber-600';
    if (percent > 0) return 'text-orange-500';
    return 'text-red-500';
  };

  // Get deductibility badge for dropdown
  const getDeductibilityBadge = (percent: number) => {
    if (percent === 100) return '💰 100%';
    if (percent >= 50) return `⚡ ${percent}%`;
    if (percent > 0) return `📉 ${percent}%`;
    return '❌ 0%';
  };

  // Transaction List Component for modals with inline editing - shows deductibility % to help reduce tax
  const TransactionList = ({ transactions, showCategory = true }: { 
    transactions: BankTransaction[]; 
    showCategory?: boolean;
  }) => {
    // Filter out moved transactions for display
    const visibleTransactions = transactions.filter(tx => !movedTransactionIds.includes(tx.id));
    
    // Calculate live totals for the VISIBLE transactions only
    const liveTotal = visibleTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    const liveCount = visibleTransactions.length;

    return (
      <div className="space-y-2">
        {/* Live totals bar */}
        <div className="flex items-center justify-between px-2 py-1 bg-muted/50 rounded text-sm">
          <span className="font-medium">{liveCount} transaction(s)</span>
          <span className="font-bold text-red-600">Total: {formatCurrency(liveTotal)}</span>
        </div>
        
        <div className="max-h-[400px] overflow-y-auto">
          {visibleTransactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No transactions in this category</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Category (% Deductible)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleTransactions.map(tx => {
                  const currentDeductibility = (categories.find(c => c.id === tx.categoryId) as CategoryWithDeductibility)?.defaultDeductibilityPercent || 0;
                  
                  return (
                    <TableRow key={tx.id} className={tx.isApproved ? 'bg-green-50 dark:bg-green-950/20' : ''}>
                      <TableCell className="text-sm">{new Date(tx.date).toLocaleDateString('en-GB')}</TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate" title={tx.description}>{tx.description}</TableCell>
                      <TableCell className={`text-right font-medium ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </TableCell>
                      <TableCell>
                        {editingTxCategory === tx.id ? (
                          <div className="flex items-center gap-1">
                            <Select value={newCategoryId} onValueChange={setNewCategoryId}>
                              <SelectTrigger className="h-8 w-[180px] text-xs">
                                <SelectValue placeholder="Select category..." />
                              </SelectTrigger>
                              <SelectContent className="max-h-[300px]">
                                {categories
                                  .filter(c => (tx.type === 'debit' && c.type === 'expense') || (tx.type === 'credit' && c.type === 'income'))
                                  .sort((a, b) => ((b as CategoryWithDeductibility).defaultDeductibilityPercent || 0) - ((a as CategoryWithDeductibility).defaultDeductibilityPercent || 0))
                                  .map(c => {
                                    const deduct = (c as CategoryWithDeductibility).defaultDeductibilityPercent || 0;
                                    return (
                                      <SelectItem key={c.id} value={c.id} className="flex items-center">
                                        <span className="flex items-center gap-2">
                                          <span className={`text-xs font-bold ${getDeductibilityColor(deduct)}`}>
                                            {getDeductibilityBadge(deduct)}
                                          </span>
                                          <span>{c.name}</span>
                                        </span>
                                      </SelectItem>
                                    );
                                  })}
                              </SelectContent>
                            </Select>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-7 w-7 p-0"
                              onClick={() => newCategoryId && handleChangeTransactionCategory(tx.id, newCategoryId)}
                              disabled={!newCategoryId || savingTransaction}
                            >
                              {savingTransaction ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 text-green-600" />}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-7 w-7 p-0"
                              onClick={() => { setEditingTxCategory(null); setNewCategoryId(''); }}
                            >
                              <X className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="text-xs">
                              {tx.category?.name || 'Uncategorised'}
                            </Badge>
                            <span className={`text-xs font-bold ${getDeductibilityColor(currentDeductibility)}`}>
                              {currentDeductibility}%
                            </span>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
                              onClick={() => { setEditingTxCategory(tx.id); setNewCategoryId(tx.categoryId || ''); }}
                              title="Change category"
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {tx.isApproved ? (
                          <Badge className="bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300"><Check className="h-3 w-3 mr-1" /> Approved</Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-600">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {!tx.isApproved && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="sm" variant="ghost" onClick={() => handleApproveTransaction(tx.id)} disabled={savingTransaction}>
                                    <Check className="h-4 w-4 text-green-600" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Approve</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="sm" variant="ghost" onClick={() => handleDeleteTransaction(tx.id)}>
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    );
  };

  return (
    <TooltipProvider>
    <div className="space-y-6">

      {/* Category Transactions Modal */}
      <Dialog open={showCategoryModal} onOpenChange={(open) => {
        setShowCategoryModal(open);
        if (!open) {
          // Clear moved transactions when modal closes so they show in their new category
          setMovedTransactionIds([]);
          setEditingTxCategory(null);
          setNewCategoryId('');
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              {selectedCategory?.name || 'Category'} Transactions
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              <span>💡 Move transactions to categories with higher % to reduce tax.</span>
              <span className="text-green-600 font-bold">💰100% = fully deductible</span>
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <TransactionList transactions={categoryTransactions} showCategory={false} />
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowCategoryModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* HMRC Box Transactions Modal */}
      <Dialog open={showHMRCBoxModal} onOpenChange={(open) => {
        setShowHMRCBoxModal(open);
        if (!open) {
          // Clear moved transactions when modal closes
          setMovedTransactionIds([]);
          setEditingTxCategory(null);
          setNewCategoryId('');
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Landmark className="h-5 w-5" />
              {selectedHMRCBox?.box} - {selectedHMRCBox?.label}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              <span>💡 Move transactions to the correct HMRC box to maximize deductions.</span>
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <TransactionList transactions={hmrcBoxTransactions} />
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowHMRCBoxModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deductibility Settings Modal */}
      <Dialog open={showDeductibilityModal} onOpenChange={setShowDeductibilityModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5" />
              Business Use % - {editingCategory?.name}
            </DialogTitle>
            <DialogDescription>
              Set the default percentage of expenses in this category that are tax deductible.
            </DialogDescription>
          </DialogHeader>
          {editingCategory && (
            <div className="py-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Deductibility:</span>
                <span className="text-2xl font-bold text-blue-600">{editingCategory.defaultDeductibilityPercent}%</span>
              </div>
              <Slider
                value={[editingCategory.defaultDeductibilityPercent]}
                onValueChange={([value]) => setEditingCategory({ ...editingCategory, defaultDeductibilityPercent: value })}
                max={100}
                min={0}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0% (Personal)</span>
                <span>50% (Mixed)</span>
                <span>100% (Business)</span>
              </div>
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-sm">
                {editingCategory.defaultDeductibilityPercent === 0 && (
                  <p className="text-blue-800 dark:text-blue-300"><strong>Personal Expense:</strong> Not tax deductible. Paid from post-tax profit.</p>
                )}
                {editingCategory.defaultDeductibilityPercent > 0 && editingCategory.defaultDeductibilityPercent < 100 && (
                  <p className="text-blue-800 dark:text-blue-300"><strong>Mixed Use:</strong> {editingCategory.defaultDeductibilityPercent}% is business use and tax deductible.</p>
                )}
                {editingCategory.defaultDeductibilityPercent === 100 && (
                  <p className="text-blue-800 dark:text-blue-300"><strong>Fully Deductible:</strong> 100% business expense. Reduces taxable profit.</p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeductibilityModal(false)}>Cancel</Button>
            <Button onClick={() => {
              if (editingCategory) {
                handleUpdateCategoryDeductibility(editingCategory.id, editingCategory.defaultDeductibilityPercent);
                setShowDeductibilityModal(false);
              }
            }}>
              <Save className="h-4 w-4 mr-2" /> Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Header with Report Gallery */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{t('reports.title')}</h1>
            <p className="text-muted-foreground">{entityRegime === 'companies_house' ? 'Company accounts, CT600 and financial reports' : 'Financial reports and HMRC tax calculations'}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Account Filter */}
            {accounts.length > 1 && (
              <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Accounts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Accounts</SelectItem>
                  {accounts.map(acc => (
                    <SelectItem key={acc.id} value={acc.id}>{acc.name} ({acc.bank})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {/* Tax Year */}
            <Select value={selectedTaxYear} onValueChange={setSelectedTaxYear}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select tax year" />
              </SelectTrigger>
              <SelectContent>
                {taxYears.map(ty => (
                  <SelectItem key={ty.value} value={ty.value}>{ty.label}</SelectItem>
                ))}
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
            {selectedTaxYear === 'custom' && (
              <div className="flex items-center gap-2">
                <Input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="w-[140px]" />
                <span className="text-muted-foreground text-sm">to</span>
                <Input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="w-[140px]" />
              </div>
            )}
          </div>
        </div>

        {/* Report Type Gallery */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-800' },
            { id: 'pnl', label: 'Profit & Loss', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/30', border: 'border-green-200 dark:border-green-800' },
            { id: 'hmrc', label: entityRegime === 'companies_house' ? 'CT600' : 'SA103', icon: Landmark, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800' },
            { id: 'vat', label: 'VAT Return', icon: Receipt, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/30', border: 'border-purple-200 dark:border-purple-800' },
            { id: 'balance', label: 'Balance Sheet', icon: Calculator, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/30', border: 'border-indigo-200 dark:border-indigo-800' },
            { id: 'transactions', label: 'Transactions', icon: FileSpreadsheet, color: 'text-slate-600', bg: 'bg-slate-50 dark:bg-slate-950/30', border: 'border-slate-200 dark:border-slate-800' },
            { id: 'aged', label: 'Aged Debtors', icon: ClipboardCheck, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-950/30', border: 'border-rose-200 dark:border-rose-800' },
            { id: 'cashflow', label: 'Cash Flow', icon: Wallet, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-950/30', border: 'border-teal-200 dark:border-teal-800' },
            { id: 'trialbalance', label: 'Trial Balance', icon: Filter, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/30', border: 'border-violet-200 dark:border-violet-800' },
            { id: 'generalledger', label: 'General Ledger', icon: FileText, color: 'text-sky-600', bg: 'bg-sky-50 dark:bg-sky-950/30', border: 'border-sky-200 dark:border-sky-800' },
            { id: 'breakdown', label: 'Tax Breakdown', icon: PieChart, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950/30', border: 'border-orange-200 dark:border-orange-800' },
            { id: 'profile', label: entityRegime === 'companies_house' ? 'Company' : 'Taxpayer', icon: User, color: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-950/30', border: 'border-cyan-200 dark:border-cyan-800' },
            { id: 'exports', label: 'Export All', icon: FileDown, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800' },
            { id: 'budgets', label: 'Budgets', icon: Briefcase, color: 'text-pink-600', bg: 'bg-pink-50 dark:bg-pink-950/30', border: 'border-pink-200 dark:border-pink-800' },
          ].map(report => {
            const Icon = report.icon;
            const isActive = activeReport === report.id;
            return (
              <button
                key={report.id}
                onClick={() => setActiveReport(report.id)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 ${
                  isActive
                    ? `${report.bg} ${report.border} shadow-md scale-[1.02]`
                    : 'border-transparent hover:border-border hover:bg-muted/50'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? report.color : 'text-muted-foreground'}`} />
                <span className={`text-xs font-medium text-center leading-tight ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {report.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Data Health Check Banner */}
      {taxYearTotals.uncategorised > 0 ? (
        <Card className="border-amber-400 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
                <div>
                  <p className="font-semibold text-amber-800 dark:text-amber-300">
                    ⚠️ {taxYearTotals.uncategorised} uncategorised transaction{taxYearTotals.uncategorised !== 1 ? 's' : ''} for this tax year
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-400">Your tax report may be inaccurate. Categorise all transactions for proper {entityRegime === 'companies_house' ? 'Companies House' : 'HMRC'} compliance.</p>
                </div>
              </div>
              <Button variant="outline" className="bg-card border-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30" onClick={() => window.location.href = '/statements?tab=uncategorised'}>
                Fix Categories <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-green-400 dark:border-green-800 bg-green-50 dark:bg-green-950/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-semibold text-green-800 dark:text-green-300">✓ Data Ready for Filing</p>
                <p className="text-sm text-green-700 dark:text-green-400">All {taxYearTotals.total} transactions are categorized for tax year {selectedTaxYear}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Business Income</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(taxYearTotals.businessIncome)}</p>
                {taxYearTotals.businessIncome !== taxYearTotals.credits && (
                  <p className="text-xs text-muted-foreground mt-0.5">Bank credits: {formatCurrency(taxYearTotals.credits)}</p>
                )}
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Business Expenses</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(taxYearTotals.businessExpenses)}</p>
                {taxYearTotals.businessExpenses !== taxYearTotals.debits && (
                  <p className="text-xs text-muted-foreground mt-0.5">Bank debits: {formatCurrency(taxYearTotals.debits)}</p>
                )}
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card className={taxYearTotals.netProfit >= 0 ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30' : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30'}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Net Profit</p>
                <p className={`text-2xl font-bold ${taxYearTotals.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(taxYearTotals.netProfit)}
                </p>
                {taxYearTotals.bankNetProfit !== taxYearTotals.netProfit && (
                  <p className="text-xs text-muted-foreground mt-0.5">Bank net: {formatCurrency(taxYearTotals.bankNetProfit)}</p>
                )}
              </div>
              <Wallet className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        {/* Tax Estimator or Loss Relief Card */}
        {taxYearTotals.netProfit > 0 ? (
          <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm text-muted-foreground">Estimated Tax</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{formatCurrency(taxEstimate.total)}</p>
                </div>
                <Tooltip>
                  <TooltipTrigger>
                    <Calculator className="h-8 w-8 text-blue-600" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="font-semibold mb-1">Tax Breakdown (2025/26):</p>
                    <p>Income Tax: {formatCurrency(taxEstimate.incomeTax)}</p>
                    <p>Class 4 NIC: {formatCurrency(taxEstimate.class4NIC)}</p>
                    {taxEstimate.class2NIC > 0 && <p>Class 2 NIC: {formatCurrency(taxEstimate.class2NIC)}</p>}
                    {taxEstimate.studentLoan > 0 && <p>Student Loan: {formatCurrency(taxEstimate.studentLoan)}</p>}
                    <p className="mt-1 text-xs">Effective rate: {taxEstimate.effectiveRate}% | Marginal: {taxEstimate.marginalRate}%</p>
                    {taxEstimate.personalAllowanceUsed < 12570 && <p className="text-xs text-amber-600">⚠ PA tapered to £{taxEstimate.personalAllowanceUsed.toLocaleString()}</p>}
                  </TooltipContent>
                </Tooltip>
              </div>
              {/* Tax Progress Bar */}
              <div className="mt-2">
                <div className="flex h-2 rounded-full overflow-hidden bg-muted">
                  <div className="bg-green-500" style={{ width: `${Math.min((12570 / taxYearTotals.netProfit) * 100, 100)}%` }} title="Tax Free" />
                  <div className="bg-yellow-500" style={{ width: `${Math.max(0, Math.min(((Math.min(taxYearTotals.netProfit, 50270) - 12570) / taxYearTotals.netProfit) * 100, 100 - (12570 / taxYearTotals.netProfit) * 100))}%` }} title="Basic Rate" />
                  {taxYearTotals.netProfit > 50270 && (
                    <div className="bg-red-500" style={{ width: `${((taxYearTotals.netProfit - 50270) / taxYearTotals.netProfit) * 100}%` }} title="Higher Rate" />
                  )}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>0%</span>
                  <span>20%</span>
                  {taxYearTotals.netProfit > 50270 && <span>40%</span>}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Info className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">Loss Relief Available</p>
                  <p className="text-lg font-bold text-blue-700">{formatCurrency(Math.abs(taxYearTotals.netProfit))}</p>
                  <p className="text-xs text-blue-600">Carry forward to next year</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ===== AI TAX FORECAST & COMPLIANCE ALERTS ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* AI Tax Forecast */}
        {taxForecast && (
          <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                AI Tax Forecast
                <Badge variant="outline" className="text-purple-600 border-purple-300 text-xs">Based on {taxForecast.monthsWithData} months</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2 rounded bg-white/60 dark:bg-slate-900/40">
                  <p className="text-xs text-muted-foreground">Projected Annual Income</p>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(taxForecast.projectedAnnualIncome)}</p>
                </div>
                <div className="p-2 rounded bg-white/60 dark:bg-slate-900/40">
                  <p className="text-xs text-muted-foreground">Projected Annual Expenses</p>
                  <p className="text-lg font-bold text-red-600">{formatCurrency(taxForecast.projectedAnnualExpenses)}</p>
                </div>
                <div className="p-2 rounded bg-white/60 dark:bg-slate-900/40">
                  <p className="text-xs text-muted-foreground">Projected Taxable Profit</p>
                  <p className={`text-lg font-bold ${taxForecast.projectedProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{formatCurrency(taxForecast.projectedProfit)}</p>
                </div>
                <div className="p-2 rounded bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                  <p className="text-xs text-muted-foreground">Projected Tax Bill</p>
                  <p className="text-lg font-bold text-amber-700 dark:text-amber-300">{formatCurrency(taxForecast.projectedTax)}</p>
                  <p className="text-xs text-muted-foreground">Effective rate: {taxForecast.effectiveRate.toFixed(1)}%</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {taxForecast.trend === 'improving' && <><TrendingUp className="h-3 w-3 text-green-500" /> Trend: Improving</>}
                {taxForecast.trend === 'declining' && <><TrendingDown className="h-3 w-3 text-red-500" /> Trend: Declining</>}
                {taxForecast.trend === 'stable' && <><ArrowRight className="h-3 w-3" /> Trend: Stable</>}
                <span className="ml-auto">Avg monthly: {formatCurrency(taxForecast.avgMonthlyIncome)} in / {formatCurrency(taxForecast.avgMonthlyExpenses)} out</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Compliance Alerts */}
        {complianceAlerts.length > 0 && (
          <Card className="border-slate-200 dark:border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                Compliance Alerts
                <Badge variant="outline" className={complianceAlerts.some(a => a.level === 'error') ? 'text-red-600 border-red-300' : 'text-amber-600 border-amber-300'}>
                  {complianceAlerts.filter(a => a.level === 'error').length} issues
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {complianceAlerts.map((alert, i) => (
                  <div key={i} className={`flex items-start gap-2 p-2 rounded text-sm ${
                    alert.level === 'error' ? 'bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300' :
                    alert.level === 'warning' ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300' :
                    'bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300'
                  }`}>
                    {alert.level === 'error' && <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-red-500" />}
                    {alert.level === 'warning' && <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-500" />}
                    {alert.level === 'info' && <Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-500" />}
                    <span className="flex-1">{alert.message}</span>
                    {alert.action && (
                      <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => window.location.href = alert.action!}>
                        Fix <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ===== DUAL REALITY SECTION ===== */}
      {/* Expense Reconciliation Card - Bank Reality vs Tax Reality */}
      <Card className="border-2 border-indigo-200 dark:border-indigo-800 bg-gradient-to-r from-slate-50 via-white to-green-50 dark:from-slate-900 dark:via-slate-900 dark:to-green-950/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-indigo-600" />
            Expense Reconciliation - The "Reality Check"
          </CardTitle>
          <CardDescription>
            Understanding the difference between what left your bank and what reduces your tax bill
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            {/* Bank Reality */}
            <Card className="bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700">
              <CardContent className="p-4 text-center">
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Bank Reality</p>
                <p className="text-sm text-muted-foreground">Total Money Out</p>
                <p className="text-3xl font-bold text-foreground mt-2">{formatCurrency(dualRealityTotals.bankOutflow)}</p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="mt-2 text-xs">
                      <HelpCircle className="h-3 w-3 mr-1" /> What's this?
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Total money that left your accounts - includes groceries, personal rent, and ALL spending.</p>
                  </TooltipContent>
                </Tooltip>
              </CardContent>
            </Card>

            {/* The Filter */}
            <div className="text-center py-4">
              <div className="inline-flex flex-col items-center">
                <div className="bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 rounded-lg px-4 py-2 mb-2">
                  <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase">{entityRegime === 'companies_house' ? 'CT Filtering' : 'HMRC Filtering'}</p>
                </div>
                <ArrowRight className="h-8 w-8 text-indigo-400 rotate-0 md:rotate-0" />
                <div className="mt-2 text-center">
                  <p className="text-red-600 font-semibold">Removed: {formatCurrency(dualRealityTotals.nonDeductible)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Top non-deductible:</p>
                  <div className="flex flex-wrap justify-center gap-1 mt-1">
                    {taxRealityData?.reconciliation?.topNonDeductibleCategories?.slice(0, 3).map((cat, i) => (
                      <Badge key={i} variant="outline" className="text-xs text-red-600">{cat.name}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Tax Reality */}
            <Card className="bg-green-100 dark:bg-green-950/40 border-green-400 dark:border-green-700">
              <CardContent className="p-4 text-center">
                <p className="text-xs uppercase tracking-wide text-green-600 mb-1">Tax Reality</p>
                <p className="text-sm text-green-700 dark:text-green-400">Allowable Expenses ({entityRegime === 'companies_house' ? 'CT' : 'HMRC'})</p>
                <p className="text-3xl font-bold text-green-700 dark:text-green-400 mt-2">{formatCurrency(dualRealityTotals.allowableExpenses)}</p>
                <Badge className="mt-2 bg-green-600">{dualRealityTotals.percentAllowable}% Allowable</Badge>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="mt-2 text-xs text-green-700 dark:text-green-400">
                      <HelpCircle className="h-3 w-3 mr-1" /> What's this?
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Only these expenses reduce your tax bill. This matches your {entityRegime === 'companies_house' ? 'CT600 allowable deductions' : 'SA103 Boxes'}.</p>
                  </TooltipContent>
                </Tooltip>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Golden Rule Equation */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
        <CardContent className="py-6">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-center">
            <div className="bg-green-100 dark:bg-green-900/30 border-2 border-green-400 dark:border-green-700 rounded-lg px-6 py-4">
              <p className="text-xs text-green-600 uppercase tracking-wide">Total Income</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-400">{formatCurrency(dualRealityTotals.bankIncome)}</p>
            </div>
            <span className="text-3xl font-bold text-muted-foreground/60">−</span>
            <div className="bg-red-50 dark:bg-red-950/30 border-2 border-green-400 dark:border-green-700 rounded-lg px-6 py-4">
              <p className="text-xs text-red-600 dark:text-red-400 uppercase tracking-wide">Allowable Expenses</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(dualRealityTotals.allowableExpenses)}</p>
            </div>
            <span className="text-3xl font-bold text-muted-foreground/60">=</span>
            <div className={`border-2 rounded-lg px-6 py-4 ${dualRealityTotals.taxableProfit >= 0 ? 'bg-blue-100 dark:bg-blue-950/40 border-blue-500' : 'bg-red-100 dark:bg-red-950/40 border-red-400'}`}>
              <p className={`text-xs uppercase tracking-wide ${dualRealityTotals.taxableProfit >= 0 ? 'text-blue-800 dark:text-blue-300' : 'text-red-600 dark:text-red-400'}`}>Taxable Profit</p>
              <p className={`text-2xl font-bold ${dualRealityTotals.taxableProfit >= 0 ? 'text-blue-800 dark:text-blue-300' : 'text-red-600 dark:text-red-400'}`}>{formatCurrency(dualRealityTotals.taxableProfit)}</p>
            </div>
          </div>
          
          {/* Educational Note */}
          <div className="mt-4 p-4 bg-card/50 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-semibold text-blue-800 dark:text-blue-300 mb-1">Why is &quot;Allowable Expenses&quot; lower than &quot;Total Spending&quot;?</p>
                <p>Personal expenses (like groceries, leisure, or personal rent) are paid from your <strong>Post-Tax Profit</strong>. They cannot be deducted before tax. Only business-related expenses reduce your taxable income. Use the "Business Use %" slider on each category to control what portion is deductible.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alert Budgets */}
      {alertBudgets.length > 0 && (
        <Card className="border-yellow-500 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-yellow-700">
              <AlertTriangle className="h-5 w-5" /> Budget Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alertBudgets.map(budget => (
                <div key={budget.id} className="flex items-center justify-between p-2 bg-card rounded">
                  <span className="font-medium">{budget.category?.name}</span>
                  <div className="flex items-center gap-4">
                    <span className={budget.isOverBudget ? 'text-red-600' : 'text-yellow-600'}>
                      {formatCurrency(budget.currentSpending)} / {formatCurrency(budget.amount)}
                    </span>
                    <Badge variant={budget.isOverBudget ? 'destructive' : 'outline'}>{budget.percentageUsed.toFixed(0)}%</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Regime Indicator */}
      {selectedEntity && (
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className={entityRegime === 'companies_house' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-amber-500 text-amber-600 dark:text-amber-400'}>
            {entityRegime === 'companies_house' ? <Building className="h-3 w-3 mr-1" /> : <User className="h-3 w-3 mr-1" />}
            {entityRegime === 'companies_house' ? 'Companies House / CT600' : 'HMRC Self Assessment / SA103'}
          </Badge>
          {accounts.length > 0 && selectedAccountId !== 'all' && (
            <Badge variant="outline" className="border-slate-500 text-slate-600 dark:text-slate-400">
              Account: {accounts.find(a => a.id === selectedAccountId)?.name}
            </Badge>
          )}
        </div>
      )}

      {/* ===== P&L REPORT ===== */}
      {activeReport === 'pnl' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Profit &amp; Loss Statement
            </CardTitle>
            <CardDescription>
              {entityRegime === 'companies_house' ? 'Company P&L for accounting period' : 'Trading P&L for tax year'} {selectedTaxYear}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                <TableRow className="bg-green-50 dark:bg-green-950/20 font-semibold">
                  <TableCell colSpan={2} className="text-green-700 dark:text-green-400">INCOME / TURNOVER</TableCell>
                  <TableCell></TableCell>
                </TableRow>
                {categoryBreakdown.filter(c => c.type === 'income').map((cat, i) => (
                  <TableRow key={i} className="cursor-pointer hover:bg-muted/50" onClick={() => { const category = categories.find(c => c.name === cat.name); openCategoryModal(category?.id || 'uncategorised', cat.name, cat.type); }}>
                    <TableCell className="pl-8">{cat.name}</TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">{cat.count} txns</TableCell>
                    <TableCell className="text-right font-medium text-green-600">{formatCurrency(cat.amount)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-green-100 dark:bg-green-950/40 font-bold">
                  <TableCell colSpan={2}>Total Income</TableCell>
                  <TableCell className="text-right text-green-700 dark:text-green-400">{formatCurrency(taxYearTotals.businessIncome)}</TableCell>
                </TableRow>

                <TableRow><TableCell colSpan={3} className="h-2 p-0"></TableCell></TableRow>

                <TableRow className="bg-red-50 dark:bg-red-950/20 font-semibold">
                  <TableCell colSpan={2} className="text-red-700 dark:text-red-400">LESS: EXPENSES</TableCell>
                  <TableCell></TableCell>
                </TableRow>
                {categoryBreakdown.filter(c => c.type === 'expense').map((cat, i) => (
                  <TableRow key={i} className="cursor-pointer hover:bg-muted/50" onClick={() => { const category = categories.find(c => c.name === cat.name); openCategoryModal(category?.id || 'uncategorised', cat.name, cat.type); }}>
                    <TableCell className="pl-8">{cat.name}</TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">{cat.count} txns</TableCell>
                    <TableCell className="text-right font-medium text-red-600">({formatCurrency(cat.amount)})</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-red-100 dark:bg-red-950/40 font-bold">
                  <TableCell colSpan={2}>Total Expenses</TableCell>
                  <TableCell className="text-right text-red-700 dark:text-red-400">({formatCurrency(taxYearTotals.debits)})</TableCell>
                </TableRow>

                <TableRow><TableCell colSpan={3} className="h-2 p-0"></TableCell></TableRow>

                <TableRow className={`font-bold text-lg ${taxYearTotals.netProfit >= 0 ? 'bg-blue-100 dark:bg-blue-950/40' : 'bg-red-100 dark:bg-red-950/40'}`}>
                  <TableCell colSpan={2}>{taxYearTotals.netProfit >= 0 ? 'NET PROFIT' : 'NET LOSS'}</TableCell>
                  <TableCell className={`text-right ${taxYearTotals.netProfit >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-red-700 dark:text-red-400'}`}>
                    {formatCurrency(taxYearTotals.netProfit)}
                  </TableCell>
                </TableRow>

                {entityRegime === 'companies_house' && taxYearTotals.netProfit > 0 && (
                  <>
                    <TableRow className="bg-amber-50 dark:bg-amber-950/30">
                      <TableCell colSpan={2} className="text-amber-700 dark:text-amber-400">Less: Corporation Tax @ {taxYearTotals.netProfit > 250000 ? '25%' : '19%'}</TableCell>
                      <TableCell className="text-right text-amber-700 dark:text-amber-400">
                        ({formatCurrency(taxYearTotals.netProfit * (taxYearTotals.netProfit > 250000 ? 0.25 : 0.19))})
                      </TableCell>
                    </TableRow>
                    <TableRow className="font-bold bg-emerald-100 dark:bg-emerald-950/40">
                      <TableCell colSpan={2}>PROFIT AFTER TAX</TableCell>
                      <TableCell className="text-right text-emerald-700 dark:text-emerald-400">
                        {formatCurrency(taxYearTotals.netProfit * (1 - (taxYearTotals.netProfit > 250000 ? 0.25 : 0.19)))}
                      </TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>

            {/* Monthly P&L Breakdown */}
            {monthlyBreakdown.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Monthly Breakdown</h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Month</TableHead>
                        <TableHead className="text-right">Income</TableHead>
                        <TableHead className="text-right">Expenses</TableHead>
                        <TableHead className="text-right">Net</TableHead>
                        <TableHead className="text-right">Txns</TableHead>
                        <TableHead className="w-40">Margin</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monthlyBreakdown.map((m, i) => {
                        const margin = m.income > 0 ? ((m.net / m.income) * 100) : 0;
                        const maxIncome = Math.max(...monthlyBreakdown.map(x => x.income), 1);
                        return (
                          <TableRow key={i}>
                            <TableCell className="font-medium">{m.month}</TableCell>
                            <TableCell className="text-right text-green-600">{formatCurrency(m.income)}</TableCell>
                            <TableCell className="text-right text-red-600">({formatCurrency(m.expenses)})</TableCell>
                            <TableCell className={`text-right font-semibold ${m.net >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{formatCurrency(m.net)}</TableCell>
                            <TableCell className="text-right text-muted-foreground text-xs">{m.txCount}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                                  <div className={`h-2 rounded-full ${m.net >= 0 ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${Math.min(100, (m.income / maxIncome) * 100)}%` }} />
                                </div>
                                <span className="text-xs text-muted-foreground w-10 text-right">{margin.toFixed(0)}%</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      <TableRow className="font-bold bg-muted/50">
                        <TableCell>Total</TableCell>
                        <TableCell className="text-right text-green-700">{formatCurrency(taxYearTotals.businessIncome)}</TableCell>
                        <TableCell className="text-right text-red-700">({formatCurrency(taxYearTotals.businessExpenses)})</TableCell>
                        <TableCell className={`text-right ${taxYearTotals.netProfit >= 0 ? 'text-blue-700' : 'text-red-700'}`}>{formatCurrency(taxYearTotals.netProfit)}</TableCell>
                        <TableCell className="text-right text-muted-foreground text-xs">{taxYearTotals.total}</TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <Button size="sm" onClick={() => { if (entityRegime === 'companies_house') generateCT600Report(); else generateHMRCReport(); }}><FileDown className="h-4 w-4 mr-1" /> Export PDF</Button>
              <Button size="sm" variant="outline" onClick={() => handleExport('summary', 'csv')}><Download className="h-4 w-4 mr-1" /> CSV</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===== VAT RETURN ===== */}
      {activeReport === 'vat' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-purple-600" />
              VAT Return (VAT100)
            </CardTitle>
            <CardDescription>
              VAT return data for period {selectedTaxYear}
              {taxpayerProfile.isVatRegistered && taxpayerProfile.vatScheme && (
                <Badge variant="outline" className="ml-2 text-purple-600 border-purple-300">{taxpayerProfile.vatScheme} Scheme</Badge>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!taxpayerProfile.isVatRegistered ? (
              <div className="text-center py-12 space-y-3">
                <Receipt className="h-12 w-12 text-muted-foreground mx-auto" />
                <p className="text-lg font-medium">Not VAT Registered</p>
                <p className="text-muted-foreground text-sm">Enable VAT in your Taxpayer Profile to generate VAT returns.</p>
                <p className="text-xs text-muted-foreground">VAT registration is mandatory when taxable turnover exceeds £90,000 in a 12-month period.</p>
                <Button variant="outline" onClick={() => setActiveReport('profile')}>Go to Profile</Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* VAT Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-3 text-center border border-purple-200 dark:border-purple-800">
                    <p className="text-xs text-purple-600 uppercase">Output VAT</p>
                    <p className="text-lg font-bold text-purple-700 dark:text-purple-400">{formatCurrency(taxYearTotals.credits * 0.20)}</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3 text-center border border-green-200 dark:border-green-800">
                    <p className="text-xs text-green-600 uppercase">Input VAT</p>
                    <p className="text-lg font-bold text-green-700 dark:text-green-400">{formatCurrency(dualRealityTotals.allowableExpenses * 0.20)}</p>
                  </div>
                  <div className={`rounded-lg p-3 text-center border ${(taxYearTotals.credits * 0.20) - (dualRealityTotals.allowableExpenses * 0.20) > 0 ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800' : 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800'}`}>
                    <p className="text-xs uppercase">{(taxYearTotals.credits * 0.20) - (dualRealityTotals.allowableExpenses * 0.20) > 0 ? 'VAT to Pay' : 'VAT Refund'}</p>
                    <p className={`text-lg font-bold ${(taxYearTotals.credits * 0.20) - (dualRealityTotals.allowableExpenses * 0.20) > 0 ? 'text-red-700 dark:text-red-400' : 'text-blue-700 dark:text-blue-400'}`}>
                      {formatCurrency(Math.abs((taxYearTotals.credits * 0.20) - (dualRealityTotals.allowableExpenses * 0.20)))}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950/30 rounded-lg p-3 text-center border border-slate-200 dark:border-slate-800">
                    <p className="text-xs text-slate-600 uppercase">VRN</p>
                    <p className="text-sm font-mono font-bold text-slate-700 dark:text-slate-400 mt-1">{taxpayerProfile.vatRegistrationNumber || 'Not set'}</p>
                  </div>
                </div>

                {/* VAT100 Boxes */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">Box</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right w-40">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="bg-purple-50/50 dark:bg-purple-950/10">
                      <TableCell className="font-mono font-semibold">Box 1</TableCell>
                      <TableCell>VAT due in the period on sales and other outputs</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(taxYearTotals.credits * 0.20)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono font-semibold">Box 2</TableCell>
                      <TableCell>VAT due on acquisitions from other EC member states</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(0)}</TableCell>
                    </TableRow>
                    <TableRow className="font-semibold bg-purple-100 dark:bg-purple-950/30">
                      <TableCell className="font-mono font-bold">Box 3</TableCell>
                      <TableCell>Total VAT due (Box 1 + Box 2)</TableCell>
                      <TableCell className="text-right font-bold">{formatCurrency(taxYearTotals.credits * 0.20)}</TableCell>
                    </TableRow>
                    <TableRow className="bg-green-50/50 dark:bg-green-950/10">
                      <TableCell className="font-mono font-semibold">Box 4</TableCell>
                      <TableCell>VAT reclaimed in the period on purchases and other inputs (including acquisitions from EC)</TableCell>
                      <TableCell className="text-right font-medium text-green-600">{formatCurrency(dualRealityTotals.allowableExpenses * 0.20)}</TableCell>
                    </TableRow>
                    <TableRow className="font-bold text-lg bg-blue-100 dark:bg-blue-950/40">
                      <TableCell className="font-mono font-bold">Box 5</TableCell>
                      <TableCell>Net VAT to be paid to HMRC or reclaimed</TableCell>
                      <TableCell className={`text-right font-bold ${(taxYearTotals.credits * 0.20) - (dualRealityTotals.allowableExpenses * 0.20) > 0 ? 'text-red-600' : 'text-blue-700 dark:text-blue-400'}`}>
                        {formatCurrency((taxYearTotals.credits * 0.20) - (dualRealityTotals.allowableExpenses * 0.20))}
                      </TableCell>
                    </TableRow>

                    <TableRow><TableCell colSpan={3} className="h-2 p-0 border-0"></TableCell></TableRow>

                    <TableRow>
                      <TableCell className="font-mono font-semibold">Box 6</TableCell>
                      <TableCell>Total value of sales and all other outputs excluding any VAT (net value)</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(taxYearTotals.businessIncome)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono font-semibold">Box 7</TableCell>
                      <TableCell>Total value of purchases and all other inputs excluding any VAT (net value)</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(taxYearTotals.debits)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono font-semibold">Box 8</TableCell>
                      <TableCell>Total value of all supplies of goods and related costs, excluding any VAT, to other EC member states</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(0)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono font-semibold">Box 9</TableCell>
                      <TableCell>Total value of acquisitions of goods and related costs, excluding any VAT, from other EC member states</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(0)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                {/* VAT by Category */}
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2"><PieChart className="h-4 w-4" /> VAT Breakdown by Category</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-green-600 uppercase mb-1">Output VAT (Sales)</p>
                      {categoryBreakdown.filter(c => c.type === 'income').map((cat, i) => (
                        <div key={i} className="flex justify-between py-1 text-sm border-b border-border/50">
                          <span>{cat.name}</span>
                          <span className="font-mono text-green-600">{formatCurrency(cat.amount * 0.20)}</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-purple-600 uppercase mb-1">Input VAT (Purchases)</p>
                      {categoryBreakdown.filter(c => c.type === 'expense').slice(0, 10).map((cat, i) => (
                        <div key={i} className="flex justify-between py-1 text-sm border-b border-border/50">
                          <span>{cat.name}</span>
                          <span className="font-mono text-purple-600">{formatCurrency(cat.amount * 0.20)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Info box */}
                <div className="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground border">
                  <Info className="h-3 w-3 inline mr-1" />
                  VAT calculated at standard rate (20%). Reduced rate (5%) and zero-rated items are not automatically detected. 
                  Review your transactions and adjust if you have mixed-rate supplies. Flat Rate Scheme users should apply their sector rate instead.
                </div>

                {/* Export buttons */}
                <div className="flex gap-2 pt-2">
                  <Button size="sm" onClick={generateVATReturn}><FileDown className="h-4 w-4 mr-1" /> VAT Return PDF</Button>
                  <Button size="sm" variant="outline" onClick={() => {
                    const vatData = {
                      periodKey: selectedTaxYear,
                      vatDueSales: Math.round(taxYearTotals.credits * 0.20 * 100) / 100,
                      vatDueAcquisitions: 0,
                      totalVatDue: Math.round(taxYearTotals.credits * 0.20 * 100) / 100,
                      vatReclaimedCurrPeriod: Math.round(dualRealityTotals.allowableExpenses * 0.20 * 100) / 100,
                      netVatDue: Math.round(((taxYearTotals.credits * 0.20) - (dualRealityTotals.allowableExpenses * 0.20)) * 100) / 100,
                      totalValueSalesExVAT: Math.round(taxYearTotals.credits),
                      totalValuePurchasesExVAT: Math.round(taxYearTotals.debits),
                      totalValueGoodsSuppliedExVAT: 0,
                      totalAcquisitionsExVAT: 0,
                      finalised: true,
                    };
                    const blob = new Blob([JSON.stringify(vatData, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a'); a.href = url; a.download = `vat-return-${selectedTaxYear}.json`; a.click();
                    URL.revokeObjectURL(url);
                    toast({ title: 'MTD JSON Exported', description: 'VAT Return data in HMRC MTD format' });
                  }}><Download className="h-4 w-4 mr-1" /> MTD JSON</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ===== BALANCE SHEET ===== */}
      {activeReport === 'balance' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-indigo-600" />
              Balance Sheet
            </CardTitle>
            <CardDescription>Statement of financial position as at end of {selectedTaxYear}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                <TableRow className="bg-indigo-50 dark:bg-indigo-950/20 font-semibold">
                  <TableCell colSpan={2} className="text-indigo-700 dark:text-indigo-400">CURRENT ASSETS</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="pl-8">Bank &amp; Cash</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(taxYearTotals.credits - taxYearTotals.debits > 0 ? taxYearTotals.credits - taxYearTotals.debits : 0)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="pl-8">Trade Debtors (Unpaid Invoices)</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(reportSummary?.invoiceTotals?.totalIncome || 0)}</TableCell>
                </TableRow>
                <TableRow className="font-bold bg-indigo-100 dark:bg-indigo-950/40">
                  <TableCell>Total Current Assets</TableCell>
                  <TableCell className="text-right">{formatCurrency((taxYearTotals.credits - taxYearTotals.debits > 0 ? taxYearTotals.credits - taxYearTotals.debits : 0) + (reportSummary?.invoiceTotals?.totalIncome || 0))}</TableCell>
                </TableRow>

                <TableRow><TableCell colSpan={2} className="h-2 p-0"></TableCell></TableRow>

                <TableRow className="bg-red-50 dark:bg-red-950/20 font-semibold">
                  <TableCell colSpan={2} className="text-red-700 dark:text-red-400">CURRENT LIABILITIES</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="pl-8">Trade Creditors (Unpaid Bills)</TableCell>
                  <TableCell className="text-right font-medium">({formatCurrency(reportSummary?.totalMonthlyCommitments || 0)})</TableCell>
                </TableRow>
                {taxpayerProfile.isVatRegistered && (
                  <TableRow>
                    <TableCell className="pl-8">VAT Liability</TableCell>
                    <TableCell className="text-right font-medium">({formatCurrency((taxYearTotals.credits * 0.20) - (dualRealityTotals.allowableExpenses * 0.20))})</TableCell>
                  </TableRow>
                )}
                <TableRow>
                  <TableCell className="pl-8">{entityRegime === 'companies_house' ? 'Corporation Tax' : 'Income Tax'} Liability</TableCell>
                  <TableCell className="text-right font-medium">({formatCurrency(entityRegime === 'companies_house' ? Math.max(0, taxYearTotals.netProfit * 0.19) : taxEstimate.total)})</TableCell>
                </TableRow>

                <TableRow><TableCell colSpan={2} className="h-2 p-0"></TableCell></TableRow>

                <TableRow className="font-bold text-lg bg-blue-100 dark:bg-blue-950/40">
                  <TableCell>NET ASSETS</TableCell>
                  <TableCell className="text-right text-blue-700 dark:text-blue-400">
                    {formatCurrency(taxYearTotals.netProfit - (entityRegime === 'companies_house' ? Math.max(0, taxYearTotals.netProfit * 0.19) : taxEstimate.total))}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <div className="mt-4 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
              <Info className="h-3 w-3 inline mr-1" />
              This is a simplified balance sheet based on available transaction data. Fixed assets, depreciation, and accruals are not included.
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===== TRANSACTIONS REPORT ===== */}
      {activeReport === 'transactions' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-slate-600" />
              Transaction Report ({filteredTransactions.length} transactions)
            </CardTitle>
            <CardDescription>All bank transactions for {selectedTaxYear}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4">
              <div className="bg-green-50 dark:bg-green-950/30 rounded-lg px-4 py-2">
                <p className="text-xs text-green-600">Credits</p>
                <p className="text-lg font-bold text-green-700 dark:text-green-400">{formatCurrency(taxYearTotals.credits)}</p>
              </div>
              <div className="bg-red-50 dark:bg-red-950/30 rounded-lg px-4 py-2">
                <p className="text-xs text-red-600">Debits</p>
                <p className="text-lg font-bold text-red-700 dark:text-red-400">{formatCurrency(taxYearTotals.debits)}</p>
              </div>
              <div className={`rounded-lg px-4 py-2 ${taxYearTotals.netProfit >= 0 ? 'bg-blue-50 dark:bg-blue-950/30' : 'bg-red-50 dark:bg-red-950/30'}`}>
                <p className="text-xs text-muted-foreground">Net</p>
                <p className={`text-lg font-bold ${taxYearTotals.netProfit >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-red-700 dark:text-red-400'}`}>{formatCurrency(taxYearTotals.netProfit)}</p>
              </div>
            </div>
            <div className="max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.slice(0, 200).map(tx => (
                    <TableRow key={tx.id}>
                      <TableCell className="text-sm">{new Date(tx.date).toLocaleDateString('en-GB')}</TableCell>
                      <TableCell className="text-sm max-w-[250px] truncate" title={tx.description}>{tx.description}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{tx.category?.name || 'Uncategorised'}</Badge></TableCell>
                      <TableCell className={`text-right font-medium ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredTransactions.length > 200 && <p className="text-center text-sm text-muted-foreground py-2">Showing 200 of {filteredTransactions.length}. Export for full list.</p>}
            </div>
            <div className="mt-4 flex gap-2">
              <Button size="sm" onClick={() => handleExport('statements', 'csv')}><Download className="h-4 w-4 mr-1" /> CSV</Button>
              <Button size="sm" variant="outline" onClick={() => handleExport('statements', 'excel')}><FileSpreadsheet className="h-4 w-4 mr-1" /> Excel</Button>
              <Button size="sm" variant="secondary" onClick={() => handleExport('statements', 'pdf')}><FileDown className="h-4 w-4 mr-1" /> PDF</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===== AGED DEBTORS ===== */}
      {activeReport === 'aged' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-rose-600" />
              Aged Debtors Report
            </CardTitle>
            <CardDescription>Outstanding invoices aged by due date</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client / Provider</TableHead>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Current</TableHead>
                  <TableHead>30+ Days</TableHead>
                  <TableHead>60+ Days</TableHead>
                  <TableHead>90+ Days</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.filter(tx => tx.type === 'credit' && !tx.category).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No outstanding debts found. Import invoices for aged debtor analysis.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <div className="mt-4 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
              <Info className="h-3 w-3 inline mr-1" />
              This report will be fully populated when invoice management data is available. Import invoices with due dates for accurate ageing.
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===== CASH FLOW ===== */}
      {activeReport === 'cashflow' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-teal-600" />
                Cash Flow Statement
              </CardTitle>
              <CardDescription>Cash movement summary for {selectedTaxYear}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableBody>
                  <TableRow className="bg-teal-50 dark:bg-teal-950/20 font-semibold">
                    <TableCell className="text-teal-700 dark:text-teal-400">OPERATING ACTIVITIES</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-8">Cash received from customers</TableCell>
                    <TableCell className="text-right font-medium text-green-600">{formatCurrency(taxYearTotals.credits)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-8">Cash paid to suppliers &amp; expenses</TableCell>
                    <TableCell className="text-right font-medium text-red-600">({formatCurrency(taxYearTotals.debits)})</TableCell>
                  </TableRow>
                  <TableRow className="font-bold bg-teal-100 dark:bg-teal-950/40">
                    <TableCell>Net cash from operating activities</TableCell>
                    <TableCell className={`text-right ${taxYearTotals.netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatCurrency(taxYearTotals.netProfit)}</TableCell>
                  </TableRow>

                  <TableRow><TableCell colSpan={2} className="h-2 p-0"></TableCell></TableRow>

                  <TableRow className="bg-slate-50 dark:bg-slate-950/20 font-semibold">
                    <TableCell className="text-slate-700 dark:text-slate-400">TAX PAYMENTS</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-8">Estimated tax liability</TableCell>
                    <TableCell className="text-right font-medium text-amber-600">({formatCurrency(entityRegime === 'companies_house' ? Math.max(0, taxYearTotals.netProfit * 0.19) : taxEstimate.total)})</TableCell>
                  </TableRow>
                  {taxpayerProfile.isVatRegistered && (
                    <TableRow>
                      <TableCell className="pl-8">VAT liability (net)</TableCell>
                      <TableCell className="text-right font-medium text-amber-600">({formatCurrency((taxYearTotals.credits * 0.20) - (dualRealityTotals.allowableExpenses * 0.20))})</TableCell>
                    </TableRow>
                  )}

                  <TableRow><TableCell colSpan={2} className="h-2 p-0"></TableCell></TableRow>

                  <TableRow className="font-bold text-lg bg-blue-100 dark:bg-blue-950/40">
                    <TableCell>NET CASH POSITION</TableCell>
                    <TableCell className="text-right text-blue-700 dark:text-blue-400">
                      {formatCurrency(taxYearTotals.netProfit - (entityRegime === 'companies_house' ? Math.max(0, taxYearTotals.netProfit * 0.19) : taxEstimate.total))}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Monthly Cash Flow */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-teal-600" /> Monthly Cash Flow</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">Cash In</TableHead>
                    <TableHead className="text-right">Cash Out</TableHead>
                    <TableHead className="text-right">Net Flow</TableHead>
                    <TableHead className="text-right">Cumulative</TableHead>
                    <TableHead className="w-32">Flow</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    let running = 0;
                    const maxAbs = Math.max(...monthlyBreakdown.map(x => Math.abs(x.net)), 1);
                    return monthlyBreakdown.map((m, i) => {
                      running += m.net;
                      return (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{m.month}</TableCell>
                          <TableCell className="text-right text-green-600">{formatCurrency(m.income)}</TableCell>
                          <TableCell className="text-right text-red-600">({formatCurrency(m.expenses)})</TableCell>
                          <TableCell className={`text-right font-semibold ${m.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(m.net)}</TableCell>
                          <TableCell className={`text-right font-medium ${running >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{formatCurrency(running)}</TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center h-4">
                              <div className={`${m.net >= 0 ? 'bg-green-500' : 'bg-red-500'} h-3 rounded`} style={{ width: `${Math.min(100, (Math.abs(m.net) / maxAbs) * 100)}%` }} />
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    });
                  })()}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ===== TRIAL BALANCE ===== */}
      {activeReport === 'trialbalance' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-violet-600" />
              Trial Balance
            </CardTitle>
            <CardDescription>Debit and credit balances per nominal account for {selectedTaxYear}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center gap-3">
              {trialBalance.balanced ? (
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><CheckCircle2 className="h-3 w-3 mr-1" /> Balanced</Badge>
              ) : (
                <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" /> Imbalance: {formatCurrency(Math.abs(trialBalance.totalDebits - trialBalance.totalCredits))}</Badge>
              )}
              <span className="text-xs text-muted-foreground">{trialBalance.rows.length} nominal accounts</span>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Debit (Dr)</TableHead>
                  <TableHead className="text-right">Credit (Cr)</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-right">Txns</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trialBalance.rows.map((row, i) => (
                  <TableRow key={i} className="cursor-pointer hover:bg-muted/50" onClick={() => { const category = categories.find(c => c.name === row.name); if (category) openCategoryModal(category.id, row.name, row.type); }}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell><Badge variant="outline" className={row.type === 'income' ? 'text-green-600 border-green-300' : 'text-red-600 border-red-300'}>{row.type}</Badge></TableCell>
                    <TableCell className="text-right font-mono text-red-600">{row.debits > 0 ? formatCurrency(row.debits) : '-'}</TableCell>
                    <TableCell className="text-right font-mono text-green-600">{row.credits > 0 ? formatCurrency(row.credits) : '-'}</TableCell>
                    <TableCell className={`text-right font-mono font-semibold ${row.net >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatCurrency(row.net)}</TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">{row.txCount}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-bold bg-muted/50 border-t-2">
                  <TableCell colSpan={2}>TOTALS</TableCell>
                  <TableCell className="text-right font-mono text-red-700">{formatCurrency(trialBalance.totalDebits)}</TableCell>
                  <TableCell className="text-right font-mono text-green-700">{formatCurrency(trialBalance.totalCredits)}</TableCell>
                  <TableCell className={`text-right font-mono ${trialBalance.totalCredits - trialBalance.totalDebits >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatCurrency(trialBalance.totalCredits - trialBalance.totalDebits)}</TableCell>
                  <TableCell className="text-right text-xs">{filteredTransactions.length}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="outline" onClick={() => handleExport('summary', 'csv')}><Download className="h-4 w-4 mr-1" /> Export CSV</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===== GENERAL LEDGER ===== */}
      {activeReport === 'generalledger' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-sky-600" />
                General Ledger
              </CardTitle>
              <CardDescription>Transaction journal grouped by nominal account for {selectedTaxYear} ({filteredTransactions.length} transactions)</CardDescription>
            </CardHeader>
          </Card>

          {generalLedger.map((group, gi) => {
            const groupTotal = group.transactions.reduce((s, tx) => s + (tx.type === 'credit' ? tx.amount : -tx.amount), 0);
            return (
              <Card key={gi}>
                <CardHeader className="py-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Badge variant="outline" className={group.type === 'income' ? 'text-green-600 border-green-300' : 'text-red-600 border-red-300'}>{group.type}</Badge>
                      {group.name}
                      <span className="text-xs text-muted-foreground font-normal">({group.transactions.length} txns)</span>
                    </CardTitle>
                    <span className={`font-mono font-bold ${groupTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(groupTotal)}</span>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-24">Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead className="text-right">Debit</TableHead>
                        <TableHead className="text-right">Credit</TableHead>
                        <TableHead className="text-right">Running</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(() => {
                        let running = 0;
                        return group.transactions.slice(0, 50).map((tx, ti) => {
                          running += tx.type === 'credit' ? tx.amount : -tx.amount;
                          return (
                            <TableRow key={ti} className="text-sm">
                              <TableCell className="font-mono text-xs">{new Date(tx.date).toLocaleDateString('en-GB')}</TableCell>
                              <TableCell className="max-w-[300px] truncate">{tx.cleanDescription || tx.description}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">{tx.reference || '-'}</TableCell>
                              <TableCell className="text-right font-mono text-red-600">{tx.type === 'debit' ? formatCurrency(tx.amount) : '-'}</TableCell>
                              <TableCell className="text-right font-mono text-green-600">{tx.type === 'credit' ? formatCurrency(tx.amount) : '-'}</TableCell>
                              <TableCell className={`text-right font-mono text-xs ${running >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{formatCurrency(running)}</TableCell>
                            </TableRow>
                          );
                        });
                      })()}
                      {group.transactions.length > 50 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-2">
                            ... and {group.transactions.length - 50} more transactions. Export to see all.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            );
          })}

          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => handleExport('summary', 'csv')}><Download className="h-4 w-4 mr-1" /> Export Full Ledger (CSV)</Button>
            <Button size="sm" variant="outline" onClick={() => generateExcel('summary', {})}><FileSpreadsheet className="h-4 w-4 mr-1" /> Export Full Ledger (Excel)</Button>
          </div>
        </div>
      )}

      {/* ===== OVERVIEW (existing summary cards + dual reality) - show when overview selected ===== */}
      {(activeReport === 'overview') && (
        <>

      {/* Companies House Report Tab - now inline */}
      {entityRegime === 'companies_house' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" /> Company Accounts &amp; CT600
                </CardTitle>
                <CardDescription>
                  Statutory accounts and Corporation Tax return data for accounting period {selectedTaxYear}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Report Sections:</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2"><Building className="h-4 w-4 text-blue-600" /> Company Information</li>
                      <li className="flex items-center gap-2"><Receipt className="h-4 w-4 text-blue-600" /> Profit &amp; Loss Account</li>
                      <li className="flex items-center gap-2"><Calculator className="h-4 w-4 text-blue-600" /> Corporation Tax Computation (CT600)</li>
                      <li className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-blue-600" /> Directors&apos; Report</li>
                      <li className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-blue-600" /> Balance Sheet Summary</li>
                      <li className="flex items-center gap-2"><ClipboardCheck className="h-4 w-4 text-blue-600" /> Tax Adjustments &amp; Disallowable Expenses</li>
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-semibold">Quick P&amp;L ({selectedTaxYear}):</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between p-2 bg-muted/50 rounded">
                        <span>Turnover:</span>
                        <span className="font-medium text-green-600">{formatCurrency(taxYearTotals.businessIncome)}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted/50 rounded">
                        <span>Cost of Sales &amp; Expenses:</span>
                        <span className="font-medium text-red-600">{formatCurrency(taxYearTotals.businessExpenses)}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-blue-50 dark:bg-blue-950/30 rounded border border-blue-200 dark:border-blue-800">
                        <span className="font-semibold">Net Profit Before Tax:</span>
                        <span className="font-bold text-blue-600">{formatCurrency(taxYearTotals.netProfit)}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-amber-50 dark:bg-amber-950/30 rounded border border-amber-200 dark:border-amber-800">
                        <span className="font-semibold">Estimated CT ({taxYearTotals.netProfit <= 50000 ? '19%' : taxYearTotals.netProfit <= 250000 ? 'Marginal' : '25%'}):</span>
                        <span className="font-bold text-amber-700 dark:text-amber-400">{formatCurrency(Math.max(0, taxYearTotals.netProfit * (taxYearTotals.netProfit <= 50000 ? 0.19 : taxYearTotals.netProfit <= 250000 ? 0.265 : 0.25)))}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted/50 rounded">
                        <span>Transactions:</span>
                        <span>{taxYearTotals.total}</span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Filing-Ready Export Buttons */}
                <div className="mt-6 pt-6 border-t">
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Generate &amp; Review</h4>
                  <div className="flex flex-wrap gap-3 mb-4">
                    <Button onClick={generateCT600Report} className="bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-600 hover:to-blue-400 shadow-sm">
                      <FileDown className="h-4 w-4 mr-2" /> Full Statutory Accounts (PDF)
                    </Button>
                    <Button variant="outline" onClick={() => handleExport('all', 'json')} disabled={exporting}>
                      <Download className="h-4 w-4 mr-2" /> CT600 Data (JSON)
                    </Button>
                    <Button variant="outline" onClick={() => generateExcel('summary', {})} disabled={exporting}>
                      <FileSpreadsheet className="h-4 w-4 mr-2" /> Full Workbook (Excel)
                    </Button>
                  </div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">File to Companies House &amp; HMRC</h4>
                  <div className="flex flex-wrap gap-3 mb-3">
                    <Button className="bg-gradient-to-r from-emerald-700 to-emerald-500 hover:from-emerald-600 hover:to-emerald-400 shadow-sm" onClick={() => toast({ title: 'Coming Soon', description: 'Companies House annual accounts filing will be available when our software authorisation is approved. Your data is ready.' })}>
                      <Upload className="h-4 w-4 mr-2" /> Submit Annual Accounts (CH)
                    </Button>
                    <Button className="bg-gradient-to-r from-indigo-700 to-indigo-500 hover:from-indigo-600 hover:to-indigo-400 shadow-sm" onClick={() => toast({ title: 'Coming Soon', description: 'CT600 Corporation Tax filing via HMRC API will be available soon. Your CT600 data is ready.' })}>
                      <Upload className="h-4 w-4 mr-2" /> Submit CT600 (HMRC)
                    </Button>
                    <Button variant="outline" onClick={() => toast({ title: 'Coming Soon', description: 'Confirmation Statement filing will be available when authorised.' })}>
                      <ClipboardCheck className="h-4 w-4 mr-2" /> Confirmation Statement (CH)
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="secondary" onClick={generateAccountantPack} disabled={exporting}>
                      <FileArchive className="h-4 w-4 mr-2" /> Share with Accountant
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1"><Info className="h-3 w-3" /> Filing buttons will connect to Companies House &amp; HMRC APIs once HomeLedger is registered as authorised filing software.</p>
                </div>
              </CardContent>
            </Card>
      )}

      {/* HMRC Report - in overview */}
      {entityRegime !== 'companies_house' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Landmark className="h-5 w-5" /> Generate HMRC Report
              </CardTitle>
              <CardDescription>
                Generate a comprehensive SA103 Self Employment report for tax year {selectedTaxYear}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Report Sections:</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2"><ClipboardCheck className="h-4 w-4 text-green-600" /> Report Identification</li>
                    <li className="flex items-center gap-2"><User className="h-4 w-4 text-green-600" /> Taxpayer Details</li>
                    <li className="flex items-center gap-2"><Receipt className="h-4 w-4 text-green-600" /> Income &amp; Turnover</li>
                    <li className="flex items-center gap-2"><Calculator className="h-4 w-4 text-green-600" /> HMRC Box Mapping (SA103)</li>
                    <li className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-green-600" /> Profit &amp; Loss Summary</li>
                    <li className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-green-600" /> Tax Calculation</li>
                    <li className="flex items-center gap-2"><ClipboardCheck className="h-4 w-4 text-green-600" /> Declaration</li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold">Quick Summary ({selectedTaxYear}):</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between p-2 bg-muted/50 rounded">
                      <span>Total Income:</span>
                      <span className="font-medium text-green-600">{formatCurrency(taxYearTotals.businessIncome)}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-muted/50 rounded">
                      <span>Total Expenses:</span>
                      <span className="font-medium text-red-600">{formatCurrency(taxYearTotals.businessExpenses)}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-blue-50 dark:bg-blue-950/30 rounded border border-blue-200 dark:border-blue-800">
                      <span className="font-semibold">Net Profit:</span>
                      <span className="font-bold text-blue-600">{formatCurrency(taxYearTotals.netProfit)}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-amber-50 dark:bg-amber-950/30 rounded border border-amber-200 dark:border-amber-800">
                      <span className="font-semibold">Estimated Tax:</span>
                      <span className="font-bold text-amber-700 dark:text-amber-400">{formatCurrency(taxEstimate.total)}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-muted/50 rounded">
                      <span>Transactions:</span>
                      <span>{taxYearTotals.total}</span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Filing-Ready Export Buttons */}
              <div className="mt-6 pt-6 border-t">
                <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Generate &amp; Review</h4>
                <div className="flex flex-wrap gap-3 mb-4">
                  <Button onClick={generateHMRCReport} className="bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-600 hover:to-blue-400 shadow-sm">
                    <FileDown className="h-4 w-4 mr-2" /> SA103 Self Assessment (PDF)
                  </Button>
                  <Button variant="outline" onClick={() => handleExport('all', 'json')} disabled={exporting}>
                    <Download className="h-4 w-4 mr-2" /> SA103 Data (JSON / MTD)
                  </Button>
                  <Button variant="outline" onClick={() => generateExcel('summary', {})} disabled={exporting}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" /> Full Workbook (Excel)
                  </Button>
                </div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">File to HMRC</h4>
                <div className="flex flex-wrap gap-3 mb-3">
                  <Button className="bg-gradient-to-r from-emerald-700 to-emerald-500 hover:from-emerald-600 hover:to-emerald-400 shadow-sm" onClick={() => toast({ title: 'Coming Soon', description: 'SA100/SA103 Self Assessment filing via HMRC MTD API will be available soon. Your tax return data is ready.' })}>
                    <Send className="h-4 w-4 mr-2" /> Submit Self Assessment (HMRC)
                  </Button>
                  {taxpayerProfile.isVatRegistered && (
                    <Button className="bg-gradient-to-r from-purple-700 to-purple-500 hover:from-purple-600 hover:to-purple-400 shadow-sm" onClick={() => toast({ title: 'Coming Soon', description: 'VAT Return MTD submission will be available via HMRC MTD API. Your VAT100 data is ready.' })}>
                      <Send className="h-4 w-4 mr-2" /> Submit VAT Return (MTD)
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => toast({ title: 'Coming Soon', description: 'Payment on Account calculations and reminders will be available soon.' })}>
                    <Calendar className="h-4 w-4 mr-2" /> Payment on Account
                  </Button>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button variant="secondary" onClick={generateAccountantPack} disabled={exporting}>
                    <FileArchive className="h-4 w-4 mr-2" /> Share with Accountant
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1"><Info className="h-3 w-3" /> Filing buttons will connect to HMRC MTD APIs once HomeLedger is registered as authorised filing software.</p>
              </div>
            </CardContent>
          </Card>
      )}
      </>
      )}

      {/* ===== TAX BREAKDOWN (HMRC Box Mapping / CT600) ===== */}
      {(activeReport === 'breakdown' || activeReport === 'hmrc') && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" /> {entityRegime === 'companies_house' ? 'CT600 Corporation Tax Breakdown' : 'HMRC SA103 Box Breakdown'}
              </CardTitle>
              <CardDescription>
                {entityRegime === 'companies_house'
                  ? `Corporation tax computation for accounting period ${selectedTaxYear}`
                  : `See how your expense categories map to HMRC Self Assessment boxes for tax year ${selectedTaxYear}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>HMRC Box</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Your Categories</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hmrcBreakdown.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No expense categories matched. Categorize your transactions to see HMRC mapping.
                      </TableCell>
                    </TableRow>
                  ) : (
                    hmrcBreakdown.map((item, idx) => (
                      <TableRow 
                        key={idx} 
                        className="cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors"
                        onClick={() => openHMRCBoxModal(item.box, item.label, item.matched)}
                      >
                        <TableCell>
                          <Badge variant="outline" className="font-mono">{item.box}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {item.label}
                            <Eye className="h-3 w-3 text-muted-foreground/60" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {item.matched.map((cat, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">{cat}</Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-red-600">
                          {formatCurrency(item.total)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                  <TableRow className="bg-muted font-bold">
                    <TableCell colSpan={3}>Total Allowable Expenses</TableCell>
                    <TableCell className="text-right text-red-600">
                      {formatCurrency(hmrcBreakdown.reduce((sum, h) => sum + h.total, 0))}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              {/* Category Breakdown - CLICKABLE */}
              <div className="mt-8">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  All Categories ({selectedTaxYear})
                  <Tooltip>
                    <TooltipTrigger><HelpCircle className="h-4 w-4 text-muted-foreground/60" /></TooltipTrigger>
                    <TooltipContent>Click any category to view, edit, approve or delete transactions</TooltipContent>
                  </Tooltip>
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-green-600">Income Categories</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {categoryBreakdown.filter(c => c.type === 'income').length === 0 ? (
                        <p className="text-sm text-muted-foreground">No income categories</p>
                      ) : (
                        <div className="space-y-2">
                          {categoryBreakdown.filter(c => c.type === 'income').map((cat, i) => {
                            const category = categories.find(c => c.name === cat.name);
                            return (
                              <div 
                                key={i} 
                                className="flex justify-between items-center p-2 bg-green-50 dark:bg-green-950/20 rounded cursor-pointer hover:bg-green-100 dark:hover:bg-green-950/40 transition-colors group"
                                onClick={() => openCategoryModal(category?.id || 'uncategorised', cat.name, cat.type)}
                              >
                                <div className="flex items-center gap-2">
                                  <span>{cat.name}</span>
                                  <Badge variant="outline" className="text-xs">{cat.count}</Badge>
                                  <Eye className="h-3 w-3 text-muted-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <span className="font-semibold text-green-600">{formatCurrency(cat.amount)}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-red-600 flex items-center justify-between">
                        Expense Categories
                        <Tooltip>
                          <TooltipTrigger><Percent className="h-4 w-4 text-muted-foreground/60" /></TooltipTrigger>
                          <TooltipContent>Set Business Use % to control tax deductibility</TooltipContent>
                        </Tooltip>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {categoryBreakdown.filter(c => c.type === 'expense').length === 0 ? (
                        <p className="text-sm text-muted-foreground">No expense categories</p>
                      ) : (
                        <div className="space-y-2">
                          {categoryBreakdown.filter(c => c.type === 'expense').map((cat, i) => {
                            const category = categories.find(c => c.name === cat.name);
                            const deductPercent = category?.defaultDeductibilityPercent ?? 0;
                            return (
                              <div 
                                key={i} 
                                className="flex justify-between items-center p-2 bg-red-50 dark:bg-red-950/20 rounded cursor-pointer hover:bg-red-100 dark:hover:bg-red-950/40 transition-colors group"
                              >
                                <div 
                                  className="flex items-center gap-2 flex-1"
                                  onClick={() => openCategoryModal(category?.id || 'uncategorised', cat.name, cat.type)}
                                >
                                  <span>{cat.name}</span>
                                  <Badge variant="outline" className="text-xs">{cat.count}</Badge>
                                  <Eye className="h-3 w-3 text-muted-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <div className="flex items-center gap-2">
                                  {category && (
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className="h-6 px-2 text-xs"
                                      onClick={(e) => { e.stopPropagation(); openDeductibilityModal(category); }}
                                    >
                                      <Percent className="h-3 w-3 mr-1" />
                                      {deductPercent}%
                                    </Button>
                                  )}
                                  <span className="font-semibold text-red-600">{formatCurrency(cat.amount)}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ===== TAXPAYER / COMPANY PROFILE ===== */}
      {activeReport === 'profile' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> {entityRegime === 'companies_house' ? 'Company Profile' : 'Taxpayer Profile'}</CardTitle>
              <CardDescription>Your details will appear on {entityRegime === 'companies_house' ? 'Companies House' : 'HMRC'} reports. Complete all applicable fields.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Personal Details */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2"><User className="h-4 w-4" /> Personal Details</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div><Label>Full Legal Name</Label><Input value={taxpayerProfile.fullName || ''} onChange={(e) => setTaxpayerProfile({ ...taxpayerProfile, fullName: e.target.value })} /></div>
                  <div><Label>Date of Birth</Label><Input type="date" value={taxpayerProfile.dateOfBirth?.split('T')[0] || ''} onChange={(e) => setTaxpayerProfile({ ...taxpayerProfile, dateOfBirth: e.target.value })} /></div>
                  <div><Label>National Insurance Number (NINO)</Label><Input placeholder="AB123456C" value={taxpayerProfile.nationalInsuranceNumber || ''} onChange={(e) => setTaxpayerProfile({ ...taxpayerProfile, nationalInsuranceNumber: e.target.value })} /></div>
                  <div><Label>Unique Taxpayer Reference (UTR)</Label><Input placeholder="10 digits" value={taxpayerProfile.utr || ''} onChange={(e) => setTaxpayerProfile({ ...taxpayerProfile, utr: e.target.value })} /></div>
                </div>
              </div>

              {/* Address */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-4">Address</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div><Label>Address Line 1</Label><Input value={taxpayerProfile.addressLine1 || ''} onChange={(e) => setTaxpayerProfile({ ...taxpayerProfile, addressLine1: e.target.value })} /></div>
                  <div><Label>Address Line 2</Label><Input value={taxpayerProfile.addressLine2 || ''} onChange={(e) => setTaxpayerProfile({ ...taxpayerProfile, addressLine2: e.target.value })} /></div>
                  <div><Label>City</Label><Input value={taxpayerProfile.city || ''} onChange={(e) => setTaxpayerProfile({ ...taxpayerProfile, city: e.target.value })} /></div>
                  <div><Label>Postcode</Label><Input value={taxpayerProfile.postcode || ''} onChange={(e) => setTaxpayerProfile({ ...taxpayerProfile, postcode: e.target.value })} /></div>
                  <div>
                    <Label>Residency Status</Label>
                    <Select value={taxpayerProfile.residencyStatus || ''} onValueChange={(v) => setTaxpayerProfile({ ...taxpayerProfile, residencyStatus: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UK Resident">UK Resident</SelectItem>
                        <SelectItem value="Non-Resident">Non-Resident</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Company Details */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2"><Building className="h-4 w-4" /> Company Details (if applicable)</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div><Label>Company Name</Label><Input value={taxpayerProfile.companyName || ''} onChange={(e) => setTaxpayerProfile({ ...taxpayerProfile, companyName: e.target.value })} /></div>
                  <div><Label>Trading Name</Label><Input value={taxpayerProfile.tradingName || ''} onChange={(e) => setTaxpayerProfile({ ...taxpayerProfile, tradingName: e.target.value })} /></div>
                  <div><Label>Company Registration Number (CRN)</Label><Input value={taxpayerProfile.companyRegistrationNumber || ''} onChange={(e) => setTaxpayerProfile({ ...taxpayerProfile, companyRegistrationNumber: e.target.value })} /></div>
                  <div><Label>Company UTR</Label><Input value={taxpayerProfile.companyUtr || ''} onChange={(e) => setTaxpayerProfile({ ...taxpayerProfile, companyUtr: e.target.value })} /></div>
                </div>
              </div>

              {/* VAT */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-4">VAT Registration</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox checked={taxpayerProfile.isVatRegistered} onCheckedChange={(checked) => setTaxpayerProfile({ ...taxpayerProfile, isVatRegistered: !!checked })} />
                    <Label>VAT Registered</Label>
                  </div>
                  {taxpayerProfile.isVatRegistered && (
                    <>
                      <div><Label>VAT Registration Number</Label><Input value={taxpayerProfile.vatRegistrationNumber || ''} onChange={(e) => setTaxpayerProfile({ ...taxpayerProfile, vatRegistrationNumber: e.target.value })} /></div>
                      <div>
                        <Label>VAT Scheme</Label>
                        <Select value={taxpayerProfile.vatScheme || ''} onValueChange={(v) => setTaxpayerProfile({ ...taxpayerProfile, vatScheme: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Standard">Standard</SelectItem>
                            <SelectItem value="Flat Rate">Flat Rate</SelectItem>
                            <SelectItem value="Cash">Cash Accounting</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Agent Details */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-4">Agent / Accountant Details</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div><Label>Agent Name / Firm</Label><Input value={taxpayerProfile.agentName || ''} onChange={(e) => setTaxpayerProfile({ ...taxpayerProfile, agentName: e.target.value })} /></div>
                  <div><Label>Agent Reference Number (ARN)</Label><Input value={taxpayerProfile.agentReferenceNumber || ''} onChange={(e) => setTaxpayerProfile({ ...taxpayerProfile, agentReferenceNumber: e.target.value })} /></div>
                  <div><Label>Agent Email</Label><Input type="email" value={taxpayerProfile.agentEmail || ''} onChange={(e) => setTaxpayerProfile({ ...taxpayerProfile, agentEmail: e.target.value })} /></div>
                  <div><Label>Agent Phone</Label><Input value={taxpayerProfile.agentPhone || ''} onChange={(e) => setTaxpayerProfile({ ...taxpayerProfile, agentPhone: e.target.value })} /></div>
                  <div className="flex items-center space-x-2">
                    <Checkbox checked={taxpayerProfile.hasAgentAuthority} onCheckedChange={(checked) => setTaxpayerProfile({ ...taxpayerProfile, hasAgentAuthority: !!checked })} />
                    <Label>Agent has authority to act on my behalf</Label>
                  </div>
                </div>
              </div>

              {/* Settings */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-4">Accounting Settings</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Accounting Basis</Label>
                    <Select value={taxpayerProfile.accountingBasis || ''} onValueChange={(v) => setTaxpayerProfile({ ...taxpayerProfile, accountingBasis: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cash Basis">Cash Basis</SelectItem>
                        <SelectItem value="Accruals Basis">Accruals Basis</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveProfile} disabled={savingProfile} className="w-full">
                {savingProfile ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Profile
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ===== EXPORT REPORTS ===== */}
      {activeReport === 'exports' && (
        <div className="space-y-6">
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Download className="h-5 w-5" /> Export Centre</CardTitle>
              <CardDescription>Export reports for tax year {selectedTaxYear}. All Excel exports include multi-sheet workbooks with Summary, Categories, {entityRegime === 'companies_house' ? 'CT600 Boxes' : 'HMRC Boxes'}, and Tax Calculation.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => generateExcel('summary', {})} className="bg-gradient-to-r from-green-700 to-green-500 hover:from-green-600 hover:to-green-400 shadow-sm">
                  <FileSpreadsheet className="h-4 w-4 mr-2" /> Full Workbook (Excel)
                </Button>
                <Button variant="outline" onClick={() => {
                  if (entityRegime === 'companies_house') generateCT600Report();
                  else generateHMRCReport();
                }}>
                  <FileDown className="h-4 w-4 mr-2" /> {entityRegime === 'companies_house' ? 'CT600 Report' : 'SA103 Report'} (PDF)
                </Button>
                {taxpayerProfile.isVatRegistered && (
                  <Button variant="outline" onClick={generateVATReturn}>
                    <Receipt className="h-4 w-4 mr-2" /> VAT Return (PDF)
                  </Button>
                )}
                <Button variant="secondary" onClick={generateAccountantPack} disabled={exporting}>
                  <Briefcase className="h-4 w-4 mr-2" /> Accountant Pack
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileSpreadsheet className="h-5 w-5" /> Bills Report</CardTitle>
                <CardDescription>Export all active bills</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" onClick={() => handleExport('bills', 'csv')} disabled={exporting}><Download className="h-4 w-4 mr-1" /> CSV</Button>
                  <Button size="sm" variant="outline" onClick={() => handleExport('bills', 'excel')} disabled={exporting}><FileSpreadsheet className="h-4 w-4 mr-1" /> Excel</Button>
                  <Button size="sm" variant="secondary" onClick={() => handleExport('bills', 'pdf')} disabled={exporting}><FileDown className="h-4 w-4 mr-1" /> PDF</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Invoices Report</CardTitle>
                <CardDescription>Export all invoices</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" onClick={() => handleExport('invoices', 'csv')} disabled={exporting}><Download className="h-4 w-4 mr-1" /> CSV</Button>
                  <Button size="sm" variant="outline" onClick={() => handleExport('invoices', 'excel')} disabled={exporting}><FileSpreadsheet className="h-4 w-4 mr-1" /> Excel</Button>
                  <Button size="sm" variant="secondary" onClick={() => handleExport('invoices', 'pdf')} disabled={exporting}><FileDown className="h-4 w-4 mr-1" /> PDF</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Landmark className="h-5 w-5" /> Bank Transactions</CardTitle>
                <CardDescription>Export bank transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" onClick={() => handleExport('statements', 'csv')} disabled={exporting}><Download className="h-4 w-4 mr-1" /> CSV</Button>
                  <Button size="sm" variant="outline" onClick={() => handleExport('statements', 'excel')} disabled={exporting}><FileSpreadsheet className="h-4 w-4 mr-1" /> Excel</Button>
                  <Button size="sm" variant="secondary" onClick={() => handleExport('statements', 'pdf')} disabled={exporting}><FileDown className="h-4 w-4 mr-1" /> PDF</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><PieChart className="h-5 w-5" /> Categories</CardTitle>
                <CardDescription>Export category structure</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" onClick={() => handleExport('categories', 'csv')} disabled={exporting}><Download className="h-4 w-4 mr-1" /> CSV</Button>
                  <Button size="sm" variant="outline" onClick={() => handleExport('categories', 'excel')} disabled={exporting}><FileSpreadsheet className="h-4 w-4 mr-1" /> Excel</Button>
                  <Button size="sm" variant="secondary" onClick={() => handleExport('categories', 'pdf')} disabled={exporting}><FileDown className="h-4 w-4 mr-1" /> PDF</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Full Summary</CardTitle>
                <CardDescription>Complete financial report</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" onClick={() => handleExport('summary', 'csv')} disabled={exporting}><Download className="h-4 w-4 mr-1" /> CSV</Button>
                  <Button size="sm" variant="outline" onClick={() => handleExport('all', 'json')} disabled={exporting}><Download className="h-4 w-4 mr-1" /> JSON (MTD)</Button>
                  <Button size="sm" variant="secondary" onClick={() => handleExport('summary', 'pdf')} disabled={exporting}><FileDown className="h-4 w-4 mr-1" /> PDF</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileArchive className="h-5 w-5 text-blue-600" /> Accountant Pack</CardTitle>
                <CardDescription>CSV + Summary for your accountant</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={generateAccountantPack} disabled={exporting} className="w-full bg-blue-600 hover:bg-blue-700">
                  <Briefcase className="h-4 w-4 mr-2" /> Generate Pack
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ===== BUDGETS ===== */}
      {activeReport === 'budgets' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Category Budgets</h3>
              <p className="text-sm text-muted-foreground">Set monthly spending limits</p>
            </div>
            <Dialog open={showBudgetDialog} onOpenChange={setShowBudgetDialog}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" /> Add Budget</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Budget</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div>
                    <Label>Category</Label>
                    <Select value={newBudget.categoryId} onValueChange={(v) => setNewBudget({ ...newBudget, categoryId: v })}>
                      <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        {categoriesWithoutBudget.map(cat => (<SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Monthly Budget (£)</Label><Input type="number" value={newBudget.amount} onChange={(e) => setNewBudget({ ...newBudget, amount: e.target.value })} /></div>
                  <div><Label>Alert at (%)</Label><Input type="number" value={newBudget.alertAt} onChange={(e) => setNewBudget({ ...newBudget, alertAt: e.target.value })} /></div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowBudgetDialog(false)}>Cancel</Button>
                  <Button onClick={handleCreateBudget}>Create</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {budgets.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No budgets set. Create one to track spending.</CardContent></Card>
          ) : (
            <div className="grid gap-4">
              {budgets.map(budget => (
                <Card key={budget.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{budget.category?.name}</span>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteBudget(budget.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    </div>
                    <Progress value={Math.min(budget.percentageUsed, 100)} className={budget.isOverBudget ? 'bg-red-200' : budget.isNearLimit ? 'bg-yellow-200' : ''} />
                    <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                      <span>{formatCurrency(budget.currentSpending)} spent</span>
                      <span>{formatCurrency(budget.remaining)} remaining of {formatCurrency(budget.amount)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
    </TooltipProvider>
  );
}
