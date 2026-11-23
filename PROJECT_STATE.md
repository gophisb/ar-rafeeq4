# Ar-Rafeeq 4 Project State

status: PROVEN
version: 3.1.0
baseline: Ar-Rafeeq 4 main
last_verified: 2026-10-05T09:56:53Z

## Current objective
Integrate the proven RAFEEQ Engineering Constitution V3 governance layer without breaking existing Ar-Rafeeq 4 functionality.

## Current task
GOV-V3-INTEGRATE-001

## Current branch
main

## Last verified commit
27402fd3b7b6dec44809dd77bdea2fa22e3da3ee

## Build status
UNKNOWN — no application build claim is made by this governance integration task.

## Test status
PASS — GitHub Actions Run #293 passed all 15 release-gate checks after the review/checkpoint updates.

## Active scoped task — RAFEEQ-SHARE-001

- Status: IMPLEMENTED; CI build and RAECS verification passed. Real-device share-sheet test remains pending.
- Branch: `feature/rafeeq-native-share-card` (based on the APK-matching Android integration source branch).
- Scope: home-page share card, one Capacitor share plugin, installer registration, and offline cache entry.
- Preserved: package ID `com.gophisb.arrafeeq4`, adhan, torch, haptics, prayer engine, qibla, Quran data/audio, and all existing dependencies.
- Build: Android debug APK build #16 succeeded; APK v2 signature verification passed. SHA-256: `238b2c69b68c2068c89111246ff0708c8b810ba3a4730dcfd753ad0a58af7eb4`.
- Signing limitation: the CI debug certificate differs from the supplied `base.apk` certificate. Do not install as an update over the existing app; a matching original signing key is required.
- Runtime status: share chooser not yet tested on a physical Android device.

## System posture
- Existing Ar-Rafeeq 4 application behavior is protected.
- Governance V3 is being introduced on an isolated branch.
- No application feature is intentionally changed by this task.
- Existing RAECS v3.0 governance is retained and upgraded to V3.1 controls.

## Known risks
- Governance validators must be reconciled with this application's existing scripts and requirements.
- Application runtime behavior remains separately unproven until applicable tests are run.
- Evidence from another repository is not valid evidence for this repository.

## Active decisions
- Preserve working application code.
- Integrate governance first, then validate the target repository.
- Do not copy foreign objective evidence as proof for this repository.

## Blocked tasks
- None for automated verification. Merge/release remains a human-owned approval decision.

## Next recommended task
Final checkpoint: governance integration merged as PR #7 at 27402fd3b7b6dec44809dd77bdea2fa22e3da3ee after Run #296 (15/15 PASS) and independent scope review. Application runtime remains separately governed by applicable tests.

## Last checkpoint
Branch created from Ar-Rafeeq 4 main at 394927d916a05ebf6dbb3fa71e23156f21083201.
