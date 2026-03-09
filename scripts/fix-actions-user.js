const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  // List all users
  const users = await p.user.findMany({ select: { id: true, email: true, role: true } });
  console.log('Users:');
  users.forEach(u => console.log(`  ${u.id} | ${u.email} | ${u.role}`));

  // Find Bruno's user
  const bruno = users.find(u => u.email.includes('bruno'));
  if (!bruno) {
    console.log('Bruno user not found!');
    return;
  }
  console.log('\nBruno:', bruno.id, bruno.email);

  // Find all actions created by system (our homologation actions)
  const systemActions = await p.action.findMany({
    where: { createdBy: 'system' },
    select: { id: true, title: true, userId: true },
  });
  console.log(`\nFound ${systemActions.length} system-created actions`);

  // For each action that belongs to Patricia, create a copy for Bruno
  let created = 0;
  for (const action of systemActions) {
    if (action.userId === bruno.id) {
      console.log('  SKIP (already Bruno):', action.title.substring(0, 60));
      continue;
    }

    // Check if Bruno already has this action
    const exists = await p.action.findFirst({
      where: { userId: bruno.id, title: action.title },
    });
    if (exists) {
      console.log('  SKIP (exists for Bruno):', action.title.substring(0, 60));
      continue;
    }

    // Get full action data
    const full = await p.action.findUnique({ where: { id: action.id } });

    // Create for Bruno
    await p.action.create({
      data: {
        userId: bruno.id,
        actionType: full.actionType,
        title: full.title,
        description: full.description,
        priority: full.priority,
        status: full.status,
        completedAt: full.completedAt,
        dueDate: full.dueDate,
        createdBy: 'system',
      },
    });
    console.log('  CREATED for Bruno:', action.title.substring(0, 60));
    created++;
  }

  console.log(`\nDone! Created ${created} actions for Bruno.`);
}

main().catch(console.error).finally(() => p.$disconnect());
