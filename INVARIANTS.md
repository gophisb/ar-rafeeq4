# RAECS v3.0 Invariants

These are system properties, not suggestions. A failed mandatory invariant blocks checkpoint/commit.

| ID | Invariant | Gate | Severity |
|---|---|---|---|
| INV-U001 | If a build script exists, the build must pass. | verify-invariants | DEFCON-2 |
| INV-U004 | Repository changes must not contain obvious credential assignments; `.env` must be ignored. | verify-invariants | DEFCON-1 |
| INV-U006 | Node projects must contain a dependency lockfile. | verify-invariants | DEFCON-3 |
| INV-U007 | If a meaningful test script exists, tests must pass. | verify-invariants | DEFCON-3 |
| INV-U010 | `OPLOG/` must exist for operational traceability. | verify-invariants | DEFCON-3 |
| INV-G001 | `RAECS_POLICY.yaml` must validate when present. | verify-invariants | DEFCON-2 |
| INV-G002 | Required governance files must exist in a release baseline. | release gate | DEFCON-2 |
| INV-G003 | Governance files are human-controlled and protected from autonomous modification. | policy/review | DEFCON-1 |
| INV-S001 | Repository changes must not introduce unapproved hidden files, executables, hooks, persistence artifacts, or high-risk execution patterns. | security-scan | DEFCON-1 |
| INV-S002 | Release evidence must have a valid local tamper-evident chain when initialized. | evidence-chain | DEFCON-2 |
| INV-S003 | Declared task intent must include purpose, scope, forbidden actions, and approval boundaries. | intent-check | DEFCON-2 |

## Violation protocol
1. Stop the affected operation.
2. Do not bypass or downgrade the failing check.
3. Capture evidence in `OPLOG/violations.log` when possible.
4. Determine root cause.
5. Fix the underlying condition or obtain explicit human approval for a documented policy change.
6. Re-run the complete verification gate.
7. For material failures, create `DECISIONS/AAR-*.md`.

## Scope note
RAECS v3.0 governance checks are intentionally conservative. A skipped check means the repository does not contain the artifact needed for that check; it is not equivalent to a passed check. Release validation additionally requires all governance files.
