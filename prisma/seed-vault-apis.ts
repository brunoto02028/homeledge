import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();
const SECRET = process.env.NEXTAUTH_SECRET || 'Ch0HxBM4nv6ar6EvhoRFAH5rGThuKcn0';

function encrypt(text: string): string {
  const iv = crypto.randomBytes(12);
  const key = crypto.scryptSync(SECRET, 'salt', 32);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let enc = cipher.update(text, 'utf8', 'hex');
  enc += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  return iv.toString('hex') + ':' + enc + ':' + tag;
}

async function main() {
  const admin = await prisma.user.findFirst({ where: { email: 'admin@homeledger.co.uk' } });
  if (!admin) { console.log('Admin not found'); return; }

  const entries = [
    { name: 'NewsAPI', category: 'other', username: 'brunoto02028@gmail.com', password: '47c2301eb90340bc831bf882fd1ec248', url: 'https://newsapi.org', notes: 'API Key for Global Intelligence Dashboard. Free plan: 100 req/day.' },
    { name: 'Mapbox', category: 'other', username: 'homeledge', password: 'MAPBOX_TOKEN_STORED_IN_VAULT', url: 'https://console.mapbox.com', notes: 'Public token for map rendering. Org: HomeLedger, Email: admin@homeledger.co.uk. Token stored in Secure Vault on VPS.' },
  ];

  for (const e of entries) {
    const existing = await (prisma as any).vaultEntry.findFirst({ where: { userId: admin.id, title: e.name } });
    if (existing) { console.log(`  Skip ${e.name} (exists)`); continue; }
    await (prisma as any).vaultEntry.create({
      data: {
        userId: admin.id,
        title: e.name,
        category: e.category,
        username: e.username,
        passwordEnc: encrypt(e.password),
        websiteUrl: e.url,
        notes: e.notes,
      }
    });
    console.log(`  ✓ Saved ${e.name} to Vault`);
  }
}

main().then(() => prisma.$disconnect()).catch(e => { console.error(e); prisma.$disconnect(); });
