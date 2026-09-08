#!/usr/bin/env bash
# RAECS After Action Review generator
set -euo pipefail
ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"; cd "$ROOT_DIR"
TASK="${1:-TASK-XXX}"; SEVERITY="${2:-HIGH}"; DATE=$(date -u '+%Y-%m-%d'); FILENAME="DECISIONS/AAR-${DATE}-${TASK}.md"
mkdir -p DECISIONS
if [[ -e "$FILENAME" ]]; then echo "Refusing to overwrite existing AAR: $FILENAME" >&2; exit 1; fi
cat > "$FILENAME" <<EOF2
# AAR: After Action Review

- Task ID: $TASK
- Date: $DATE
- Severity: $SEVERITY
- Outcome: FAILED

## Mission summary

## Timeline
- HH:MM — action → result

## Root cause

## Impact
- DEFCON raised to:
- Time lost:
- Systems affected:

## Resolution

## Prevention

## Action items
- [ ] <TASK-ID> — <action> — <owner>

## Lessons learned
EOF2
echo "AAR created: $FILENAME"
