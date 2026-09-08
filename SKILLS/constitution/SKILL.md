# Constitution Skill — RAECS v3.0

Use this skill when an agent is asked to change project governance, agent permissions, invariants, or policy.

## Procedure
1. Read `AGENTS.md`, `INVARIANTS.md`, and `RAECS_POLICY.yaml`.
2. Classify the requested change as implementation or governance.
3. If governance, stop and require an ADR plus human approval.
4. For implementation, keep the change task-bounded and reversible.
5. Run policy, health, and invariant gates.
6. Record material decisions and failures.

## Never
- weaken a failing invariant to obtain a pass;
- modify policy/agent rules autonomously;
- claim evidence that was not generated;
- expand permissions without explicit authorization.
