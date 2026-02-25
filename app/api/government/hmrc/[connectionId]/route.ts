import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';
import {
  hmrcApiGet,
  getHMRCObligations,
  getHMRCSABalance,
  getHMRCSATransactions,
  getHMRCSACharges,
  getHMRCSAPayments,
  getHMRCSALiability,
  listHMRCTaxCalculations,
  getHMRCBusinessDetails,
  getHMRCIndividualDetails,
  getHMRCIndividualIncome,
  getHMRCIndividualEmployment,
  getHMRCIndividualTax,
  getHMRCNationalInsurance,
  getHMRCVATObligations,
  getHMRCVATLiabilities,
  getHMRCVATPayments,
  ensureValidToken,
} from '@/lib/government-api';

// Default date range: current tax year
function getDefaultDateRange() {
  const now = new Date();
  const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return { from: `${year}-04-06`, to: `${year + 1}-04-05` };
}

// GET /api/government/hmrc/[connectionId] — Get HMRC data
export async function GET(
  request: Request,
  { params }: { params: Promise<{ connectionId: string }> }
) {
  try {
    const userId = await requireUserId();
    const { connectionId } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'profile';
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const defaults = getDefaultDateRange();
    const dateFrom = from || defaults.from;
    const dateTo = to || defaults.to;

    const connection = await (prisma as any).governmentConnection.findFirst({
      where: { id: connectionId, userId, provider: 'hmrc' },
    });

    if (!connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    if (connection.status !== 'active') {
      return NextResponse.json({ error: 'Connection is not active. Please reconnect.' }, { status: 400 });
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

    // Get entity for NI number / VAT number / UTR
    let entity: any = null;
    if (connection.entityId) {
      entity = await (prisma as any).entity.findUnique({
        where: { id: connection.entityId },
      });
    }

    let data: any;

    switch (action) {
      case 'profile':
        try {
          if (entity?.niNumber) {
            data = await getHMRCIndividualDetails(accessToken, entity.niNumber);
          } else {
            data = await hmrcApiGet('/individuals/details', accessToken, '2.0');
          }
        } catch {
          data = { message: 'Unable to fetch profile. Check HMRC scopes.' };
        }
        await (prisma as any).governmentConnection.update({
          where: { id: connectionId },
          data: { profileData: data, lastSyncAt: new Date(), lastError: null },
        });
        break;

      case 'sa-obligations':
        if (!entity?.niNumber) {
          return NextResponse.json({ error: 'NI Number required for Self Assessment data' }, { status: 400 });
        }
        data = await getHMRCObligations(accessToken, entity.niNumber);
        break;

      case 'sa-balance':
        if (!entity?.niNumber) {
          return NextResponse.json({ error: 'NI Number required' }, { status: 400 });
        }
        data = await getHMRCSABalance(accessToken, entity.niNumber);
        break;

      case 'sa-transactions':
        if (!entity?.niNumber) {
          return NextResponse.json({ error: 'NI Number required' }, { status: 400 });
        }
        data = await getHMRCSATransactions(accessToken, entity.niNumber, dateFrom, dateTo);
        break;

      case 'sa-charges':
        if (!entity?.niNumber) {
          return NextResponse.json({ error: 'NI Number required' }, { status: 400 });
        }
        data = await getHMRCSACharges(accessToken, entity.niNumber, dateFrom, dateTo);
        break;

      case 'sa-payments':
        if (!entity?.niNumber) {
          return NextResponse.json({ error: 'NI Number required' }, { status: 400 });
        }
        data = await getHMRCSAPayments(accessToken, entity.niNumber, dateFrom, dateTo);
        break;

      case 'sa-liability':
        if (!entity?.utr) {
          return NextResponse.json({ error: 'UTR (Unique Taxpayer Reference) required' }, { status: 400 });
        }
        data = await getHMRCSALiability(accessToken, entity.utr);
        break;

      case 'sa-calculations': {
        if (!entity?.niNumber) {
          return NextResponse.json({ error: 'NI Number required' }, { status: 400 });
        }
        const taxYear = searchParams.get('taxYear') || '2024-25';
        data = await listHMRCTaxCalculations(accessToken, entity.niNumber, taxYear);
        break;
      }

      case 'business-details':
        if (!entity?.niNumber) {
          return NextResponse.json({ error: 'NI Number required' }, { status: 400 });
        }
        data = await getHMRCBusinessDetails(accessToken, entity.niNumber);
        break;

      case 'income':
        try {
          data = await getHMRCIndividualIncome(accessToken);
        } catch {
          data = { message: 'Unable to fetch income data' };
        }
        break;

      case 'employment':
        try {
          data = await getHMRCIndividualEmployment(accessToken);
        } catch {
          data = { message: 'Unable to fetch employment data' };
        }
        break;

      case 'tax':
        try {
          data = await getHMRCIndividualTax(accessToken);
        } catch {
          data = { message: 'Unable to fetch tax data' };
        }
        break;

      case 'ni':
        try {
          data = await getHMRCNationalInsurance(accessToken);
        } catch {
          data = { message: 'Unable to fetch NI data' };
        }
        break;

      case 'vat-obligations':
        if (!entity?.vatNumber) {
          return NextResponse.json({ error: 'VAT Registration Number required' }, { status: 400 });
        }
        data = await getHMRCVATObligations(accessToken, entity.vatNumber, dateFrom, dateTo);
        break;

      case 'vat-liabilities':
        if (!entity?.vatNumber) {
          return NextResponse.json({ error: 'VAT Registration Number required' }, { status: 400 });
        }
        data = await getHMRCVATLiabilities(accessToken, entity.vatNumber, dateFrom, dateTo);
        break;

      case 'vat-payments':
        if (!entity?.vatNumber) {
          return NextResponse.json({ error: 'VAT Registration Number required' }, { status: 400 });
        }
        data = await getHMRCVATPayments(accessToken, entity.vatNumber, dateFrom, dateTo);
        break;

      case 'full-sync': {
        const results: Record<string, any> = {};

        // Profile
        try {
          results.profile = entity?.niNumber
            ? await getHMRCIndividualDetails(accessToken, entity.niNumber)
            : await hmrcApiGet('/individuals/details', accessToken, '2.0');
        } catch (e: any) { results.profile = { error: e.message }; }

        // SA data
        if (entity?.niNumber) {
          try {
            results.saObligations = await getHMRCObligations(accessToken, entity.niNumber);
          } catch (e: any) { results.saObligations = { error: e.message }; }

          try {
            results.saBalance = await getHMRCSABalance(accessToken, entity.niNumber);
          } catch (e: any) { results.saBalance = { error: e.message }; }

          try {
            results.saTransactions = await getHMRCSATransactions(accessToken, entity.niNumber, dateFrom, dateTo);
          } catch (e: any) { results.saTransactions = { error: e.message }; }

          try {
            results.businessDetails = await getHMRCBusinessDetails(accessToken, entity.niNumber);
          } catch (e: any) { results.businessDetails = { error: e.message }; }
        }

        // SA Liability (via UTR)
        if (entity?.utr) {
          try {
            results.saLiability = await getHMRCSALiability(accessToken, entity.utr);
          } catch (e: any) { results.saLiability = { error: e.message }; }
        }

        // Individual APIs
        try {
          results.income = await getHMRCIndividualIncome(accessToken);
        } catch (e: any) { results.income = { error: e.message }; }

        try {
          results.employment = await getHMRCIndividualEmployment(accessToken);
        } catch (e: any) { results.employment = { error: e.message }; }

        try {
          results.tax = await getHMRCIndividualTax(accessToken);
        } catch (e: any) { results.tax = { error: e.message }; }

        try {
          results.nationalInsurance = await getHMRCNationalInsurance(accessToken);
        } catch (e: any) { results.nationalInsurance = { error: e.message }; }

        // VAT
        if (entity?.vatNumber) {
          try {
            results.vatObligations = await getHMRCVATObligations(accessToken, entity.vatNumber, dateFrom, dateTo);
          } catch (e: any) { results.vatObligations = { error: e.message }; }

          try {
            results.vatLiabilities = await getHMRCVATLiabilities(accessToken, entity.vatNumber, dateFrom, dateTo);
          } catch (e: any) { results.vatLiabilities = { error: e.message }; }

          try {
            results.vatPayments = await getHMRCVATPayments(accessToken, entity.vatNumber, dateFrom, dateTo);
          } catch (e: any) { results.vatPayments = { error: e.message }; }
        }

        data = results;

        // Auto-fill entity with profile data from HMRC
        if (connection.entityId && results.profile && !results.profile.error) {
          try {
            const p = results.profile;
            const entityUpdate: any = {};

            // Extract name
            if (p.individual?.firstName && p.individual?.lastName) {
              entityUpdate.name = `${p.individual.firstName} ${p.individual.lastName}`;
            } else if (p.name?.forename && p.name?.surname) {
              entityUpdate.name = `${p.name.forename} ${p.name.surname}`;
            }

            // Extract NI number
            if (p.individual?.nino) entityUpdate.niNumber = p.individual.nino;
            else if (p.nino) entityUpdate.niNumber = p.nino;

            // Extract address
            if (p.individual?.address) {
              const a = p.individual.address;
              entityUpdate.registeredAddress = [a.line1, a.line2, a.line3, a.line4, a.postcode].filter(Boolean).join(', ');
            } else if (p.address) {
              const a = p.address;
              entityUpdate.registeredAddress = [a.line1, a.line2, a.line3, a.postcode].filter(Boolean).join(', ');
            }

            // Extract UTR from SA data
            if (results.saObligations?.obligations?.[0]?.identification?.referenceNumber) {
              entityUpdate.utr = results.saObligations.obligations[0].identification.referenceNumber;
            }

            const filtered = Object.fromEntries(Object.entries(entityUpdate).filter(([_, v]) => v));
            if (Object.keys(filtered).length > 0) {
              await (prisma as any).entity.update({
                where: { id: connection.entityId },
                data: filtered,
              });
            }
          } catch (e: any) {
            console.warn('[HMRC Sync] Entity update failed:', e.message);
          }
        }

        // Cache
        await (prisma as any).governmentConnection.update({
          where: { id: connectionId },
          data: { profileData: data, lastSyncAt: new Date(), lastError: null },
        });
        break;
      }

      default:
        return NextResponse.json({ error: 'Invalid action. Valid actions: profile, sa-obligations, sa-balance, sa-transactions, sa-charges, sa-payments, sa-liability, sa-calculations, business-details, income, employment, tax, ni, vat-obligations, vat-liabilities, vat-payments, full-sync' }, { status: 400 });
    }

    return NextResponse.json({
      data,
      connection: { id: connection.id, status: connection.status, lastSyncAt: new Date() },
    });
  } catch (error: any) {
    console.error('[HMRC Data] Error:', error);

    // Update connection error status
    try {
      const { connectionId } = await params;
      await (prisma as any).governmentConnection.update({
        where: { id: connectionId },
        data: { lastError: error.message, status: error.message?.includes('reconnect') ? 'expired' : 'error' },
      });
    } catch { /* ignore */ }

    return NextResponse.json({ error: error.message || 'Failed to fetch HMRC data' }, { status: 500 });
  }
}

// POST /api/government/hmrc/[connectionId] — Submit HMRC filings (VAT Return)
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
      where: { id: connectionId, userId, provider: 'hmrc' },
    });

    if (!connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    if (connection.status !== 'active') {
      return NextResponse.json({ error: 'Connection is not active. Please reconnect.' }, { status: 400 });
    }

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

    let entity: any = null;
    if (connection.entityId) {
      entity = await (prisma as any).entity.findUnique({ where: { id: connection.entityId } });
    }

    let responseData: any;
    let status = 'submitted';
    let reference: string | null = null;
    let description = '';

    switch (filingType) {
      case 'vat_return': {
        if (!entity?.vatNumber) {
          return NextResponse.json({ error: 'VAT Registration Number required on entity' }, { status: 400 });
        }
        description = 'VAT Return Submission';
        try {
          const { submitHMRCVATReturn } = await import('@/lib/government-api');
          responseData = await submitHMRCVATReturn(accessToken, entity.vatNumber, {
            periodKey: formData.periodKey,
            vatDueSales: parseFloat(formData.vatDueSales) || 0,
            vatDueAcquisitions: parseFloat(formData.vatDueAcquisitions) || 0,
            totalVatDue: parseFloat(formData.totalVatDue) || 0,
            vatReclaimedCurrPeriod: parseFloat(formData.vatReclaimedCurrPeriod) || 0,
            netVatDue: parseFloat(formData.netVatDue) || 0,
            totalValueSalesExVAT: parseInt(formData.totalValueSalesExVAT) || 0,
            totalValuePurchasesExVAT: parseInt(formData.totalValuePurchasesExVAT) || 0,
            totalValueGoodsSuppliedExVAT: parseInt(formData.totalValueGoodsSuppliedExVAT) || 0,
            totalAcquisitionsExVAT: parseInt(formData.totalAcquisitionsExVAT) || 0,
            finalised: formData.finalised === true,
          });
          reference = responseData?.formBundleNumber || responseData?.chargeRefNumber || null;
          status = 'submitted';
        } catch (err: any) {
          status = 'rejected';
          responseData = { error: err.message };
        }
        break;
      }
      default:
        return NextResponse.json({ error: `HMRC filing type "${filingType}" not supported. Supported: vat_return` }, { status: 400 });
    }

    // Record filing
    const filing = await (prisma as any).governmentFiling.create({
      data: {
        connectionId,
        userId,
        entityId: connection.entityId,
        provider: 'hmrc',
        filingType,
        reference,
        status,
        submittedAt: status !== 'rejected' ? new Date() : null,
        formData,
        responseData,
      },
    });

    await prisma.event.create({
      data: {
        userId,
        eventType: `gov.hmrc_filing_${status}`,
        entityType: 'government_filing',
        entityId: filing.id,
        payload: { filingType, description, reference },
      },
    });

    return NextResponse.json({
      filing: { id: filing.id, filingType, description, reference, status, responseData },
    });
  } catch (error: any) {
    console.error('[HMRC Filing] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to submit HMRC filing' }, { status: 500 });
  }
}
