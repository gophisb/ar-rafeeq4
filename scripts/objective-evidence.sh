#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(git rev-parse --show-toplevel)"
cd "$ROOT_DIR"
mkdir -p EVALS
BASELINE="$(git rev-parse HEAD)"
TIMESTAMP="$(date -u "+%Y-%m-%dT%H:%M:%SZ")"
EVIDENCE="EVALS/OBJECTIVE_EVIDENCE.txt"
RUNLOG="EVALS/VERIFICATION_LOG.txt"

: > "$RUNLOG"
run_check() {
  local id="$1" cmd="$2"
  printf "### %s\\n$ %s\\n" "$id" "$cmd" >> "$RUNLOG"
  if bash -c "$cmd" >>"$RUNLOG" 2>&1; then
    printf "RESULT %s PASS\\n" "$id" >> "$RUNLOG"
  else
    local rc=$?
    printf "RESULT %s FAIL exit=%s\\n" "$id" "$rc" >> "$RUNLOG"
    return "$rc"
  fi
}

status=0
run_check "REQ-003" "bash scripts/verify-invariants.sh --quiet" || status=1
run_check "REQ-004" "bash scripts/requirements-check.sh" || status=1

LOG_SHA="$(sha256sum "$RUNLOG" | cut -d " " -f1)"
{
  printf "RAECS OBJECTIVE EVIDENCE\\n"
  printf "generated_at=%s\\n" "$TIMESTAMP"
  printf "baseline_commit=%s\\n" "$BASELINE"
  printf "verification_log_sha256=%s\\n" "$LOG_SHA"
  printf "checks=REQ-003,REQ-004\\n"
  if [[ "$status" -eq 0 ]]; then
    result="PASS"
  else
    result="FAIL"
  fi
  printf "result=%s\\n" "$result"
} > "$EVIDENCE"

cat "$RUNLOG"
cat "$EVIDENCE"
if [[ "$status" -ne 0 ]]; then
  echo "RAECS OBJECTIVE EVIDENCE: FAIL"
  exit 1
fi
echo "RAECS OBJECTIVE EVIDENCE: PASS"
