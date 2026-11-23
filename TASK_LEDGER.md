# Ar-Rafeeq 4 Task Ledger

RAECS uses explicit task IDs to keep agent work bounded and auditable.

| Task ID | Description | Status | Owner | Evidence |
|---|---|---|---|---|
| RAECS-300 | Existing RAECS v3.0 governance baseline | DONE | human/agent | repository baseline |
| GOV-V3-INTEGRATE-001 | Integrate RAFEEQ Engineering Constitution V3 | PROVEN | human/agent | Run #296 15/15 PASS; independent scope review; merged PR #7 |

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

| RAFEEQ-SHARE-001 | Add the home sharing card and native Android share chooser | IMPLEMENTED | agent | RAECS PASS #536; Android build #16 and APK v2 signature verification PASS; physical-device test and matching update signature pending |
| RAFEEQ-HOME-UI-001 | Apply the approved premium visual direction to the existing home page without changing behavior | IMPLEMENTED; visual/device verification pending | agent | PR #22; styles.css-only diff; home HTML/JS and SW unchanged |

## Rules
- Every material task gets a unique ID.
- Do not silently change task scope.
- A failed task is not marked DONE.
- Closed tasks must point to evidence.

## RAFEEQ-HOME-UI-001 Contract

- **Objective:** Restyle the existing Rafeeq 4 home page to follow the user-provided premium reference: dark emerald/navy surfaces, restrained gold outlines, Arabic welcome panel, Hijri date/location strip, and prominent next-prayer countdown card.
- **Allowed application change:** append a scoped `.page-home` visual layer to `styles.css` only.
- **Protected:** `pages/home.html`, `pages/home.js`, prayer calculations, countdown data flow, routing, sharing behavior, service worker, Android/native integration, Quran/tafsir/adhkar content, qibla, adhan, and app identity.
- **Verification required:** CSS selector-to-DOM audit; `git diff --check`; Android web asset preparation and APK build/signature verification; visual review on an Android device.
- **Current evidence:** CSS selector audit found 34 selectors and no missing home-page classes; HTML, JS, Service Worker, and Android workflow match the selected base branch. Governance gate passed. Android build and device visual review remain pending.
- **Rollback:** revert the single `styles.css` change from PR #22.
