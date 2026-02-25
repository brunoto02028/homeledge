import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Yoti API Configuration
const YOTI_SDK_ID = process.env.YOTI_CLIENT_SDK_ID || '';
const YOTI_PEM_PATH = process.env.YOTI_PEM_KEY_PATH || '';
const YOTI_API_URL = process.env.YOTI_API_URL || 'https://api.yoti.com/idverify/v1';
const YOTI_SANDBOX = process.env.YOTI_SANDBOX === 'true';
const SANDBOX_API_URL = 'https://api.yoti.com/sandbox/idverify/v1';

const MOCK_MODE = !YOTI_SDK_ID || YOTI_SDK_ID === 'mock';

function getApiUrl(): string {
  if (YOTI_SANDBOX) return SANDBOX_API_URL;
  return YOTI_API_URL;
}

function getPemKey(): string {
  if (MOCK_MODE) return '';
  try {
    const pemPath = path.isAbsolute(YOTI_PEM_PATH)
      ? YOTI_PEM_PATH
      : path.join(process.cwd(), YOTI_PEM_PATH);
    return fs.readFileSync(pemPath, 'utf-8');
  } catch (error) {
    console.error('[Yoti] Failed to read PEM key:', error);
    return '';
  }
}

// Sign a message with the PEM private key (RS256)
function signMessage(message: string): string {
  const pem = getPemKey();
  if (!pem) return '';
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(message);
  return sign.sign(pem, 'base64');
}

// Generate auth headers for Yoti API
function getAuthHeaders(method: string, endpoint: string, body?: string): Record<string, string> {
  const nonce = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  const message = `${method}&${endpoint}&${nonce}&${timestamp}${body ? `&${body}` : ''}`;
  const signature = signMessage(message);

  return {
    'X-Yoti-Auth-Id': YOTI_SDK_ID,
    'X-Yoti-Auth-Digest': signature,
    'X-Yoti-SDK': 'Node',
    'X-Yoti-SDK-Version': '4.0.0',
    'Content-Type': 'application/json',
  };
}

// ============================================================
// IDV Session Management
// ============================================================

export interface YotiSessionConfig {
  userId: string;
  callbackUrl: string;
  // What checks to request
  documentCheck?: boolean;
  livenessCheck?: boolean;
  faceMatchCheck?: boolean;
}

export interface YotiSessionResponse {
  sessionId: string;
  clientSessionToken: string;
  clientSessionTokenTtl: number;
  iframeUrl: string;
}

export interface YotiVerificationResult {
  sessionId: string;
  state: 'COMPLETED' | 'ONGOING' | 'EXPIRED' | 'ERROR';
  checks: {
    type: string;
    status: string;
    report: Record<string, unknown>;
  }[];
  userProfile?: {
    fullName?: string;
    dateOfBirth?: string;
    nationality?: string;
    documentType?: string;
    documentNumber?: string;
    documentExpiry?: string;
    documentCountry?: string;
  };
  biometricReport?: {
    livenessResult?: string;
    faceMatchResult?: string;
    faceMatchScore?: number;
  };
}

/**
 * Create an IDV session with Yoti
 */
export async function createIdvSession(config: YotiSessionConfig): Promise<YotiSessionResponse> {
  if (MOCK_MODE) {
    return createMockSession(config);
  }

  const endpoint = '/sessions';
  const body = JSON.stringify({
    session_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    resources_ttl: 604800, // 7 days
    requested_checks: buildRequestedChecks(config),
    requested_tasks: buildRequestedTasks(config),
    sdk_config: {
      allowed_capture_methods: 'CAMERA_AND_UPLOAD',
      primary_colour: '#1e40af',
      secondary_colour: '#22c55e',
      font_colour: '#333333',
      locale: 'en',
      preset_issuing_country: 'GBR',
      success_url: `${config.callbackUrl}?status=success`,
      error_url: `${config.callbackUrl}?status=error`,
    },
    notifications: {
      endpoint: `${process.env.NEXTAUTH_URL}/api/yoti/webhook`,
      topics: ['SESSION_COMPLETION', 'CHECK_COMPLETION', 'TASK_COMPLETION'],
      auth_type: 'BEARER',
      auth_token: process.env.YOTI_WEBHOOK_SECRET || '',
    },
  });

  const headers = getAuthHeaders('POST', endpoint, body);
  const response = await fetch(`${getApiUrl()}${endpoint}`, {
    method: 'POST',
    headers,
    body,
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[Yoti] Create session failed:', response.status, error);
    throw new Error(`Yoti session creation failed: ${response.status}`);
  }

  const data = await response.json();
  return {
    sessionId: data.session_id,
    clientSessionToken: data.client_session_token,
    clientSessionTokenTtl: data.client_session_token_ttl,
    iframeUrl: `https://api.yoti.com/idverify/v1/web/index.html?sessionID=${data.session_id}&sessionToken=${data.client_session_token}`,
  };
}

/**
 * Get IDV session result from Yoti
 */
export async function getSessionResult(sessionId: string): Promise<YotiVerificationResult> {
  if (MOCK_MODE) {
    return getMockSessionResult(sessionId);
  }

  const endpoint = `/sessions/${sessionId}`;
  const headers = getAuthHeaders('GET', endpoint);
  const response = await fetch(`${getApiUrl()}${endpoint}`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[Yoti] Get session result failed:', response.status, error);
    throw new Error(`Yoti get result failed: ${response.status}`);
  }

  const data = await response.json();
  return parseSessionResult(data);
}

// ============================================================
// AML Screening
// ============================================================

export interface AmlCheckRequest {
  givenNames: string;
  familyName: string;
  dateOfBirth?: string;
  country?: string; // ISO 3166-1 alpha-3
}

export interface AmlCheckResult {
  onPepList: boolean;
  onWatchList: boolean;
  onFraudList: boolean;
  riskLevel: 'low' | 'medium' | 'high';
}

export async function performAmlCheck(data: AmlCheckRequest): Promise<AmlCheckResult> {
  if (MOCK_MODE) {
    return {
      onPepList: false,
      onWatchList: false,
      onFraudList: false,
      riskLevel: 'low',
    };
  }

  const endpoint = '/aml-check';
  const body = JSON.stringify({
    given_names: data.givenNames,
    family_name: data.familyName,
    ...(data.dateOfBirth && { date_of_birth: data.dateOfBirth }),
    ...(data.country && { country: data.country }),
  });

  const headers = getAuthHeaders('POST', endpoint, body);
  const response = await fetch(`${getApiUrl()}${endpoint}`, {
    method: 'POST',
    headers,
    body,
  });

  if (!response.ok) {
    throw new Error(`Yoti AML check failed: ${response.status}`);
  }

  const result = await response.json();
  const onPep = result.on_pep_list === true;
  const onWatch = result.on_watch_list === true;
  const onFraud = result.on_fraud_list === true;

  return {
    onPepList: onPep,
    onWatchList: onWatch,
    onFraudList: onFraud,
    riskLevel: (onPep || onWatch || onFraud) ? 'high' : 'low',
  };
}

// ============================================================
// Helper functions
// ============================================================

function buildRequestedChecks(config: YotiSessionConfig) {
  const checks = [];
  if (config.documentCheck !== false) {
    checks.push({
      type: 'ID_DOCUMENT_AUTHENTICITY',
      config: { manual_check: 'FALLBACK' },
    });
    checks.push({
      type: 'ID_DOCUMENT_TEXT_DATA_CHECK',
      config: { manual_check: 'FALLBACK' },
    });
  }
  if (config.faceMatchCheck !== false) {
    checks.push({
      type: 'ID_DOCUMENT_FACE_MATCH',
      config: { manual_check: 'FALLBACK' },
    });
  }
  if (config.livenessCheck !== false) {
    checks.push({
      type: 'LIVENESS',
      config: {
        max_retries: 3,
        liveness_type: 'ZOOM',
      },
    });
  }
  return checks;
}

function buildRequestedTasks(config: YotiSessionConfig) {
  const tasks = [];
  if (config.documentCheck !== false) {
    tasks.push({
      type: 'ID_DOCUMENT_TEXT_DATA_EXTRACTION',
      config: { manual_check: 'FALLBACK' },
    });
  }
  return tasks;
}

function parseSessionResult(data: Record<string, unknown>): YotiVerificationResult {
  const checks = ((data.checks as any[]) || []).map((c: any) => ({
    type: c.type || '',
    status: c.status || '',
    report: c.report || {},
  }));

  // Extract user profile from resources
  const resources = data.resources as any;
  let userProfile: YotiVerificationResult['userProfile'];
  if (resources?.id_documents?.[0]?.document_fields) {
    const fields = resources.id_documents[0].document_fields;
    userProfile = {
      fullName: fields.full_name?.value,
      dateOfBirth: fields.date_of_birth?.value,
      nationality: fields.nationality?.value,
      documentType: fields.document_type?.value,
      documentNumber: fields.document_number?.value,
      documentExpiry: fields.expiration_date?.value,
      documentCountry: fields.issuing_country?.value,
    };
  }

  return {
    sessionId: data.session_id as string,
    state: (data.state as any) || 'ONGOING',
    checks,
    userProfile,
  };
}

// ============================================================
// Mock mode (for development without Yoti credentials)
// ============================================================

const mockSessions = new Map<string, { config: YotiSessionConfig; createdAt: Date }>();

function createMockSession(config: YotiSessionConfig): YotiSessionResponse {
  const sessionId = `mock_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
  const token = crypto.randomUUID();
  mockSessions.set(sessionId, { config, createdAt: new Date() });

  return {
    sessionId,
    clientSessionToken: token,
    clientSessionTokenTtl: 600,
    iframeUrl: `${process.env.NEXTAUTH_URL}/verify-identity/mock?sessionId=${sessionId}&token=${token}`,
  };
}

function getMockSessionResult(sessionId: string): YotiVerificationResult {
  return {
    sessionId,
    state: 'COMPLETED',
    checks: [
      { type: 'ID_DOCUMENT_AUTHENTICITY', status: 'DONE', report: { recommendation: { value: 'APPROVE' } } },
      { type: 'ID_DOCUMENT_FACE_MATCH', status: 'DONE', report: { recommendation: { value: 'APPROVE' } } },
      { type: 'LIVENESS', status: 'DONE', report: { recommendation: { value: 'APPROVE' } } },
    ],
    userProfile: {
      fullName: 'Mock User',
      dateOfBirth: '1990-01-01',
      nationality: 'GBR',
      documentType: 'PASSPORT',
      documentNumber: 'MOCK123456',
      documentExpiry: '2030-01-01',
      documentCountry: 'GBR',
    },
    biometricReport: {
      livenessResult: 'PASS',
      faceMatchResult: 'PASS',
      faceMatchScore: 0.98,
    },
  };
}

/**
 * Complete a mock session (for development testing)
 */
export function completeMockSession(sessionId: string): boolean {
  if (!MOCK_MODE) return false;
  return mockSessions.has(sessionId);
}

export function isYotiConfigured(): boolean {
  return !MOCK_MODE;
}

export function isMockMode(): boolean {
  return MOCK_MODE;
}
