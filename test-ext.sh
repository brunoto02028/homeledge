#!/bin/bash
echo "=== Test via HTTPS (like browser) ==="
curl -s -X POST https://homeledger.co.uk/api/auth/send-login-code \
  -H 'Content-Type: application/json' \
  -H 'Origin: https://homeledger.co.uk' \
  -H 'Referer: https://homeledger.co.uk/login' \
  -d '{"email":"brunotoaz@gmail.com","password":"2026bruno@"}' \
  -w "\nHTTP_STATUS: %{http_code}\n"

echo ""
echo "=== Test via localhost ==="
curl -s -X POST http://localhost:3100/api/auth/send-login-code \
  -H 'Content-Type: application/json' \
  -d '{"email":"brunotoaz@gmail.com","password":"2026bruno@"}' \
  -w "\nHTTP_STATUS: %{http_code}\n"

echo ""
echo "=== Logs ==="
sleep 2
pm2 logs homeledger --lines 5 --nostream
