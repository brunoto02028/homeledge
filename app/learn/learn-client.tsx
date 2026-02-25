'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/lib/i18n';
import {
  GraduationCap, Search, Send, Loader2, BookOpen, Home, Briefcase, Building2,
  Receipt, Calculator, FileText, Landmark, ChevronDown, ChevronUp, Bot,
  ExternalLink, HelpCircle, Sparkles,
} from 'lucide-react';

// ---- GLOSSARY DATA ----
const GLOSSARY: { term: string; definition: string; category: string }[] = [
  { term: 'HMRC', definition: 'His Majesty\'s Revenue and Customs — the UK government department responsible for collecting taxes, paying state support, and administering regulatory regimes.', category: 'Tax' },
  { term: 'Self Assessment', definition: 'The system HMRC uses to collect Income Tax from people who don\'t have it deducted automatically (e.g. self-employed, landlords). You file a tax return annually.', category: 'Tax' },
  { term: 'PAYE', definition: 'Pay As You Earn — the system employers use to deduct Income Tax and National Insurance from employees\' wages before paying them.', category: 'Tax' },
  { term: 'National Insurance (NI)', definition: 'Contributions you pay on earnings to qualify for certain state benefits including the State Pension. Different classes for employees, self-employed, and voluntary.', category: 'Tax' },
  { term: 'UTR', definition: 'Unique Taxpayer Reference — a 10-digit number issued by HMRC used to identify you for Self Assessment.', category: 'Tax' },
  { term: 'Tax Code', definition: 'A code used by employers to calculate how much tax to deduct from your pay. The standard code is 1257L (2024/25), giving you £12,570 tax-free.', category: 'Tax' },
  { term: 'Personal Allowance', definition: 'The amount of income you can earn each year without paying tax. Currently £12,570 (2024/25).', category: 'Tax' },
  { term: 'Corporation Tax', definition: 'Tax paid by UK limited companies on their profits. The main rate is 25% for profits over £250,000, with a small profits rate of 19% for profits up to £50,000.', category: 'Tax' },
  { term: 'VAT', definition: 'Value Added Tax — a tax on goods and services. Registration is mandatory when turnover exceeds £90,000. Standard rate is 20%.', category: 'Tax' },
  { term: 'Making Tax Digital (MTD)', definition: 'HMRC\'s programme to digitise the tax system. Businesses must keep digital records and submit returns using compatible software.', category: 'Tax' },
  { term: 'Companies House', definition: 'The UK registrar of companies. All limited companies must file annual accounts and a confirmation statement here.', category: 'Business' },
  { term: 'Confirmation Statement', definition: 'An annual filing to Companies House confirming your company details are up to date. Must be filed at least once every 12 months.', category: 'Business' },
  { term: 'Limited Company', definition: 'A company whose owners\' liability is limited to the amount they invested. It\'s a separate legal entity from its directors/shareholders.', category: 'Business' },
  { term: 'Sole Trader', definition: 'A self-employed person who owns and runs their business as an individual. Simpler setup but unlimited personal liability.', category: 'Business' },
  { term: 'Dividend', definition: 'A payment made by a company to its shareholders from profits. Has its own tax rates and a £1,000 tax-free allowance (2024/25).', category: 'Business' },
  { term: 'Stamp Duty (SDLT)', definition: 'Stamp Duty Land Tax — a tax paid when buying property in England/NI over £250,000. First-time buyers get relief up to £425,000.', category: 'Property' },
  { term: 'Help to Buy ISA', definition: 'A savings account where the government adds 25% bonus (max £3,000) towards your first home deposit. Now closed to new applicants but existing accounts continue.', category: 'Property' },
  { term: 'Lifetime ISA (LISA)', definition: 'Save up to £4,000/year with a 25% government bonus (max £1,000/year). Can be used for first home (under £450,000) or retirement.', category: 'Property' },
  { term: 'ISA', definition: 'Individual Savings Account — a tax-free savings/investment wrapper. Annual allowance is £20,000 across all ISA types.', category: 'Savings' },
  { term: 'Capital Gains Tax (CGT)', definition: 'Tax on profit when you sell assets that have increased in value. Annual allowance of £3,000 (2024/25). Different rates for basic/higher rate taxpayers.', category: 'Tax' },
  { term: 'Allowable Expenses', definition: 'Business costs you can deduct from your income before calculating tax. Must be wholly and exclusively for business purposes.', category: 'Tax' },
  { term: 'Payment on Account', definition: 'Advance payments towards your Self Assessment tax bill, due 31 January and 31 July. Each payment is half of last year\'s bill.', category: 'Tax' },
  { term: 'P60', definition: 'An annual certificate from your employer showing your total pay and tax deducted for the tax year. Given to employees after 5 April.', category: 'Employment' },
  { term: 'P45', definition: 'A form given when you leave a job, showing your pay and tax for the year so far. Give it to your next employer.', category: 'Employment' },
  { term: 'P11D', definition: 'A form reporting benefits in kind (company car, health insurance, etc.) that employees receive from their employer.', category: 'Employment' },
  { term: 'Student Loan Repayment', definition: 'Repaid through your salary once you earn above the threshold. Plan 1: £22,015/yr, Plan 2: £27,295/yr, Plan 5: £25,000/yr.', category: 'Employment' },
  { term: 'Council Tax', definition: 'A local tax on domestic properties, set by your local council. Bands A-H based on property value. Some discounts available (single person 25% off).', category: 'Property' },
  { term: 'Mortgage', definition: 'A loan specifically for buying property. Types include fixed rate, variable rate, tracker, and interest-only. Usually 25-35 year terms.', category: 'Property' },
  { term: 'LTV', definition: 'Loan-to-Value ratio — your mortgage amount as a percentage of the property value. Lower LTV usually means better interest rates.', category: 'Property' },
  { term: 'Credit Score', definition: 'A numerical rating of your creditworthiness. UK agencies: Experian, Equifax, TransUnion. Used by lenders to assess risk.', category: 'Finance' },
  { term: 'Emergency Tax', definition: 'A temporary tax code applied when HMRC doesn\'t have your details. Usually results in overpayment — you can claim a refund.', category: 'Tax' },
];

// ---- GUIDE DATA ----
const GUIDES = [
  {
    id: 'first-home',
    title: 'Buying Your First Home',
    icon: Home,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/30',
    summary: 'Step-by-step guide to buying your first property in the UK',
    sections: [
      { heading: '1. Check your finances', content: 'Review your credit score (free via Experian/ClearScore). Save for a deposit (typically 5-20% of property value). Reduce existing debts. Get a Decision in Principle (DIP) from a lender.' },
      { heading: '2. Government help', content: '**Lifetime ISA**: Save up to £4,000/yr, get 25% bonus (£1,000/yr). **Shared Ownership**: Buy 25-75% of a property. **First Homes Scheme**: 30-50% discount on new builds for local first-time buyers.' },
      { heading: '3. Stamp Duty relief', content: 'First-time buyers pay no SDLT on properties up to £425,000. Reduced rate on properties £425,001-£625,000. No relief above £625,000.' },
      { heading: '4. The buying process', content: 'Make an offer → Instruct solicitor → Mortgage application → Survey → Exchange contracts (pay deposit) → Completion (get keys). Typically takes 8-12 weeks.' },
      { heading: '5. Budget for extra costs', content: 'Solicitor fees (£1,000-£2,000), survey (£250-£600), mortgage fees (£0-£2,000), moving costs, furniture, buildings insurance (required from exchange).' },
    ],
  },
  {
    id: 'employee-tax',
    title: 'Tax as an Employee (PAYE)',
    icon: Briefcase,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-900/30',
    summary: 'How your tax works when employed in the UK',
    sections: [
      { heading: 'How PAYE works', content: 'Your employer deducts Income Tax and National Insurance before paying you. Your tax code tells them how much tax-free income you get. Standard code 1257L = £12,570 tax-free.' },
      { heading: 'Income Tax bands (2024/25)', content: '**Personal Allowance**: £0-£12,570 (0%). **Basic rate**: £12,571-£50,270 (20%). **Higher rate**: £50,271-£125,140 (40%). **Additional rate**: Over £125,140 (45%).' },
      { heading: 'National Insurance', content: '**Employee NI (Class 1)**: 8% on earnings £12,570-£50,270, then 2% above. **Employer NI**: 13.8% above £9,100. Check your payslip to verify deductions.' },
      { heading: 'Important documents', content: '**P60**: Annual summary (April). **P45**: When leaving a job. **P11D**: Benefits in kind. **Payslips**: Keep all of them.' },
      { heading: 'Things you might claim', content: 'Working from home allowance (£6/week), professional subscriptions, uniform cleaning costs. Use HMRC\'s online tool or form P87.' },
    ],
  },
  {
    id: 'self-employed',
    title: 'Tax as Self-Employed',
    icon: Calculator,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-900/30',
    summary: 'Everything you need to know about Self Assessment',
    sections: [
      { heading: 'Getting started', content: 'Register with HMRC for Self Assessment within 3 months of starting. You\'ll get a UTR (Unique Taxpayer Reference). Set up a Government Gateway account.' },
      { heading: 'Key deadlines', content: '**5 April**: Tax year ends. **31 July**: 2nd payment on account. **5 October**: Register for new self-employed. **31 October**: Paper return deadline. **31 January**: Online return + tax payment deadline.' },
      { heading: 'Allowable expenses', content: 'Office costs, travel, clothing (uniforms), staff costs, stock, legal/financial fees, marketing, training, insurance. Keep receipts for 5 years!' },
      { heading: 'National Insurance', content: '**Class 2**: £3.45/week if profits above £12,570. **Class 4**: 6% on profits £12,570-£50,270, then 2% above.' },
      { heading: 'Tips', content: 'Set aside 25-30% of income for tax. Use accounting software (or HomeLedger!). Consider flat rate expenses for working from home (£6/week). Trading allowance: first £1,000 of income is tax-free.' },
    ],
  },
  {
    id: 'limited-company',
    title: 'Running a Limited Company',
    icon: Building2,
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-900/30',
    summary: 'Corporation Tax, dividends, and Companies House filings',
    sections: [
      { heading: 'Company setup', content: 'Register at Companies House (£12 online). Choose a company name, appoint directors, issue shares, register for Corporation Tax with HMRC within 3 months.' },
      { heading: 'Corporation Tax', content: '**Small profits rate**: 19% (profits under £50,000). **Main rate**: 25% (profits over £250,000). **Marginal relief**: Profits £50,000-£250,000. File CT600 within 12 months, pay tax within 9 months + 1 day after year end.' },
      { heading: 'Paying yourself', content: '**Salary**: Often set at NI threshold (£12,570) to minimise NI. **Dividends**: Taxed at 8.75% (basic), 33.75% (higher), 39.35% (additional). £1,000 tax-free dividend allowance.' },
      { heading: 'Companies House filings', content: '**Confirmation Statement**: Annual (£13). **Annual Accounts**: Within 9 months of year end. **Notify changes**: Directors, address, shares within 14 days.' },
      { heading: 'VAT', content: 'Must register when turnover exceeds £90,000. Flat Rate Scheme can simplify things for small businesses. Submit quarterly MTD returns.' },
    ],
  },
  {
    id: 'hmrc-services',
    title: 'HMRC Online Services Guide',
    icon: Landmark,
    color: 'text-slate-600 dark:text-slate-400',
    bg: 'bg-slate-50 dark:bg-slate-800/50',
    summary: 'Navigate HMRC\'s online tools and services',
    sections: [
      { heading: 'Government Gateway', content: 'Your central login for all HMRC services. Create an account at gov.uk/log-in-register-hmrc-online-services. You\'ll need your NI number and a form of ID.' },
      { heading: 'Personal Tax Account', content: 'View your tax code, check Income Tax estimate, claim refunds, update address, check State Pension forecast. Access via gov.uk/personal-tax-account.' },
      { heading: 'Self Assessment', content: 'File your tax return, make payments, set up payment plans, view your account balance. Submit online by 31 January.' },
      { heading: 'HMRC App', content: 'Free app for iOS/Android. Check tax code, view payslips from PAYE, claim tax refunds, manage tax credits. Very useful for quick checks.' },
      { heading: 'Useful phone numbers', content: '**Self Assessment**: 0300 200 3310. **Tax Credits**: 0345 300 3900. **VAT**: 0300 200 3700. **Employer helpline**: 0300 200 3200. Lines open Mon-Fri 8am-6pm.' },
    ],
  },
  {
    id: 'property-tax',
    title: 'Property & Rental Tax',
    icon: Receipt,
    color: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-900/30',
    summary: 'Tax on rental income, capital gains, and property ownership',
    sections: [
      { heading: 'Rental income tax', content: 'Rental income is added to your total income and taxed at your marginal rate. You must register for Self Assessment if rental income exceeds £1,000/year.' },
      { heading: 'Allowable expenses', content: 'Letting agent fees, maintenance/repairs, insurance, council tax (if you pay it), utility bills (if included in rent), accountancy fees. NOT improvements or mortgage capital repayments.' },
      { heading: 'Section 24 (Mortgage interest)', content: 'You can no longer deduct mortgage interest from rental income. Instead, you get a 20% tax credit on interest payments. This affects higher-rate taxpayers most.' },
      { heading: 'Capital Gains Tax on property', content: 'When selling a non-main-residence property: 18% (basic rate) or 24% (higher rate). Must report and pay within 60 days of completion. No CGT on your main home (Principal Private Residence Relief).' },
      { heading: 'Stamp Duty for landlords', content: 'Additional 3% surcharge on top of standard SDLT rates for second homes / buy-to-let properties. This applies from the first £1.' },
    ],
  },
];

export function LearnClient() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [activeGuide, setActiveGuide] = useState<string | null>(null);
  const [glossarySearch, setGlossarySearch] = useState('');
  const [glossaryCategory, setGlossaryCategory] = useState<string>('all');
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'guides' | 'glossary' | 'ask'>('guides');

  const filteredGlossary = GLOSSARY.filter(g => {
    const matchSearch = !glossarySearch || g.term.toLowerCase().includes(glossarySearch.toLowerCase()) || g.definition.toLowerCase().includes(glossarySearch.toLowerCase());
    const matchCat = glossaryCategory === 'all' || g.category === glossaryCategory;
    return matchSearch && matchCat;
  });

  const glossaryCategories = ['all', ...Array.from(new Set(GLOSSARY.map(g => g.category)))];

  const askAI = async () => {
    if (!aiQuestion.trim()) return;
    setAiLoading(true);
    setAiAnswer('');
    try {
      const res = await fetch('/api/learn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: aiQuestion, topic: activeTab }),
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setAiAnswer(data.answer || 'No answer received');
    } catch {
      toast({ title: 'Error getting answer', variant: 'destructive' });
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <GraduationCap className="h-7 w-7 text-primary" />
          {t('learn.title')}
        </h1>
        <p className="text-muted-foreground mt-1">Your guide to UK tax, finance, and business</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-1">
        {([
          { id: 'guides' as const, label: 'Guides', icon: BookOpen },
          { id: 'glossary' as const, label: 'Glossary', icon: FileText },
          { id: 'ask' as const, label: 'Ask AI', icon: Sparkles },
        ]).map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-card border border-b-0 border-border text-foreground -mb-[1px]'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* GUIDES TAB */}
      {activeTab === 'guides' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {GUIDES.map(guide => {
              const Icon = guide.icon;
              const isOpen = activeGuide === guide.id;
              return (
                <Card
                  key={guide.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${isOpen ? 'col-span-full' : ''}`}
                  onClick={() => setActiveGuide(isOpen ? null : guide.id)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div className={`h-10 w-10 rounded-lg ${guide.bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`h-5 w-5 ${guide.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{guide.title}</h3>
                          {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{guide.summary}</p>
                      </div>
                    </div>
                    {isOpen && (
                      <div className="mt-4 space-y-3 border-t pt-4" onClick={e => e.stopPropagation()}>
                        {guide.sections.map((s, i) => (
                          <div key={i} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                            <h4 className="font-medium text-sm mb-1">{s.heading}</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">{s.content}</p>
                          </div>
                        ))}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setActiveTab('ask');
                            setAiQuestion(`Tell me more about: ${guide.title}`);
                          }}
                        >
                          <Bot className="h-4 w-4 mr-1" /> Ask AI about this topic
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Quick links */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ExternalLink className="h-5 w-5" /> Useful Links
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {[
                  { label: 'HMRC Self Assessment', url: 'https://www.gov.uk/self-assessment-tax-returns' },
                  { label: 'Companies House Filing', url: 'https://www.gov.uk/file-your-company-accounts-and-tax-return' },
                  { label: 'Check your tax code', url: 'https://www.gov.uk/check-income-tax-current-year' },
                  { label: 'Stamp Duty calculator', url: 'https://www.gov.uk/stamp-duty-land-tax' },
                  { label: 'State Pension forecast', url: 'https://www.gov.uk/check-state-pension' },
                  { label: 'VAT registration', url: 'https://www.gov.uk/vat-registration' },
                ].map(link => (
                  <a
                    key={link.label}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-all text-sm"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium">{link.label}</span>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* GLOSSARY TAB */}
      {activeTab === 'glossary' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search terms..."
                className="pl-9"
                value={glossarySearch}
                onChange={e => setGlossarySearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {glossaryCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setGlossaryCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    glossaryCategory === cat
                      ? 'bg-gradient-to-r from-slate-800 to-slate-600 text-white dark:from-amber-500 dark:to-amber-400 dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat === 'all' ? 'All' : cat}
                </button>
              ))}
            </div>
          </div>

          <p className="text-sm text-muted-foreground">{filteredGlossary.length} terms</p>

          <div className="grid gap-2">
            {filteredGlossary.map(g => (
              <Card key={g.term}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm">{g.term}</h3>
                        <Badge variant="secondary" className="text-[10px]">{g.category}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{g.definition}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ASK AI TAB */}
      {activeTab === 'ask' && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" /> Ask about UK Finance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Ask any question about UK tax, HMRC, business, property, or personal finance.
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. How do I register as self-employed?"
                  value={aiQuestion}
                  onChange={e => setAiQuestion(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !aiLoading && askAI()}
                  className="flex-1"
                />
                <Button onClick={askAI} disabled={aiLoading || !aiQuestion.trim()}>
                  {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>

              {/* Quick suggestions */}
              <div className="flex flex-wrap gap-2">
                {[
                  'How do I buy my first home in the UK?',
                  'What expenses can I claim as self-employed?',
                  'How does Corporation Tax work?',
                  'What is the difference between PAYE and Self Assessment?',
                  'How do I register for VAT?',
                  'What is Stamp Duty for buy-to-let?',
                ].map(q => (
                  <button
                    key={q}
                    onClick={() => { setAiQuestion(q); }}
                    className="text-xs px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700"
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* AI Answer */}
              {aiAnswer && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 mb-3">
                    <Bot className="h-5 w-5 text-primary" />
                    <span className="font-medium text-sm">AI Answer</span>
                  </div>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                    {aiAnswer}
                  </div>
                </div>
              )}

              {aiLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Thinking...
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
