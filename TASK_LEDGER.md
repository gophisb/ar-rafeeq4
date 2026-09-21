# Task Ledger

RAECS uses explicit task IDs to keep agent work bounded and auditable.

| Task ID | Description | Status | Owner | Evidence |
|---|---|---|---|---|
| RAECS-300 | Establish v3.0 governance baseline | DONE | human/agent | repository baseline |
| RAECS-301 | Harden verification scripts | DONE | agent | `scripts/` |
| RAECS-302 | Run release verification | PENDING | release operator | `EVALS/` |

## Rules
- Every material task gets a unique ID.
- Do not silently change task scope.
- A failed task is not marked DONE; use an AAR where appropriate.
- Closed tasks must point to evidence.
