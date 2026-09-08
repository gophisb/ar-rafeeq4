#!/usr/bin/env bash
# RAECS Checkpoint — verify, log, update state, commit
set -euo pipefail
ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"; cd "$ROOT_DIR"
[[ $# -ge 2 ]] || { echo 'Usage: checkpoint.sh "TASK-ID" "Description" [--defcon N]' >&2; exit 2; }
TASK_ID="$1"; DESCRIPTION="$2"; shift 2
DEFCON=5
while [[ $# -gt 0 ]]; do
  case "$1" in
    --defcon) [[ "${2:-}" =~ ^[1-5]$ ]] || { echo "Invalid DEFCON: ${2:-}" >&2; exit 2; }; DEFCON="$2"; shift 2;;
    *) echo "Unknown option: $1" >&2; exit 2;;
  esac
done
TIMESTAMP=$(date -u '+%Y-%m-%dT%H:%M:%SZ'); AGENT="${AGENT_NAME:-agent}"

echo "RAECS CHECKPOINT: $TASK_ID"
echo "1/6 security"; bash scripts/security-scan.sh --quiet
echo "2/6 consensus"; bash scripts/consensus-gate.sh
echo "3/6 invariants"; bash scripts/verify-invariants.sh --quiet
echo "4/6 health"; bash scripts/health-check.sh --quiet
BRANCH=$(git branch --show-current 2>/dev/null || echo unknown)
BEFORE=$(git rev-parse --short HEAD 2>/dev/null || echo unknown)
mkdir -p OPLOG
printf '[%s] [DEFCON-%s] [%s] [%s] [%s] %s — PASS\n' "$TIMESTAMP" "$DEFCON" "$AGENT" "$BEFORE" "$TASK_ID" "$DESCRIPTION" >> "OPLOG/$(date -u '+%Y-%m').log"
bash scripts/evidence-chain.sh record
if [[ -f PROJECT_STATE.md ]]; then
  printf '%s\n' "- [$TIMESTAMP] [$AGENT] [$BEFORE] [$TASK_ID] $DESCRIPTION — DEFCON-$DEFCON" >> PROJECT_STATE.md
else
  printf '# RAECS Project State\n\n- [%s] [%s] [%s] [%s] %s — DEFCON-%s\n' "$TIMESTAMP" "$AGENT" "$BEFORE" "$TASK_ID" "$DESCRIPTION" "$DEFCON" > PROJECT_STATE.md
fi
if [[ ! -f CHANGELOG.md ]]; then printf '# CHANGELOG\n\n' > CHANGELOG.md; fi
TMP=$(mktemp); { head -n 2 CHANGELOG.md; printf '%s\n' "- [$TIMESTAMP] [$TASK_ID] $DESCRIPTION"; tail -n +3 CHANGELOG.md; } > "$TMP"; mv "$TMP" CHANGELOG.md

echo "5/6 commit"
git add -A
if git diff --cached --quiet; then
  AFTER=$(git rev-parse --short HEAD 2>/dev/null || echo unknown)
  echo "  Nothing new to commit; current commit: $AFTER"
else
  git commit -m "checkpoint($TASK_ID): $DESCRIPTION" -m "RAECS Checkpoint Agent: $AGENT" -m "Timestamp: $TIMESTAMP" -m "Health: PASS" -m "Invariants: PASS" -m "DEFCON: $DEFCON"
  AFTER=$(git rev-parse --short HEAD)
fi
echo "6/6 result"
echo "CHECKPOINT PASS | task=$TASK_ID | commit=$AFTER | branch=$BRANCH"
