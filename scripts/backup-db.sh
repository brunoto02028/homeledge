#!/bin/bash
# ============================================================
# HomeLedger — Automated PostgreSQL Backup Script
# Run daily via cron: 0 3 * * * /opt/homeledger/scripts/backup-db.sh
# ============================================================
set -euo pipefail

# ── Config ───────────────────────────────────────────────────
APP_DIR="/opt/homeledger"
BACKUP_DIR="/opt/homeledger-backups"
RETENTION_DAYS=30           # keep last 30 daily backups
RETENTION_WEEKLY=12         # keep last 12 weekly backups (Sundays)
LOG_FILE="$BACKUP_DIR/backup.log"
TS=$(date +%Y%m%d-%H%M%S)
DAY_OF_WEEK=$(date +%u)     # 1=Monday … 7=Sunday

# Load DATABASE_URL from .env.production (preferred) or .env
ENV_FILE="$APP_DIR/.env.production"
[ ! -f "$ENV_FILE" ] && ENV_FILE="$APP_DIR/.env"

if [ -f "$ENV_FILE" ]; then
  DATABASE_URL=$(grep -E "^DATABASE_URL=" "$ENV_FILE" | head -1 | sed "s/^DATABASE_URL=//;s/^['\"]//;s/['\"]$//")
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "[ERROR] DATABASE_URL not set. Aborting backup." | tee -a "$LOG_FILE"
  exit 1
fi

# Parse DATABASE_URL using Python (handles special chars like @ in passwords)
eval $(python3 -c "
from urllib.parse import urlparse, unquote
u = urlparse('$DATABASE_URL')
print(f'DB_USER={unquote(u.username or \"\")}')
print(f'DB_HOST={u.hostname or \"localhost\"}')
print(f'DB_PORT={u.port or 5432}')
print(f'DB_NAME={u.path.lstrip(\"/\").split(\"?\")[0]}')
" 2>/dev/null)

# Extract password separately (may contain special chars)
DB_PASS=$(python3 -c "
from urllib.parse import urlparse, unquote
u = urlparse('$DATABASE_URL')
print(unquote(u.password or ''))
" 2>/dev/null)

# ── Setup ────────────────────────────────────────────────────
mkdir -p "$BACKUP_DIR/daily"
mkdir -p "$BACKUP_DIR/weekly"

log() { echo "[$(date +%Y-%m-%d\ %H:%M:%S)] $1" | tee -a "$LOG_FILE"; }

log "========== BACKUP START =========="
log "Database: $DB_NAME @ $DB_HOST:$DB_PORT"

# ── Daily Backup ─────────────────────────────────────────────
DAILY_FILE="$BACKUP_DIR/daily/homeledger-$TS.sql.gz"

export PGPASSWORD="$DB_PASS"
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
  --format=custom --compress=9 --no-owner --no-privileges \
  --file="$BACKUP_DIR/daily/homeledger-$TS.dump" 2>&1 | tee -a "$LOG_FILE"

DUMP_EXIT=$?
unset PGPASSWORD

if [ $DUMP_EXIT -ne 0 ]; then
  log "[ERROR] pg_dump failed with exit code $DUMP_EXIT"
  exit 1
fi

DUMP_SIZE=$(du -h "$BACKUP_DIR/daily/homeledger-$TS.dump" | cut -f1)
log "Daily backup created: homeledger-$TS.dump ($DUMP_SIZE)"

# ── Weekly Backup (copy Sunday's daily to weekly) ────────────
if [ "$DAY_OF_WEEK" = "7" ]; then
  cp "$BACKUP_DIR/daily/homeledger-$TS.dump" "$BACKUP_DIR/weekly/homeledger-weekly-$TS.dump"
  log "Weekly backup created (Sunday): homeledger-weekly-$TS.dump"
fi

# ── Retention: prune old backups ─────────────────────────────
PRUNED_DAILY=$(find "$BACKUP_DIR/daily" -name "*.dump" -mtime +$RETENTION_DAYS -delete -print | wc -l)
PRUNED_WEEKLY=$(find "$BACKUP_DIR/weekly" -name "*.dump" -mtime +$(( RETENTION_WEEKLY * 7 )) -delete -print | wc -l)

log "Pruned: $PRUNED_DAILY daily (>${RETENTION_DAYS}d), $PRUNED_WEEKLY weekly (>${RETENTION_WEEKLY}w)"

# ── Verify backup integrity ──────────────────────────────────
export PGPASSWORD="$DB_PASS"
TABLE_COUNT=$(pg_restore --list "$BACKUP_DIR/daily/homeledger-$TS.dump" 2>/dev/null | grep -c "TABLE" || echo "0")
unset PGPASSWORD

log "Verification: $TABLE_COUNT table entries found in backup"

if [ "$TABLE_COUNT" -lt 10 ]; then
  log "[WARNING] Backup may be incomplete — only $TABLE_COUNT tables found"
fi

# ── Summary ──────────────────────────────────────────────────
DAILY_COUNT=$(find "$BACKUP_DIR/daily" -name "*.dump" | wc -l)
WEEKLY_COUNT=$(find "$BACKUP_DIR/weekly" -name "*.dump" | wc -l)
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)

log "Storage: $DAILY_COUNT daily, $WEEKLY_COUNT weekly, $TOTAL_SIZE total"
log "========== BACKUP COMPLETE =========="
