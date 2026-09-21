#!/usr/bin/env bash
# RAECS role and permission model validation.
set -euo pipefail
ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
python3 - <<'PY'
from pathlib import Path
import yaml
p = yaml.safe_load(Path('RAECS_ROLES.yaml').read_text())
roles = p.get('roles', {})
required = {'observer', 'operator', 'reviewer', 'administrator'}
missing = required - set(roles)
if missing:
    raise SystemExit(f'Missing roles: {sorted(missing)}')
for name, role in roles.items():
    if not isinstance(role.get('may'), list) or not isinstance(role.get('approval_required_for'), list):
        raise SystemExit(f'Role {name} must define may and approval_required_for lists')
if p.get('separation_of_duties', {}).get('governance_change_requires_human') is not True:
    raise SystemExit('Governance changes must require human approval')
if p.get('separation_of_duties', {}).get('release_requires_distinct_reviewer') is not True:
    raise SystemExit('Releases must require a distinct reviewer')
print('  ✓ role and separation-of-duties policy valid')
PY
