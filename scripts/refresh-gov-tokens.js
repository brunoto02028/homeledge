require('dotenv').config({ path: '.env.production' });
require('dotenv').config({ path: '.env' });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const CH_IDENTITY_BASE = 'https://identity.company-information.service.gov.uk';
const HMRC_BASE = process.env.HMRC_USE_SANDBOX === 'true'
  ? 'https://test-api.service.hmrc.gov.uk'
  : 'https://api.service.hmrc.gov.uk';

async function refreshCH(refreshToken) {
  const clientId = process.env.CH_OAUTH_CLIENT_ID;
  const clientSecret = process.env.CH_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('CH_OAUTH_CLIENT_ID/SECRET not configured');

  console.log('  Refreshing CH token via', `${CH_IDENTITY_BASE}/oauth2/token`);
  const res = await fetch(`${CH_IDENTITY_BASE}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`CH refresh failed ${res.status}: ${err.slice(0, 300)}`);
  }
  return res.json();
}

async function refreshHMRC(refreshToken) {
  const clientId = process.env.HMRC_CLIENT_ID;
  const clientSecret = process.env.HMRC_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('HMRC_CLIENT_ID/SECRET not configured');

  const res = await fetch(`${HMRC_BASE}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`HMRC refresh failed ${res.status}: ${err.slice(0, 300)}`);
  }
  return res.json();
}

async function main() {
  console.log('=== GOVERNMENT TOKEN REFRESH ===\n');
  console.log('CH_OAUTH_CLIENT_ID:', process.env.CH_OAUTH_CLIENT_ID ? 'SET' : 'MISSING');
  console.log('CH_OAUTH_CLIENT_SECRET:', process.env.CH_OAUTH_CLIENT_SECRET ? 'SET' : 'MISSING');
  console.log('HMRC_CLIENT_ID:', process.env.HMRC_CLIENT_ID ? 'SET' : 'MISSING');
  console.log('HMRC_CLIENT_SECRET:', process.env.HMRC_CLIENT_SECRET ? 'SET' : 'MISSING');
  console.log('');

  const connections = await prisma.$queryRaw`
    SELECT gc.id, gc.provider, gc.status, gc.company_number,
           gc.access_token, gc.refresh_token, gc.token_expires_at,
           gc.entity_id, e.name as entity_name
    FROM government_connections gc
    LEFT JOIN entities e ON gc.entity_id = e.id
    WHERE gc.status IN ('active', 'expired', 'error')
    ORDER BY gc.provider, gc.connected_at DESC
  `;

  console.log(`Found ${connections.length} government connections\n`);

  for (const conn of connections) {
    const label = `${conn.provider.toUpperCase()} (${conn.entity_name || conn.company_number || '?'})`;
    console.log(`[${label}]`);

    if (!conn.refresh_token) {
      console.log('  ⚠ No refresh token — needs manual reconnection\n');
      continue;
    }

    try {
      let result;
      if (conn.provider === 'companies_house') {
        result = await refreshCH(conn.refresh_token);
      } else if (conn.provider === 'hmrc') {
        result = await refreshHMRC(conn.refresh_token);
      } else {
        console.log(`  ⚠ Unknown provider: ${conn.provider}\n`);
        continue;
      }

      const newExpiry = new Date(Date.now() + result.expires_in * 1000);
      await prisma.$executeRaw`
        UPDATE government_connections
        SET access_token = ${result.access_token},
            refresh_token = ${result.refresh_token || conn.refresh_token},
            token_expires_at = ${newExpiry},
            status = 'active',
            last_error = NULL,
            updated_at = NOW()
        WHERE id = ${conn.id}
      `;

      console.log(`  ✅ Refreshed! New token expires: ${newExpiry.toISOString().slice(0,19)} (${result.expires_in}s)`);
    } catch (err) {
      console.log(`  ❌ FAILED: ${err.message}`);
      
      const isPermanent = err.message.includes('invalid_grant') || err.message.includes('RECONNECT');
      if (isPermanent) {
        await prisma.$executeRaw`
          UPDATE government_connections
          SET status = 'expired',
              last_error = ${err.message.slice(0, 500)},
              updated_at = NOW()
          WHERE id = ${conn.id}
        `;
        console.log('  → Marked as expired — needs manual reconnection');
      }
    }
    console.log('');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
