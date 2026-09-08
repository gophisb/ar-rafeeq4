#!/usr/bin/env bash
# RAECS sandbox capability check. Execution remains fail-closed in sandbox-exec.sh.
set -euo pipefail
if ! command -v unshare >/dev/null 2>&1; then
  echo '  – sandbox unavailable: unshare is not installed'
  [[ "${RAECS_REQUIRE_SANDBOX:-0}" == "1" ]] && exit 1 || exit 0
fi
if unshare --user --map-root-user --mount --pid --fork --mount-proc --net true >/dev/null 2>&1; then
  echo '  ✓ Linux namespace sandbox available'
else
  echo '  – sandbox unavailable on this host; execution is fail-closed'
  [[ "${RAECS_REQUIRE_SANDBOX:-0}" == "1" ]] && exit 1 || exit 0
fi
