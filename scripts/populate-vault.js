const { PrismaClient } = require('@prisma/client');

// Simple AES-256-GCM encryption matching lib/vault-crypto.ts
const crypto = require('crypto');
const ALGORITHM = 'aes-256-gcm';
const KEY = crypto.createHash('sha256').update(process.env.NEXTAUTH_SECRET || 'fallback-key').digest();

function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${tag}:${encrypted}`;
}

const p = new PrismaClient();

async function main() {
  const userId = 'cmlzo4jbn0000l6wdvw62lvm9'; // Bruno's user ID

  const entries = [
    // === API KEYS ===
    {
      title: 'Gemini API Key',
      category: 'other',
      username: 'Google AI Studio',
      password: 'AIzaSyC4Mp40Bg8MvL1no8IcfInpvCsmRXtuf_s',
      websiteUrl: 'https://aistudio.google.com/apikey',
      notes: 'Gemini 2.0 Flash — PRIMARY AI provider for HomeLedger. Used in lib/ai-client.ts',
      tags: ['api', 'ai', 'gemini', 'google'],
      isFavorite: true,
    },
    {
      title: 'Abacus AI API Key',
      category: 'other',
      password: '0862b02e8a3240dc98f980df50e95b79',
      websiteUrl: 'https://apps.abacus.ai',
      notes: 'FALLBACK AI provider + vision/multimodal tasks. Also used for email notifications.',
      tags: ['api', 'ai', 'abacus'],
      isFavorite: false,
    },
    {
      title: 'Companies House API Key (Read-Only)',
      category: 'government',
      password: '9c19155c-3814-4783-98cf-cb3c221d06a6',
      websiteUrl: 'https://developer.company-information.service.gov.uk',
      notes: 'Free API key for read-only access: company profiles, officers, filing history. Used in /api/entities/companies-house',
      tags: ['api', 'companies-house', 'gov'],
      isFavorite: true,
    },
    // === COMPANIES HOUSE OAUTH ===
    {
      title: 'Companies House OAuth (Filing)',
      category: 'government',
      username: 'b2567458-28ae-47cc-9f41-90bcc31f6ef9',
      password: 'AZhi2JsY9Ns2r3z2e9CgPcezIaeGlk1mrbJOTmbxfUs',
      websiteUrl: 'https://developer.company-information.service.gov.uk/manage-applications',
      notes: 'OAuth Client ID (username) + Client Secret (password). For electronic filing: address changes, officer appointments, confirmation statements. Redirect URI: https://homeledger.co.uk/api/government/callback/companies-house',
      tags: ['oauth', 'companies-house', 'filing', 'gov'],
      isFavorite: true,
    },
    // === HMRC ===
    {
      title: 'HMRC OAuth Credentials',
      category: 'government',
      username: 'V5QBVupVyc09UoXOtqW1EBDGjudF',
      password: '123f5d6d-4c1b-4a10-970f-63fbea783705',
      websiteUrl: 'https://developer.service.hmrc.gov.uk/developer/applications',
      notes: 'HMRC Developer Hub OAuth. Client ID (username) + Client Secret (password). Currently using sandbox mode.',
      tags: ['oauth', 'hmrc', 'tax', 'gov'],
      isFavorite: false,
    },
    // === OPEN BANKING ===
    {
      title: 'TrueLayer (Open Banking)',
      category: 'banking',
      username: 'homeledger-958a7f',
      password: 'eaa11768-3bbc-4ef7-95a6-4f8a4b533469',
      websiteUrl: 'https://console.truelayer.com',
      notes: 'Open Banking provider for bank sync. Client ID (username) + Client Secret (password). Redirect: https://homeledger.co.uk/api/open-banking/callback. Production mode (not sandbox).',
      tags: ['api', 'banking', 'truelayer', 'open-banking'],
      isFavorite: true,
    },
    // === VPS / DATABASE ===
    {
      title: 'VPS Server (Hostinger)',
      category: 'other',
      username: 'root',
      password: '5.182.18.148',
      websiteUrl: 'https://hpanel.hostinger.com',
      notes: 'SSH: ssh root@5.182.18.148. HomeLedger runs on port 3100 (PM2: homeledger). Docling on port 3200 (PM2: docling). Nginx reverse proxy to homeledger.co.uk.',
      tags: ['vps', 'server', 'ssh', 'hosting'],
      isFavorite: true,
    },
    {
      title: 'PostgreSQL Database',
      category: 'other',
      username: 'homeledger',
      password: 'HL2026Secure!@prod',
      notes: 'Local PostgreSQL on VPS. Host: localhost:5432, Database: homeledger. Connection string in DATABASE_URL env var.',
      tags: ['database', 'postgresql', 'vps'],
      isFavorite: false,
    },
    {
      title: 'NextAuth Secret',
      category: 'other',
      password: 'Ch0HxBM4nv6ar6EvhoRFAH5rGThuKcn0',
      notes: 'Used for JWT signing and session encryption in NextAuth.js. Do NOT change — would invalidate all active sessions.',
      tags: ['auth', 'nextauth', 'secret'],
      isFavorite: false,
    },
    // === COMPANY AUTH CODES ===
    {
      title: 'Auth Code — BRUNO PHYSICAL REHABILITATION LTD',
      category: 'government',
      referenceNumber: '16548405',
      password: 'YRG2R4',
      notes: 'Companies House Authentication Code for filing. Company Number: 16548405. Required for OAuth filing connection.',
      tags: ['auth-code', 'companies-house', 'bruno-rehab'],
      isFavorite: true,
    },
    {
      title: 'Auth Code — BRUNO PHYSICAL REHABILITATION COMMUNITY CIC',
      category: 'government',
      referenceNumber: '16644932',
      password: 'A7BM62',
      notes: 'Companies House Authentication Code for filing. Company Number: 16644932. CIC - Community Interest Company.',
      tags: ['auth-code', 'companies-house', 'bruno-cic'],
      isFavorite: true,
    },
    // === DOMAIN ===
    {
      title: 'HomeLedger Domain & SSL',
      category: 'other',
      websiteUrl: 'https://homeledger.co.uk',
      notes: 'Domain: homeledger.co.uk. SSL via Cloudflare/Nginx. DNS managed via domain registrar. App URL: https://homeledger.co.uk (port 3100 behind Nginx).',
      tags: ['domain', 'ssl', 'website'],
      isFavorite: false,
    },
  ];

  console.log(`Creating ${entries.length} vault entries...`);

  for (const entry of entries) {
    const existing = await p.vaultEntry.findFirst({
      where: { userId, title: entry.title },
    });
    if (existing) {
      console.log(`  SKIP (exists): ${entry.title}`);
      continue;
    }

    await p.vaultEntry.create({
      data: {
        userId,
        title: entry.title,
        category: entry.category,
        username: entry.username || null,
        passwordEnc: entry.password ? encrypt(entry.password) : null,
        websiteUrl: entry.websiteUrl || null,
        notes: entry.notes || null,
        referenceNumber: entry.referenceNumber || null,
        accountNumber: entry.accountNumber || null,
        sortCode: entry.sortCode || null,
        phoneNumber: entry.phoneNumber || null,
        email: entry.email || null,
        tags: entry.tags || [],
        isFavorite: entry.isFavorite || false,
      },
    });
    console.log(`  CREATED: ${entry.title}`);
  }

  const count = await p.vaultEntry.count({ where: { userId } });
  console.log(`\nDone! Total vault entries: ${count}`);
  await p['$disconnect']();
}

main().catch(e => { console.error(e); process.exit(1); });
