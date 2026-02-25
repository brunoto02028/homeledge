const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.landingPageSection.findMany({ orderBy: { sortOrder: 'asc' }, select: { sectionKey: true, title: true, isPublished: true } })
  .then(r => { console.log(JSON.stringify(r, null, 2)); return p.$disconnect(); })
  .catch(e => { console.error(e); process.exit(1); });
