# RAECS v3.0 Runbook

## First run
```bash
cd RAECS-v3.0
bash scripts/validate-policy.sh
bash scripts/health-check.sh
bash scripts/verify-invariants.sh --report
```

## Before a commit
```bash
bash scripts/verify-invariants.sh --report
bash scripts/health-check.sh
```

## After a completed task
```bash
bash scripts/checkpoint.sh "TASK-ID" "Short description"
```

## After failure
```bash
bash scripts/aar.sh "TASK-ID" "HIGH"
```

Then document the root cause, resolution, prevention, and action items.

## Governance change
1. Stop normal execution.
2. Create an ADR.
3. Obtain human approval.
4. Update version.
5. Run release verification.
6. Record the change in CHANGELOG.

## Recovery
Never bypass a failing invariant to obtain a green build. Restore the last known-good state, investigate, then re-run the complete gate.
