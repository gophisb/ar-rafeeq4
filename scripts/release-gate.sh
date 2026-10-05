#!/usr/bin/env bash
# RAECS 3.1.0 release gate — Constitution V3 final-baseline checks
set -euo pipefail
ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
echo "RAECS 3.1.0 RELEASE GATE"
echo "1/15 Constitution V3 validation"
bash scripts/validate-constitution.sh
echo "2/15 requirements traceability"
bash scripts/requirements-check.sh
echo "3/15 policy validation"
bash scripts/validate-policy.sh
echo "4/15 health"
bash scripts/health-check.sh
echo "5/15 intent validation"
bash scripts/intent-check.sh
echo "6/15 permissions validation"
bash scripts/permissions-check.sh
echo "7/15 sandbox preflight"
bash scripts/sandbox-preflight.sh
echo "8/15 artifact integrity"
bash scripts/artifact-integrity.sh
echo "9/15 deep secret audit"
bash scripts/secrets-audit.sh
echo "10/15 dependency audit"
bash scripts/dependency-audit.sh
echo "11/15 invariants"
bash scripts/verify-invariants.sh --report
echo "12/15 objective evidence"
bash scripts/objective-evidence.sh
echo "13/15 objective evidence verification"
bash scripts/verify-objective-evidence.sh
echo "14/15 status report"
bash scripts/status-report.sh
echo "15/15 governance consistency"
python3 - <<'PY'
from pathlib import Path
required = ["AGENTS.md","INVARIANTS.md","RAECS_POLICY.yaml","RAECS_INTENT.yaml","RAECS_ROLES.yaml","RAECS_EXECUTABLES_ALLOWLIST.txt","PROJECT_STATE.md","TASK_LEDGER.md","ARCHITECTURE.md","RUNBOOK.md","CHANGELOG.md"]
missing = [p for p in required if not Path(p).is_file()]
if missing:
    raise SystemExit(f"Missing release files: {missing}")
policy = Path("RAECS_POLICY.yaml").read_text()
for marker in ("version: \"3.1.0\"", "status: final", "stop_the_line: true"):
    if marker not in policy:
        raise SystemExit(f"Policy marker missing: {marker}")
print("  ✓ final governance markers present")
PY
echo "RAECS 3.1.0 RELEASE GATE: PASS"
