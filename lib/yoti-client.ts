import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// ============================================================
// Configuration
// ============================================================
const YOTI_SDK_ID = process.env.YOTI_CLIENT_SDK_ID || '';
const YOTI_PEM_PATH = process.env.YOTI_PEM_KEY_PATH || '';
const YOTI_SANDBOX = process.env.YOTI_SANDBOX === 'true';
const BASE_URL = process.env.NEXTAUTH_URL || 'https://homeledger.co.uk';

const MOCK_MODE = !YOTI_SDK_ID || YOTI_SDK_ID === 'mock';

function getPemString(): string {
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

let _idvClient: any = null;

// Use eval to bypass webpack bundling — yoti SDK needs node_modules at runtime
const loadYoti = () => eval('require')('yoti');

function getIDVClient() {
  if (MOCK_MODE) return null;
  if (_idvClient) return _idvClient;
  try {
    const { IDVClient } = loadYoti();
    const pem = getPemString();
    if (!pem) throw new Error('PEM key not found');
    _idvClient = new IDVClient(YOTI_SDK_ID, pem);
    return _idvClient;
  } catch (error) {
    console.error('[Yoti] Failed to create IDV client:', error);
    return null;
  }
}

// ============================================================
// Types
// ============================================================
export interface CreateSessionOptions {
  callbackUrl: string;
  userEmail?: string;
  userName?: string;
}

export interface YotiSessionResult {
  sessionId: string;
  clientSessionToken: string;
  clientSessionTokenTtl: number;
  iframeUrl: string;
}

export interface VerificationResult {
  sessionId: string;
  state: string; // COMPLETED, ONGOING, EXPIRED, ERROR
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
}

// ============================================================
// Create IDV Session (using official SDK)
// ============================================================
export async function createIdvSession(options: CreateSessionOptions): Promise<YotiSessionResult> {
  if (MOCK_MODE) {
    return createMockSession(options);
  }

  const client = getIDVClient();
  if (!client) throw new Error('Yoti IDV client not initialized');

  try {
    const {
      SessionSpecificationBuilder,
      RequestedDocumentAuthenticityCheckBuilder,
      RequestedFaceMatchCheckBuilder,
      RequestedLivenessCheckBuilder,
      RequestedTextExtractionTaskBuilder,
      SdkConfigBuilder,
      NotificationConfigBuilder,
    } = loadYoti();

    const sdkConfig = new SdkConfigBuilder()
      .withAllowsCameraAndUpload()
      .withPrimaryColour('#1e40af')
      .withSecondaryColour('#22c55e')
      .withFontColour('#ffffff')
      .withLocale('en')
      .withPresetIssuingCountry('GBR')
      .withSuccessUrl(`${options.callbackUrl}?status=success`)
      .withErrorUrl(`${options.callbackUrl}?status=error`)
      .build();

    const notificationConfig = new NotificationConfigBuilder()
      .forSessionCompletion()
      .forCheckCompletion()
      .withEndpoint(`${BASE_URL}/api/yoti/webhook`)
      .withAuthTypeBearer()
      .withAuthToken(process.env.YOTI_WEBHOOK_SECRET || '')
      .build();

    const sessionSpec = new SessionSpecificationBuilder()
      .withClientSessionTokenTtl(600)
      .withResourcesTtl(604800)
      .withRequestedCheck(
        new RequestedDocumentAuthenticityCheckBuilder().withManualCheckFallback().build()
      )
      .withRequestedCheck(
        new RequestedFaceMatchCheckBuilder().withManualCheckFallback().build()
      )
      .withRequestedCheck(
        new RequestedLivenessCheckBuilder().forZoomLiveness().withMaxRetries(3).build()
      )
      .withRequestedTask(
        new RequestedTextExtractionTaskBuilder().withManualCheckFallback().build()
      )
      .withSdkConfig(sdkConfig)
      .withNotifications(notificationConfig)
      .build();

    const session = await client.createSession(sessionSpec);
    const sessionId = session.getSessionId();
    const clientSessionToken = session.getClientSessionToken();
    const clientSessionTokenTtl = session.getClientSessionTokenTtl();

    const iframeUrl = YOTI_SANDBOX
      ? `https://api.yoti.com/sandbox/idverify/v1/web/index.html?sessionID=${sessionId}&sessionToken=${clientSessionToken}`
      : `https://api.yoti.com/idverify/v1/web/index.html?sessionID=${sessionId}&sessionToken=${clientSessionToken}`;

    return {
      sessionId,
      clientSessionToken,
      clientSessionTokenTtl,
      iframeUrl,
    };
  } catch (error: any) {
    console.error('[Yoti] Create session error:', error?.message || error);
    throw new Error(`Failed to create Yoti session: ${error?.message || 'Unknown error'}`);
  }
}

// ============================================================
// Get Session Result (using official SDK)
// ============================================================
export async function getSessionResult(sessionId: string): Promise<VerificationResult> {
  if (MOCK_MODE) {
    return getMockResult(sessionId);
  }

  const client = getIDVClient();
  if (!client) throw new Error('Yoti IDV client not initialized');

  try {
    const session = await client.getSession(sessionId);
    const state = session.getState();
    const checks = (session.getChecks() || []).map((c: any) => {
      const report = c.getReport();
      const recommendation = report?.getRecommendation();
      return {
        type: c.getType(),
        status: c.getStatus(),
        passed: recommendation?.getValue() === 'APPROVE',
      };
    });

    const allPassed = checks.length > 0 && checks.every((c: any) => c.passed);

    // Extract user profile from document resources
    let userProfile: VerificationResult['userProfile'];
    try {
      const resources = session.getResources();
      const docs = resources?.getIdDocuments();
      if (docs && docs.length > 0) {
        const fields = docs[0].getDocumentFields();
        if (fields) {
          userProfile = {
            fullName: fields.getFullName?.()?.getValue(),
            dateOfBirth: fields.getDateOfBirth?.()?.getValue(),
            nationality: fields.getNationality?.()?.getValue(),
            documentType: fields.getDocumentType?.()?.getValue(),
            documentNumber: fields.getDocumentNumber?.()?.getValue(),
            documentCountry: fields.getIssuingCountry?.()?.getValue(),
          };
        }
      }
    } catch { /* profile extraction optional */ }

    return {
      sessionId,
      state,
      passed: state === 'COMPLETED' && allPassed,
      checks,
      userProfile,
    };
  } catch (error: any) {
    console.error('[Yoti] Get session error:', error?.message || error);
    throw new Error(`Failed to get Yoti session: ${error?.message || 'Unknown error'}`);
  }
}

// ============================================================
// AML Check
// ============================================================
export interface AmlCheckRequest {
  givenNames: string;
  familyName: string;
  dateOfBirth?: string;
  country?: string;
}

export interface AmlCheckResult {
  onPepList: boolean;
  onWatchList: boolean;
  onFraudList: boolean;
  riskLevel: 'low' | 'medium' | 'high';
}

export async function performAmlCheck(data: AmlCheckRequest): Promise<AmlCheckResult> {
  if (MOCK_MODE) {
    return { onPepList: false, onWatchList: false, onFraudList: false, riskLevel: 'low' };
  }

  try {
    const { AmlAddress, AmlProfile, YotiClient } = loadYoti();
    const pem = getPemString();
    const yotiClient = new YotiClient(YOTI_SDK_ID, pem);

    const amlAddress = new AmlAddress(data.country || 'GBR');
    const amlProfile = new AmlProfile(data.givenNames, data.familyName, amlAddress);
    const result = await yotiClient.performAmlCheck(amlProfile);

    const onPep = result.isOnPepList() === true;
    const onWatch = result.isOnWatchList() === true;
    const onFraud = result.isOnFraudList() === true;

    return {
      onPepList: onPep,
      onWatchList: onWatch,
      onFraudList: onFraud,
      riskLevel: (onPep || onWatch || onFraud) ? 'high' : 'low',
    };
  } catch (error: any) {
    console.error('[Yoti] AML check error:', error?.message || error);
    throw new Error(`AML check failed: ${error?.message || 'Unknown error'}`);
  }
}

// ============================================================
// Mock mode for development
// ============================================================
const mockSessions = new Map<string, { createdAt: Date }>();

function createMockSession(options: CreateSessionOptions): YotiSessionResult {
  const sessionId = `mock_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
  const token = crypto.randomUUID();
  mockSessions.set(sessionId, { createdAt: new Date() });

  return {
    sessionId,
    clientSessionToken: token,
    clientSessionTokenTtl: 600,
    iframeUrl: `${BASE_URL}/verify-identity/mock?sessionId=${sessionId}&token=${token}`,
  };
}

function getMockResult(sessionId: string): VerificationResult {
  return {
    sessionId,
    state: 'COMPLETED',
    passed: true,
    checks: [
      { type: 'ID_DOCUMENT_AUTHENTICITY', status: 'DONE', passed: true },
      { type: 'ID_DOCUMENT_FACE_MATCH', status: 'DONE', passed: true },
      { type: 'LIVENESS', status: 'DONE', passed: true },
    ],
    userProfile: {
      fullName: 'Mock User',
      dateOfBirth: '1990-01-01',
      nationality: 'GBR',
      documentType: 'PASSPORT',
      documentNumber: 'MOCK123456',
      documentCountry: 'GBR',
    },
  };
}

export function completeMockSession(sessionId: string): boolean {
  if (!MOCK_MODE) return false;
  return mockSessions.has(sessionId);
}

export function isMockMode(): boolean {
  return MOCK_MODE;
}

export function isYotiConfigured(): boolean {
  return !MOCK_MODE;
}
