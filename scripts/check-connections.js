const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== BANK CONNECTION HEALTH CHECK ===\n');

  const connections = await prisma.$queryRaw`
    SELECT id, bank_name, status, provider,
           token_expires_at, last_sync_at, last_sync_error,
           created_at, entity_id,
           CASE WHEN access_token IS NOT NULL THEN 'YES' ELSE 'NO' END as has_access_token,
           CASE WHEN refresh_token IS NOT NULL THEN 'YES' ELSE 'NO' END as has_refresh_token,
           metadata
    FROM bank_connections
    ORDER BY created_at DESC
  `;

  // Get entity names
  const entityIds = [...new Set(connections.filter(c => c.entity_id).map(c => c.entity_id))];
  const entities = entityIds.length > 0
    ? await prisma.entity.findMany({ where: { id: { in: entityIds } }, select: { id: true, name: true } })
    : [];
  const entityMap = new Map(entities.map(e => [e.id, e.name]));

  console.log(`Total connections: ${connections.length}\n`);

  for (const c of connections) {
    const expiresAt = c.token_expires_at ? new Date(c.token_expires_at) : null;
    const lastSync = c.last_sync_at ? new Date(c.last_sync_at) : null;
    const now = new Date();
    const tokenValid = expiresAt && expiresAt > now;
    const tokenExpiresIn = expiresAt ? Math.round((expiresAt.getTime() - now.getTime()) / 60000) : null;
    const lastSyncAgo = lastSync ? Math.round((now.getTime() - lastSync.getTime()) / 3600000) : null;
    const failedCount = (c.metadata && c.metadata.failedRefreshCount) || 0;
    const entityName = c.entity_id ? entityMap.get(c.entity_id) || c.entity_id : 'Personal';

    console.log(`[${c.bank_name || 'Unknown'}] Entity: ${entityName}`);
    console.log(`  Status: ${c.status} | Provider: ${c.provider}`);
    console.log(`  Access Token: ${c.has_access_token} | Refresh Token: ${c.has_refresh_token}`);
    console.log(`  Token Expires: ${expiresAt ? expiresAt.toISOString().slice(0,19) : 'N/A'} (${tokenValid ? `valid, ${tokenExpiresIn}min left` : 'EXPIRED or N/A'})`);
    console.log(`  Last Sync: ${lastSync ? lastSync.toISOString().slice(0,19) : 'Never'} (${lastSyncAgo !== null ? `${lastSyncAgo}h ago` : 'N/A'})`);
    console.log(`  Failed Refresh Count: ${failedCount}`);
    if (c.last_sync_error) console.log(`  ⚠ Last Error: ${c.last_sync_error}`);
    console.log('');
  }

  // Summary
  const active = connections.filter(c => c.status === 'active').length;
  const expired = connections.filter(c => c.status === 'expired').length;
  const error = connections.filter(c => c.status === 'error').length;
  const revoked = connections.filter(c => c.status === 'revoked').length;
  const pending = connections.filter(c => c.status === 'pending').length;

  console.log('=== SUMMARY ===');
  console.log(`Active: ${active} | Expired: ${expired} | Error: ${error} | Revoked: ${revoked} | Pending: ${pending}`);

  // TrueLayer consent limit warning
  console.log('\n=== CONSENT EXPIRY RISK ===');
  console.log('TrueLayer UK Open Banking consents expire after 90 days.');
  for (const c of connections.filter(c => c.status === 'active')) {
    const created = new Date(c.created_at);
    const daysSinceCreated = Math.round((Date.now() - created.getTime()) / (24 * 3600000));
    const daysUntilExpiry = 90 - daysSinceCreated;
    const entityName = c.entity_id ? entityMap.get(c.entity_id) || '' : 'Personal';
    if (daysUntilExpiry <= 30) {
      console.log(`  ⚠ ${c.bank_name} (${entityName}): Created ${daysSinceCreated}d ago → consent expires in ~${daysUntilExpiry}d`);
    } else {
      console.log(`  ✓ ${c.bank_name} (${entityName}): Created ${daysSinceCreated}d ago → consent OK (~${daysUntilExpiry}d remaining)`);
    }
  }

  // Cron schedule check
  console.log('\n=== CRON SCHEDULES ===');
  console.log('Token Refresh: /api/cron/refresh-tokens — runs every hour');
  console.log('Bank Sync:     /api/cron/sync-banks — runs 3x/day');
  console.log('Both are protected by proactive refresh (20min/10min buffers)');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
