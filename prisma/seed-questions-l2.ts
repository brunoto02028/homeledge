/**
 * Level 2 Question Bank — Run: npx tsx prisma/seed-questions-l2.ts
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

// ==================== BTRN — 32 new questions ====================
const BTRN: QS[] = [
  { questionText: 'A credit sale of £1,200 plus VAT at 20% is made. What total is recorded in the sales day book?', topic: 'Sales & Purchase Day Books', difficulty: 'easy', syllabusRef: '2.1',
    aiExplanation: 'The sales day book records credit sales at gross (including VAT). Net £1,200 + VAT £240 = £1,440.',
    options: [{ text: '£1,200', correct: false, explanation: 'Net only — missing VAT.' },{ text: '£1,440', correct: true, explanation: 'Correct! £1,200 × 1.20 = £1,440.' },{ text: '£240', correct: false, explanation: 'VAT element only.' },{ text: '£1,000', correct: false, explanation: 'Unrelated figure.' }] },
  { questionText: 'Which transaction is recorded in the purchase day book?', topic: 'Sales & Purchase Day Books', difficulty: 'easy', syllabusRef: '2.2',
    aiExplanation: 'The purchase day book records credit purchases of goods for resale and expenses on credit. Cash purchases go in the cash book.',
    options: [{ text: 'Cash purchase of stationery', correct: false, explanation: 'Cash purchases go in the cash book.' },{ text: 'Credit purchase of goods from Supplier A', correct: true, explanation: 'Correct! Credit purchases go in the purchase day book.' },{ text: 'Owner withdrawing cash', correct: false, explanation: 'This is drawings, recorded in cash book.' },{ text: 'Bank loan received', correct: false, explanation: 'Loans go in the cash book.' }] },
  { questionText: 'A sales return of £360 including VAT at 20%. What is the net amount?', topic: 'Sales & Purchase Day Books', difficulty: 'medium', syllabusRef: '2.3',
    aiExplanation: 'To extract net from gross: £360 ÷ 1.20 = £300. VAT = £60.',
    options: [{ text: '£300', correct: true, explanation: 'Correct! £360 ÷ 1.20 = £300.' },{ text: '£288', correct: false, explanation: 'Incorrectly subtracts 20% from gross.' },{ text: '£72', correct: false, explanation: 'Wrong VAT calc.' },{ text: '£432', correct: false, explanation: 'Adds VAT to already-inclusive amount.' }] },
  { questionText: 'What is the correct posting from the sales day book to the general ledger?', topic: 'Sales & Purchase Day Books', difficulty: 'medium', syllabusRef: '2.4',
    aiExplanation: 'From SDB: DR SLCA (gross), CR Sales (net), CR VAT Control (VAT).',
    options: [{ text: 'DR Sales, CR SLCA', correct: false, explanation: 'Reversed.' },{ text: 'DR SLCA (gross), CR Sales (net), CR VAT (VAT)', correct: true, explanation: 'Correct! Control account debited, sales and VAT credited.' },{ text: 'DR Purchases, CR Bank', correct: false, explanation: 'Wrong accounts entirely.' },{ text: 'DR Bank, CR SLCA', correct: false, explanation: 'This records a receipt, not a credit sale.' }] },
  { questionText: 'Purchase returns day book total: Total £720, VAT £120, Net £600. What is the GL entry?', topic: 'Sales & Purchase Day Books', difficulty: 'hard', syllabusRef: '2.5',
    aiExplanation: 'Returns reduce what we owe. DR PLCA £720 (reduce liability), CR Purchase Returns £600, CR VAT £120.',
    options: [{ text: 'DR PLCA £720, CR Purchase Returns £600, CR VAT £120', correct: true, explanation: 'Correct! Reduce payables, credit returns and VAT.' },{ text: 'CR PLCA £720, DR Purchase Returns £600, DR VAT £120', correct: false, explanation: 'Reversed.' },{ text: 'DR Purchase Returns £720, CR PLCA £720', correct: false, explanation: 'Ignores VAT split.' },{ text: 'DR PLCA £600, CR Returns £600', correct: false, explanation: 'Uses net only, ignores VAT.' }] },
  { questionText: 'A business receives £500 from a customer and pays £300 to a supplier. Net effect on bank balance?', topic: 'Cash Book', difficulty: 'easy', syllabusRef: '3.1',
    aiExplanation: 'Receipt +£500, Payment -£300 = Net increase of £200.',
    options: [{ text: 'Increase of £200', correct: true, explanation: 'Correct! £500 - £300 = +£200.' },{ text: 'Decrease of £200', correct: false, explanation: 'Receipt exceeds payment.' },{ text: 'Increase of £800', correct: false, explanation: 'This adds both amounts.' },{ text: 'No change', correct: false, explanation: 'Amounts differ.' }] },
  { questionText: 'In a three-column cash book, what are the three money columns on each side?', topic: 'Cash Book', difficulty: 'easy', syllabusRef: '3.2',
    aiExplanation: 'The three columns are Discount, Cash, and Bank. Discount is a memorandum column.',
    options: [{ text: 'Cash, Bank, VAT', correct: false, explanation: 'VAT is not a standard column.' },{ text: 'Date, Details, Amount', correct: false, explanation: 'Those are description fields, not money columns.' },{ text: 'Discount, Cash, Bank', correct: true, explanation: 'Correct!' },{ text: 'Sales, Purchases, Bank', correct: false, explanation: 'Not cash book columns.' }] },
  { questionText: 'Customer pays £950 settling a £1,000 debt with £50 discount. Cash book debit side entries?', topic: 'Cash Book', difficulty: 'medium', syllabusRef: '3.3',
    aiExplanation: 'Bank column £950 (cash received) + Discount Allowed column £50 = total £1,000 clearing the debt.',
    options: [{ text: 'Bank £1,000', correct: false, explanation: 'Only £950 was received.' },{ text: 'Bank £950, Discount £50', correct: true, explanation: 'Correct! Together they clear the £1,000.' },{ text: 'Bank £950 only', correct: false, explanation: 'Misses the discount column.' },{ text: 'Cash £1,000, Discount £50', correct: false, explanation: 'Wrong bank amount.' }] },
  { questionText: 'A contra entry transfers £200 from cash to bank. Correct entry?', topic: 'Cash Book', difficulty: 'medium', syllabusRef: '3.4',
    aiExplanation: 'DR Bank £200 (money into bank), CR Cash £200 (money out of till). Both within the same cash book, marked "C".',
    options: [{ text: 'DR Cash £200, CR Bank £200', correct: false, explanation: 'Reversed — money goes TO bank.' },{ text: 'DR Bank £200, CR Cash £200', correct: true, explanation: 'Correct!' },{ text: 'DR Bank £200, CR Sales £200', correct: false, explanation: 'Sales not involved.' },{ text: 'DR Drawings £200, CR Cash £200', correct: false, explanation: 'Not drawings.' }] },
  { questionText: 'Which side of the cash book records payments?', topic: 'Cash Book', difficulty: 'easy', syllabusRef: '3.5',
    aiExplanation: 'Debit = receipts (money in). Credit = payments (money out).',
    options: [{ text: 'Debit (left) side', correct: false, explanation: 'Debit records receipts.' },{ text: 'Credit (right) side', correct: true, explanation: 'Correct! Payments go on the credit side.' },{ text: 'Either side', correct: false, explanation: 'Payments always go on credit side.' },{ text: 'Neither — payments go in purchase day book', correct: false, explanation: 'Cash payments go in the cash book.' }] },
  { questionText: 'Petty cash float £200. Vouchers: postage £18, cleaning £35, tea £12, taxi £25. Reimbursement needed?', topic: 'Petty Cash', difficulty: 'easy', syllabusRef: '4.1',
    aiExplanation: 'Total vouchers: £18+£35+£12+£25=£90. Reimbursement = £90 to restore float.',
    options: [{ text: '£90', correct: true, explanation: 'Correct! Sum of vouchers.' },{ text: '£110', correct: false, explanation: 'That is cash remaining, not reimbursement.' },{ text: '£200', correct: false, explanation: 'That is the full float.' },{ text: '£290', correct: false, explanation: 'Adds float + vouchers.' }] },
  { questionText: 'Why must petty cash vouchers be authorised before payment?', topic: 'Petty Cash', difficulty: 'easy', syllabusRef: '4.2',
    aiExplanation: 'Authorisation is an internal control ensuring the expense is legitimate and for business purposes.',
    options: [{ text: 'To ensure the payment is for a legitimate business expense', correct: true, explanation: 'Correct! Key internal control.' },{ text: 'To calculate VAT', correct: false, explanation: 'VAT is separate from authorisation.' },{ text: 'To post to the general ledger', correct: false, explanation: 'Posting happens later.' },{ text: 'To balance the petty cash book', correct: false, explanation: 'Balancing is a separate process.' }] },
  { questionText: 'Petty cash float £100. Cash counted £23.60, vouchers £74.20. What does this indicate?', topic: 'Petty Cash', difficulty: 'hard', syllabusRef: '4.4',
    aiExplanation: 'Cash + Vouchers should = Float. £23.60+£74.20=£97.80. Float=£100. Shortage of £2.20.',
    options: [{ text: 'Everything correct', correct: false, explanation: '£97.80 ≠ £100.' },{ text: 'Shortage of £2.20', correct: true, explanation: 'Correct! £100-£97.80=£2.20 unaccounted.' },{ text: 'Surplus of £2.20', correct: false, explanation: 'Less than expected = shortage.' },{ text: 'Reimbursement needed is £100', correct: false, explanation: 'Shortage needs investigating first.' }] },
  { questionText: 'Which account normally has a debit balance on the trial balance?', topic: 'Trial Balance', difficulty: 'easy', syllabusRef: '5.1',
    aiExplanation: 'DEAD CLIC: Debits = Expenses, Assets, Drawings. Credits = Liabilities, Income, Capital.',
    options: [{ text: 'Sales', correct: false, explanation: 'Income = credit.' },{ text: 'Trade payables', correct: false, explanation: 'Liability = credit.' },{ text: 'Rent expense', correct: true, explanation: 'Correct! Expenses = debit.' },{ text: 'Capital', correct: false, explanation: 'Capital = credit.' }] },
  { questionText: 'Trial balance: debits £45,600, credits £45,200. What should be done?', topic: 'Trial Balance', difficulty: 'medium', syllabusRef: '5.2',
    aiExplanation: 'Difference of £400. Open a suspense account with CREDIT balance of £400 to balance temporarily.',
    options: [{ text: 'Add £400 to sales', correct: false, explanation: 'Never adjust figures to force balance.' },{ text: 'Open suspense with credit balance £400', correct: true, explanation: 'Correct! Temporary until error found.' },{ text: 'Ignore the difference', correct: false, explanation: 'All differences must be investigated.' },{ text: 'Open suspense with debit balance £400', correct: false, explanation: 'Debits exceed credits, so suspense needs CREDIT.' }] },
  { questionText: 'Which error would cause the trial balance NOT to balance?', topic: 'Trial Balance', difficulty: 'medium', syllabusRef: '5.3',
    aiExplanation: 'A single-entry error (posting only one side) causes an imbalance. Errors of omission, commission, principle, original entry all leave the TB balanced.',
    options: [{ text: 'Error of omission', correct: false, explanation: 'Both sides missed — TB still balances.' },{ text: 'Error of original entry', correct: false, explanation: 'Wrong amount on both sides — TB balances.' },{ text: 'Single-entry error', correct: true, explanation: 'Correct! Only one side posted.' },{ text: 'Error of commission', correct: false, explanation: 'Wrong account same type — TB balances.' }] },
  { questionText: 'A goods received note (GRN) is used to:', topic: 'Source Documents', difficulty: 'easy', syllabusRef: '6.1',
    aiExplanation: 'A GRN is prepared internally when goods are delivered, confirming what was actually received.',
    options: [{ text: 'Request goods from a supplier', correct: false, explanation: 'That is a purchase order.' },{ text: 'Record the goods actually received', correct: true, explanation: 'Correct!' },{ text: 'Invoice a customer', correct: false, explanation: 'That is a sales invoice.' },{ text: 'Record a return to supplier', correct: false, explanation: 'That is a debit note.' }] },
  { questionText: 'Which document does a seller issue to correct an overcharge?', topic: 'Source Documents', difficulty: 'easy', syllabusRef: '6.2',
    aiExplanation: 'A credit note is issued by the seller to reduce the amount the buyer owes.',
    options: [{ text: 'Debit note', correct: false, explanation: 'Issued by the buyer.' },{ text: 'Credit note', correct: true, explanation: 'Correct!' },{ text: 'Purchase order', correct: false, explanation: 'Used to order goods.' },{ text: 'Remittance advice', correct: false, explanation: 'Accompanies a payment.' }] },
  { questionText: 'Correct sequence of documents in a credit purchase?', topic: 'Source Documents', difficulty: 'medium', syllabusRef: '6.3',
    aiExplanation: 'Order → Delivery note → Invoice → Payment.',
    options: [{ text: 'Invoice → Order → Delivery → Payment', correct: false, explanation: 'Order comes before invoice.' },{ text: 'Order → Delivery note → Invoice → Payment', correct: true, explanation: 'Correct!' },{ text: 'Payment → Invoice → Order → Delivery', correct: false, explanation: 'Payment comes last.' },{ text: 'Delivery → Order → Invoice → Credit note', correct: false, explanation: 'Order must come first.' }] },
  { questionText: 'A remittance advice is sent by:', topic: 'Source Documents', difficulty: 'easy', syllabusRef: '6.4',
    aiExplanation: 'Sent by the buyer to the seller along with payment, listing which invoices are being paid.',
    options: [{ text: 'The seller to request payment', correct: false, explanation: 'Seller sends invoices/statements.' },{ text: 'The buyer to accompany a payment', correct: true, explanation: 'Correct!' },{ text: 'The bank to confirm a transaction', correct: false, explanation: 'Bank sends statements.' },{ text: 'HMRC to confirm tax payment', correct: false, explanation: 'HMRC has its own system.' }] },
  { questionText: 'A business pays rent £800 by bank transfer. Double entry?', topic: 'Double Entry Principles', difficulty: 'easy', syllabusRef: '1.7',
    aiExplanation: 'DR Rent £800 (expense up), CR Bank £800 (asset down).',
    options: [{ text: 'DR Bank, CR Rent', correct: false, explanation: 'Reversed.' },{ text: 'DR Rent £800, CR Bank £800', correct: true, explanation: 'Correct!' },{ text: 'DR Rent, CR Capital', correct: false, explanation: 'Capital not involved.' },{ text: 'DR Purchases, CR Bank', correct: false, explanation: 'Rent is not purchases.' }] },
  { questionText: 'Owner introduces personal car worth £8,000 into the business. Double entry?', topic: 'Double Entry Principles', difficulty: 'medium', syllabusRef: '1.8',
    aiExplanation: 'DR Motor Vehicles £8,000 (asset up), CR Capital £8,000 (equity up). Capital introduced.',
    options: [{ text: 'DR Motor Vehicles, CR Bank', correct: false, explanation: 'No bank payment.' },{ text: 'DR Motor Vehicles £8,000, CR Capital £8,000', correct: true, explanation: 'Correct!' },{ text: 'DR Capital, CR Motor Vehicles', correct: false, explanation: 'Reversed.' },{ text: 'DR Drawings, CR Motor Vehicles', correct: false, explanation: 'Drawings = taking OUT, not putting IN.' }] },
  { questionText: 'Which increases a liability?', topic: 'Double Entry Principles', difficulty: 'easy', syllabusRef: '1.9',
    aiExplanation: 'Credits increase liabilities, income, and capital. Debits decrease them.',
    options: [{ text: 'A debit entry', correct: false, explanation: 'Debits decrease liabilities.' },{ text: 'A credit entry', correct: true, explanation: 'Correct!' },{ text: 'Either', correct: false, explanation: 'Only credits.' },{ text: 'A journal entry', correct: false, explanation: 'Depends which side.' }] },
  { questionText: 'Business receives £2,000 bank loan. Double entry?', topic: 'Double Entry Principles', difficulty: 'easy', syllabusRef: '1.10',
    aiExplanation: 'DR Bank £2,000 (asset up), CR Loan £2,000 (liability up).',
    options: [{ text: 'DR Bank £2,000, CR Loan £2,000', correct: true, explanation: 'Correct!' },{ text: 'DR Loan, CR Bank', correct: false, explanation: 'That would be repaying a loan.' },{ text: 'DR Bank, CR Capital', correct: false, explanation: 'A loan is not capital.' },{ text: 'DR Bank, CR Sales', correct: false, explanation: 'A loan is not sales.' }] },
  { questionText: 'The accounting equation is:', topic: 'Double Entry Principles', difficulty: 'easy', syllabusRef: '1.11',
    aiExplanation: 'Assets = Liabilities + Capital. Must always balance.',
    options: [{ text: 'Assets = Liabilities - Capital', correct: false, explanation: 'Capital is added, not subtracted.' },{ text: 'Assets + Liabilities = Capital', correct: false, explanation: 'Assets and liabilities are on opposite sides.' },{ text: 'Assets = Liabilities + Capital', correct: true, explanation: 'Correct!' },{ text: 'Assets = Capital - Liabilities', correct: false, explanation: 'Liabilities are added to capital.' }] },
  { questionText: 'Customer J Brown cannot pay £450 debt — written off as irrecoverable. Double entry?', topic: 'Double Entry Principles', difficulty: 'hard', syllabusRef: '1.12',
    aiExplanation: 'DR Irrecoverable Debts £450 (expense), CR Trade Receivables £450 (remove the debt).',
    options: [{ text: 'DR Trade Receivables, CR Irrecoverable Debts', correct: false, explanation: 'Reversed — increases receivables.' },{ text: 'DR Irrecoverable Debts £450, CR Trade Receivables £450', correct: true, explanation: 'Correct!' },{ text: 'DR Bank, CR Trade Receivables', correct: false, explanation: 'No money received.' },{ text: 'DR Irrecoverable Debts, CR Bank', correct: false, explanation: 'Bank not involved.' }] },
  { questionText: 'Opening inventory £5,000, purchases £30,000, closing inventory £7,000. Cost of goods sold?', topic: 'Double Entry Principles', difficulty: 'medium', syllabusRef: '1.13',
    aiExplanation: 'COGS = Opening + Purchases - Closing = £5,000 + £30,000 - £7,000 = £28,000.',
    options: [{ text: '£28,000', correct: true, explanation: 'Correct!' },{ text: '£42,000', correct: false, explanation: 'Adds all three.' },{ text: '£32,000', correct: false, explanation: 'Forgot to deduct closing.' },{ text: '£25,000', correct: false, explanation: 'Arithmetic error.' }] },
  { questionText: 'Owner takes goods costing £200 for personal use. Double entry?', topic: 'Double Entry Principles', difficulty: 'medium', syllabusRef: '1.14',
    aiExplanation: 'DR Drawings £200 (reduces equity), CR Purchases £200 (reduces cost of goods).',
    options: [{ text: 'DR Drawings £200, CR Purchases £200', correct: true, explanation: 'Correct!' },{ text: 'DR Drawings, CR Bank', correct: false, explanation: 'No cash involved — goods taken.' },{ text: 'DR Purchases, CR Drawings', correct: false, explanation: 'Reversed.' },{ text: 'DR Drawings, CR Sales', correct: false, explanation: 'Goods at cost, not selling price.' }] },
  { questionText: 'Which is NOT a book of prime entry?', topic: 'Books of Prime Entry', difficulty: 'easy', syllabusRef: '1.15',
    aiExplanation: 'Books of prime entry: sales day book, purchase day book, returns day books, cash book, petty cash book, journal. The general ledger is NOT — it receives postings FROM books of prime entry.',
    options: [{ text: 'Sales day book', correct: false, explanation: 'IS a book of prime entry.' },{ text: 'Cash book', correct: false, explanation: 'IS a book of prime entry.' },{ text: 'General ledger', correct: true, explanation: 'Correct! GL receives postings from books of prime entry.' },{ text: 'Journal', correct: false, explanation: 'IS a book of prime entry.' }] },
  { questionText: 'What does "folio" mean in the context of bookkeeping?', topic: 'Books of Prime Entry', difficulty: 'easy', syllabusRef: '1.16',
    aiExplanation: 'A folio reference is a cross-reference number showing where an entry has been posted to or from. It creates an audit trail between books of prime entry and the ledger accounts.',
    options: [{ text: 'The date of a transaction', correct: false, explanation: 'Date is a separate column.' },{ text: 'A cross-reference to another book or account', correct: true, explanation: 'Correct! Creates an audit trail.' },{ text: 'The total of a page', correct: false, explanation: 'Page totals are "carried down/brought down".' },{ text: 'The signature of the bookkeeper', correct: false, explanation: 'Authorisation is separate.' }] },
  { questionText: 'Trade discount of 10% is given on goods listed at £500. What amount is recorded in the sales day book?', topic: 'Sales & Purchase Day Books', difficulty: 'medium', syllabusRef: '2.6',
    aiExplanation: 'Trade discount is deducted BEFORE recording. £500 - 10% = £450 net. This is the amount that goes in the sales day book (before VAT). Trade discounts are NOT recorded in the accounts — only the net amount is.',
    options: [{ text: '£500', correct: false, explanation: 'Must deduct trade discount first.' },{ text: '£450', correct: true, explanation: 'Correct! £500 - 10% = £450.' },{ text: '£50', correct: false, explanation: 'That is just the discount amount.' },{ text: '£540', correct: false, explanation: 'Would need to add VAT separately, and this isn\'t £450 + VAT.' }] },
];

async function main() {
  console.log('\n🎓 Seeding Level 2 Questions...\n');
  await seedModule('BTRN', BTRN);
  console.log('\n✅ Level 2 BTRN seeding complete!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
