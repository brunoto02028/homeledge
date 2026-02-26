/**
 * Level 2 BKCL — Bookkeeping Controls (40 questions)
 * Run: npx tsx prisma/seed-questions-l2-bkcl.ts
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

const BKCL: QS[] = [
  // --- Bank Reconciliation (10) ---
  { questionText: 'Cash book balance £3,450. Unpresented cheques £620, outstanding lodgements £340. Bank statement balance?', topic: 'Bank Reconciliation', difficulty: 'medium', syllabusRef: '1.1',
    aiExplanation: 'Bank stmt = Cash book + Unpresented cheques - Outstanding lodgements = £3,450+£620-£340 = £3,730.',
    options: [{ text: '£3,730', correct: true, explanation: 'Correct!' },{ text: '£3,170', correct: false, explanation: 'Reversed adjustments.' },{ text: '£4,410', correct: false, explanation: 'Added both.' },{ text: '£3,450', correct: false, explanation: 'No adjustments made.' }] },
  { questionText: 'Which item appears on the bank statement but NOT in the cash book?', topic: 'Bank Reconciliation', difficulty: 'easy', syllabusRef: '1.2',
    aiExplanation: 'Bank charges, direct debits, standing orders, and BACS receipts appear on the bank statement but may not yet be in the cash book.',
    options: [{ text: 'Unpresented cheque', correct: false, explanation: 'In cash book but NOT on bank statement.' },{ text: 'Outstanding lodgement', correct: false, explanation: 'In cash book but NOT on bank statement.' },{ text: 'Bank charges', correct: true, explanation: 'Correct! Deducted by bank, needs adding to cash book.' },{ text: 'Cheque to supplier', correct: false, explanation: 'Already in cash book.' }] },
  { questionText: 'Direct debit £85 for insurance not entered in cash book. Correct entry?', topic: 'Bank Reconciliation', difficulty: 'easy', syllabusRef: '1.3',
    aiExplanation: 'The DD was taken by the bank but not recorded. Update cash book: DR Insurance £85, CR Bank £85.',
    options: [{ text: 'DR Bank £85, CR Insurance £85', correct: false, explanation: 'Reversed — DD reduces bank.' },{ text: 'DR Insurance £85, CR Bank £85', correct: true, explanation: 'Correct!' },{ text: 'No entry — timing difference', correct: false, explanation: 'DDs must be entered in cash book.' },{ text: 'DR Suspense £85, CR Bank £85', correct: false, explanation: 'We know the account — no suspense needed.' }] },
  { questionText: 'What is the purpose of a bank reconciliation?', topic: 'Bank Reconciliation', difficulty: 'easy', syllabusRef: '1.4',
    aiExplanation: 'To identify and explain differences between the cash book and bank statement, detecting errors and missing entries.',
    options: [{ text: 'Calculate profit', correct: false, explanation: 'Done in P&L.' },{ text: 'Identify differences between cash book and bank statement', correct: true, explanation: 'Correct!' },{ text: 'Balance the trial balance', correct: false, explanation: 'TB uses the general ledger.' },{ text: 'Prepare VAT return', correct: false, explanation: 'Uses sales/purchase records.' }] },
  { questionText: 'Cheque for £250 recorded as £520 in cash book. How to correct this transposition?', topic: 'Bank Reconciliation', difficulty: 'hard', syllabusRef: '1.5',
    aiExplanation: 'Overstated by £270 (£520-£250). Debit cash book £270 to increase balance back. Transposition errors divisible by 9: £270÷9=30.',
    options: [{ text: 'Debit cash book £270', correct: true, explanation: 'Correct! Add back overpayment.' },{ text: 'Credit cash book £270', correct: false, explanation: 'Would reduce balance further.' },{ text: 'Debit cash book £520', correct: false, explanation: 'Only correct the difference.' },{ text: 'No correction needed', correct: false, explanation: 'Cash book has wrong amount.' }] },
  { questionText: 'Standing order £150 for rent on bank statement, not in cash book. This is:', topic: 'Bank Reconciliation', difficulty: 'easy', syllabusRef: '1.6',
    aiExplanation: 'This is an item that must be entered into the cash book. It is NOT a timing difference (those are items in the cash book but not yet on the statement).',
    options: [{ text: 'A timing difference', correct: false, explanation: 'Timing differences are items in the cash book not yet on the statement.' },{ text: 'An item to update the cash book', correct: true, explanation: 'Correct! Must be recorded: DR Rent, CR Bank.' },{ text: 'An error on the bank statement', correct: false, explanation: 'Standing orders are legitimate bank entries.' },{ text: 'Already recorded correctly', correct: false, explanation: 'Not yet in the cash book.' }] },
  { questionText: 'After updating the cash book for bank statement items, the adjusted cash book balance should agree with:', topic: 'Bank Reconciliation', difficulty: 'medium', syllabusRef: '1.7',
    aiExplanation: 'After updating the cash book (for DDs, SOs, bank charges, etc.), the adjusted balance should agree with the bank statement balance AFTER adjusting for timing differences (unpresented cheques and outstanding lodgements).',
    options: [{ text: 'The original bank statement balance', correct: false, explanation: 'Need to adjust for timing differences too.' },{ text: 'The bank statement balance adjusted for timing differences', correct: true, explanation: 'Correct!' },{ text: 'The trial balance total', correct: false, explanation: 'Different purpose.' },{ text: 'The purchase ledger balance', correct: false, explanation: 'Unrelated.' }] },
  { questionText: 'A BACS receipt of £800 appears on the bank statement. The business has not recorded it. This is most likely:', topic: 'Bank Reconciliation', difficulty: 'easy', syllabusRef: '1.8',
    aiExplanation: 'BACS (Bankers Automated Clearing System) is an electronic payment. If a customer pays by BACS, the money arrives in the bank account and appears on the statement. The business must record it in the cash book.',
    options: [{ text: 'A customer payment by BACS', correct: true, explanation: 'Correct! Must be entered: DR Bank £800, CR SLCA £800.' },{ text: 'A bank error', correct: false, explanation: 'BACS payments are usually legitimate.' },{ text: 'A timing difference', correct: false, explanation: 'It is on the statement but not in the books — must be entered.' },{ text: 'A dishonoured cheque', correct: false, explanation: 'Dishonoured cheques reduce the balance; this increases it.' }] },
  { questionText: 'A cheque paid to a supplier for £340 has been returned unpaid (dishonoured). What entry is needed in the cash book?', topic: 'Bank Reconciliation', difficulty: 'hard', syllabusRef: '1.9',
    aiExplanation: 'Our cheque bounced. The payment we recorded needs reversing. DR PLCA £340 (we still owe supplier), CR Bank... wait, our cheque was returned — the bank adds the money back. Actually: when OUR cheque to a supplier is dishonoured, the bank adds the money back. But the question is about updating our cash book. We had CR Bank £340 when we wrote the cheque. Now we reverse: DR Bank £340, CR PLCA £340... Actually no. If our cheque bounced, bank returns the money: Debit side of cash book £340 (bank increased), and we still owe the supplier so CR... hmm. Let me reconsider. When we wrote the cheque: DR PLCA, CR Bank. When it bounces: reverse — DR Bank, CR PLCA. So the supplier still shows as owing.',
    options: [{ text: 'DR Bank £340, CR PLCA £340', correct: true, explanation: 'Correct! Reverse the original payment — bank goes back up, we still owe supplier.' },{ text: 'DR PLCA £340, CR Bank £340', correct: false, explanation: 'This would be making the payment again.' },{ text: 'DR Bank £340, CR Suspense £340', correct: false, explanation: 'We know the account — PLCA.' },{ text: 'No entry needed', correct: false, explanation: 'Must reverse the original payment in our books.' }] },
  { questionText: 'Which of these is a timing difference in bank reconciliation?', topic: 'Bank Reconciliation', difficulty: 'easy', syllabusRef: '1.10',
    aiExplanation: 'Timing differences are items correctly recorded in the cash book but not yet appearing on the bank statement. These include: unpresented cheques (written but not yet cashed) and outstanding lodgements (deposited but not yet cleared).',
    options: [{ text: 'Bank charges not in the cash book', correct: false, explanation: 'This is a cash book update item, not a timing difference.' },{ text: 'Unpresented cheques', correct: true, explanation: 'Correct! In cash book but not yet on bank statement.' },{ text: 'A standing order not recorded', correct: false, explanation: 'This needs adding to the cash book.' },{ text: 'A BACS receipt not recorded', correct: false, explanation: 'This needs adding to the cash book.' }] },
  // --- Control Accounts (10) ---
  { questionText: 'Which is a credit entry in the Sales Ledger Control Account?', topic: 'Sales Ledger Control Account', difficulty: 'easy', syllabusRef: '2.1',
    aiExplanation: 'SLCA credits reduce what customers owe: cash received, sales returns, irrecoverable debts, discounts allowed, contra entries.',
    options: [{ text: 'Credit sales', correct: false, explanation: 'DEBIT — increases receivables.' },{ text: 'Cash received from customers', correct: true, explanation: 'Correct! Reduces what is owed.' },{ text: 'Dishonoured cheques', correct: false, explanation: 'DEBIT — customer still owes us.' },{ text: 'Opening balance (debit)', correct: false, explanation: 'Debit balance brought forward.' }] },
  { questionText: 'SLCA: Opening £12,400 + Sales £45,600 - Cash £41,200 - Returns £1,800 - Bad debts £600 - Discounts £900. Closing balance?', topic: 'Sales Ledger Control Account', difficulty: 'medium', syllabusRef: '2.2',
    aiExplanation: 'DR: £12,400+£45,600=£58,000. CR: £41,200+£1,800+£600+£900=£44,500. Balance: £58,000-£44,500=£13,500 DR.',
    options: [{ text: '£13,500', correct: true, explanation: 'Correct!' },{ text: '£15,300', correct: false, explanation: 'Check credit total.' },{ text: '£11,700', correct: false, explanation: 'Arithmetic error.' },{ text: '£16,100', correct: false, explanation: 'Missing a credit item.' }] },
  { questionText: 'What does a credit balance on an individual sales ledger account indicate?', topic: 'Sales Ledger Control Account', difficulty: 'medium', syllabusRef: '2.3',
    aiExplanation: 'Normally debit (customer owes us). A credit balance means the customer overpaid — we owe them. Should be reclassified as a current liability.',
    options: [{ text: 'Customer owes us money', correct: false, explanation: 'That is a debit balance.' },{ text: 'We owe the customer (overpayment)', correct: true, explanation: 'Correct!' },{ text: 'Account written off', correct: false, explanation: 'Written off = zero balance.' },{ text: 'Error in the account', correct: false, explanation: 'Can be legitimate (overpayment).' }] },
  { questionText: 'Which is a debit entry in the Purchase Ledger Control Account?', topic: 'Purchase Ledger Control Account', difficulty: 'easy', syllabusRef: '3.1',
    aiExplanation: 'PLCA debits reduce what we owe: payments, purchase returns, discounts received, contra entries.',
    options: [{ text: 'Credit purchases', correct: false, explanation: 'CREDIT — increases what we owe.' },{ text: 'Payments to suppliers', correct: true, explanation: 'Correct! Reduces what we owe.' },{ text: 'Opening credit balance', correct: false, explanation: 'Brought forward on credit side.' },{ text: 'Carriage inwards', correct: false, explanation: 'Not posted to PLCA directly.' }] },
  { questionText: 'PLCA closing £8,750 but individual supplier balances total £8,920. Difference £170. Likely cause?', topic: 'Purchase Ledger Control Account', difficulty: 'hard', syllabusRef: '3.2',
    aiExplanation: 'PLCA is £170 less. A payment of £170 was posted to PLCA (reducing it) but not to the individual supplier account.',
    options: [{ text: 'Invoice £170 omitted from individual account', correct: false, explanation: 'Would make individuals LESS.' },{ text: 'Payment £170 posted to PLCA but not individual', correct: true, explanation: 'Correct!' },{ text: 'Both records correct', correct: false, explanation: '£170 difference = error.' },{ text: 'Purchase £170 posted twice to PLCA', correct: false, explanation: 'Would make PLCA HIGHER.' }] },
  { questionText: 'A contra entry between SLCA and PLCA arises when:', topic: 'Control Accounts', difficulty: 'medium', syllabusRef: '2.4',
    aiExplanation: 'A contra occurs when the same person/company is both a customer and a supplier. Instead of paying each other, the balances are offset. DR PLCA (reduce what we owe), CR SLCA (reduce what they owe us).',
    options: [{ text: 'A customer is also a supplier', correct: true, explanation: 'Correct! Balances are offset.' },{ text: 'The bank makes an error', correct: false, explanation: 'Bank errors don\'t create control account contras.' },{ text: 'VAT needs adjusting', correct: false, explanation: 'VAT adjustments go to VAT control.' },{ text: 'The owner takes goods', correct: false, explanation: 'That is drawings.' }] },
  { questionText: 'The purpose of control accounts is to:', topic: 'Control Accounts', difficulty: 'easy', syllabusRef: '2.5',
    aiExplanation: 'Control accounts provide a summary check on the individual ledger accounts. They help detect errors, provide a quick total for the trial balance, and act as an internal control.',
    options: [{ text: 'Replace the individual ledger accounts', correct: false, explanation: 'Both are maintained.' },{ text: 'Provide a summary check on individual ledger balances', correct: true, explanation: 'Correct!' },{ text: 'Record VAT', correct: false, explanation: 'VAT has its own control account.' },{ text: 'Prepare the bank reconciliation', correct: false, explanation: 'Different purpose.' }] },
  { questionText: 'An aged receivables analysis shows Customer X: Current £500, 30 days £200, 60+ days £800. What should management investigate?', topic: 'Sales Ledger Control Account', difficulty: 'medium', syllabusRef: '2.6',
    aiExplanation: 'The 60+ days balance of £800 is overdue and at higher risk of becoming irrecoverable. Management should follow up on old debts, consider credit limits, and assess whether a provision is needed.',
    options: [{ text: 'The current £500 — it is the most recent', correct: false, explanation: 'Current debts are not overdue.' },{ text: 'The 60+ days £800 — highest risk of non-payment', correct: true, explanation: 'Correct! Oldest debts need most attention.' },{ text: 'All amounts equally', correct: false, explanation: 'Priority should be on overdue amounts.' },{ text: 'None — all will be paid eventually', correct: false, explanation: 'Older debts have higher default risk.' }] },
  { questionText: 'Discounts received are recorded in the PLCA as a:', topic: 'Purchase Ledger Control Account', difficulty: 'easy', syllabusRef: '3.3',
    aiExplanation: 'Discounts received reduce what we owe to suppliers. This is a DEBIT entry in the PLCA (reducing the liability). The credit goes to the Discounts Received account (income).',
    options: [{ text: 'Debit entry', correct: true, explanation: 'Correct! Reduces what we owe.' },{ text: 'Credit entry', correct: false, explanation: 'Credits increase what we owe.' },{ text: 'Not recorded in PLCA', correct: false, explanation: 'Must be recorded to keep control account accurate.' },{ text: 'Memorandum only', correct: false, explanation: 'It is a full double-entry item.' }] },
  { questionText: 'If the SLCA balance does not agree with the list of individual balances, this could indicate:', topic: 'Sales Ledger Control Account', difficulty: 'medium', syllabusRef: '2.7',
    aiExplanation: 'Disagreement suggests: a posting error in individual accounts, a casting (addition) error in the control account or individual accounts, an entry in one but not the other, or a transposition error.',
    options: [{ text: 'The trial balance is wrong', correct: false, explanation: 'TB uses the control account, which may be correct.' },{ text: 'An error in either the control account or individual accounts', correct: true, explanation: 'Correct!' },{ text: 'The bank reconciliation is incomplete', correct: false, explanation: 'Bank rec is separate.' },{ text: 'VAT has been miscalculated', correct: false, explanation: 'VAT is in its own account.' }] },
  // --- VAT Control (8) ---
  { questionText: 'Output VAT £4,200, input VAT £2,800. VAT liability?', topic: 'VAT Control Account', difficulty: 'easy', syllabusRef: '4.1',
    aiExplanation: 'VAT liability = Output - Input = £4,200-£2,800 = £1,400 payable to HMRC.',
    options: [{ text: '£1,400 payable to HMRC', correct: true, explanation: 'Correct!' },{ text: '£1,400 refund from HMRC', correct: false, explanation: 'Output exceeds input = we owe HMRC.' },{ text: '£7,000', correct: false, explanation: 'Added both.' },{ text: '£4,200', correct: false, explanation: 'Must deduct input VAT.' }] },
  { questionText: 'Which side of the VAT control account records output VAT?', topic: 'VAT Control Account', difficulty: 'easy', syllabusRef: '4.2',
    aiExplanation: 'Output VAT is a liability (owed to HMRC). Liabilities increase on the credit side.',
    options: [{ text: 'Debit', correct: false, explanation: 'Debit is for input VAT.' },{ text: 'Credit', correct: true, explanation: 'Correct! Liability = credit.' },{ text: 'Either', correct: false, explanation: 'Always credit.' },{ text: 'Not recorded there', correct: false, explanation: 'Both output and input go in VAT control.' }] },
  { questionText: 'Business buys computer £600 plus 20% VAT for office use. Input VAT reclaimable?', topic: 'VAT Control Account', difficulty: 'easy', syllabusRef: '4.3',
    aiExplanation: 'VAT on business capital items is reclaimable. 20% × £600 = £120.',
    options: [{ text: '£120', correct: true, explanation: 'Correct!' },{ text: '£0', correct: false, explanation: 'Capital items VAT IS reclaimable.' },{ text: '£600', correct: false, explanation: 'That is the net cost.' },{ text: '£720', correct: false, explanation: 'That is the gross amount.' }] },
  { questionText: 'On the UK VAT return, which box shows output VAT?', topic: 'VAT Control Account', difficulty: 'medium', syllabusRef: '4.4',
    aiExplanation: 'Box 1: VAT due on sales (output). Box 4: VAT reclaimed (input). Box 5: net payable/reclaimable.',
    options: [{ text: 'Box 1', correct: true, explanation: 'Correct!' },{ text: 'Box 4', correct: false, explanation: 'Box 4 = input VAT.' },{ text: 'Box 5', correct: false, explanation: 'Box 5 = net amount.' },{ text: 'Box 6', correct: false, explanation: 'Box 6 = total sales value.' }] },
  { questionText: 'A business makes only zero-rated supplies. Can it reclaim input VAT?', topic: 'VAT Control Account', difficulty: 'medium', syllabusRef: '4.5',
    aiExplanation: 'Yes! Zero-rated is different from exempt. Zero-rated businesses charge VAT at 0% on sales but CAN still reclaim input VAT on purchases. Exempt businesses cannot reclaim input VAT.',
    options: [{ text: 'Yes — zero-rated businesses can reclaim input VAT', correct: true, explanation: 'Correct! Zero-rated ≠ exempt.' },{ text: 'No — no output VAT means no input reclaim', correct: false, explanation: 'Zero-rated businesses CAN reclaim.' },{ text: 'Only on capital items', correct: false, explanation: 'Can reclaim on all business purchases.' },{ text: 'Only if registered voluntarily', correct: false, explanation: 'Registration status determines this, but zero-rated can always reclaim.' }] },
  { questionText: 'What is the current UK VAT registration threshold (2024/25)?', topic: 'VAT Control Account', difficulty: 'easy', syllabusRef: '4.6',
    aiExplanation: 'The UK VAT registration threshold is £90,000 (from April 2024). Businesses with taxable turnover exceeding this must register for VAT.',
    options: [{ text: '£85,000', correct: false, explanation: 'This was the previous threshold.' },{ text: '£90,000', correct: true, explanation: 'Correct! From April 2024.' },{ text: '£100,000', correct: false, explanation: 'Too high.' },{ text: '£50,000', correct: false, explanation: 'Too low.' }] },
  { questionText: 'A VAT-registered business sells exempt goods. The input VAT on purchases related to those goods is:', topic: 'VAT Control Account', difficulty: 'hard', syllabusRef: '4.7',
    aiExplanation: 'Input VAT on purchases related to exempt supplies CANNOT be reclaimed. If a business makes both taxable and exempt supplies, it must use partial exemption rules to determine how much input VAT is reclaimable.',
    options: [{ text: 'Fully reclaimable', correct: false, explanation: 'Input VAT on exempt supplies is NOT reclaimable.' },{ text: 'Not reclaimable — it is a cost to the business', correct: true, explanation: 'Correct!' },{ text: 'Reclaimable at 50%', correct: false, explanation: 'Partial exemption has specific rules, not a flat 50%.' },{ text: 'Paid directly to HMRC', correct: false, explanation: 'It is absorbed as a cost, not paid separately.' }] },
  { questionText: 'The VAT control account has a credit balance of £2,100 at quarter end. This means:', topic: 'VAT Control Account', difficulty: 'easy', syllabusRef: '4.8',
    aiExplanation: 'A credit balance on the VAT control account means output VAT exceeds input VAT — the business owes £2,100 to HMRC. A debit balance would mean HMRC owes the business.',
    options: [{ text: 'HMRC owes the business £2,100', correct: false, explanation: 'A debit balance would mean this.' },{ text: 'The business owes HMRC £2,100', correct: true, explanation: 'Correct! Credit balance = liability to HMRC.' },{ text: 'There is an error', correct: false, explanation: 'A credit balance is normal when output > input.' },{ text: 'The VAT return has been filed', correct: false, explanation: 'The balance shows what is owed, not filing status.' }] },
  // --- Journal Entries & Errors (12) ---
  { questionText: 'Which transaction is typically recorded using a journal entry?', topic: 'Journal Entries', difficulty: 'easy', syllabusRef: '5.1',
    aiExplanation: 'Journals record: opening entries, corrections, non-current asset transactions, irrecoverable debts, year-end adjustments.',
    options: [{ text: 'Credit sale to customer', correct: false, explanation: 'Goes in sales day book.' },{ text: 'Bank payment to supplier', correct: false, explanation: 'Goes in cash book.' },{ text: 'Writing off an irrecoverable debt', correct: true, explanation: 'Correct!' },{ text: 'Petty cash reimbursement', correct: false, explanation: 'Goes in cash book/petty cash book.' }] },
  { questionText: 'A journal entry must always include a:', topic: 'Journal Entries', difficulty: 'easy', syllabusRef: '5.2',
    aiExplanation: 'Every journal needs: date, accounts, amounts, and a narrative (explanation). Journals should also be authorised.',
    options: [{ text: 'Bank statement reference', correct: false, explanation: 'Journals often don\'t involve bank.' },{ text: 'Narrative explaining the transaction', correct: true, explanation: 'Correct!' },{ text: 'Customer account number', correct: false, explanation: 'Not all journals involve customers.' },{ text: 'VAT amount', correct: false, explanation: 'Not all journals have VAT.' }] },
  { questionText: 'Motor expenses £500 debited to motor vehicles account. Error type?', topic: 'Error Correction', difficulty: 'easy', syllabusRef: '6.1',
    aiExplanation: 'Error of principle — revenue expenditure posted to a capital (asset) account. Wrong CLASS of account.',
    options: [{ text: 'Commission', correct: false, explanation: 'Commission = wrong account, same type.' },{ text: 'Principle', correct: true, explanation: 'Correct! Wrong type of account.' },{ text: 'Original entry', correct: false, explanation: 'Amount is correct.' },{ text: 'Omission', correct: false, explanation: 'It was recorded.' }] },
  { questionText: '£200 sale to Customer A credited to purchases instead of sales. Correction journal?', topic: 'Error Correction', difficulty: 'hard', syllabusRef: '6.2',
    aiExplanation: 'SLCA debit was correct. Wrong credit: purchases instead of sales. Correction: DR Purchases £200, CR Sales £200.',
    options: [{ text: 'DR Purchases £200, CR Sales £200', correct: true, explanation: 'Correct!' },{ text: 'DR Sales £200, CR Purchases £200', correct: false, explanation: 'Reversed — makes it worse.' },{ text: 'DR SLCA £200, CR Sales £200', correct: false, explanation: 'SLCA was already correct.' },{ text: 'DR Purchases £400, CR Sales £400', correct: false, explanation: 'Only £200 to correct.' }] },
  { questionText: 'A compensating error occurs when:', topic: 'Error Correction', difficulty: 'medium', syllabusRef: '6.3',
    aiExplanation: 'Two errors of equal amount cancel each other out, so the trial balance still balances.',
    options: [{ text: 'Transaction completely omitted', correct: false, explanation: 'Error of omission.' },{ text: 'Two equal errors cancel each other out', correct: true, explanation: 'Correct!' },{ text: 'Entry posted to wrong account same type', correct: false, explanation: 'Error of commission.' },{ text: 'Wrong amount on both sides', correct: false, explanation: 'Error of original entry.' }] },
  { questionText: 'Sale of £670 recorded as £760 in both SLCA and sales. Error type?', topic: 'Error Correction', difficulty: 'easy', syllabusRef: '6.4',
    aiExplanation: 'Wrong amount entered at source and carried through both sides. Error of original entry.',
    options: [{ text: 'Original entry', correct: true, explanation: 'Correct!' },{ text: 'Transposition', correct: false, explanation: '670→760 is not a digit swap.' },{ text: 'Commission', correct: false, explanation: 'Accounts are correct.' },{ text: 'Reversal', correct: false, explanation: 'Sides are correct.' }] },
  { questionText: 'A complete reversal of entries means:', topic: 'Error Correction', difficulty: 'medium', syllabusRef: '6.5',
    aiExplanation: 'Correct accounts used but debit and credit are swapped. TB still balances.',
    options: [{ text: 'Correct accounts but debit/credit swapped', correct: true, explanation: 'Correct!' },{ text: 'Wrong accounts used', correct: false, explanation: 'Commission or principle error.' },{ text: 'Transaction omitted', correct: false, explanation: 'Omission error.' },{ text: 'Trial balance won\'t balance', correct: false, explanation: 'Reversal errors DON\'T affect TB balance.' }] },
  { questionText: 'When is a suspense account used?', topic: 'Suspense Accounts', difficulty: 'easy', syllabusRef: '7.1',
    aiExplanation: 'Temporary account to hold TB difference until errors found, or for unidentified transactions.',
    options: [{ text: 'Record all cash transactions', correct: false, explanation: 'Cash book does that.' },{ text: 'Temporarily hold TB difference until errors found', correct: true, explanation: 'Correct!' },{ text: 'Record VAT', correct: false, explanation: 'VAT control does that.' },{ text: 'Replace bank account', correct: false, explanation: 'Different purpose.' }] },
  { questionText: 'Suspense DR £300. Found: rent debit £300 was omitted. Correction?', topic: 'Suspense Accounts', difficulty: 'hard', syllabusRef: '7.2',
    aiExplanation: 'Missing debit caused TB imbalance. Post: DR Rent £300, CR Suspense £300. Clears the suspense.',
    options: [{ text: 'DR Rent £300, CR Suspense £300', correct: true, explanation: 'Correct!' },{ text: 'DR Suspense £300, CR Rent £300', correct: false, explanation: 'Reversed.' },{ text: 'DR Rent £600, CR Suspense £600', correct: false, explanation: 'Only £300 missing.' },{ text: 'DR Bank £300, CR Suspense £300', correct: false, explanation: 'Error was about rent.' }] },
  { questionText: 'Once all errors corrected, the suspense account balance should be:', topic: 'Suspense Accounts', difficulty: 'easy', syllabusRef: '7.4',
    aiExplanation: 'Suspense is temporary. When all errors are found and corrected, the balance must be zero.',
    options: [{ text: 'Equal to original TB difference', correct: false, explanation: 'That means no corrections made.' },{ text: 'Zero', correct: true, explanation: 'Correct!' },{ text: 'Written off', correct: false, explanation: 'Must be investigated and cleared.' },{ text: 'Transferred to P&L', correct: false, explanation: 'Not an income/expense item.' }] },
  { questionText: 'An error of commission occurs when:', topic: 'Error Correction', difficulty: 'easy', syllabusRef: '6.6',
    aiExplanation: 'An entry is posted to the wrong account but of the SAME type. E.g., electricity debited to gas (both expenses). TB still balances.',
    options: [{ text: 'Entry posted to wrong account of the same type', correct: true, explanation: 'Correct! E.g., one expense account instead of another.' },{ text: 'Entry posted to wrong type of account', correct: false, explanation: 'That is error of principle.' },{ text: 'Entry completely omitted', correct: false, explanation: 'That is error of omission.' },{ text: 'Wrong amount recorded', correct: false, explanation: 'That is error of original entry.' }] },
  { questionText: 'Which errors are NOT revealed by the trial balance?', topic: 'Error Correction', difficulty: 'medium', syllabusRef: '6.7',
    aiExplanation: 'Six errors not revealed: Omission, Commission, Principle, Original entry, Reversal, Compensating. All leave the TB balanced. Only errors affecting one side (single entry, casting errors, extraction errors) cause TB imbalance.',
    options: [{ text: 'Only errors of omission', correct: false, explanation: 'Six types are not revealed.' },{ text: 'Omission, commission, principle, original entry, reversal, compensating', correct: true, explanation: 'Correct! All six leave TB balanced.' },{ text: 'All errors are revealed by the TB', correct: false, explanation: 'Many errors go undetected.' },{ text: 'Only casting errors', correct: false, explanation: 'Casting errors DO cause TB imbalance.' }] },
];

async function main() {
  console.log('\n🎓 Seeding L2 BKCL...\n');
  await seedModule('BKCL', BKCL);
  console.log('\n✅ Done!');
}
main().catch(console.error).finally(() => prisma.$disconnect());
