const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const actions = await p.action.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: { title: true, status: true, priority: true, createdAt: true },
  });
  actions.forEach(x => console.log(`[${x.status}] [${x.priority}] ${x.title.substring(0, 90)}`));
  console.log('\nTotal actions:', await p.action.count());
}

main().catch(console.error).finally(() => p.$disconnect());
