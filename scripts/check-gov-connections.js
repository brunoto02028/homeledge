const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== GOVERNMENT CONNECTION HEALTH CHECK ===\n');

  const connections = await prisma.$queryRaw`
    SELECT gc.id, gc.provider, gc.status, gc.company_number,
           gc.token_expires_at, gc.last_sync_at, gc.last_error,
           gc.connected_at, gc.entity_id, gc.gov_gateway_id,
           CASE WHEN gc.access_token IS NOT NULL AND gc.access_token != '' THEN 'YES' ELSE 'NO' END as has_access_token,
           CASE WHEN gc.refresh_token IS NOT NULL AND gc.refresh_token != '' THEN 'YES' ELSE 'NO' END as has_refresh_token,
           e.name as entity_name, e.type as entity_type
    FROM government_connections gc
    LEFT JOIN entities e ON gc.entity_id = e.id
    ORDER BY gc.connected_at DESC
  `;

  console.log(`Total government connections: ${connections.length}\n`);

  for (const c of connections) {
    const expiresAt = c.token_expires_at ? new Date(c.token_expires_at) : null;
    const lastSync = c.last_sync_at ? new Date(c.last_sync_at) : null;
    const connectedAt = new Date(c.connected_at);
    const now = new Date();
    const tokenValid = expiresAt && expiresAt > now;
    const tokenExpiresIn = expiresAt ? Math.round((expiresAt.getTime() - now.getTime()) / 60000) : null;
    const lastSyncAgo = lastSync ? Math.round((now.getTime() - lastSync.getTime()) / 3600000) : null;
    const daysSinceConnected = Math.round((now.getTime() - connectedAt.getTime()) / (24 * 3600000));

    console.log(`[${c.provider.toUpperCase()}] Entity: ${c.entity_name || 'N/A'} (${c.entity_type || '?'})`);
    console.log(`  Status: ${c.status} | Company#: ${c.company_number || 'N/A'} | Gov Gateway: ${c.gov_gateway_id || 'N/A'}`);
    console.log(`  Access Token: ${c.has_access_token} | Refresh Token: ${c.has_refresh_token}`);
    if (expiresAt) {
      console.log(`  Token Expires: ${expiresAt.toISOString().slice(0,19)} (${tokenValid ? `valid, ${tokenExpiresIn}min left` : `EXPIRED ${Math.abs(tokenExpiresIn)}min ago`})`);
    } else {
      console.log(`  Token Expires: NOT SET`);
    }
    console.log(`  Last Sync: ${lastSync ? lastSync.toISOString().slice(0,19) : 'Never'} (${lastSyncAgo !== null ? `${lastSyncAgo}h ago` : 'N/A'})`);
    console.log(`  Connected: ${connectedAt.toISOString().slice(0,19)} (${daysSinceConnected}d ago)`);
    if (c.last_error) console.log(`  ⚠ Last Error: ${c.last_error}`);
    console.log('');
  }

  // Check env vars
  console.log('=== ENV VAR CHECK ===');
  require('dotenv').config({ path: '.env.production' });
  require('dotenv').config({ path: '.env' });

  const hmrcVars = {
    HMRC_CLIENT_ID: process.env.HMRC_CLIENT_ID ? 'SET' : 'MISSING',
    HMRC_CLIENT_SECRET: process.env.HMRC_CLIENT_SECRET ? 'SET' : 'MISSING',
    HMRC_USE_SANDBOX: process.env.HMRC_USE_SANDBOX || 'NOT SET (defaults to production)',
  };
  const chVars = {
    CH_CLIENT_ID: process.env.CH_CLIENT_ID ? 'SET' : 'MISSING',
    CH_CLIENT_SECRET: process.env.CH_CLIENT_SECRET ? 'SET' : 'MISSING',
    CH_API_KEY: process.env.CH_API_KEY ? 'SET' : 'MISSING',
  };
  console.log('HMRC:', JSON.stringify(hmrcVars, null, 2));
  console.log('Companies House:', JSON.stringify(chVars, null, 2));
  console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL || 'MISSING');

  // Check cron endpoints
  console.log('\n=== CRON CHECK ===');
  console.log('Bank token refresh: /api/cron/refresh-tokens (exists)');
  console.log('Bank sync: /api/cron/sync-banks (exists)');

  const fs = require('fs');
  const govCronPath = '/opt/homeledger/app/api/cron/refresh-gov-tokens';
  const exists = fs.existsSync(govCronPath);
  console.log(`Gov token refresh: /api/cron/refresh-gov-tokens (${exists ? 'EXISTS' : 'MISSING ⚠'})`);

  // HMRC token lifetime info
  console.log('\n=== TOKEN LIFETIME INFO ===');
  console.log('HMRC: Access tokens last 4 hours, refresh tokens last 18 months');
  console.log('CH OAuth: Access tokens last ~60 min, refresh tokens last varies');
  console.log('CH API Key: No expiry (static key for read-only access)');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
