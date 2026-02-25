'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Home, ChevronDown, ChevronUp, PiggyBank, Landmark, Search, Handshake,
  Scale, ClipboardCheck, FileText, Key, Receipt, GraduationCap, Lightbulb,
  CheckCircle2, ArrowRight, AlertTriangle, Info,
} from 'lucide-react';

interface GuideStep {
  step: number;
  title: string;
  icon: React.ElementType;
  color: string;
  summary: string;
  content: {
    heading: string;
    text: string;
    tips?: string[];
    warning?: string;
    keyNumbers?: { label: string; value: string }[];
  }[];
}

const GUIDE_STEPS: GuideStep[] = [
  {
    step: 1,
    title: 'Financial Preparation',
    icon: PiggyBank,
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    summary: 'Save for a deposit, check your credit score, and reduce debts before applying.',
    content: [
      {
        heading: 'Saving for a Deposit',
        text: 'Most lenders require a minimum 5% deposit, but 10-20% will get you better rates. For a £250,000 property, that means saving £12,500 to £50,000. The larger your deposit, the lower your Loan-to-Value (LTV) ratio and the better your mortgage deal.',
        keyNumbers: [
          { label: 'Minimum deposit', value: '5% of property price' },
          { label: 'Ideal deposit', value: '10-20% for best rates' },
          { label: 'Average first home (UK)', value: '£230,000 - £270,000' },
        ],
      },
      {
        heading: 'Credit Score',
        text: 'Lenders check your credit history before approving a mortgage. Check your score for free with Experian, Equifax, or TransUnion (via ClearScore, Credit Karma). Pay all bills on time, avoid new credit applications 6 months before applying, and make sure you\'re on the electoral register.',
        tips: [
          'Register on the electoral roll at your current address',
          'Pay off or reduce credit card balances',
          'Don\'t apply for new credit cards or loans before your mortgage application',
          'Check for errors on your credit report and dispute them',
        ],
      },
      {
        heading: 'Affordability',
        text: 'Banks typically lend 4 to 4.5 times your annual salary. If you earn £35,000 per year, you can borrow approximately £140,000 to £157,500. Joint applications combine both salaries. Lenders also check your monthly outgoings (debts, subscriptions, childcare).',
        keyNumbers: [
          { label: 'Lending multiple', value: '4 - 4.5x annual salary' },
          { label: 'Example: £35k salary', value: '£140k - £157k mortgage' },
          { label: 'Joint: £35k + £30k', value: '£260k - £292k mortgage' },
        ],
      },
    ],
  },
  {
    step: 2,
    title: 'Government Schemes',
    icon: Landmark,
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    summary: 'Take advantage of ISAs, Help to Buy, Shared Ownership, and other first-time buyer schemes.',
    content: [
      {
        heading: 'Lifetime ISA (LISA)',
        text: 'Save up to £4,000 per year and the government adds a 25% bonus (up to £1,000/year). You must be 18-39 to open one. Can be used towards your first home (up to £450,000) or retirement at 60. You need to have the LISA open for at least 12 months before using it.',
        keyNumbers: [
          { label: 'Annual limit', value: '£4,000' },
          { label: 'Government bonus', value: '25% (up to £1,000/year)' },
          { label: 'Property price cap', value: '£450,000' },
        ],
        warning: 'Withdrawing for non-home/retirement purposes incurs a 25% penalty — you\'d lose the bonus AND 6.25% of your own money.',
      },
      {
        heading: 'Shared Ownership',
        text: 'Buy a share of a property (25-75%) and pay rent on the rest. You only need a deposit on your share, making it more affordable. Over time, you can "staircase" — buy more shares until you own 100%. Available through housing associations.',
        tips: [
          'Deposit is typically 5-10% of YOUR share (not the full value)',
          'You pay rent + mortgage + service charge',
          'Check if the area has new-build shared ownership developments',
        ],
      },
      {
        heading: 'First Homes Scheme',
        text: 'New-build homes sold at a discount of at least 30% to first-time buyers and key workers. The discount stays with the property forever. Maximum price after discount: £250,000 (£420,000 in London). Household income must be under £80,000 (£90,000 in London).',
      },
      {
        heading: 'Right to Buy',
        text: 'If you\'ve been a council or housing association tenant for 3+ years, you may be able to buy your home at a significant discount. Discounts vary: up to £96,000 outside London, up to £127,900 in London (2024/25 figures).',
      },
    ],
  },
  {
    step: 3,
    title: 'Mortgage in Principle (AIP)',
    icon: FileText,
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    summary: 'Get a conditional agreement from a lender showing how much they\'d lend you.',
    content: [
      {
        heading: 'What is an AIP?',
        text: 'A Mortgage in Principle (also called Agreement in Principle or Decision in Principle) is a conditional statement from a lender saying how much they\'d be willing to lend you, based on a basic check of your finances. It\'s NOT a guaranteed offer — the full application comes later.',
        tips: [
          'Most estate agents want to see an AIP before accepting an offer',
          'It shows sellers you\'re a serious buyer',
          'Usually valid for 60-90 days',
          'Getting an AIP is free and takes 15-30 minutes online',
        ],
      },
      {
        heading: 'Documents You\'ll Need',
        text: 'To get an AIP, you\'ll typically need: proof of ID (passport/driving licence), proof of address (utility bill), 3 months of bank statements, 3 months of payslips (or 2-3 years of accounts if self-employed), and details of any debts or financial commitments.',
      },
      {
        heading: 'Mortgage Broker vs Direct',
        text: 'A mortgage broker compares deals across many lenders (some have access to exclusive deals not available directly). They charge a fee (£300-£500 typically) but can save thousands over the mortgage term. Going direct to a bank means you only see their products. For first-time buyers, a broker is usually recommended.',
        warning: 'Some brokers are "tied" to certain lenders. Always ask if they search the "whole of market".',
      },
    ],
  },
  {
    step: 4,
    title: 'Finding a Property',
    icon: Search,
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    summary: 'Search online portals, visit estate agents, attend viewings, and research areas.',
    content: [
      {
        heading: 'Where to Search',
        text: 'The main property portals are Rightmove, Zoopla, and OnTheMarket. Set up alerts for your criteria. Also register with local estate agents directly — some properties are sold before they go online. Social media groups in your target area can also have leads.',
        tips: [
          'Set a realistic budget BELOW your maximum to leave room for negotiation and costs',
          'Research the area: schools, transport links, flood risk, planned developments',
          'Check sold prices on Rightmove to see what similar properties actually sold for',
          'Visit the area at different times of day (especially evenings)',
        ],
      },
      {
        heading: 'Viewings Checklist',
        text: 'When viewing a property, look beyond the staging. Check: water pressure (turn on taps), damp patches on walls/ceilings, window condition, boiler age, electrical panel, phone signal, broadband speed, parking, neighbours. Take photos and notes. Visit at least twice before making an offer.',
      },
      {
        heading: 'New Build vs Existing',
        text: 'New builds come with a 10-year NHBC warranty, are energy efficient, and you can sometimes negotiate extras (carpets, appliances). However, they often have smaller rooms and may be priced at a premium. Existing properties have more character and space but may need work. Both are valid — choose what suits your budget and lifestyle.',
      },
    ],
  },
  {
    step: 5,
    title: 'Making an Offer',
    icon: Handshake,
    color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
    summary: 'Negotiate the price, get your offer accepted, and understand the legal differences.',
    content: [
      {
        heading: 'How to Negotiate',
        text: 'In England and Wales, the asking price is a starting point — most properties sell for 5-10% below asking price. Research comparable sold prices to justify your offer. Mention your strengths: first-time buyer (no chain), AIP in place, flexible on completion date. Be prepared to negotiate but know your walk-away price.',
        tips: [
          'Start 5-10% below asking price unless it\'s a competitive area',
          'Ask the agent how long the property has been on the market',
          'Being chain-free (first-time buyer) is a significant advantage',
          'Put your offer in writing via the estate agent',
        ],
      },
      {
        heading: 'England/Wales vs Scotland',
        text: 'In England and Wales, offers aren\'t legally binding until exchange of contracts (weeks/months later). Either party can pull out at any time before exchange — this is why "gazumping" happens. In Scotland, the process is different: offers are submitted as sealed bids via solicitors and become legally binding much earlier, providing more certainty for both parties.',
        warning: 'In England/Wales, nothing is legally binding until "exchange of contracts". Don\'t spend money on non-refundable items until exchange.',
      },
    ],
  },
  {
    step: 6,
    title: 'Conveyancing (Solicitor)',
    icon: Scale,
    color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    summary: 'Hire a conveyancer to handle legal work: searches, contracts, and money transfer.',
    content: [
      {
        heading: 'What Does a Conveyancer Do?',
        text: 'A conveyancer (or property solicitor) handles all the legal aspects of buying a home. They conduct local authority searches, check the title deeds, handle the contract, manage the deposit transfer, and register you as the new owner with the Land Registry. Costs typically range from £1,000 to £2,000 + VAT.',
      },
      {
        heading: 'Searches',
        text: 'Your conveyancer will carry out several searches: Local Authority Search (planning, roads, conservation areas), Environmental Search (contamination, flood risk), Water & Drainage Search, and optional Mining Search. These take 2-6 weeks and cost £250-£400 total.',
      },
      {
        heading: 'The Contract Pack',
        text: 'The seller\'s solicitor sends a "contract pack" including: draft contract, title documents, property information form (fixtures, boundaries), fittings list, and any relevant certificates (gas safety, electrical). Your solicitor reviews these, raises enquiries (questions), and negotiates any issues before you\'re asked to sign.',
      },
    ],
  },
  {
    step: 7,
    title: 'Survey & Valuation',
    icon: ClipboardCheck,
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    summary: 'Get the property surveyed and valued. Know when to renegotiate or walk away.',
    content: [
      {
        heading: 'Types of Survey',
        text: 'There are three main levels: (1) Basic Valuation — your lender does this automatically, just confirms the property is worth the price. (2) Homebuyer Report (Level 2) — a more detailed visual inspection, recommended for standard properties in reasonable condition (£400-£600). (3) Full Building Survey (Level 3) — the most thorough, recommended for older (pre-1930s), unusual, or properties you plan to renovate (£600-£1,500).',
        keyNumbers: [
          { label: 'Basic Valuation', value: '£0-£300 (often free)' },
          { label: 'Homebuyer Report', value: '£400-£600' },
          { label: 'Full Building Survey', value: '£600-£1,500' },
        ],
      },
      {
        heading: 'What If Issues Are Found?',
        text: 'If the survey reveals problems (subsidence, damp, roof issues, Japanese knotweed), you have options: (1) Renegotiate the price downward to cover repair costs. (2) Ask the seller to fix the issues before completion. (3) Walk away if the problems are too severe. Your conveyancer will advise on the best course of action.',
        warning: 'Never skip the survey to save money. A £500 survey could save you £50,000+ in hidden problems.',
      },
    ],
  },
  {
    step: 8,
    title: 'Mortgage Application',
    icon: FileText,
    color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
    summary: 'Submit your full mortgage application with all supporting documents.',
    content: [
      {
        heading: 'Mortgage Types Explained',
        text: 'Fixed Rate: your rate stays the same for a set period (2, 3, 5, or 10 years) — good for budgeting certainty. Variable/Tracker: your rate follows the Bank of England base rate — can be cheaper but unpredictable. Standard Variable Rate (SVR): the lender\'s default rate, usually the most expensive — avoid this by remortgaging when your fixed deal ends.',
        tips: [
          '2-year fixed: lower rate but you remortgage sooner (fees each time)',
          '5-year fixed: slightly higher rate but more stability',
          'Most first-time buyers choose a 2 or 5 year fixed rate',
          'Typical mortgage term: 25-35 years (longer = lower monthly payments but more interest overall)',
        ],
      },
      {
        heading: 'Application Documents',
        text: 'You\'ll need: passport/driving licence, 3 months bank statements, 3 months payslips, P60 (annual tax summary), proof of deposit source, details of debts/commitments. Self-employed: 2-3 years of accounts or SA302 tax calculations from HMRC. The lender will also do a full credit check.',
      },
      {
        heading: 'Mortgage Offer',
        text: 'Once approved, you\'ll receive a formal mortgage offer — usually valid for 3-6 months. This is sent to both you and your solicitor. Your solicitor will review the conditions and confirm everything is in order for exchange.',
      },
    ],
  },
  {
    step: 9,
    title: 'Exchange & Completion',
    icon: Key,
    color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
    summary: 'Sign contracts, transfer the deposit, and collect your keys on completion day.',
    content: [
      {
        heading: 'Exchange of Contracts',
        text: 'This is the moment the purchase becomes legally binding. Your solicitor transfers the deposit (usually 10% of the purchase price) to the seller\'s solicitor, and both parties sign identical contracts. From this point, pulling out means losing your deposit (and potentially being sued). The completion date is agreed at exchange — typically 1-4 weeks later.',
        warning: 'Make sure your buildings insurance starts from the date of exchange, not completion — you\'re legally responsible for the property from exchange.',
      },
      {
        heading: 'Completion Day',
        text: 'On completion day, your solicitor transfers the remaining funds to the seller\'s solicitor. Once the money clears (usually by early afternoon), the estate agent releases the keys. Congratulations — you\'re a homeowner! The solicitor then handles Land Registry registration.',
        tips: [
          'Book your moving van well in advance',
          'Take meter readings on the day you get the keys',
          'Photograph the property\'s condition when you move in',
          'Notify your council tax, utilities, and Royal Mail of the change',
        ],
      },
    ],
  },
  {
    step: 10,
    title: 'After Purchase — Costs & Taxes',
    icon: Receipt,
    color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
    summary: 'Stamp Duty relief, Land Registry, council tax, insurance, and ongoing costs.',
    content: [
      {
        heading: 'Stamp Duty Land Tax (SDLT)',
        text: 'First-time buyers get relief on properties up to £625,000. No SDLT on the first £425,000, then 5% on the portion from £425,001 to £625,000. Above £625,000, normal rates apply. This can save you up to £8,750 compared to non-first-time buyers.',
        keyNumbers: [
          { label: 'Property £300,000', value: '£0 SDLT (first-time buyer)' },
          { label: 'Property £450,000', value: '£1,250 SDLT' },
          { label: 'Property £550,000', value: '£6,250 SDLT' },
        ],
      },
      {
        heading: 'Total Buying Costs Summary',
        text: 'Beyond the deposit and purchase price, budget for these additional costs:',
        keyNumbers: [
          { label: 'Conveyancing fees', value: '£1,000-£2,000 + VAT' },
          { label: 'Survey', value: '£400-£1,500' },
          { label: 'Mortgage arrangement fee', value: '£0-£2,000' },
          { label: 'Stamp Duty', value: '£0-£6,250 (first-time)' },
          { label: 'Moving costs', value: '£500-£1,500' },
          { label: 'Furniture/repairs', value: '£2,000-£10,000+' },
        ],
        warning: 'Budget an extra £5,000-£10,000 on top of your deposit for these costs. Many first-time buyers are caught out by not planning for them.',
      },
      {
        heading: 'Ongoing Costs',
        text: 'As a homeowner, you\'ll have new regular costs: mortgage payments, buildings insurance (mandatory with a mortgage), contents insurance, council tax (varies by band and area), utility bills, maintenance fund (save 1% of property value per year for repairs), and potentially service charges if it\'s a flat/leasehold.',
      },
    ],
  },
];

export function FirstHomeGuide() {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  const toggleStep = (step: number) => {
    setExpandedStep(expandedStep === step ? null : step);
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="cursor-pointer" onClick={() => setShowGuide(!showGuide)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                UK First Home Buying Guide
                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px]">
                  10 Steps
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                Everything you need to know about buying your first home in the UK
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {showGuide ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardHeader>

      {showGuide && (
        <CardContent className="pt-0 space-y-2">
          {/* Quick overview */}
          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 mb-4">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-300">The Journey at a Glance</p>
                <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                  From saving your first pound to collecting the keys, buying a home in the UK typically takes 3-6 months
                  (after you start viewing properties). The entire preparation phase — saving, credit building, and understanding
                  your budget — can take 1-3 years. Click each step below for detailed guidance.
                </p>
              </div>
            </div>
          </div>

          {/* Steps */}
          {GUIDE_STEPS.map((step) => {
            const Icon = step.icon;
            const isExpanded = expandedStep === step.step;

            return (
              <div key={step.step} className="border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleStep(step.step)}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/50 transition-colors"
                >
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${step.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground">STEP {step.step}</span>
                      <span className="font-medium text-sm">{step.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{step.summary}</p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-4 border-t border-border pt-4 bg-muted/20">
                    {step.content.map((section, idx) => (
                      <div key={idx} className="space-y-2">
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                          <ArrowRight className="h-3.5 w-3.5 text-primary" />
                          {section.heading}
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed pl-5">
                          {section.text}
                        </p>

                        {section.keyNumbers && (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pl-5 mt-2">
                            {section.keyNumbers.map((kn, i) => (
                              <div key={i} className="p-2.5 rounded-lg bg-card border border-border">
                                <p className="text-[11px] text-muted-foreground">{kn.label}</p>
                                <p className="text-sm font-bold">{kn.value}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {section.tips && (
                          <div className="pl-5 space-y-1 mt-2">
                            {section.tips.map((tip, i) => (
                              <div key={i} className="flex items-start gap-2 text-sm">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                                <span className="text-muted-foreground">{tip}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {section.warning && (
                          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 ml-5 mt-2">
                            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-800 dark:text-amber-300">{section.warning}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Footer */}
          <div className="p-3 rounded-lg bg-muted/50 mt-4">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                This guide is for general information only and reflects UK property rules as of 2024/25.
                Rules and thresholds change — always verify current figures on gov.uk and seek independent
                financial advice before making decisions.
              </p>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
