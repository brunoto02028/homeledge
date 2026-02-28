'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Info, TrendingUp,
  CreditCard, Home, Clock, Banknote, FileText, Brain, User, Briefcase,
  Shield, Target, XCircle, MinusCircle, PlusCircle, Lightbulb, Building2,
  Users, Baby, Globe, Calculator,
} from 'lucide-react';

// ============================================================
// UK Mortgage Approval Scoring Engine
// ============================================================

interface SimInputs {
  age: string;
  dependents: string;
  residency: string;
  employmentType: string;
  yearsCurrentJob: string;
  yearsTotalEmployment: string;
  salary: string;
  partnerSalary: string;
  bonusIncome: string;
  rentalIncome: string;
  otherIncome: string;
  creditCards: string;
  loans: string;
  carFinance: string;
  studentLoan: string;
  childMaintenance: string;
  monthlyChildcare: string;
  monthlySubscriptions: string;
  otherExpenses: string;
  creditScore: string;
  hasCCJ: string;
  ccjYearsAgo: string;
  hasBankruptcy: string;
  bankruptcyYearsAgo: string;
  propertyPrice: string;
  deposit: string;
  propertyType: string;
  purchaseVia: string;
}

const defaultInputs: SimInputs = {
  age: '30', dependents: '0', residency: 'uk_citizen',
  employmentType: 'employed', yearsCurrentJob: '3', yearsTotalEmployment: '8',
  salary: '45000', partnerSalary: '', bonusIncome: '', rentalIncome: '', otherIncome: '',
  creditCards: '0', loans: '0', carFinance: '0', studentLoan: '0', childMaintenance: '0',
  monthlyChildcare: '0', monthlySubscriptions: '100', otherExpenses: '0',
  creditScore: 'good', hasCCJ: 'no', ccjYearsAgo: '', hasBankruptcy: 'no', bankruptcyYearsAgo: '',
  propertyPrice: '300000', deposit: '30000', propertyType: 'standard', purchaseVia: 'personal',
};

interface Factor {
  name: string;
  impact: 'positive' | 'negative' | 'neutral' | 'warning';
  score: number; // -20 to +20
  detail: string;
}

interface SimResult {
  probability: number;
  factors: Factor[];
  maxBorrow: number;
  maxTerm: number;
  monthlyPayment: number;
  stressTestPayment: number;
  ltv: number;
  ltvBand: string;
  redFlags: string[];
  improvements: { action: string; impact: string; timeline: string }[];
  lenderType: string;
  lenderDetail: string;
  affordablePrice: number;
}

function calcPayment(principal: number, annualRate: number, years: number): number {
  if (annualRate === 0 || years === 0) return 0;
  const r = annualRate / 100 / 12;
  const n = years * 12;
  return principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

function runSimulation(inp: SimInputs): SimResult {
  const age = parseInt(inp.age) || 30;
  const dependents = parseInt(inp.dependents) || 0;
  const yearsJob = parseFloat(inp.yearsCurrentJob) || 0;
  const yearsTotal = parseFloat(inp.yearsTotalEmployment) || 0;
  const salary = parseFloat(inp.salary) || 0;
  const partnerSalary = parseFloat(inp.partnerSalary) || 0;
  const bonus = parseFloat(inp.bonusIncome) || 0;
  const rental = parseFloat(inp.rentalIncome) || 0;
  const other = parseFloat(inp.otherIncome) || 0;
  const ccDebt = parseFloat(inp.creditCards) || 0;
  const loanDebt = parseFloat(inp.loans) || 0;
  const carDebt = parseFloat(inp.carFinance) || 0;
  const studentDebt = parseFloat(inp.studentLoan) || 0;
  const childMaint = parseFloat(inp.childMaintenance) || 0;
  const childcare = parseFloat(inp.monthlyChildcare) || 0;
  const subs = parseFloat(inp.monthlySubscriptions) || 0;
  const otherExp = parseFloat(inp.otherExpenses) || 0;
  const price = parseFloat(inp.propertyPrice) || 0;
  const deposit = parseFloat(inp.deposit) || 0;
  const hasCCJ = inp.hasCCJ === 'yes';
  const ccjYears = parseFloat(inp.ccjYearsAgo) || 0;
  const hasBankruptcy = inp.hasBankruptcy === 'yes';
  const bankYears = parseFloat(inp.bankruptcyYearsAgo) || 0;

  const factors: Factor[] = [];
  const redFlags: string[] = [];
  const improvements: { action: string; impact: string; timeline: string }[] = [];
  let baseScore = 50;

  // ── AGE & TERM ──
  const maxRetirementAge = 70; // most lenders
  const maxTerm = Math.min(Math.max(maxRetirementAge - age, 5), 40);
  if (age < 21) {
    factors.push({ name: 'Age', impact: 'warning', score: -5, detail: `Age ${age} — very young, limited credit history expected. Some lenders prefer 21+.` });
    baseScore -= 5;
  } else if (age <= 35) {
    factors.push({ name: 'Age', impact: 'positive', score: 8, detail: `Age ${age} — ideal age bracket. Maximum term available: ${maxTerm} years.` });
    baseScore += 8;
  } else if (age <= 50) {
    factors.push({ name: 'Age', impact: 'positive', score: 5, detail: `Age ${age} — good. Max term: ${maxTerm} years. Still long enough for affordable payments.` });
    baseScore += 5;
  } else if (age <= 60) {
    factors.push({ name: 'Age', impact: 'warning', score: -3, detail: `Age ${age} — reduced max term (${maxTerm} years). Higher monthly payments. Some lenders may require proof of retirement income.` });
    baseScore -= 3;
  } else {
    factors.push({ name: 'Age', impact: 'negative', score: -10, detail: `Age ${age} — very limited term (${maxTerm} years). Many lenders won't offer new mortgages. Specialist lenders may be needed.` });
    baseScore -= 10;
    redFlags.push(`Age ${age}: Most mainstream lenders cap at age 70-75 at end of term. With only ${maxTerm} years, monthly payments will be very high.`);
  }

  // ── DEPENDENTS ──
  if (dependents === 0) {
    factors.push({ name: 'Dependents', impact: 'positive', score: 3, detail: 'No dependents — more disposable income for mortgage payments.' });
    baseScore += 3;
  } else if (dependents <= 2) {
    factors.push({ name: 'Dependents', impact: 'neutral', score: -2, detail: `${dependents} dependent(s) — lenders factor in ~£250-400/month per child for affordability.` });
    baseScore -= 2;
  } else {
    factors.push({ name: 'Dependents', impact: 'warning', score: -5, detail: `${dependents} dependents — significantly impacts affordability assessment. Lenders may reduce borrowing capacity.` });
    baseScore -= 5;
  }

  // ── RESIDENCY ──
  if (inp.residency === 'uk_citizen' || inp.residency === 'settled') {
    factors.push({ name: 'Residency', impact: 'positive', score: 5, detail: inp.residency === 'uk_citizen' ? 'UK citizen — full access to all lenders.' : 'Settled status — most lenders accept, treated similarly to UK citizens.' });
    baseScore += 5;
  } else if (inp.residency === 'pre_settled') {
    factors.push({ name: 'Residency', impact: 'warning', score: -3, detail: 'Pre-settled status — some lenders are cautious. Limited options. Apply for settled status ASAP.' });
    baseScore -= 3;
    improvements.push({ action: 'Apply for Settled Status when eligible', impact: 'Opens up more lenders', timeline: 'Depends on qualifying period' });
  } else if (inp.residency === 'visa') {
    factors.push({ name: 'Residency', impact: 'warning', score: -8, detail: 'Visa holder — limited lenders. Most require visa with 2+ years remaining. Higher deposits often needed (25%+).' });
    baseScore -= 8;
    redFlags.push('Visa holder: Most mainstream lenders require indefinite leave to remain. Specialist lenders may accept work visas with 2+ years remaining.');
  }

  // ── EMPLOYMENT TYPE ──
  if (inp.employmentType === 'employed') {
    factors.push({ name: 'Employment Type', impact: 'positive', score: 8, detail: 'Employed (PAYE) — preferred by all lenders. Most straightforward application.' });
    baseScore += 8;
  } else if (inp.employmentType === 'self_employed') {
    const seScore = yearsTotal >= 3 ? 3 : yearsTotal >= 2 ? 0 : -8;
    factors.push({ name: 'Employment Type', impact: seScore >= 0 ? 'neutral' : 'negative', score: seScore, detail: `Self-employed — lenders require ${yearsTotal >= 2 ? '2-3 years of SA302s/accounts' : 'minimum 2 years trading history'}. ${yearsTotal < 2 ? 'You have less than 2 years — most lenders will reject.' : 'Your trading history is acceptable.'}` });
    baseScore += seScore;
    if (yearsTotal < 2) {
      redFlags.push('Self-employed with less than 2 years trading: Most lenders require minimum 2 years (some accept 1 year). Very limited options.');
      improvements.push({ action: 'Build up 2+ years of self-employment accounts', impact: 'Critical — unlocks most lenders', timeline: `${Math.ceil(2 - yearsTotal)} year(s)` });
    }
  } else if (inp.employmentType === 'contractor') {
    factors.push({ name: 'Employment Type', impact: 'neutral', score: 1, detail: 'Contractor — specialist lenders assess daily rate × 5 × 48 weeks. Need 12+ months contracting history. Some high street lenders now accept contractors.' });
    baseScore += 1;
  } else if (inp.employmentType === 'director') {
    factors.push({ name: 'Employment Type', impact: 'neutral', score: 2, detail: 'Company director — lenders look at salary + dividends from SA302 or company accounts. Need 2-3 years of filings.' });
    baseScore += 2;
  } else if (inp.employmentType === 'zero_hours') {
    factors.push({ name: 'Employment Type', impact: 'negative', score: -8, detail: 'Zero-hours contract — very limited lenders. Income seen as unstable. Need 12+ months of payslips showing consistent income.' });
    baseScore -= 8;
    redFlags.push('Zero-hours contract: Most mainstream lenders will decline. You need 12+ months of payslips showing consistent earnings. Consider specialist lenders.');
    improvements.push({ action: 'Get a permanent contract if possible', impact: 'Very high — opens all lenders', timeline: 'As soon as possible' });
  } else if (inp.employmentType === 'part_time') {
    factors.push({ name: 'Employment Type', impact: 'neutral', score: -2, detail: 'Part-time employed — accepted by most lenders but income is lower. Consistent hours for 6+ months preferred.' });
    baseScore -= 2;
  } else if (inp.employmentType === 'retired') {
    factors.push({ name: 'Employment Type', impact: 'warning', score: -5, detail: 'Retired — need guaranteed pension income. Limited lenders for new mortgages. Equity release may be an option.' });
    baseScore -= 5;
  }

  // ── EMPLOYMENT DURATION ──
  if (yearsJob >= 3) {
    factors.push({ name: 'Time in Current Role', impact: 'positive', score: 5, detail: `${yearsJob} years — excellent stability. Lenders love long tenure.` });
    baseScore += 5;
  } else if (yearsJob >= 1) {
    factors.push({ name: 'Time in Current Role', impact: 'neutral', score: 2, detail: `${yearsJob} year(s) — acceptable. Past probation period.` });
    baseScore += 2;
  } else if (yearsJob >= 0.5) {
    factors.push({ name: 'Time in Current Role', impact: 'warning', score: -2, detail: `${yearsJob} years — some lenders want you past probation (usually 6 months). May need to wait.` });
    baseScore -= 2;
    improvements.push({ action: 'Wait until past probation (6 months)', impact: 'Medium — more lenders available', timeline: `${Math.ceil((0.5 - yearsJob) * 12)} month(s)` });
  } else {
    factors.push({ name: 'Time in Current Role', impact: 'negative', score: -8, detail: `${yearsJob < 0.1 ? 'Just started' : `${Math.round(yearsJob * 12)} months`} — too new. Most lenders want 3-6 months minimum. Wait or show continuous employment history.` });
    baseScore -= 8;
    redFlags.push('Less than 6 months in current job: Most lenders require you to have passed your probation period. Some accept day 1 of a new permanent role if in the same industry.');
  }

  // ── INCOME ──
  // Lenders typically use: salary + 50% of bonus/overtime + rental (some) + partner salary
  const assessableIncome = salary + partnerSalary + (bonus * 0.5) + (rental * 0.75) + (other * 0.5);
  const totalGross = salary + partnerSalary + bonus + rental + other;
  const multiplier = inp.purchaseVia === 'limited_company' ? 3.5 : (assessableIncome > 100000 ? 4.5 : 4.25);
  const maxBorrow = assessableIncome * multiplier;

  if (assessableIncome >= 75000) {
    factors.push({ name: 'Income', impact: 'positive', score: 8, detail: `Assessable income: £${Math.round(assessableIncome).toLocaleString()} (lenders use ~50% of bonus, ~75% of rental). Strong borrowing capacity.` });
    baseScore += 8;
  } else if (assessableIncome >= 40000) {
    factors.push({ name: 'Income', impact: 'positive', score: 4, detail: `Assessable income: £${Math.round(assessableIncome).toLocaleString()}. Solid income for most areas outside London.` });
    baseScore += 4;
  } else if (assessableIncome >= 25000) {
    factors.push({ name: 'Income', impact: 'neutral', score: 0, detail: `Assessable income: £${Math.round(assessableIncome).toLocaleString()}. Max borrowing around ${fmt(maxBorrow)}. Consider joint application for higher amounts.` });
  } else {
    factors.push({ name: 'Income', impact: 'warning', score: -5, detail: `Assessable income: £${Math.round(assessableIncome).toLocaleString()} — limited borrowing capacity (${fmt(maxBorrow)}). Shared Ownership might be worth considering.` });
    baseScore -= 5;
    improvements.push({ action: 'Increase income or add a joint applicant', impact: 'High — directly increases max borrowing', timeline: 'Variable' });
  }

  // ── DEBTS ──
  const totalMonthlyDebt = (ccDebt * 0.03) + (loanDebt / 60) + (carDebt / 48) + (studentDebt > 0 ? 100 : 0) + childMaint;
  const debtToIncome = totalGross > 0 ? (totalMonthlyDebt * 12) / totalGross : 0;

  if (totalMonthlyDebt === 0) {
    factors.push({ name: 'Existing Debts', impact: 'positive', score: 6, detail: 'No existing debts — excellent. Full income available for mortgage affordability.' });
    baseScore += 6;
  } else if (debtToIncome < 0.15) {
    factors.push({ name: 'Existing Debts', impact: 'neutral', score: 0, detail: `Monthly debt payments ~£${Math.round(totalMonthlyDebt)}. Debt-to-income ratio: ${(debtToIncome * 100).toFixed(1)}% — manageable.` });
  } else if (debtToIncome < 0.3) {
    factors.push({ name: 'Existing Debts', impact: 'warning', score: -5, detail: `Monthly debt payments ~£${Math.round(totalMonthlyDebt)}. DTI: ${(debtToIncome * 100).toFixed(1)}% — moderately high. Lenders will reduce max borrowing.` });
    baseScore -= 5;
    improvements.push({ action: 'Pay down debts before applying (especially credit cards)', impact: 'High — increases max borrowing by ~£3-5 for every £1/month saved', timeline: '3-12 months' });
  } else {
    factors.push({ name: 'Existing Debts', impact: 'negative', score: -12, detail: `Monthly debt payments ~£${Math.round(totalMonthlyDebt)}. DTI: ${(debtToIncome * 100).toFixed(1)}% — HIGH. Seriously reduces borrowing capacity. Pay down debts first.` });
    baseScore -= 12;
    redFlags.push(`Debt-to-income ratio is ${(debtToIncome * 100).toFixed(1)}% — most lenders want below 30-40%. Your existing debts significantly reduce how much you can borrow.`);
    improvements.push({ action: 'Aggressively pay down debts — especially high-interest credit cards', impact: 'Critical', timeline: '6-18 months' });
  }

  // ── OUTGOINGS ──
  const totalOutgoings = childcare + subs + otherExp + totalMonthlyDebt + childMaint;

  // ── CREDIT SCORE ──
  if (inp.creditScore === 'excellent') {
    factors.push({ name: 'Credit Score', impact: 'positive', score: 10, detail: 'Excellent credit score — access to the best rates from all lenders. You are in the strongest position.' });
    baseScore += 10;
  } else if (inp.creditScore === 'good') {
    factors.push({ name: 'Credit Score', impact: 'positive', score: 6, detail: 'Good credit score — most lenders will offer competitive rates. Very good position.' });
    baseScore += 6;
  } else if (inp.creditScore === 'fair') {
    factors.push({ name: 'Credit Score', impact: 'neutral', score: -2, detail: 'Fair credit score — some lenders may offer higher rates. Consider improving before applying.' });
    baseScore -= 2;
    improvements.push({ action: 'Improve credit score (pay bills on time, reduce utilisation)', impact: 'Medium-High — better rates save thousands', timeline: '3-6 months' });
  } else if (inp.creditScore === 'poor') {
    factors.push({ name: 'Credit Score', impact: 'negative', score: -10, detail: 'Poor credit score — limited to specialist/subprime lenders with much higher rates (often 2-4% above standard).' });
    baseScore -= 10;
    redFlags.push('Poor credit score: Most high-street lenders will decline. Specialist lenders charge significantly higher rates. Work on improving your score for 6-12 months before applying.');
    improvements.push({ action: 'Focus on credit repair: electoral roll, pay all bills on time, reduce card balances below 30%', impact: 'Critical', timeline: '6-12 months' });
  } else {
    factors.push({ name: 'Credit Score', impact: 'negative', score: -18, detail: 'Very poor credit — most lenders will decline. Need significant credit repair before applying.' });
    baseScore -= 18;
    redFlags.push('Very poor credit: Virtually no mainstream lenders will accept you. Focus entirely on credit repair for 12-24 months.');
    improvements.push({ action: 'Credit repair: get a credit builder card, pay minimum on time, clear defaults, register on electoral roll', impact: 'Essential', timeline: '12-24 months' });
  }

  // ── CCJ / BANKRUPTCY ──
  if (hasCCJ) {
    if (ccjYears >= 6) {
      factors.push({ name: 'CCJ History', impact: 'neutral', score: -2, detail: `CCJ ${ccjYears} years ago — dropped off credit file after 6 years. Most lenders won't see it, but some ask about it.` });
      baseScore -= 2;
    } else if (ccjYears >= 3) {
      factors.push({ name: 'CCJ History', impact: 'warning', score: -8, detail: `CCJ ${ccjYears} years ago — still on credit file. Limited to specialist lenders. Must be satisfied (paid).` });
      baseScore -= 8;
      redFlags.push(`CCJ from ${ccjYears} years ago still shows on credit file. Ensure it's marked as "satisfied". Specialist lenders only.`);
    } else {
      factors.push({ name: 'CCJ History', impact: 'negative', score: -15, detail: `Recent CCJ (${ccjYears} year(s) ago) — most lenders will decline. Wait until at least 3 years have passed.` });
      baseScore -= 15;
      redFlags.push(`Recent CCJ: This is a major obstacle. Most lenders require CCJs to be 3+ years old and satisfied. Consider waiting ${Math.ceil(3 - ccjYears)} more year(s).`);
      improvements.push({ action: `Wait for CCJ to age (${Math.ceil(3 - ccjYears)} years) and ensure it's satisfied`, impact: 'Critical', timeline: `${Math.ceil(3 - ccjYears)} year(s)` });
    }
  }

  if (hasBankruptcy) {
    if (bankYears >= 6) {
      factors.push({ name: 'Bankruptcy', impact: 'warning', score: -5, detail: `Bankruptcy ${bankYears} years ago — dropped off credit file. Some specialist lenders will now consider you. Full disclosure required.` });
      baseScore -= 5;
    } else if (bankYears >= 3) {
      factors.push({ name: 'Bankruptcy', impact: 'negative', score: -15, detail: `Bankruptcy ${bankYears} years ago — very limited options. Some specialist lenders may consider with 25%+ deposit.` });
      baseScore -= 15;
      redFlags.push('Bankruptcy within 6 years: Extremely limited lender options. Large deposit (25%+) required. Higher rates.');
    } else {
      factors.push({ name: 'Bankruptcy', impact: 'negative', score: -25, detail: `Recent bankruptcy (${bankYears} year(s)) — virtually impossible to get a mortgage. Wait until discharged + 3 years minimum.` });
      baseScore -= 25;
      redFlags.push('Recent bankruptcy: No mainstream lender will approve. You need to wait until at least 3 years after discharge, rebuild credit, and save a large deposit.');
    }
  }

  // ── DEPOSIT / LTV ──
  const ltv = price > 0 ? ((price - deposit) / price) * 100 : 0;
  const ltvBand = ltv <= 60 ? 'Excellent (≤60%)' : ltv <= 75 ? 'Good (≤75%)' : ltv <= 85 ? 'Acceptable (≤85%)' : ltv <= 90 ? 'Standard (≤90%)' : ltv <= 95 ? 'High (≤95%)' : 'Too High (>95%)';

  if (ltv <= 60) {
    factors.push({ name: 'Deposit / LTV', impact: 'positive', score: 10, detail: `LTV ${ltv.toFixed(1)}% — excellent. Access to the very best rates. Strong equity position.` });
    baseScore += 10;
  } else if (ltv <= 75) {
    factors.push({ name: 'Deposit / LTV', impact: 'positive', score: 7, detail: `LTV ${ltv.toFixed(1)}% — good. Competitive rates available.` });
    baseScore += 7;
  } else if (ltv <= 85) {
    factors.push({ name: 'Deposit / LTV', impact: 'positive', score: 4, detail: `LTV ${ltv.toFixed(1)}% — decent. Reasonable range of products.` });
    baseScore += 4;
  } else if (ltv <= 90) {
    factors.push({ name: 'Deposit / LTV', impact: 'neutral', score: 0, detail: `LTV ${ltv.toFixed(1)}% — standard 10% deposit. Good range of lenders but not the best rates.` });
  } else if (ltv <= 95) {
    factors.push({ name: 'Deposit / LTV', impact: 'warning', score: -5, detail: `LTV ${ltv.toFixed(1)}% — 5% deposit. Limited lenders, higher rates. Consider saving more.` });
    baseScore -= 5;
    improvements.push({ action: 'Save for a 10% deposit instead of 5%', impact: 'High — significantly better rates', timeline: 'Variable — depends on savings rate' });
  } else {
    factors.push({ name: 'Deposit / LTV', impact: 'negative', score: -15, detail: `LTV ${ltv.toFixed(1)}% — insufficient deposit. Minimum 5% required (some schemes allow 0% but very rare).` });
    baseScore -= 15;
    redFlags.push('Deposit too small: You need at least 5% deposit. Consider Help to Buy, Shared Ownership, or saving longer.');
  }

  // ── PROPERTY TYPE ──
  if (inp.propertyType === 'standard') {
    factors.push({ name: 'Property Type', impact: 'positive', score: 3, detail: 'Standard construction — accepted by all lenders without issue.' });
    baseScore += 3;
  } else if (inp.propertyType === 'new_build') {
    factors.push({ name: 'Property Type', impact: 'neutral', score: 1, detail: 'New build — most lenders accept. Some have max LTV of 85% for new builds. NHBC warranty required.' });
    baseScore += 1;
  } else if (inp.propertyType === 'ex_council') {
    factors.push({ name: 'Property Type', impact: 'warning', score: -3, detail: 'Ex-council — some lenders restrict. May have higher service charges. Some won\'t lend on high-rise ex-council.' });
    baseScore -= 3;
  } else {
    factors.push({ name: 'Property Type', impact: 'negative', score: -8, detail: 'Non-standard construction — limited lenders. Specialist survey required. Concrete, timber frame, thatched roof, etc. need specialist products.' });
    baseScore -= 8;
    redFlags.push('Non-standard construction: Many mainstream lenders won\'t lend. Specialist survey needed. Products may have higher rates.');
  }

  // ── PURCHASE VIA ──
  if (inp.purchaseVia === 'personal') {
    factors.push({ name: 'Purchase Structure', impact: 'positive', score: 3, detail: 'Personal purchase — simplest structure, widest lender choice, best rates.' });
    baseScore += 3;
  } else if (inp.purchaseVia === 'joint') {
    factors.push({ name: 'Purchase Structure', impact: 'positive', score: 4, detail: 'Joint purchase — combined income increases affordability. Wider property range.' });
    baseScore += 4;
  } else {
    factors.push({ name: 'Purchase Structure', impact: 'warning', score: -5, detail: 'Limited company (SPV) — specialist mortgage required. Higher rates (+1-2%), larger deposit (25%+). Company needs trading history or SPV-specific product.' });
    baseScore -= 5;
  }

  // ── AFFORDABILITY ──
  const netMonthlyIncome = (totalGross / 12) * 0.7; // rough after-tax
  const disposable = netMonthlyIncome - totalOutgoings - (dependents * 350);
  const mortgageAmount = price - deposit;
  const currentRate = 4.5;
  const stressRate = currentRate + 3; // BoE stress test
  const monthlyPayment = calcPayment(mortgageAmount, currentRate, maxTerm);
  const stressTestPayment = calcPayment(mortgageAmount, stressRate, maxTerm);

  if (disposable > 0 && stressTestPayment > 0 && stressTestPayment < disposable * 0.45) {
    factors.push({ name: 'Affordability (Stress Test)', impact: 'positive', score: 5, detail: `Monthly payment £${Math.round(monthlyPayment)}, stress test at ${stressRate}%: £${Math.round(stressTestPayment)}. Within comfortable range of disposable income.` });
    baseScore += 5;
  } else if (disposable > 0 && stressTestPayment > 0 && stressTestPayment < disposable * 0.65) {
    factors.push({ name: 'Affordability (Stress Test)', impact: 'neutral', score: -2, detail: `Monthly payment £${Math.round(monthlyPayment)}, stress test at ${stressRate}%: £${Math.round(stressTestPayment)}. Tight but potentially passable.` });
    baseScore -= 2;
  } else {
    factors.push({ name: 'Affordability (Stress Test)', impact: 'negative', score: -10, detail: `Stress test payment £${Math.round(stressTestPayment)} may exceed comfortable affordability. Lenders stress test at current rate + 3% to ensure you can still afford payments if rates rise.` });
    baseScore -= 10;
    redFlags.push(`Affordability concern: At the stress test rate (${stressRate}%), monthly payments would be £${Math.round(stressTestPayment)}. This may exceed what lenders consider affordable based on your income and outgoings.`);
  }

  // ── PRICE vs MAX BORROWING ──
  if (mortgageAmount > maxBorrow) {
    const overshoot = mortgageAmount - maxBorrow;
    factors.push({ name: 'Borrowing vs Capacity', impact: 'negative', score: -10, detail: `You need to borrow ${fmt(mortgageAmount)} but max borrowing is ~${fmt(maxBorrow)}. Shortfall: ${fmt(overshoot)}. You need a larger deposit or lower-priced property.` });
    baseScore -= 10;
    redFlags.push(`Borrowing requirement (${fmt(mortgageAmount)}) exceeds estimated max borrowing (${fmt(maxBorrow)}). Either increase deposit by ${fmt(overshoot)} or target properties up to ${fmt(maxBorrow + deposit)}.`);
    improvements.push({ action: `Save additional ${fmt(overshoot)} deposit OR target properties under ${fmt(maxBorrow + deposit)}`, impact: 'Critical', timeline: 'Variable' });
  } else {
    factors.push({ name: 'Borrowing vs Capacity', impact: 'positive', score: 5, detail: `Need: ${fmt(mortgageAmount)}, capacity: ~${fmt(maxBorrow)}. You're within borrowing limits with ${fmt(maxBorrow - mortgageAmount)} headroom.` });
    baseScore += 5;
  }

  // ── CALCULATE PROBABILITY ──
  const probability = Math.min(98, Math.max(2, baseScore));

  // ── LENDER TYPE ──
  let lenderType = 'High Street Bank';
  let lenderDetail = 'Standard high-street lenders (HSBC, Barclays, NatWest, Nationwide, etc.) — best rates and widest product range.';
  if (probability < 30 || hasBankruptcy || (hasCCJ && ccjYears < 3) || inp.creditScore === 'very_poor') {
    lenderType = 'Specialist / Subprime';
    lenderDetail = 'You likely need a specialist or subprime lender (Pepper Money, Kensington, Precise). Expect rates 2-5% higher than standard. A specialist mortgage broker is essential.';
  } else if (probability < 55 || inp.creditScore === 'poor' || inp.employmentType === 'zero_hours' || inp.residency === 'visa') {
    lenderType = 'Building Society / Specialist';
    lenderDetail = 'Building societies (Nationwide, Leeds, Yorkshire) are often more flexible than banks. A whole-of-market mortgage broker can find the right lender for your situation.';
  }

  const affordablePrice = maxBorrow + deposit;

  // ── DEFAULT IMPROVEMENTS ──
  if (improvements.length === 0 && probability < 80) {
    improvements.push({ action: 'Save a larger deposit to lower LTV', impact: 'Medium-High', timeline: '6-24 months' });
    improvements.push({ action: 'Speak to a whole-of-market mortgage broker', impact: 'High — they know which lenders suit your profile', timeline: 'Immediate' });
  }
  if (improvements.length === 0) {
    improvements.push({ action: 'You\'re in a strong position! Get a Mortgage in Principle to confirm.', impact: 'Final step', timeline: 'Today — takes 15-30 minutes online' });
  }

  return {
    probability, factors, maxBorrow, maxTerm, monthlyPayment, stressTestPayment,
    ltv, ltvBand, redFlags, improvements, lenderType, lenderDetail, affordablePrice,
  };
}

const fmt = (n: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(n);

// ============================================================
// Component
// ============================================================

export function MortgageSimulator() {
  const [inputs, setInputs] = useState<SimInputs>(defaultInputs);
  const [showResults, setShowResults] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('personal');

  const set = (key: keyof SimInputs, val: string) => setInputs(prev => ({ ...prev, [key]: val }));

  const result = useMemo(() => runSimulation(inputs), [inputs]);

  const sections = [
    { id: 'personal', title: 'Personal Details', icon: User, gradient: 'from-blue-500 to-indigo-600' },
    { id: 'employment', title: 'Employment', icon: Briefcase, gradient: 'from-emerald-500 to-green-600' },
    { id: 'income', title: 'Income', icon: Banknote, gradient: 'from-amber-500 to-orange-600' },
    { id: 'debts', title: 'Existing Debts & Outgoings', icon: CreditCard, gradient: 'from-red-500 to-rose-600' },
    { id: 'credit', title: 'Credit History', icon: Shield, gradient: 'from-purple-500 to-violet-600' },
    { id: 'property', title: 'Target Property', icon: Home, gradient: 'from-cyan-500 to-blue-600' },
  ];

  const gaugeColor = result.probability >= 70 ? 'text-emerald-500' : result.probability >= 45 ? 'text-amber-500' : 'text-red-500';
  const gaugeLabel = result.probability >= 70 ? 'Good Chances' : result.probability >= 45 ? 'Possible' : 'Challenging';
  const gaugeBg = result.probability >= 70 ? 'from-emerald-500 to-green-600' : result.probability >= 45 ? 'from-amber-500 to-orange-500' : 'from-red-500 to-rose-600';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-sm">
            <Calculator className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-base">Mortgage Approval Simulator</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">Estimate your chances of mortgage approval based on UK lender criteria</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Input Sections */}
        {sections.map(sec => {
          const Icon = sec.icon;
          const open = expandedSection === sec.id;
          return (
            <div key={sec.id} className="border rounded-lg overflow-hidden">
              <button onClick={() => setExpandedSection(open ? null : sec.id)} className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/30 transition-colors">
                <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${sec.gradient} flex items-center justify-center shadow-sm flex-shrink-0`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <span className="font-medium text-sm flex-1">{sec.title}</span>
                {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>
              {open && (
                <div className="px-4 pb-4 pt-2 border-t space-y-3">
                  {sec.id === 'personal' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-1.5"><Label>Age</Label><Input type="number" value={inputs.age} onChange={e => set('age', e.target.value)} /></div>
                      <div className="space-y-1.5"><Label>Dependents</Label><Input type="number" value={inputs.dependents} onChange={e => set('dependents', e.target.value)} /></div>
                      <div className="space-y-1.5"><Label>Residency Status</Label>
                        <Select value={inputs.residency} onValueChange={v => set('residency', v)}><SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="uk_citizen">UK Citizen</SelectItem>
                            <SelectItem value="settled">Settled Status (ILR)</SelectItem>
                            <SelectItem value="pre_settled">Pre-Settled Status</SelectItem>
                            <SelectItem value="visa">Work Visa / Other Visa</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                  {sec.id === 'employment' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-1.5"><Label>Employment Type</Label>
                        <Select value={inputs.employmentType} onValueChange={v => set('employmentType', v)}><SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="employed">Employed (PAYE)</SelectItem>
                            <SelectItem value="self_employed">Self-Employed</SelectItem>
                            <SelectItem value="contractor">Contractor</SelectItem>
                            <SelectItem value="director">Company Director</SelectItem>
                            <SelectItem value="zero_hours">Zero-Hours Contract</SelectItem>
                            <SelectItem value="part_time">Part-Time</SelectItem>
                            <SelectItem value="retired">Retired</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5"><Label>Years in Current Role</Label><Input type="number" step="0.5" value={inputs.yearsCurrentJob} onChange={e => set('yearsCurrentJob', e.target.value)} /></div>
                      <div className="space-y-1.5"><Label>Total Years Employed</Label><Input type="number" step="1" value={inputs.yearsTotalEmployment} onChange={e => set('yearsTotalEmployment', e.target.value)} /></div>
                    </div>
                  )}
                  {sec.id === 'income' && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div className="space-y-1.5"><Label>Annual Salary (£)</Label><Input type="number" step="1000" value={inputs.salary} onChange={e => set('salary', e.target.value)} /></div>
                      <div className="space-y-1.5"><Label>Partner Salary (£)</Label><Input type="number" step="1000" placeholder="0" value={inputs.partnerSalary} onChange={e => set('partnerSalary', e.target.value)} /></div>
                      <div className="space-y-1.5"><Label>Annual Bonus/Overtime (£)</Label><Input type="number" step="1000" placeholder="0" value={inputs.bonusIncome} onChange={e => set('bonusIncome', e.target.value)} /></div>
                      <div className="space-y-1.5"><Label>Annual Rental Income (£)</Label><Input type="number" step="1000" placeholder="0" value={inputs.rentalIncome} onChange={e => set('rentalIncome', e.target.value)} /></div>
                      <div className="space-y-1.5"><Label>Other Annual Income (£)</Label><Input type="number" step="1000" placeholder="0" value={inputs.otherIncome} onChange={e => set('otherIncome', e.target.value)} /></div>
                    </div>
                  )}
                  {sec.id === 'debts' && (
                    <>
                      <p className="text-xs text-muted-foreground">Enter total outstanding balances for debts and monthly amounts for expenses.</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div className="space-y-1.5"><Label>Credit Card Balances (£)</Label><Input type="number" step="100" value={inputs.creditCards} onChange={e => set('creditCards', e.target.value)} /></div>
                        <div className="space-y-1.5"><Label>Personal Loans (£)</Label><Input type="number" step="100" value={inputs.loans} onChange={e => set('loans', e.target.value)} /></div>
                        <div className="space-y-1.5"><Label>Car Finance (£)</Label><Input type="number" step="100" value={inputs.carFinance} onChange={e => set('carFinance', e.target.value)} /></div>
                        <div className="space-y-1.5"><Label>Student Loan Balance (£)</Label><Input type="number" step="100" value={inputs.studentLoan} onChange={e => set('studentLoan', e.target.value)} /></div>
                        <div className="space-y-1.5"><Label>Child Maintenance (£/mo)</Label><Input type="number" step="50" value={inputs.childMaintenance} onChange={e => set('childMaintenance', e.target.value)} /></div>
                        <div className="space-y-1.5"><Label>Childcare (£/mo)</Label><Input type="number" step="50" value={inputs.monthlyChildcare} onChange={e => set('monthlyChildcare', e.target.value)} /></div>
                        <div className="space-y-1.5"><Label>Subscriptions (£/mo)</Label><Input type="number" step="10" value={inputs.monthlySubscriptions} onChange={e => set('monthlySubscriptions', e.target.value)} /></div>
                        <div className="space-y-1.5"><Label>Other Fixed Expenses (£/mo)</Label><Input type="number" step="50" value={inputs.otherExpenses} onChange={e => set('otherExpenses', e.target.value)} /></div>
                      </div>
                    </>
                  )}
                  {sec.id === 'credit' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1.5"><Label>Credit Score Band</Label>
                          <Select value={inputs.creditScore} onValueChange={v => set('creditScore', v)}><SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="excellent">Excellent</SelectItem>
                              <SelectItem value="good">Good</SelectItem>
                              <SelectItem value="fair">Fair</SelectItem>
                              <SelectItem value="poor">Poor</SelectItem>
                              <SelectItem value="very_poor">Very Poor</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5"><Label>Any CCJs/Defaults?</Label>
                          <Select value={inputs.hasCCJ} onValueChange={v => set('hasCCJ', v)}><SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="no">No</SelectItem><SelectItem value="yes">Yes</SelectItem></SelectContent>
                          </Select>
                        </div>
                        {inputs.hasCCJ === 'yes' && (
                          <div className="space-y-1.5"><Label>How many years ago?</Label><Input type="number" step="1" value={inputs.ccjYearsAgo} onChange={e => set('ccjYearsAgo', e.target.value)} /></div>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1.5"><Label>Any Bankruptcy/IVA?</Label>
                          <Select value={inputs.hasBankruptcy} onValueChange={v => set('hasBankruptcy', v)}><SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="no">No</SelectItem><SelectItem value="yes">Yes</SelectItem></SelectContent>
                          </Select>
                        </div>
                        {inputs.hasBankruptcy === 'yes' && (
                          <div className="space-y-1.5"><Label>How many years ago?</Label><Input type="number" step="1" value={inputs.bankruptcyYearsAgo} onChange={e => set('bankruptcyYearsAgo', e.target.value)} /></div>
                        )}
                      </div>
                    </div>
                  )}
                  {sec.id === 'property' && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="space-y-1.5"><Label>Property Price (£)</Label><Input type="number" step="5000" value={inputs.propertyPrice} onChange={e => set('propertyPrice', e.target.value)} /></div>
                      <div className="space-y-1.5"><Label>Deposit (£)</Label><Input type="number" step="1000" value={inputs.deposit} onChange={e => set('deposit', e.target.value)} /></div>
                      <div className="space-y-1.5"><Label>Property Type</Label>
                        <Select value={inputs.propertyType} onValueChange={v => set('propertyType', v)}><SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="standard">Standard Construction</SelectItem>
                            <SelectItem value="new_build">New Build</SelectItem>
                            <SelectItem value="ex_council">Ex-Council</SelectItem>
                            <SelectItem value="non_standard">Non-Standard Construction</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5"><Label>Purchase Via</Label>
                        <Select value={inputs.purchaseVia} onValueChange={v => set('purchaseVia', v)}><SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="personal">Personal</SelectItem>
                            <SelectItem value="joint">Joint (with partner)</SelectItem>
                            <SelectItem value="limited_company">Limited Company (SPV)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Run Simulation Button */}
        <button onClick={() => setShowResults(true)} className="w-full py-3 rounded-lg bg-gradient-to-r from-orange-500 to-red-600 text-white font-semibold text-sm shadow-sm hover:shadow-md transition-all">
          Analyse My Mortgage Chances
        </button>

        {/* Results */}
        {showResults && (
          <div className="space-y-4 pt-2">
            {/* Probability Gauge */}
            <div className="p-5 rounded-xl border text-center space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Estimated Approval Probability</p>
              <div className="relative mx-auto w-40 h-40">
                <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth="10" className="text-muted/20" />
                  <circle cx="60" cy="60" r="50" fill="none" stroke="url(#gaugeGrad)" strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={`${result.probability * 3.14} ${314 - result.probability * 3.14}`} />
                  <defs><linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={result.probability >= 70 ? '#10b981' : result.probability >= 45 ? '#f59e0b' : '#ef4444'} />
                    <stop offset="100%" stopColor={result.probability >= 70 ? '#059669' : result.probability >= 45 ? '#d97706' : '#dc2626'} />
                  </linearGradient></defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-3xl font-bold ${gaugeColor}`}>{result.probability}%</span>
                  <span className="text-xs text-muted-foreground">{gaugeLabel}</span>
                </div>
              </div>
            </div>

            {/* Key Numbers */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Max Borrowing', val: fmt(result.maxBorrow), g: 'from-blue-500 to-indigo-600' },
                { label: 'Max Term', val: `${result.maxTerm} years`, g: 'from-emerald-500 to-green-600' },
                { label: 'Monthly Payment', val: fmt(Math.round(result.monthlyPayment)), g: 'from-amber-500 to-orange-600' },
                { label: `LTV (${result.ltvBand.split('(')[0].trim()})`, val: `${result.ltv.toFixed(1)}%`, g: 'from-purple-500 to-violet-600' },
              ].map(c => (
                <div key={c.label} className={`p-3 rounded-xl bg-gradient-to-br ${c.g} text-white`}>
                  <p className="text-[10px] opacity-80">{c.label}</p>
                  <p className="text-lg font-bold">{c.val}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border">
                <p className="text-xs text-muted-foreground">Stress Test Payment (rate + 3%)</p>
                <p className="text-lg font-bold text-red-500">{fmt(Math.round(result.stressTestPayment))}<span className="text-xs font-normal text-muted-foreground">/month</span></p>
                <p className="text-[10px] text-muted-foreground">BoE requires lenders to check you can afford payments if rates rise by 3%</p>
              </div>
              <div className="p-3 rounded-lg border">
                <p className="text-xs text-muted-foreground">Affordable Property Price</p>
                <p className="text-lg font-bold text-emerald-600">{fmt(result.affordablePrice)}</p>
                <p className="text-[10px] text-muted-foreground">Based on max borrowing ({fmt(result.maxBorrow)}) + your deposit</p>
              </div>
            </div>

            {/* Red Flags */}
            {result.redFlags.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold flex items-center gap-2 text-red-600"><XCircle className="h-4 w-4" /> Red Flags</p>
                {result.redFlags.map((rf, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30">
                    <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-800 dark:text-red-300">{rf}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Factor Breakdown */}
            <div className="space-y-2">
              <p className="text-sm font-semibold flex items-center gap-2"><FileText className="h-4 w-4" /> Factor Breakdown</p>
              {result.factors.map((f, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg border">
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    f.impact === 'positive' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                    f.impact === 'negative' ? 'bg-red-100 dark:bg-red-900/30' :
                    f.impact === 'warning' ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-muted'
                  }`}>
                    {f.impact === 'positive' ? <PlusCircle className="h-3.5 w-3.5 text-emerald-600" /> :
                     f.impact === 'negative' ? <MinusCircle className="h-3.5 w-3.5 text-red-600" /> :
                     f.impact === 'warning' ? <AlertTriangle className="h-3.5 w-3.5 text-amber-600" /> :
                     <Info className="h-3.5 w-3.5 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold">{f.name}</span>
                      <Badge className={`text-[10px] ${
                        f.score > 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        f.score < 0 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        'bg-muted text-muted-foreground'
                      }`}>{f.score > 0 ? '+' : ''}{f.score}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{f.detail}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Improvement Plan */}
            <div className="space-y-2">
              <p className="text-sm font-semibold flex items-center gap-2 text-emerald-600"><TrendingUp className="h-4 w-4" /> Improvement Plan</p>
              {result.improvements.map((imp, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30">
                  <div className="h-6 w-6 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-0.5">{i + 1}</div>
                  <div>
                    <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-200">{imp.action}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="secondary" className="text-[10px]">Impact: {imp.impact}</Badge>
                      <Badge variant="secondary" className="text-[10px]"><Clock className="h-2.5 w-2.5 mr-1" />{imp.timeline}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Lender Suitability */}
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 space-y-2">
              <p className="text-sm font-semibold flex items-center gap-2"><Building2 className="h-4 w-4 text-blue-600" /> Recommended Lender Type: <span className="text-blue-600">{result.lenderType}</span></p>
              <p className="text-xs text-blue-800 dark:text-blue-300">{result.lenderDetail}</p>
            </div>

            {/* Disclaimer */}
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-muted-foreground">
                  This simulator provides an estimate based on general UK mortgage lender criteria. Every lender has different requirements.
                  This is NOT a mortgage offer or financial advice. Always consult a qualified mortgage broker or financial adviser.
                  Figures are based on typical criteria as of 2025.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
