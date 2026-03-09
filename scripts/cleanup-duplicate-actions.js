const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  // Find Bruno's user
  const bruno = await p.user.findFirst({
    where: { email: 'brunotoaz@gmail.com' },
    select: { id: true, email: true },
  });
  console.log('Bruno:', bruno.email);

  // Delete duplicated actions (created by system for Bruno — originals exist under Patricia)
  const dupes = await p.action.findMany({
    where: { userId: bruno.id, createdBy: 'system' },
    select: { id: true, title: true },
  });

  console.log(`Found ${dupes.length} duplicated actions for Bruno — deleting...`);
  for (const d of dupes) {
    await p.action.delete({ where: { id: d.id } });
    console.log('  DELETED:', d.title.substring(0, 60));
  }

  console.log('\nDone! Duplicates removed.');
}

main().catch(console.error).finally(() => p.$disconnect());
