/**
 * Performance Benchmark Script for HomeLedger.
 *
 * Measures build time, bundle sizes, and page load metrics.
 * Run with: `npm run benchmark`
 *
 * @module benchmark
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const NEXT_DIR = path.join(ROOT, '.next');

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function getDirSize(dir) {
  let total = 0;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        total += getDirSize(full);
      } else {
        total += fs.statSync(full).size;
      }
    }
  } catch { /* ignore */ }
  return total;
}

console.log('='.repeat(60));
console.log('  HomeLedger Performance Benchmark');
console.log('='.repeat(60));
console.log();

// 1. Build time
console.log('[1/4] Measuring build time...');
const buildStart = Date.now();
try {
  execSync('npx next build', { cwd: ROOT, stdio: 'pipe' });
} catch (err) {
  console.error('  Build failed:', err.message?.substring(0, 200));
  process.exit(1);
}
const buildTime = ((Date.now() - buildStart) / 1000).toFixed(1);
console.log(`  Build time: ${buildTime}s`);
console.log();

// 2. Bundle sizes
console.log('[2/4] Measuring bundle sizes...');
const staticDir = path.join(NEXT_DIR, 'static');
const serverDir = path.join(NEXT_DIR, 'server');
const staticSize = getDirSize(staticDir);
const serverSize = getDirSize(serverDir);
const totalSize = getDirSize(NEXT_DIR);

console.log(`  Client bundles (static/): ${formatBytes(staticSize)}`);
console.log(`  Server bundles (server/): ${formatBytes(serverSize)}`);
console.log(`  Total .next/ directory:   ${formatBytes(totalSize)}`);
console.log();

// 3. Page count
console.log('[3/4] Counting pages and API routes...');
const appDir = path.join(ROOT, 'app');
let pageCount = 0;
let apiRouteCount = 0;

function countFiles(dir, pattern) {
  let count = 0;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        count += countFiles(full, pattern);
      } else if (entry.name.match(pattern)) {
        count++;
      }
    }
  } catch { /* ignore */ }
  return count;
}

pageCount = countFiles(appDir, /^page\.tsx$/);
apiRouteCount = countFiles(path.join(appDir, 'api'), /^route\.ts$/);

console.log(`  Pages:      ${pageCount}`);
console.log(`  API routes: ${apiRouteCount}`);
console.log();

// 4. Dependency count
console.log('[4/4] Counting dependencies...');
try {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  const deps = Object.keys(pkg.dependencies || {}).length;
  const devDeps = Object.keys(pkg.devDependencies || {}).length;
  console.log(`  Dependencies:     ${deps}`);
  console.log(`  Dev dependencies: ${devDeps}`);
  console.log(`  Total:            ${deps + devDeps}`);
} catch { /* ignore */ }

console.log();
console.log('='.repeat(60));
console.log('  Summary');
console.log('='.repeat(60));
console.log(`  Build time:       ${buildTime}s`);
console.log(`  Client bundle:    ${formatBytes(staticSize)}`);
console.log(`  Server bundle:    ${formatBytes(serverSize)}`);
console.log(`  Pages:            ${pageCount}`);
console.log(`  API routes:       ${apiRouteCount}`);
console.log('='.repeat(60));
