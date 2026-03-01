import { PrismaClient } from '@prisma/client';
import { encrypt } from '../lib/vault-crypto';

const prisma = new PrismaClient();

// System credentials to seed — values will be read from env vars on VPS
const SYSTEM_CREDENTIALS = [
  {
    provider: 'companies_house',
    label: 'Companies House API Key',
    keyName: 'CH_API_KEY',
    envVar: 'COMPANIES_HOUSE_API_KEY',
    category: 'api_key',
    notes: 'REST API key for company search, officer lookup, filing history. Get from developer.company-information.service.gov.uk',
    sortOrder: 1,
  },
  {
    provider: 'companies_house',
    label: 'Companies House OAuth Client ID',
    keyName: 'CH_OAUTH_CLIENT_ID',
    envVar: 'CH_OAUTH_CLIENT_ID',
    category: 'oauth_client_id',
    notes: 'OAuth2 client for filing (AD01, CS01). Registered app on CH Developer Hub.',
    sortOrder: 2,
  },
  {
    provider: 'companies_house',
    label: 'Companies House OAuth Secret',
    keyName: 'CH_OAUTH_CLIENT_SECRET',
    envVar: 'CH_OAUTH_CLIENT_SECRET',
    category: 'oauth_secret',
    notes: 'OAuth2 client secret for filing submissions.',
    sortOrder: 3,
  },
  {
    provider: 'hmrc',
    label: 'HMRC OAuth Client ID',
    keyName: 'HMRC_CLIENT_ID',
    envVar: 'HMRC_CLIENT_ID',
    category: 'oauth_client_id',
    notes: 'HMRC Developer Hub sandbox app. APIs: Business Details, Individual Calculations, Obligations, SA Accounts.',
    sortOrder: 10,
  },
  {
    provider: 'hmrc',
    label: 'HMRC OAuth Client Secret',
    keyName: 'HMRC_CLIENT_SECRET',
    envVar: 'HMRC_CLIENT_SECRET',
    category: 'oauth_secret',
    notes: 'HMRC Developer Hub sandbox app secret.',
    sortOrder: 11,
  },
  {
    provider: 'truelayer',
    label: 'TrueLayer Client ID',
    keyName: 'TRUELAYER_CLIENT_ID',
    envVar: 'TRUELAYER_CLIENT_ID',
    category: 'oauth_client_id',
    notes: 'Open Banking provider. Production mode. Redirect: /api/open-banking/callback',
    sortOrder: 20,
  },
  {
    provider: 'truelayer',
    label: 'TrueLayer Client Secret',
    keyName: 'TRUELAYER_CLIENT_SECRET',
    envVar: 'TRUELAYER_CLIENT_SECRET',
    category: 'oauth_secret',
    notes: 'TrueLayer production client secret.',
    sortOrder: 21,
  },
  {
    provider: 'stripe',
    label: 'Stripe Secret Key',
    keyName: 'STRIPE_SECRET_KEY',
    envVar: 'STRIPE_SECRET_KEY',
    category: 'api_key',
    notes: 'Live Stripe secret key for payments, subscriptions, and checkout.',
    sortOrder: 30,
  },
  {
    provider: 'stripe',
    label: 'Stripe Webhook Secret',
    keyName: 'STRIPE_WEBHOOK_SECRET',
    envVar: 'STRIPE_WEBHOOK_SECRET',
    category: 'other',
    notes: 'Webhook signing secret for /api/stripe/webhook endpoint.',
    sortOrder: 31,
  },
  {
    provider: 'resend',
    label: 'Resend API Key',
    keyName: 'RESEND_API_KEY',
    envVar: 'RESEND_API_KEY',
    category: 'api_key',
    notes: 'Email delivery API. Domain: homeledger.co.uk. 3,000 emails/month free tier.',
    sortOrder: 40,
  },
  {
    provider: 'yoti',
    label: 'Yoti SDK Client ID',
    keyName: 'YOTI_CLIENT_SDK_ID',
    envVar: 'YOTI_CLIENT_SDK_ID',
    category: 'api_key',
    notes: 'Identity verification (KYC). Sandbox mode.',
    sortOrder: 50,
  },
  {
    provider: 'abacus',
    label: 'Abacus AI Deployment Token',
    keyName: 'ABACUS_API_KEY',
    envVar: 'ABACUS_API_KEY',
    category: 'api_key',
    notes: 'AI chat assistant. Deployment token from apps.abacus.ai',
    sortOrder: 60,
  },
];

async function main() {
  console.log('Seeding API credentials from environment variables...');

  for (const cred of SYSTEM_CREDENTIALS) {
    const envValue = process.env[cred.envVar];
    if (!envValue) {
      console.log(`  ⏭ ${cred.label} — env var ${cred.envVar} not set, skipping`);
      continue;
    }

    const encrypted = encrypt(envValue);

    await (prisma as any).apiCredential.upsert({
      where: {
        provider_keyName: { provider: cred.provider, keyName: cred.keyName },
      },
      update: {
        value: encrypted,
        label: cred.label,
        category: cred.category,
        notes: cred.notes,
        isActive: true,
        sortOrder: cred.sortOrder,
      },
      create: {
        provider: cred.provider,
        label: cred.label,
        keyName: cred.keyName,
        value: encrypted,
        category: cred.category,
        notes: cred.notes,
        isActive: true,
        sortOrder: cred.sortOrder,
      },
    });
    console.log(`  ✓ ${cred.label}`);
  }

  console.log('Done!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
