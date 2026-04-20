#!/usr/bin/env bash
set -euo pipefail

echo "=== sdk: local test runner ==="

npm install

echo ""
echo "--- lint ---"
npm run lint

echo ""
echo "--- tests ---"
npm test
