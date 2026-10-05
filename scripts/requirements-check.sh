#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
REQ="REQUIREMENTS.md"
[[ -f "$REQ" ]] || { echo "✗ REQUIREMENTS.md missing"; exit 1; }
required_ids=(REQ-001 REQ-002 REQ-003 REQ-004 REQ-005 REQ-006 REQ-007 REQ-008)
for id in "${required_ids[@]}"; do
  grep -q "$id" "$REQ" || { echo "✗ Missing requirement: $id"; exit 1; }
done
grep -q '## Verification vocabulary' "$REQ" || { echo "✗ Verification vocabulary missing"; exit 1; }
grep -q '## Traceability rule' "$REQ" || { echo "✗ Traceability rule missing"; exit 1; }
awk -F'|' '
  /^\| REQ-[0-9][0-9][0-9] / {
    if ($4 ~ /^[[:space:]]*$/ || $5 ~ /^[[:space:]]*$/ || $6 !~ /BLOCK/) {
      print "✗ Incomplete traceability row: " $0
      bad=1
    }
  }
  END { exit bad }
' "$REQ"
for file in RAECS_POLICY.yaml RAECS_INTENT.yaml INVARIANTS.md scripts/release-gate.sh; do
  [[ -f "$file" ]] || { echo "✗ Traceability target missing: $file"; exit 1; }
done
printf '%s\n' "RAECS REQUIREMENTS TRACEABILITY: PASS" "requirements: ${#required_ids[@]}" "verification: declared" "evidence: declared" "gate: BLOCK" "repository: $(git rev-parse --short HEAD)"
