const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

function getKey() {
  const secret = process.env.VAULT_ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET || 'homeledger-vault-default-key-change-me';
  return crypto.createHash('sha256').update(secret).digest();
}

function encrypt(text) {
  if (!text) return '';
  const key = getKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();
  return iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;
}

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: 'admin' } });
  if (!admin) { console.log('No admin user found'); return; }
  console.log('Admin:', admin.email);

  // 1. Google OAuth Credentials
  const existing1 = await prisma.vaultEntry.findFirst({ where: { userId: admin.id, title: 'Google OAuth Credentials' } });
  if (existing1) {
    console.log('Google OAuth entry already exists, skipping');
  } else {
    await prisma.vaultEntry.create({
      data: {
        userId: admin.id,
        title: 'Google OAuth Credentials',
        username: process.env.GOOGLE_CLIENT_ID || '',
        passwordEnc: encrypt(process.env.GOOGLE_CLIENT_SECRET || ''),
        websiteUrl: 'https://console.cloud.google.com/apis/credentials?project=homeledger-489022',
        notes: [
          'Google Cloud Project: homeledger-489022',
          'Client ID: (stored in username field, env var GOOGLE_CLIENT_ID)',
          'Client Secret: (encrypted in password field, env var GOOGLE_CLIENT_SECRET)',
          '',
          'JS Origin: https://homeledger.co.uk',
          'Redirect URI: https://homeledger.co.uk/api/auth/callback/google',
          '',
          'VPS env vars: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET',
          'NEXTAUTH_URL: https://homeledger.co.uk',
          '',
          'Consent Screen: External - needs publishing for production.',
          'Created: 2 March 2026',
        ].join('\n'),
        tags: ['google', 'oauth', 'credentials'],
        isFavorite: false,
      },
    });
    console.log('Created: Google OAuth Credentials');
  }

  // 2. Custom Analytics System
  const existing2 = await prisma.vaultEntry.findFirst({ where: { userId: admin.id, title: 'Custom Analytics System' } });
  if (existing2) {
    console.log('Analytics entry already exists, skipping');
  } else {
    await prisma.vaultEntry.create({
      data: {
        userId: admin.id,
        title: 'Custom Analytics System',
        notes: [
          'Custom user analytics and heatmap system - deployed 2 March 2026',
          '',
          'Tracks: clicks (x,y + element), page views, scroll depth, session duration',
          'Tracker: components/analytics-tracker.tsx (added to root layout)',
          'API: /api/analytics (POST events, GET admin dashboard)',
          'Dashboard: /admin/analytics (4 tabs: Overview, Heatmap, Sessions, Clicks)',
          'DB: analytics_events table (AnalyticsEvent model in Prisma)',
          '',
          'No external dependencies - all data in our Postgres database.',
        ].join('\n'),
        tags: ['analytics', 'heatmap', 'system'],
        isFavorite: false,
      },
    });
    console.log('Created: Custom Analytics System');
  }

  await prisma.$disconnect();
  console.log('Done');
}

main().catch(e => { console.error(e); process.exit(1); });
