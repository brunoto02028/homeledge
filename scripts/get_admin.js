const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.user.findFirst({ where: { role: 'admin' }, select: { email: true, fullName: true } })
  .then(u => { console.log(JSON.stringify(u)); p.$disconnect(); })
  .catch(e => { console.error(e); p.$disconnect(); });
