# ADR-0001 — Offline Mosque Map Architecture

## Status
PROPOSED

## Decision
Add an optional offline mosque-map module on a dedicated feature branch without changing `main`.

The module will use:
- OpenStreetMap data as the geographic source.
- Mapsforge for local vector-map rendering and local POI support.
- BRouter as the offline routing engine where its Android integration can be embedded cleanly.
- A native Capacitor bridge for GPS, map storage, routing, and WebView communication.

The user downloads a selected geographic region once while online. After the download is complete, map display, GPS position, mosque search, nearest-mosque selection, and routing must work without network access.

## Product behavior
1. User opens "أقرب مسجد".
2. If no offline region exists, the app asks for a one-time map download.
3. After download, the app can operate offline.
4. It shows the user's GPS position and nearby mosques.
5. It can distinguish walking and driving routing.
6. A mosque result may show name, distance, estimated travel time, direction, and available OSM metadata.
7. The app must never invent a mosque name or metadata; unavailable fields are shown as unavailable.
8. Map data may be updated later when the user chooses to connect.

## Constraints
- Do not modify prayer calculation, Quran, adhan, service-worker, or existing working behavior in this phase.
- Do not put a complete world map in the APK.
- Do not require an online map tile service for normal offline operation.
- Do not claim offline routing is proven until it is tested on a real Android device with network disabled.
- Licensing and attribution for all map data and libraries must be verified before release/F-Droid submission.

## Verification gates
- Build gate passes.
- RAECS/invariant gates pass.
- Online first-install/download test passes.
- Network-disabled map rendering test passes.
- Network-disabled nearest-mosque search test passes.
- Network-disabled walking routing test passes.
- Network-disabled driving routing test passes.
- GPS movement/re-routing test passes.
- Low-storage/error recovery test passes.
- Real-device test on the project's supported Android baseline passes.

## Current blocker
The current `main` tree exposes the Web/PWA and Capacitor configuration, but the Android Gradle project/native source is not present in the repository tree inspected for this task. Therefore the first implementation step is to recover/attach the actual Android project used to build the current APK, rather than inventing a second Android architecture.

## Rationale
Organic Maps demonstrates that OSM-based offline maps and navigation can work fully offline, but directly embedding the Organic Maps application/data is not the chosen path because its map binary data has separate licensing/attribution conditions. Mapsforge is an embeddable open-source map library, and BRouter is an MIT-licensed offline routing engine. These components are therefore better candidates for a controlled F-Droid-oriented integration, subject to final dependency and data-license review.
