#!/usr/bin/env bash
# RAECS sandbox wrapper. Network is disabled by default; isolation failure blocks execution.
set -euo pipefail
ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
[[ $# -gt 0 ]] || { echo 'Usage: sandbox-exec.sh COMMAND [ARG...]' >&2; exit 2; }
command -v unshare >/dev/null 2>&1 || { echo 'SANDBOX BLOCKED: unshare is unavailable' >&2; exit 1; }
if [[ "${RAECS_SANDBOX_ALLOW_NETWORK:-0}" == "1" ]]; then
  echo 'SANDBOX BLOCKED: network access requires an explicit external policy adapter' >&2
  exit 1
fi
if ! unshare --user --map-root-user --mount --pid --fork --mount-proc --net true >/dev/null 2>&1; then
  echo 'SANDBOX BLOCKED: required user/mount/pid/network namespaces are unavailable' >&2
  exit 1
fi
exec unshare --user --map-root-user --mount --pid --fork --mount-proc --net -- "$@"
