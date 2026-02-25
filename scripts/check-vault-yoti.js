const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const entries = await p.vaultEntry.findMany({
    where: { title: { contains: 'Yoti', mode: 'insensitive' } },
    select: { id: true, title: true, category: true, createdAt: true }
  });
  console.log('Yoti vault entries:', JSON.stringify(entries, null, 2));
  
  if (entries.length === 0) {
    console.log('No Yoti entries found in vault');
  }
}

main().catch(console.error).finally(() => p.$disconnect());
