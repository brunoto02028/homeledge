const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const conns = await p.$queryRaw`
    SELECT id, bank_name, status, entity_id, created_at, updated_at,
           token_expires_at, last_sync_at
    FROM bank_connections
    WHERE status != 'pending'
    ORDER BY created_at DESC
  `;

  const now = new Date();
  console.log('=== Connection Age & Consent Status ===');
  console.log('Current time:', now.toISOString());
  console.log('');

  for (const c of conns) {
    const created = new Date(c.created_at);
    const ageDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    const consentExpired = ageDays > 90;
    
    console.log(c.bank_name + ' (' + (c.entity_id || 'personal') + ')');
    console.log('  Created:  ' + created.toISOString().split('T')[0] + ' (' + ageDays + ' days ago)');
    console.log('  Consent:  ' + (consentExpired ? '⚠️  EXPIRED (>' + 90 + ' days)' : '✅ Valid (' + (90 - ageDays) + ' days left)'));
    console.log('  Status:   ' + c.status);
    console.log('');
  }

  await p.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
