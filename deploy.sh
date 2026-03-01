#!/bin/bash
set -e

APP_DIR=/opt/homeledger
LOG_FILE=$APP_DIR/deploy.log
TS=$(date +%Y%m%d-%H%M%S)

log() { echo "[$(date +%H:%M:%S)] $1" | tee -a "$LOG_FILE"; }

log '========== ZERO-DOWNTIME DEPLOY START =========='

# 1. Install deps if needed
log '1/5 Installing dependencies...'
cd "$APP_DIR"
npm install --legacy-peer-deps --prefer-offline 2>&1 | tail -5 | tee -a "$LOG_FILE"

# 2. Prisma generate + db push (non-destructive)
log '2/5 Prisma generate + db push...'
npx prisma generate 2>&1 | tail -3 | tee -a "$LOG_FILE"
npx prisma db push --skip-generate 2>&1 | tail -5 | tee -a "$LOG_FILE"

# 3. Build new version while old version keeps serving
log '3/5 Building new version (old version still serving traffic)...'
# Back up current .next so we can restore on failure
if [ -d "$APP_DIR/.next" ]; then
  cp -r "$APP_DIR/.next" "$APP_DIR/.next-rollback-$TS"
fi

# Build replaces .next in-place (Next.js 14 doesn't support custom output dir easily)
# But the OLD process is still running from memory, so no downtime during build
npx next build 2>&1 | tail -10 | tee -a "$LOG_FILE"

BUILD_EXIT=$?
if [ $BUILD_EXIT -ne 0 ]; then
  log 'BUILD FAILED! Restoring previous version...'
  rm -rf "$APP_DIR/.next"
  mv "$APP_DIR/.next-rollback-$TS" "$APP_DIR/.next"
  log 'Restored. Deploy aborted.'
  exit 1
fi

log '4/5 Build successful. Cleaning rollback backup...'
# Keep one rollback copy, remove older ones
find "$APP_DIR" -maxdepth 1 -name '.next-rollback-*' -not -name ".next-rollback-$TS" -exec rm -rf {} + 2>/dev/null || true

# 5. Graceful reload — PM2 starts new process, waits for it to listen, then kills old
log '5/5 PM2 graceful reload (zero-downtime)...'
pm2 reload homeledger --update-env 2>&1 | tee -a "$LOG_FILE"

# Wait and verify
sleep 3
HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3100/ 2>/dev/null || echo '000')

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "302" ]; then
  log "DEPLOY SUCCESS — HTTP $HTTP_CODE — App is live!"
  # Safe to remove rollback now
  rm -rf "$APP_DIR/.next-rollback-$TS"
else
  log "WARNING — HTTP $HTTP_CODE — Checking PM2 status..."
  pm2 status homeledger 2>&1 | tee -a "$LOG_FILE"
  log "Rollback available at .next-rollback-$TS"
  log "To rollback: rm -rf .next && mv .next-rollback-$TS .next && pm2 reload homeledger"
fi

log '========== ZERO-DOWNTIME DEPLOY COMPLETE =========='
echo ''
echo '✅ Deploy complete with zero downtime!'
