# ADR-2026-11-23-RAFEQ-SHARE-01 — Native Android sharing

- Status: Accepted
- Date: 2026-11-23
- Authority: Explicit human approval in the project conversation
- Task: RAFEQ-SHARE-01

## Context
Ar-Rafeeq 4 needs a small, user-initiated way to share the application with others. The Android source is a native WebView application using `WebViewAssetLoader` and the existing `HoudAndroid` JavaScript bridge. It does not use a Capacitor runtime for this path.

## Decision
1. Permit the `android/` directory in `RAECS_INTENT.yaml` for this bounded task.
2. Implement sharing through Android's built-in `Intent.ACTION_SEND` and `Intent.createChooser`; do not add a dependency or introduce Capacitor runtime.
3. Add the Arabic call to action: **«ازرع خيراً واترك أثراً»**, with the button label **«مشاركة الرفيق»** and supporting text **«شارك الرفيق مع من تحب، فربّ مشاركة تكون بداية خيرٍ لا ينقطع.»**
4. Keep the change limited to the home-page share affordance, the native bridge method required to invoke the Android share sheet, and the service-worker cache revision if required.
5. Use the verified canonical application URL from repository metadata. If native sharing is unavailable, provide a safe copy-link fallback.
6. Do not alter prayer calculations, adhan scheduling, qibla, Quran, tafsir, adhkar, hadith, library, maps, protected religious data, permissions, or unrelated UI.

## Scope and controls
- Allowed task paths: `RAECS_INTENT.yaml`, `DECISIONS/`, `OPLOG/`, `CHANGELOG.md`, `TASK_LEDGER.md`, `PROJECT_STATE.md`, `pages/home.html`, `pages/home.js`, `styles.css` (only if necessary), `sw.js`, and the specific existing Android source file `android/app/src/main/java/com/gophisb/houd11/MainActivity.java`.
- No new dependencies, permissions, services, activities, or external sharing SDKs.
- No changes to protected governance files `AGENTS.md`, `INVARIANTS.md`, or `RAECS_POLICY.yaml`.
- This authorization is limited to task RAFEQ-SHARE-01; it is not a blanket authorization for future Android changes.

## Verification requirements
- Run applicable policy/intent/invariant checks and available static checks.
- Run Android compilation only if the repository/build environment makes it available.
- Do not claim real-device verification unless actually performed.
- Report changed paths, commit evidence, test results, and any remaining release/device-test requirements.

## Consequences
The approved scope expansion enables a native Android share sheet without architectural migration or new dependencies. A real-device test remains necessary to confirm chooser behavior on supported Android versions.
