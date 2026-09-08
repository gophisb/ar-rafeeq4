#!/usr/bin/env bash
# RAECS artifact integrity: SHA-256 is always produced; GPG signing is optional but verified when present.
set -euo pipefail
usage(){ echo 'Usage: artifact-sign.sh create FILE | verify FILE' >&2; exit 2; }
[[ $# -eq 2 ]] || usage
mode="$1"; file="$2"
[[ -f "$file" ]] || { echo "Missing artifact: $file" >&2; exit 1; }
digest="$file.sha256"
sig="$file.asc"
case "$mode" in
  create)
    printf '%s  %s\n' "$(sha256sum "$file" | awk '{print $1}')" "$(basename "$file")" > "$digest"
    if [[ -n "${RAECS_SIGNING_KEY:-}" ]]; then
      command -v gpg >/dev/null 2>&1 || { echo 'GPG unavailable' >&2; exit 1; }
      gpg --batch --yes --local-user "$RAECS_SIGNING_KEY" --armor --detach-sign --output "$sig" "$file"
      echo "Created SHA-256 and GPG signature: $digest, $sig"
    else
      echo "Created SHA-256 manifest: $digest (GPG signature not requested)"
    fi
    ;;
  verify)
    [[ -f "$digest" ]] || { echo "Missing digest: $digest" >&2; exit 1; }
    (cd "$(dirname "$file")" && sha256sum --check "$(basename "$digest")")
    if [[ -f "$sig" ]]; then
      command -v gpg >/dev/null 2>&1 || { echo 'GPG unavailable for signature verification' >&2; exit 1; }
      gpg --batch --verify "$sig" "$file"
    fi
    echo "Artifact verified: $file"
    ;;
  *) usage ;;
esac
