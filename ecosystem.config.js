const fs = require('fs');
const path = require('path');

// Load .env.production
const envFile = path.join(__dirname, '.env.production');
const envVars = {};
if (fs.existsSync(envFile)) {
  fs.readFileSync(envFile, 'utf8').split('\n').forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;
    const idx = line.indexOf('=');
    if (idx > 0) {
      let val = line.slice(idx + 1);
      // Strip surrounding quotes
      if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
        val = val.slice(1, -1);
      }
      envVars[line.slice(0, idx)] = val;
    }
  });
}

module.exports = {
  apps: [{
    name: 'homeledger',
    script: 'node_modules/.bin/next',
    args: 'start -p 3100',
    cwd: '/opt/homeledger',
    // Cluster mode: 2 instances — during reload PM2 recycles one at a time
    // so there is ALWAYS at least 1 instance serving requests (true zero-downtime)
    instances: 2,
    exec_mode: 'cluster',
    // Memory: give Node 1.5GB each to avoid heap pressure (server has 16GB)
    node_args: '--max-old-space-size=1536',
    // Reload / restart settings
    listen_timeout: 30000,  // Wait up to 30s for new process to listen
    kill_timeout: 8000,     // Give old process 8s to finish in-flight requests
    max_restarts: 15,
    min_uptime: 5000,
    restart_delay: 1000,
    exp_backoff_restart_delay: 100,
    env: {
      NODE_ENV: 'production',
      ...envVars,
    },
  }],
};
