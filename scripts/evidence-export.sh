#!/usr/bin/env bash
# RAECS evidence export: creates a portable, hashed audit bundle without secrets by default.
set -euo pipefail
ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
out="${1:-EVALS/raecs-evidence-$(date -u +%Y%m%dT%H%M%SZ).tar.gz}"
mkdir -p "$(dirname "$out")"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
mkdir -p "$tmp/OPLOG" "$tmp/EVALS" "$tmp/DECISIONS"
cp -a OPLOG/*.log "$tmp/OPLOG/" 2>/dev/null || true
cp -a EVALS/*.md "$tmp/EVALS/" 2>/dev/null || true
cp -a DECISIONS/*.md "$tmp/DECISIONS/" 2>/dev/null || true
cp RAECS_POLICY.yaml RAECS_ROLES.yaml RAECS_INTENT.yaml "$tmp/"
( cd "$tmp" && find . -type f -print0 | sort -z | xargs -0 sha256sum > MANIFEST.sha256 )
tar -czf "$out" -C "$tmp" .
printf '%s  %s\n' "$(sha256sum "$out" | awk '{print $1}')" "$(basename "$out")" > "$out.sha256"
printf 'Evidence bundle: %s\nDigest: %s\n' "$out" "$out.sha256"
