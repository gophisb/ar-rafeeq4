# Release Verification Record

- Release: RAECS v3.0.0
- Baseline: final governance
- Verification date: 2026-09-07

## Checks performed

- `bash -n scripts/*.sh` — PASS
- `bash scripts/validate-policy.sh` — PASS
- `bash scripts/security-scan.sh --report` — PASS
- `bash scripts/secrets-audit.sh` — PASS (external scanners optional until installed)
- `bash scripts/intent-check.sh` — PASS
- `bash scripts/permissions-check.sh` — PASS
- `bash scripts/sandbox-preflight.sh` — PASS
- `bash scripts/artifact-integrity.sh` — PASS
- `bash scripts/status-report.sh` — PASS
- `bash scripts/dependency-audit.sh` — PASS (no application manifest in baseline)
- `bash scripts/consensus-gate.sh` — PASS
- `bash scripts/evidence-chain.sh verify` — PASS (chain not initialized in baseline)
- `bash scripts/health-check.sh` — PASS
- `bash scripts/release-gate.sh` — PASS

## Scope of this evidence

This verifies the governance package itself. No application build or application test suite is claimed because this baseline contains no application source or `package.json`.

## Result

**RAECS v3.0 governance baseline: PASS**
