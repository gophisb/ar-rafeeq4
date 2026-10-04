# ADR-0002: Offline mosque data layer for Algeria

- Status: PROPOSED
- Date: 2026-10-04
- Base branch: `houd11-android-offline`
- Scope: mosque dataset and offline lookup foundation only

## Decision

Build the mosque locator as a local, versioned data layer first. The initial national source is the GeoAlgeria `@geoalgeria/mosquees` composite of Wikidata and OpenStreetMap.

The current published dataset reports 20,759 geocoded mosques across all 69 wilayas, with Arabic/French names where available, commune/wilaya linkage, WGS84 coordinates, provenance and coordinate-precision fields.

The dataset is community-maintained and is not treated as an official Ministry registry. The application must therefore expose provenance/version metadata internally and must never claim that the list is an authoritative complete government registry.

## Required local record

Each stored mosque record must preserve, at minimum:

- stable id
- Arabic name when available
- French name when available
- wilaya code
- commune code/name
- latitude/longitude
- coordinate precision
- source/provenance
- upstream OSM/Wikidata references when present

## Offline requirements

After the user downloads the Algeria mosque data package:

1. nearest-mosque search must work with network disabled;
2. name and wilaya/commune filtering must work with network disabled;
3. GPS coordinates must be sufficient to rank nearby mosques;
4. no network request may be required for basic lookup.

Routing and map rendering are deliberately separate phases. This ADR does not claim offline walking/driving routing yet.

## Safety / scope

- Do not modify adhan, Quran audio, Islamic library, prayer calculation or existing WebView behavior in this phase.
- Do not replace the current Android architecture.
- Do not bundle a full world map in the APK.
- Do not invent mosque names, phone numbers, prayer schedules or other metadata.
- Do not claim offline navigation until a real Android device test is completed with network disabled.

## Verification gate

This phase is complete only when:

- dataset integrity/count/schema checks pass;
- duplicate/stable-id checks pass;
- coordinates are validated as Algeria-range coordinates;
- an Android build remains green;
- existing adhan/Quran/library smoke tests remain green;
- a real-device offline lookup test succeeds with network disabled.
