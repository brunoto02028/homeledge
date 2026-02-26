/**
 * Level 4 MDCL — Management Accounting: Decision and Control (40 questions)
 * Run: npx tsx prisma/seed-questions-l4-mdcl.ts
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

const MDCL: QS[] = [
  // --- CVP Analysis (8) ---
  { questionText: 'Break-even point (units) is calculated as:', topic: 'CVP Analysis', difficulty: 'easy', syllabusRef: '1.1',
    aiExplanation: 'BEP (units) = Fixed costs ÷ Contribution per unit. Contribution = Selling price - Variable cost per unit. At BEP, total contribution exactly covers fixed costs, so profit = £0.',
    options: [{ text: 'Fixed costs ÷ Contribution per unit', correct: true, explanation: 'Correct!' },{ text: 'Fixed costs ÷ Selling price', correct: false, explanation: 'Must use contribution, not selling price.' },{ text: 'Variable costs ÷ Fixed costs', correct: false, explanation: 'Not the BEP formula.' },{ text: 'Total costs ÷ Number of units', correct: false, explanation: 'That gives average cost, not BEP.' }] },
  { questionText: 'Selling price £20, variable cost £12, fixed costs £24,000. Break-even units?', topic: 'CVP Analysis', difficulty: 'easy', syllabusRef: '1.2',
    aiExplanation: 'Contribution per unit = £20 - £12 = £8. BEP = £24,000 ÷ £8 = 3,000 units.',
    options: [{ text: '3,000 units', correct: true, explanation: 'Correct!' },{ text: '1,200 units', correct: false, explanation: '£24,000 ÷ £20 — used selling price.' },{ text: '2,000 units', correct: false, explanation: '£24,000 ÷ £12 — used variable cost.' },{ text: '4,000 units', correct: false, explanation: 'Incorrect calculation.' }] },
  { questionText: 'Contribution to sales (C/S) ratio = Contribution ÷ Sales × 100. If contribution is £8 and selling price is £20, C/S ratio?', topic: 'CVP Analysis', difficulty: 'easy', syllabusRef: '1.3',
    aiExplanation: '(£8 ÷ £20) × 100 = 40%. For every £1 of sales, 40p contributes to covering fixed costs and profit.',
    options: [{ text: '40%', correct: true, explanation: 'Correct!' },{ text: '60%', correct: false, explanation: 'That is the variable cost ratio.' },{ text: '250%', correct: false, explanation: 'Inverted calculation.' },{ text: '80%', correct: false, explanation: 'Incorrect.' }] },
  { questionText: 'Break-even revenue = Fixed costs ÷ C/S ratio. Fixed costs £24,000, C/S ratio 40%. BEP revenue?', topic: 'CVP Analysis', difficulty: 'medium', syllabusRef: '1.4',
    aiExplanation: '£24,000 ÷ 0.40 = £60,000. This matches: 3,000 units × £20 = £60,000.',
    options: [{ text: '£60,000', correct: true, explanation: 'Correct!' },{ text: '£9,600', correct: false, explanation: 'Multiplied instead of dividing.' },{ text: '£24,000', correct: false, explanation: 'That is just fixed costs.' },{ text: '£96,000', correct: false, explanation: 'Incorrect calculation.' }] },
  { questionText: 'Margin of safety = Budgeted sales - Break-even sales. Budget 4,000 units, BEP 3,000. Margin of safety?', topic: 'CVP Analysis', difficulty: 'easy', syllabusRef: '1.5',
    aiExplanation: '4,000 - 3,000 = 1,000 units (or 25% = 1,000/4,000 × 100). Sales can fall by 1,000 units before the business makes a loss.',
    options: [{ text: '1,000 units (25%)', correct: true, explanation: 'Correct!' },{ text: '3,000 units', correct: false, explanation: 'That is BEP.' },{ text: '7,000 units', correct: false, explanation: 'Added instead of subtracted.' },{ text: '4,000 units', correct: false, explanation: 'That is budgeted sales.' }] },
  { questionText: 'To achieve a target profit of £16,000 with the above data (contribution £8/unit, fixed costs £24,000), units needed?', topic: 'CVP Analysis', difficulty: 'medium', syllabusRef: '1.6',
    aiExplanation: 'Units for target profit = (Fixed costs + Target profit) ÷ Contribution per unit = (£24,000 + £16,000) ÷ £8 = 5,000 units.',
    options: [{ text: '5,000 units', correct: true, explanation: 'Correct!' },{ text: '2,000 units', correct: false, explanation: '£16,000 ÷ £8 — forgot fixed costs.' },{ text: '3,000 units', correct: false, explanation: 'That is just BEP.' },{ text: '40,000 units', correct: false, explanation: 'Incorrect calculation.' }] },
  { questionText: 'A multi-product company should use which measure for CVP analysis?', topic: 'CVP Analysis', difficulty: 'medium', syllabusRef: '1.7',
    aiExplanation: 'For multi-product businesses, use the weighted average C/S ratio (based on the sales mix) to calculate break-even REVENUE. Cannot easily calculate BEP in units unless the mix is constant.',
    options: [{ text: 'Weighted average C/S ratio', correct: true, explanation: 'Correct!' },{ text: 'Contribution per unit of one product', correct: false, explanation: 'Must consider all products.' },{ text: 'Total fixed costs only', correct: false, explanation: 'Need contribution information too.' },{ text: 'Sales volume of the most profitable product', correct: false, explanation: 'Must consider the whole mix.' }] },
  { questionText: 'On a break-even chart, the break-even point is where:', topic: 'CVP Analysis', difficulty: 'easy', syllabusRef: '1.8',
    aiExplanation: 'The break-even point is where the total cost line crosses the total revenue line. Below this point = loss area. Above = profit area.',
    options: [{ text: 'Total revenue line crosses total cost line', correct: true, explanation: 'Correct!' },{ text: 'Fixed cost line crosses variable cost line', correct: false, explanation: 'These don\'t determine BEP.' },{ text: 'Revenue equals zero', correct: false, explanation: 'BEP has positive revenue.' },{ text: 'Variable costs are zero', correct: false, explanation: 'Variable costs are never zero at BEP.' }] },
  // --- Limiting Factors (6) ---
  { questionText: 'When there is a single limiting factor, products should be ranked by:', topic: 'Limiting Factors', difficulty: 'medium', syllabusRef: '2.1',
    aiExplanation: 'Rank by contribution per unit of the limiting factor (e.g., contribution per machine hour, per kg of material). Produce the highest-ranked product first until demand is satisfied, then the next, etc.',
    options: [{ text: 'Contribution per unit of limiting factor', correct: true, explanation: 'Correct!' },{ text: 'Total contribution', correct: false, explanation: 'Must consider the scarce resource usage.' },{ text: 'Selling price', correct: false, explanation: 'Price alone doesn\'t indicate profitability per scarce resource.' },{ text: 'Variable cost per unit', correct: false, explanation: 'Must look at contribution relative to limiting factor.' }] },
  { questionText: 'Product A: contribution £10/unit, uses 2 machine hours. Product B: contribution £12/unit, uses 4 machine hours. Which is prioritised if machine hours are limited?', topic: 'Limiting Factors', difficulty: 'medium', syllabusRef: '2.2',
    aiExplanation: 'A: £10 ÷ 2 = £5/machine hour. B: £12 ÷ 4 = £3/machine hour. Product A gives more contribution per scarce resource, so A is prioritised.',
    options: [{ text: 'Product A (£5/machine hour vs £3/machine hour)', correct: true, explanation: 'Correct!' },{ text: 'Product B (higher total contribution)', correct: false, explanation: 'Must rank by contribution per limiting factor.' },{ text: 'Both equally', correct: false, explanation: 'A generates more per machine hour.' },{ text: 'Neither — stop production', correct: false, explanation: 'Both are profitable.' }] },
  { questionText: 'Shadow price (dual price) of a limiting factor is:', topic: 'Limiting Factors', difficulty: 'hard', syllabusRef: '2.3',
    aiExplanation: 'Shadow price = the maximum premium a business would pay above the normal price for one additional unit of the scarce resource. It equals the contribution lost by not having that resource. Used in linear programming.',
    options: [{ text: 'The maximum extra to pay for one more unit of scarce resource', correct: true, explanation: 'Correct!' },{ text: 'The selling price of the product', correct: false, explanation: 'Not the selling price.' },{ text: 'The fixed cost per unit', correct: false, explanation: 'Not related to fixed costs.' },{ text: 'The variable cost per unit', correct: false, explanation: 'Not the variable cost.' }] },
  { questionText: 'If there are multiple limiting factors, the technique used is:', topic: 'Limiting Factors', difficulty: 'medium', syllabusRef: '2.4',
    aiExplanation: 'Multiple constraints require linear programming. The objective function (maximise contribution) is subject to constraints (resource limitations). Graphical method for 2 products; simplex method for more.',
    options: [{ text: 'Linear programming', correct: true, explanation: 'Correct!' },{ text: 'Simple ranking', correct: false, explanation: 'Only works for one limiting factor.' },{ text: 'Break-even analysis', correct: false, explanation: 'BEP doesn\'t handle multiple constraints.' },{ text: 'Absorption costing', correct: false, explanation: 'Not a decision-making technique for constraints.' }] },
  // --- Make vs Buy (4) ---
  { questionText: 'A make vs buy decision should be based on:', topic: 'Make vs Buy Decisions', difficulty: 'easy', syllabusRef: '3.1',
    aiExplanation: 'Compare relevant costs only. If buying: purchase price + any additional costs. If making: variable costs + any avoidable fixed costs. Irrelevant: sunk costs, committed costs, non-cash items like depreciation on existing equipment.',
    options: [{ text: 'Relevant costs only (avoidable costs vs buy price)', correct: true, explanation: 'Correct!' },{ text: 'Total absorption cost vs buy price', correct: false, explanation: 'Absorption cost includes unavoidable overheads.' },{ text: 'Selling price vs buy price', correct: false, explanation: 'Selling price is irrelevant to make/buy.' },{ text: 'Historical cost vs current cost', correct: false, explanation: 'Historical costs are sunk.' }] },
  { questionText: 'A component costs £15 to make (variable £10 + allocated fixed £5). Buy price is £12. Should the company buy?', topic: 'Make vs Buy Decisions', difficulty: 'medium', syllabusRef: '3.2',
    aiExplanation: 'Relevant make cost = £10 (variable only, assuming fixed costs are unavoidable). Buy cost = £12. Make is cheaper by £2/unit. The allocated fixed cost of £5 is irrelevant if it cannot be avoided.',
    options: [{ text: 'No — make at £10 variable cost is cheaper than buying at £12', correct: true, explanation: 'Correct! Only variable costs are relevant.' },{ text: 'Yes — buy at £12 is cheaper than total cost of £15', correct: false, explanation: 'Fixed costs are unavoidable so irrelevant.' },{ text: 'Yes — always cheaper to outsource', correct: false, explanation: 'Must compare relevant costs.' },{ text: 'Cannot be determined', correct: false, explanation: 'Relevant cost comparison gives a clear answer.' }] },
  { questionText: 'Qualitative factors in a make vs buy decision include:', topic: 'Make vs Buy Decisions', difficulty: 'easy', syllabusRef: '3.3',
    aiExplanation: 'Non-financial factors: quality control, reliability of supplier, confidentiality of designs, employee morale (redundancies), flexibility, lead times, dependence on external supplier.',
    options: [{ text: 'Quality, reliability, and employee morale', correct: true, explanation: 'Correct!' },{ text: 'Variable cost per unit only', correct: false, explanation: 'That is a quantitative factor.' },{ text: 'The break-even point', correct: false, explanation: 'BEP is quantitative.' },{ text: 'Tax implications only', correct: false, explanation: 'One factor among many.' }] },
  { questionText: 'Opportunity cost in decision-making is:', topic: 'Make vs Buy Decisions', difficulty: 'medium', syllabusRef: '3.4',
    aiExplanation: 'Opportunity cost = the benefit forgone by choosing one option over the next best alternative. It IS a relevant cost for decision-making even though it is not a cash flow. Example: if making a component ties up machine time, the lost contribution from other products is an opportunity cost.',
    options: [{ text: 'The benefit forgone from the next best alternative', correct: true, explanation: 'Correct!' },{ text: 'The original cost of an asset', correct: false, explanation: 'That is historical/sunk cost.' },{ text: 'The cost of replacing an asset', correct: false, explanation: 'That is replacement cost.' },{ text: 'A cost that has already been incurred', correct: false, explanation: 'That is a sunk cost.' }] },
  // --- Pricing Strategies (6) ---
  { questionText: 'Cost-plus pricing sets the price by:', topic: 'Pricing Strategies', difficulty: 'easy', syllabusRef: '4.1',
    aiExplanation: 'Cost-plus: calculate the full cost per unit, then add a markup percentage for profit. Simple but ignores demand and competition. Common in manufacturing and contracting.',
    options: [{ text: 'Adding a profit markup to total cost', correct: true, explanation: 'Correct!' },{ text: 'Matching competitor prices', correct: false, explanation: 'That is competitive pricing.' },{ text: 'Setting the highest possible price', correct: false, explanation: 'That is price skimming.' },{ text: 'Setting the lowest possible price', correct: false, explanation: 'That is penetration pricing.' }] },
  { questionText: 'Penetration pricing involves:', topic: 'Pricing Strategies', difficulty: 'easy', syllabusRef: '4.2',
    aiExplanation: 'Penetration: set a low initial price to gain market share quickly, then raise prices once established. Suitable for price-sensitive markets with potential for economies of scale.',
    options: [{ text: 'Setting a low price initially to gain market share', correct: true, explanation: 'Correct!' },{ text: 'Setting a high initial price', correct: false, explanation: 'That is price skimming.' },{ text: 'Matching competitor prices exactly', correct: false, explanation: 'That is competitive pricing.' },{ text: 'Giving products away free', correct: false, explanation: 'Price is low but not zero.' }] },
  { questionText: 'Price skimming involves:', topic: 'Pricing Strategies', difficulty: 'easy', syllabusRef: '4.3',
    aiExplanation: 'Skimming: set a high initial price to maximize profit from early adopters, then reduce over time. Works for innovative/unique products with few competitors initially (e.g., new technology).',
    options: [{ text: 'Setting a high initial price and reducing it over time', correct: true, explanation: 'Correct!' },{ text: 'Keeping prices constant', correct: false, explanation: 'Prices decrease over time with skimming.' },{ text: 'Setting the lowest market price', correct: false, explanation: 'That is penetration.' },{ text: 'Pricing based on costs only', correct: false, explanation: 'That is cost-plus.' }] },
  { questionText: 'Marginal cost-plus pricing uses which cost base?', topic: 'Pricing Strategies', difficulty: 'medium', syllabusRef: '4.4',
    aiExplanation: 'Marginal cost-plus: mark up the variable (marginal) cost. The markup must cover fixed costs and profit. Useful for: special orders, competitive bidding, spare capacity utilization. Minimum price in short term = variable cost.',
    options: [{ text: 'Variable (marginal) cost per unit', correct: true, explanation: 'Correct!' },{ text: 'Full absorption cost', correct: false, explanation: 'That is full cost-plus.' },{ text: 'Fixed costs only', correct: false, explanation: 'Variable costs are the base.' },{ text: 'Competitor\'s price', correct: false, explanation: 'That is competitive pricing.' }] },
  { questionText: 'Target costing works by:', topic: 'Pricing Strategies', difficulty: 'medium', syllabusRef: '4.5',
    aiExplanation: 'Target costing: Start with the market price, deduct required profit margin, giving the target cost. The product must then be designed to meet this cost. Formula: Target cost = Market price - Required profit.',
    options: [{ text: 'Starting with market price, deducting profit, to find target cost', correct: true, explanation: 'Correct!' },{ text: 'Adding profit to actual cost', correct: false, explanation: 'That is cost-plus.' },{ text: 'Ignoring costs entirely', correct: false, explanation: 'Cost is the target to achieve.' },{ text: 'Setting price equal to variable cost', correct: false, explanation: 'Would make no profit.' }] },
  { questionText: 'A special order should be accepted if the price covers at least:', topic: 'Pricing Strategies', difficulty: 'medium', syllabusRef: '4.6',
    aiExplanation: 'Minimum price for a special order (when spare capacity exists) = Variable/marginal cost. Any price above variable cost makes a contribution to fixed costs. Only if the order doesn\'t affect regular sales.',
    options: [{ text: 'The variable (marginal) cost', correct: true, explanation: 'Correct! Assuming spare capacity.' },{ text: 'The full absorption cost', correct: false, explanation: 'Not necessary if spare capacity exists.' },{ text: 'The normal selling price', correct: false, explanation: 'Special orders can be below normal price.' },{ text: 'Fixed costs per unit', correct: false, explanation: 'Fixed costs are already being covered by regular sales.' }] },
  // --- Investment Appraisal (10) ---
  { questionText: 'Payback period measures:', topic: 'Investment Appraisal (NPV, IRR, Payback)', difficulty: 'easy', syllabusRef: '5.1',
    aiExplanation: 'Payback = the time it takes for cumulative cash inflows to equal the initial investment. Shorter payback = less risk. Limitations: ignores cash flows after payback, ignores time value of money.',
    options: [{ text: 'Time to recover the initial investment', correct: true, explanation: 'Correct!' },{ text: 'Total profit over the project life', correct: false, explanation: 'Payback is about cash recovery time.' },{ text: 'Return on investment percentage', correct: false, explanation: 'That is ROI/ARR.' },{ text: 'Net present value', correct: false, explanation: 'NPV is a different technique.' }] },
  { questionText: 'Investment £100,000. Annual cash inflows: Y1 £30,000, Y2 £40,000, Y3 £50,000, Y4 £40,000. Payback period?', topic: 'Investment Appraisal (NPV, IRR, Payback)', difficulty: 'medium', syllabusRef: '5.2',
    aiExplanation: 'Cumulative: Y1 £30k, Y2 £70k, Y3 £120k. Payback between Y2 and Y3. Remaining after Y2 = £100k-£70k = £30k. Y3 inflow = £50k. Payback = 2 + (£30k/£50k) = 2.6 years.',
    options: [{ text: '2.6 years', correct: true, explanation: 'Correct!' },{ text: '3 years', correct: false, explanation: 'Recovered before end of Y3.' },{ text: '2 years', correct: false, explanation: 'Only £70k recovered by Y2.' },{ text: '2.75 years', correct: false, explanation: 'Incorrect fraction.' }] },
  { questionText: 'Net Present Value (NPV) is calculated by:', topic: 'Investment Appraisal (NPV, IRR, Payback)', difficulty: 'easy', syllabusRef: '5.3',
    aiExplanation: 'NPV = Sum of discounted future cash flows - Initial investment. Each future cash flow is discounted to present value using the cost of capital. Positive NPV = project adds value. Negative NPV = reject.',
    options: [{ text: 'Discounting future cash flows and subtracting the initial investment', correct: true, explanation: 'Correct!' },{ text: 'Adding all future cash flows without discounting', correct: false, explanation: 'Must discount for time value of money.' },{ text: 'Dividing profit by investment', correct: false, explanation: 'That is ARR/ROI.' },{ text: 'Comparing payback periods', correct: false, explanation: 'Payback is a different technique.' }] },
  { questionText: 'A project with a positive NPV should be:', topic: 'Investment Appraisal (NPV, IRR, Payback)', difficulty: 'easy', syllabusRef: '5.4',
    aiExplanation: 'Positive NPV means the project generates returns above the cost of capital — it adds value to the business. Accept. Zero NPV = indifferent. Negative NPV = reject (unless non-financial factors override).',
    options: [{ text: 'Accepted — it adds value', correct: true, explanation: 'Correct!' },{ text: 'Rejected', correct: false, explanation: 'Positive NPV should be accepted.' },{ text: 'Delayed for 5 years', correct: false, explanation: 'No reason to delay a value-adding project.' },{ text: 'Ignored', correct: false, explanation: 'Should not be ignored.' }] },
  { questionText: 'Internal Rate of Return (IRR) is:', topic: 'Investment Appraisal (NPV, IRR, Payback)', difficulty: 'medium', syllabusRef: '5.5',
    aiExplanation: 'IRR = the discount rate that makes NPV exactly zero. If IRR > cost of capital, accept. If IRR < cost of capital, reject. Found by interpolation between a positive and negative NPV.',
    options: [{ text: 'The discount rate giving NPV of zero', correct: true, explanation: 'Correct!' },{ text: 'The return on the bank account', correct: false, explanation: 'IRR is project-specific.' },{ text: 'The inflation rate', correct: false, explanation: 'Not inflation.' },{ text: 'The payback period as a percentage', correct: false, explanation: 'Not related to payback.' }] },
  { questionText: 'A project has NPV of +£5,000 at 10% and -£2,000 at 15%. Approximate IRR?', topic: 'Investment Appraisal (NPV, IRR, Payback)', difficulty: 'hard', syllabusRef: '5.6',
    aiExplanation: 'IRR ≈ Lower rate + (NPV at lower rate ÷ (NPV at lower - NPV at higher)) × (Higher rate - Lower rate) = 10% + (5,000 ÷ (5,000+2,000)) × 5% = 10% + (5/7 × 5%) = 10% + 3.57% ≈ 13.6%.',
    options: [{ text: 'Approximately 13.6%', correct: true, explanation: 'Correct! Interpolation formula.' },{ text: '12.5%', correct: false, explanation: 'Simple average, not interpolation.' },{ text: '10%', correct: false, explanation: 'NPV is positive at 10%, so IRR is higher.' },{ text: '15%', correct: false, explanation: 'NPV is negative at 15%, so IRR is lower.' }] },
  { questionText: 'The discount factor for £1 received in 3 years at 10% is:', topic: 'Investment Appraisal (NPV, IRR, Payback)', difficulty: 'medium', syllabusRef: '5.7',
    aiExplanation: 'Discount factor = 1/(1+r)^n = 1/(1.10)^3 = 1/1.331 = 0.751 (from discount tables). £1 received in 3 years is worth 75.1p today at 10%.',
    options: [{ text: '0.751', correct: true, explanation: 'Correct!' },{ text: '1.331', correct: false, explanation: 'That is the compound factor, not discount.' },{ text: '0.909', correct: false, explanation: 'That is year 1 factor.' },{ text: '0.826', correct: false, explanation: 'That is year 2 factor.' }] },
  { questionText: 'Accounting Rate of Return (ARR) is:', topic: 'Investment Appraisal (NPV, IRR, Payback)', difficulty: 'easy', syllabusRef: '5.8',
    aiExplanation: 'ARR = Average annual profit ÷ Average investment × 100. Average investment = (Initial + Residual) ÷ 2. Uses profit (not cash flows) and ignores time value of money.',
    options: [{ text: 'Average annual profit ÷ Average investment × 100', correct: true, explanation: 'Correct!' },{ text: 'Total cash flow ÷ Investment', correct: false, explanation: 'ARR uses profit, not cash.' },{ text: 'NPV ÷ Investment', correct: false, explanation: 'Not the ARR formula.' },{ text: 'IRR minus cost of capital', correct: false, explanation: 'Not related.' }] },
  { questionText: 'Which appraisal method is theoretically the best?', topic: 'Investment Appraisal (NPV, IRR, Payback)', difficulty: 'easy', syllabusRef: '5.9',
    aiExplanation: 'NPV is theoretically superior because it: considers all cash flows, accounts for time value of money, directly measures value added in £, and gives consistent rankings for mutually exclusive projects.',
    options: [{ text: 'NPV', correct: true, explanation: 'Correct!' },{ text: 'Payback', correct: false, explanation: 'Ignores cash flows after payback and time value.' },{ text: 'ARR', correct: false, explanation: 'Uses profit not cash, ignores time value.' },{ text: 'All are equally good', correct: false, explanation: 'NPV is theoretically best.' }] },
  { questionText: 'The cost of capital used in NPV calculations represents:', topic: 'Investment Appraisal (NPV, IRR, Payback)', difficulty: 'medium', syllabusRef: '5.10',
    aiExplanation: 'The cost of capital is the minimum required rate of return — the rate needed to satisfy investors (shareholders and lenders). It reflects the risk of the project and the cost of financing.',
    options: [{ text: 'The minimum required rate of return for investors', correct: true, explanation: 'Correct!' },{ text: 'The bank interest rate', correct: false, explanation: 'May be part of it but not the whole cost of capital.' },{ text: 'The inflation rate', correct: false, explanation: 'Inflation is separate.' },{ text: 'The tax rate', correct: false, explanation: 'Tax affects cash flows but is not the cost of capital.' }] },
  // --- ABC & Balanced Scorecard (6) ---
  { questionText: 'Activity-Based Costing (ABC) differs from traditional absorption by:', topic: 'Activity-Based Costing', difficulty: 'medium', syllabusRef: '6.1',
    aiExplanation: 'ABC uses multiple cost drivers to allocate overheads based on activities (e.g., number of setups, inspections, orders). Traditional uses one or two bases (labour/machine hours). ABC gives more accurate product costs for complex businesses with diverse products.',
    options: [{ text: 'Using multiple cost drivers linked to activities', correct: true, explanation: 'Correct!' },{ text: 'Ignoring overheads completely', correct: false, explanation: 'ABC allocates overheads more precisely.' },{ text: 'Using only direct costs', correct: false, explanation: 'ABC includes overheads.' },{ text: 'Being simpler to implement', correct: false, explanation: 'ABC is more complex.' }] },
  { questionText: 'A cost driver in ABC is:', topic: 'Activity-Based Costing', difficulty: 'easy', syllabusRef: '6.2',
    aiExplanation: 'A cost driver is the factor that causes an activity\'s costs to change. Examples: number of machine setups, purchase orders, inspections, customer orders. Each activity has its own cost driver and cost pool.',
    options: [{ text: 'The factor that causes an activity\'s cost to change', correct: true, explanation: 'Correct!' },{ text: 'The total fixed cost', correct: false, explanation: 'Not a cost driver.' },{ text: 'The selling price', correct: false, explanation: 'Selling price is not a cost driver.' },{ text: 'The budget figure', correct: false, explanation: 'Not a cost driver.' }] },
  { questionText: 'The Balanced Scorecard has four perspectives:', topic: 'Balanced Scorecard', difficulty: 'easy', syllabusRef: '7.1',
    aiExplanation: 'The four BSC perspectives: (1) Financial (shareholder view — profitability, growth), (2) Customer (satisfaction, retention, market share), (3) Internal Business Process (efficiency, quality, innovation), (4) Learning and Growth (employee skills, culture, technology).',
    options: [{ text: 'Financial, Customer, Internal Process, Learning & Growth', correct: true, explanation: 'Correct!' },{ text: 'Revenue, Cost, Profit, Cash', correct: false, explanation: 'All financial measures only.' },{ text: 'Past, Present, Future, External', correct: false, explanation: 'Not the BSC perspectives.' },{ text: 'Sales, Production, Marketing, HR', correct: false, explanation: 'Departmental, not BSC perspectives.' }] },
  { questionText: 'An example of a customer perspective KPI is:', topic: 'Balanced Scorecard', difficulty: 'easy', syllabusRef: '7.2',
    aiExplanation: 'Customer perspective: customer satisfaction scores, customer retention rate, number of complaints, on-time delivery percentage, market share.',
    options: [{ text: 'Customer satisfaction score', correct: true, explanation: 'Correct!' },{ text: 'Return on capital employed', correct: false, explanation: 'Financial perspective.' },{ text: 'Employee turnover rate', correct: false, explanation: 'Learning & growth perspective.' },{ text: 'Defect rate', correct: false, explanation: 'Internal process perspective.' }] },
  { questionText: 'Life cycle costing considers costs over:', topic: 'Life Cycle Costing', difficulty: 'easy', syllabusRef: '8.1',
    aiExplanation: 'Life cycle costing considers ALL costs from inception to disposal: research, development, production, marketing, distribution, customer service, and disposal/decommissioning. Traditional costing only looks at production costs.',
    options: [{ text: 'The entire life of a product from development to disposal', correct: true, explanation: 'Correct!' },{ text: 'One accounting period only', correct: false, explanation: 'That is traditional period costing.' },{ text: 'The manufacturing stage only', correct: false, explanation: 'Includes all stages.' },{ text: 'The selling period only', correct: false, explanation: 'Includes before and after selling.' }] },
  { questionText: 'The main advantage of life cycle costing is:', topic: 'Life Cycle Costing', difficulty: 'medium', syllabusRef: '8.2',
    aiExplanation: 'Advantage: identifies total cost commitment early (80-90% of costs are committed at the design stage). This enables better pricing decisions and cost management. Helps identify whether a product will be profitable over its entire life.',
    options: [{ text: 'Early identification of total cost commitment for better decisions', correct: true, explanation: 'Correct!' },{ text: 'Simpler calculations', correct: false, explanation: 'Actually more complex.' },{ text: 'Focuses only on production', correct: false, explanation: 'Looks at all stages.' },{ text: 'Eliminates all costs', correct: false, explanation: 'Identifies and manages costs, not eliminates.' }] },
];

async function main() {
  console.log('\n🎓 Seeding L4 MDCL...\n');
  await seedModule('MDCL', MDCL);
  console.log('\n✅ Done!');
}
main().catch(console.error).finally(() => prisma.$disconnect());
