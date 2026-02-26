/**
 * Level 2 ELCO — Elements of Costing (40 questions)
 * Run: npx tsx prisma/seed-questions-l2-elco.ts
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

const ELCO: QS[] = [
  // --- Cost Classification (10) ---
  { questionText: 'Which of the following is a direct cost?', topic: 'Cost Classification', difficulty: 'easy', syllabusRef: '1.1',
    aiExplanation: 'Direct costs can be traced directly to a specific cost unit (product). Examples: raw materials, direct labour, direct expenses. Indirect costs (overheads) cannot be traced to a specific unit.',
    options: [{ text: 'Factory rent', correct: false, explanation: 'Rent is an indirect cost — it benefits the whole factory, not one product.' },{ text: 'Raw materials used in production', correct: true, explanation: 'Correct! Raw materials are directly traceable to products.' },{ text: 'Office stationery', correct: false, explanation: 'Admin cost — indirect.' },{ text: 'Factory manager salary', correct: false, explanation: 'Indirect — supervises all production.' }] },
  { questionText: 'Factory rent, factory heating, and machine depreciation are all examples of:', topic: 'Cost Classification', difficulty: 'easy', syllabusRef: '1.2',
    aiExplanation: 'These are all production overheads (indirect production costs). They relate to the factory but cannot be traced to individual products. They are absorbed into product costs using overhead absorption rates.',
    options: [{ text: 'Direct costs', correct: false, explanation: 'Cannot be traced to individual products.' },{ text: 'Production overheads', correct: true, explanation: 'Correct! Indirect production costs.' },{ text: 'Selling costs', correct: false, explanation: 'These relate to production, not selling.' },{ text: 'Administration costs', correct: false, explanation: 'These are factory costs, not admin.' }] },
  { questionText: 'The wages of a machine operator who works on multiple products are classified as:', topic: 'Cost Classification', difficulty: 'medium', syllabusRef: '1.3',
    aiExplanation: 'If a worker can be identified with specific products (and their time is tracked), their wages are direct labour. If they work across many products without specific tracking, they may be treated as indirect. However, machine operators whose time IS allocated to products are typically direct labour.',
    options: [{ text: 'Direct labour', correct: true, explanation: 'Correct! Machine operators are typically direct labour if time is allocated to products.' },{ text: 'Indirect labour', correct: false, explanation: 'Only if time cannot be allocated to specific products.' },{ text: 'Administration cost', correct: false, explanation: 'Production workers are not admin.' },{ text: 'Selling cost', correct: false, explanation: 'Production workers are not selling costs.' }] },
  { questionText: 'Which cost behaviour describes a cost that stays the same in total regardless of output?', topic: 'Cost Classification', difficulty: 'easy', syllabusRef: '1.4',
    aiExplanation: 'Fixed costs remain constant in total regardless of activity level (within the relevant range). Examples: rent, insurance, depreciation (straight-line). Per unit, fixed costs decrease as output increases.',
    options: [{ text: 'Variable cost', correct: false, explanation: 'Variable costs change with output.' },{ text: 'Fixed cost', correct: true, explanation: 'Correct! Total stays the same.' },{ text: 'Semi-variable cost', correct: false, explanation: 'Has both fixed and variable elements.' },{ text: 'Stepped cost', correct: false, explanation: 'Fixed within a range, then jumps.' }] },
  { questionText: 'Raw material costs increase from £5,000 at 1,000 units to £10,000 at 2,000 units. This is a:', topic: 'Cost Classification', difficulty: 'easy', syllabusRef: '1.5',
    aiExplanation: 'The cost doubles when output doubles — it increases in direct proportion to activity. Cost per unit stays at £5. This is a variable cost.',
    options: [{ text: 'Fixed cost', correct: false, explanation: 'Fixed costs don\'t change with output.' },{ text: 'Variable cost', correct: true, explanation: 'Correct! £5 per unit at all levels.' },{ text: 'Semi-variable cost', correct: false, explanation: 'No fixed element — purely variable.' },{ text: 'Stepped cost', correct: false, explanation: 'Increases smoothly, not in steps.' }] },
  { questionText: 'A telephone bill has a £30 monthly line rental plus 5p per minute. This is a:', topic: 'Cost Classification', difficulty: 'easy', syllabusRef: '1.6',
    aiExplanation: 'Semi-variable (or mixed) costs have both a fixed element (£30 line rental) and a variable element (5p per minute). Total cost = Fixed + (Variable rate × Activity).',
    options: [{ text: 'Fixed cost', correct: false, explanation: 'Has a variable element too.' },{ text: 'Variable cost', correct: false, explanation: 'Has a fixed element too.' },{ text: 'Semi-variable cost', correct: true, explanation: 'Correct! Fixed £30 + variable per minute.' },{ text: 'Stepped cost', correct: false, explanation: 'Doesn\'t jump in steps.' }] },
  { questionText: 'A supervisor is needed for every 20 workers. As production grows, this cost is:', topic: 'Cost Classification', difficulty: 'medium', syllabusRef: '1.7',
    aiExplanation: 'A stepped (or step-fixed) cost is fixed within a range of activity but increases by a fixed amount when activity moves to the next range. One supervisor for 1-20 workers, two for 21-40, etc.',
    options: [{ text: 'Variable', correct: false, explanation: 'Doesn\'t increase smoothly with each unit.' },{ text: 'Fixed', correct: false, explanation: 'It does increase, just in steps.' },{ text: 'Stepped', correct: true, explanation: 'Correct! Fixed within a range, then jumps.' },{ text: 'Semi-variable', correct: false, explanation: 'No variable-per-unit element.' }] },
  { questionText: 'Which of the following is a period cost, not a product cost?', topic: 'Cost Classification', difficulty: 'medium', syllabusRef: '1.8',
    aiExplanation: 'Product costs are included in inventory valuation (materials, labour, production overheads). Period costs are charged to the period in which they are incurred (admin costs, selling costs, distribution costs). They are not included in inventory.',
    options: [{ text: 'Direct materials', correct: false, explanation: 'Product cost — included in inventory.' },{ text: 'Direct labour', correct: false, explanation: 'Product cost.' },{ text: 'Production overheads', correct: false, explanation: 'Product cost — absorbed into inventory.' },{ text: 'Office rent for the admin department', correct: true, explanation: 'Correct! Admin cost = period cost.' }] },
  { questionText: 'Materials, labour, and overheads are the three elements of:', topic: 'Cost Classification', difficulty: 'easy', syllabusRef: '1.9',
    aiExplanation: 'The three elements of cost are Materials, Labour, and Overheads (expenses). Each can be direct or indirect. Direct materials + Direct labour + Direct expenses = Prime cost. Prime cost + Production overheads = Production cost.',
    options: [{ text: 'The trial balance', correct: false, explanation: 'TB contains all accounts.' },{ text: 'Total cost', correct: true, explanation: 'Correct! The three elements of cost.' },{ text: 'The bank reconciliation', correct: false, explanation: 'Unrelated.' },{ text: 'The VAT return', correct: false, explanation: 'Unrelated.' }] },
  { questionText: 'Prime cost consists of:', topic: 'Cost Classification', difficulty: 'easy', syllabusRef: '1.10',
    aiExplanation: 'Prime cost = Direct materials + Direct labour + Direct expenses. It represents all costs directly traceable to the product. Adding production overheads gives the full production cost.',
    options: [{ text: 'All production costs', correct: false, explanation: 'That is production cost (prime + overheads).' },{ text: 'Direct materials + direct labour + direct expenses', correct: true, explanation: 'Correct!' },{ text: 'Fixed costs only', correct: false, explanation: 'Prime cost includes variable direct costs.' },{ text: 'Overheads only', correct: false, explanation: 'Overheads are excluded from prime cost.' }] },
  // --- Materials Costing (8) ---
  { questionText: 'A business uses FIFO for inventory valuation. Opening stock: 100 units at £5. Purchase: 200 units at £6. It sells 150 units. What is the cost of goods sold?', topic: 'Materials Costing', difficulty: 'medium', syllabusRef: '2.1',
    aiExplanation: 'FIFO (First In, First Out) issues the oldest stock first. Sell 150: first 100 at £5 = £500, then 50 at £6 = £300. Total COGS = £800. Remaining: 150 units at £6 = £900.',
    options: [{ text: '£800', correct: true, explanation: 'Correct! 100×£5 + 50×£6 = £500+£300 = £800.' },{ text: '£750', correct: false, explanation: 'Would be 150×£5, but only 100 units at £5.' },{ text: '£900', correct: false, explanation: 'Would be 150×£6, but FIFO uses oldest first.' },{ text: '£825', correct: false, explanation: 'This is a weighted average, not FIFO.' }] },
  { questionText: 'Using LIFO, opening stock: 80 units at £4, purchase: 120 units at £5. Sell 100 units. COGS?', topic: 'Materials Costing', difficulty: 'medium', syllabusRef: '2.2',
    aiExplanation: 'LIFO (Last In, First Out) issues newest stock first. Sell 100: first 120 at £5 (take 100) = £500. Total COGS = £500. Note: LIFO is not permitted under IAS 2 but may still be tested.',
    options: [{ text: '£500', correct: true, explanation: 'Correct! All 100 from the £5 batch.' },{ text: '£400', correct: false, explanation: 'Would be 100×£4 (FIFO, not LIFO).' },{ text: '£450', correct: false, explanation: 'Weighted average, not LIFO.' },{ text: '£480', correct: false, explanation: 'Incorrect calculation.' }] },
  { questionText: 'Weighted average cost: Opening 200 units at £3, purchase 300 units at £4. What is the average cost per unit?', topic: 'Materials Costing', difficulty: 'medium', syllabusRef: '2.3',
    aiExplanation: 'AVCO = Total cost ÷ Total units = (200×£3 + 300×£4) ÷ (200+300) = (£600+£1,200) ÷ 500 = £1,800 ÷ 500 = £3.60 per unit.',
    options: [{ text: '£3.50', correct: false, explanation: 'Simple average of £3 and £4, not weighted.' },{ text: '£3.60', correct: true, explanation: 'Correct! £1,800 ÷ 500 = £3.60.' },{ text: '£4.00', correct: false, explanation: 'Only the purchase price, ignoring opening stock.' },{ text: '£3.00', correct: false, explanation: 'Only the opening price.' }] },
  { questionText: 'Which inventory valuation method is required by IAS 2?', topic: 'Materials Costing', difficulty: 'easy', syllabusRef: '2.4',
    aiExplanation: 'IAS 2 Inventories allows FIFO and weighted average cost (AVCO). LIFO is NOT permitted under IAS 2 or UK GAAP. The method chosen should reflect the actual flow of goods.',
    options: [{ text: 'LIFO only', correct: false, explanation: 'LIFO is NOT permitted under IAS 2.' },{ text: 'FIFO or weighted average', correct: true, explanation: 'Correct! Both are acceptable.' },{ text: 'Any method the business chooses', correct: false, explanation: 'Limited to FIFO or AVCO.' },{ text: 'Replacement cost', correct: false, explanation: 'Not a permitted cost formula under IAS 2.' }] },
  { questionText: 'Economic Order Quantity (EOQ) minimises:', topic: 'Materials Costing', difficulty: 'medium', syllabusRef: '2.5',
    aiExplanation: 'EOQ is the order quantity that minimises the TOTAL of ordering costs + holding costs. Ordering costs decrease as order size increases (fewer orders). Holding costs increase as order size increases (more stock). EOQ balances these two.',
    options: [{ text: 'Only ordering costs', correct: false, explanation: 'EOQ balances ordering AND holding costs.' },{ text: 'Only holding costs', correct: false, explanation: 'EOQ balances both.' },{ text: 'Total ordering plus holding costs', correct: true, explanation: 'Correct!' },{ text: 'Purchase price', correct: false, explanation: 'EOQ does not consider purchase price.' }] },
  { questionText: 'Buffer stock (safety stock) is held to:', topic: 'Materials Costing', difficulty: 'easy', syllabusRef: '2.6',
    aiExplanation: 'Buffer stock is extra inventory held above the expected usage to protect against: unexpected demand increases, supplier delivery delays, or production problems. It prevents stockouts.',
    options: [{ text: 'Reduce storage costs', correct: false, explanation: 'Buffer stock increases storage costs.' },{ text: 'Protect against unexpected demand or delivery delays', correct: true, explanation: 'Correct!' },{ text: 'Increase profit margins', correct: false, explanation: 'It is a cost, not a profit driver.' },{ text: 'Satisfy HMRC requirements', correct: false, explanation: 'HMRC has no buffer stock requirement.' }] },
  { questionText: 'Reorder level = Maximum usage × Maximum lead time. If max usage is 50 units/day and max lead time is 10 days, reorder level is:', topic: 'Materials Costing', difficulty: 'easy', syllabusRef: '2.7',
    aiExplanation: 'Reorder level = 50 × 10 = 500 units. When stock falls to 500 units, a new order is placed. This ensures stock doesn\'t run out even in worst-case scenarios.',
    options: [{ text: '500 units', correct: true, explanation: 'Correct! 50 × 10 = 500.' },{ text: '60 units', correct: false, explanation: 'Added instead of multiplied.' },{ text: '5 units', correct: false, explanation: 'Divided instead of multiplied.' },{ text: '250 units', correct: false, explanation: 'Incorrect calculation.' }] },
  { questionText: 'Inventory is valued at the lower of cost and net realisable value (NRV). If cost is £8 per unit and NRV is £6, it should be valued at:', topic: 'Materials Costing', difficulty: 'easy', syllabusRef: '2.8',
    aiExplanation: 'IAS 2 requires inventory at the LOWER of cost and NRV. Cost £8, NRV £6 — use £6 (the lower). This applies the prudence concept, recognising the loss immediately.',
    options: [{ text: '£8', correct: false, explanation: 'Must use the lower value.' },{ text: '£6', correct: true, explanation: 'Correct! Lower of £8 cost and £6 NRV.' },{ text: '£7', correct: false, explanation: 'No averaging — use the lower.' },{ text: '£14', correct: false, explanation: 'Not added together.' }] },
  // --- Labour Costing (8) ---
  { questionText: 'A worker is paid £12/hour for a 38-hour week. Overtime is paid at time-and-a-half. They work 42 hours. Total gross pay?', topic: 'Labour Costing', difficulty: 'medium', syllabusRef: '3.1',
    aiExplanation: 'Basic: 38 hrs × £12 = £456. Overtime: 4 hrs × £18 (£12 × 1.5) = £72. Total: £456 + £72 = £528.',
    options: [{ text: '£528', correct: true, explanation: 'Correct! £456 + £72 = £528.' },{ text: '£504', correct: false, explanation: 'Would be 42 × £12 — ignores overtime premium.' },{ text: '£456', correct: false, explanation: 'Basic pay only — misses overtime.' },{ text: '£540', correct: false, explanation: 'Incorrect overtime calc.' }] },
  { questionText: 'In the above scenario (£12/hr basic, 4 hrs overtime at time-and-a-half), what is the overtime PREMIUM?', topic: 'Labour Costing', difficulty: 'hard', syllabusRef: '3.2',
    aiExplanation: 'Overtime premium is the EXTRA above basic rate. Basic rate for 4 hrs = 4×£12=£48. Time-and-a-half for 4 hrs = 4×£18=£72. Premium = £72-£48=£24. Or: 4 hrs × £6 premium (half of £12) = £24. The premium is usually treated as indirect cost (overhead) unless overtime is for a specific job.',
    options: [{ text: '£72', correct: false, explanation: 'That is total overtime pay, not just the premium.' },{ text: '£24', correct: true, explanation: 'Correct! 4 hrs × £6 (half rate) = £24 premium.' },{ text: '£48', correct: false, explanation: 'That is basic rate for overtime hours.' },{ text: '£12', correct: false, explanation: 'Incorrect calculation.' }] },
  { questionText: 'Piecework rate: £2.50 per unit. Worker produces 180 units in a week with a guaranteed minimum of £400. Worker receives:', topic: 'Labour Costing', difficulty: 'medium', syllabusRef: '3.3',
    aiExplanation: 'Piecework earnings: 180 × £2.50 = £450. This exceeds the guaranteed minimum of £400, so the worker receives £450.',
    options: [{ text: '£400', correct: false, explanation: 'Piecework earnings exceed the minimum.' },{ text: '£450', correct: true, explanation: 'Correct! 180 × £2.50 = £450 > £400 minimum.' },{ text: '£850', correct: false, explanation: 'Don\'t add both together.' },{ text: '£360', correct: false, explanation: 'Incorrect calculation.' }] },
  { questionText: 'Idle time in a factory is classified as:', topic: 'Labour Costing', difficulty: 'easy', syllabusRef: '3.4',
    aiExplanation: 'Idle time (when workers are paid but not producing) is an indirect cost/overhead. It cannot be charged to specific products. Causes include: machine breakdowns, waiting for materials, power cuts.',
    options: [{ text: 'Direct labour', correct: false, explanation: 'Workers are not producing — cannot be direct.' },{ text: 'Indirect labour (overhead)', correct: true, explanation: 'Correct!' },{ text: 'Not a cost', correct: false, explanation: 'Workers are still being paid.' },{ text: 'Selling cost', correct: false, explanation: 'Production-related, not selling.' }] },
  { questionText: 'A bonus scheme pays £5 for every unit produced above 100 units per day. A worker produces 125 units. Bonus earned?', topic: 'Labour Costing', difficulty: 'easy', syllabusRef: '3.5',
    aiExplanation: 'Units above target: 125 - 100 = 25 units. Bonus: 25 × £5 = £125.',
    options: [{ text: '£125', correct: true, explanation: 'Correct! 25 extra × £5 = £125.' },{ text: '£625', correct: false, explanation: 'Would be 125 × £5 — bonus is only on excess.' },{ text: '£500', correct: false, explanation: 'Would be 100 × £5 — wrong base.' },{ text: '£25', correct: false, explanation: 'Number of extra units, not bonus amount.' }] },
  { questionText: 'Employer\'s National Insurance Contributions are classified as:', topic: 'Labour Costing', difficulty: 'easy', syllabusRef: '3.6',
    aiExplanation: 'Employer\'s NIC is a cost to the employer on top of wages. It is an indirect labour cost because it relates to employment in general, not to specific products. It is included in labour overheads.',
    options: [{ text: 'Direct labour cost', correct: false, explanation: 'NIC is not directly traceable to products.' },{ text: 'Indirect labour cost', correct: true, explanation: 'Correct! Employment overhead.' },{ text: 'Not a business cost', correct: false, explanation: 'It IS a cost to the employer.' },{ text: 'Administration cost only', correct: false, explanation: 'Applies to all employees, not just admin.' }] },
  { questionText: 'Labour turnover rate is calculated as:', topic: 'Labour Costing', difficulty: 'medium', syllabusRef: '3.7',
    aiExplanation: 'Labour turnover = (Number of leavers in period ÷ Average number of employees) × 100. High turnover increases costs: recruitment, training, lost productivity. It is an important efficiency indicator.',
    options: [{ text: '(Leavers ÷ Average employees) × 100', correct: true, explanation: 'Correct!' },{ text: '(Joiners ÷ Total employees) × 100', correct: false, explanation: 'Turnover measures leavers, not joiners.' },{ text: 'Total wages ÷ Number of employees', correct: false, explanation: 'That would be average wage, not turnover.' },{ text: 'Hours worked ÷ Hours available', correct: false, explanation: 'That is a utilisation rate.' }] },
  { questionText: 'Time sheets are used to:', topic: 'Labour Costing', difficulty: 'easy', syllabusRef: '3.8',
    aiExplanation: 'Time sheets record hours worked by each employee, often broken down by job or activity. They are used to: (1) calculate wages, (2) allocate direct labour to specific jobs, (3) identify idle time, (4) provide an audit trail.',
    options: [{ text: 'Record hours worked and allocate labour costs to jobs', correct: true, explanation: 'Correct!' },{ text: 'Calculate material costs', correct: false, explanation: 'Materials use requisition notes.' },{ text: 'Prepare VAT returns', correct: false, explanation: 'Unrelated.' },{ text: 'Record customer orders', correct: false, explanation: 'Sales orders are separate.' }] },
  // --- Overhead Absorption (8) ---
  { questionText: 'Budgeted overheads are £120,000. Budgeted machine hours are 30,000. What is the overhead absorption rate per machine hour?', topic: 'Overhead Absorption', difficulty: 'easy', syllabusRef: '4.1',
    aiExplanation: 'OAR = Budgeted overheads ÷ Budgeted activity = £120,000 ÷ 30,000 = £4 per machine hour.',
    options: [{ text: '£4 per machine hour', correct: true, explanation: 'Correct! £120,000 ÷ 30,000 = £4.' },{ text: '£40 per machine hour', correct: false, explanation: 'Arithmetic error.' },{ text: '£0.25 per machine hour', correct: false, explanation: 'Inverted the division.' },{ text: '£3,600,000', correct: false, explanation: 'Multiplied instead of divided.' }] },
  { questionText: 'A job uses 15 machine hours. Using the £4/hr rate above, overhead absorbed is:', topic: 'Overhead Absorption', difficulty: 'easy', syllabusRef: '4.2',
    aiExplanation: 'Overhead absorbed = OAR × Actual activity = £4 × 15 = £60.',
    options: [{ text: '£60', correct: true, explanation: 'Correct! £4 × 15 hours.' },{ text: '£15', correct: false, explanation: 'That is just the hours.' },{ text: '£4', correct: false, explanation: 'That is the rate, not the amount.' },{ text: '£120', correct: false, explanation: 'Incorrect calculation.' }] },
  { questionText: 'If actual overheads are £125,000 but absorbed overheads are £120,000, the result is:', topic: 'Overhead Absorption', difficulty: 'medium', syllabusRef: '4.3',
    aiExplanation: 'Under-absorption: actual overheads > absorbed overheads. £125,000 - £120,000 = £5,000 under-absorbed. This means not enough overhead was charged to products. The £5,000 is charged to the P&L as an additional expense.',
    options: [{ text: 'Under-absorption of £5,000', correct: true, explanation: 'Correct! Actual exceeds absorbed.' },{ text: 'Over-absorption of £5,000', correct: false, explanation: 'Over-absorption is when absorbed > actual.' },{ text: 'No adjustment needed', correct: false, explanation: '£5,000 difference must be adjusted.' },{ text: 'Profit increase of £5,000', correct: false, explanation: 'Under-absorption reduces profit.' }] },
  { questionText: 'Over-absorption of overheads occurs when:', topic: 'Overhead Absorption', difficulty: 'medium', syllabusRef: '4.4',
    aiExplanation: 'Over-absorption: absorbed overheads > actual overheads. Causes: actual activity was higher than budgeted, or actual overheads were lower than budgeted. Over-absorbed amount is credited to P&L (increases profit).',
    options: [{ text: 'Actual overheads exceed absorbed overheads', correct: false, explanation: 'That is under-absorption.' },{ text: 'Absorbed overheads exceed actual overheads', correct: true, explanation: 'Correct!' },{ text: 'Budget equals actual', correct: false, explanation: 'No over/under absorption if equal.' },{ text: 'The business makes a loss', correct: false, explanation: 'Over-absorption actually improves profit.' }] },
  { questionText: 'Which overhead absorption basis is most appropriate for a highly automated factory?', topic: 'Overhead Absorption', difficulty: 'medium', syllabusRef: '4.5',
    aiExplanation: 'In automated factories, machines drive most costs. Machine hour rate is most appropriate because it reflects the actual cost driver. Labour hour rate would be inappropriate as there are few workers relative to machine use.',
    options: [{ text: 'Direct labour hours', correct: false, explanation: 'Few workers in automated factory.' },{ text: 'Machine hours', correct: true, explanation: 'Correct! Machines drive costs in automated factories.' },{ text: 'Units produced', correct: false, explanation: 'Only suitable if all products are identical.' },{ text: 'Percentage of direct materials', correct: false, explanation: 'Materials don\'t drive overhead in this case.' }] },
  { questionText: 'Budgeted overheads £80,000. Budgeted direct labour hours 20,000. Actual hours 22,000. Actual overheads £85,000. Over/under absorption?', topic: 'Overhead Absorption', difficulty: 'hard', syllabusRef: '4.6',
    aiExplanation: 'OAR = £80,000 ÷ 20,000 = £4/hr. Absorbed = 22,000 × £4 = £88,000. Actual = £85,000. Over-absorbed by £3,000 (£88,000 - £85,000).',
    options: [{ text: 'Over-absorbed £3,000', correct: true, explanation: 'Correct! £88,000 absorbed vs £85,000 actual.' },{ text: 'Under-absorbed £3,000', correct: false, explanation: 'Absorbed exceeds actual = over-absorption.' },{ text: 'Over-absorbed £5,000', correct: false, explanation: 'Check: OAR×hours vs actual.' },{ text: 'Under-absorbed £5,000', correct: false, explanation: 'Incorrect calculation.' }] },
  { questionText: 'Allocation of overheads means:', topic: 'Overhead Absorption', difficulty: 'easy', syllabusRef: '4.7',
    aiExplanation: 'Allocation: assigning a whole cost to a single cost centre because it relates entirely to that centre (e.g., a supervisor\'s salary to their department). Apportionment: sharing a cost between cost centres using a fair basis (e.g., rent by floor area).',
    options: [{ text: 'Sharing a cost between departments using a basis', correct: false, explanation: 'That is apportionment.' },{ text: 'Assigning a whole cost to a single cost centre', correct: true, explanation: 'Correct!' },{ text: 'Calculating the OAR', correct: false, explanation: 'That is absorption rate calculation.' },{ text: 'Charging overhead to products', correct: false, explanation: 'That is absorption.' }] },
  { questionText: 'Factory rent is apportioned to departments based on:', topic: 'Overhead Absorption', difficulty: 'easy', syllabusRef: '4.8',
    aiExplanation: 'Rent is related to space used. The fairest basis for apportioning rent is floor area (square metres/feet) occupied by each department.',
    options: [{ text: 'Number of employees', correct: false, explanation: 'Better for canteen costs or welfare.' },{ text: 'Floor area', correct: true, explanation: 'Correct! Rent relates to space.' },{ text: 'Machine hours', correct: false, explanation: 'Better for machine-related costs.' },{ text: 'Revenue generated', correct: false, explanation: 'Revenue doesn\'t relate to space usage.' }] },
  // --- Costing Methods (6) ---
  { questionText: 'Job costing is most suitable for:', topic: 'Costing Methods', difficulty: 'easy', syllabusRef: '5.1',
    aiExplanation: 'Job costing is used when each job/order is unique and can be separately identified. Examples: custom furniture, construction projects, printing jobs, car repairs. Each job has its own cost card.',
    options: [{ text: 'Mass production of identical items', correct: false, explanation: 'That suits process costing.' },{ text: 'Unique, custom orders', correct: true, explanation: 'Correct!' },{ text: 'Continuous production processes', correct: false, explanation: 'That suits process costing.' },{ text: 'Service industries only', correct: false, explanation: 'Job costing applies to manufacturing and services.' }] },
  { questionText: 'Process costing is used when:', topic: 'Costing Methods', difficulty: 'easy', syllabusRef: '5.2',
    aiExplanation: 'Process costing is used for continuous or mass production of identical/similar units where individual job identification is impossible. Examples: oil refining, food processing, chemical manufacturing.',
    options: [{ text: 'Each product is unique', correct: false, explanation: 'That needs job costing.' },{ text: 'Products are mass-produced in a continuous process', correct: true, explanation: 'Correct!' },{ text: 'Only one product is made', correct: false, explanation: 'Process costing can handle multiple products.' },{ text: 'The business is a retailer', correct: false, explanation: 'Retailers don\'t manufacture.' }] },
  { questionText: 'Batch costing is a form of:', topic: 'Costing Methods', difficulty: 'easy', syllabusRef: '5.3',
    aiExplanation: 'Batch costing is similar to job costing, but the cost unit is a batch of identical items rather than a single job. The batch is treated as the "job". Cost per unit = Total batch cost ÷ Number of units in batch.',
    options: [{ text: 'Job costing', correct: true, explanation: 'Correct! Each batch is treated like a job.' },{ text: 'Process costing', correct: false, explanation: 'Batch has defined start/end, unlike continuous process.' },{ text: 'Service costing', correct: false, explanation: 'Batch costing is for manufactured goods.' },{ text: 'Marginal costing', correct: false, explanation: 'Marginal costing is a different concept.' }] },
  { questionText: 'Service costing differs from product costing because:', topic: 'Costing Methods', difficulty: 'medium', syllabusRef: '5.4',
    aiExplanation: 'Services are intangible — no physical product to inventory. Cost units are different: per patient-day (hospital), per passenger-mile (transport), per meal (canteen). High proportion of indirect costs, no materials (or very few).',
    options: [{ text: 'There is no physical product to inventory', correct: true, explanation: 'Correct! Services are intangible.' },{ text: 'It uses FIFO exclusively', correct: false, explanation: 'FIFO is for inventory valuation.' },{ text: 'It only applies to government organisations', correct: false, explanation: 'Any service organisation can use it.' },{ text: 'There are no overheads', correct: false, explanation: 'Services have significant overheads.' }] },
  { questionText: 'A cost unit for a hospital would most likely be:', topic: 'Costing Methods', difficulty: 'easy', syllabusRef: '5.5',
    aiExplanation: 'Service costing uses composite cost units relevant to the service. Hospital: patient-day. Transport: passenger-mile. Electricity: kilowatt-hour. School: student-hour.',
    options: [{ text: 'Per kilogram', correct: false, explanation: 'More suited to manufacturing.' },{ text: 'Per patient-day', correct: true, explanation: 'Correct!' },{ text: 'Per unit produced', correct: false, explanation: 'Hospitals don\'t produce units.' },{ text: 'Per machine hour', correct: false, explanation: 'More suited to manufacturing.' }] },
  { questionText: 'Marginal cost is:', topic: 'Costing Methods', difficulty: 'medium', syllabusRef: '5.6',
    aiExplanation: 'Marginal cost is the cost of producing one additional unit. It equals the variable cost per unit (direct materials + direct labour + variable overheads). Fixed costs do not change with one extra unit, so they are excluded from marginal cost.',
    options: [{ text: 'Total cost divided by total units', correct: false, explanation: 'That is average cost, not marginal.' },{ text: 'The variable cost of producing one extra unit', correct: true, explanation: 'Correct!' },{ text: 'Fixed cost per unit', correct: false, explanation: 'Fixed costs are excluded.' },{ text: 'The selling price minus profit', correct: false, explanation: 'That would be total cost, not marginal.' }] },
];

async function main() {
  console.log('\n🎓 Seeding L2 ELCO...\n');
  await seedModule('ELCO', ELCO);
  console.log('\n✅ Done!');
}
main().catch(console.error).finally(() => prisma.$disconnect());
