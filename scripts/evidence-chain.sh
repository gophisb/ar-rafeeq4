#!/usr/bin/env bash
# RAECS local tamper-evident evidence chain. External notarization remains optional.
set -euo pipefail
ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
CHAIN="EVALS/EVIDENCE_CHAIN.sha256"
mkdir -p EVALS
cmd="${1:-verify}"
case "$cmd" in
  record)
    latest=$(find OPLOG EVALS -maxdepth 1 -type f \( -name '*.log' -o -name '*.md' \) -not -name 'EVIDENCE_CHAIN.sha256' -print0 | sort -z | xargs -0r sha256sum)
    previous=$(sha256sum "$CHAIN" 2>/dev/null || printf 'GENESIS  EVIDENCE_CHAIN.sha256\n')
    printf '%s\n' "$previous" "$latest" | sha256sum >> "$CHAIN"
    printf '  ✓ evidence chain extended: %s\n' "$CHAIN"
    ;;
  verify)
    if [[ ! -f "$CHAIN" ]]; then
      printf '  – evidence chain not initialized\n'
      exit 0
    fi
    awk 'NF != 1 { exit 1 }' "$CHAIN" || { echo '  ✗ malformed evidence chain'; exit 1; }
    grep -Eq '^[0-9a-f]{64}$' "$CHAIN" || { echo '  ✗ invalid evidence chain hash'; exit 1; }
    printf '  ✓ evidence chain format valid (%s entries)\n' "$(wc -l < "$CHAIN")"
    ;;
  *) echo 'Usage: evidence-chain.sh [record|verify]' >&2; exit 2 ;;
esac
