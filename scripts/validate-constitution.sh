#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel)"
cd "$ROOT_DIR"

fail() { echo "FAIL: $1" >&2; exit 1; }
need_file() { [[ -f "$1" ]] || fail "missing required file: $1"; }

for f in RAFEEQ_CONSTITUTION.md RAECS_POLICY.yaml RAECS_INTENT.yaml AGENTS.md INVARIANTS.md PROJECT_STATE.md TASK_LEDGER.md; do
  need_file "$f"
done

grep -q '^# RAFEEQ ENGINEERING CONSTITUTION V3$' RAFEEQ_CONSTITUTION.md || fail "constitution header missing"
grep -q 'No evidence means no completion claim' RAFEEQ_CONSTITUTION.md || fail "evidence rule missing"
grep -q 'INSPECT → UNDERSTAND → MAP → PLAN → CHANGE' RAFEEQ_CONSTITUTION.md || fail "inspect-before-modify rule missing"
grep -q 'CIRCUIT BREAKER' RAFEEQ_CONSTITUTION.md || fail "circuit breaker rule missing"
grep -q 'The agent must not autonomously alter' RAFEEQ_CONSTITUTION.md || fail "self-protection rule missing"

grep -q '^version: "3.1.0"$' RAECS_POLICY.yaml || fail "policy version is not 3.1.0"
grep -q 'self_modify_constitution: false' RAECS_POLICY.yaml || fail "constitution self-modification protection missing"
grep -q 'require_evidence_for_completion: true' RAECS_POLICY.yaml || fail "evidence gate missing"
grep -q 'allow_unplanned_changes: false' RAECS_POLICY.yaml || fail "scope gate missing"
grep -q 'max_retries: 3' RAECS_POLICY.yaml || fail "retry bound missing"

grep -q 'governance changes' RAECS_INTENT.yaml || fail "intent governance boundary missing"
grep -q 'INV-G004' INVARIANTS.md || fail "constitution invariant missing"
grep -q 'INV-G005' INVARIANTS.md || fail "evidence invariant missing"

grep -q '^## GOV-V3-INTEGRATE-001' TASK_LEDGER.md || fail "V3 task contract missing"
grep -A1 '^## Current task

git diff --check
echo "RAFEEQ CONSTITUTION V3 VALIDATION: PASS"
 PROJECT_STATE.md | grep -q '^GOV-V3-INTEGRATE-001

git diff --check
echo "RAFEEQ CONSTITUTION V3 VALIDATION: PASS"
 || fail "project state task mismatch"

git diff --check
echo "RAFEEQ CONSTITUTION V3 VALIDATION: PASS"
