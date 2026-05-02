#!/bin/bash
# Lancement des tests E2E Playwright
# Usage : ./tests/scripts/run-tests.sh [client|partenaire|admin|all]

set -e
ROLE="${1:-all}"
cd "$(dirname "$0")/../.."

echo "🎭 Playwright E2E Tests — 97IMPORT"
echo "   Role : $ROLE"
echo "   URL  : ${TEST_BASE_URL:-https://97import-firebase-git-v2-parisb2bs-projects.vercel.app}"
echo ""

case "$ROLE" in
  client)
    npx playwright test tests/specs/parcours-client.spec.ts
    ;;
  partenaire)
    npx playwright test tests/specs/parcours-partenaire.spec.ts
    ;;
  admin)
    npx playwright test tests/specs/parcours-admin.spec.ts
    ;;
  all)
    npx playwright test
    ;;
  *)
    echo "Usage: $0 [client|partenaire|admin|all]"
    exit 1
    ;;
esac

echo ""
echo "✅ Tests termines"
