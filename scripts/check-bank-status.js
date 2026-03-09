const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const conns = await p.$queryRaw`
    SELECT id, bank_name, status, 
           token_expires_at, last_sync_at, last_sync_error,
           entity_id, metadata,
           CASE WHEN refresh_token IS NOT NULL THEN true ELSE false END as has_refresh_token,
           CASE WHEN access_token IS NOT NULL THEN true ELSE false END as has_access_token
    FROM bank_connections
    ORDER BY created_at DESC
  `;

  console.log('=== Bank Connection Status ===');
  console.log('Total connections:', conns.length);
  console.log('');

  for (const c of conns) {
    const expiresAt = c.token_expires_at ? new Date(c.token_expires_at) : null;
    const expiresIn = expiresAt ? Math.round((expiresAt.getTime() - Date.now()) / 60000) : null;
    const lastSync = c.last_sync_at ? new Date(c.last_sync_at).toISOString().replace('T', ' ').substring(0, 19) : 'never';
    const failCount = c.metadata?.failedRefreshCount || 0;

    console.log('--- ' + (c.bank_name || c.id) + ' ---');
    console.log('  Status:          ' + c.status);
    console.log('  Entity:          ' + (c.entity_id || 'personal'));
    console.log('  Has tokens:      access=' + c.has_access_token + ', refresh=' + c.has_refresh_token);
    console.log('  Token expires:   ' + (expiresAt ? expiresAt.toISOString().replace('T', ' ').substring(0, 19) + ' (' + (expiresIn > 0 ? expiresIn + ' min left' : 'EXPIRED ' + Math.abs(expiresIn) + ' min ago') + ')' : 'n/a'));
    console.log('  Last sync:       ' + lastSync);
    console.log('  Failed refreshes:' + failCount);
    if (c.last_sync_error) console.log('  Last error:      ' + c.last_sync_error);
    console.log('');
  }

  await p.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
