#!/usr/bin/env python3
"""Fetch and validate the pinned GeoAlgeria Algeria mosque dataset for APK bundling.

This runs at build time. The resulting JSON is bundled into the offline WebView,
so the installed app does not need network access for mosque lookup.
"""
import json
import pathlib
import sys
import urllib.request

SOURCE_URL = "https://cdn.jsdelivr.net/npm/@geoalgeria/mosquees@2.0.4/data/mosquees.json"
EXPECTED_COUNT = 20759
OUT = pathlib.Path("pages/mosquees-data.json")

REQUIRED = ("id", "wilaya_code", "commune", "lat", "lng", "geo_precision", "geo_method", "source", "refs")

def fail(msg):
    print("MOSQUE_DATA_ERROR:", msg, file=sys.stderr)
    raise SystemExit(1)

def main():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    print("Fetching pinned dataset:", SOURCE_URL)
    with urllib.request.urlopen(SOURCE_URL, timeout=60) as r:
        raw = r.read()
    try:
        rows = json.loads(raw.decode("utf-8"))
    except Exception as exc:
        fail(f"invalid JSON: {exc}")
    if not isinstance(rows, list):
        fail("dataset root must be an array")
    if len(rows) != EXPECTED_COUNT:
        fail(f"expected {EXPECTED_COUNT} records, got {len(rows)}")

    ids = set()
    for i, row in enumerate(rows):
        if not isinstance(row, dict):
            fail(f"record {i} is not an object")
        missing = [k for k in REQUIRED if k not in row]
        if missing:
            fail(f"record {i} missing fields: {missing}")
        rid = row["id"]
        if rid in ids:
            fail(f"duplicate id: {rid}")
        ids.add(rid)
        try:
            lat, lng = float(row["lat"]), float(row["lng"])
        except Exception:
            fail(f"invalid coordinates at {rid}")
        if not (-90 <= lat <= 90 and -180 <= lng <= 180):
            fail(f"coordinate range error at {rid}: {lat}, {lng}")
        if row["geo_precision"] not in ("exact", "approximate"):
            fail(f"invalid geo_precision at {rid}")

    OUT.write_bytes(raw)
    print(f"Validated {len(rows)} mosque records -> {OUT}")

if __name__ == "__main__":
    main()
