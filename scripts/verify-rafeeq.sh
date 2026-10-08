#!/usr/bin/env bash
# Ar-Rafeeq 4 project verification under RAECS.
set -euo pipefail
ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
fail=0
check(){ if [[ -e "$1" ]]; then printf '  ✓ %s\n' "$1"; else printf '  ✗ missing: %s\n' "$1"; fail=1; fi; }

printf '%s\n' 'AR-RAFEEQ 4 PROJECT CHECK'

# Verify local Islamic library assets against the reader contract and Service Worker shell.
if [[ -f pages/islamic-library-local-manifest.json ]]; then
  python3 - <<'PY'
import json,sys,os
m=json.load(open("pages/islamic-library-local-manifest.json",encoding="utf-8"))
sw=open("sw.js",encoding="utf-8").read()
for book in m.get("books",[]):
    paths=book.get("localPaths") or ([book["localPath"]] if book.get("localPath") else [])
    for p in paths:
        if not os.path.isfile(p): raise SystemExit(f"missing local library asset: {p}")
        data=json.load(open(p,encoding="utf-8"))
        entries=data.get("hadiths") if isinstance(data,dict) else None
        if entries is None and isinstance(data,dict): entries=data.get("entries")
        if not isinstance(entries,list) or not entries: raise SystemExit(f"invalid library structure: {p}")
        for i,item in enumerate(entries):
            if not isinstance(item,dict) or not item.get("book") or item.get("idInBook") is None or not (item.get("arabic") or item.get("text")):
                raise SystemExit(f"invalid reader entry: {p} index={i}")
        if "./"+p not in sw: raise SystemExit(f"Service Worker APP_SHELL missing: ./{p}")
print("Library assets: PASS")
PY
else
  printf '  ✗ missing: pages/islamic-library-local-manifest.json\n'
  fail=1
fi
for f in index.html app.js config.js router.js prayer.js prayer-engine.js locations.js sw.js manifest.json; do check "$f"; done
for f in pages/quran-local.json pages/tafsir-saadi-local.json pages/azkar-data.json pages/nawawi-data.json; do check "$f"; done

# Resolve relative JS imports and dynamic page module references.
while IFS= read -r import_path; do
  [[ -z "$import_path" ]] && continue
  candidate="${import_path#./}"
  if [[ ! -f "$candidate" ]]; then
    printf '  ✗ missing JavaScript dependency: %s\n' "$candidate"
    fail=1
  fi
done < <(grep -RhoE "from ['\"][.][^'\"]+['\"]|import\(['\"][.][^'\"]+['\"]\)" --include='*.js' . | sed -E "s/.*['\"](\.[^'\"]+)['\"].*/\1/" | sort -u)

# Ensure the manifest and service worker point to local app assets.
if grep -Eq 'https?://' manifest.json sw.js; then
  printf '  ✗ external URL found in offline-critical manifest/service worker\n'
  fail=1
else
  printf '  ✓ offline-critical manifest/service worker are local-only\n'
fi

if ((fail)); then
  printf 'AR-RAFEEQ 4 CHECK: FAIL\n'
  exit 1
fi
printf 'AR-RAFEEQ 4 CHECK: PASS\n'
