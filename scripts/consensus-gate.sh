#!/usr/bin/env bash
# RAECS triple-consensus gate: independent controls must agree before release.
set -euo pipefail
ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
fail=0
run(){ local name="$1" script="$2"; printf '  [%s]\n' "$name"; if ! bash "$script"; then fail=$((fail+1)); fi; }
run SECURITY scripts/security-scan.sh
run GIT_INTEGRITY scripts/git-integrity.sh
run STATIC_ANALYSIS scripts/static-analysis.sh
if ((fail)); then
  printf '  ✗ consensus failed: %d independent control(s) failed\n' "$fail"
  exit 1
fi
printf '  ✓ triple consensus passed\n'
