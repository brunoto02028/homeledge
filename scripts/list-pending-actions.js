const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const actions = await p.action.findMany({
    where: { status: { not: 'completed' } },
    orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
    select: { id: true, title: true, description: true, priority: true, status: true, dueDate: true },
  });
  console.log(`Pending Actions (${actions.length}):\n`);
  actions.forEach(a => {
    const due = a.dueDate ? a.dueDate.toISOString().split('T')[0] : 'no date';
    console.log(`[${a.priority}] ${a.title}`);
    console.log(`  Due: ${due} | Status: ${a.status}`);
    if (a.description) console.log(`  Desc: ${a.description.substring(0, 120)}`);
    console.log(`  ID: ${a.id}`);
    console.log('');
  });
}

main().catch(console.error).finally(() => p.$disconnect());
