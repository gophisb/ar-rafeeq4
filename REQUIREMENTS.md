# Ar-Rafeeq 4 — RAECS V3 Requirements Baseline

## Purpose

This document makes the Constitution V3 operating rules explicit and traceable for the Ar-Rafeeq 4 repository. It does not replace application requirements; it governs how engineering changes are executed, verified, reviewed, and released.

It does not replace the existing policy, invariants, or gates. It makes their intended behavior explicit and traceable.

## Requirement IDs

| ID | Requirement | Verification | Evidence | Gate |
|---|---|---|---|---|
| REQ-001 | RAECS governance boundaries shall be defined before governed execution. | Inspection | `RAECS_POLICY.yaml`, `RAECS_INTENT.yaml` | BLOCK |
| REQ-002 | Every governed task shall have an explicit scope and acceptance criteria before mutation. | Inspection | Task/intent record | BLOCK |
| REQ-003 | Mandatory invariants shall be checked before checkpoint/release acceptance. | Test | Gate output | BLOCK |
| REQ-004 | A PASS shall not be claimed for a verification activity that was not actually performed. | Inspection + test | Gate output/log | BLOCK |
| REQ-005 | Release acceptance shall require objective evidence produced by the verification activity, not a manually asserted status alone. | Test | Verification output | BLOCK |
| REQ-006 | A release baseline shall identify the exact repository state being accepted. | Inspection | Git commit/reference | BLOCK |
| REQ-007 | A change that fails a mandatory requirement shall stop the affected gate and remain unreleased until corrected or explicitly governed by an approved policy change. | Test | Failed gate output + decision record when material | BLOCK |
| REQ-008 | Requirement changes shall remain traceable to the governing policy/invariants and to their verification method. | Inspection | This file + referenced artifacts | BLOCK |

## Verification vocabulary

- **Verification**: evidence that the implemented system satisfies the stated requirement.
- **Validation**: evidence that the requirement itself serves the intended RAECS mission/purpose.
- **Objective evidence**: an artifact produced by an actual verification activity and tied to the evaluated repository state.
- **Baseline**: an explicitly identified repository state accepted as the reference for a governed decision.

## Traceability rule

A requirement is not considered complete merely because its text exists.

For a requirement to be **implemented**, RAECS must be able to identify:

1. the requirement;
2. the governing rule/invariant, where applicable;
3. the verification method;
4. the evidence produced;
5. the repository state to which that evidence applies;
6. the gate that consumes the result.

## Application boundary

This governance layer does not by itself prove application runtime behavior. Application claims such as offline operation, prayer timing, adhan behavior, Quran audio, maps, and lock-screen execution require their own applicable tests and real-device evidence.
