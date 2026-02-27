#!/bin/bash
echo "=== PM2 PID ==="
PID=$(pm2 pid homeledger)
echo "PID: $PID"

echo "=== SMTP in process env ==="
cat /proc/$PID/environ 2>/dev/null | tr '\0' '\n' | grep SMTP || echo "NO SMTP IN PROCESS ENV"

echo "=== SMTP in .env.production ==="
grep SMTP /opt/homeledger/.env.production

echo "=== Quick email test from Next.js context ==="
cd /opt/homeledger
node -e "
require('./node_modules/dotenv').config({ path: '.env.production' });
console.log('SMTP_USER from .env.production:', process.env.SMTP_USER);
console.log('SMTP_HOST from .env.production:', process.env.SMTP_HOST);
"
