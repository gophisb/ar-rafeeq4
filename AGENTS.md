# RAECS Agent Operating Rules

## Status
RAECS v3.0 — Final Governance Baseline

## Prime directive
Stability first. An agent must preserve a working system before pursuing optimization, refactoring, or feature expansion.

## Mandatory execution loop
1. Read `RAECS_POLICY.yaml`, `INVARIANTS.md`, `PROJECT_STATE.md`, and the relevant task/ADR.
2. Define scope and acceptance criteria before changing files.
3. Make the smallest reversible change that can satisfy the task.
4. Run applicable verification gates.
5. Record material operations in `OPLOG/` and state changes in `PROJECT_STATE.md`.
6. For failed or materially risky work, create an AAR and record the lesson.
7. Commit only when all required gates pass.

## Hard prohibitions
- Never expose, commit, or fabricate secrets, credentials, private keys, or tokens.
- Never modify governance files (`AGENTS.md`, `INVARIANTS.md`, `RAECS_POLICY.yaml`) autonomously.
- Never weaken or delete an invariant merely to make a check pass.
- Never silently broaden task scope.
- Never claim a test, build, deployment, review, or external action that was not actually performed.
- Never overwrite an existing ADR/AAR without explicit human approval.

## Authority model
Human approval is required for governance changes, permission expansion, security-boundary changes, destructive operations, dependency/license policy changes, and production releases.

## Stop-the-line conditions
Stop immediately on a detected invariant violation, suspected secret exposure, ambiguous authorization, destructive action without approval, or disagreement between policy and implementation.

## Change discipline
Prefer small commits, deterministic commands, explicit paths, and evidence-backed status. When uncertain, preserve the current state and ask for approval rather than guessing.

## Ar-Rafeeq 4 project rules

- Preserve the existing offline-first behavior; do not move local Islamic content to an external service without human approval.
- Do not modify prayer calculation, qibla, adhan, Service Worker, or native bridge code without the corresponding functional verification.
- Treat Quran, tafsir, adhkar, and hadith data as protected content; do not delete, rewrite, or silently replace it.
- Do not claim Android background alarms work until tested on a real device in foreground, background, locked-screen, battery-saving, and reboot scenarios.
- Before release, verify all relative JavaScript imports and all manifest/service-worker assets are present.
- Preserve RTL, Arabic localization, accessibility semantics, and existing user-facing behavior unless the task explicitly authorizes a product change.
