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
    // Zero-downtime reload settings
    listen_timeout: 10000,  // Wait up to 10s for new process to be ready
    kill_timeout: 5000,     // Give old process 5s to finish in-flight requests
    max_restarts: 3,        // Max restart attempts before giving up
    restart_delay: 1000,    // 1s delay between restart attempts
    env: {
      NODE_ENV: 'production',
      ...envVars,
    },
  }],
};
