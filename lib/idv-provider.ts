/**
 * Multi-Provider Identity Verification Architecture
 * 
 * Abstract interface supporting: Yoti (current), Sumsub (future), Onfido (future)
 * Provider selection based on config or entity-level preference.
 */

// ============================================================
// Types
// ============================================================

export type IdvProvider = 'yoti' | 'sumsub' | 'onfido';

export interface IdvSessionOptions {
  callbackUrl: string;
  userEmail?: string;
  userName?: string;
  documentTypes?: ('passport' | 'driving_licence' | 'national_id')[];
  checks?: ('document_authenticity' | 'face_match' | 'liveness' | 'aml')[];
  locale?: string;
  presetCountry?: string;
}

export interface IdvSessionResult {
  provider: IdvProvider;
  sessionId: string;
  clientToken: string;
  tokenTtl: number;
  verificationUrl: string;
}

export interface IdvVerificationResult {
  provider: IdvProvider;
  sessionId: string;
  state: 'pending' | 'completed' | 'failed' | 'expired';
  passed: boolean;
  checks: { type: string; status: string; passed: boolean }[];
  userProfile?: {
    fullName?: string;
    dateOfBirth?: string;
    nationality?: string;
    documentType?: string;
    documentNumber?: string;
    documentCountry?: string;
  };
  rawResponse?: any;
}

export interface AmlCheckInput {
  givenNames: string;
  familyName: string;
  dateOfBirth?: string;
  country?: string;
}

export interface AmlCheckOutput {
  provider: IdvProvider;
  onPepList: boolean;
  onWatchList: boolean;
  onFraudList: boolean;
  riskLevel: 'low' | 'medium' | 'high';
}

// ============================================================
// Abstract Provider Interface
// ============================================================

export interface IIdvProvider {
  name: IdvProvider;
  isConfigured(): boolean;
  createSession(options: IdvSessionOptions): Promise<IdvSessionResult>;
  getResult(sessionId: string): Promise<IdvVerificationResult>;
  performAmlCheck?(data: AmlCheckInput): Promise<AmlCheckOutput>;
}

// ============================================================
// Yoti Adapter (active)
// ============================================================

class YotiAdapter implements IIdvProvider {
  name: IdvProvider = 'yoti';

  isConfigured(): boolean {
    const { isYotiConfigured } = require('./yoti-client');
    return isYotiConfigured();
  }

  async createSession(options: IdvSessionOptions): Promise<IdvSessionResult> {
    const { createIdvSession } = require('./yoti-client');
    const result = await createIdvSession({
      callbackUrl: options.callbackUrl,
      userEmail: options.userEmail,
      userName: options.userName,
    });
    return {
      provider: 'yoti',
      sessionId: result.sessionId,
      clientToken: result.clientSessionToken,
      tokenTtl: result.clientSessionTokenTtl,
      verificationUrl: result.iframeUrl,
    };
  }

  async getResult(sessionId: string): Promise<IdvVerificationResult> {
    const { getSessionResult } = require('./yoti-client');
    const result = await getSessionResult(sessionId);
    return {
      provider: 'yoti',
      sessionId: result.sessionId,
      state: result.state === 'COMPLETED' ? 'completed' :
             result.state === 'EXPIRED' ? 'expired' :
             result.state === 'ERROR' ? 'failed' : 'pending',
      passed: result.passed,
      checks: result.checks,
      userProfile: result.userProfile,
    };
  }

  async performAmlCheck(data: AmlCheckInput): Promise<AmlCheckOutput> {
    const { performAmlCheck } = require('./yoti-client');
    const result = await performAmlCheck(data);
    return { provider: 'yoti', ...result };
  }
}

// ============================================================
// Sumsub Adapter (placeholder — ready for integration)
// ============================================================

class SumsubAdapter implements IIdvProvider {
  name: IdvProvider = 'sumsub';

  isConfigured(): boolean {
    return !!(process.env.SUMSUB_APP_TOKEN && process.env.SUMSUB_SECRET_KEY);
  }

  async createSession(options: IdvSessionOptions): Promise<IdvSessionResult> {
    if (!this.isConfigured()) throw new Error('Sumsub not configured. Set SUMSUB_APP_TOKEN and SUMSUB_SECRET_KEY.');

    // Sumsub API: POST /resources/applicants
    // then POST /resources/accessTokens
    const appToken = process.env.SUMSUB_APP_TOKEN!;
    const secretKey = process.env.SUMSUB_SECRET_KEY!;
    const baseUrl = 'https://api.sumsub.com';

    // Step 1: Create applicant
    const crypto = require('crypto');
    const ts = Math.floor(Date.now() / 1000).toString();
    const body = JSON.stringify({
      externalUserId: `hl_${crypto.randomUUID().slice(0, 8)}`,
      email: options.userEmail,
      fixedInfo: { firstName: options.userName?.split(' ')[0], lastName: options.userName?.split(' ').slice(1).join(' ') },
    });

    const signPayload = ts + 'POST' + '/resources/applicants?levelName=basic-kyc-level' + body;
    const signature = crypto.createHmac('sha256', secretKey).update(signPayload).digest('hex');

    const applicantRes = await fetch(`${baseUrl}/resources/applicants?levelName=basic-kyc-level`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-App-Token': appToken,
        'X-App-Access-Ts': ts,
        'X-App-Access-Sig': signature,
      },
      body,
    });

    if (!applicantRes.ok) throw new Error(`Sumsub applicant creation failed: ${applicantRes.status}`);
    const applicant = await applicantRes.json();

    // Step 2: Get access token for SDK
    const ts2 = Math.floor(Date.now() / 1000).toString();
    const tokenPath = `/resources/accessTokens?userId=${applicant.id}&levelName=basic-kyc-level`;
    const sig2 = crypto.createHmac('sha256', secretKey).update(ts2 + 'POST' + tokenPath).digest('hex');

    const tokenRes = await fetch(`${baseUrl}${tokenPath}`, {
      method: 'POST',
      headers: {
        'X-App-Token': appToken,
        'X-App-Access-Ts': ts2,
        'X-App-Access-Sig': sig2,
      },
    });

    if (!tokenRes.ok) throw new Error(`Sumsub token generation failed: ${tokenRes.status}`);
    const tokenData = await tokenRes.json();

    return {
      provider: 'sumsub',
      sessionId: applicant.id,
      clientToken: tokenData.token,
      tokenTtl: tokenData.expiresAt ? Math.floor((new Date(tokenData.expiresAt).getTime() - Date.now()) / 1000) : 600,
      verificationUrl: `https://api.sumsub.com/idensic/l/#/sbx_${tokenData.token}`,
    };
  }

  async getResult(sessionId: string): Promise<IdvVerificationResult> {
    if (!this.isConfigured()) throw new Error('Sumsub not configured');

    const crypto = require('crypto');
    const ts = Math.floor(Date.now() / 1000).toString();
    const path = `/resources/applicants/${sessionId}/requiredIdDocsStatus`;
    const sig = crypto.createHmac('sha256', process.env.SUMSUB_SECRET_KEY!)
      .update(ts + 'GET' + path).digest('hex');

    const res = await fetch(`https://api.sumsub.com${path}`, {
      headers: {
        'X-App-Token': process.env.SUMSUB_APP_TOKEN!,
        'X-App-Access-Ts': ts,
        'X-App-Access-Sig': sig,
      },
    });

    if (!res.ok) throw new Error(`Sumsub status check failed: ${res.status}`);
    const data = await res.json();

    const reviewAnswer = data.reviewAnswer || 'pending';
    return {
      provider: 'sumsub',
      sessionId,
      state: reviewAnswer === 'GREEN' ? 'completed' :
             reviewAnswer === 'RED' ? 'failed' : 'pending',
      passed: reviewAnswer === 'GREEN',
      checks: [{ type: 'identity', status: reviewAnswer, passed: reviewAnswer === 'GREEN' }],
      rawResponse: data,
    };
  }
}

// ============================================================
// Onfido Adapter (placeholder — ready for integration)
// ============================================================

class OnfidoAdapter implements IIdvProvider {
  name: IdvProvider = 'onfido';

  isConfigured(): boolean {
    return !!process.env.ONFIDO_API_TOKEN;
  }

  async createSession(options: IdvSessionOptions): Promise<IdvSessionResult> {
    if (!this.isConfigured()) throw new Error('Onfido not configured. Set ONFIDO_API_TOKEN.');

    const apiToken = process.env.ONFIDO_API_TOKEN!;
    const baseUrl = process.env.ONFIDO_API_URL || 'https://api.eu.onfido.com/v3.6';

    // Step 1: Create applicant
    const applicantRes = await fetch(`${baseUrl}/applicants`, {
      method: 'POST',
      headers: {
        'Authorization': `Token token=${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        first_name: options.userName?.split(' ')[0] || 'Unknown',
        last_name: options.userName?.split(' ').slice(1).join(' ') || 'Unknown',
        email: options.userEmail,
      }),
    });

    if (!applicantRes.ok) throw new Error(`Onfido applicant creation failed: ${applicantRes.status}`);
    const applicant = await applicantRes.json();

    // Step 2: Create SDK token
    const sdkRes = await fetch(`${baseUrl}/sdk_token`, {
      method: 'POST',
      headers: {
        'Authorization': `Token token=${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        applicant_id: applicant.id,
        referrer: process.env.NEXTAUTH_URL || '*',
      }),
    });

    if (!sdkRes.ok) throw new Error(`Onfido SDK token failed: ${sdkRes.status}`);
    const sdkData = await sdkRes.json();

    // Step 3: Create check (workflow run)
    const checkRes = await fetch(`${baseUrl}/checks`, {
      method: 'POST',
      headers: {
        'Authorization': `Token token=${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        applicant_id: applicant.id,
        report_names: ['document', 'facial_similarity_photo'],
      }),
    });

    const checkData = checkRes.ok ? await checkRes.json() : null;

    return {
      provider: 'onfido',
      sessionId: applicant.id,
      clientToken: sdkData.token,
      tokenTtl: 5400, // 90 min default
      verificationUrl: `${options.callbackUrl}?provider=onfido&applicantId=${applicant.id}`,
    };
  }

  async getResult(sessionId: string): Promise<IdvVerificationResult> {
    if (!this.isConfigured()) throw new Error('Onfido not configured');

    const apiToken = process.env.ONFIDO_API_TOKEN!;
    const baseUrl = process.env.ONFIDO_API_URL || 'https://api.eu.onfido.com/v3.6';

    const res = await fetch(`${baseUrl}/checks?applicant_id=${sessionId}`, {
      headers: { 'Authorization': `Token token=${apiToken}` },
    });

    if (!res.ok) throw new Error(`Onfido check retrieval failed: ${res.status}`);
    const data = await res.json();

    const latestCheck = data.checks?.[0];
    const result = latestCheck?.result || 'pending';

    return {
      provider: 'onfido',
      sessionId,
      state: result === 'clear' ? 'completed' :
             result === 'consider' ? 'failed' : 'pending',
      passed: result === 'clear',
      checks: (latestCheck?.report_ids || []).map((id: string) => ({
        type: 'report', status: result, passed: result === 'clear',
      })),
      rawResponse: data,
    };
  }
}

// ============================================================
// Provider Registry
// ============================================================

const providers: Record<IdvProvider, IIdvProvider> = {
  yoti: new YotiAdapter(),
  sumsub: new SumsubAdapter(),
  onfido: new OnfidoAdapter(),
};

/**
 * Get the active IDV provider.
 * Priority: env override > first configured provider > yoti (default)
 */
export function getIdvProvider(preferred?: IdvProvider): IIdvProvider {
  if (preferred && providers[preferred]?.isConfigured()) {
    return providers[preferred];
  }

  const envProvider = process.env.IDV_PROVIDER as IdvProvider | undefined;
  if (envProvider && providers[envProvider]?.isConfigured()) {
    return providers[envProvider];
  }

  // Auto-detect: first configured
  for (const key of ['yoti', 'sumsub', 'onfido'] as IdvProvider[]) {
    if (providers[key].isConfigured()) return providers[key];
  }

  // Fallback to Yoti (has mock mode)
  return providers.yoti;
}

/**
 * List all available providers and their configuration status.
 */
export function listProviders(): { name: IdvProvider; configured: boolean }[] {
  return Object.entries(providers).map(([name, p]) => ({
    name: name as IdvProvider,
    configured: p.isConfigured(),
  }));
}

export { providers };
