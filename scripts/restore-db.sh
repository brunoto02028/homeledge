#!/bin/bash
# ============================================================
# HomeLedger — Database Restore Script
# Usage: ./scripts/restore-db.sh [backup-file.dump]
# If no file specified, lists available backups to choose from.
# ============================================================
set -euo pipefail

APP_DIR="/opt/homeledger"
BACKUP_DIR="/opt/homeledger-backups"

# Load DATABASE_URL from .env
if [ -f "$APP_DIR/.env" ]; then
  export $(grep -E '^DATABASE_URL=' "$APP_DIR/.env" | xargs)
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "[ERROR] DATABASE_URL not set. Aborting restore."
  exit 1
fi

# Parse DATABASE_URL
DB_USER=$(echo "$DATABASE_URL" | sed -n 's|.*://\([^:]*\):.*|\1|p')
DB_PASS=$(echo "$DATABASE_URL" | sed -n 's|.*://[^:]*:\([^@]*\)@.*|\1|p')
DB_HOST=$(echo "$DATABASE_URL" | sed -n 's|.*@\([^:]*\):.*|\1|p')
DB_PORT=$(echo "$DATABASE_URL" | sed -n 's|.*:\([0-9]*\)/.*|\1|p')
DB_NAME=$(echo "$DATABASE_URL" | sed -n 's|.*/\([^?]*\).*|\1|p')

# ── If no file specified, list available backups ─────────────
if [ -z "${1:-}" ]; then
  echo ""
  echo "=== Available Backups ==="
  echo ""
  echo "--- Daily ---"
  ls -lhtr "$BACKUP_DIR/daily/"*.dump 2>/dev/null | awk '{print NR". "$NF" ("$5")"}'
  echo ""
  echo "--- Weekly ---"
  ls -lhtr "$BACKUP_DIR/weekly/"*.dump 2>/dev/null | awk '{print NR". "$NF" ("$5")"}'
  echo ""
  echo "Usage: $0 <path-to-backup.dump>"
  exit 0
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "[ERROR] Backup file not found: $BACKUP_FILE"
  exit 1
fi

FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║          ⚠️  DATABASE RESTORE WARNING            ║"
echo "╠══════════════════════════════════════════════════╣"
echo "║  This will REPLACE ALL DATA in: $DB_NAME"
echo "║  Backup file: $BACKUP_FILE ($FILE_SIZE)"
echo "║  Target: $DB_HOST:$DB_PORT"
echo "╚══════════════════════════════════════════════════╝"
echo ""
read -p "Type 'RESTORE' to confirm: " CONFIRM

if [ "$CONFIRM" != "RESTORE" ]; then
  echo "Aborted."
  exit 0
fi

echo ""
echo "[1/4] Stopping application..."
pm2 stop homeledger 2>/dev/null || true

echo "[2/4] Creating safety backup of current database..."
SAFETY_TS=$(date +%Y%m%d-%H%M%S)
export PGPASSWORD="$DB_PASS"
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
  --format=custom --compress=9 \
  --file="$BACKUP_DIR/daily/pre-restore-safety-$SAFETY_TS.dump" 2>/dev/null || true
echo "  Safety backup: pre-restore-safety-$SAFETY_TS.dump"

echo "[3/4] Restoring database from backup..."
pg_restore -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
  --clean --if-exists --no-owner --no-privileges \
  "$BACKUP_FILE" 2>&1
unset PGPASSWORD

RESTORE_EXIT=$?
if [ $RESTORE_EXIT -ne 0 ]; then
  echo "[WARNING] pg_restore exited with code $RESTORE_EXIT (some warnings are normal)"
fi

echo "[4/4] Restarting application..."
pm2 start homeledger 2>/dev/null || true

sleep 3
HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3100/ 2>/dev/null || echo '000')

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "302" ]; then
  echo ""
  echo "✅ Restore complete — App is live (HTTP $HTTP_CODE)"
else
  echo ""
  echo "⚠️  App returned HTTP $HTTP_CODE — check PM2 logs: pm2 logs homeledger"
fi
