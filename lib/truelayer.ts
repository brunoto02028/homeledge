/**
 * TrueLayer Open Banking Integration
 * Handles OAuth flow, token management, and data fetching
 * Supports both personal and business accounts
 * 
 * Required env vars:
 *   TRUELAYER_CLIENT_ID
 *   TRUELAYER_CLIENT_SECRET
 *   TRUELAYER_REDIRECT_URI  (e.g. https://homeledger.co.uk/api/open-banking/callback)
 *   TRUELAYER_SANDBOX       (true/false - use sandbox for testing)
 */

const CLIENT_ID = process.env.TRUELAYER_CLIENT_ID || '';
const CLIENT_SECRET = process.env.TRUELAYER_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.TRUELAYER_REDIRECT_URI || '';
const IS_SANDBOX = process.env.TRUELAYER_SANDBOX === 'true';

const AUTH_BASE = IS_SANDBOX
  ? 'https://auth.truelayer-sandbox.com'
  : 'https://auth.truelayer.com';

const API_BASE = IS_SANDBOX
  ? 'https://api.truelayer-sandbox.com'
  : 'https://api.truelayer.com';

// Scopes for both personal and business accounts
const SCOPES = [
  'info',
  'accounts',
  'balance',
  'transactions',
  'offline_access', // enables refresh tokens
];

export interface TrueLayerAccount {
  account_id: string;
  account_type: string; // TRANSACTION, SAVINGS, BUSINESS
  display_name: string;
  currency: string;
  account_number?: { iban?: string; swift_bic?: string; number?: string; sort_code?: string };
  provider: { display_name: string; provider_id: string; logo_uri?: string };
}

export interface TrueLayerBalance {
  currency: string;
  available: number;
  current: number;
  overdraft?: number;
}

export interface TrueLayerTransaction {
  transaction_id: string;
  timestamp: string;
  description: string;
  amount: number;
  currency: string;
  transaction_type: string; // DEBIT, CREDIT
  transaction_category: string;
  merchant_name?: string;
  running_balance?: { amount: number; currency: string };
  meta?: Record<string, string>;
}

/**
 * Build the OAuth authorization URL for TrueLayer
 */
export function buildAuthUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: SCOPES.join(' '),
    state,
  });

  // Sandbox uses mock provider; live uses all UK banks
  if (IS_SANDBOX) {
    params.set('providers', 'mock');
    params.set('enable_mock', 'true');
  } else {
    params.set('providers', 'uk-ob-all uk-oauth-all');
  }

  return `${AUTH_BASE}/?${params.toString()}`;
}

/**
 * Exchange authorization code for access + refresh tokens
 */
export async function exchangeCode(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}> {
  const res = await fetch(`${AUTH_BASE}/connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      code,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`TrueLayer token exchange failed: ${res.status} ${err}`);
  }

  return res.json();
}

/**
 * Refresh an expired access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const res = await fetch(`${AUTH_BASE}/connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`TrueLayer token refresh failed: ${res.status} ${err}`);
  }

  return res.json();
}

/**
 * Make an authenticated API call to TrueLayer
 */
async function tlGet<T>(accessToken: string, path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const err = await res.text();
    // Detect SCA (Strong Customer Authentication) expiration
    if (res.status === 403 && err.includes('sca_exceeded')) {
      const scaError = new Error('SCA_EXCEEDED: Bank requires re-authentication for historical data. Please disconnect and reconnect the bank, then sync immediately within 5 minutes.');
      (scaError as any).code = 'SCA_EXCEEDED';
      throw scaError;
    }
    throw new Error(`TrueLayer API ${path} failed: ${res.status} ${err}`);
  }

  const data = await res.json();
  return data.results ?? data;
}

/**
 * List all accounts for a connection
 */
export async function getAccounts(accessToken: string): Promise<TrueLayerAccount[]> {
  return tlGet<TrueLayerAccount[]>(accessToken, '/data/v1/accounts');
}

/**
 * Get balance for a specific account
 */
export async function getBalance(accessToken: string, accountId: string): Promise<TrueLayerBalance[]> {
  return tlGet<TrueLayerBalance[]>(accessToken, `/data/v1/accounts/${accountId}/balance`);
}

/**
 * Get transactions for a specific account within a date range
 */
export async function getTransactions(
  accessToken: string,
  accountId: string,
  from: string, // ISO date
  to: string,   // ISO date
): Promise<TrueLayerTransaction[]> {
  return tlGet<TrueLayerTransaction[]>(
    accessToken,
    `/data/v1/accounts/${accountId}/transactions?from=${from}&to=${to}`
  );
}

/**
 * Revoke a token (disconnect)
 */
export async function revokeToken(accessToken: string): Promise<void> {
  await fetch(`${API_BASE}/api/delete`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

/**
 * Check if TrueLayer is configured
 */
export function isConfigured(): boolean {
  return !!(CLIENT_ID && CLIENT_SECRET && REDIRECT_URI);
}
