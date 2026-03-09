const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  // Clear stale lastSyncError from active connections
  const cleared = await p.$executeRaw`
    UPDATE bank_connections 
    SET last_sync_error = NULL 
    WHERE status = 'active' AND last_sync_error IS NOT NULL
  `;
  console.log('Cleared stale errors from ' + cleared + ' active connections');

  // Delete abandoned pending connections (no tokens, never synced)
  const deleted = await p.$executeRaw`
    DELETE FROM bank_connections 
    WHERE status = 'pending' 
    AND access_token IS NULL 
    AND refresh_token IS NULL 
    AND created_at < NOW() - INTERVAL '1 day'
  `;
  console.log('Deleted ' + deleted + ' abandoned pending connections');

  // Final status
  const conns = await p.$queryRaw`
    SELECT bank_name, status, last_sync_error, entity_id,
           CASE WHEN token_expires_at > NOW() THEN 'valid' ELSE 'expired' END as token_status
    FROM bank_connections ORDER BY created_at DESC
  `;
  console.log('\n=== Final Status ===');
  for (const c of conns) {
    console.log((c.bank_name || '?') + ' | ' + c.status + ' | token:' + c.token_status + ' | error:' + (c.last_sync_error || 'none'));
  }

  await p.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
