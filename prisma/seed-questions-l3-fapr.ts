/**
 * Level 3 FAPR — Final Accounts Preparation (40 questions)
 * Run: npx tsx prisma/seed-questions-l3-fapr.ts
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

const FAPR: QS[] = [
  // --- Statement of Profit or Loss (10) ---
  { questionText: 'Sales revenue £120,000, opening inventory £8,000, purchases £65,000, closing inventory £10,000. Gross profit?', topic: 'Statement of Profit or Loss', difficulty: 'medium', syllabusRef: '1.1',
    aiExplanation: 'COGS = Opening inv + Purchases - Closing inv = £8,000+£65,000-£10,000 = £63,000. Gross profit = Sales - COGS = £120,000-£63,000 = £57,000.',
    options: [{ text: '£57,000', correct: true, explanation: 'Correct!' },{ text: '£55,000', correct: false, explanation: 'Check COGS calculation.' },{ text: '£47,000', correct: false, explanation: 'Subtracted closing twice.' },{ text: '£63,000', correct: false, explanation: 'That is COGS, not gross profit.' }] },
  { questionText: 'Gross profit £57,000. Expenses: rent £6,000, wages £18,000, depreciation £3,000, insurance £2,400. Net profit?', topic: 'Statement of Profit or Loss', difficulty: 'easy', syllabusRef: '1.2',
    aiExplanation: 'Net profit = Gross profit - Total expenses = £57,000 - (£6,000+£18,000+£3,000+£2,400) = £57,000 - £29,400 = £27,600.',
    options: [{ text: '£27,600', correct: true, explanation: 'Correct!' },{ text: '£29,400', correct: false, explanation: 'That is total expenses.' },{ text: '£33,000', correct: false, explanation: 'Missing some expenses.' },{ text: '£24,600', correct: false, explanation: 'Arithmetic error.' }] },
  { questionText: 'Carriage inwards is added to:', topic: 'Statement of Profit or Loss', difficulty: 'easy', syllabusRef: '1.3',
    aiExplanation: 'Carriage inwards is the cost of transporting goods TO the business from suppliers. It is added to purchases (part of cost of sales). Carriage outwards is delivery to customers and is a selling expense.',
    options: [{ text: 'Sales revenue', correct: false, explanation: 'Not related to income.' },{ text: 'Cost of sales (purchases)', correct: true, explanation: 'Correct!' },{ text: 'Selling expenses', correct: false, explanation: 'That is carriage outwards.' },{ text: 'Non-current assets', correct: false, explanation: 'Not a capital item.' }] },
  { questionText: 'Sales returns should be:', topic: 'Statement of Profit or Loss', difficulty: 'easy', syllabusRef: '1.4',
    aiExplanation: 'Sales returns (returns inwards) are deducted from gross sales to arrive at net sales (revenue). They reduce the top line of the P&L.',
    options: [{ text: 'Added to purchases', correct: false, explanation: 'Sales returns reduce sales, not increase purchases.' },{ text: 'Deducted from sales to give net sales', correct: true, explanation: 'Correct!' },{ text: 'Shown as an expense', correct: false, explanation: 'They are a reduction of revenue.' },{ text: 'Ignored', correct: false, explanation: 'Must be accounted for.' }] },
  { questionText: 'Discount allowed is:', topic: 'Statement of Profit or Loss', difficulty: 'easy', syllabusRef: '1.5',
    aiExplanation: 'Discount allowed is a settlement discount given to customers for prompt payment. It is an expense (reduces profit). Discount received is income (from suppliers).',
    options: [{ text: 'An expense', correct: true, explanation: 'Correct! Cost of encouraging early payment.' },{ text: 'Added to sales', correct: false, explanation: 'It reduces profit, not increases sales.' },{ text: 'Deducted from purchases', correct: false, explanation: 'That would be discount received.' },{ text: 'A liability', correct: false, explanation: 'It is an expense in the P&L.' }] },
  { questionText: 'Discount received from suppliers is classified as:', topic: 'Statement of Profit or Loss', difficulty: 'easy', syllabusRef: '1.6',
    aiExplanation: 'Discount received is a settlement discount from suppliers for paying promptly. It is income (or reduces expenses), increasing profit.',
    options: [{ text: 'An expense', correct: false, explanation: 'It is income, not expense.' },{ text: 'Income', correct: true, explanation: 'Correct!' },{ text: 'A reduction in sales', correct: false, explanation: 'Relates to purchases, not sales.' },{ text: 'An asset', correct: false, explanation: 'It is P&L income.' }] },
  { questionText: 'Which of these would NOT appear in the statement of profit or loss?', topic: 'Statement of Profit or Loss', difficulty: 'medium', syllabusRef: '1.7',
    aiExplanation: 'The P&L contains income and expenses. Drawings are a distribution to the owner — they reduce capital on the SOFP but are NOT an expense. They do not appear in the P&L.',
    options: [{ text: 'Depreciation', correct: false, explanation: 'Depreciation IS an expense in P&L.' },{ text: 'Rent expense', correct: false, explanation: 'Rent IS an expense in P&L.' },{ text: 'Drawings', correct: true, explanation: 'Correct! Drawings reduce capital, not profit.' },{ text: 'Irrecoverable debts', correct: false, explanation: 'Bad debts ARE an expense in P&L.' }] },
  { questionText: 'The P&L shows net profit of £25,000. Owner drawings are £18,000. The addition to capital is:', topic: 'Statement of Profit or Loss', difficulty: 'easy', syllabusRef: '1.8',
    aiExplanation: 'Profit increases capital. Drawings decrease capital. Net addition = Profit - Drawings = £25,000 - £18,000 = £7,000.',
    options: [{ text: '£7,000', correct: true, explanation: 'Correct!' },{ text: '£25,000', correct: false, explanation: 'Must deduct drawings.' },{ text: '£43,000', correct: false, explanation: 'Added both.' },{ text: '£18,000', correct: false, explanation: 'That is drawings.' }] },
  { questionText: 'Purchase returns are deducted from:', topic: 'Statement of Profit or Loss', difficulty: 'easy', syllabusRef: '1.9',
    aiExplanation: 'Purchase returns (returns outwards) are deducted from purchases in the cost of sales section. They reduce the cost of goods bought.',
    options: [{ text: 'Sales', correct: false, explanation: 'Sales returns reduce sales; purchase returns reduce purchases.' },{ text: 'Purchases', correct: true, explanation: 'Correct!' },{ text: 'Expenses', correct: false, explanation: 'They are in cost of sales, not general expenses.' },{ text: 'Capital', correct: false, explanation: 'Not related to capital.' }] },
  { questionText: 'A sole trader\'s salary is treated as:', topic: 'Statement of Profit or Loss', difficulty: 'medium', syllabusRef: '1.10',
    aiExplanation: 'A sole trader cannot employ themselves. Any "salary" they take is drawings (a distribution of profit), NOT an expense. Only employees\' wages are expenses. The sole trader\'s profit IS their income.',
    options: [{ text: 'A business expense', correct: false, explanation: 'A sole trader cannot be their own employee.' },{ text: 'Drawings', correct: true, explanation: 'Correct! Personal drawings from the business.' },{ text: 'A liability', correct: false, explanation: 'Not owed to anyone.' },{ text: 'Part of cost of sales', correct: false, explanation: 'Not related to goods sold.' }] },
  // --- Statement of Financial Position (10) ---
  { questionText: 'Which is a current asset?', topic: 'Statement of Financial Position', difficulty: 'easy', syllabusRef: '2.1',
    aiExplanation: 'Current assets are expected to be converted to cash or used within 12 months: inventory, trade receivables, prepayments, bank balance, cash.',
    options: [{ text: 'Motor vehicles', correct: false, explanation: 'Non-current asset.' },{ text: 'Trade receivables', correct: true, explanation: 'Correct!' },{ text: 'Bank loan', correct: false, explanation: 'Liability, not asset.' },{ text: 'Capital', correct: false, explanation: 'Equity, not asset.' }] },
  { questionText: 'Which is a non-current liability?', topic: 'Statement of Financial Position', difficulty: 'easy', syllabusRef: '2.2',
    aiExplanation: 'Non-current liabilities are due after more than 12 months: bank loans (long-term), mortgages, debentures. Current liabilities are due within 12 months.',
    options: [{ text: 'Trade payables', correct: false, explanation: 'Current liability — due within 30-60 days.' },{ text: 'Bank overdraft', correct: false, explanation: 'Current liability — repayable on demand.' },{ text: 'Five-year bank loan', correct: true, explanation: 'Correct! Due after more than 12 months.' },{ text: 'Accruals', correct: false, explanation: 'Current liability.' }] },
  { questionText: 'The accounting equation for the SOFP is:', topic: 'Statement of Financial Position', difficulty: 'easy', syllabusRef: '2.3',
    aiExplanation: 'Assets = Liabilities + Capital (Equity). Or rearranged: Net Assets (Assets - Liabilities) = Capital. This must always balance.',
    options: [{ text: 'Assets = Liabilities + Capital', correct: true, explanation: 'Correct!' },{ text: 'Assets + Liabilities = Capital', correct: false, explanation: 'Assets and liabilities on same side.' },{ text: 'Assets = Capital - Liabilities', correct: false, explanation: 'Liabilities should be added.' },{ text: 'Revenue - Expenses = Profit', correct: false, explanation: 'That is the P&L equation.' }] },
  { questionText: 'Closing capital = Opening capital + Profit - Drawings + Capital introduced. Opening capital £30,000, profit £15,000, drawings £8,000, capital introduced £5,000. Closing capital?', topic: 'Statement of Financial Position', difficulty: 'medium', syllabusRef: '2.4',
    aiExplanation: '£30,000 + £15,000 - £8,000 + £5,000 = £42,000.',
    options: [{ text: '£42,000', correct: true, explanation: 'Correct!' },{ text: '£37,000', correct: false, explanation: 'Forgot capital introduced.' },{ text: '£32,000', correct: false, explanation: 'Subtracted profit instead of adding.' },{ text: '£58,000', correct: false, explanation: 'Added everything.' }] },
  { questionText: 'Net current assets (working capital) is:', topic: 'Statement of Financial Position', difficulty: 'easy', syllabusRef: '2.5',
    aiExplanation: 'Net current assets = Current assets - Current liabilities. Also called working capital. A positive figure means the business can pay its short-term debts.',
    options: [{ text: 'Current assets - Current liabilities', correct: true, explanation: 'Correct!' },{ text: 'Total assets - Total liabilities', correct: false, explanation: 'That is net assets (equity).' },{ text: 'Non-current assets + Current assets', correct: false, explanation: 'That is total assets.' },{ text: 'Current liabilities - Current assets', correct: false, explanation: 'Reversed — would give negative working capital.' }] },
  { questionText: 'A bank overdraft is classified as:', topic: 'Statement of Financial Position', difficulty: 'easy', syllabusRef: '2.6',
    aiExplanation: 'A bank overdraft is repayable on demand, making it a current liability. Even if it is used continuously, it is technically due within 12 months.',
    options: [{ text: 'Non-current liability', correct: false, explanation: 'Repayable on demand = current.' },{ text: 'Current liability', correct: true, explanation: 'Correct!' },{ text: 'Current asset', correct: false, explanation: 'An overdraft is a liability (we owe the bank).' },{ text: 'Equity', correct: false, explanation: 'Not equity.' }] },
  { questionText: 'Goodwill purchased for £20,000 appears on the SOFP as:', topic: 'Statement of Financial Position', difficulty: 'medium', syllabusRef: '2.7',
    aiExplanation: 'Purchased goodwill is a non-current intangible asset. It appears on the SOFP at cost less any amortisation or impairment. Only PURCHASED goodwill can be recognised — internally generated goodwill cannot.',
    options: [{ text: 'Current asset', correct: false, explanation: 'Goodwill is non-current.' },{ text: 'Non-current intangible asset', correct: true, explanation: 'Correct!' },{ text: 'Expense in P&L', correct: false, explanation: 'It is capitalised, not expensed immediately.' },{ text: 'Current liability', correct: false, explanation: 'Not a liability.' }] },
  { questionText: 'Which order are assets listed on the SOFP (UK format)?', topic: 'Statement of Financial Position', difficulty: 'easy', syllabusRef: '2.8',
    aiExplanation: 'UK format SOFP lists assets in order of permanence (least liquid first): Non-current assets first, then current assets. Within current assets: inventory, receivables, bank/cash.',
    options: [{ text: 'Most liquid first (cash, then receivables, then NCA)', correct: false, explanation: 'That is the US format.' },{ text: 'Non-current assets first, then current assets', correct: true, explanation: 'Correct! UK format.' },{ text: 'Alphabetical order', correct: false, explanation: 'Not alphabetical.' },{ text: 'Any order', correct: false, explanation: 'Specific format required.' }] },
  { questionText: 'Total assets £150,000. Total liabilities £60,000. Capital is:', topic: 'Statement of Financial Position', difficulty: 'easy', syllabusRef: '2.9',
    aiExplanation: 'Capital = Assets - Liabilities = £150,000 - £60,000 = £90,000.',
    options: [{ text: '£90,000', correct: true, explanation: 'Correct!' },{ text: '£210,000', correct: false, explanation: 'Added instead of subtracted.' },{ text: '£60,000', correct: false, explanation: 'That is liabilities.' },{ text: '£150,000', correct: false, explanation: 'That is total assets.' }] },
  { questionText: 'Drawings reduce:', topic: 'Statement of Financial Position', difficulty: 'easy', syllabusRef: '2.10',
    aiExplanation: 'Drawings reduce capital (owner\'s equity). They are NOT an expense — they are a distribution of profit/capital to the owner.',
    options: [{ text: 'Sales revenue', correct: false, explanation: 'Drawings don\'t affect revenue.' },{ text: 'Capital (owner\'s equity)', correct: true, explanation: 'Correct!' },{ text: 'Liabilities', correct: false, explanation: 'Drawings don\'t reduce liabilities.' },{ text: 'Cost of sales', correct: false, explanation: 'Not related to cost of sales.' }] },
  // --- Partnership Accounts (10) ---
  { questionText: 'Partners A and B share profits 3:2. Net profit £50,000. A\'s share?', topic: 'Partnership Accounts', difficulty: 'easy', syllabusRef: '3.1',
    aiExplanation: 'Total parts = 3+2 = 5. A\'s share = 3/5 × £50,000 = £30,000.',
    options: [{ text: '£30,000', correct: true, explanation: 'Correct! 3/5 × £50,000.' },{ text: '£20,000', correct: false, explanation: 'That is B\'s share (2/5).' },{ text: '£25,000', correct: false, explanation: 'Equal split, not 3:2.' },{ text: '£33,333', correct: false, explanation: 'Would be 1/3 split.' }] },
  { questionText: 'In a partnership, a salary to a partner is:', topic: 'Partnership Accounts', difficulty: 'medium', syllabusRef: '3.2',
    aiExplanation: 'Partner salaries are an appropriation of profit (a way of dividing profit), NOT an expense of the business. They are deducted from net profit in the appropriation account before the remaining profit is shared.',
    options: [{ text: 'An expense in the P&L', correct: false, explanation: 'Partner salaries are not expenses.' },{ text: 'An appropriation of profit', correct: true, explanation: 'Correct!' },{ text: 'A liability', correct: false, explanation: 'Credited to the partner\'s current account.' },{ text: 'Drawings', correct: false, explanation: 'Salary is an allocation; drawings are cash taken.' }] },
  { questionText: 'Net profit £80,000. Partner A salary £15,000, Partner B salary £12,000. Remaining profit shared equally. A\'s total share?', topic: 'Partnership Accounts', difficulty: 'medium', syllabusRef: '3.3',
    aiExplanation: 'After salaries: £80,000 - £15,000 - £12,000 = £53,000. Equal split: £53,000 ÷ 2 = £26,500 each. A total: £15,000 + £26,500 = £41,500.',
    options: [{ text: '£41,500', correct: true, explanation: 'Correct! £15,000 salary + £26,500 share.' },{ text: '£40,000', correct: false, explanation: 'Equal split of total — ignores salaries.' },{ text: '£26,500', correct: false, explanation: 'Just the profit share, missing salary.' },{ text: '£53,000', correct: false, explanation: 'Remaining profit before split.' }] },
  { questionText: 'Interest on capital for partners is:', topic: 'Partnership Accounts', difficulty: 'easy', syllabusRef: '3.4',
    aiExplanation: 'Interest on capital is an appropriation of profit (like partner salaries). It rewards partners for their capital investment. It is NOT a business expense.',
    options: [{ text: 'A business expense', correct: false, explanation: 'Not an expense — appropriation.' },{ text: 'An appropriation of profit', correct: true, explanation: 'Correct!' },{ text: 'Interest paid to the bank', correct: false, explanation: 'Paid to partners, not the bank.' },{ text: 'Income for the partnership', correct: false, explanation: 'It is a distribution, not income.' }] },
  { questionText: 'Interest on drawings charges partners for:', topic: 'Partnership Accounts', difficulty: 'medium', syllabusRef: '3.5',
    aiExplanation: 'Interest on drawings is charged to partners for taking money out during the year. It is ADDED to the profit available for sharing (increases the pool). It discourages excessive drawings.',
    options: [{ text: 'The profit share they receive', correct: false, explanation: 'That is the profit share, not interest on drawings.' },{ text: 'Cash taken from the business during the year', correct: true, explanation: 'Correct!' },{ text: 'Bank loans they have taken', correct: false, explanation: 'Bank interest is separate.' },{ text: 'Their salary allocation', correct: false, explanation: 'Salaries are separate from drawings.' }] },
  { questionText: 'The appropriation account shows how:', topic: 'Appropriation Accounts', difficulty: 'easy', syllabusRef: '3.6',
    aiExplanation: 'The appropriation account (a continuation of the P&L) shows how the net profit is divided between partners: salaries, interest on capital, interest on drawings, and remaining profit share.',
    options: [{ text: 'Expenses are allocated to departments', correct: false, explanation: 'That is cost allocation.' },{ text: 'Net profit is divided between partners', correct: true, explanation: 'Correct!' },{ text: 'Assets are distributed on dissolution', correct: false, explanation: 'That is the realisation account.' },{ text: 'Tax is calculated', correct: false, explanation: 'Partnerships don\'t pay tax as entities.' }] },
  { questionText: 'A partner\'s current account with a credit balance means:', topic: 'Partnership Accounts', difficulty: 'medium', syllabusRef: '3.7',
    aiExplanation: 'A credit balance on a partner\'s current account means the partnership owes the partner money (their share of profit exceeds their drawings). A debit balance means the partner owes the partnership (drawings exceed profit share).',
    options: [{ text: 'The partner owes the business money', correct: false, explanation: 'Debit balance = partner owes.' },{ text: 'The business owes the partner money', correct: true, explanation: 'Correct!' },{ text: 'The partner has invested more capital', correct: false, explanation: 'Capital is in the capital account, not current.' },{ text: 'The account is in error', correct: false, explanation: 'Credit balances are normal.' }] },
  { questionText: 'What is the difference between a partner\'s capital account and current account?', topic: 'Partnership Accounts', difficulty: 'medium', syllabusRef: '3.8',
    aiExplanation: 'Capital account: holds the partner\'s long-term investment (capital introduced, rarely changes). Current account: holds short-term items — profit share, salary, interest on capital (credits) and drawings, interest on drawings (debits). The current account fluctuates each year.',
    options: [{ text: 'They are the same thing', correct: false, explanation: 'Two separate accounts with different purposes.' },{ text: 'Capital = long-term investment; Current = short-term profit/drawings', correct: true, explanation: 'Correct!' },{ text: 'Capital is for cash, current is for non-cash', correct: false, explanation: 'Not about cash vs non-cash.' },{ text: 'Current account is only used when a partner leaves', correct: false, explanation: 'Used every year for profit allocation.' }] },
  { questionText: 'A new partner joins and pays a premium for goodwill of £10,000. Existing partners A and B (equal shares) benefit. Each receives:', topic: 'Partnership Accounts', difficulty: 'hard', syllabusRef: '3.9',
    aiExplanation: 'The £10,000 goodwill premium is shared between existing partners in their profit-sharing ratio. Equal shares: £10,000 ÷ 2 = £5,000 each credited to their capital accounts.',
    options: [{ text: '£5,000 each', correct: true, explanation: 'Correct! Equal share of £10,000.' },{ text: '£10,000 each', correct: false, explanation: 'Total is £10,000 to share.' },{ text: '£10,000 to A only', correct: false, explanation: 'Both share equally.' },{ text: '£2,500 each', correct: false, explanation: 'Incorrect split.' }] },
  { questionText: 'In a partnership, who is liable for business debts?', topic: 'Partnership Accounts', difficulty: 'easy', syllabusRef: '3.10',
    aiExplanation: 'In a general partnership, partners have unlimited liability — they are personally liable for ALL business debts, jointly and severally. This means creditors can pursue any partner for the full amount. LLPs have limited liability.',
    options: [{ text: 'Each partner up to their capital investment only', correct: false, explanation: 'That is limited liability (LLP).' },{ text: 'All partners jointly and severally (unlimited liability)', correct: true, explanation: 'Correct!' },{ text: 'Only the managing partner', correct: false, explanation: 'All partners are liable.' },{ text: 'No one — the business is a separate legal entity', correct: false, explanation: 'Partnerships are NOT separate legal entities.' }] },
  // --- Year-End Adjustments (5) ---
  { questionText: 'Which of these is a year-end adjustment?', topic: 'Year-End Adjustments', difficulty: 'easy', syllabusRef: '4.1',
    aiExplanation: 'Year-end adjustments include: accruals, prepayments, depreciation, allowance for doubtful debts, closing inventory valuation, and irrecoverable debt write-offs.',
    options: [{ text: 'Recording a credit sale', correct: false, explanation: 'This is a regular transaction, not a year-end adjustment.' },{ text: 'Calculating depreciation for the year', correct: true, explanation: 'Correct!' },{ text: 'Opening a bank account', correct: false, explanation: 'Not a year-end adjustment.' },{ text: 'Paying a supplier', correct: false, explanation: 'Regular transaction.' }] },
  { questionText: 'The purpose of year-end adjustments is to:', topic: 'Year-End Adjustments', difficulty: 'easy', syllabusRef: '4.2',
    aiExplanation: 'Year-end adjustments ensure the financial statements reflect the true position and performance for the period, applying the accruals concept and prudence.',
    options: [{ text: 'Reduce the tax bill', correct: false, explanation: 'Not the purpose — though they may affect tax.' },{ text: 'Ensure financial statements give a true and fair view', correct: true, explanation: 'Correct!' },{ text: 'Increase reported profit', correct: false, explanation: 'Some adjustments increase, some decrease profit.' },{ text: 'Balance the bank account', correct: false, explanation: 'Bank reconciliation is separate.' }] },
  { questionText: 'A provision for doubtful debts of 3% on receivables of £40,000 means a provision of:', topic: 'Year-End Adjustments', difficulty: 'easy', syllabusRef: '4.3',
    aiExplanation: '3% × £40,000 = £1,200.',
    options: [{ text: '£1,200', correct: true, explanation: 'Correct!' },{ text: '£12,000', correct: false, explanation: '30%, not 3%.' },{ text: '£38,800', correct: false, explanation: 'That is net receivables.' },{ text: '£400', correct: false, explanation: '1%, not 3%.' }] },
  { questionText: 'Closing inventory should be valued at:', topic: 'Closing Inventory', difficulty: 'easy', syllabusRef: '4.4',
    aiExplanation: 'IAS 2: Lower of cost and net realisable value (NRV). This applies item by item (or group by group), not to the total.',
    options: [{ text: 'Selling price', correct: false, explanation: 'Must use the lower of cost and NRV.' },{ text: 'Lower of cost and NRV', correct: true, explanation: 'Correct!' },{ text: 'Cost only', correct: false, explanation: 'If NRV is lower, must use NRV.' },{ text: 'Replacement cost', correct: false, explanation: 'Not the correct basis.' }] },
  { questionText: 'If closing inventory is overstated, the effect on profit is:', topic: 'Closing Inventory', difficulty: 'medium', syllabusRef: '4.5',
    aiExplanation: 'Closing inventory reduces COGS (COGS = Opening + Purchases - Closing). If closing is overstated, COGS is understated, so gross profit and net profit are OVERSTATED. This error reverses next year.',
    options: [{ text: 'Profit is overstated', correct: true, explanation: 'Correct! Lower COGS = higher profit.' },{ text: 'Profit is understated', correct: false, explanation: 'Overstated closing inventory increases profit.' },{ text: 'No effect on profit', correct: false, explanation: 'Closing inventory directly affects COGS and profit.' },{ text: 'Profit is correct but assets are wrong', correct: false, explanation: 'Both profit AND assets are overstated.' }] },
  // --- Capital & Revenue Expenditure (5) ---
  { questionText: 'A business buys a machine for £5,000 and pays £300 delivery and £200 installation. Total capitalised cost?', topic: 'Capital & Revenue Expenditure', difficulty: 'medium', syllabusRef: '5.1',
    aiExplanation: 'Capitalised cost includes all costs to bring the asset to working condition: purchase price + delivery + installation = £5,000 + £300 + £200 = £5,500. These are all capital expenditure.',
    options: [{ text: '£5,500', correct: true, explanation: 'Correct! All costs to bring to working condition.' },{ text: '£5,000', correct: false, explanation: 'Must include delivery and installation.' },{ text: '£5,300', correct: false, explanation: 'Missing installation.' },{ text: '£5,200', correct: false, explanation: 'Missing delivery.' }] },
  { questionText: 'Repainting office walls costs £800. This is:', topic: 'Capital & Revenue Expenditure', difficulty: 'easy', syllabusRef: '5.2',
    aiExplanation: 'Repainting is maintenance — it restores the asset to its original condition but does not enhance it. Revenue expenditure, charged to P&L.',
    options: [{ text: 'Capital expenditure', correct: false, explanation: 'Painting is maintenance, not enhancement.' },{ text: 'Revenue expenditure', correct: true, explanation: 'Correct! Maintenance cost.' },{ text: 'Neither', correct: false, explanation: 'It is revenue expenditure.' },{ text: 'Depends on the amount', correct: false, explanation: 'Classification is by nature, not amount.' }] },
  { questionText: 'Adding an extension to a building is:', topic: 'Capital & Revenue Expenditure', difficulty: 'easy', syllabusRef: '5.3',
    aiExplanation: 'An extension enhances the asset (increases capacity/value). This is capital expenditure — capitalised as part of the building cost on the SOFP.',
    options: [{ text: 'Revenue expenditure', correct: false, explanation: 'Extensions enhance the asset = capital.' },{ text: 'Capital expenditure', correct: true, explanation: 'Correct!' },{ text: 'Drawings', correct: false, explanation: 'Not a personal expense.' },{ text: 'An expense only if over £1,000', correct: false, explanation: 'Nature determines classification, not amount.' }] },
  { questionText: 'If capital expenditure is incorrectly treated as revenue expenditure, the effect is:', topic: 'Capital & Revenue Expenditure', difficulty: 'hard', syllabusRef: '5.4',
    aiExplanation: 'If capitalised as expense: (1) Profit is UNDERSTATED (extra expense), (2) Assets are UNDERSTATED (not on SOFP), (3) Capital/equity is UNDERSTATED. The error affects both P&L and SOFP.',
    options: [{ text: 'Profit overstated, assets understated', correct: false, explanation: 'Profit is understated (not overstated).' },{ text: 'Profit understated, assets understated', correct: true, explanation: 'Correct! Extra expense reduces profit; missing asset reduces SOFP.' },{ text: 'No effect — both methods give same result', correct: false, explanation: 'Significant impact on both statements.' },{ text: 'Profit overstated, assets overstated', correct: false, explanation: 'Both are understated, not overstated.' }] },
  { questionText: 'Legal fees for purchasing a property are:', topic: 'Capital & Revenue Expenditure', difficulty: 'medium', syllabusRef: '5.5',
    aiExplanation: 'Legal fees directly related to acquiring a non-current asset are part of the cost of the asset — capital expenditure. They are added to the property cost on the SOFP.',
    options: [{ text: 'Revenue expenditure', correct: false, explanation: 'Directly related to asset acquisition = capital.' },{ text: 'Capital expenditure', correct: true, explanation: 'Correct!' },{ text: 'Not recorded', correct: false, explanation: 'Must be recorded.' },{ text: 'Charged to drawings', correct: false, explanation: 'Business cost, not personal.' }] },
];

async function main() {
  console.log('\n🎓 Seeding L3 FAPR...\n');
  await seedModule('FAPR', FAPR);
  console.log('\n✅ Done!');
}
main().catch(console.error).finally(() => prisma.$disconnect());
