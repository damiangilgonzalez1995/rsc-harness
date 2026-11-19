"""Local tests of the shortform-editing scripts (not in CI). Run with the editor venv:
    python -X utf8 -m pytest skills/shortform-editing/tests -q
"""
import sys
from pathlib import Path

SKILL = Path(__file__).resolve().parents[1]
SCRIPTS = SKILL / "scripts"
if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))
