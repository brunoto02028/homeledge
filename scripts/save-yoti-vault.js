const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

function getKey() {
  const secret = process.env.VAULT_ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET || 'homeledger-vault-default-key-change-me';
  const buf = crypto.createHash('sha256').update(secret).digest();
  return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
}

function encrypt(text) {
  if (!text) return '';
  const key = getKey();
  const ivBuf = crypto.randomBytes(16);
  const iv = new Uint8Array(ivBuf.buffer, ivBuf.byteOffset, ivBuf.byteLength);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let enc = cipher.update(text, 'utf8', 'hex');
  enc += cipher.final('hex');
  const tag = cipher.getAuthTag();
  return ivBuf.toString('hex') + ':' + tag.toString('hex') + ':' + enc;
}

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: 'admin' } });
  if (!admin) { console.error('No admin user found'); process.exit(1); }

  const entries = [
    { title: 'Yoti Sandbox - SDK ID', category: 'other', username: encrypt('fbd0172b-caf5-4fe5-bab6-4ce60c6731b2'), passwordEnc: encrypt(''), websiteUrl: encrypt('https://hub.yoti.com'), notes: encrypt('Yoti Sandbox Client SDK ID. Env: YOTI_CLIENT_SDK_ID') },
    { title: 'Yoti Sandbox - PEM Key Path', category: 'other', username: encrypt('yoti-sandbox.pem'), passwordEnc: encrypt('/opt/homeledger/yoti-sandbox.pem'), websiteUrl: encrypt('https://hub.yoti.com'), notes: encrypt('Yoti RSA Private Key path on VPS. Env: YOTI_PEM_KEY_PATH') },
    { title: 'Yoti Webhook Secret', category: 'other', username: encrypt('YOTI_WEBHOOK_SECRET'), passwordEnc: encrypt('homeledger-yoti-webhook-2026'), websiteUrl: encrypt('https://homeledger.co.uk/api/yoti/webhook'), notes: encrypt('Bearer token for Yoti webhook auth') },
  ];

  for (const e of entries) {
    await prisma.vaultEntry.create({ data: { userId: admin.id, ...e } });
    console.log('Saved:', e.title);
  }
  console.log('All Yoti credentials saved to Vault!');
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
