#!/bin/bash
# ╔══════════════════════════════════════════════════════════════╗
# ║  LOCAL TEST RUNNER                                            ║
# ║  Run all test suites locally before pushing.                  ║
# ║  Usage: bash scripts/run-tests.sh                             ║
# ╚══════════════════════════════════════════════════════════════╝

set -e  # Exit on first failure

echo "══════════════════════════════════════════"
echo "  🔍 Step 1/5: Type Check"
echo "══════════════════════════════════════════"
npx tsc --noEmit --pretty
echo "✅ Type check passed"

echo ""
echo "══════════════════════════════════════════"
echo "  🧪 Step 2/5: Unit Tests"
echo "══════════════════════════════════════════"
npx vitest run __tests__/unit --reporter=verbose
echo "✅ Unit tests passed"

echo ""
echo "══════════════════════════════════════════"
echo "  🔗 Step 3/5: Integration Tests"
echo "══════════════════════════════════════════"
npx vitest run __tests__/integration --reporter=verbose
echo "✅ Integration tests passed"

echo ""
echo "══════════════════════════════════════════"
echo "  🏥 Step 4/5: Health / Smoke Tests"
echo "══════════════════════════════════════════"
npx vitest run __tests__/health --reporter=verbose
echo "✅ Health tests passed"

echo ""
echo "══════════════════════════════════════════"
echo "  🔒 Step 5/5: Security Tests"
echo "══════════════════════════════════════════"
npx vitest run __tests__/security --reporter=verbose
echo "✅ Security tests passed"

echo ""
echo "══════════════════════════════════════════"
echo "  ✅ ALL TESTS PASSED"
echo "══════════════════════════════════════════"
echo ""
echo "Ready to push! Run:"
echo "  git add -A && git commit -m 'your message' && git push"
