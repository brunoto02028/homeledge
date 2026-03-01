---
description: Zero-downtime deploy HomeLedger to VPS
---

# Zero-Downtime Deploy to VPS

Deploy all local changes to the production VPS (homeledger.co.uk) with zero downtime.

## Steps

1. Sync changed source files to VPS via SCP (exclude .next, node_modules, .git)

// turbo
2. Upload the `prisma/schema.prisma` file:
```
scp "c:\Bruno Projetos\Household Finance Hub\uk_household_finance_hub\nextjs_space\prisma\schema.prisma" root@5.182.18.148:/opt/homeledger/prisma/schema.prisma
```

3. Upload all changed `app/`, `lib/`, `components/` files to the VPS using SCP. Only upload files that were actually modified. Example:
```
scp "<local-file>" root@5.182.18.148:/opt/homeledger/<remote-path>
```

4. Upload root config files if changed (package.json, middleware.ts, next.config.js, ecosystem.config.js, tailwind.config.ts):
```
scp "<local-file>" root@5.182.18.148:/opt/homeledger/<filename>
```

// turbo
5. Run the zero-downtime deploy script on VPS:
```
ssh root@5.182.18.148 "bash /opt/homeledger/deploy.sh"
```
This will: install deps → prisma generate + db push → build (while old app serves traffic) → pm2 reload (graceful, no downtime)

// turbo
6. Verify the site is live:
```
ssh root@5.182.18.148 "curl -s -o /dev/null -w '%{http_code}' http://localhost:3100/"
```
Expected: 200 or 302

## Rollback
If something goes wrong, the deploy script keeps a `.next-rollback-*` backup. To rollback:
```
ssh root@5.182.18.148 "cd /opt/homeledger && ROLLBACK=$(ls -d .next-rollback-* 2>/dev/null | tail -1) && if [ -n \"$ROLLBACK\" ]; then rm -rf .next && mv $ROLLBACK .next && pm2 reload homeledger; echo 'Rolled back!'; else echo 'No rollback available'; fi"
```

## Notes
- The old app process keeps serving requests during the entire build
- PM2 `reload` starts the new process first, then gracefully kills the old one
- `kill_timeout: 5000` gives in-flight requests 5s to complete
- `listen_timeout: 10000` waits up to 10s for new process to be ready
