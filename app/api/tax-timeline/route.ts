import { NextResponse } from 'next/server';
import { requireUserId, getAccessibleUserIds } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface TaxDeadline {
  id: string;
  title: string;
  description: string;
  date: string;
  category: 'self_assessment' | 'vat' | 'corporation_tax' | 'paye' | 'other';
  status: 'upcoming' | 'due_soon' | 'overdue' | 'completed';
  url?: string;
  daysUntil: number;
}

export async function GET(request: Request) {
  try {
    const userId = await requireUserId();
    const userIds = await getAccessibleUserIds(userId);
    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get('year');
    
    const now = new Date();
    const year = yearParam ? parseInt(yearParam) : now.getFullYear();

    // Fetch user's entity info to determine applicable deadlines
    const entities = await prisma.entity.findMany({
      where: { userId: { in: userIds } },
      select: { type: true, taxRegime: true, isVatRegistered: true, financialYearEnd: true },
    });

    const hasCompany = entities.some(e => ['limited_company', 'llp'].includes(e.type));
    const hasSelfAssessment = entities.some(e => ['self_assessment', 'both'].includes(e.taxRegime)) || entities.length === 0;
    const isVatRegistered = entities.some(e => e.isVatRegistered);

    const deadlines: Omit<TaxDeadline, 'status' | 'daysUntil'>[] = [];

    // Self Assessment deadlines (applicable to most users)
    if (hasSelfAssessment) {
      deadlines.push(
        {
          id: `sa-register-${year}`,
          title: 'Register for Self Assessment',
          description: `Register with HMRC if first time filing for ${year}/${year + 1} tax year`,
          date: `${year}-10-05`,
          category: 'self_assessment',
          url: 'https://www.gov.uk/register-for-self-assessment',
        },
        {
          id: `sa-paper-${year}`,
          title: 'Paper Tax Return Deadline',
          description: `Submit paper SA100 for ${year - 1}/${year} tax year`,
          date: `${year}-10-31`,
          category: 'self_assessment',
          url: 'https://www.gov.uk/self-assessment-tax-returns',
        },
        {
          id: `sa-online-${year}`,
          title: 'Online Tax Return Deadline',
          description: `Submit online SA100 for ${year - 1}/${year} tax year. Pay any tax owed.`,
          date: `${year + 1}-01-31`,
          category: 'self_assessment',
          url: 'https://www.gov.uk/self-assessment-tax-returns/deadlines',
        },
        {
          id: `sa-payment1-${year}`,
          title: 'First Payment on Account',
          description: `First instalment towards ${year}/${year + 1} tax bill (50% of previous year)`,
          date: `${year + 1}-01-31`,
          category: 'self_assessment',
          url: 'https://www.gov.uk/understand-self-assessment-bill/payments-on-account',
        },
        {
          id: `sa-payment2-${year}`,
          title: 'Second Payment on Account',
          description: `Second instalment towards ${year}/${year + 1} tax bill`,
          date: `${year + 1}-07-31`,
          category: 'self_assessment',
          url: 'https://www.gov.uk/understand-self-assessment-bill/payments-on-account',
        },
        {
          id: `tax-year-start-${year}`,
          title: 'New Tax Year Starts',
          description: `Tax year ${year}/${year + 1} begins. New allowances apply.`,
          date: `${year}-04-06`,
          category: 'self_assessment',
        },
        {
          id: `tax-year-end-${year}`,
          title: 'Tax Year Ends',
          description: `Tax year ${year - 1}/${year} ends. Use remaining ISA and pension allowances.`,
          date: `${year}-04-05`,
          category: 'self_assessment',
        },
      );
    }

    // VAT deadlines (quarterly)
    if (isVatRegistered) {
      const quarters = [
        { q: 'Q1', end: `${year}-03-31`, due: `${year}-05-07` },
        { q: 'Q2', end: `${year}-06-30`, due: `${year}-08-07` },
        { q: 'Q3', end: `${year}-09-30`, due: `${year}-11-07` },
        { q: 'Q4', end: `${year}-12-31`, due: `${year + 1}-02-07` },
      ];
      quarters.forEach(({ q, end, due }) => {
        deadlines.push({
          id: `vat-${q.toLowerCase()}-${year}`,
          title: `VAT Return ${q} ${year}`,
          description: `Submit VAT return for period ending ${new Date(end).toLocaleDateString('en-GB')} and pay any VAT due`,
          date: due,
          category: 'vat',
          url: 'https://www.gov.uk/vat-returns',
        });
      });
    }

    // Corporation Tax deadlines
    if (hasCompany) {
      deadlines.push(
        {
          id: `ct-payment-${year}`,
          title: 'Corporation Tax Payment',
          description: `Pay Corporation Tax for accounting period ending in ${year} (9 months + 1 day after year end)`,
          date: `${year + 1}-01-01`,
          category: 'corporation_tax',
          url: 'https://www.gov.uk/pay-corporation-tax',
        },
        {
          id: `ct-return-${year}`,
          title: 'Corporation Tax Return (CT600)',
          description: `File CT600 for accounting period ending in ${year} (12 months after year end)`,
          date: `${year + 1}-03-31`,
          category: 'corporation_tax',
          url: 'https://www.gov.uk/company-tax-returns',
        },
        {
          id: `confirmation-stmt-${year}`,
          title: 'Confirmation Statement',
          description: 'Annual confirmation statement to Companies House',
          date: `${year}-12-31`,
          category: 'corporation_tax',
          url: 'https://www.gov.uk/file-your-confirmation-statement-with-companies-house',
        },
      );
    }

    // PAYE deadlines (general)
    deadlines.push(
      {
        id: `p60-${year}`,
        title: 'P60 from Employer',
        description: `Receive P60 for tax year ${year - 1}/${year} from your employer`,
        date: `${year}-05-31`,
        category: 'paye',
      },
      {
        id: `isa-deadline-${year}`,
        title: 'ISA Contribution Deadline',
        description: `Last day to use your £20,000 ISA allowance for ${year - 1}/${year} tax year`,
        date: `${year}-04-05`,
        category: 'other',
        url: 'https://www.gov.uk/individual-savings-accounts',
      },
    );

    // Calculate status for each deadline
    const enrichedDeadlines: TaxDeadline[] = deadlines.map(d => {
      const deadlineDate = new Date(d.date);
      const diffMs = deadlineDate.getTime() - now.getTime();
      const daysUntil = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      let status: TaxDeadline['status'] = 'upcoming';
      if (daysUntil < 0) status = 'overdue';
      else if (daysUntil <= 30) status = 'due_soon';

      return { ...d, status, daysUntil };
    });

    // Sort by date
    enrichedDeadlines.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json({
      deadlines: enrichedDeadlines,
      year,
      hasCompany,
      hasSelfAssessment,
      isVatRegistered,
    });
  } catch (error: any) {
    console.error('[Tax Timeline] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 });
  }
}
