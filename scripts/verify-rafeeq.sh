#!/usr/bin/env bash
# Ar-Rafeeq 4 project verification under RAECS.
set -euo pipefail
ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
fail=0
check(){ if [[ -e "$1" ]]; then printf '  ✓ %s\n' "$1"; else printf '  ✗ missing: %s\n' "$1"; fail=1; fi; }

printf '%s\n' 'AR-RAFEEQ 4 PROJECT CHECK'
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
