#!/usr/bin/env bash
# RAECS intent manifest validation; this is a structural gate, not an LLM mind-reader.
set -euo pipefail
ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
if [[ ! -f RAECS_INTENT.yaml ]]; then
  echo '  – intent manifest not present; task-specific execution requires one'
  exit 0
fi
python3 - <<'PY'
from pathlib import Path
try:
    import yaml
except ImportError:
    raise SystemExit('PyYAML is required: python3 -m pip install pyyaml')
p = yaml.safe_load(Path('RAECS_INTENT.yaml').read_text())
required = ('version', 'purpose', 'allowed_paths', 'forbidden_actions', 'requires_human_approval')
missing = [k for k in required if not p.get(k)]
if missing:
    raise SystemExit(f'Missing intent fields: {missing}')
if not isinstance(p['allowed_paths'], list) or not all(isinstance(x, str) for x in p['allowed_paths']):
    raise SystemExit('allowed_paths must be a list of strings')
print('  ✓ intent manifest structure valid')
PY
