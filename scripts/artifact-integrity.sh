#!/usr/bin/env bash
# RAECS artifact-integrity self-test.
set -euo pipefail
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
printf 'RAECS artifact integrity test\n' > "$tmp/sample.txt"
bash scripts/artifact-sign.sh create "$tmp/sample.txt" >/dev/null
bash scripts/artifact-sign.sh verify "$tmp/sample.txt" >/dev/null
printf '  ✓ SHA-256 artifact create/verify passed\n'
