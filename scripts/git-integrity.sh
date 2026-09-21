#!/usr/bin/env bash
# RAECS Git integrity gate.
set -euo pipefail
ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
findings=0
fail(){ findings=$((findings+1)); printf '  ✗ GIT [%s] %s\n' "$1" "$2"; }

if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  printf '  ✓ Git work tree detected\n'
else
  fail "REPOSITORY" "not inside a Git work tree"
fi

if git ls-files -z | grep -zEq '(^|/)\.git/hooks/'; then
  fail "HOOK" "tracked Git hook detected"
else
  printf '  ✓ no tracked Git hooks\n'
fi

protected='^(AGENTS\.md|INVARIANTS\.md|RAECS_POLICY\.yaml|scripts/verify-invariants\.sh|scripts/security-scan\.sh|EVALS/GOVERNANCE-APPROVAL\.md)$'
mapfile -t changed < <({ git diff --name-only; git diff --cached --name-only; git diff --name-only HEAD^ HEAD 2>/dev/null || true; } | sort -u)
protected_changes=()
for path in "${changed[@]}"; do
  [[ "$path" =~ $protected ]] && protected_changes+=("$path")
done
if ((${#protected_changes[@]})); then
  if [[ "${RAECS_GOVERNANCE_APPROVED:-}" != "1" ]] && ! grep -q '^status: approved$' EVALS/GOVERNANCE-APPROVAL.md 2>/dev/null; then
    fail "PROTECTED_CHANGE" "governance files changed without RAECS_GOVERNANCE_APPROVED=1: ${protected_changes[*]}"
  else
    printf '  ✓ protected changes explicitly approved\n'
  fi
else
  printf '  ✓ no protected governance changes detected\n'
fi

if git diff --check; then
  printf '  ✓ whitespace and conflict-marker check passed\n'
else
  fail "DIFF_CHECK" "Git reported whitespace errors"
fi

if ((findings)); then exit 1; fi
printf '  ✓ Git integrity passed\n'
