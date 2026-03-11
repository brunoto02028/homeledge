#!/bin/bash
set -e

APP_DIR=/opt/homeledger
LOG_FILE=$APP_DIR/deploy.log
TS=$(date +%Y%m%d-%H%M%S)

log() { echo "[$(date +%H:%M:%S)] $1" | tee -a "$LOG_FILE"; }

log '========== ZERO-DOWNTIME DEPLOY START =========='

cd "$APP_DIR"

# 1. Install deps
log '1/6 Installing dependencies...'
npm install --legacy-peer-deps --prefer-offline 2>&1 | tail -5 | tee -a "$LOG_FILE"

# 2. Prisma generate + db push (non-destructive)
log '2/6 Prisma generate + db push...'
npx prisma generate 2>&1 | tail -3 | tee -a "$LOG_FILE"
npx prisma db push --skip-generate 2>&1 | tail -5 | tee -a "$LOG_FILE"

# 3. Build into a TEMP directory — never touch the live .next during build
#    This is the key fix: the running process keeps using .next untouched
log '3/6 Building into .next-building (live .next untouched)...'
rm -rf "$APP_DIR/.next-building"

# Point Next.js output to .next-building via env var
NEXT_PRIVATE_OUTPUT_DIR="$APP_DIR/.next-building" \
  npx next build 2>&1 | tail -15 | tee -a "$LOG_FILE"

BUILD_EXIT=${PIPESTATUS[0]}

# Fallback: if NEXT_PRIVATE_OUTPUT_DIR was ignored (Next 14), build normally
# but build into a staging copy of the directory instead
if [ ! -d "$APP_DIR/.next-building" ] || [ "$(ls -A "$APP_DIR/.next-building" 2>/dev/null | wc -l)" -eq 0 ]; then
  log '3b/6 Fallback: building normally (Next 14 ignores output override)...'
  # Save current .next as rollback BEFORE build touches it
  if [ -d "$APP_DIR/.next" ]; then
    cp -r "$APP_DIR/.next" "$APP_DIR/.next-rollback-$TS"
    log "Rollback saved: .next-rollback-$TS"
  fi
  npx next build 2>&1 | tail -15 | tee -a "$LOG_FILE"
  BUILD_EXIT=$?
  if [ $BUILD_EXIT -ne 0 ]; then
    log 'BUILD FAILED! Restoring previous version...'
    rm -rf "$APP_DIR/.next"
    mv "$APP_DIR/.next-rollback-$TS" "$APP_DIR/.next"
    log 'Restored. Deploy aborted.'
    exit 1
  fi
  # Build succeeded — .next already in place, no swap needed
  SKIP_SWAP=1
fi

if [ "${SKIP_SWAP}" != "1" ]; then
  if [ $BUILD_EXIT -ne 0 ]; then
    log 'BUILD FAILED! Aborting (live .next was never touched).'
    rm -rf "$APP_DIR/.next-building"
    exit 1
  fi
  # Atomic swap: save old as rollback, move new into place
  # The swap itself takes <1ms — running processes finish their current requests normally
  log '4/6 Atomic swap: .next-building → .next ...'
  if [ -d "$APP_DIR/.next" ]; then
    mv "$APP_DIR/.next" "$APP_DIR/.next-rollback-$TS"
  fi
  mv "$APP_DIR/.next-building" "$APP_DIR/.next"
  log "Swap complete. Rollback at .next-rollback-$TS"
fi

log '5/6 Fixing prerender-manifest...'
node "$APP_DIR/fix-manifest.js" 2>&1 | tee -a "$LOG_FILE"

# Clean up old rollbacks (keep only latest)
find "$APP_DIR" -maxdepth 1 -name '.next-rollback-*' -not -name ".next-rollback-$TS" -exec rm -rf {} + 2>/dev/null || true

# 6. Graceful reload — cluster mode recycles one instance at a time
#    At least 1 instance always serving — true zero-downtime
log '6/6 PM2 graceful reload (cluster mode — always 1 instance live)...'
if pm2 describe homeledger > /dev/null 2>&1; then
  # Delete + start to pick up ecosystem changes (instances, exec_mode, node_args)
  # on first run after switching to cluster mode; subsequent runs just reload
  CURRENT_MODE=$(pm2 describe homeledger | grep 'exec mode' | awk '{print $NF}')
  if [ "$CURRENT_MODE" != "cluster_mode" ]; then
    log 'Switching to cluster mode (one-time restart)...'
    pm2 delete homeledger 2>&1 | tee -a "$LOG_FILE"
    pm2 start "$APP_DIR/ecosystem.config.js" 2>&1 | tee -a "$LOG_FILE"
  else
    pm2 reload homeledger --update-env 2>&1 | tee -a "$LOG_FILE"
  fi
else
  log 'Process not in PM2 list — starting fresh...'
  pm2 start "$APP_DIR/ecosystem.config.js" 2>&1 | tee -a "$LOG_FILE"
fi
pm2 save 2>&1 | tee -a "$LOG_FILE"

# Verify
sleep 8
HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3100/ 2>/dev/null || echo '000')

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
  log "DEPLOY SUCCESS — HTTP $HTTP_CODE — App is live!"
  rm -rf "$APP_DIR/.next-rollback-$TS" 2>/dev/null || true
else
  log "WARNING — HTTP $HTTP_CODE — Auto-rolling back..."
  ROLLBACK=$(ls -d "$APP_DIR"/.next-rollback-* 2>/dev/null | tail -1)
  if [ -n "$ROLLBACK" ]; then
    rm -rf "$APP_DIR/.next"
    mv "$ROLLBACK" "$APP_DIR/.next"
    node "$APP_DIR/fix-manifest.js"
    pm2 reload homeledger 2>/dev/null || pm2 restart homeledger
    sleep 6
    HTTP2=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3100/ 2>/dev/null || echo '000')
    log "Rollback complete — HTTP $HTTP2"
  else
    log 'No rollback available. Run: pm2 logs homeledger'
  fi
fi

log '========== DEPLOY COMPLETE =========='
echo ''
echo 'Deploy complete!'
