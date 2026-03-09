const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
const fs = require('fs');
const path = require('path');

async function main() {
  const user = await p.user.findFirst({ where: { role: 'admin' }, select: { logoUrl: true } });
  const logoUrl = user ? user.logoUrl : null;
  console.log('DB logoUrl:', logoUrl);
  
  if (logoUrl) {
    const filePath = path.join('/opt/homeledger/public', logoUrl);
    try {
      const stat = fs.statSync(filePath);
      console.log('File exists:', filePath, 'Size:', stat.size, 'bytes');
    } catch (e) {
      console.log('File MISSING:', filePath);
    }
  }
  
  // Check serve route would work
  const uploadsDir = '/opt/homeledger/public/uploads/logos/';
  try {
    const files = fs.readdirSync(uploadsDir);
    console.log('Upload dir files:', files);
  } catch (e) {
    console.log('Upload dir error:', e.message);
  }
  
  await p.$disconnect();
}
main().catch(e => { console.error(e.message); process.exit(1); });
