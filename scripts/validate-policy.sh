#!/usr/bin/env bash
# RAECS Policy Validator
set -euo pipefail
ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
echo "  Validating RAECS_POLICY.yaml..."
command -v python3 >/dev/null 2>&1 || { echo "  python3 is required for policy validation" >&2; exit 1; }
python3 <<'PY'
import sys
from pathlib import Path
try:
    import yaml
except ImportError:
    print("  PyYAML is required: python3 -m pip install pyyaml", file=sys.stderr)
    sys.exit(1)
path = Path("RAECS_POLICY.yaml")
if not path.is_file():
    print("  RAECS_POLICY.yaml not found", file=sys.stderr); sys.exit(1)
try:
    p = yaml.safe_load(path.read_text())
except yaml.YAMLError as e:
    print(f"  YAML parse error: {e}", file=sys.stderr); sys.exit(1)
if not isinstance(p, dict):
    print("  Policy root must be a mapping", file=sys.stderr); sys.exit(1)
required = ["version","status","system","defcon","autonomy","clearance","scope","security","quality","governance"]
missing = [k for k in required if k not in p]
if missing:
    print(f"  Missing required sections: {missing}", file=sys.stderr); sys.exit(1)
if p["version"] != "3.0.0" or p["status"] != "final":
    print("  Policy must declare version 3.0.0 and status final", file=sys.stderr); sys.exit(1)
defcon = p["defcon"]
if not isinstance(defcon, dict) or any(k not in defcon for k in range(1,6)):
    # YAML numeric keys are normally integers; accept equivalent strings too.
    keys = {int(k) for k in defcon} if isinstance(defcon, dict) and all(str(k).isdigit() for k in defcon) else set()
    if keys != set(range(1,6)):
        print("  DEFCON levels 1-5 are required", file=sys.stderr); sys.exit(1)
security = p["security"]
for key in ("always_forbidden_files","forbidden_content","secret_handling","reporting"):
    if key not in security: print(f"  Missing security.{key}", file=sys.stderr); sys.exit(1)
for f in ("AGENTS.md","INVARIANTS.md","RAECS_POLICY.yaml",".env"):
    if f not in security["always_forbidden_files"]:
        print(f"  Missing protected file: {f}", file=sys.stderr); sys.exit(1)
governance = p["governance"]
if governance.get("stop_the_line") is not True:
    print("  governance.stop_the_line must be true", file=sys.stderr); sys.exit(1)
print("  Policy structure: VALID")
print("  Version: 3.0.0 | Status: final")
print("  DEFCON levels: 1-5")
PY
