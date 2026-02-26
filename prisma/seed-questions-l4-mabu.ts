/**
 * Level 4 MABU — Management Accounting: Budgeting (40 questions)
 * Run: npx tsx prisma/seed-questions-l4-mabu.ts
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

const MABU: QS[] = [
  // --- Budget Preparation (10) ---
  { questionText: 'The master budget consists of:', topic: 'Budget Preparation', difficulty: 'easy', syllabusRef: '1.1',
    aiExplanation: 'The master budget is the overall budget comprising all functional budgets. It typically includes: budgeted P&L, budgeted SOFP, and cash budget. All functional budgets feed into it.',
    options: [{ text: 'Budgeted P&L, budgeted SOFP, and cash budget', correct: true, explanation: 'Correct!' },{ text: 'Sales budget only', correct: false, explanation: 'Sales is just one functional budget.' },{ text: 'Cash budget only', correct: false, explanation: 'Cash is one component.' },{ text: 'The actual results for the year', correct: false, explanation: 'Budgets are forecasts, not actuals.' }] },
  { questionText: 'The budget that is usually prepared first is the:', topic: 'Budget Preparation', difficulty: 'easy', syllabusRef: '1.2',
    aiExplanation: 'The sales budget is usually prepared first because it drives all other budgets. Sales determine production, which determines materials, labour, and overheads. Exception: if production capacity is the limiting factor, the production budget may come first.',
    options: [{ text: 'Sales budget', correct: true, explanation: 'Correct! Sales drives everything else.' },{ text: 'Production budget', correct: false, explanation: 'Follows from sales.' },{ text: 'Cash budget', correct: false, explanation: 'One of the last to be prepared.' },{ text: 'Materials budget', correct: false, explanation: 'Follows from production.' }] },
  { questionText: 'Production budget (units) = Sales units + Closing inventory - Opening inventory. Sales 10,000, closing inv 1,500, opening inv 1,200. Production?', topic: 'Budget Preparation', difficulty: 'medium', syllabusRef: '1.3',
    aiExplanation: '10,000 + 1,500 - 1,200 = 10,300 units to produce.',
    options: [{ text: '10,300', correct: true, explanation: 'Correct!' },{ text: '10,700', correct: false, explanation: 'Added opening instead of subtracting.' },{ text: '9,700', correct: false, explanation: 'Subtracted closing instead of adding.' },{ text: '10,000', correct: false, explanation: 'Ignores inventory changes.' }] },
  { questionText: 'Materials purchase budget (kg) = Production needs + Closing materials - Opening materials. Production needs 5,000kg, closing 800kg, opening 600kg. Purchases?', topic: 'Budget Preparation', difficulty: 'medium', syllabusRef: '1.4',
    aiExplanation: '5,000 + 800 - 600 = 5,200 kg to purchase.',
    options: [{ text: '5,200 kg', correct: true, explanation: 'Correct!' },{ text: '5,400 kg', correct: false, explanation: 'Added opening.' },{ text: '4,800 kg', correct: false, explanation: 'Subtracted closing.' },{ text: '5,000 kg', correct: false, explanation: 'Ignores raw material inventory.' }] },
  { questionText: 'The principal budget factor (limiting factor) is:', topic: 'Budget Preparation', difficulty: 'easy', syllabusRef: '1.5',
    aiExplanation: 'The principal budget factor is the factor that limits the organisation\'s activities. Usually it is sales demand, but it could be: production capacity, labour availability, material supply, or finance. The budget process starts with this factor.',
    options: [{ text: 'The factor that limits the organisation\'s output', correct: true, explanation: 'Correct!' },{ text: 'The largest expense', correct: false, explanation: 'Not about size of expense.' },{ text: 'The CEO\'s preferred budget', correct: false, explanation: 'Not a personal preference.' },{ text: 'The depreciation method', correct: false, explanation: 'Unrelated.' }] },
  { questionText: 'A labour budget shows that 2,000 units need 3 hours each at £15/hour. Total labour cost?', topic: 'Budget Preparation', difficulty: 'easy', syllabusRef: '1.6',
    aiExplanation: 'Total hours = 2,000 × 3 = 6,000 hours. Total cost = 6,000 × £15 = £90,000.',
    options: [{ text: '£90,000', correct: true, explanation: 'Correct!' },{ text: '£30,000', correct: false, explanation: 'Only 2,000 × £15.' },{ text: '£45,000', correct: false, explanation: 'Only 3,000 hours.' },{ text: '£6,000', correct: false, explanation: 'Just the hours, not cost.' }] },
  { questionText: 'Top-down budgeting means:', topic: 'Budget Preparation', difficulty: 'easy', syllabusRef: '1.7',
    aiExplanation: 'Top-down (imposed): senior management sets budgets and passes them down. Quick but may lack buy-in. Bottom-up (participative): lower-level managers prepare budgets. Slower but more motivating and accurate.',
    options: [{ text: 'Senior management sets budgets for departments', correct: true, explanation: 'Correct!' },{ text: 'Department managers build their own budgets', correct: false, explanation: 'That is bottom-up/participative.' },{ text: 'Budgets are set by external auditors', correct: false, explanation: 'Auditors don\'t set budgets.' },{ text: 'No budgets are prepared', correct: false, explanation: 'Budgets are still prepared.' }] },
  { questionText: 'Which is an advantage of participative (bottom-up) budgeting?', topic: 'Budget Preparation', difficulty: 'medium', syllabusRef: '1.8',
    aiExplanation: 'Advantages: better motivation (managers feel ownership), more realistic (local knowledge), improved communication. Disadvantages: time-consuming, risk of budgetary slack (padding), may lack strategic alignment.',
    options: [{ text: 'Greater motivation and ownership', correct: true, explanation: 'Correct!' },{ text: 'Faster to prepare', correct: false, explanation: 'Bottom-up is slower.' },{ text: 'No risk of budget slack', correct: false, explanation: 'MORE risk of slack.' },{ text: 'No need for management approval', correct: false, explanation: 'Still needs approval.' }] },
  { questionText: 'Budget slack occurs when:', topic: 'Budget Preparation', difficulty: 'medium', syllabusRef: '1.9',
    aiExplanation: 'Budget slack: deliberately understating revenue or overstating costs to make targets easier to achieve. It is a risk in participative budgeting. Managers build in a "cushion" to ensure they meet or beat their budget.',
    options: [{ text: 'Managers deliberately understate revenue or overstate costs', correct: true, explanation: 'Correct!' },{ text: 'The budget is too tight', correct: false, explanation: 'Slack makes budgets too easy, not tight.' },{ text: 'Senior management imposes budgets', correct: false, explanation: 'That is top-down budgeting.' },{ text: 'Actual results exceed budget', correct: false, explanation: 'That is a favourable variance.' }] },
  { questionText: 'A rolling (continuous) budget is one that:', topic: 'Budget Preparation', difficulty: 'easy', syllabusRef: '1.10',
    aiExplanation: 'A rolling budget is continuously updated by adding a new period (e.g., month or quarter) as each period ends. This means there is always a full 12-month budget. It keeps the budget current and relevant.',
    options: [{ text: 'Is continuously updated by adding a new period as each one ends', correct: true, explanation: 'Correct!' },{ text: 'Never changes once set', correct: false, explanation: 'That is a fixed budget.' },{ text: 'Only covers 6 months', correct: false, explanation: 'Usually maintains 12 months.' },{ text: 'Is prepared once every 5 years', correct: false, explanation: 'Updated continuously.' }] },
  // --- Cash Budget (6) ---
  { questionText: 'A cash budget differs from a profit budget because:', topic: 'Cash Budget', difficulty: 'easy', syllabusRef: '2.1',
    aiExplanation: 'Cash budgets show actual cash inflows and outflows (timing of receipts and payments). Profit budgets use accruals basis (revenue when earned, expenses when incurred). Depreciation is in the profit budget but NOT the cash budget.',
    options: [{ text: 'It shows timing of cash receipts and payments, not accruals', correct: true, explanation: 'Correct!' },{ text: 'They are the same thing', correct: false, explanation: 'Different bases (cash vs accruals).' },{ text: 'Cash budgets include depreciation', correct: false, explanation: 'Depreciation is NOT cash.' },{ text: 'Cash budgets only show expenses', correct: false, explanation: 'Shows both receipts and payments.' }] },
  { questionText: 'Credit sales of £50,000 in Month 1. Customers pay 60% in the month of sale, 30% in Month 2, 10% in Month 3. Cash received in Month 2 from these sales?', topic: 'Cash Budget', difficulty: 'medium', syllabusRef: '2.2',
    aiExplanation: '30% of £50,000 = £15,000 received in Month 2.',
    options: [{ text: '£15,000', correct: true, explanation: 'Correct! 30% × £50,000.' },{ text: '£30,000', correct: false, explanation: 'That is 60% (Month 1 receipt).' },{ text: '£5,000', correct: false, explanation: 'That is 10% (Month 3 receipt).' },{ text: '£50,000', correct: false, explanation: 'Not all received in Month 2.' }] },
  { questionText: 'Which item appears in a cash budget but NOT in a budgeted P&L?', topic: 'Cash Budget', difficulty: 'medium', syllabusRef: '2.3',
    aiExplanation: 'Capital expenditure (buying non-current assets), loan repayments, and VAT payments appear in the cash budget but not the P&L. Depreciation appears in P&L but not the cash budget.',
    options: [{ text: 'Depreciation', correct: false, explanation: 'In P&L, NOT in cash budget.' },{ text: 'Purchase of a new machine', correct: true, explanation: 'Correct! Capital expenditure = cash outflow.' },{ text: 'Sales revenue', correct: false, explanation: 'Appears in both (as revenue or receipts).' },{ text: 'Wages expense', correct: false, explanation: 'Appears in both.' }] },
  { questionText: 'Opening cash £5,000. Receipts £45,000. Payments £52,000. Closing cash balance?', topic: 'Cash Budget', difficulty: 'easy', syllabusRef: '2.4',
    aiExplanation: 'Closing = Opening + Receipts - Payments = £5,000 + £45,000 - £52,000 = -£2,000 (overdrawn).',
    options: [{ text: '-£2,000 (overdrawn)', correct: true, explanation: 'Correct!' },{ text: '£2,000', correct: false, explanation: 'Negative — more payments than receipts.' },{ text: '-£7,000', correct: false, explanation: 'Check arithmetic.' },{ text: '£102,000', correct: false, explanation: 'Added all three.' }] },
  { questionText: 'A business expects a cash shortfall in 3 months. The cash budget helps by:', topic: 'Cash Budget', difficulty: 'easy', syllabusRef: '2.5',
    aiExplanation: 'The cash budget gives early warning of potential cash shortfalls, allowing management to arrange overdraft facilities, delay payments, chase receipts, or arrange additional finance in advance.',
    options: [{ text: 'Providing early warning to arrange finance in advance', correct: true, explanation: 'Correct!' },{ text: 'Automatically increasing sales', correct: false, explanation: 'Budgets don\'t change reality.' },{ text: 'Eliminating all business risk', correct: false, explanation: 'Helps manage risk, not eliminate it.' },{ text: 'Replacing the need for a bank account', correct: false, explanation: 'Still need a bank account.' }] },
  { questionText: 'VAT payments appear in the cash budget:', topic: 'Cash Budget', difficulty: 'medium', syllabusRef: '2.6',
    aiExplanation: 'VAT payments to HMRC are cash outflows appearing in the cash budget. They typically appear 1 month and 7 days after the quarter end. Receipts include VAT collected from customers; payments include VAT on purchases and the net payment to HMRC.',
    options: [{ text: 'In the month they are due to HMRC', correct: true, explanation: 'Correct!' },{ text: 'Spread evenly across the year', correct: false, explanation: 'Paid quarterly.' },{ text: 'Never — VAT is not a cash item', correct: false, explanation: 'VAT payments ARE cash.' },{ text: 'Only in the P&L', correct: false, explanation: 'VAT is a cash budget item.' }] },
  // --- Flexed Budgets (6) ---
  { questionText: 'A flexed budget adjusts the original budget for:', topic: 'Flexed Budgets', difficulty: 'easy', syllabusRef: '3.1',
    aiExplanation: 'A flexed budget recalculates the budget at the ACTUAL level of activity. Fixed budget = based on planned activity. Flexed budget = what the budget WOULD HAVE BEEN at the actual output. This allows meaningful comparison with actual results.',
    options: [{ text: 'The actual level of activity', correct: true, explanation: 'Correct!' },{ text: 'Inflation only', correct: false, explanation: 'Adjusted for activity level.' },{ text: 'Management preferences', correct: false, explanation: 'Based on actual output.' },{ text: 'Nothing — it is the same as the fixed budget', correct: false, explanation: 'Different — adjusted for activity.' }] },
  { questionText: 'Fixed budget: 1,000 units, variable costs £5/unit, fixed costs £3,000. Actual output 1,200 units. Flexed variable cost budget?', topic: 'Flexed Budgets', difficulty: 'medium', syllabusRef: '3.2',
    aiExplanation: 'Flexed variable costs = Actual units × Budget rate = 1,200 × £5 = £6,000. Fixed costs remain at £3,000 (they don\'t change with activity). Total flexed budget = £6,000 + £3,000 = £9,000.',
    options: [{ text: '£6,000', correct: true, explanation: 'Correct! 1,200 × £5.' },{ text: '£5,000', correct: false, explanation: 'That is the original fixed budget variable cost.' },{ text: '£9,000', correct: false, explanation: 'That is total flexed (variable + fixed).' },{ text: '£8,000', correct: false, explanation: 'Incorrect calculation.' }] },
  { questionText: 'In a flexed budget, fixed costs are:', topic: 'Flexed Budgets', difficulty: 'easy', syllabusRef: '3.3',
    aiExplanation: 'Fixed costs do NOT change with activity level. In a flexed budget, fixed costs remain the same as the original budget. Only variable costs are flexed (recalculated at actual activity).',
    options: [{ text: 'Adjusted for actual activity', correct: false, explanation: 'Only variable costs are adjusted.' },{ text: 'Kept at the original budgeted amount', correct: true, explanation: 'Correct!' },{ text: 'Doubled', correct: false, explanation: 'No reason to double.' },{ text: 'Eliminated', correct: false, explanation: 'Fixed costs still exist.' }] },
  { questionText: 'The purpose of flexing a budget is to:', topic: 'Flexed Budgets', difficulty: 'easy', syllabusRef: '3.4',
    aiExplanation: 'Flexing allows a fair comparison: comparing actual costs with what costs SHOULD HAVE BEEN at the actual activity level. Without flexing, variances mix volume effects with cost/efficiency effects.',
    options: [{ text: 'Enable fair comparison between budget and actual at the same activity level', correct: true, explanation: 'Correct!' },{ text: 'Increase the budget', correct: false, explanation: 'Not about increasing.' },{ text: 'Remove all variances', correct: false, explanation: 'Variances still exist after flexing.' },{ text: 'Eliminate fixed costs', correct: false, explanation: 'Fixed costs remain.' }] },
  { questionText: 'Original budget: Sales 500 units at £20 = £10,000. Actual: 600 units at £19 = £11,400. Flexed sales budget?', topic: 'Flexed Budgets', difficulty: 'medium', syllabusRef: '3.5',
    aiExplanation: 'Flexed sales = Actual units × Budget price = 600 × £20 = £12,000. Sales price variance = Actual revenue - Flexed = £11,400 - £12,000 = -£600 (adverse). Sales volume variance = Flexed - Original = £12,000 - £10,000 = +£2,000 (favourable).',
    options: [{ text: '£12,000', correct: true, explanation: 'Correct! 600 × £20.' },{ text: '£10,000', correct: false, explanation: 'Original fixed budget.' },{ text: '£11,400', correct: false, explanation: 'Actual revenue.' },{ text: '£9,500', correct: false, explanation: 'Incorrect calculation.' }] },
  { questionText: 'A volume variance arises from the difference between:', topic: 'Flexed Budgets', difficulty: 'medium', syllabusRef: '3.6',
    aiExplanation: 'Volume variance = Flexed budget - Original fixed budget. It isolates the effect of producing/selling MORE or FEWER units than planned. Expenditure (price/efficiency) variances = Actual - Flexed budget.',
    options: [{ text: 'Flexed budget and original fixed budget', correct: true, explanation: 'Correct!' },{ text: 'Actual and flexed budget', correct: false, explanation: 'That gives expenditure variances.' },{ text: 'Actual and original budget', correct: false, explanation: 'That gives total variance (volume + expenditure combined).' },{ text: 'Two different periods', correct: false, explanation: 'Same period, different activity levels.' }] },
  // --- Variance Analysis (10) ---
  { questionText: 'A favourable material price variance means:', topic: 'Variance Analysis', difficulty: 'easy', syllabusRef: '4.1',
    aiExplanation: 'Favourable price variance: actual price per unit of material was LESS than standard (budgeted) price. The business spent less than expected on materials.',
    options: [{ text: 'Materials cost less than the standard price', correct: true, explanation: 'Correct!' },{ text: 'More materials were used than expected', correct: false, explanation: 'That would be an adverse usage variance.' },{ text: 'Materials cost more than expected', correct: false, explanation: 'That would be adverse.' },{ text: 'No materials were purchased', correct: false, explanation: 'Materials were purchased at a lower price.' }] },
  { questionText: 'Material price variance = (Standard price - Actual price) × Actual quantity. Standard £5/kg, actual £5.50/kg, 2,000 kg used. Variance?', topic: 'Variance Analysis', difficulty: 'medium', syllabusRef: '4.2',
    aiExplanation: '(£5 - £5.50) × 2,000 = -£1,000 (adverse). The business paid £0.50/kg more than standard.',
    options: [{ text: '£1,000 adverse', correct: true, explanation: 'Correct!' },{ text: '£1,000 favourable', correct: false, explanation: 'Actual exceeds standard = adverse.' },{ text: '£500 adverse', correct: false, explanation: 'Used wrong quantity.' },{ text: '£2,000 adverse', correct: false, explanation: 'Wrong calculation.' }] },
  { questionText: 'Material usage variance = (Standard quantity - Actual quantity) × Standard price. Standard 2kg per unit, actual 2.3kg, 1,000 units made. Standard price £4/kg. Variance?', topic: 'Variance Analysis', difficulty: 'hard', syllabusRef: '4.3',
    aiExplanation: 'Standard qty for 1,000 units = 2,000kg. Actual = 2,300kg. Variance = (2,000-2,300) × £4 = -£1,200 (adverse). Used 300kg more than standard.',
    options: [{ text: '£1,200 adverse', correct: true, explanation: 'Correct! 300kg excess × £4.' },{ text: '£1,200 favourable', correct: false, explanation: 'Used MORE = adverse.' },{ text: '£300 adverse', correct: false, explanation: 'Must multiply by standard price.' },{ text: '£1,380 adverse', correct: false, explanation: 'Used actual price instead of standard.' }] },
  { questionText: 'Labour rate variance = (Standard rate - Actual rate) × Actual hours. Standard £12/hr, actual £11.50/hr, 3,000 hours. Variance?', topic: 'Variance Analysis', difficulty: 'medium', syllabusRef: '4.4',
    aiExplanation: '(£12 - £11.50) × 3,000 = £1,500 favourable. Paid less per hour than standard.',
    options: [{ text: '£1,500 favourable', correct: true, explanation: 'Correct!' },{ text: '£1,500 adverse', correct: false, explanation: 'Paid LESS = favourable.' },{ text: '£500 favourable', correct: false, explanation: 'Wrong calculation.' },{ text: '£36,000', correct: false, explanation: 'That is total actual labour cost.' }] },
  { questionText: 'Labour efficiency variance = (Standard hours - Actual hours) × Standard rate. Standard 2hrs/unit, 500 units made, 1,100 actual hours, £12/hr standard. Variance?', topic: 'Variance Analysis', difficulty: 'hard', syllabusRef: '4.5',
    aiExplanation: 'Standard hours = 500 × 2 = 1,000. Actual = 1,100. Variance = (1,000-1,100) × £12 = -£1,200 adverse. Took 100 hours more than standard.',
    options: [{ text: '£1,200 adverse', correct: true, explanation: 'Correct! 100 excess hours × £12.' },{ text: '£1,200 favourable', correct: false, explanation: 'Used MORE hours = adverse.' },{ text: '£100 adverse', correct: false, explanation: 'Must multiply by standard rate.' },{ text: '£1,320 adverse', correct: false, explanation: 'Used actual rate.' }] },
  { questionText: 'Fixed overhead expenditure variance = Budgeted fixed overhead - Actual fixed overhead. Budget £10,000, actual £10,800. Variance?', topic: 'Variance Analysis', difficulty: 'easy', syllabusRef: '4.6',
    aiExplanation: '£10,000 - £10,800 = -£800 adverse. Spent £800 more than budgeted on fixed overheads.',
    options: [{ text: '£800 adverse', correct: true, explanation: 'Correct!' },{ text: '£800 favourable', correct: false, explanation: 'Spent MORE = adverse.' },{ text: '£20,800', correct: false, explanation: 'Added both.' },{ text: '£10,800', correct: false, explanation: 'That is actual cost.' }] },
  { questionText: 'An adverse sales volume variance means:', topic: 'Variance Analysis', difficulty: 'easy', syllabusRef: '4.7',
    aiExplanation: 'Adverse sales volume: fewer units were sold than budgeted. This reduces revenue and profit below budget. Causes: lower demand, competition, supply issues.',
    options: [{ text: 'Fewer units sold than budgeted', correct: true, explanation: 'Correct!' },{ text: 'More units sold than budgeted', correct: false, explanation: 'That would be favourable.' },{ text: 'Selling price was higher', correct: false, explanation: 'That is a price variance.' },{ text: 'Materials cost more', correct: false, explanation: 'That is a material variance.' }] },
  { questionText: 'Which variance is most likely caused by using cheaper materials?', topic: 'Variance Analysis', difficulty: 'medium', syllabusRef: '4.8',
    aiExplanation: 'Cheaper materials = favourable material PRICE variance (paid less). But cheaper materials may be lower quality, causing more waste = adverse material USAGE variance. These variances are often interrelated.',
    options: [{ text: 'Favourable material price, possibly adverse material usage', correct: true, explanation: 'Correct! Trade-off between price and quality.' },{ text: 'Adverse material price', correct: false, explanation: 'Cheaper = favourable price.' },{ text: 'Favourable labour rate', correct: false, explanation: 'Material choice doesn\'t directly affect labour rate.' },{ text: 'No variances arise', correct: false, explanation: 'Significant variances would arise.' }] },
  { questionText: 'Standard costing is most suitable for:', topic: 'Standard Costing', difficulty: 'easy', syllabusRef: '5.1',
    aiExplanation: 'Standard costing works best in repetitive manufacturing where products are identical and processes are standardised. Less suitable for: bespoke products, service industries, rapidly changing environments.',
    options: [{ text: 'Repetitive manufacturing of identical products', correct: true, explanation: 'Correct!' },{ text: 'One-off construction projects', correct: false, explanation: 'Better suited to job costing.' },{ text: 'Professional services', correct: false, explanation: 'Difficult to set standards for bespoke services.' },{ text: 'Retail businesses', correct: false, explanation: 'Retail doesn\'t manufacture.' }] },
  { questionText: 'An ideal standard is one that:', topic: 'Standard Costing', difficulty: 'medium', syllabusRef: '5.2',
    aiExplanation: 'Ideal standard: assumes perfect conditions (no waste, no downtime, maximum efficiency). Rarely achievable — can be demotivating. Attainable standard: challenging but achievable with effort. Current standard: based on current performance. Basic standard: unchanged over long periods.',
    options: [{ text: 'Assumes perfect conditions with no inefficiency', correct: true, explanation: 'Correct!' },{ text: 'Is easily achievable by everyone', correct: false, explanation: 'That would be too easy — not ideal.' },{ text: 'Is based on last year\'s actual results', correct: false, explanation: 'That is a current or basic standard.' },{ text: 'Changes every month', correct: false, explanation: 'Standards are set for a period.' }] },
  // --- Budget Methodologies (8) ---
  { questionText: 'Incremental budgeting takes the previous year\'s budget and:', topic: 'Budget Methodologies', difficulty: 'easy', syllabusRef: '6.1',
    aiExplanation: 'Incremental: start with last year\'s budget, adjust for expected changes (inflation, growth, known changes). Quick and simple but may perpetuate inefficiencies and past errors.',
    options: [{ text: 'Adjusts it for expected changes', correct: true, explanation: 'Correct!' },{ text: 'Starts from zero', correct: false, explanation: 'That is zero-based budgeting.' },{ text: 'Uses activity levels to set costs', correct: false, explanation: 'That is activity-based budgeting.' },{ text: 'Ignores all previous data', correct: false, explanation: 'It explicitly uses last year as a base.' }] },
  { questionText: 'Zero-based budgeting (ZBB) requires:', topic: 'Budget Methodologies', difficulty: 'easy', syllabusRef: '6.2',
    aiExplanation: 'ZBB: every cost must be justified from scratch (zero base) each period. No assumption that last year\'s spending was appropriate. Forces managers to evaluate all activities. Time-consuming but eliminates waste.',
    options: [{ text: 'Every item to be justified from scratch each period', correct: true, explanation: 'Correct!' },{ text: 'Only new items to be justified', correct: false, explanation: 'ALL items, not just new ones.' },{ text: 'No budget at all', correct: false, explanation: 'Still produces a budget.' },{ text: 'The same budget every year', correct: false, explanation: 'Opposite — re-evaluates everything.' }] },
  { questionText: 'Activity-based budgeting (ABB) differs from traditional budgeting by:', topic: 'Budget Methodologies', difficulty: 'medium', syllabusRef: '6.3',
    aiExplanation: 'ABB uses cost drivers (activities) to build budgets. Instead of adjusting last year\'s overhead budget, it identifies activities, their cost drivers, and budgets costs based on expected activity volumes. More accurate for overhead-intensive businesses.',
    options: [{ text: 'Using cost drivers and activities to determine resource needs', correct: true, explanation: 'Correct!' },{ text: 'Starting from zero each year', correct: false, explanation: 'That is ZBB.' },{ text: 'Adding a percentage to last year', correct: false, explanation: 'That is incremental.' },{ text: 'Ignoring overheads', correct: false, explanation: 'ABB focuses on understanding overheads.' }] },
  { questionText: 'Which budgeting method is most likely to eliminate inefficiency?', topic: 'Budget Methodologies', difficulty: 'medium', syllabusRef: '6.4',
    aiExplanation: 'ZBB forces justification of all spending, so inefficient activities are more likely to be identified and eliminated. Incremental budgeting may perpetuate inefficiency.',
    options: [{ text: 'Zero-based budgeting', correct: true, explanation: 'Correct!' },{ text: 'Incremental budgeting', correct: false, explanation: 'May perpetuate past inefficiencies.' },{ text: 'Fixed budgeting', correct: false, explanation: 'Doesn\'t address efficiency.' },{ text: 'Rolling budgeting', correct: false, explanation: 'About timing, not efficiency review.' }] },
  // --- Performance Indicators (4) ---
  { questionText: 'A KPI (Key Performance Indicator) is:', topic: 'Performance Indicators', difficulty: 'easy', syllabusRef: '7.1',
    aiExplanation: 'A KPI is a measurable value that demonstrates how effectively an organisation is achieving key objectives. KPIs should be: Specific, Measurable, Achievable, Relevant, Time-bound (SMART).',
    options: [{ text: 'A measurable value showing achievement of objectives', correct: true, explanation: 'Correct!' },{ text: 'A type of financial statement', correct: false, explanation: 'Not a financial statement.' },{ text: 'A government regulation', correct: false, explanation: 'Not a regulation.' },{ text: 'A form of taxation', correct: false, explanation: 'Not related to tax.' }] },
  { questionText: 'Productivity is typically measured as:', topic: 'Performance Indicators', difficulty: 'easy', syllabusRef: '7.2',
    aiExplanation: 'Productivity = Output ÷ Input. Examples: units per labour hour, revenue per employee, orders per day. Higher productivity means more output from the same or fewer resources.',
    options: [{ text: 'Output ÷ Input', correct: true, explanation: 'Correct!' },{ text: 'Input ÷ Output', correct: false, explanation: 'Inverted — that is a resource usage rate.' },{ text: 'Revenue ÷ Profit', correct: false, explanation: 'Not a productivity measure.' },{ text: 'Cost ÷ Revenue', correct: false, explanation: 'That is a cost ratio.' }] },
  { questionText: 'Capacity utilisation = Actual output ÷ Maximum output × 100. Actual 8,000 units, maximum 10,000. Utilisation?', topic: 'Performance Indicators', difficulty: 'easy', syllabusRef: '7.3',
    aiExplanation: '(8,000 ÷ 10,000) × 100 = 80%. The business is using 80% of its capacity.',
    options: [{ text: '80%', correct: true, explanation: 'Correct!' },{ text: '125%', correct: false, explanation: 'Inverted.' },{ text: '20%', correct: false, explanation: 'That is unused capacity.' },{ text: '8,000%', correct: false, explanation: 'Incorrect calculation.' }] },
  { questionText: 'An efficiency ratio compares:', topic: 'Performance Indicators', difficulty: 'easy', syllabusRef: '7.4',
    aiExplanation: 'Efficiency ratio = Standard hours for actual output ÷ Actual hours × 100. Over 100% = efficient (work done in less time than standard). Under 100% = inefficient.',
    options: [{ text: 'Standard hours for actual output vs actual hours worked', correct: true, explanation: 'Correct!' },{ text: 'Actual profit vs budgeted profit', correct: false, explanation: 'That is profitability comparison.' },{ text: 'Current year vs prior year', correct: false, explanation: 'That is trend analysis.' },{ text: 'Revenue vs total assets', correct: false, explanation: 'That is asset turnover.' }] },
];

async function main() {
  console.log('\n🎓 Seeding L4 MABU...\n');
  await seedModule('MABU', MABU);
  console.log('\n✅ Done!');
}
main().catch(console.error).finally(() => prisma.$disconnect());
