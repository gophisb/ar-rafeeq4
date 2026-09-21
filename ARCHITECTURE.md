# RAECS v3.0 Architecture

RAECS is a governance layer around engineering agents. It does not replace the application; it constrains how changes are proposed, executed, verified, recorded, and released.

```text
Human Authority
      │
      ▼
RAECS_POLICY.yaml ──► AGENTS.md
      │                   │
      ▼                   ▼
INVARIANTS.md ─────► Agent Task Scope
      │                   │
      └───────┬───────────┘
              ▼
        Engineering Work
              │
      ┌───────┴────────┐
      ▼                ▼
Health / Tests    Invariant Gate
      │                │
      └───────┬────────┘
              ▼
      OPLOG + PROJECT_STATE
              │
       ┌──────┴──────┐
       ▼             ▼
      ADR           AAR
       │             │
       └──────┬──────┘
              ▼
        Checkpoint / Release
```

## Separation of concerns
- Policy defines machine-readable boundaries.
- Agent rules define operating behavior.
- Invariants define non-negotiable properties.
- Scripts enforce repeatable gates.
- OPLOG records operations.
- ADR records significant decisions.
- AAR records failed or materially degraded work.
- Project state and changelog provide human-readable continuity.

## Design principles
1. Stability first.
2. Least privilege.
3. Small reversible changes.
4. Evidence over claims.
5. Human control over governance.
6. Offline/local artifacts remain deterministic where possible.
7. Stop-the-line on critical violations.
