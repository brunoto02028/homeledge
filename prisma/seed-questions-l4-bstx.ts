/**
 * Level 4 BSTX — Business Tax (40 questions)
 * Run: npx tsx prisma/seed-questions-l4-bstx.ts
 */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
interface QS { questionText: string; topic: string; difficulty: 'easy'|'medium'|'hard'; syllabusRef: string; aiExplanation: string; options: { text: string; correct: boolean; explanation: string }[]; }
async function seedModule(code: string, questions: QS[]) {
  const mod = await (prisma as any).examModule.findFirst({ where: { code } });
  if (!mod) { console.log(`  ⚠️ ${code} not found`); return; }
  const existing = await (prisma as any).question.count({ where: { moduleId: mod.id } });
  let added = 0;
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const dup = await (prisma as any).question.findFirst({ where: { moduleId: mod.id, questionText: q.questionText } });
    if (dup) continue;
    const created = await (prisma as any).question.create({
      data: { moduleId: mod.id, questionText: q.questionText, topic: q.topic, difficulty: q.difficulty, syllabusRef: q.syllabusRef, aiExplanation: q.aiExplanation, sortOrder: existing + i + 1 },
    });
    for (let j = 0; j < q.options.length; j++) {
      await (prisma as any).questionOption.create({
        data: { questionId: created.id, optionText: q.options[j].text, isCorrect: q.options[j].correct, explanation: q.options[j].explanation, sortOrder: j + 1 },
      });
    }
    added++;
  }
  console.log(`  ✅ ${code}: ${added} new (${existing} existed)`);
}

const BSTX: QS[] = [
  // --- Corporation Tax Computation (10) ---
  { questionText: 'The main rate of UK corporation tax for FY2024 is:', topic: 'Corporation Tax Computation', difficulty: 'easy', syllabusRef: '1.1',
    aiExplanation: 'From April 2023, the main rate is 25% for profits over £250,000. The small profits rate is 19% for profits up to £50,000. Marginal relief applies between £50,000 and £250,000.',
    options: [{ text: '25%', correct: true, explanation: 'Correct! Main rate from April 2023.' },{ text: '19%', correct: false, explanation: 'Small profits rate, not main.' },{ text: '20%', correct: false, explanation: 'Previous main rate.' },{ text: '30%', correct: false, explanation: 'Too high.' }] },
  { questionText: 'The small profits rate of corporation tax (19%) applies to companies with taxable profits up to:', topic: 'Corporation Tax Computation', difficulty: 'easy', syllabusRef: '1.2',
    aiExplanation: 'Small profits rate (19%) for taxable profits ≤ £50,000. Main rate (25%) for profits > £250,000. Marginal relief for profits between £50,000 and £250,000. These limits are divided by the number of associated companies.',
    options: [{ text: '£50,000', correct: true, explanation: 'Correct!' },{ text: '£250,000', correct: false, explanation: 'That is the upper limit for marginal relief.' },{ text: '£150,000', correct: false, explanation: 'Previous associated company threshold.' },{ text: '£85,000', correct: false, explanation: 'That is the VAT threshold.' }] },
  { questionText: 'A company has trading profits of £180,000 and investment income of £20,000. Total taxable profits?', topic: 'Corporation Tax Computation', difficulty: 'easy', syllabusRef: '1.3',
    aiExplanation: 'Total taxable profits (TTP) = Trading income + Investment income + Chargeable gains - Qualifying charitable donations. TTP = £180,000 + £20,000 = £200,000.',
    options: [{ text: '£200,000', correct: true, explanation: 'Correct!' },{ text: '£180,000', correct: false, explanation: 'Must include investment income.' },{ text: '£160,000', correct: false, explanation: 'Subtracted instead of adding.' },{ text: '£20,000', correct: false, explanation: 'Investment income alone.' }] },
  { questionText: 'Corporation tax is based on:', topic: 'Corporation Tax Computation', difficulty: 'easy', syllabusRef: '1.4',
    aiExplanation: 'Corporation tax is based on a company\'s accounting period (normally 12 months). If an accounting period exceeds 12 months, it is split into two CT periods: the first 12 months, and the remainder.',
    options: [{ text: 'The tax year (6 April to 5 April)', correct: false, explanation: 'That is for individuals, not companies.' },{ text: 'The company\'s accounting period', correct: true, explanation: 'Correct!' },{ text: 'The calendar year', correct: false, explanation: 'Not necessarily aligned to calendar year.' },{ text: 'The VAT quarter', correct: false, explanation: 'VAT and CT have separate periods.' }] },
  { questionText: 'Dividends received by a UK company from another UK company are:', topic: 'Corporation Tax Computation', difficulty: 'medium', syllabusRef: '1.5',
    aiExplanation: 'Dividends received from other UK companies are exempt from corporation tax (to avoid double taxation). They are not included in taxable profits. This is called the dividend exemption.',
    options: [{ text: 'Taxed at 25%', correct: false, explanation: 'UK dividends are exempt.' },{ text: 'Exempt from corporation tax', correct: true, explanation: 'Correct!' },{ text: 'Taxed at 19%', correct: false, explanation: 'Exempt, not taxed.' },{ text: 'Added to trading profits', correct: false, explanation: 'Excluded from the CT computation.' }] },
  // --- Trading Income Adjustments (8) ---
  { questionText: 'Which of these is an allowable deduction for corporation tax purposes?', topic: 'Trading Income Adjustments', difficulty: 'easy', syllabusRef: '2.1',
    aiExplanation: 'Allowable deductions must be incurred wholly and exclusively for trade purposes. Examples: staff wages, rent, insurance, repairs, professional fees (trade-related), interest on trade loans.',
    options: [{ text: 'Client entertaining', correct: false, explanation: 'Entertaining is disallowable.' },{ text: 'Staff salaries', correct: true, explanation: 'Correct!' },{ text: 'Fines for breaking the law', correct: false, explanation: 'Fines/penalties are disallowable.' },{ text: 'Political donations', correct: false, explanation: 'Not wholly and exclusively for trade.' }] },
  { questionText: 'Depreciation in the accounts is:', topic: 'Trading Income Adjustments', difficulty: 'easy', syllabusRef: '2.2',
    aiExplanation: 'Depreciation is added back (disallowed) in the CT computation because HMRC has its own system: capital allowances. The company cannot choose its own rate of depreciation for tax purposes.',
    options: [{ text: 'An allowable deduction', correct: false, explanation: 'Disallowed — replaced by capital allowances.' },{ text: 'Added back as a disallowable expense', correct: true, explanation: 'Correct!' },{ text: 'Ignored completely', correct: false, explanation: 'Added back, then capital allowances claimed.' },{ text: 'Deducted twice', correct: false, explanation: 'Not deducted at all for tax.' }] },
  { questionText: 'Capital expenditure in the P&L is treated as:', topic: 'Trading Income Adjustments', difficulty: 'easy', syllabusRef: '2.3',
    aiExplanation: 'Capital expenditure is disallowable for CT purposes. Instead, capital allowances are claimed on qualifying expenditure. If capital items are wrongly expensed in the accounts, they must be added back.',
    options: [{ text: 'Allowable as an expense', correct: false, explanation: 'Capital expenditure is disallowed.' },{ text: 'Disallowable — capital allowances claimed instead', correct: true, explanation: 'Correct!' },{ text: 'Deducted from capital gains', correct: false, explanation: 'Not deducted from gains.' },{ text: 'Carried forward indefinitely', correct: false, explanation: 'Capital allowances have their own rules.' }] },
  { questionText: 'Entertaining overseas customers is:', topic: 'Trading Income Adjustments', difficulty: 'medium', syllabusRef: '2.4',
    aiExplanation: 'Entertaining overseas customers IS allowable for CT (but not for VAT). Entertaining UK customers is disallowable. Staff entertaining (e.g., Christmas party) is allowable if reasonable.',
    options: [{ text: 'Disallowable', correct: false, explanation: 'Overseas customer entertaining IS allowed for CT.' },{ text: 'Allowable for CT purposes', correct: true, explanation: 'Correct!' },{ text: 'Only allowable up to £150 per head', correct: false, explanation: 'That is the staff entertainment limit for income tax.' },{ text: 'Allowable for VAT but not CT', correct: false, explanation: 'Opposite — allowable for CT but not VAT.' }] },
  { questionText: 'Lease rentals for a car with CO2 emissions over 50g/km are:', topic: 'Trading Income Adjustments', difficulty: 'hard', syllabusRef: '2.5',
    aiExplanation: 'Cars with CO2 emissions > 50g/km: 15% of lease costs are disallowed (only 85% deductible). Cars with CO2 ≤ 50g/km: fully deductible. This encourages companies to lease low-emission vehicles.',
    options: [{ text: 'Fully allowable', correct: false, explanation: 'High-emission cars have a 15% restriction.' },{ text: '85% allowable (15% disallowed)', correct: true, explanation: 'Correct!' },{ text: '50% allowable', correct: false, explanation: 'Restriction is 15%, not 50%.' },{ text: 'Fully disallowed', correct: false, explanation: '85% IS allowed.' }] },
  { questionText: 'Qualifying charitable donations (Gift Aid) are deducted:', topic: 'Trading Income Adjustments', difficulty: 'medium', syllabusRef: '2.6',
    aiExplanation: 'Qualifying charitable donations (QCDs) are deducted from total profits (after trading income + investment income + gains) to arrive at taxable total profits. They are paid gross by companies (no basic rate deduction like individuals).',
    options: [{ text: 'From trading profits only', correct: false, explanation: 'From total profits.' },{ text: 'From total profits to give taxable total profits', correct: true, explanation: 'Correct!' },{ text: 'As a capital allowance', correct: false, explanation: 'Not a capital allowance.' },{ text: 'They are not deductible', correct: false, explanation: 'Gift Aid donations ARE deductible.' }] },
  { questionText: 'Interest paid on a loan to buy trading premises is:', topic: 'Trading Income Adjustments', difficulty: 'easy', syllabusRef: '2.7',
    aiExplanation: 'Interest on loans for trade purposes is allowable as a trading expense (on an accruals basis). Interest on non-trade loans is a separate category of expense but still deductible.',
    options: [{ text: 'Disallowed', correct: false, explanation: 'Trade loan interest is allowable.' },{ text: 'Allowable as a trading expense', correct: true, explanation: 'Correct!' },{ text: 'Only allowable if under £500', correct: false, explanation: 'No monetary limit.' },{ text: 'Treated as a capital allowance', correct: false, explanation: 'Interest is a revenue expense.' }] },
  { questionText: 'A provision for future repairs (not yet incurred) is:', topic: 'Trading Income Adjustments', difficulty: 'medium', syllabusRef: '2.8',
    aiExplanation: 'General provisions are disallowed for CT. Only specific provisions (where the expense is almost certain) are allowable. Future repair provisions are too uncertain.',
    options: [{ text: 'Allowable', correct: false, explanation: 'General provisions are disallowed.' },{ text: 'Disallowable — add back', correct: true, explanation: 'Correct!' },{ text: 'Partially allowable', correct: false, explanation: 'Fully disallowed.' },{ text: 'A capital allowance', correct: false, explanation: 'Not related to capital allowances.' }] },
  // --- Capital Allowances (10) ---
  { questionText: 'The Annual Investment Allowance (AIA) provides:', topic: 'Capital Allowances (AIA, WDA)', difficulty: 'easy', syllabusRef: '3.1',
    aiExplanation: 'AIA gives 100% first-year relief on qualifying plant and machinery expenditure up to £1,000,000 per annum. It is available to all businesses (sole traders, partnerships, companies). Cars do NOT qualify for AIA.',
    options: [{ text: '100% relief up to £1,000,000 on plant and machinery', correct: true, explanation: 'Correct!' },{ text: '25% relief on all assets', correct: false, explanation: 'That is the main pool WDA rate.' },{ text: '50% relief on cars only', correct: false, explanation: 'Cars don\'t qualify for AIA.' },{ text: '18% first-year allowance', correct: false, explanation: 'That is the main pool WDA.' }] },
  { questionText: 'Which asset does NOT qualify for the Annual Investment Allowance?', topic: 'Capital Allowances (AIA, WDA)', difficulty: 'easy', syllabusRef: '3.2',
    aiExplanation: 'Cars are excluded from AIA. They go into the main pool (18% WDA) or special rate pool (6% WDA) depending on CO2 emissions. Exception: electric/zero-emission cars get 100% first-year allowance.',
    options: [{ text: 'Office furniture', correct: false, explanation: 'Qualifies for AIA.' },{ text: 'Computer equipment', correct: false, explanation: 'Qualifies for AIA.' },{ text: 'Cars', correct: true, explanation: 'Correct! Cars are excluded from AIA.' },{ text: 'Machinery', correct: false, explanation: 'Qualifies for AIA.' }] },
  { questionText: 'The main pool writing down allowance (WDA) rate is:', topic: 'Capital Allowances (AIA, WDA)', difficulty: 'easy', syllabusRef: '3.3',
    aiExplanation: 'Main pool WDA: 18% per annum (reducing balance). Special rate pool: 6% per annum. The main pool includes general plant and machinery, cars with CO2 ≤ 50g/km. Special rate includes long-life assets, integral features, cars with CO2 > 50g/km.',
    options: [{ text: '18%', correct: true, explanation: 'Correct!' },{ text: '25%', correct: false, explanation: 'Not the current rate.' },{ text: '6%', correct: false, explanation: 'That is the special rate pool.' },{ text: '8%', correct: false, explanation: 'Not a standard CA rate.' }] },
  { questionText: 'A car with CO2 emissions of 40g/km qualifies for:', topic: 'Capital Allowances (AIA, WDA)', difficulty: 'medium', syllabusRef: '3.4',
    aiExplanation: 'CO2 ≤ 0g/km (electric): 100% FYA. CO2 1-50g/km: main pool (18% WDA). CO2 > 50g/km: special rate pool (6% WDA). A 40g/km car goes in the main pool at 18%.',
    options: [{ text: '100% first-year allowance', correct: false, explanation: 'Only for zero-emission vehicles.' },{ text: 'Main pool at 18%', correct: true, explanation: 'Correct! CO2 1-50g/km = main pool.' },{ text: 'Special rate pool at 6%', correct: false, explanation: 'Only for CO2 > 50g/km.' },{ text: 'No capital allowances', correct: false, explanation: 'Cars do qualify for WDA.' }] },
  { questionText: 'Full expensing (100% FYA) from April 2023 applies to:', topic: 'Capital Allowances (AIA, WDA)', difficulty: 'medium', syllabusRef: '3.5',
    aiExplanation: 'Full expensing: 100% first-year deduction for qualifying new (not second-hand) plant and machinery. Main rate assets get 100%, special rate assets get 50%. Only available to companies (not sole traders).',
    options: [{ text: 'All assets for all businesses', correct: false, explanation: 'Companies only, new assets only.' },{ text: 'New plant and machinery for companies only', correct: true, explanation: 'Correct!' },{ text: 'Second-hand assets only', correct: false, explanation: 'New assets only.' },{ text: 'Cars only', correct: false, explanation: 'Cars have their own rules.' }] },
  { questionText: 'When an asset from the main pool is sold, the disposal proceeds are:', topic: 'Capital Allowances (AIA, WDA)', difficulty: 'medium', syllabusRef: '3.6',
    aiExplanation: 'Disposal proceeds (or original cost if lower) are deducted from the pool balance. If the pool becomes negative, a balancing charge arises (taxable). If the pool balance is positive and the trade ceases, a balancing allowance arises (deductible).',
    options: [{ text: 'Deducted from the pool balance', correct: true, explanation: 'Correct!' },{ text: 'Added to the pool balance', correct: false, explanation: 'Deducted, not added.' },{ text: 'Ignored', correct: false, explanation: 'Must be accounted for.' },{ text: 'Taxed as income', correct: false, explanation: 'Affects the capital allowance computation, not directly taxed.' }] },
  { questionText: 'A balancing charge arises when:', topic: 'Capital Allowances (AIA, WDA)', difficulty: 'hard', syllabusRef: '3.7',
    aiExplanation: 'A balancing charge occurs when disposal proceeds exceed the pool balance (or for single-asset pools, exceed the written-down value). It is added to taxable profits — effectively clawing back excess allowances.',
    options: [{ text: 'Disposal proceeds exceed the pool/asset balance', correct: true, explanation: 'Correct! Taxable.' },{ text: 'An asset is bought', correct: false, explanation: 'Purchases don\'t cause balancing charges.' },{ text: 'The WDA is calculated', correct: false, explanation: 'WDA is a normal allowance, not a charge.' },{ text: 'AIA is claimed', correct: false, explanation: 'AIA claiming doesn\'t cause a charge.' }] },
  { questionText: 'Structures and Buildings Allowance (SBA) provides relief at:', topic: 'Capital Allowances (AIA, WDA)', difficulty: 'medium', syllabusRef: '3.8',
    aiExplanation: 'SBA: 3% per annum straight-line on qualifying commercial buildings/structures. Available on new construction or renovation costs from 29 October 2018. Land cost is excluded.',
    options: [{ text: '3% per annum straight-line', correct: true, explanation: 'Correct!' },{ text: '18% reducing balance', correct: false, explanation: 'That is the main pool WDA.' },{ text: '25% straight-line', correct: false, explanation: 'Too high.' },{ text: 'No relief — buildings don\'t qualify', correct: false, explanation: 'SBA provides relief since 2018.' }] },
  { questionText: 'The small pool allowance allows a business to write off a pool balance below:', topic: 'Capital Allowances (AIA, WDA)', difficulty: 'medium', syllabusRef: '3.9',
    aiExplanation: 'If the main pool or special rate pool balance is £1,000 or less (before WDA), the business can claim the full amount as a WDA instead of the normal percentage. This avoids carrying tiny balances forward.',
    options: [{ text: '£1,000', correct: true, explanation: 'Correct!' },{ text: '£5,000', correct: false, explanation: 'Too high.' },{ text: '£500', correct: false, explanation: 'Too low.' },{ text: '£10,000', correct: false, explanation: 'Too high.' }] },
  { questionText: 'Private use of an asset by a sole trader affects capital allowances by:', topic: 'Capital Allowances (AIA, WDA)', difficulty: 'hard', syllabusRef: '3.10',
    aiExplanation: 'For sole traders/partners, private-use assets go in a single-asset pool. Capital allowances are calculated normally but then reduced by the private-use percentage. Companies are not affected as directors\' private use is a benefit-in-kind instead.',
    options: [{ text: 'No effect', correct: false, explanation: 'Private use reduces the allowance.' },{ text: 'The allowance is reduced by the private-use percentage', correct: true, explanation: 'Correct!' },{ text: 'No capital allowances are available', correct: false, explanation: 'Allowances are given but reduced.' },{ text: 'Double allowances are given', correct: false, explanation: 'Reduced, not doubled.' }] },
  // --- Trading Loss Relief (6) ---
  { questionText: 'A company\'s trading loss can be set against:', topic: 'Trading Loss Relief', difficulty: 'medium', syllabusRef: '4.1',
    aiExplanation: 'Company trading losses can be: (1) Set against total profits of the same period, (2) Carried back 12 months against total profits, (3) Carried forward against future trading profits (or total profits from April 2017). Loss relief is claimed in this order of priority.',
    options: [{ text: 'Total profits of the same period and/or carried back 12 months', correct: true, explanation: 'Correct!' },{ text: 'Trading profits only of the next year', correct: false, explanation: 'Can be set against total profits, not just trading.' },{ text: 'Only carried forward', correct: false, explanation: 'Current year and carry-back are available too.' },{ text: 'Dividend income only', correct: false, explanation: 'Against total profits, not specific income types.' }] },
  { questionText: 'Trading losses carried forward from April 2017 can be set against:', topic: 'Trading Loss Relief', difficulty: 'medium', syllabusRef: '4.2',
    aiExplanation: 'From April 2017, carried-forward losses can be set against total profits (not just trading profits). But there is a restriction: only the first £5m of profits can use carried-forward losses freely; above £5m, only 50% can be offset.',
    options: [{ text: 'Future trading profits only', correct: false, explanation: 'Pre-April 2017 rule.' },{ text: 'Future total profits', correct: true, explanation: 'Correct! From April 2017.' },{ text: 'Past profits only', correct: false, explanation: 'Carry-back is a separate claim.' },{ text: 'Capital gains only', correct: false, explanation: 'Total profits includes everything.' }] },
  { questionText: 'A terminal loss relief claim allows carry-back of:', topic: 'Trading Loss Relief', difficulty: 'hard', syllabusRef: '4.3',
    aiExplanation: 'When a company ceases trading, losses in the final 12 months can be carried back against profits of the previous 3 years (LIFO — latest year first). This is more generous than the normal 12-month carry-back.',
    options: [{ text: 'Final 12 months\' losses against previous 3 years\' profits', correct: true, explanation: 'Correct!' },{ text: 'Any loss against next year only', correct: false, explanation: 'Terminal loss is carry-back, not forward.' },{ text: 'Losses against 1 year only', correct: false, explanation: '3 years for terminal loss.' },{ text: 'No carry-back is available on cessation', correct: false, explanation: 'Terminal loss relief IS available.' }] },
  { questionText: 'Loss relief claims must be made within:', topic: 'Trading Loss Relief', difficulty: 'medium', syllabusRef: '4.4',
    aiExplanation: 'Loss relief claims must be made within 2 years of the end of the accounting period in which the loss arose. If not claimed in time, the relief is lost.',
    options: [{ text: '2 years of the end of the loss-making period', correct: true, explanation: 'Correct!' },{ text: '1 year', correct: false, explanation: 'Too short.' },{ text: '4 years', correct: false, explanation: 'That is the amendment deadline for SA.' },{ text: 'No time limit', correct: false, explanation: 'There IS a 2-year limit.' }] },
  // --- CT600 & Payment (6) ---
  { questionText: 'Corporation tax is normally due for payment:', topic: 'CT600 Return', difficulty: 'medium', syllabusRef: '5.1',
    aiExplanation: '9 months and 1 day after the end of the accounting period. For large companies (profits > £1.5m), quarterly instalment payments are required. Very large companies (profits > £20m) pay even earlier.',
    options: [{ text: '9 months and 1 day after the accounting period end', correct: true, explanation: 'Correct!' },{ text: '31 January following the tax year', correct: false, explanation: 'That is for individuals, not companies.' },{ text: '30 days after assessment', correct: false, explanation: 'No assessment-based deadline.' },{ text: '12 months after the period end', correct: false, explanation: 'The CT600 is due at 12 months; payment is at 9 months + 1 day.' }] },
  { questionText: 'The CT600 return must be filed within:', topic: 'CT600 Return', difficulty: 'easy', syllabusRef: '5.2',
    aiExplanation: '12 months after the end of the accounting period. This is 3 months AFTER the payment deadline. Filing must be done online.',
    options: [{ text: '12 months after the accounting period end', correct: true, explanation: 'Correct!' },{ text: '9 months after the period end', correct: false, explanation: 'That is the payment deadline.' },{ text: '31 January', correct: false, explanation: 'For individuals, not companies.' },{ text: '3 months after the period end', correct: false, explanation: 'Too short.' }] },
  { questionText: 'The penalty for late filing of a CT600 return at 3 months late is:', topic: 'Payment Dates & Penalties', difficulty: 'medium', syllabusRef: '6.1',
    aiExplanation: 'CT600 penalties: 1 day late = £100, 3 months late = additional £100 (total £200), 6 months late = HMRC estimate + 10% tax-geared penalty, 12 months late = additional 10% tax-geared penalty.',
    options: [{ text: '£200 (£100 + £100)', correct: true, explanation: 'Correct!' },{ text: '£100', correct: false, explanation: 'That is for 1 day late only.' },{ text: '£500', correct: false, explanation: 'Too high for 3 months.' },{ text: 'No penalty until 6 months', correct: false, explanation: 'Penalties start from day 1.' }] },
  { questionText: 'Interest is charged on late payment of corporation tax from:', topic: 'Payment Dates & Penalties', difficulty: 'easy', syllabusRef: '6.2',
    aiExplanation: 'Interest runs from the due date (9 months + 1 day after period end) until the date of payment. The interest rate is set by HMRC and is not tax-deductible.',
    options: [{ text: 'The due date until payment', correct: true, explanation: 'Correct!' },{ text: 'The end of the accounting period', correct: false, explanation: 'From the due date, not period end.' },{ text: 'The filing date', correct: false, explanation: 'Interest relates to payment, not filing.' },{ text: 'Interest is not charged', correct: false, explanation: 'Interest IS charged on late payment.' }] },
  { questionText: 'Large companies must pay corporation tax in:', topic: 'Payment Dates & Penalties', difficulty: 'medium', syllabusRef: '6.3',
    aiExplanation: 'Large companies (annual profits > £1.5m) pay by quarterly instalments in months 7, 10, 13, and 16 of the accounting period. This means the first instalment is due BEFORE the period ends.',
    options: [{ text: 'Quarterly instalments', correct: true, explanation: 'Correct!' },{ text: 'One lump sum at 9 months', correct: false, explanation: 'Only for non-large companies.' },{ text: 'Monthly instalments', correct: false, explanation: 'Quarterly, not monthly.' },{ text: 'Two instalments', correct: false, explanation: 'Four quarterly instalments.' }] },
  { questionText: 'A company with a 31 December year end must pay CT (non-large) by:', topic: 'Payment Dates & Penalties', difficulty: 'easy', syllabusRef: '6.4',
    aiExplanation: '9 months + 1 day after 31 December = 1 October of the following year.',
    options: [{ text: '1 October', correct: true, explanation: 'Correct!' },{ text: '31 January', correct: false, explanation: 'SA deadline, not CT.' },{ text: '1 July', correct: false, explanation: 'Only 6 months.' },{ text: '31 December next year', correct: false, explanation: 'That is the filing deadline.' }] },
];

async function main() {
  console.log('\n🎓 Seeding L4 BSTX...\n');
  await seedModule('BSTX', BSTX);
  console.log('\n✅ Done!');
}
main().catch(console.error).finally(() => prisma.$disconnect());
