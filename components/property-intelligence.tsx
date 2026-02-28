'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ChevronDown, ChevronUp, Building2, User, Users, Shield, Heart, Landmark,
  PiggyBank, Key, AlertTriangle, CheckCircle2, Info, Calculator,
  TrendingUp, CreditCard, Scale, BarChart3, Home, Percent,
  Lightbulb, Target, Clock, Banknote, FileText, Brain, Search,
} from 'lucide-react';

// ============================================================
// GOV.UK Verified Tax Data (2025/26 tax year)
// ============================================================

const SDLT_BANDS_STANDARD = [
  { from: 0, to: 125000, rate: 0 },
  { from: 125001, to: 250000, rate: 0.02 },
  { from: 250001, to: 925000, rate: 0.05 },
  { from: 925001, to: 1500000, rate: 0.10 },
  { from: 1500001, to: Infinity, rate: 0.12 },
];
const SDLT_BANDS_FTB = [
  { from: 0, to: 300000, rate: 0 },
  { from: 300001, to: 500000, rate: 0.05 },
];
const SDLT_ADDITIONAL_SURCHARGE = 0.05;
const SDLT_NON_RESIDENT_SURCHARGE = 0.02;
const SDLT_CORPORATE_FLAT_RATE = 0.15;
const SDLT_CORPORATE_THRESHOLD = 500000;

function calculateSDLT(price: number, buyerType: string) {
  const breakdown: { band: string; tax: number }[] = [];
  let total = 0;
  if (buyerType === 'first_time' && price <= 500000) {
    for (const band of SDLT_BANDS_FTB) {
      const taxable = Math.min(Math.max(price - band.from + 1, 0), band.to - band.from + 1);
      if (taxable > 0) {
        const tax = taxable * band.rate;
        total += tax;
        breakdown.push({ band: `£${band.from.toLocaleString()} - £${band.to.toLocaleString()} @ ${(band.rate * 100)}%`, tax });
      }
    }
  } else if (buyerType === 'corporate' && price > SDLT_CORPORATE_THRESHOLD) {
    total = price * SDLT_CORPORATE_FLAT_RATE;
    breakdown.push({ band: `Entire price @ ${SDLT_CORPORATE_FLAT_RATE * 100}% (corporate flat rate)`, tax: total });
  } else {
    const surcharge = buyerType === 'additional' ? SDLT_ADDITIONAL_SURCHARGE :
                      buyerType === 'non_resident' ? SDLT_ADDITIONAL_SURCHARGE + SDLT_NON_RESIDENT_SURCHARGE :
                      buyerType === 'company' ? SDLT_ADDITIONAL_SURCHARGE : 0;
    for (const band of SDLT_BANDS_STANDARD) {
      const taxable = Math.min(Math.max(price - band.from + 1, 0), band.to === Infinity ? Infinity : band.to - band.from + 1);
      if (taxable > 0 && taxable !== Infinity) {
        const rate = band.rate + surcharge;
        const tax = taxable * rate;
        total += tax;
        breakdown.push({ band: `£${band.from.toLocaleString()} - £${(band.to === Infinity ? price : band.to).toLocaleString()} @ ${(rate * 100).toFixed(1)}%`, tax });
      }
    }
  }
  return { total: Math.round(total), breakdown, effectiveRate: price > 0 ? ((total / price) * 100).toFixed(2) : '0' };
}

function calcMortgagePayment(principal: number, annualRate: number, termYears: number) {
  if (annualRate === 0) return principal / (termYears * 12);
  const r = annualRate / 100 / 12;
  const n = termYears * 12;
  return principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

const fmt = (n: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(n);
const fmtD = (n: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 2 }).format(n);

// ============================================================
// Purchase Mode Data — all GOV.UK sourced
// ============================================================

interface PMode {
  id: string; title: string; subtitle: string; icon: React.ElementType; gradient: string;
  taxes: { label: string; text: string }[];
  pros: string[]; cons: string[]; alerts: string[]; legal: string[]; timeline: string; bestFor: string;
}

const MODES: PMode[] = [
  {
    id: 'personal', title: 'Personal (Individual)', subtitle: 'Buy in your own name', icon: User, gradient: 'from-blue-500 to-indigo-600',
    taxes: [
      { label: 'SDLT', text: 'Standard rates. First-time buyer relief: 0% up to £300,000, 5% on £300,001-£500,000.' },
      { label: 'IHT', text: '40% on estate above £325,000. Residence nil-rate band adds £175,000 if passing home to direct descendants (total £500,000 per person, £1M for couples).' },
      { label: 'CGT', text: 'Main home: NO CGT (Private Residence Relief). Investment property: 18% basic / 24% higher rate. £3,000 annual allowance.' },
      { label: 'Annual', text: 'Council Tax only. No ATED.' },
      { label: 'Mortgage', text: 'Residential mortgage 4-4.5x salary. Best rates. 5% min deposit (10-20% ideal).' },
    ],
    pros: ['Simplest structure — lowest legal costs', 'Best mortgage rates (residential, not commercial)', 'No CGT on main residence', 'First-time buyer SDLT relief available', 'Lifetime ISA bonus can be used (25% govt bonus)'],
    cons: ['Full IHT exposure at 40% above £325k', 'Property goes through probate on death (slow, public, costly)', 'Mortgage interest NOT tax-deductible for BTL since April 2020 (only 20% credit)'],
    alerts: [
      'IHT WARNING: Estate above £325,000 → 40% IHT on excess. A £500,000 property could mean ~£70,000 IHT for beneficiaries.',
      'If you already own a property, 5% SDLT surcharge applies on the entire new purchase.',
      'BTL mortgage interest no longer deductible — only 20% tax credit available since April 2020.',
    ],
    legal: ['gov.uk/inheritance-tax — Nil-rate band £325,000, residence nil-rate £175,000', 'gov.uk/capital-gains-tax/rates — 18%/24% from April 2025', 'gov.uk/stamp-duty-land-tax — First-time buyer relief'],
    timeline: '2-4 months from offer to completion', bestFor: 'First-time buyers purchasing their main home.',
  },
  {
    id: 'joint_tenants', title: 'Joint Tenants', subtitle: 'Equal ownership with right of survivorship', icon: Users, gradient: 'from-teal-500 to-emerald-600',
    taxes: [
      { label: 'SDLT', text: 'Standard rates on full price. First-time buyer relief if BOTH are first-time buyers.' },
      { label: 'IHT', text: 'Right of survivorship: passes automatically to survivor WITHOUT probate. Still counts in estate for IHT.' },
      { label: 'CGT', text: 'Same as personal. Both get PRR on main home. Each has £3,000 CGT allowance.' },
      { label: 'Mortgage', text: 'Joint residential mortgage. Combined income (4-4.5x). Both equally liable.' },
    ],
    pros: ['Automatic right of survivorship — no probate needed', 'Combined income for affordability', 'Each person has own CGT allowance'],
    cons: ['Cannot leave share to anyone else — always goes to co-owner', 'Always 50/50 — no flexibility', 'Creditors of one owner can force sale'],
    alerts: ['You CANNOT leave your share to children or others — it always passes to the joint tenant. Use Tenants in Common if you need flexibility.', 'Both parties are jointly and severally liable for the full mortgage.'],
    legal: ['Joint tenancy creates automatic right of survivorship under English law', 'Either party can sever the joint tenancy by serving notice'],
    timeline: '2-4 months', bestFor: 'Married couples wanting automatic property transfer on death.',
  },
  {
    id: 'tenants_common', title: 'Tenants in Common', subtitle: 'Defined shares that pass via will', icon: Users, gradient: 'from-purple-500 to-violet-600',
    taxes: [
      { label: 'SDLT', text: 'Standard rates on full price.' },
      { label: 'IHT', text: 'Each share is in that person\'s estate. Shares can be left to trust for IHT planning.' },
      { label: 'CGT', text: 'Each owner\'s share assessed separately. PRR on main home.' },
      { label: 'Mortgage', text: 'Joint mortgage. Unequal shares possible (e.g. 70/30).' },
    ],
    pros: ['Flexible shares (60/40, 70/30, etc.)', 'Each share can go to ANYONE via will', 'Enables IHT planning via trusts', 'Ideal for unmarried couples or friends'],
    cons: ['No automatic survivorship — goes through probate', 'More complex legal setup', 'Disputes possible if co-owners disagree'],
    alerts: ['NO automatic survivorship. Without a will, the share passes under intestacy rules — may NOT go to your partner.', 'ALWAYS make a will when buying as Tenants in Common.'],
    legal: ['Tenancy in common allows unequal shares', 'Declaration of Trust recommended to specify terms'],
    timeline: '2-4 months + Declaration of Trust', bestFor: 'Unmarried couples, friends buying together, or IHT estate planning.',
  },
  {
    id: 'limited_company', title: 'Limited Company (SPV)', subtitle: 'Buy through a Special Purpose Vehicle', icon: Building2, gradient: 'from-amber-500 to-orange-600',
    taxes: [
      { label: 'SDLT', text: 'Always pays 5% surcharge. Properties > £500,000: potential 15% flat rate (corporate body rate).' },
      { label: 'Corp Tax', text: '25% on profits > £250k. 19% small profits rate (≤ £50k). Marginal relief between.' },
      { label: 'CGT', text: 'No personal CGT. Company pays Corporation Tax on gains instead.' },
      { label: 'ATED', text: 'Annual Tax on Enveloped Dwellings if property > £500k: £4,400/yr (£500k-£1M) up to £287,550/yr (> £20M).' },
      { label: 'IHT', text: 'Company owns property. Shares form part of estate. Business Property Relief MAY apply if trading company.' },
      { label: 'Mortgage', text: 'SPV/commercial mortgage. 1-2% higher rate. 25-40% deposit. Personal guarantee required.' },
    ],
    pros: ['Mortgage interest FULLY deductible against rental income', 'Corp Tax (19-25%) lower than higher-rate Income Tax (40-45%)', 'Retain profits in company — only taxed on extraction', 'Multiple shareholders for joint ventures'],
    cons: ['5% SDLT surcharge always', 'ATED if property > £500k', 'Higher mortgage rates + larger deposit (25%+)', 'Company running costs: accountant, returns, filing', 'Double taxation on extraction (Corp Tax + dividend tax)'],
    alerts: [
      'ATED: Properties > £500k → annual return + tax from £4,400-£287,550/yr. Property-letting relief may apply.',
      'SDLT: Companies ALWAYS pay 5% surcharge. Above £500k, 15% flat rate possible.',
      'Most lenders need 2+ years trading history or specialist SPV mortgage.',
      'Corp Tax is 25% for profits > £250k (Source: gov.uk/corporation-tax-rates).',
    ],
    legal: ['gov.uk/corporation-tax-rates — 25% main / 19% small profits', 'gov.uk/guidance/annual-tax-on-enveloped-dwellings-the-basics', 'gov.uk/stamp-duty-land-tax — Corporate bodies: special rates'],
    timeline: '3-6 months (company setup + SPV mortgage)', bestFor: 'BTL investors, higher-rate taxpayers with portfolio, business owners.',
  },
  {
    id: 'trust', title: 'Trust (Family/Discretionary)', subtitle: 'Property held in trust for beneficiaries', icon: Shield, gradient: 'from-rose-500 to-pink-600',
    taxes: [
      { label: 'SDLT', text: 'Standard rates + 5% surcharge.' },
      { label: 'IHT Entry', text: '20% charge on value above £325,000 when transferring INTO trust.' },
      { label: 'IHT 10-Year', text: 'Up to 6% of value above nil-rate band every 10 years.' },
      { label: 'CGT', text: 'Trustees pay 24% on residential property. Only £1,500 annual allowance (half personal).' },
      { label: 'Income Tax', text: 'Rental income taxed at 45% within the trust.' },
      { label: 'Mortgage', text: 'Very limited. Most lenders don\'t offer trust mortgages. Cash or specialist only.' },
    ],
    pros: ['Property outside your estate for IHT', 'Control who inherits and when', 'Protection from beneficiaries\' creditors/divorce', 'Can protect from care home fees in some cases'],
    cons: ['20% IHT entry charge above nil-rate band', '10-yearly charge up to 6%', 'Income taxed at 45%', 'Complex + expensive to maintain', 'Limited mortgage options'],
    alerts: [
      'ENTRY CHARGE: Property worth £500k into trust → 20% on £175k excess = £35,000 IHT immediately.',
      '10-YEAR CHARGE: Recurring — up to 6% of value above nil-rate band every decade.',
      'Income within trust taxed at 45% — the highest rate. Expensive for rental property.',
      'Most mainstream lenders will NOT lend to trusts.',
    ],
    legal: ['gov.uk/trusts-taxes — Trust taxation overview', 'Trustees: 24% CGT on residential (gov.uk/capital-gains-tax/rates)', 'Must register with HMRC Trust Registration Service'],
    timeline: '4-8 months', bestFor: 'Wealthy families with significant estate planning needs.',
  },
  {
    id: 'charity', title: 'Charity / CIO', subtitle: 'Purchase through a charitable organisation', icon: Heart, gradient: 'from-emerald-500 to-green-600',
    taxes: [
      { label: 'SDLT', text: 'EXEMPT if used for charitable purposes.' },
      { label: 'IHT', text: 'EXEMPT — charitable assets fully outside IHT. Leaving 10%+ to charity reduces IHT from 40% to 36% on rest of estate.' },
      { label: 'CGT', text: 'EXEMPT on disposals for charitable purposes.' },
      { label: 'Rates', text: '80% mandatory business rates relief (up to 100% discretionary).' },
      { label: 'Corp Tax', text: 'No Corporation Tax on charitable trading profits.' },
    ],
    pros: ['SDLT exempt', 'IHT exempt', 'CGT exempt', 'Up to 100% rates relief', 'Leaving 10%+ to charity → IHT rate drops to 36%'],
    cons: ['Property MUST be for charitable purposes — cannot live in it', 'Charity Commission oversight', 'Complex governance requirements', 'Cannot personally benefit'],
    alerts: [
      'PERSONAL USE PROHIBITED. You CANNOT live in a charity-owned property. Breach = loss of status + potential fraud.',
      'Setting up a charity solely for tax avoidance is ILLEGAL.',
      'Legitimate strategy: leaving 10%+ of net estate to charity reduces IHT from 40% to 36% (gov.uk/inheritance-tax).',
    ],
    legal: ['gov.uk/inheritance-tax — Reduced rate 36% if 10%+ to charity', 'Charity Commission property purchase guidance'],
    timeline: '6-12 months', bestFor: 'Genuine charitable purposes only (community centres, housing associations). NOT personal tax planning.',
  },
  {
    id: 'pension', title: 'Pension Fund (SSAS/SIPP)', subtitle: 'Buy commercial property through your pension', icon: PiggyBank, gradient: 'from-cyan-500 to-blue-600',
    taxes: [
      { label: 'SDLT', text: 'Standard COMMERCIAL rates (no residential surcharges — must be commercial only).' },
      { label: 'IHT', text: 'EXEMPT — pension assets are outside estate.' },
      { label: 'CGT', text: 'EXEMPT — gains within pension are tax-free.' },
      { label: 'Income Tax', text: 'No tax on rental income within pension. Rent from your business is tax-deductible.' },
      { label: 'Mortgage', text: 'SSAS can borrow up to 50% of net assets. SIPP lending very restricted.' },
    ],
    pros: ['No IHT', 'No CGT', 'No income tax on rent', 'Business rent is tax-deductible', 'Tax-free growth', 'On death before 75, passes to beneficiaries tax-free'],
    cons: ['ONLY commercial property — residential PROHIBITED', 'Limited to available pension funds', 'SSAS borrowing max 50%', 'Cannot use as residence', 'Pension access from age 55 (57 from 2028)'],
    alerts: [
      'RESIDENTIAL PROPERTY IS PROHIBITED. Buying a house/flat in SIPP/SSAS = 55% tax penalty from HMRC.',
      'Only commercial: offices, shops, warehouses, land.',
      'Your business CAN lease the property from the pension — rent is tax-deductible.',
    ],
    legal: ['HMRC Registered Pension Scheme rules — Section 174A Finance Act 2004', 'SSAS borrowing: max 50% (Regulation 5)', 'Annual pension contribution allowance: £60,000'],
    timeline: '3-6 months', bestFor: 'Business owners buying their own commercial premises tax-efficiently.',
  },
  {
    id: 'shared_ownership', title: 'Shared Ownership', subtitle: 'Buy 10-75% share, rent the rest', icon: Key, gradient: 'from-indigo-500 to-purple-600',
    taxes: [
      { label: 'SDLT', text: 'On your share only (or option to pay on full value upfront).' },
      { label: 'IHT', text: 'Your share is in your estate.' },
      { label: 'CGT', text: 'PRR applies to your share if main home.' },
      { label: 'Annual', text: 'Rent on housing association share (~2.75%/yr) + service charges + Council Tax.' },
      { label: 'Mortgage', text: 'Shared ownership mortgage. Deposit = 5-10% of YOUR share.' },
    ],
    pros: ['Much lower deposit (5-10% of your share)', 'Get on ladder with lower income', 'Staircase to 100% over time', 'SDLT only on share purchased'],
    cons: ['Pay rent + mortgage + service charges', 'All homes are LEASEHOLD', 'Rent increases annually (RPI + 0.5%)', 'Complex to sell', 'Staircasing based on current market value'],
    alerts: [
      'TOTAL COST: Mortgage on share + rent on association share + service charges. Budget for all three.',
      'Rent increases linked to inflation + 0.5-1%. Can rise significantly in high-inflation periods.',
      'Staircasing: new share price based on CURRENT market value — may cost more if property appreciated.',
    ],
    legal: ['gov.uk/shared-ownership-scheme — Buy 10-75%', 'Eligibility: household income under £80,000 (£90,000 London)'],
    timeline: '3-6 months', bestFor: 'First-time buyers who cannot afford full purchase. Lower-income households.',
  },
  {
    id: 'right_to_buy', title: 'Right to Buy', subtitle: 'Council tenants buying at a discount', icon: Landmark, gradient: 'from-red-500 to-rose-600',
    taxes: [
      { label: 'SDLT', text: 'On the DISCOUNTED price (not market value).' },
      { label: 'IHT', text: 'Standard personal rules apply.' },
      { label: 'CGT', text: 'PRR if main home — no CGT.' },
      { label: 'Mortgage', text: 'Standard residential. Some 100% mortgages available for RTB.' },
    ],
    pros: ['Discount up to £96,000 (£127,900 London)', 'SDLT on discounted price', 'Some 100% mortgage options', 'Discount increases with tenancy length'],
    cons: ['Must repay discount if sell within 5 years (100% yr1 → 20% yr5)', 'Higher service charges on ex-council', 'Council has first refusal if sell within 10 years', 'You cover all repairs'],
    alerts: [
      'REPAYMENT: Sell within 5 years → repay discount (100% yr1, 80% yr2, 60% yr3, 40% yr4, 20% yr5).',
      'Must be secure council tenant with 3+ years public sector tenancy.',
      'Not all properties qualify (sheltered housing, properties due for demolition excluded).',
    ],
    legal: ['gov.uk/right-to-buy-buying-your-council-home', 'Max discount 2024/25: £96,000 outside London, £127,900 London'],
    timeline: '2-4 months from application', bestFor: 'Council tenants with 3+ years tenancy wanting to buy their home at significant discount.',
  },
];

// Placeholder for Receipt icon used in the tax grid
const Receipt = FileText;

// ============================================================
// Main Export
// ============================================================

export function PropertyIntelligence() {
  const [activeTab, setActiveTab] = useState<'modes' | 'sdlt' | 'mortgage' | 'rentvsbuy' | 'credit'>('modes');
  const [expandedMode, setExpandedMode] = useState<string | null>(null);
  const [sdltPrice, setSdltPrice] = useState('350000');
  const [sdltBuyerType, setSdltBuyerType] = useState('standard');
  const [mortSalary, setMortSalary] = useState('50000');
  const [mortSalary2, setMortSalary2] = useState('');
  const [mortDeposit, setMortDeposit] = useState('30000');
  const [mortRate, setMortRate] = useState('4.5');
  const [mortTerm, setMortTerm] = useState('25');
  const [rvbRent, setRvbRent] = useState('1200');
  const [rvbPrice, setRvbPrice] = useState('350000');
  const [rvbDeposit, setRvbDeposit] = useState('35000');
  const [rvbRate, setRvbRate] = useState('4.5');
  const [rvbGrowth, setRvbGrowth] = useState('3');
  const [rvbInvest, setRvbInvest] = useState('7');
  const [rvbYears, setRvbYears] = useState('10');

  const sdltResult = useMemo(() => calculateSDLT(parseFloat(sdltPrice) || 0, sdltBuyerType), [sdltPrice, sdltBuyerType]);

  const mortResult = useMemo(() => {
    const s1 = parseFloat(mortSalary) || 0, s2 = parseFloat(mortSalary2) || 0;
    const dep = parseFloat(mortDeposit) || 0, rate = parseFloat(mortRate) || 4.5, term = parseInt(mortTerm) || 25;
    const total = s1 + s2;
    const b4 = total * 4, b45 = total * 4.5;
    const p4 = calcMortgagePayment(b4, rate, term), p45 = calcMortgagePayment(b45, rate, term);
    return { total, b4, b45, prop4: b4 + dep, prop45: b45 + dep, p4, p45, tp4: p4 * term * 12, tp45: p45 * term * 12, dep, rate, term };
  }, [mortSalary, mortSalary2, mortDeposit, mortRate, mortTerm]);

  const rvb = useMemo(() => {
    const rent = parseFloat(rvbRent) || 0, price = parseFloat(rvbPrice) || 0, dep = parseFloat(rvbDeposit) || 0;
    const rate = parseFloat(rvbRate) || 4.5, growth = parseFloat(rvbGrowth) || 3;
    const inv = parseFloat(rvbInvest) || 7, years = parseInt(rvbYears) || 10;
    const mortgage = price - dep;
    const mp = calcMortgagePayment(mortgage, rate, 25);
    const sdlt = calculateSDLT(price, 'standard').total;
    const costs = sdlt + 3500;
    let rentTot = 0, pot = dep + costs, annRent = rent * 12;
    for (let y = 0; y < years; y++) { rentTot += annRent; pot *= (1 + inv / 100); annRent *= 1.03; }
    const totMort = mp * 12 * years;
    const endVal = price * Math.pow(1 + growth / 100, years);
    const maint = price * 0.01 * years;
    const remMort = mortgage * (1 - (years / 25) * 0.6);
    const wBuy = endVal - remMort, wRent = pot;
    return { mp, costs, sdlt, rentTot, pot, totMort, endVal, gain: endVal - price, maint, wBuy, wRent, buyBetter: wBuy > wRent, diff: Math.abs(wBuy - wRent), years };
  }, [rvbRent, rvbPrice, rvbDeposit, rvbRate, rvbGrowth, rvbInvest, rvbYears]);

  const tabs = [
    { id: 'modes' as const, label: 'Purchase Modes', icon: Building2 },
    { id: 'sdlt' as const, label: 'SDLT Calculator', icon: Calculator },
    { id: 'mortgage' as const, label: 'Mortgage', icon: Banknote },
    { id: 'rentvsbuy' as const, label: 'Rent vs Buy', icon: Scale },
    { id: 'credit' as const, label: 'Credit Score', icon: CreditCard },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Property Purchase Intelligence</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">AI-powered guidance, calculators & tax analysis — all sourced from GOV.UK</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-sm' : 'bg-muted/50 hover:bg-muted text-muted-foreground'}`}>
                  <Icon className="h-4 w-4" />{tab.label}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* PURCHASE MODES */}
      {activeTab === 'modes' && <PurchaseModesTab expandedMode={expandedMode} setExpandedMode={setExpandedMode} />}
      {activeTab === 'sdlt' && <SDLTTab price={sdltPrice} setPrice={setSdltPrice} buyerType={sdltBuyerType} setBuyerType={setSdltBuyerType} result={sdltResult} />}
      {activeTab === 'mortgage' && <MortgageTab s1={mortSalary} setS1={setMortSalary} s2={mortSalary2} setS2={setMortSalary2} dep={mortDeposit} setDep={setMortDeposit} rate={mortRate} setRate={setMortRate} term={mortTerm} setTerm={setMortTerm} r={mortResult} />}
      {activeTab === 'rentvsbuy' && <RentVsBuyTab rent={rvbRent} setRent={setRvbRent} price={rvbPrice} setPrice={setRvbPrice} dep={rvbDeposit} setDep={setRvbDeposit} rate={rvbRate} setRate={setRvbRate} growth={rvbGrowth} setGrowth={setRvbGrowth} inv={rvbInvest} setInv={setRvbInvest} years={rvbYears} setYears={setRvbYears} r={rvb} />}
      {activeTab === 'credit' && <CreditScoreTab />}
    </div>
  );
}

// ============================================================
// Tab Components
// ============================================================

function PurchaseModesTab({ expandedMode, setExpandedMode }: { expandedMode: string | null; setExpandedMode: (v: string | null) => void }) {
  return (
    <div className="space-y-3">
      <div className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/20">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 text-violet-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-violet-700 dark:text-violet-300">Intelligent Purchase Mode Comparison</p>
            <p className="text-xs text-violet-600 dark:text-violet-400 mt-1">
              Click any mode to see full tax implications, smart alerts, and legal sources. All rates from GOV.UK (2025/26).
              The system highlights risks you may not be aware of.
            </p>
          </div>
        </div>
      </div>
      {MODES.map(m => {
        const Icon = m.icon;
        const open = expandedMode === m.id;
        return (
          <Card key={m.id} className="overflow-hidden">
            <button onClick={() => setExpandedMode(open ? null : m.id)} className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors">
              <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${m.gradient} flex items-center justify-center shadow-sm flex-shrink-0`}><Icon className="h-5 w-5 text-white" /></div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{m.title}</p>
                <p className="text-xs text-muted-foreground truncate">{m.subtitle}</p>
              </div>
              {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>
            {open && (
              <CardContent className="pt-0 pb-5 space-y-4 border-t">
                {m.alerts.map((a, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30">
                    <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-800 dark:text-red-300">{a}</p>
                  </div>
                ))}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {m.taxes.map((t, i) => (
                    <div key={i} className="p-3 rounded-lg border space-y-1">
                      <p className="text-xs font-medium flex items-center gap-1"><Receipt className="h-3 w-3" />{t.label}</p>
                      <p className="text-xs text-muted-foreground">{t.text}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Advantages</p>
                    {m.pros.map((p, i) => (<div key={i} className="flex items-start gap-2 text-xs"><CheckCircle2 className="h-3 w-3 text-emerald-500 flex-shrink-0 mt-0.5" /><span className="text-muted-foreground">{p}</span></div>))}
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-red-600 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Disadvantages</p>
                    {m.cons.map((c, i) => (<div key={i} className="flex items-start gap-2 text-xs"><AlertTriangle className="h-3 w-3 text-red-400 flex-shrink-0 mt-0.5" /><span className="text-muted-foreground">{c}</span></div>))}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30">
                    <p className="text-xs font-medium text-blue-700 dark:text-blue-300 flex items-center gap-1"><Clock className="h-3 w-3" /> Timeline</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">{m.timeline}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30">
                    <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-1"><Target className="h-3 w-3" /> Best For</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">{m.bestFor}</p>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                  <p className="text-xs font-medium flex items-center gap-1"><FileText className="h-3 w-3" /> Legal Sources</p>
                  {m.legal.map((l, i) => (<p key={i} className="text-[11px] text-muted-foreground">{l}</p>))}
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function SDLTTab({ price, setPrice, buyerType, setBuyerType, result }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2"><Calculator className="h-5 w-5 text-violet-500" />Stamp Duty Land Tax Calculator</CardTitle>
        <p className="text-xs text-muted-foreground">GOV.UK rates from 1 April 2025. Source: gov.uk/stamp-duty-land-tax</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5"><Label>Property Price (£)</Label><Input type="number" step="5000" value={price} onChange={(e: any) => setPrice(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Buyer Type</Label>
            <Select value={buyerType} onValueChange={setBuyerType}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard Purchase</SelectItem>
                <SelectItem value="first_time">First-Time Buyer</SelectItem>
                <SelectItem value="additional">Additional Property (+5%)</SelectItem>
                <SelectItem value="company">Company/Trust (+5%)</SelectItem>
                <SelectItem value="non_resident">Non-UK Resident (+7%)</SelectItem>
                <SelectItem value="corporate">Corporate Body (15% flat)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white">
            <p className="text-xs opacity-80">Total SDLT</p>
            <p className="text-2xl font-bold">{fmt(result.total)}</p>
            <p className="text-xs opacity-70">Effective rate: {result.effectiveRate}%</p>
          </div>
          <div className="p-4 rounded-xl border col-span-2">
            <p className="text-xs font-medium mb-2">Breakdown</p>
            {result.breakdown.length === 0 ? <p className="text-sm text-emerald-600 font-medium">No SDLT to pay!</p> :
              result.breakdown.map((b: any, i: number) => (
                <div key={i} className="flex justify-between text-xs py-1 border-b last:border-0">
                  <span className="text-muted-foreground">{b.band}</span><span className="font-medium">{fmt(b.tax)}</span>
                </div>
              ))}
          </div>
        </div>
        {buyerType === 'first_time' && parseFloat(price) > 500000 && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30">
            <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 dark:text-amber-300">First-time buyer relief NOT available for properties over £500,000. Standard rates applied.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MortgageTab({ s1, setS1, s2, setS2, dep, setDep, rate, setRate, term, setTerm, r }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2"><Banknote className="h-5 w-5 text-violet-500" />Mortgage Affordability Calculator</CardTitle>
        <p className="text-xs text-muted-foreground">UK lenders typically offer 4-4.5x annual salary.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5"><Label>Your Annual Salary (£)</Label><Input type="number" step="1000" value={s1} onChange={(e: any) => setS1(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Partner Salary (£) — optional</Label><Input type="number" step="1000" placeholder="0" value={s2} onChange={(e: any) => setS2(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Deposit Available (£)</Label><Input type="number" step="1000" value={dep} onChange={(e: any) => setDep(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Interest Rate (%)</Label><Input type="number" step="0.1" value={rate} onChange={(e: any) => setRate(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Term (years)</Label><Input type="number" value={term} onChange={(e: any) => setTerm(e.target.value)} /></div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Max Borrow (4x)', val: r.b4, g: 'from-blue-500 to-indigo-600' },
            { label: 'Max Borrow (4.5x)', val: r.b45, g: 'from-violet-500 to-purple-600' },
            { label: 'Max Property (4x)', val: r.prop4, g: 'from-emerald-500 to-green-600' },
            { label: 'Max Property (4.5x)', val: r.prop45, g: 'from-amber-500 to-orange-600' },
          ].map(c => (
            <div key={c.label} className={`p-3 rounded-xl bg-gradient-to-br ${c.g} text-white`}>
              <p className="text-[10px] opacity-80">{c.label}</p><p className="text-lg font-bold">{fmt(c.val)}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[{ label: '4x salary', mp: r.p4, tp: r.tp4, borrow: r.b4 }, { label: '4.5x salary', mp: r.p45, tp: r.tp45, borrow: r.b45 }].map(s => (
            <div key={s.label} className="p-4 rounded-xl border space-y-2">
              <p className="text-sm font-semibold">At {s.label}</p>
              <div className="text-xs space-y-1 text-muted-foreground">
                <p>Monthly payment: <strong className="text-foreground">{fmtD(s.mp)}</strong></p>
                <p>Total over {r.term} years: <strong className="text-foreground">{fmt(s.tp)}</strong></p>
                <p>Total interest: <strong className="text-red-500">{fmt(s.tp - s.borrow)}</strong></p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30">
          <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-800 dark:text-blue-300">Estimate only. Actual lending depends on credit score, outgoings, employment type, and lender criteria. Self-employed may need 2-3 years of accounts.</p>
        </div>
      </CardContent>
    </Card>
  );
}

function RentVsBuyTab({ rent, setRent, price, setPrice, dep, setDep, rate, setRate, growth, setGrowth, inv, setInv, years, setYears, r }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2"><Scale className="h-5 w-5 text-violet-500" />Rent vs Buy Simulator</CardTitle>
        <p className="text-xs text-muted-foreground">Compare long-term financial outcome of renting (+ investing) vs buying.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="space-y-1.5"><Label>Monthly Rent (£)</Label><Input type="number" step="50" value={rent} onChange={(e: any) => setRent(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Property Price (£)</Label><Input type="number" step="5000" value={price} onChange={(e: any) => setPrice(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Deposit (£)</Label><Input type="number" step="1000" value={dep} onChange={(e: any) => setDep(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Mortgage Rate (%)</Label><Input type="number" step="0.1" value={rate} onChange={(e: any) => setRate(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Property Growth (%/yr)</Label><Input type="number" step="0.5" value={growth} onChange={(e: any) => setGrowth(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Investment Return (%/yr)</Label><Input type="number" step="0.5" value={inv} onChange={(e: any) => setInv(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Time Horizon (years)</Label><Input type="number" value={years} onChange={(e: any) => setYears(e.target.value)} /></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`p-4 rounded-xl border-2 ${r.buyBetter ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-muted'}`}>
            <p className="text-sm font-semibold flex items-center gap-2"><Home className="h-4 w-4" /> Buy Scenario {r.buyBetter && <Badge className="bg-emerald-500 text-white text-[10px]">Better</Badge>}</p>
            <div className="mt-3 space-y-1 text-xs text-muted-foreground">
              <p>Monthly mortgage: <strong className="text-foreground">{fmtD(r.mp)}</strong></p>
              <p>SDLT + costs: <strong className="text-foreground">{fmt(r.costs)}</strong></p>
              <p>Value after {r.years}yr: <strong className="text-emerald-600">{fmt(r.endVal)}</strong></p>
              <p>Equity gain: <strong className="text-emerald-600">{fmt(r.gain)}</strong></p>
              <p>Maintenance: <strong>{fmt(r.maint)}</strong></p>
              <p className="pt-2 border-t font-medium text-sm text-foreground">Net wealth: <strong>{fmt(r.wBuy)}</strong></p>
            </div>
          </div>
          <div className={`p-4 rounded-xl border-2 ${!r.buyBetter ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-muted'}`}>
            <p className="text-sm font-semibold flex items-center gap-2"><Key className="h-4 w-4" /> Rent + Invest {!r.buyBetter && <Badge className="bg-blue-500 text-white text-[10px]">Better</Badge>}</p>
            <div className="mt-3 space-y-1 text-xs text-muted-foreground">
              <p>Starting investment: <strong className="text-foreground">{fmt(parseFloat(dep) + r.costs)}</strong></p>
              <p>Total rent ({r.years}yr): <strong className="text-red-500">{fmt(r.rentTot)}</strong></p>
              <p>Investment pot: <strong className="text-blue-600">{fmt(r.pot)}</strong></p>
              <p className="pt-2 border-t font-medium text-sm text-foreground">Net wealth: <strong>{fmt(r.wRent)}</strong></p>
            </div>
          </div>
        </div>
        <div className={`p-4 rounded-xl text-center ${r.buyBetter ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30' : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30'}`}>
          <p className="text-sm font-semibold">{r.buyBetter ? 'Buying is better' : 'Renting + Investing is better'} by <strong>{fmt(r.diff)}</strong> over {r.years} years</p>
        </div>
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30">
          <Lightbulb className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 dark:text-amber-300">Simplified comparison. Real factors include: tax on gains, inflation, lifestyle value, rate changes. Use as a starting point.</p>
        </div>
      </CardContent>
    </Card>
  );
}

function CreditScoreTab() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><CreditCard className="h-5 w-5 text-violet-500" />UK Credit Score Guide</CardTitle>
          <p className="text-xs text-muted-foreground">Understanding your credit score is essential for mortgage approval.</p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-3">
            <p className="text-sm font-semibold">UK Credit Score Bands</p>
            <p className="text-xs text-muted-foreground">Three main agencies, each with different scales:</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { name: 'Experian', range: '0-999', initial: 'E', grad: 'from-blue-500 to-indigo-600', link: 'experian.co.uk',
                  bands: [{ b: 'Excellent', r: '961-999', c: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30' },{ b: 'Good', r: '881-960', c: 'text-green-600 bg-green-50 dark:bg-green-900/30' },{ b: 'Fair', r: '721-880', c: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30' },{ b: 'Poor', r: '561-720', c: 'text-orange-600 bg-orange-50 dark:bg-orange-900/30' },{ b: 'Very Poor', r: '0-560', c: 'text-red-600 bg-red-50 dark:bg-red-900/30' }] },
                { name: 'Equifax', range: '0-700', initial: 'Q', grad: 'from-red-500 to-rose-600', link: 'clearscore.com',
                  bands: [{ b: 'Excellent', r: '466-700', c: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30' },{ b: 'Good', r: '420-465', c: 'text-green-600 bg-green-50 dark:bg-green-900/30' },{ b: 'Fair', r: '380-419', c: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30' },{ b: 'Poor', r: '280-379', c: 'text-orange-600 bg-orange-50 dark:bg-orange-900/30' },{ b: 'Very Poor', r: '0-279', c: 'text-red-600 bg-red-50 dark:bg-red-900/30' }] },
                { name: 'TransUnion', range: '0-710', initial: 'T', grad: 'from-purple-500 to-violet-600', link: 'creditkarma.co.uk',
                  bands: [{ b: 'Excellent', r: '628-710', c: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30' },{ b: 'Good', r: '604-627', c: 'text-green-600 bg-green-50 dark:bg-green-900/30' },{ b: 'Fair', r: '566-603', c: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30' },{ b: 'Poor', r: '551-565', c: 'text-orange-600 bg-orange-50 dark:bg-orange-900/30' },{ b: 'Very Poor', r: '0-550', c: 'text-red-600 bg-red-50 dark:bg-red-900/30' }] },
              ].map(ag => (
                <div key={ag.name} className="rounded-xl border p-4 space-y-2">
                  <p className="font-semibold text-sm flex items-center gap-2">
                    <span className={`h-6 w-6 rounded bg-gradient-to-br ${ag.grad} flex items-center justify-center text-white text-[10px] font-bold`}>{ag.initial}</span>
                    {ag.name} ({ag.range})
                  </p>
                  <div className="space-y-1">
                    {ag.bands.map(b => (
                      <div key={b.b} className={`flex justify-between text-xs px-2 py-1 rounded ${b.c}`}>
                        <span className="font-medium">{b.b}</span><span>{b.r}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground">Check free: {ag.link}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold">What Affects Your Credit Score</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { f: 'Payment History', w: '~35%', d: 'Late/missed payments are the biggest negative. One missed payment stays 6 years.', icon: Clock, g: 'from-red-500 to-rose-600' },
                { f: 'Credit Utilisation', w: '~30%', d: 'Keep below 30% of limit. £5,000 limit → keep under £1,500.', icon: BarChart3, g: 'from-amber-500 to-orange-600' },
                { f: 'Length of History', w: '~15%', d: 'Longer is better. Don\'t close old accounts.', icon: Clock, g: 'from-blue-500 to-indigo-600' },
                { f: 'Types of Credit', w: '~10%', d: 'Healthy mix (card, loan, contract) shows responsible borrowing.', icon: CreditCard, g: 'from-purple-500 to-violet-600' },
                { f: 'Hard Searches', w: '~10%', d: 'Each application triggers a hard search. Avoid multiple in short period.', icon: Search, g: 'from-emerald-500 to-green-600' },
              ].map(f => {
                const Icon = f.icon;
                return (
                  <div key={f.f} className="rounded-lg border p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`h-7 w-7 rounded-lg bg-gradient-to-br ${f.g} flex items-center justify-center shadow-sm`}><Icon className="h-3.5 w-3.5 text-white" /></div>
                        <span className="text-xs font-semibold">{f.f}</span>
                      </div>
                      <Badge variant="secondary" className="text-[10px]">{f.w}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{f.d}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-emerald-500" /> How to Improve Your Credit Score</p>
            <div className="space-y-2">
              {[
                { a: 'Register on the Electoral Roll', t: 'Immediate', i: 'High', d: 'Lenders verify identity + address. Register at gov.uk/register-to-vote' },
                { a: 'Pay all bills on time', t: 'Ongoing', i: 'Very High', d: 'Set up Direct Debits. Even minimum payments count as "on time".' },
                { a: 'Reduce balances below 30% of limit', t: '1-3 months', i: 'High', d: 'If limit is £5,000, keep balance under £1,500.' },
                { a: 'No new credit 6 months before mortgage', t: '6 months', i: 'Medium', d: 'Hard searches suggest financial difficulty to lenders.' },
                { a: 'Check for errors on credit report', t: 'Immediate', i: 'Variable', d: 'Wrong addresses, unknown accounts — dispute with agency.' },
                { a: 'Use a credit builder card', t: '6-12 months', i: 'Medium', d: 'Small purchases paid IN FULL monthly builds positive history.' },
                { a: 'Close financial links to ex-partners', t: 'Immediate', i: 'Medium', d: 'Joint accounts link your scores. Request disassociation.' },
                { a: 'Keep old accounts open', t: 'Ongoing', i: 'Low-Med', d: 'Older accounts show stability. Don\'t close oldest credit card.' },
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg border">
                  <div className="h-6 w-6 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-0.5">{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold">{tip.a}</span>
                      <Badge variant="secondary" className="text-[10px]">{tip.t}</Badge>
                      <Badge className={`text-[10px] ${tip.i.includes('High') ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>Impact: {tip.i}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{tip.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/20 space-y-3">
            <p className="text-sm font-semibold flex items-center gap-2"><Home className="h-4 w-4 text-violet-500" /> Credit Score for Mortgage Approval</p>
            <p className="text-xs text-muted-foreground">No single "minimum score" exists — each lender has own criteria. General guidance:</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {[
                { level: 'Excellent', desc: 'Best rates, widest lender choice. Approval very likely.', color: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/30 text-emerald-700 dark:text-emerald-300' },
                { level: 'Good/Fair', desc: 'Most lenders will consider you. May not get the absolute best rates.', color: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/30 text-amber-700 dark:text-amber-300' },
                { level: 'Poor/Very Poor', desc: 'Limited lenders. Specialist/subprime mortgages with higher rates. Consider improving score first.', color: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/30 text-red-700 dark:text-red-300' },
              ].map(l => (
                <div key={l.level} className={`p-3 rounded-lg border ${l.color}`}>
                  <p className="text-xs font-semibold">{l.level}</p>
                  <p className="text-[11px] mt-1 opacity-80">{l.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 space-y-2">
            <p className="text-sm font-semibold flex items-center gap-2"><Info className="h-4 w-4 text-blue-500" /> Experian Credit Score Integration</p>
            <p className="text-xs text-muted-foreground">
              Experian offers a Partner API that allows authorised apps to display users' credit scores. 
              To enable this feature, you would need to apply as an Experian Partner at developer.experian.com. 
              Once approved, HomeLedger could display your live Experian score directly here with your consent.
            </p>
            <p className="text-xs text-muted-foreground">
              In the meantime, check your scores for free: <strong>Experian</strong> (experian.co.uk), <strong>Equifax</strong> via ClearScore (clearscore.com), <strong>TransUnion</strong> via Credit Karma (creditkarma.co.uk).
            </p>
          </div>

          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Credit scores are maintained by Experian, Equifax, and TransUnion — regulated by the FCA. 
                Score bands and improvement tips are based on publicly available guidance from these agencies.
                This is informational only and not financial advice.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
