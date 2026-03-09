const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
const fs = require('fs');

async function main() {
  // Check user logo URLs
  const users = await p.user.findMany({ select: { id: true, email: true, logoUrl: true } });
  console.log('=== USER LOGOS ===');
  users.forEach(u => console.log(`  ${u.email}: ${u.logoUrl || 'NO LOGO SET'}`));

  // Check if logo files exist on disk
  console.log('\n=== LOGO FILES ON DISK ===');
  const uploadsDir = '/opt/homeledger/public/uploads';
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir).filter(f => f.includes('logo') || f.endsWith('.png') || f.endsWith('.svg'));
    files.forEach(f => {
      const stats = fs.statSync(`${uploadsDir}/${f}`);
      console.log(`  ${f} (${stats.size} bytes, modified: ${stats.mtime.toISOString().slice(0,19)})`);
    });
    if (files.length === 0) console.log('  No logo files found in uploads/');
  } else {
    console.log('  uploads/ directory does not exist');
  }

  // Check all files in public/ that could be logos
  console.log('\n=== PUBLIC LOGO FILES ===');
  const publicDir = '/opt/homeledger/public';
  const logoFiles = fs.readdirSync(publicDir).filter(f => 
    f.includes('logo') || f.includes('icon') || f === 'favicon.svg' || f === 'site-logo.png'
  );
  logoFiles.forEach(f => {
    const stats = fs.statSync(`${publicDir}/${f}`);
    console.log(`  ${f} (${stats.size} bytes)`);
  });
}

main().catch(console.error).finally(() => p.$disconnect());
