#!/usr/bin/env bash
# RAECS Invariant Verification — Run before every commit
# Usage: bash scripts/verify-invariants.sh [--quiet] [--report]
# Exit 0 = all invariants hold | Exit 1 = violation detected
set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
QUIET=""; REPORT=""
for arg in "$@"; do case "$arg" in --quiet) QUIET="--quiet";; --report) REPORT="--report";; *) echo "Unknown option: $arg" >&2; exit 2;; esac; done
VIOLATIONS=0; CHECKS=0
TIMESTAMP=$(date -u '+%Y-%m-%dT%H:%M:%SZ')
R='\033[0;31m'; G='\033[0;32m'; Y='\033[1;33m'; N='\033[0m'; W='\033[1;37m'

ok() { [[ "$QUIET" == "--quiet" ]] || echo -e "  ${G}✓${N} [$1] $2"; CHECKS=$((CHECKS+1)); }
violate() {
  echo -e "  ${R}✗ VIOLATION${N} [$1] $2"
  VIOLATIONS=$((VIOLATIONS+1)); CHECKS=$((CHECKS+1))
  if [[ "$REPORT" == "--report" ]]; then
    mkdir -p OPLOG
    printf '[%s] VIOLATION [%s] %s\n' "$TIMESTAMP" "$1" "$2" >> OPLOG/violations.log 2>/dev/null || true
  fi
}
skip() { [[ "$QUIET" == "--quiet" ]] || echo -e "  ${Y}–${N} $1 (not applicable)"; }

[[ "$QUIET" == "--quiet" ]] || echo -e "\n${W}  Verifying RAECS invariants...${N}\n"

# INV-U001: App must build when a build script exists
if [[ -f package.json ]]; then
  BUILD=$(node -e 'const p=require("./package.json"); console.log(p.scripts?.build||"")' 2>/dev/null || true)
  if [[ -n "$BUILD" ]]; then
    if npm run build --silent; then ok "INV-U001" "Application builds successfully"; else violate "INV-U001" "Build failed — app cannot start → DEFCON 2"; fi
  else skip "INV-U001 build (no build script)"; fi
else skip "INV-U001 (no package.json)"; fi

# INV-U004: No obvious secrets in staged or untracked content
PATTERNS='(API_KEY|SECRET_KEY|PRIVATE_KEY|ACCESS_TOKEN|AUTH_TOKEN|DATABASE_URL|PASSWORD|TOKEN)[[:space:]]*='
SECRET_HIT=0
if git diff --cached --unified=0 2>/dev/null | grep -Eiq "$PATTERNS"; then SECRET_HIT=1; fi
while IFS= read -r -d '' file; do
  if grep -EIlq "$PATTERNS" "$file" 2>/dev/null; then SECRET_HIT=1; break; fi
done < <(git ls-files --others --exclude-standard -z 2>/dev/null)
if [[ -f .env ]] && ! git check-ignore -q .env 2>/dev/null; then
  violate "INV-U004" ".env is not gitignored → DEFCON 1 — immediate escalation required"
  SECRET_HIT=1
fi
if [[ "$SECRET_HIT" -eq 0 ]]; then ok "INV-U004" "No obvious secrets detected in staged/untracked content"; else violate "INV-U004" "Potential secret detected in repository changes"; fi

# INV-U006: Reproducible build metadata
if [[ -f package.json ]]; then
  if [[ -f package-lock.json || -f yarn.lock || -f pnpm-lock.yaml || -f bun.lockb || -f bun.lock ]]; then ok "INV-U006" "Lockfile present — reproducible builds"; else violate "INV-U006" "No lockfile — builds not reproducible → DEFCON 3"; fi
else skip "INV-U006 (no package.json)"; fi

# INV-U007: Tests must not regress
if [[ -f package.json ]]; then
  TEST=$(node -e 'const p=require("./package.json"); const t=p.scripts?.test||""; console.log(/no test|echo.*no test/i.test(t)?"":t)' 2>/dev/null || true)
  if [[ -n "$TEST" ]]; then
    if npm test --silent; then ok "INV-U007" "Test suite passes — no regression"; else violate "INV-U007" "Tests FAILED — regression detected → DEFCON 3"; fi
  else skip "INV-U007 (no meaningful test script)"; fi
else skip "INV-U007 (no package.json)"; fi

# INV-U010: OPLOG must exist
if [[ -d OPLOG ]]; then ok "INV-U010" "OPLOG directory exists"; else violate "INV-U010" "OPLOG/ directory missing — operation logging impossible"; fi

# Policy validation when policy exists
if [[ -f RAECS_POLICY.yaml ]]; then
  if bash scripts/validate-policy.sh >/dev/null; then ok "INV-G001" "RAECS policy validates"; else violate "INV-G001" "RAECS policy validation failed"; fi
else skip "INV-G001 (RAECS_POLICY.yaml not present)"; fi

[[ "$QUIET" == "--quiet" ]] || echo ""
if [[ "$VIOLATIONS" -eq 0 ]]; then
  [[ "$QUIET" == "--quiet" ]] || echo -e "  ${G}All $CHECKS invariant checks passed${N}\n"
  exit 0
else
  echo -e "  ${R}$VIOLATIONS violation(s) detected in $CHECKS checks${N}"
  echo -e "  ${R}STOP THE LINE — consult INVARIANTS.md violation protocol${N}\n"
  exit 1
fi
