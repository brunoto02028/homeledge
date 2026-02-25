const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const entities = await p.entity.findMany({
    where: { companyNumber: { not: null } },
    select: { id: true, name: true, companyNumber: true }
  });
  console.log('Entities with company numbers:');
  console.log(JSON.stringify(entities, null, 2));
  await p['$disconnect']();
}

main().catch(e => { console.error(e); process.exit(1); });
