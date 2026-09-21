#!/usr/bin/env bash
# RAECS deep secret audit using gitleaks/trufflehog when installed.
set -euo pipefail
ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
findings=0
if command -v gitleaks >/dev/null 2>&1; then
  if gitleaks detect --no-banner --redact --source .; then
    echo '  ✓ gitleaks passed'
  else
    echo '  ✗ gitleaks detected a secret'; findings=$((findings+1))
  fi
else
  echo '  – gitleaks unavailable; install it in CI for deep secret scanning'
fi
if command -v trufflehog >/dev/null 2>&1; then
  if trufflehog filesystem --directory . --no-update --fail; then
    echo '  ✓ trufflehog passed'
  else
    echo '  ✗ trufflehog detected a secret'; findings=$((findings+1))
  fi
else
  echo '  – trufflehog unavailable; install it in CI for deep secret scanning'
fi
if ((findings)); then exit 1; fi
echo '  ✓ deep secret audit passed'
