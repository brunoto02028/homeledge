const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Fix existing Google user with empty permissions
  const user = await prisma.user.findFirst({ where: { email: 'brunoto02028@gmail.com' } });
  if (!user) { console.log('User not found'); return; }
  
  console.log('Before:', { plan: user.plan, perms: user.permissions?.length });
  
  await prisma.user.update({
    where: { id: user.id },
    data: {
      plan: 'none',
      permissions: ['dashboard', 'settings'],
    },
  });
  
  console.log('Fixed: plan=none, permissions=[dashboard, settings]');
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
