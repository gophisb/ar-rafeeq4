#!/usr/bin/env bash
# RAECS dependency audit: inspect supported dependency manifests when present.
set -euo pipefail
ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
findings=0
say(){ printf '%s\n' "$*"; }
fail(){ findings=$((findings+1)); say "  ✗ DEPENDENCY [$1] $2"; }

if [[ -f package.json ]]; then
  [[ -f package-lock.json || -f npm-shrinkwrap.json || -f yarn.lock || -f pnpm-lock.yaml ]] || fail "LOCKFILE" "Node manifest has no lockfile"
  if command -v npm >/dev/null 2>&1; then
    if npm audit --audit-level=high --omit=dev >/tmp/raecs-npm-audit.json 2>/dev/null; then
      say "  ✓ npm audit — no high-severity production findings"
    else
      fail "NPM_AUDIT" "npm audit reported high-severity production findings"
    fi
  else
    fail "TOOLING" "npm is required to audit package.json"
  fi
else
  say "  – npm audit not applicable (no package.json)"
fi

if [[ -f requirements.txt || -f pyproject.toml || -f Pipfile ]]; then
  if command -v pip-audit >/dev/null 2>&1; then
    pip-audit --strict || fail "PIP_AUDIT" "pip-audit reported vulnerable Python dependencies"
  else
    fail "TOOLING" "pip-audit is required for Python dependency auditing"
  fi
else
  say "  – Python dependency audit not applicable"
fi

if [[ -f go.mod ]]; then
  if command -v govulncheck >/dev/null 2>&1; then
    govulncheck ./... || fail "GO_VULN" "govulncheck reported vulnerable Go dependencies"
  else
    fail "TOOLING" "govulncheck is required for Go dependency auditing"
  fi
else
  say "  – Go dependency audit not applicable"
fi

if ((findings)); then
  say "  $findings dependency audit finding(s)"
  exit 1
fi
say "  ✓ dependency audit passed"
