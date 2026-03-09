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

log '4/5 Build complete. Fixing prerender-manifest...'
# Always fix manifest — prevents 502 when prerender errors occur during build
node "$APP_DIR/fix-manifest.js" 2>&1 | tee -a "$LOG_FILE"
# Keep only latest rollback, remove older ones
find "$APP_DIR" -maxdepth 1 -name '.next-rollback-*' -not -name ".next-rollback-$TS" -exec rm -rf {} + 2>/dev/null || true

# 5. Graceful reload — zero-downtime
# pm2 reload: starts NEW process first, waits for it to listen, THEN kills old
# If process was lost (crash), fall back to pm2 start
log '5/5 PM2 graceful reload (zero-downtime)...'
if pm2 describe homeledger > /dev/null 2>&1; then
  pm2 reload homeledger --update-env 2>&1 | tee -a "$LOG_FILE"
else
  log 'Process not in PM2 list — starting fresh...'
  pm2 start "$APP_DIR/ecosystem.config.js" 2>&1 | tee -a "$LOG_FILE"
fi
pm2 save 2>&1 | tee -a "$LOG_FILE"

# Wait and verify
sleep 6
HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3100/ 2>/dev/null || echo '000')

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
  log "DEPLOY SUCCESS — HTTP $HTTP_CODE — App is live!"
  rm -rf "$APP_DIR/.next-rollback-$TS"
else
  log "WARNING — HTTP $HTTP_CODE — Auto-rolling back..."
  ROLLBACK=$(ls -d "$APP_DIR"/.next-rollback-* 2>/dev/null | tail -1)
  if [ -n "$ROLLBACK" ]; then
    rm -rf "$APP_DIR/.next"
    mv "$ROLLBACK" "$APP_DIR/.next"
    node "$APP_DIR/fix-manifest.js"
    pm2 reload homeledger 2>/dev/null || pm2 restart homeledger
    sleep 4
    HTTP2=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3100/ 2>/dev/null || echo '000')
    log "Rollback complete — HTTP $HTTP2"
  else
    log 'No rollback available. Run: pm2 logs homeledger'
  fi
fi

log '========== DEPLOY COMPLETE =========='
echo ''
echo 'Deploy complete!'
