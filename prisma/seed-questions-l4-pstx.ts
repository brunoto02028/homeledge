/**
 * Level 4 PSTX — Personal Tax (40 questions)
 * Run: npx tsx prisma/seed-questions-l4-pstx.ts
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

const PSTX: QS[] = [
  // --- Income Tax Computation (10) ---
  { questionText: 'The UK personal allowance for 2024/25 is:', topic: 'Income Tax Computation', difficulty: 'easy', syllabusRef: '1.1',
    aiExplanation: 'The personal allowance is £12,570 for 2024/25. It is reduced by £1 for every £2 of adjusted net income over £100,000, fully lost at £125,140.',
    options: [{ text: '£12,570', correct: true, explanation: 'Correct!' },{ text: '£12,500', correct: false, explanation: 'That was a previous year.' },{ text: '£10,000', correct: false, explanation: 'Too low.' },{ text: '£15,000', correct: false, explanation: 'Too high.' }] },
  { questionText: 'The basic rate of income tax for 2024/25 is:', topic: 'Tax Bands & Rates', difficulty: 'easy', syllabusRef: '1.2',
    aiExplanation: 'Basic rate: 20% on taxable income up to £37,700. Higher rate: 40% on £37,701-£125,140. Additional rate: 45% over £125,140.',
    options: [{ text: '20%', correct: true, explanation: 'Correct!' },{ text: '25%', correct: false, explanation: 'That is the CT main rate.' },{ text: '40%', correct: false, explanation: 'That is the higher rate.' },{ text: '10%', correct: false, explanation: 'Savings starter rate, not basic rate.' }] },
  { questionText: 'The order of taxation for income tax is:', topic: 'Income Tax Computation', difficulty: 'medium', syllabusRef: '1.3',
    aiExplanation: 'Income is taxed in this order: (1) Non-savings income (employment, trading, property, pensions), (2) Savings income (interest), (3) Dividend income. This order matters because different types have different rates and allowances.',
    options: [{ text: 'Non-savings, savings, dividends', correct: true, explanation: 'Correct!' },{ text: 'Dividends, savings, non-savings', correct: false, explanation: 'Reversed.' },{ text: 'All income taxed equally', correct: false, explanation: 'Different types have different rates.' },{ text: 'Employment first, then everything else', correct: false, explanation: 'Employment is non-savings, but all non-savings taxed together.' }] },
  { questionText: 'Employment income of £60,000, no other income. Income tax payable (2024/25)?', topic: 'Income Tax Computation', difficulty: 'medium', syllabusRef: '1.4',
    aiExplanation: 'Taxable income = £60,000 - £12,570 PA = £47,430. Basic rate (20%): £37,700 × 20% = £7,540. Higher rate (40%): (£47,430-£37,700) × 40% = £9,730 × 40% = £3,892. Total = £7,540 + £3,892 = £11,432.',
    options: [{ text: '£11,432', correct: true, explanation: 'Correct!' },{ text: '£12,000', correct: false, explanation: 'Approximate but not exact.' },{ text: '£9,486', correct: false, explanation: 'Check higher rate calculation.' },{ text: '£7,540', correct: false, explanation: 'Basic rate only — missing higher rate portion.' }] },
  { questionText: 'The personal allowance starts to be reduced when adjusted net income exceeds:', topic: 'Income Tax Computation', difficulty: 'easy', syllabusRef: '1.5',
    aiExplanation: 'Personal allowance reduced by £1 for every £2 over £100,000. Fully lost at £125,140 (£100,000 + 2 × £12,570). This creates an effective 60% marginal rate in this band.',
    options: [{ text: '£100,000', correct: true, explanation: 'Correct!' },{ text: '£125,140', correct: false, explanation: 'That is where it is fully lost.' },{ text: '£50,000', correct: false, explanation: 'Too low.' },{ text: '£150,000', correct: false, explanation: 'Additional rate threshold.' }] },
  { questionText: 'The dividend allowance for 2024/25 is:', topic: 'Dividend Income', difficulty: 'easy', syllabusRef: '1.6',
    aiExplanation: 'The dividend allowance is £500 for 2024/25 (reduced from £1,000 in 2023/24 and £2,000 in 2022/23). Dividends within this allowance are taxed at 0%.',
    options: [{ text: '£500', correct: true, explanation: 'Correct!' },{ text: '£1,000', correct: false, explanation: '2023/24 figure.' },{ text: '£2,000', correct: false, explanation: '2022/23 figure.' },{ text: '£5,000', correct: false, explanation: 'Original figure from 2016.' }] },
  { questionText: 'Dividend tax rates for 2024/25 are:', topic: 'Dividend Income', difficulty: 'easy', syllabusRef: '1.7',
    aiExplanation: 'Basic rate: 8.75%. Higher rate: 33.75%. Additional rate: 39.35%. These are lower than non-savings rates because dividends are paid from post-tax corporate profits.',
    options: [{ text: '8.75% / 33.75% / 39.35%', correct: true, explanation: 'Correct!' },{ text: '20% / 40% / 45%', correct: false, explanation: 'Those are non-savings rates.' },{ text: '10% / 32.5% / 38.1%', correct: false, explanation: 'Pre-2022 rates.' },{ text: '0% / 20% / 40%', correct: false, explanation: 'Not dividend rates.' }] },
  { questionText: 'The savings nil rate band (Personal Savings Allowance) for a basic rate taxpayer is:', topic: 'Income Tax Computation', difficulty: 'easy', syllabusRef: '1.8',
    aiExplanation: 'PSA: Basic rate taxpayer = £1,000 tax-free savings interest. Higher rate = £500. Additional rate = £0. Plus the savings starter rate of £5,000 is available if non-savings income is below the personal allowance + £5,000.',
    options: [{ text: '£1,000', correct: true, explanation: 'Correct!' },{ text: '£500', correct: false, explanation: 'That is for higher rate taxpayers.' },{ text: '£5,000', correct: false, explanation: 'That is the savings starter rate band.' },{ text: '£0', correct: false, explanation: 'That is for additional rate taxpayers.' }] },
  { questionText: 'Gift Aid donations by an individual extend the basic rate band by:', topic: 'Income Tax Computation', difficulty: 'medium', syllabusRef: '1.9',
    aiExplanation: 'Gift Aid donations are paid net of basic rate tax (donation × 100/80 = gross). The basic rate band and higher rate threshold are extended by the gross donation amount. This may prevent some income being taxed at higher rates.',
    options: [{ text: 'The gross amount of the donation', correct: true, explanation: 'Correct! Extends the band.' },{ text: 'The net amount paid', correct: false, explanation: 'The gross amount (net × 100/80).' },{ text: 'Nothing — no effect on bands', correct: false, explanation: 'Gift Aid does extend the basic rate band.' },{ text: 'Double the donation', correct: false, explanation: 'Only the gross amount.' }] },
  { questionText: 'A taxpayer earns £55,000 employment income and receives £3,000 dividends. Total income tax on dividends?', topic: 'Income Tax Computation', difficulty: 'hard', syllabusRef: '1.10',
    aiExplanation: 'Non-savings taxable: £55,000 - £12,570 = £42,430. This uses up the £37,700 basic band + £4,730 at higher rate. Dividends: all £3,000 fall in the higher rate band. £500 dividend allowance at 0%. Remaining £2,500 × 33.75% = £843.75.',
    options: [{ text: '£843.75', correct: true, explanation: 'Correct! £2,500 × 33.75%.' },{ text: '£1,012.50', correct: false, explanation: '£3,000 × 33.75% — forgot allowance.' },{ text: '£262.50', correct: false, explanation: 'Used basic rate on dividends.' },{ text: '£600', correct: false, explanation: 'Incorrect rate.' }] },
  // --- Employment Income (6) ---
  { questionText: 'Which of these is a taxable benefit in kind?', topic: 'Employment Income (P11D)', difficulty: 'easy', syllabusRef: '2.1',
    aiExplanation: 'Taxable benefits include: company car, private medical insurance, interest-free loans over £10,000, living accommodation (unless job-related). Reported on P11D.',
    options: [{ text: 'Employer pension contributions', correct: false, explanation: 'Exempt from income tax.' },{ text: 'Company car for private use', correct: true, explanation: 'Correct!' },{ text: 'Workplace parking', correct: false, explanation: 'Exempt.' },{ text: 'One mobile phone provided by employer', correct: false, explanation: 'Exempt (one phone).' }] },
  { questionText: 'The car benefit charge is based on:', topic: 'Employment Income (P11D)', difficulty: 'medium', syllabusRef: '2.2',
    aiExplanation: 'Car benefit = List price × Appropriate percentage (based on CO2 emissions). Higher CO2 = higher percentage. Electric cars have very low percentages (2% in 2024/25). Diesel cars have a 4% supplement.',
    options: [{ text: 'List price × CO2-based percentage', correct: true, explanation: 'Correct!' },{ text: 'Market value × flat 20%', correct: false, explanation: 'Based on CO2 percentage, not flat 20%.' },{ text: 'Annual mileage', correct: false, explanation: 'Mileage is not a factor.' },{ text: 'Engine size only', correct: false, explanation: 'CO2 emissions, not engine size.' }] },
  { questionText: 'The fuel benefit for a company car is:', topic: 'Employment Income (P11D)', difficulty: 'medium', syllabusRef: '2.3',
    aiExplanation: 'Fuel benefit = Fixed multiplier (£27,800 for 2024/25) × Same CO2 percentage as the car. It applies if the employer provides ANY fuel for private use. It is all or nothing — no reduction for partial private use.',
    options: [{ text: '£27,800 × CO2 percentage', correct: true, explanation: 'Correct!' },{ text: 'Actual fuel cost', correct: false, explanation: 'Fixed multiplier, not actual cost.' },{ text: '20% of the car benefit', correct: false, explanation: 'Separate calculation using fuel multiplier.' },{ text: 'Only charged if private mileage exceeds 5,000', correct: false, explanation: 'No mileage threshold.' }] },
  { questionText: 'An interest-free loan benefit arises when the loan exceeds:', topic: 'Employment Income (P11D)', difficulty: 'easy', syllabusRef: '2.4',
    aiExplanation: 'Beneficial loans: taxable benefit arises on loans of £10,000 or more (at any point in the year). Benefit = loan × official rate of interest. Loans under £10,000 are exempt.',
    options: [{ text: '£10,000', correct: true, explanation: 'Correct!' },{ text: '£5,000', correct: false, explanation: 'Too low.' },{ text: '£50,000', correct: false, explanation: 'Too high.' },{ text: 'Any amount', correct: false, explanation: 'Under £10,000 is exempt.' }] },
  { questionText: 'Which employment benefit is exempt from tax?', topic: 'Employment Income (P11D)', difficulty: 'easy', syllabusRef: '2.5',
    aiExplanation: 'Exempt benefits: employer pension contributions, workplace nursery, one annual party (up to £150/head), workplace parking, bicycles (cycle to work), eye tests for VDU users, one mobile phone, death-in-service benefits.',
    options: [{ text: 'Private medical insurance', correct: false, explanation: 'Taxable.' },{ text: 'Employer pension contributions', correct: true, explanation: 'Correct! Exempt.' },{ text: 'Company car with private use', correct: false, explanation: 'Taxable.' },{ text: 'Living accommodation (non job-related)', correct: false, explanation: 'Taxable.' }] },
  { questionText: 'PAYE (Pay As You Earn) is:', topic: 'Employment Income (P11D)', difficulty: 'easy', syllabusRef: '2.6',
    aiExplanation: 'PAYE is the system by which employers deduct income tax and NIC from employees\' pay before they receive it. The employer pays this to HMRC. The tax code determines the deduction amount.',
    options: [{ text: 'A system for deducting tax from employment income at source', correct: true, explanation: 'Correct!' },{ text: 'A method of calculating corporation tax', correct: false, explanation: 'CT is for companies, PAYE is for employees.' },{ text: 'A type of VAT', correct: false, explanation: 'Completely different tax.' },{ text: 'Only for self-employed individuals', correct: false, explanation: 'Self-employed use Self Assessment, not PAYE.' }] },
  // --- Trading & Property Income (6) ---
  { questionText: 'A sole trader\'s basis period is normally:', topic: 'Trading Income', difficulty: 'easy', syllabusRef: '3.1',
    aiExplanation: 'From 2024/25, the basis period is the tax year (6 April to 5 April) for all sole traders. This replaced the previous current year basis (accounting period ending in the tax year).',
    options: [{ text: 'The tax year (6 April to 5 April)', correct: true, explanation: 'Correct! From 2024/25.' },{ text: 'The calendar year', correct: false, explanation: 'Not necessarily.' },{ text: 'Any 12-month period chosen', correct: false, explanation: 'Must align with tax year from 2024/25.' },{ text: 'The accounting period ending in the tax year', correct: false, explanation: 'Old rules — replaced in 2024/25.' }] },
  { questionText: 'The property income allowance is:', topic: 'Property Income', difficulty: 'easy', syllabusRef: '3.2',
    aiExplanation: 'The property income allowance is £1,000. If total property income is £1,000 or less, it is tax-free. If over £1,000, the taxpayer can either deduct the £1,000 allowance OR claim actual expenses.',
    options: [{ text: '£1,000', correct: true, explanation: 'Correct!' },{ text: '£7,500', correct: false, explanation: 'That is Rent a Room relief.' },{ text: '£12,570', correct: false, explanation: 'That is the personal allowance.' },{ text: '£500', correct: false, explanation: 'Too low.' }] },
  { questionText: 'Rent a Room relief allows tax-free income up to:', topic: 'Property Income', difficulty: 'easy', syllabusRef: '3.3',
    aiExplanation: 'Rent a Room: up to £7,500 per year tax-free for letting a furnished room in your own home. If income exceeds £7,500, choose between the allowance (deduct £7,500) or actual expenses.',
    options: [{ text: '£7,500', correct: true, explanation: 'Correct!' },{ text: '£1,000', correct: false, explanation: 'That is the property allowance.' },{ text: '£12,570', correct: false, explanation: 'Personal allowance.' },{ text: '£4,250', correct: false, explanation: 'Previous threshold.' }] },
  { questionText: 'Mortgage interest relief for residential landlords is given as:', topic: 'Property Income', difficulty: 'medium', syllabusRef: '3.4',
    aiExplanation: 'Since 2020/21, residential mortgage interest is NOT deductible from rental income. Instead, a basic rate tax reduction (20% of finance costs) is given. This means higher/additional rate taxpayers get less relief than before.',
    options: [{ text: 'A full deduction from rental income', correct: false, explanation: 'Full deduction was removed.' },{ text: 'A basic rate (20%) tax reduction', correct: true, explanation: 'Correct! Tax reducer, not deduction.' },{ text: 'No relief at all', correct: false, explanation: '20% tax reduction IS available.' },{ text: 'A higher rate (40%) deduction', correct: false, explanation: 'Only basic rate relief.' }] },
  { questionText: 'The trading income allowance is:', topic: 'Trading Income', difficulty: 'easy', syllabusRef: '3.5',
    aiExplanation: 'The trading allowance is £1,000. If total trading income is £1,000 or less, it is tax-free (no need to register for Self Assessment). If over, can deduct £1,000 or actual expenses.',
    options: [{ text: '£1,000', correct: true, explanation: 'Correct!' },{ text: '£12,570', correct: false, explanation: 'Personal allowance.' },{ text: '£500', correct: false, explanation: 'Too low.' },{ text: '£6,725', correct: false, explanation: 'NIC threshold.' }] },
  { questionText: 'Capital expenditure by a sole trader is relieved through:', topic: 'Trading Income', difficulty: 'easy', syllabusRef: '3.6',
    aiExplanation: 'Same as for companies: capital allowances (AIA, WDA, FYAs). Depreciation is disallowed. Private use assets are restricted to the business-use proportion.',
    options: [{ text: 'Depreciation', correct: false, explanation: 'Depreciation is disallowed.' },{ text: 'Capital allowances', correct: true, explanation: 'Correct!' },{ text: 'Full expense deduction', correct: false, explanation: 'Capital items cannot be fully expensed (except under AIA).' },{ text: 'No relief is available', correct: false, explanation: 'Capital allowances provide relief.' }] },
  // --- Capital Gains Tax (8) ---
  { questionText: 'The annual exempt amount for CGT in 2024/25 is:', topic: 'Capital Gains Tax', difficulty: 'easy', syllabusRef: '4.1',
    aiExplanation: 'The annual exempt amount (AEA) is £3,000 for 2024/25 (reduced from £6,000 in 2023/24 and £12,300 in 2022/23). The first £3,000 of gains are tax-free.',
    options: [{ text: '£3,000', correct: true, explanation: 'Correct!' },{ text: '£6,000', correct: false, explanation: '2023/24 figure.' },{ text: '£12,300', correct: false, explanation: '2022/23 figure.' },{ text: '£12,570', correct: false, explanation: 'Income tax personal allowance.' }] },
  { questionText: 'CGT rates for 2024/25 on non-residential assets are:', topic: 'Capital Gains Tax', difficulty: 'easy', syllabusRef: '4.2',
    aiExplanation: 'Non-residential: 10% (basic rate taxpayer) / 20% (higher/additional). Residential property: 18% / 24% (from 6 April 2024). The rate depends on the taxpayer\'s remaining basic rate band.',
    options: [{ text: '10% / 20%', correct: true, explanation: 'Correct!' },{ text: '18% / 28%', correct: false, explanation: 'Old residential rates.' },{ text: '20% / 40%', correct: false, explanation: 'Income tax rates, not CGT.' },{ text: '0% / 10%', correct: false, explanation: 'Too low.' }] },
  { questionText: 'An individual sells shares bought for £10,000 for £25,000. Chargeable gain before AEA?', topic: 'Capital Gains Tax', difficulty: 'easy', syllabusRef: '4.3',
    aiExplanation: 'Gain = Proceeds - Cost = £25,000 - £10,000 = £15,000. Then deduct AEA (£3,000) to get taxable gain of £12,000.',
    options: [{ text: '£15,000', correct: true, explanation: 'Correct!' },{ text: '£25,000', correct: false, explanation: 'Must deduct cost.' },{ text: '£12,000', correct: false, explanation: 'That is after AEA.' },{ text: '£10,000', correct: false, explanation: 'That is the cost.' }] },
  { questionText: 'Business Asset Disposal Relief (BADR) provides a CGT rate of:', topic: 'Capital Gains Tax', difficulty: 'medium', syllabusRef: '4.4',
    aiExplanation: 'BADR (formerly Entrepreneurs\' Relief) gives a 10% CGT rate on qualifying business disposals up to a lifetime limit of £1m. Qualifying: disposal of a business/part of a business, shares in a personal trading company (5% holding, 2-year ownership).',
    options: [{ text: '10%', correct: true, explanation: 'Correct!' },{ text: '20%', correct: false, explanation: 'Standard higher rate, not BADR.' },{ text: '0%', correct: false, explanation: 'Not fully exempt.' },{ text: '5%', correct: false, explanation: 'Not 5%.' }] },
  { questionText: 'Principal Private Residence (PPR) relief exempts gains on:', topic: 'Capital Gains Tax', difficulty: 'easy', syllabusRef: '4.5',
    aiExplanation: 'PPR relief provides full CGT exemption on the sale of your main home if: you lived in it as your main residence throughout ownership. The last 9 months of ownership are always exempt. Partial relief applies if not lived in throughout.',
    options: [{ text: 'Sale of your main home', correct: true, explanation: 'Correct!' },{ text: 'Any property you own', correct: false, explanation: 'Only main residence.' },{ text: 'Buy-to-let properties', correct: false, explanation: 'Not PPR — taxable.' },{ text: 'All property sales over £250,000', correct: false, explanation: 'No monetary threshold for PPR.' }] },
  { questionText: 'Shares are matched for CGT purposes in this order:', topic: 'Capital Gains Tax', difficulty: 'hard', syllabusRef: '4.6',
    aiExplanation: 'Share matching rules: (1) Same-day acquisitions, (2) Acquisitions in the following 30 days (anti-avoidance "bed and breakfasting"), (3) The Section 104 pool (weighted average of all other shares).',
    options: [{ text: 'Same day, next 30 days, Section 104 pool', correct: true, explanation: 'Correct!' },{ text: 'FIFO (oldest first)', correct: false, explanation: 'That was the old rule — replaced.' },{ text: 'LIFO (newest first)', correct: false, explanation: 'Not the CGT matching rule.' },{ text: 'Average cost method', correct: false, explanation: 'Section 104 pool uses average, but matching order matters.' }] },
  { questionText: 'Transfers between spouses/civil partners for CGT purposes are:', topic: 'Capital Gains Tax', difficulty: 'easy', syllabusRef: '4.7',
    aiExplanation: 'Transfers between spouses/civil partners are on a no gain/no loss basis. The receiving spouse takes on the original cost. This allows tax planning by transferring assets to the lower-rate spouse before selling.',
    options: [{ text: 'Taxable at market value', correct: false, explanation: 'No gain/no loss between spouses.' },{ text: 'No gain/no loss', correct: true, explanation: 'Correct!' },{ text: 'Exempt with no base cost transfer', correct: false, explanation: 'Base cost IS transferred.' },{ text: 'Only exempt up to £3,000', correct: false, explanation: 'Fully exempt regardless of amount.' }] },
  { questionText: 'CGT losses can be:', topic: 'Capital Gains Tax', difficulty: 'medium', syllabusRef: '4.8',
    aiExplanation: 'CGT losses: set against gains of the same year first (mandatory), then carried forward against future gains. Cannot be set against income. Current-year losses must be used even if they reduce gains below the AEA. Brought-forward losses are only used to reduce gains to the AEA level.',
    options: [{ text: 'Set against gains of the same year, then carried forward', correct: true, explanation: 'Correct!' },{ text: 'Set against income', correct: false, explanation: 'Cannot offset against income (with limited exceptions).' },{ text: 'Carried back 3 years', correct: false, explanation: 'No carry-back for individuals\' CGT losses.' },{ text: 'Lost if not used in the year', correct: false, explanation: 'Can be carried forward indefinitely.' }] },
  // --- NIC & Self Assessment (10) ---
  { questionText: 'Class 2 NIC is paid by:', topic: 'NIC Classes 2 & 4', difficulty: 'easy', syllabusRef: '5.1',
    aiExplanation: 'Class 2 NIC was abolished from April 2024. Previously paid by self-employed at a flat weekly rate. Now voluntary contributions are available to protect state pension entitlement.',
    options: [{ text: 'Self-employed individuals (abolished from April 2024)', correct: true, explanation: 'Correct!' },{ text: 'Employers', correct: false, explanation: 'Employers pay Class 1 secondary.' },{ text: 'Employees', correct: false, explanation: 'Employees pay Class 1 primary.' },{ text: 'Companies', correct: false, explanation: 'Companies don\'t pay Class 2.' }] },
  { questionText: 'Class 4 NIC is paid by self-employed on profits between:', topic: 'NIC Classes 2 & 4', difficulty: 'medium', syllabusRef: '5.2',
    aiExplanation: 'Class 4 NIC 2024/25: 6% on profits between £12,570 and £50,270 (reduced from 9% in 2023/24). 2% on profits above £50,270. Collected through Self Assessment.',
    options: [{ text: '£12,570 and £50,270 at 6%', correct: true, explanation: 'Correct! Reduced from 9% in 2024/25.' },{ text: '£9,568 and £50,270 at 9%', correct: false, explanation: 'Previous year thresholds and rate.' },{ text: '£0 and £50,270 at 12%', correct: false, explanation: 'Wrong threshold and rate.' },{ text: 'All profits at 2%', correct: false, explanation: '2% only above £50,270.' }] },
  { questionText: 'The Self Assessment filing deadline for online returns is:', topic: 'SA100/SA103 Returns', difficulty: 'easy', syllabusRef: '6.1',
    aiExplanation: '31 January following the end of the tax year. For 2024/25 (ending 5 April 2025), the online deadline is 31 January 2026. Paper returns: 31 October.',
    options: [{ text: '31 January following the tax year end', correct: true, explanation: 'Correct!' },{ text: '31 October', correct: false, explanation: 'Paper return deadline.' },{ text: '5 April', correct: false, explanation: 'End of tax year, not filing deadline.' },{ text: '30 September', correct: false, explanation: 'Not an SA deadline.' }] },
  { questionText: 'The first payment on account for Self Assessment is due on:', topic: 'Payment on Account', difficulty: 'easy', syllabusRef: '7.1',
    aiExplanation: 'Two payments on account: 31 January in the tax year, and 31 July after the tax year. Each is 50% of the previous year\'s liability. Balancing payment is 31 January following the tax year.',
    options: [{ text: '31 January in the tax year', correct: true, explanation: 'Correct!' },{ text: '31 July after the tax year', correct: false, explanation: 'That is the second payment on account.' },{ text: '5 April', correct: false, explanation: 'Not a payment date.' },{ text: '1 October', correct: false, explanation: 'CT payment date, not SA.' }] },
  { questionText: 'Payments on account are each:', topic: 'Payment on Account', difficulty: 'easy', syllabusRef: '7.2',
    aiExplanation: 'Each payment on account = 50% of the previous year\'s income tax and Class 4 NIC liability (less any tax deducted at source). If liability was under £1,000 or >80% deducted at source, no POAs required.',
    options: [{ text: '50% of the previous year\'s liability', correct: true, explanation: 'Correct!' },{ text: '100% of the current year\'s estimated tax', correct: false, explanation: 'Based on previous year.' },{ text: '25% of the previous year', correct: false, explanation: '50%, not 25%.' },{ text: 'A fixed amount set by HMRC', correct: false, explanation: 'Based on prior year liability.' }] },
  { questionText: 'The penalty for late Self Assessment filing (up to 3 months) is:', topic: 'SA100/SA103 Returns', difficulty: 'easy', syllabusRef: '6.2',
    aiExplanation: 'Late filing penalties: 1 day late = £100. 3 months late = daily penalties of £10/day (up to 90 days = £900). 6 months late = greater of 5% of tax or £300. 12 months late = greater of 5% of tax or £300 (can be higher if deliberate).',
    options: [{ text: '£100 flat penalty', correct: true, explanation: 'Correct! Initial penalty.' },{ text: '£10 per day', correct: false, explanation: 'Daily penalties start after 3 months.' },{ text: '5% of tax due', correct: false, explanation: 'That applies after 6 months.' },{ text: 'No penalty', correct: false, explanation: 'Penalties apply immediately.' }] },
  { questionText: 'Simple Assessment means:', topic: 'SA100/SA103 Returns', difficulty: 'medium', syllabusRef: '6.3',
    aiExplanation: 'Simple Assessment: HMRC calculates the tax owed (instead of the taxpayer filing a return) using information they already hold. Used for state pensioners with simple tax affairs and some PAYE taxpayers. Taxpayer can challenge the calculation.',
    options: [{ text: 'HMRC calculates the tax based on information they hold', correct: true, explanation: 'Correct!' },{ text: 'The taxpayer estimates their own tax', correct: false, explanation: 'HMRC does the calculation.' },{ text: 'No tax return is needed for anyone', correct: false, explanation: 'Only applies to selected taxpayers.' },{ text: 'Tax is always zero', correct: false, explanation: 'Tax may still be due.' }] },
  { questionText: 'Which income is NOT subject to income tax?', topic: 'Income Tax Computation', difficulty: 'easy', syllabusRef: '1.11',
    aiExplanation: 'Tax-exempt income: ISA interest/gains, premium bond prizes, first £1,000 trading/property allowance, gambling winnings, some state benefits (child benefit subject to HICBC), personal injury compensation.',
    options: [{ text: 'Employment income', correct: false, explanation: 'Taxable.' },{ text: 'Rental income', correct: false, explanation: 'Taxable.' },{ text: 'ISA interest', correct: true, explanation: 'Correct! ISA income is tax-free.' },{ text: 'Dividends over £500', correct: false, explanation: 'Taxable above the allowance.' }] },
  { questionText: 'The High Income Child Benefit Charge applies when income exceeds:', topic: 'Income Tax Computation', difficulty: 'medium', syllabusRef: '1.12',
    aiExplanation: 'HICBC: 1% of child benefit is clawed back for every £200 of income over £60,000 (from 2024/25, previously £50,000). Fully clawed back at £80,000. Based on the higher earner\'s income.',
    options: [{ text: '£60,000', correct: true, explanation: 'Correct! From 2024/25.' },{ text: '£50,000', correct: false, explanation: 'Previous threshold.' },{ text: '£100,000', correct: false, explanation: 'That is the PA reduction threshold.' },{ text: '£80,000', correct: false, explanation: 'Fully clawed back at £80,000, but charge starts at £60,000.' }] },
  { questionText: 'Pension contributions by an individual receive tax relief up to:', topic: 'Income Tax Computation', difficulty: 'medium', syllabusRef: '1.13',
    aiExplanation: 'Annual allowance: £60,000 (from 2023/24). Tax relief given on personal contributions up to 100% of relevant UK earnings or the annual allowance (whichever is lower). Basic rate relief given at source; higher/additional rate claimed through SA.',
    options: [{ text: '£60,000 annual allowance or 100% of earnings', correct: true, explanation: 'Correct!' },{ text: '£40,000', correct: false, explanation: 'Previous annual allowance.' },{ text: 'Unlimited', correct: false, explanation: 'Capped at annual allowance.' },{ text: '£3,600', correct: false, explanation: 'Minimum for non-earners, not the limit.' }] },
];

async function main() {
  console.log('\n🎓 Seeding L4 PSTX...\n');
  await seedModule('PSTX', PSTX);
  console.log('\n✅ Done!');
}
main().catch(console.error).finally(() => prisma.$disconnect());
