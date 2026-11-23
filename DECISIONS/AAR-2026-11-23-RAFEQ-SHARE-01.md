# AAR-2026-11-23-RAFEQ-SHARE-01 — RAECS static-analysis gate failure

- Status: OPEN
- Date: 2026-11-23
- Task: RAFEQ-SHARE-01
- Severity: DEFCON-3 (checkpoint/release blocked pending investigation)

## Summary
The Android debug APK build for the approved share feature completed successfully and the workflow's APK signature verification step passed. The separate RAECS release gate failed at the triple-consensus/static-analysis stage because Semgrep reported security findings under `p/security-audit`.

## Evidence
- Android workflow run: https://github.com/gophisb/ar-rafeeq4/actions/runs/45200756022
- RAECS workflow run: https://github.com/gophisb/ar-rafeeq4/actions/runs/45200756063
- The RAECS job passed policy validation, health, intent structure, permissions, artifact-integrity, deep-secret-audit (with gitleaks/trufflehog unavailable), and the separate security scan.
- The failure was: `STATIC [SEMGREP] semgrep reported security findings`.
- The configured command uses `--quiet`, so the workflow log does not expose the finding IDs, file paths, or severities.

## Impact
- The APK artifact was built and signature-verified.
- RAECS release-gate status remains FAILED; do not treat the repository checkpoint or release as fully approved.
- No evidence currently establishes whether the Semgrep finding(s) are pre-existing or introduced by this task.

## Root cause
Not yet established. The scanner output is suppressed by the current quiet invocation, preventing attribution from the workflow log alone.

## Required follow-up
1. Re-run the exact Semgrep configuration without quiet output against the same commit.
2. Record each finding's rule ID, path, line, and severity.
3. Compare findings against the pre-task baseline commit `0bad8f20efcbc4ba02af27977a004f2839ce183f`.
4. Fix genuine findings in task scope where applicable; otherwise route unrelated findings through normal human review.
5. Do not suppress rules, add broad exclusions, or weaken the gate merely to obtain a passing result.
6. Re-run the complete RAECS gate and retain the evidence.

## Containment
No security gate was bypassed. No protected governance file was modified. No changes were made to prayer, adhan, qibla, Quran, tafsir, adhkar, hadith, library, or mosque-map logic/data as part of the share feature.
