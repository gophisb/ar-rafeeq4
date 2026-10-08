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
        if not os.path.isfile(p):
            missing.append(p)
            continue
        try:
            data=json.load(open(p,encoding="utf-8"))
        except Exception as e:
            print(f"FAIL: invalid JSON: {p}: {e}")
            sys.exit(1)
        entries=data.get("hadiths") if isinstance(data,dict) else None
        if entries is None and isinstance(data,dict): entries=data.get("entries")
        if not isinstance(entries,list) or not entries:
            print(f"FAIL: no hadiths/entries array: {p}")
            sys.exit(1)
        for i,item in enumerate(entries):
            if not isinstance(item,dict) or not item.get("book") or item.get("idInBook") is None or not (item.get("arabic") or item.get("text")):
                print(f"FAIL: invalid reader entry {p} index={i}")
                sys.exit(1)
if missing:
    print("FAIL: missing local library assets:")
    print("\n".join(missing))
    sys.exit(1)
print(f"PASS: {sum(len(b.get('localPaths') or ([b['localPath']] if b.get('localPath') else [])) for b in m.get('books',[]))} local library assets exist and match reader contract")
PY
