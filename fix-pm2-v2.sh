#!/bin/bash
cd /opt/homeledger

# Fix SMTP_FROM quoting in .env.production
sed -i "s/^SMTP_FROM=.*/SMTP_FROM='HomeLedger <noreply@homeledger.co.uk>'/" /opt/homeledger/.env.production

# Also fix in .env
sed -i "s/^SMTP_FROM=.*/SMTP_FROM='HomeLedger <noreply@homeledger.co.uk>'/" /opt/homeledger/.env

# Verify fix
echo "=== .env.production SMTP_FROM ==="
grep SMTP_FROM /opt/homeledger/.env.production

# Stop current
pm2 delete homeledger 2>/dev/null

# Source env vars properly
export SMTP_HOST=smtp.hostinger.com
export SMTP_PORT=465
export SMTP_SECURE=true
export SMTP_USER=noreply@homeledger.co.uk
export SMTP_PASS='2026Bruno@'
export SMTP_FROM='HomeLedger <noreply@homeledger.co.uk>'
export PORT=3100

# Load remaining vars
while IFS='=' read -r key value; do
  # Skip comments and empty lines
  [[ -z "$key" || "$key" =~ ^# ]] && continue
  # Skip SMTP (already set) and lines with special chars
  [[ "$key" =~ ^SMTP ]] && continue
  # Remove surrounding quotes
  value="${value%\'}"
  value="${value#\'}"
  value="${value%\"}"
  value="${value#\"}"
  export "$key=$value" 2>/dev/null
done < /opt/homeledger/.env.production

echo "SMTP_USER=$SMTP_USER"
echo "SMTP_HOST=$SMTP_HOST"
echo "PORT=$PORT"

# Start PM2 with env vars inherited
pm2 start npm --name homeledger -- start

sleep 4

# Check process env
PID=$(pm2 pid homeledger)
echo "=== Checking PID $PID ==="
cat /proc/$PID/environ 2>/dev/null | tr '\0' '\n' | grep SMTP_USER && echo "SMTP IS IN PROCESS ENV!" || echo "STILL NO SMTP"

# Check logs
pm2 logs homeledger --lines 5 --nostream

pm2 save
echo "=== DONE ==="
