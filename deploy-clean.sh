#!/bin/bash
set -e
cd /opt/homeledger

echo "=== 1. Stopping PM2 ==="
pm2 stop homeledger 2>/dev/null || true

echo "=== 2. Cleaning old build ==="
rm -rf .next

echo "=== 3. Checking source files ==="
echo "send-login-code route hash:"
md5sum app/api/auth/send-login-code/route.ts
echo "login page hash:"
md5sum app/login/page.tsx
echo "middleware hash:"
md5sum middleware.ts
echo "email lib hash:"
md5sum lib/email.ts
echo "auth lib hash:"
md5sum lib/auth.ts

echo "=== 4. Building ==="
npm run build 2>&1 | tail -10

echo "=== 5. Starting PM2 with env ==="
# Source env
export SMTP_HOST=smtp.hostinger.com
export SMTP_PORT=465
export SMTP_SECURE=true
export SMTP_USER=noreply@homeledger.co.uk
export SMTP_PASS='2026Bruno@'
export SMTP_FROM='HomeLedger <noreply@homeledger.co.uk>'
export PORT=3100

# Load remaining vars from .env.production
while IFS='=' read -r key value; do
  [[ -z "$key" || "$key" =~ ^# || "$key" =~ ^SMTP ]] && continue
  value="${value%\'}"
  value="${value#\'}"
  value="${value%\"}"
  value="${value#\"}"
  export "$key=$value" 2>/dev/null
done < /opt/homeledger/.env.production

pm2 delete homeledger 2>/dev/null || true
pm2 start npm --name homeledger -- start
sleep 4

echo "=== 6. Verify ==="
pm2 status homeledger
PID=$(pm2 pid homeledger)
echo "PID: $PID"
cat /proc/$PID/environ 2>/dev/null | tr '\0' '\n' | grep SMTP_USER && echo "SMTP: OK" || echo "SMTP: MISSING"

echo "=== 7. Test login API ==="
curl -s -X POST http://localhost:3100/api/auth/send-login-code \
  -H 'Content-Type: application/json' \
  -d '{"email":"brunotoaz@gmail.com","password":"2026bruno@"}'
echo ""

echo "=== 8. Check logs ==="
sleep 2
pm2 logs homeledger --lines 5 --nostream

pm2 save
echo "=== DEPLOY COMPLETE ==="
