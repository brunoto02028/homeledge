const path = '/opt/homeledger/.env.production';
require('/opt/homeledger/node_modules/dotenv').config({ path });
const { PrismaClient } = require('/opt/homeledger/node_modules/@prisma/client');
const bcrypt = require('/opt/homeledger/node_modules/bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'brunotoaz@gmail.com';
  const newPassword = '2026bruno@';
  
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.log('User not found:', email);
    return;
  }
  
  console.log('Found user:', user.email, 'role:', user.role, 'status:', user.status);
  
  // Check if current password works
  const currentWorks = await bcrypt.compare(newPassword, user.passwordHash);
  console.log('Password "2026bruno@" matches:', currentWorks);
  
  if (!currentWorks) {
    // Reset password
    const hash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { email },
      data: { passwordHash: hash },
    });
    console.log('Password reset to: 2026bruno@');
  } else {
    console.log('Password already correct - issue is elsewhere');
  }
  
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
