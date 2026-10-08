#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
MANIFEST="pages/islamic-library-local-manifest.json"
[[ -f "$MANIFEST" ]] || { echo "FAIL: $MANIFEST missing"; exit 1; }
python3 - <<'PY'
import json,sys,os
m=json.load(open("pages/islamic-library-local-manifest.json",encoding="utf-8"))
missing=[]
for book in m.get("books",[]):
    paths=book.get("localPaths") or ([book["localPath"]] if book.get("localPath") else [])
    for p in paths:
        if not os.path.isfile(p): missing.append(p)
if missing:
    print("FAIL: missing local library assets:")
    print("\n".join(missing))
    sys.exit(1)
print("PASS: all local library manifest paths exist")
PY
