#!/bin/bash
cd /opt/homeledger

# Stop and delete current process
pm2 delete homeledger 2>/dev/null

# Load env vars from .env.production
set -a
source /opt/homeledger/.env.production
set +a

# Verify SMTP is loaded
echo "SMTP_USER in env: $SMTP_USER"
echo "SMTP_HOST in env: $SMTP_HOST"

# Start with all env vars available
pm2 start npm --name homeledger -- start

# Wait for startup
sleep 3

# Verify process has SMTP
PID=$(pm2 pid homeledger)
echo "PM2 PID: $PID"
cat /proc/$PID/environ | tr '\0' '\n' | grep SMTP_USER || echo "STILL NO SMTP"

# Save PM2 config
pm2 save

echo "=== DONE ==="
