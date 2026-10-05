# Ar-Rafeeq 4 Task Ledger

RAECS uses explicit task IDs to keep agent work bounded and auditable.

| Task ID | Description | Status | Owner | Evidence |
|---|---|---|---|---|
| RAECS-300 | Existing RAECS v3.0 governance baseline | DONE | human/agent | repository baseline |
| GOV-V3-INTEGRATE-001 | Integrate RAFEEQ Engineering Constitution V3 | PROVEN | human/agent | Run #293 15/15 PASS; independent scope review; final checkpoint |

## GOV-V3-INTEGRATE-001 Contract

- **Objective:** Install the proven V3 governance architecture into Ar-Rafeeq 4 without changing application behavior.
- **Context:** The target repository already contains RAECS v3.0 governance and app-specific operating rules.
- **Dependencies:** Existing scripts, governance files, and GitHub Actions must remain compatible.
- **Allowed files:** Governance documents, governance validators/gates, requirements, ADRs, project state, task ledger, and governance evidence.
- **Forbidden:** Quran/audio/map/prayer/adhan/UI/application feature changes unrelated to governance.
- **Acceptance:**
  1. Constitution V3 exists with normative operating rules.
  2. Machine policy is V3.1 with bounded autonomy, evidence, scope, retry, and self-protection.
  3. Persistent state and task contract exist.
  4. Deterministic constitutional and policy validators pass.
  5. Release gate can evaluate the target repository without foreign evidence.
  6. Independent review confirms scope preservation.
- **Verification:** `bash scripts/release-gate.sh`; `git diff --check`; applicable CI.
- **Risk:** HIGH.
- **Rollback:** abandon this branch or revert only the governance commits.
- **Status semantics:** PLANNED → IMPLEMENTED → TESTED → PROVEN only with evidence. BLOCKED stops progression.

## Rules
- Every material task gets a unique ID.
- Do not silently change task scope.
- A failed task is not marked DONE.
- Closed tasks must point to evidence.
