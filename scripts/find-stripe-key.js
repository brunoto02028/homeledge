const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  // Search vault entries for stripe
  const vault = await p.vaultEntry.findMany({
    where: { OR: [
      { name: { contains: 'stripe', mode: 'insensitive' } },
      { name: { contains: 'Stripe', mode: 'insensitive' } },
    ]},
    select: { id: true, name: true, category: true, username: true },
  });
  console.log(`Vault entries with 'stripe': ${vault.length}`);
  vault.forEach(v => console.log(`  ${v.name} | ${v.category} | user: ${v.username || 'none'}`));

  // Also check all vault categories
  const allVault = await p.vaultEntry.findMany({
    select: { name: true, category: true },
    orderBy: { name: 'asc' },
  });
  console.log(`\nAll vault entries (${allVault.length}):`);
  allVault.forEach(v => console.log(`  [${v.category}] ${v.name}`));

  // Check AppCredential model
  try {
    const creds = await p.appCredential.findMany({
      where: { OR: [
        { provider: { contains: 'stripe', mode: 'insensitive' } },
      ]},
    });
    console.log('\nAppCredential stripe:', creds.length);
    creds.forEach(function(c) { console.log('  ' + c.provider + ' | ' + c.label + ' | val len: ' + (c.value ? c.value.length : 0)); });
  } catch(e) {
    // try other model names
  }

  // Direct SQL search
  try {
    const results = await p.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND (table_name LIKE '%credential%' OR table_name LIKE '%cred%' OR table_name LIKE '%secret%' OR table_name LIKE '%config%')`;
    console.log('\nRelevant tables:', results);
  } catch(e) {
    console.log('SQL error:', e.message?.substring(0, 100));
  }
}
main().catch(console.error).finally(() => p.$disconnect());
