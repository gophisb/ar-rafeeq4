#!/usr/bin/env bash
# RAECS static analysis gate. Tools are mandatory only when matching source exists.
set -euo pipefail
ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
findings=0
fail(){ findings=$((findings+1)); printf '  ✗ STATIC [%s] %s\n' "$1" "$2"; }

mapfile -t shell_files < <(git ls-files '*.sh' '*.bash')
if ((${#shell_files[@]})); then
  if command -v shellcheck >/dev/null 2>&1; then
    shellcheck "${shell_files[@]}" || fail "SHELLCHECK" "shellcheck reported issues"
  else
    printf '  – shellcheck unavailable; CI must install it\n'
  fi
else
  printf '  – shellcheck not applicable\n'
fi

mapfile -t python_files < <(git ls-files '*.py')
if ((${#python_files[@]})); then
  if command -v bandit >/dev/null 2>&1; then
    bandit -q -r "${python_files[@]}" || fail "BANDIT" "bandit reported issues"
  else
    printf '  – bandit unavailable; CI must install it\n'
  fi
else
  printf '  – bandit not applicable\n'
fi

if find . -path './.git' -prune -o -type f \( -name '*.js' -o -name '*.ts' -o -name '*.py' -o -name '*.go' \) -print -quit | grep -q .; then
  if command -v semgrep >/dev/null 2>&1; then
    semgrep --config=p/security-audit --error --quiet . || fail "SEMGREP" "semgrep reported security findings"
  else
    printf '  – semgrep unavailable; CI must install it\n'
  fi
else
  printf '  – semgrep not applicable\n'
fi

if ((findings)); then exit 1; fi
printf '  ✓ static analysis passed\n'
