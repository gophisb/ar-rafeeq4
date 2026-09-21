#!/usr/bin/env bash
# RAECS repository security scan
# Exit 0 = no high-confidence findings | Exit 1 = finding detected
set -euo pipefail
ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
QUIET=0
REPORT=0
for arg in "$@"; do
  case "$arg" in
    --quiet) QUIET=1 ;;
    --report) REPORT=1 ;;
    *) echo "Unknown option: $arg" >&2; exit 2 ;;
  esac
done

findings=0
TIMESTAMP=$(date -u '+%Y-%m-%dT%H:%M:%SZ')
say() { ((QUIET)) || printf '%s\n' "$*"; }
finding() {
  local kind="$1" path="$2" detail="$3"
  findings=$((findings + 1))
  printf '  ✗ SECURITY [%s] %s — %s\n' "$kind" "$path" "$detail"
  if ((REPORT)); then
    mkdir -p OPLOG
    printf '[%s] SECURITY [%s] %s — %s\n' "$TIMESTAMP" "$kind" "$path" "$detail" >> OPLOG/violations.log
  fi
}

# All repository paths, including untracked files, without following .git internals.
mapfile -d '' paths < <({ git ls-files -z; git ls-files --others --exclude-standard -z; } | sort -zu)

allowed_hidden='^(\.github(/|$)|\.gitignore$|\.gitattributes$|\.editorconfig$|\.nojekyll$|.*\/\.gitkeep$)$'
allowlist_file="RAECS_EXECUTABLES_ALLOWLIST.txt"
if [[ ! -f "$allowlist_file" ]]; then
  finding "ALLOWLIST" "$allowlist_file" "executable allowlist is missing"
fi
for path in "${paths[@]}"; do
  [[ "$path" == .git/* ]] && continue
  base="${path##*/}"
  if [[ "$base" == .* ]] && [[ ! "$path" =~ $allowed_hidden ]]; then
    finding "HIDDEN_FILE" "$path" "hidden file is not on the approved allowlist"
  fi
  if [[ -L "$path" ]]; then
    target=$(readlink "$path")
    case "$target" in
      /*|../*|*/../*) finding "SYMLINK" "$path" "link may escape the repository root" ;;
    esac
  fi
  if [[ -f "$path" && -x "$path" ]]; then
    if [[ ! -f "$allowlist_file" ]] || ! grep -Fxq "$path" "$allowlist_file"; then
      finding "UNAPPROVED_EXECUTABLE" "$path" "executable file is not on the approved allowlist"
    fi
  fi
  if [[ "$path" == .git/hooks/* || "$path" == */.git/hooks/* ]]; then
    finding "GIT_HOOK" "$path" "Git hook can execute code implicitly"
  fi
  if [[ "$path" =~ (^|/)(postinstall|preinstall|prepare|cron|crontab|systemd|launchd)(\.|/|$) ]]; then
    finding "PERSISTENCE" "$path" "possible automatic execution or persistence artifact"
  fi
done

# Scan readable text files for high-confidence execution and persistence indicators.
# The scanner excludes itself so its detection rules cannot self-match.
for path in "${paths[@]}"; do
  [[ "$path" == scripts/security-scan.sh || "$path" == .git/* ]] && continue
  [[ -f "$path" ]] || continue
  file "$path" | grep -Eiq 'text|json|yaml|xml|javascript|shell|python|source' || continue
  if grep -nEiq '(^|[[:space:];])((curl|wget)[^|[:cntrl:]]*\|[[:space:]]*(bash|sh|zsh)|nc[[:space:]]+-e|bash[[:space:]]+-c[[:space:]]+|python(3)?[[:space:]]+-c[[:space:]]+|eval[[:space:]]*\(|base64[[:space:]]+(-d|--decode)|/dev/tcp/|chmod[[:space:]]+\+x)' "$path" 2>/dev/null; then
    finding "SUSPICIOUS_COMMAND" "$path" "contains a high-risk download, shell, decoding, network, or execution pattern"
  fi
  case "$path" in
    *.sh|*.bash|*.yml|*.yaml|package.json|*.json)
      if grep -nEiq '(npm|yarn|pnpm)[[:space:]]+.*(preinstall|postinstall)|(^|[;&|[:space:]])(at|crontab)[[:space:]]+[^=]|systemctl[[:space:]]+(enable|start)|launchctl[[:space:]]+load' "$path" 2>/dev/null; then
        finding "PERSISTENCE_COMMAND" "$path" "contains an automatic-start or persistence command"
      fi
      ;;
  esac
done

if ((findings == 0)); then
  say '  ✓ SECURITY scan passed — no high-confidence findings'
  exit 0
fi
printf '  %d security finding(s) detected\n' "$findings"
printf '  STOP THE LINE — review security findings before checkpoint/release\n'
exit 1
