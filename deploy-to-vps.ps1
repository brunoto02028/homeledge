# HomeLedger Zero-Downtime Deploy Script (PowerShell)
# Usage: .\deploy-to-vps.ps1
# This script syncs source files to the VPS and triggers a zero-downtime build+reload

$VPS = "root@5.182.18.148"
$REMOTE_DIR = "/opt/homeledger"
$LOCAL_DIR = $PSScriptRoot

Write-Host "`n========== HOMELEDGER ZERO-DOWNTIME DEPLOY ==========" -ForegroundColor Cyan
Write-Host "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray

# ── Step 1: Sync source files ──────────────────────────────────────
Write-Host "`n[1/3] Syncing source files to VPS..." -ForegroundColor Yellow

# Directories to sync (excluding .next, node_modules, .git)
$syncDirs = @("app", "components", "lib", "prisma", "public", "e2e", "docs")
foreach ($dir in $syncDirs) {
    $localPath = Join-Path $LOCAL_DIR $dir
    if (Test-Path $localPath) {
        Write-Host "  -> $dir/" -ForegroundColor Gray
        scp -r "$localPath" "${VPS}:${REMOTE_DIR}/" 2>$null
    }
}

# Root config files
$rootFiles = @(
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    "next.config.js",
    "tailwind.config.ts",
    "postcss.config.mjs",
    "middleware.ts",
    "ecosystem.config.js",
    "deploy.sh"
)
foreach ($file in $rootFiles) {
    $localFile = Join-Path $LOCAL_DIR $file
    if (Test-Path $localFile) {
        Write-Host "  -> $file" -ForegroundColor Gray
        scp "$localFile" "${VPS}:${REMOTE_DIR}/$file" 2>$null
    }
}

Write-Host "  Files synced!" -ForegroundColor Green

# ── Step 2: Trigger remote zero-downtime deploy ────────────────────
Write-Host "`n[2/3] Running zero-downtime deploy on VPS..." -ForegroundColor Yellow
Write-Host "  (build + prisma + atomic swap + pm2 reload)" -ForegroundColor Gray
Write-Host ""

ssh $VPS "bash $REMOTE_DIR/deploy.sh"

# ── Step 3: Verify ─────────────────────────────────────────────────
Write-Host "`n[3/3] Verifying site..." -ForegroundColor Yellow

Start-Sleep -Seconds 2

try {
    $response = Invoke-WebRequest -Uri "https://homeledger.co.uk" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 302) {
        Write-Host "  Site is LIVE - HTTP $($response.StatusCode)" -ForegroundColor Green
    } else {
        Write-Host "  WARNING - HTTP $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  Could not verify externally (may be DNS/firewall). Check VPS logs." -ForegroundColor Yellow
}

Write-Host "`n========== DEPLOY COMPLETE ==========" -ForegroundColor Cyan
Write-Host ""
