#!/bin/bash
curl -s -X POST http://localhost:3100/api/auth/send-login-code \
  -H 'Content-Type: application/json' \
  -d '{"email":"brunotoaz@gmail.com","password":"test123"}' 2>&1
echo ""
echo "--- LOGS ---"
pm2 logs homeledger --lines 10 --nostream 2>&1
