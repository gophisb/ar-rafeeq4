# ADR: Native Android share action for Ar-Rafeeq 4

- Status: ACCEPTED
- Date: 2026-11-23
- Decision ID: ADR-20261123-001
- Owner: Human project owner

## Context
The home screen needs a simple, user-initiated way to share the official Ar-Rafeeq application link and the message “ازرع خيراً واترك أثراً”. The Android source uses a native WebViewAssetLoader and the HoudAndroid JavaScript bridge; adding a Capacitor Share dependency would expand the architecture unnecessarily.

## Constraints
- Scope: This task only; permit the `android/` tree for the narrowly scoped native share integration.
- Security: No new permissions, network calls, analytics, or secret handling.
- Compatibility: Preserve the existing WebView bridge and current Android behavior.
- Reversibility: Add one bridge method and a small home-screen share control with a clipboard fallback.
- Protected behavior: Do not modify prayer, adhan, qibla, Quran, tafsir, adhkar, hadith, library, or mosque-map logic/data.

## Options considered
1. Add a Capacitor Share dependency and runtime integration.
2. Use Android's built-in `Intent.ACTION_SEND` through the existing bridge.
3. Provide web-only clipboard sharing.

## Decision
Choose option 2 for Android, using `Intent.ACTION_SEND` and `Intent.createChooser`, dispatched on the Android UI thread. Keep a web clipboard fallback when the native bridge is unavailable. Do not add dependencies or manifest permissions. The share payload includes the verified public application URL and the approved Arabic message.

## Consequences
### Positive
- Uses Android's native share sheet and installed sharing applications.
- Avoids new runtime dependencies and permissions.
- Keeps the change localized and reversible.

### Negative / risks
- Android share-sheet behavior still requires a real-device test.
- Clipboard fallback depends on browser/WebView clipboard support and may require a secure context.

## Verification
- Run repository governance validators and available static checks.
- Compile the Android project if a suitable Gradle environment is available.
- Confirm the share chooser and fallback on a real Android device before claiming device verification.
- Review the diff to ensure only the approved files changed.

## Approval
- Human approver: Project owner
- Date: 2026-11-23
- Approval scope: Add `android/` to this task's allowed paths and implement the native share action described above.
