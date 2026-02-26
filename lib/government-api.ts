/**
 * Government API Integration Library.
 *
 * Provides OAuth 2.0 flows and REST API clients for:
 * - **Companies House** — company profiles, officers, filing history, ROA changes
 * - **HMRC** — Self Assessment (MTD), VAT (MTD), individual tax, NI, obligations
 *
 * @module government-api
 */

// ==================== COMPANIES HOUSE ====================

const CH_API_BASE = 'https://api.company-information.service.gov.uk';
const CH_IDENTITY_BASE = 'https://identity.company-information.service.gov.uk';
const CH_FILING_BASE = 'https://api.company-information.service.gov.uk';

export const CH_OAUTH = {
  authorizeUrl: `${CH_IDENTITY_BASE}/oauth2/authorise`,
  tokenUrl: `${CH_IDENTITY_BASE}/oauth2/token`,
  clientId: process.env.CH_OAUTH_CLIENT_ID || '',
  clientSecret: process.env.CH_OAUTH_CLIENT_SECRET || '',
  redirectUri: `${process.env.NEXTAUTH_URL}/api/government/callback/companies-house`,
  // All filing scopes — dynamically built per company
  // Official CH Filing API scopes — only documented ones
  // See: https://developer-specs.company-information.service.gov.uk/manipulate-company-data-api-filing/guides/overview
  buildScopes(companyNumber: string): string {
    return [
      `https://api.company-information.service.gov.uk/company/${companyNumber}/registered-office-address.update`,
      `https://identity.company-information.service.gov.uk/user/profile.read`,
    ].join(' ');
  },
};

/**
 * Make a GET request to the Companies House REST API (read-only, API key auth).
 *
 * @param path - API path (e.g. `/company/12345678`)
 * @returns Parsed JSON response
 * @throws Error if `COMPANIES_HOUSE_API_KEY` is not configured or API returns an error
 */
export async function chApiGet(path: string): Promise<any> {
  const apiKey = process.env.COMPANIES_HOUSE_API_KEY;
  if (!apiKey) throw new Error('COMPANIES_HOUSE_API_KEY not configured');

  const res = await fetch(`${CH_API_BASE}${path}`, {
    headers: {
      Authorization: 'Basic ' + Buffer.from(apiKey + ':').toString('base64'),
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`CH API ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

/**
 * Make a POST request to the Companies House Filing API (OAuth-authenticated).
 *
 * @param path - Filing API path
 * @param accessToken - OAuth 2.0 access token from CH identity service
 * @param body - Request body to send as JSON
 * @returns Parsed JSON response
 */
export async function chFilingPost(path: string, accessToken: string, body: any): Promise<any> {
  const res = await fetch(`${CH_FILING_BASE}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`CH Filing POST ${res.status}: ${JSON.stringify(data).slice(0, 300)}`);
  }
  return data;
}

/**
 * Make a PUT request to the Companies House Filing API (for updates like ROA change).
 *
 * @param path - Filing API path
 * @param accessToken - OAuth 2.0 access token
 * @param body - Request body to send as JSON
 * @returns Parsed JSON response
 */
export async function chFilingPut(path: string, accessToken: string, body: any): Promise<any> {
  const res = await fetch(`${CH_FILING_BASE}${path}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`CH Filing PUT ${res.status}: ${JSON.stringify(data).slice(0, 300)}`);
  }
  return data;
}

/**
 * Make a DELETE request to the Companies House Filing API.
 *
 * @param path - Filing API path
 * @param accessToken - OAuth 2.0 access token
 * @returns `{ success: true }` on 204, or parsed JSON response
 */
export async function chFilingDelete(path: string, accessToken: string): Promise<any> {
  const res = await fetch(`${CH_FILING_BASE}${path}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    signal: AbortSignal.timeout(30000),
  });

  if (res.status === 204) return { success: true };
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`CH Filing DELETE ${res.status}: ${JSON.stringify(data).slice(0, 300)}`);
  }
  return data;
}

// ==================== CH TRANSACTION-BASED FILING ====================
// The CH Filing API requires: 1) Create transaction → 2) Add resource → 3) Close transaction

/**
 * Step 1 of CH transaction-based filing: create a transaction envelope.
 *
 * @param accessToken - OAuth 2.0 access token
 * @param companyNumber - Companies House company number (e.g. `'12345678'`)
 * @param description - Filing description (e.g. `'Change of registered office address'`)
 * @param reference - Optional reference string (defaults to `HomeLedger-{timestamp}`)
 * @returns Transaction object with `id` and metadata
 */
export async function createCHTransaction(
  accessToken: string,
  companyNumber: string,
  description: string,
  reference?: string,
): Promise<{ id: string; [key: string]: any }> {
  console.log('[CH Filing] Creating transaction for company:', companyNumber);
  const res = await fetch(`${CH_FILING_BASE}/transactions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      company_number: companyNumber,
      description,
      reference: reference || `HomeLedger-${Date.now()}`,
    }),
    signal: AbortSignal.timeout(30000),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`CH create transaction ${res.status}: ${JSON.stringify(data).slice(0, 300)}`);
  }
  console.log('[CH Filing] Transaction created:', data.id);
  return data;
}

/**
 * Step 2 of CH transaction-based filing: add a Registered Office Address (ROA) change resource.
 *
 * @param accessToken - OAuth 2.0 access token
 * @param transactionId - Transaction ID from {@link createCHTransaction}
 * @param addressData - New registered office address fields
 * @param referenceEtag - Current ROA etag from {@link getROAEtag} (prevents stale updates)
 * @returns Filing resource confirmation
 */
export async function addROAToTransaction(
  accessToken: string,
  transactionId: string,
  addressData: {
    address_line_1: string;
    address_line_2?: string;
    locality: string;
    region?: string;
    postal_code: string;
    country?: string;
    premises?: string;
    po_box?: string;
  },
  referenceEtag: string,
): Promise<any> {
  console.log('[CH Filing] Adding ROA resource to transaction:', transactionId);
  const res = await fetch(`${CH_FILING_BASE}/transactions/${transactionId}/registered-office-address`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...addressData,
      reference_etag: referenceEtag,
      accept_appropriate_office_address_statement: true,
    }),
    signal: AbortSignal.timeout(30000),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`CH add ROA resource ${res.status}: ${JSON.stringify(data).slice(0, 300)}`);
  }
  return data;
}

/**
 * Step 3 of CH transaction-based filing: close (submit) the transaction.
 *
 * @param accessToken - OAuth 2.0 access token
 * @param transactionId - Transaction ID to close
 * @returns Submission confirmation
 */
export async function closeCHTransaction(
  accessToken: string,
  transactionId: string,
): Promise<any> {
  console.log('[CH Filing] Closing transaction:', transactionId);
  const res = await fetch(`${CH_FILING_BASE}/transactions/${transactionId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status: 'closed' }),
    signal: AbortSignal.timeout(30000),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`CH close transaction ${res.status}: ${JSON.stringify(data).slice(0, 300)}`);
  }
  console.log('[CH Filing] Transaction closed successfully');
  return data;
}

/**
 * Get the status of a Companies House filing transaction.
 *
 * @param accessToken - OAuth 2.0 access token
 * @param transactionId - Transaction ID to check
 * @returns Transaction status object (accepted/rejected/pending)
 */
export async function getCHTransactionStatus(
  accessToken: string,
  transactionId: string,
): Promise<any> {
  const res = await fetch(`${CH_FILING_BASE}/transactions/${transactionId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(15000),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`CH get transaction ${res.status}: ${JSON.stringify(data).slice(0, 300)}`);
  }
  return data;
}

/**
 * Get the current Registered Office Address etag for a company.
 * Required before creating an ROA change resource to prevent stale updates.
 *
 * @param companyNumber - Companies House company number
 * @returns The etag string
 * @throws Error if etag cannot be retrieved
 */
export async function getROAEtag(companyNumber: string): Promise<string> {
  const apiKey = process.env.COMPANIES_HOUSE_API_KEY;
  if (!apiKey) throw new Error('COMPANIES_HOUSE_API_KEY not configured');

  const res = await fetch(`${CH_API_BASE}/company/${companyNumber}/registered-office-address`, {
    headers: {
      Authorization: 'Basic ' + Buffer.from(apiKey + ':').toString('base64'),
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    throw new Error(`CH ROA etag fetch ${res.status}`);
  }

  const data = await res.json();
  // etag is in the response body or headers
  const etag = data.etag || res.headers.get('etag')?.replace(/"/g, '') || '';
  if (!etag) {
    throw new Error('Could not get ROA etag — required for filing');
  }
  console.log('[CH Filing] ROA etag:', etag);
  return etag;
}

/** Get company profile from Companies House (read-only, API key auth). */
export async function getCompanyProfile(companyNumber: string) {
  return chApiGet(`/company/${companyNumber}`);
}

/** Get list of company officers (directors, secretaries). */
export async function getCompanyOfficers(companyNumber: string) {
  return chApiGet(`/company/${companyNumber}/officers`);
}

/** Get company filing history (confirmation statements, annual returns, etc). */
export async function getCompanyFilingHistory(companyNumber: string) {
  return chApiGet(`/company/${companyNumber}/filing-history`);
}

/** Get the company's registered office address. */
export async function getRegisteredOffice(companyNumber: string) {
  return chApiGet(`/company/${companyNumber}/registered-office-address`);
}

/** Get persons with significant control (PSCs) for a company. */
export async function getCompanyPSCs(companyNumber: string) {
  return chApiGet(`/company/${companyNumber}/persons-with-significant-control`);
}

/** Get company charges (mortgages/secured loans). */
export async function getCompanyCharges(companyNumber: string) {
  return chApiGet(`/company/${companyNumber}/charges`);
}

/** Get company statutory registers. */
export async function getCompanyRegisters(companyNumber: string) {
  return chApiGet(`/company/${companyNumber}/registers`);
}

/** Get a specific officer's appointment details. */
export async function getCompanyOfficerAppointment(officerId: string) {
  return chApiGet(`/officers/${officerId}/appointments`);
}

/**
 * Build the Companies House OAuth 2.0 authorization URL.
 *
 * @param state - CSRF state parameter (round-tripped through callback)
 * @param companyNumber - Company number to build filing scopes for
 * @returns Full authorization URL with scopes encoded as `%20`-separated
 */
export function buildCHAuthUrl(state: string, companyNumber: string): string {
  const scope = CH_OAUTH.buildScopes(companyNumber);
  // CH identity service requires %20 for space-separated scopes, not +
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CH_OAUTH.clientId,
    redirect_uri: CH_OAUTH.redirectUri,
    state,
  });
  // Manually append scope with %20 encoding instead of URLSearchParams' + encoding
  return `${CH_OAUTH.authorizeUrl}?${params.toString()}&scope=${encodeURIComponent(scope).replace(/%2B/g, '%20')}`;
}

/**
 * Exchange a Companies House authorization code for access + refresh tokens.
 *
 * @param code - Authorization code from OAuth callback
 * @returns Token response with `access_token`, `refresh_token`, `expires_in`
 */
export async function exchangeCHToken(code: string): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope?: string;
}> {
  const bodyParams = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: CH_OAUTH.redirectUri,
    client_id: CH_OAUTH.clientId,
    client_secret: CH_OAUTH.clientSecret,
  });
  console.log('[CH Token] POST to:', CH_OAUTH.tokenUrl);
  console.log('[CH Token] body:', bodyParams.toString().replace(CH_OAUTH.clientSecret, '***'));
  console.log('[CH Token] client_id length:', CH_OAUTH.clientId.length, 'secret length:', CH_OAUTH.clientSecret.length);

  const res = await fetch(CH_OAUTH.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: bodyParams,
    signal: AbortSignal.timeout(30000),
  });

  const responseText = await res.text();
  console.log('[CH Token] Response status:', res.status, 'body:', responseText.substring(0, 300));

  if (!res.ok) {
    throw new Error(`CH token exchange failed: ${res.status} ${responseText}`);
  }
  return JSON.parse(responseText);
}

/**
 * Refresh an expired Companies House access token.
 *
 * @param refreshToken - The refresh token from the original token exchange
 * @returns New token response
 */
export async function refreshCHToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}> {
  const res = await fetch(CH_OAUTH.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: CH_OAUTH.clientId,
      client_secret: CH_OAUTH.clientSecret,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) throw new Error('CH token refresh failed');
  return res.json();
}


// ==================== HMRC ====================

const HMRC_PRODUCTION_BASE = 'https://api.service.hmrc.gov.uk';
const HMRC_SANDBOX_BASE = 'https://test-api.service.hmrc.gov.uk';

function getHMRCBase(): string {
  return process.env.HMRC_USE_SANDBOX === 'true' ? HMRC_SANDBOX_BASE : HMRC_PRODUCTION_BASE;
}

export const HMRC_OAUTH = {
  get authorizeUrl() { return `${getHMRCBase()}/oauth/authorize`; },
  get tokenUrl() { return `${getHMRCBase()}/oauth/token`; },
  clientId: process.env.HMRC_CLIENT_ID || '',
  clientSecret: process.env.HMRC_CLIENT_SECRET || '',
  redirectUri: `${process.env.NEXTAUTH_URL}/api/government/callback/hmrc`,
  scopes: 'read:self-assessment write:self-assessment read:vat write:vat read:individual-benefits read:individual-employment read:individual-tax read:national-insurance',
};

/**
 * Make a GET request to the HMRC API with OAuth token and versioned Accept header.
 *
 * @param path - HMRC API path (e.g. `/obligations/details/{nino}/income-and-expenditure`)
 * @param accessToken - OAuth 2.0 access token
 * @param acceptVersion - API version for Accept header (e.g. `'1.0'`, `'4.0'`, `'8.0'`)
 * @returns Parsed JSON response
 */
export async function hmrcApiGet(path: string, accessToken: string, acceptVersion = '1.0'): Promise<any> {
  const base = getHMRCBase();
  const res = await fetch(`${base}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: `application/vnd.hmrc.${acceptVersion}+json`,
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HMRC API ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

/**
 * Make a POST request to the HMRC API with OAuth token.
 *
 * @param path - HMRC API path
 * @param accessToken - OAuth 2.0 access token
 * @param body - Request body
 * @param acceptVersion - API version for Accept header
 * @returns Parsed JSON response
 */
export async function hmrcApiPost(path: string, accessToken: string, body: any, acceptVersion = '1.0'): Promise<any> {
  const base = getHMRCBase();
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: `application/vnd.hmrc.${acceptVersion}+json`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`HMRC API ${res.status}: ${JSON.stringify(data).slice(0, 300)}`);
  }
  return data;
}

/**
 * Build the HMRC OAuth 2.0 authorization URL.
 *
 * @param state - CSRF state parameter
 * @returns Full authorization URL with SA, VAT, NI, and employment scopes
 */
export function buildHMRCAuthUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: HMRC_OAUTH.clientId,
    redirect_uri: HMRC_OAUTH.redirectUri,
    scope: HMRC_OAUTH.scopes,
    state,
  });
  return `${HMRC_OAUTH.authorizeUrl}?${params.toString()}`;
}

/**
 * Exchange an HMRC authorization code for access + refresh tokens.
 *
 * @param code - Authorization code from OAuth callback
 * @returns Token response with `access_token`, `refresh_token`, `expires_in`
 */
export async function exchangeHMRCToken(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}> {
  const res = await fetch(HMRC_OAUTH.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: HMRC_OAUTH.redirectUri,
      client_id: HMRC_OAUTH.clientId,
      client_secret: HMRC_OAUTH.clientSecret,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`HMRC token exchange failed: ${res.status} ${err}`);
  }
  return res.json();
}

/**
 * Refresh an expired HMRC access token.
 *
 * @param refreshToken - The refresh token from the original exchange
 * @returns New token response with rotated refresh token
 */
export async function refreshHMRCToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const res = await fetch(HMRC_OAUTH.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: HMRC_OAUTH.clientId,
      client_secret: HMRC_OAUTH.clientSecret,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) throw new Error('HMRC token refresh failed');
  return res.json();
}


// ==================== HMRC MTD DATA ENDPOINTS ====================
// Ref: https://developer.service.hmrc.gov.uk/api-documentation/docs/api

// --- Self Assessment (MTD) ---

/** Get Self Assessment account balance (MTD v4.0). */
export async function getHMRCSABalance(accessToken: string, nino: string) {
  return hmrcApiGet(`/accounts/self-assessment/${nino}/balance`, accessToken, '4.0');
}

/** Get Self Assessment transactions for a date range (MTD v4.0). */
export async function getHMRCSATransactions(accessToken: string, nino: string, from: string, to: string) {
  return hmrcApiGet(`/accounts/self-assessment/${nino}/transactions?from=${from}&to=${to}`, accessToken, '4.0');
}

/** Get Self Assessment charges for a date range (MTD v4.0). */
export async function getHMRCSACharges(accessToken: string, nino: string, from: string, to: string) {
  return hmrcApiGet(`/accounts/self-assessment/${nino}/charges?from=${from}&to=${to}`, accessToken, '4.0');
}

/** Get Self Assessment payments for a date range (MTD v4.0). */
export async function getHMRCSAPayments(accessToken: string, nino: string, from: string, to: string) {
  return hmrcApiGet(`/accounts/self-assessment/${nino}/payments?from=${from}&to=${to}`, accessToken, '4.0');
}

/** Get Self Assessment liability breakdown (v1.0). */
export async function getHMRCSALiability(accessToken: string, utr: string) {
  return hmrcApiGet(`/self-assessment/accounts/${utr}/liability`, accessToken, '1.0');
}

/** Retrieve a specific HMRC tax calculation result (MTD v8.0). */
export async function getHMRCTaxCalculation(accessToken: string, nino: string, taxYear: string, calculationId: string) {
  return hmrcApiGet(`/individuals/calculations/${nino}/self-assessment/${taxYear}/${calculationId}`, accessToken, '8.0');
}

/** Trigger a new HMRC tax calculation for a tax year (MTD v8.0). */
export async function triggerHMRCTaxCalculation(accessToken: string, nino: string, taxYear: string) {
  return hmrcApiPost(`/individuals/calculations/${nino}/self-assessment/${taxYear}`, accessToken, {}, '8.0');
}

/** List all HMRC tax calculations for a tax year (MTD v8.0). */
export async function listHMRCTaxCalculations(accessToken: string, nino: string, taxYear: string) {
  return hmrcApiGet(`/individuals/calculations/${nino}/self-assessment?taxYear=${taxYear}`, accessToken, '8.0');
}

/** Get HMRC filing obligations/deadlines (MTD v3.0). */
export async function getHMRCObligations(accessToken: string, nino: string) {
  return hmrcApiGet(`/obligations/details/${nino}/income-and-expenditure`, accessToken, '3.0');
}

/** Get self-employment businesses registered with HMRC (MTD v5.0). */
export async function getHMRCSEBusinesses(accessToken: string, nino: string) {
  return hmrcApiGet(`/individuals/business/self-employment/${nino}`, accessToken, '5.0');
}

/** Get HMRC business details list (MTD v2.0). */
export async function getHMRCBusinessDetails(accessToken: string, nino: string) {
  return hmrcApiGet(`/individuals/business/details/${nino}/list`, accessToken, '2.0');
}

/** Get individual taxpayer details from HMRC (MTD v2.0). */
export async function getHMRCIndividualDetails(accessToken: string, nino: string) {
  return hmrcApiGet(`/individuals/details/${nino}`, accessToken, '2.0');
}

// --- Individual APIs (non-MTD) ---

/** Get individual benefits data from HMRC (v1.1). */
export async function getHMRCIndividualBenefits(accessToken: string) {
  return hmrcApiGet('/individual-benefits', accessToken, '1.1');
}

/** Get individual employment data from HMRC (v1.2). */
export async function getHMRCIndividualEmployment(accessToken: string) {
  return hmrcApiGet('/individual-employment', accessToken, '1.2');
}

/** Get individual income data from HMRC (v1.2). */
export async function getHMRCIndividualIncome(accessToken: string) {
  return hmrcApiGet('/individual-income', accessToken, '1.2');
}

/** Get individual tax data from HMRC (v1.1). */
export async function getHMRCIndividualTax(accessToken: string) {
  return hmrcApiGet('/individual-tax', accessToken, '1.1');
}

/** Get National Insurance contributions data from HMRC (v1.1). */
export async function getHMRCNationalInsurance(accessToken: string) {
  return hmrcApiGet('/national-insurance', accessToken, '1.1');
}

// --- VAT (MTD) v1.0 ---

/** Get VAT filing obligations for a VAT-registered business (MTD v1.0). */
export async function getHMRCVATObligations(accessToken: string, vrn: string, from?: string, to?: string) {
  const qs = from && to ? `?from=${from}&to=${to}` : '';
  return hmrcApiGet(`/organisations/vat/${vrn}/obligations${qs}`, accessToken, '1.0');
}

/** Get a specific VAT return by period key (MTD v1.0). */
export async function getHMRCVATReturn(accessToken: string, vrn: string, periodKey: string) {
  return hmrcApiGet(`/organisations/vat/${vrn}/returns/${periodKey}`, accessToken, '1.0');
}

/** Submit a VAT return to HMRC (MTD v1.0). */
export async function submitHMRCVATReturn(accessToken: string, vrn: string, body: any) {
  return hmrcApiPost(`/organisations/vat/${vrn}/returns`, accessToken, body, '1.0');
}

/** Get VAT liabilities for a date range (MTD v1.0). */
export async function getHMRCVATLiabilities(accessToken: string, vrn: string, from: string, to: string) {
  return hmrcApiGet(`/organisations/vat/${vrn}/liabilities?from=${from}&to=${to}`, accessToken, '1.0');
}

/** Get VAT payments for a date range (MTD v1.0). */
export async function getHMRCVATPayments(accessToken: string, vrn: string, from: string, to: string) {
  return hmrcApiGet(`/organisations/vat/${vrn}/payments?from=${from}&to=${to}`, accessToken, '1.0');
}


// ==================== TOKEN MANAGEMENT ====================

/**
 * Ensure a government API access token is still valid, refreshing if expired.
 *
 * Checks token expiry with a 5-minute buffer. If expired, automatically
 * refreshes using the appropriate provider's refresh endpoint (CH or HMRC).
 *
 * @param connection - Connection record with token details
 * @param updateFn - Callback to persist the refreshed token to the database
 * @returns Valid access token string
 * @throws Error if token is expired and cannot be refreshed
 */
export async function ensureValidToken(
  connection: { accessToken: string; refreshToken: string | null; tokenExpiresAt: Date | null; provider: string },
  updateFn: (newToken: { accessToken: string; refreshToken?: string; tokenExpiresAt: Date }) => Promise<void>
): Promise<string> {
  // Check if token is still valid (with 5 min buffer)
  if (connection.tokenExpiresAt) {
    const expiresAt = new Date(connection.tokenExpiresAt);
    const buffer = 5 * 60 * 1000; // 5 minutes
    if (expiresAt.getTime() - buffer > Date.now()) {
      return connection.accessToken;
    }
  }

  // Token expired, try to refresh
  if (!connection.refreshToken) {
    throw new Error('Token expired and no refresh token available. Please reconnect.');
  }

  try {
    let result: { access_token: string; refresh_token?: string; expires_in: number };
    
    if (connection.provider === 'companies_house') {
      result = await refreshCHToken(connection.refreshToken);
    } else {
      result = await refreshHMRCToken(connection.refreshToken);
    }

    const newExpiry = new Date(Date.now() + result.expires_in * 1000);
    await updateFn({
      accessToken: result.access_token,
      refreshToken: result.refresh_token,
      tokenExpiresAt: newExpiry,
    });

    return result.access_token;
  } catch (error) {
    throw new Error('Failed to refresh token. Please reconnect your account.');
  }
}
