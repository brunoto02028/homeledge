const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function main() {
  const prisma = new PrismaClient();

  // Find users with custom logos
  const users = await prisma.user.findMany({
    where: { NOT: { logoUrl: null } },
    select: { id: true, logoUrl: true, email: true }
  });
  console.log('Users with custom logos:', JSON.stringify(users, null, 2));

  // Clear logoUrl for all users
  const result = await prisma.user.updateMany({
    where: { NOT: { logoUrl: null } },
    data: { logoUrl: null }
  });
  console.log('Cleared logoUrl for', result.count, 'users');

  // Delete all uploaded logo files
  const logosDir = path.join('/opt/homeledger/public/uploads/logos');
  if (fs.existsSync(logosDir)) {
    const files = fs.readdirSync(logosDir);
    for (const file of files) {
      fs.unlinkSync(path.join(logosDir, file));
      console.log('Deleted uploaded logo:', file);
    }
  }

  // Delete old ledgerflow SVG files from public
  const publicDir = '/opt/homeledger/public';
  const oldFiles = ['ledgerflow-icon.svg', 'ledgerflow-logo.svg', 'ledgerflow-logo-dark.svg'];
  for (const f of oldFiles) {
    const fp = path.join(publicDir, f);
    if (fs.existsSync(fp)) {
      fs.unlinkSync(fp);
      console.log('Deleted old branding file:', f);
    }
  }

  await prisma.$disconnect();
  console.log('Done! All old logos cleared.');
}

main().catch(e => { console.error(e); process.exit(1); });
