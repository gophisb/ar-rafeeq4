#!/usr/bin/env bash
# RAECS v3.0 release gate — all final-baseline checks
set -euo pipefail
ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
echo "RAECS v3.0 RELEASE GATE"
echo "1/14 policy validation"
bash scripts/validate-policy.sh
echo "2/14 health"
bash scripts/health-check.sh
echo "3/14 intent validation"
bash scripts/intent-check.sh
echo "4/14 permissions validation"
bash scripts/permissions-check.sh
echo "5/14 sandbox preflight"
bash scripts/sandbox-preflight.sh
echo "6/14 artifact integrity"
bash scripts/artifact-integrity.sh
echo "7/14 deep secret audit"
bash scripts/secrets-audit.sh
echo "8/14 dependency audit"
bash scripts/dependency-audit.sh
echo "9/14 triple consensus"
bash scripts/consensus-gate.sh
echo "10/14 invariants"
bash scripts/verify-invariants.sh --report
echo "11/14 evidence chain"
bash scripts/evidence-chain.sh verify
echo "12/14 status report"
bash scripts/status-report.sh
echo "13/14 Ar-Rafeeq application check"
bash scripts/verify-rafeeq.sh
echo "14/14 governance consistency"
python3 - <<'PY'
from pathlib import Path
required = ["AGENTS.md","INVARIANTS.md","RAECS_POLICY.yaml","RAECS_INTENT.yaml","RAECS_ROLES.yaml","RAECS_EXECUTABLES_ALLOWLIST.txt","PROJECT_STATE.md","TASK_LEDGER.md","ARCHITECTURE.md","RUNBOOK.md","CHANGELOG.md","scripts/verify-rafeeq.sh"]
missing = [p for p in required if not Path(p).is_file()]
if missing:
    raise SystemExit(f"Missing release files: {missing}")
policy = Path("RAECS_POLICY.yaml").read_text()
for marker in ("version: \"3.0.0\"", "status: final", "stop_the_line: true"):
    if marker not in policy:
        raise SystemExit(f"Policy marker missing: {marker}")
print("  ✓ final governance markers present")
PY
echo "RAECS v3.0 RELEASE GATE: PASS"
