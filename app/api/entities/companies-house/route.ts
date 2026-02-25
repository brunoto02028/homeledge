import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';

const CH_API_BASE = 'https://api.company-information.service.gov.uk';
const CH_API_KEY = process.env.COMPANIES_HOUSE_API_KEY || '';

// GET - Search Companies House by company number or name
export async function GET(request: Request) {
  try {
    const userId = await requireUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const companyNumber = searchParams.get('number');
    const query = searchParams.get('q');

    if (!CH_API_KEY) {
      return NextResponse.json({ 
        error: 'Companies House API key not configured',
        hint: 'Set COMPANIES_HOUSE_API_KEY in .env (free at https://developer.company-information.service.gov.uk)'
      }, { status: 503 });
    }

    const headers = {
      'Authorization': 'Basic ' + Buffer.from(CH_API_KEY + ':').toString('base64'),
    };

    // Lookup by company number (exact)
    if (companyNumber) {
      const res = await fetch(`${CH_API_BASE}/company/${companyNumber}`, { headers });
      
      if (!res.ok) {
        if (res.status === 404) {
          return NextResponse.json({ error: 'Company not found' }, { status: 404 });
        }
        return NextResponse.json({ error: 'Companies House API error' }, { status: res.status });
      }

      const company = await res.json();

      // Fetch officers + filing history in parallel
      let officers: any[] = [];
      let filings: any[] = [];
      try {
        const [officersRes, filingsRes] = await Promise.all([
          fetch(`${CH_API_BASE}/company/${companyNumber}/officers`, { headers }),
          fetch(`${CH_API_BASE}/company/${companyNumber}/filing-history?items_per_page=20`, { headers }),
        ]);
        if (officersRes.ok) {
          const officersData = await officersRes.json();
          officers = (officersData.items || []).map((o: any) => ({
            name: o.name,
            role: o.officer_role,
            appointedDate: o.appointed_on,
            resignedDate: o.resigned_on || null,
            nationality: o.nationality,
            occupation: o.occupation || null,
            countryOfResidence: o.country_of_residence || null,
          }));
        }
        if (filingsRes.ok) {
          const filingsData = await filingsRes.json();
          filings = (filingsData.items || []).map((f: any) => ({
            date: f.date,
            type: f.type,
            category: f.category,
            description: f.description,
            actionDate: f.action_date || null,
          }));
        }
      } catch (e) {
        console.log('[CH] Officers/filings fetch failed, continuing without');
      }

      // Format address
      const addr = company.registered_office_address || {};
      const registeredAddress = [
        addr.address_line_1,
        addr.address_line_2,
        addr.locality,
        addr.region,
        addr.postal_code,
        addr.country,
      ].filter(Boolean).join(', ');

      return NextResponse.json({
        companyNumber: company.company_number,
        name: company.company_name,
        status: company.company_status,
        type: company.type, // ltd, llp, etc.
        incorporationDate: company.date_of_creation,
        sicCodes: company.sic_codes || [],
        registeredAddress,
        officers,
        filings,
        entityType: mapCompanyType(company.type),
        raw: {
          jurisdiction: company.jurisdiction,
          lastAccounts: company.last_accounts,
          nextAccounts: company.accounts?.next_due,
          confirmationStatement: company.confirmation_statement?.next_due,
        },
      });
    }

    // Search by name
    if (query) {
      const res = await fetch(`${CH_API_BASE}/search/companies?q=${encodeURIComponent(query)}&items_per_page=10`, { headers });
      
      if (!res.ok) {
        return NextResponse.json({ error: 'Search failed' }, { status: res.status });
      }

      const data = await res.json();
      const results = (data.items || []).map((item: any) => ({
        companyNumber: item.company_number,
        name: item.title,
        status: item.company_status,
        type: item.company_type,
        incorporationDate: item.date_of_creation,
        address: item.address_snippet,
        entityType: mapCompanyType(item.company_type),
      }));

      return NextResponse.json({ results, total: data.total_results });
    }

    return NextResponse.json({ error: 'Provide ?number=XXXXXXXX or ?q=company+name' }, { status: 400 });
  } catch (error: any) {
    console.error('[CompaniesHouse] Error:', error);
    return NextResponse.json({ error: 'Failed to query Companies House' }, { status: 500 });
  }
}

function mapCompanyType(chType: string): string {
  const mapping: Record<string, string> = {
    'ltd': 'limited_company',
    'private-limited-guarant-nsc': 'limited_company',
    'private-limited-guarant-nsc-limited-exemption': 'limited_company',
    'private-limited-shares-section-30-exemption': 'limited_company',
    'private-unlimited': 'limited_company',
    'private-unlimited-nsc': 'limited_company',
    'llp': 'llp',
    'limited-partnership': 'partnership',
    'scottish-partnership': 'partnership',
    'plc': 'limited_company',
  };
  return mapping[chType] || 'limited_company';
}
