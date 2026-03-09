const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

p.user.findFirst({
  where: { email: 'brunotoaz@gmail.com' },
  select: { id: true, logoUrl: true }
}).then(u => {
  console.log('logoUrl length:', u.logoUrl ? u.logoUrl.length : 0);
  console.log('logoUrl start:', u.logoUrl ? u.logoUrl.substring(0, 80) : 'NULL');
  p.$disconnect();
}).catch(e => { console.error(e); p.$disconnect(); });
