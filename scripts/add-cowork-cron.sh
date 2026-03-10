#!/bin/bash
# Remove old cowork cron entries and add new ones
crontab -l 2>/dev/null | grep -v 'cowork' > /tmp/crontab_new

# Run scheduled tasks every 30 minutes
echo '*/30 * * * * curl -s -X POST https://clarityco.co.uk/api/cowork/run -H "Authorization: Bearer homeledger-cron-2024" -H "Content-Type: application/json" -d "{\"action\":\"run_scheduled\"}" >> /var/log/cowork-cron.log 2>&1' >> /tmp/crontab_new

# Run system monitor every day at 6am
echo '0 6 * * * curl -s -X POST https://clarityco.co.uk/api/cowork/run -H "Authorization: Bearer homeledger-cron-2024" -H "Content-Type: application/json" -d "{\"action\":\"monitor\"}" >> /var/log/cowork-cron.log 2>&1' >> /tmp/crontab_new

crontab /tmp/crontab_new
echo "Cron updated:"
crontab -l | grep cowork
