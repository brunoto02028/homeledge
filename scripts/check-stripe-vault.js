const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  // Check vault for Stripe entries
  const vault = await p.vaultEntry.findMany({
    where: { OR: [
      { provider: { contains: 'stripe', mode: 'insensitive' } },
      { label: { contains: 'stripe', mode: 'insensitive' } },
    ]},
    select: { id: true, provider: true, label: true, keyName: true, value: true, notes: true },
  });
  console.log(`Vault Stripe entries: ${vault.length}`);
  vault.forEach(v => console.log(`  ${v.provider} | ${v.label} | ${v.keyName} | value length: ${v.value?.length || 0}`));

  // Check credentials table too
  try {
    const creds = await (p).credential.findMany({
      where: { OR: [
        { provider: { contains: 'stripe', mode: 'insensitive' } },
        { label: { contains: 'stripe', mode: 'insensitive' } },
      ]},
      select: { id: true, provider: true, label: true, keyName: true, value: true },
    });
    console.log(`\nCredentials Stripe entries: ${creds.length}`);
    creds.forEach(c => console.log(`  ${c.provider} | ${c.label} | ${c.keyName} | value length: ${c.value?.length || 0}`));
  } catch(e) {
    console.log('\nNo credentials table or error:', e.message?.substring(0, 100));
  }
}
main().catch(console.error).finally(() => p.$disconnect());
