import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';
import {
  getCompanyProfile,
  getCompanyOfficers,
  getCompanyFilingHistory,
  getRegisteredOffice,
  getCompanyPSCs,
  getCompanyCharges,
  ensureValidToken,
  createCHTransaction,
  addROAToTransaction,
  closeCHTransaction,
  getROAEtag,
} from '@/lib/government-api';
import { sendFilingSubmittedEmail, sendFilingRejectedEmail } from '@/lib/email';

// GET /api/government/ch/[connectionId] — Get company data from CH
export async function GET(
  request: Request,
  { params }: { params: Promise<{ connectionId: string }> }
) {
  try {
    const userId = await requireUserId();
    const { connectionId } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'profile';

    const connection = await (prisma as any).governmentConnection.findFirst({
      where: { id: connectionId, userId, provider: 'companies_house' },
    });

    if (!connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    if (!connection.companyNumber) {
      return NextResponse.json({ error: 'No company number linked' }, { status: 400 });
    }

    let data: any;

    switch (action) {
      case 'profile':
        data = await getCompanyProfile(connection.companyNumber);
        await (prisma as any).governmentConnection.update({
          where: { id: connectionId },
          data: { profileData: data, lastSyncAt: new Date(), lastError: null },
        });
        break;

      case 'officers':
        data = await getCompanyOfficers(connection.companyNumber);
        break;

      case 'filing-history':
        data = await getCompanyFilingHistory(connection.companyNumber);
        break;

      case 'registered-office':
        data = await getRegisteredOffice(connection.companyNumber);
        break;

      case 'pscs':
        data = await getCompanyPSCs(connection.companyNumber);
        break;

      case 'charges':
        data = await getCompanyCharges(connection.companyNumber);
        break;

      case 'our-filings':
        // Get filings submitted through our system
        data = await (prisma as any).governmentFiling.findMany({
          where: { connectionId, userId },
          orderBy: { createdAt: 'desc' },
          take: 50,
        });
        break;

      case 'full-sync': {
        const [profile, officers, filings, office, pscs] = await Promise.allSettled([
          getCompanyProfile(connection.companyNumber),
          getCompanyOfficers(connection.companyNumber),
          getCompanyFilingHistory(connection.companyNumber),
          getRegisteredOffice(connection.companyNumber),
          getCompanyPSCs(connection.companyNumber),
        ]);

        data = {
          profile: profile.status === 'fulfilled' ? profile.value : null,
          officers: officers.status === 'fulfilled' ? officers.value : null,
          filingHistory: filings.status === 'fulfilled' ? filings.value : null,
          registeredOffice: office.status === 'fulfilled' ? office.value : null,
          pscs: pscs.status === 'fulfilled' ? pscs.value : null,
        };

        // Extract deadlines from profile
        const p = data.profile;
        const deadlines: any = {};
        if (p?.confirmation_statement?.next_due) {
          deadlines.confirmationStatementDue = p.confirmation_statement.next_due;
        }
        if (p?.accounts?.next_due) {
          deadlines.accountsDue = p.accounts.next_due;
        }
        if (p?.annual_return?.next_due) {
          deadlines.annualReturnDue = p.annual_return.next_due;
        }
        data.deadlines = deadlines;

        // Update entity with fresh data
        if (connection.entityId && p) {
          const addr = p.registered_office_address || {};
          await (prisma as any).entity.update({
            where: { id: connection.entityId },
            data: {
              name: p.company_name || undefined,
              companyStatus: p.company_status || undefined,
              registeredAddress: [addr.address_line_1, addr.address_line_2, addr.locality, addr.postal_code].filter(Boolean).join(', ') || undefined,
              sicCodes: p.sic_codes || undefined,
              officers: data.officers?.items?.filter((o: any) => !o.resigned_on).map((o: any) => ({
                name: o.name,
                role: o.officer_role,
                appointedDate: o.appointed_on,
                nationality: o.nationality,
                occupation: o.occupation,
              })) || undefined,
            },
          });
        }

        // Cache
        await (prisma as any).governmentConnection.update({
          where: { id: connectionId },
          data: { profileData: data, lastSyncAt: new Date(), lastError: null },
        });
        break;
      }

      default:
        return NextResponse.json({ error: 'Invalid action. Valid: profile, officers, filing-history, registered-office, pscs, charges, our-filings, full-sync' }, { status: 400 });
    }

    return NextResponse.json({ data, connection: { id: connection.id, status: connection.status, lastSyncAt: new Date() } });
  } catch (error: any) {
    console.error('[CH Data] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch CH data' }, { status: 500 });
  }
}

// POST /api/government/ch/[connectionId] — Submit a filing to CH using transaction-based flow
export async function POST(
  request: Request,
  { params }: { params: Promise<{ connectionId: string }> }
) {
  try {
    const userId = await requireUserId();
    const { connectionId } = await params;
    const body = await request.json();
    const { filingType, formData } = body;

    if (!filingType || !formData) {
      return NextResponse.json({ error: 'filingType and formData are required' }, { status: 400 });
    }

    const connection = await (prisma as any).governmentConnection.findFirst({
      where: { id: connectionId, userId, provider: 'companies_house' },
    });

    if (!connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    if (connection.status !== 'active') {
      return NextResponse.json({ error: 'Connection is not active. Please reconnect via OAuth.', reconnect: true }, { status: 400 });
    }

    // Validate required env vars before attempting any filing
    if (!process.env.CH_OAUTH_CLIENT_ID || !process.env.CH_OAUTH_CLIENT_SECRET) {
      console.error('[CH Filing] CRITICAL: CH_OAUTH_CLIENT_ID or CH_OAUTH_CLIENT_SECRET not configured');
      return NextResponse.json({ error: 'Companies House OAuth credentials not configured on the server. Contact support.', reconnect: false }, { status: 500 });
    }
    if (!process.env.COMPANIES_HOUSE_API_KEY) {
      console.error('[CH Filing] CRITICAL: COMPANIES_HOUSE_API_KEY not configured');
      return NextResponse.json({ error: 'Companies House API key not configured on the server. Contact support.', reconnect: false }, { status: 500 });
    }

    // Ensure token is valid
    const accessToken = await ensureValidToken(connection, async (newToken) => {
      await (prisma as any).governmentConnection.update({
        where: { id: connectionId },
        data: {
          accessToken: newToken.accessToken,
          refreshToken: newToken.refreshToken || connection.refreshToken,
          tokenExpiresAt: newToken.tokenExpiresAt,
        },
      });
    });

    const companyNumber = connection.companyNumber;
    let responseData: any;
    let status = 'submitted';
    let reference: string | null = null;
    let description = '';

    try {
      // CH Filing API uses transaction-based flow:
      // 1) Create transaction → 2) Add resource → 3) Close transaction
      switch (filingType) {
        case 'change_registered_office': {
          description = 'Change of Registered Office Address (AD01)';

          // Step 0: Get current ROA etag (required by CH)
          const etag = await getROAEtag(companyNumber);

          // Step 1: Create transaction
          const txn = await createCHTransaction(accessToken, companyNumber, description);
          // Extract transaction ID — CH may return it as id, or in links.self path
          const txnId = txn.id || txn.links?.self?.split('/transactions/')[1] || null;
          if (!txnId) throw new Error('CH transaction created but no ID returned');
          reference = txnId;

          // Step 2: Add ROA resource to transaction
          const addressBody = {
            address_line_1: formData.addressLine1,
            address_line_2: formData.addressLine2 || undefined,
            locality: formData.city || formData.locality,
            region: formData.region || formData.county || undefined,
            postal_code: formData.postcode,
            country: formData.country || 'England',
            premises: formData.premises || undefined,
          };
          const roaResult = await addROAToTransaction(accessToken, txnId, addressBody, etag);

          // Step 3: Close transaction to submit to CH
          const closeResult = await closeCHTransaction(accessToken, txnId);
          responseData = { transaction: txn, roa: roaResult, close: closeResult };
          status = 'submitted';
          break;
        }

        default:
          // Other filing types (officers, CS01, etc.) are not yet available via CH Filing API
          // They must be completed on GOV.UK WebFiling
          return NextResponse.json({
            error: `Filing type "${filingType}" is not yet available via the CH Filing API. Please use the GOV.UK WebFiling service for this action.`,
            webFilingUrl: 'https://www.gov.uk/file-changes-to-a-company-with-companies-house',
          }, { status: 400 });
      }
    } catch (filingError: any) {
      console.error('[CH Filing] Filing error:', filingError.message);
      status = 'rejected';
      responseData = { error: filingError.message };
    }

    // Record filing in our DB
    const filing = await (prisma as any).governmentFiling.create({
      data: {
        connectionId,
        userId,
        entityId: connection.entityId,
        provider: 'companies_house',
        filingType,
        reference,
        status,
        submittedAt: status !== 'rejected' ? new Date() : null,
        formData,
        responseData,
      },
    });

    // Log event
    await prisma.event.create({
      data: {
        userId,
        eventType: `gov.ch_filing_${status}`,
        entityType: 'government_filing',
        entityId: filing.id,
        payload: {
          filingType,
          description,
          reference,
          companyNumber,
        },
      },
    });

    // Send email notification (non-blocking)
    try {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, fullName: true } });
      const entity = connection.entityId
        ? await (prisma as any).entity.findUnique({ where: { id: connection.entityId }, select: { name: true } })
        : null;
      const companyName = entity?.name || companyNumber;
      const userName = user?.fullName || 'User';

      if (user?.email) {
        if (status === 'submitted') {
          const formSummary = filingType === 'change_registered_office'
            ? [formData.premises, formData.addressLine1, formData.addressLine2, formData.city, formData.region, formData.postcode, formData.country].filter(Boolean).join(', ')
            : '';
          sendFilingSubmittedEmail(user.email, userName, companyNumber, companyName, filingType, reference, formSummary).catch(() => {});
        } else if (status === 'rejected') {
          sendFilingRejectedEmail(user.email, userName, companyNumber, companyName, filingType, responseData?.error || 'Unknown reason').catch(() => {});
        }
      }
    } catch (emailErr) {
      console.error('[CH Filing] Email notification failed (non-critical):', emailErr);
    }

    return NextResponse.json({
      filing: {
        id: filing.id,
        filingType,
        description,
        reference,
        status,
        responseData,
      },
    });
  } catch (error: any) {
    console.error('[CH Filing] Error:', error.message || error);
    const isReconnect = error.message?.includes('RECONNECT_REQUIRED');
    
    // If token is invalid, mark connection as needing reconnect
    if (isReconnect) {
      try {
        const { connectionId: cId } = await params;
        await (prisma as any).governmentConnection.update({
          where: { id: cId },
          data: { status: 'expired', lastError: error.message },
        });
      } catch { /* non-critical */ }
    }

    return NextResponse.json({ 
      error: isReconnect 
        ? 'Your Companies House connection has expired. Please disconnect and reconnect via OAuth to re-authorize.'
        : (error.message || 'Failed to submit filing'),
      reconnect: isReconnect,
    }, { status: isReconnect ? 401 : 500 });
  }
}
