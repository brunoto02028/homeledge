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
      select: { id: true, name: true, type: true, taxRegime: true, isVatRegistered: true, financialYearEnd: true, companyNumber: true },
    });

    const hasCompany = entities.some(e => ['limited_company', 'llp'].includes(e.type));
    const hasSelfAssessment = entities.some(e => ['self_assessment', 'both'].includes(e.taxRegime)) || entities.length === 0;
    const isVatRegistered = entities.some(e => e.isVatRegistered);

    // Fetch real CH deadlines from cached profile data for connected companies
    const companyEntities = entities.filter(e => ['limited_company', 'llp'].includes(e.type) && e.companyNumber);
    const chConnections = companyEntities.length > 0 ? await (prisma as any).governmentConnection.findMany({
      where: {
        userId: { in: userIds },
        provider: 'companies_house',
        entityId: { in: companyEntities.map(e => e.id) },
        profileData: { not: null },
      },
      select: { entityId: true, companyNumber: true, profileData: true },
    }) : [];

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

    // Corporation Tax deadlines — use real CH data when available
    if (hasCompany) {
      // Per-entity CH deadlines from live profile data
      for (const conn of chConnections) {
        const entity = companyEntities.find(e => e.id === conn.entityId);
        const companyLabel = entity?.name || conn.companyNumber || 'Company';
        const profile = conn.profileData?.profile || conn.profileData;

        // Annual Accounts deadline (the most critical one)
        const accountsDue = profile?.accounts?.next_due || profile?.accounts?.next_accounts?.due_on;
        if (accountsDue) {
          const periodStart = profile?.accounts?.next_accounts?.period_start_on || profile?.accounts?.accounting_reference_date?.month;
          const periodEnd = profile?.accounts?.next_accounts?.period_end_on;
          deadlines.push({
            id: `ch-accounts-${conn.companyNumber}`,
            title: `Annual Accounts — ${companyLabel}`,
            description: `File annual accounts for ${companyLabel} (${conn.companyNumber})${periodEnd ? ` for period ending ${new Date(periodEnd).toLocaleDateString('en-GB')}` : ''}. Late filing incurs automatic penalties starting at £150.`,
            date: accountsDue,
            category: 'corporation_tax',
            url: 'https://www.gov.uk/file-your-company-annual-accounts',
          });
        }

        // Confirmation Statement deadline
        const csDue = profile?.confirmation_statement?.next_due;
        if (csDue) {
          deadlines.push({
            id: `ch-cs-${conn.companyNumber}`,
            title: `Confirmation Statement — ${companyLabel}`,
            description: `File CS01 for ${companyLabel} (${conn.companyNumber}). £13 fee. Failure to file can lead to the company being struck off.`,
            date: csDue,
            category: 'corporation_tax',
            url: 'https://www.gov.uk/file-your-confirmation-statement-with-companies-house',
          });
        }
      }

      // Generic fallback deadlines for companies without CH connection
      const connectedEntityIds = new Set(chConnections.map((c: any) => c.entityId));
      const unconnectedCompanies = companyEntities.filter(e => !connectedEntityIds.has(e.id));
      if (unconnectedCompanies.length > 0) {
        deadlines.push(
          {
            id: `ct-payment-${year}`,
            title: 'Corporation Tax Payment',
            description: `Pay Corporation Tax for accounting period ending in ${year} (9 months + 1 day after year end). Connect your company to Companies House for exact dates.`,
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
        );
      }
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
