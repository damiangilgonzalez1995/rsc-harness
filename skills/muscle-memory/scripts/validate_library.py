#!/usr/bin/env python3
"""Valida los esqueletos de kata de una biblioteca muscle-memory.

Por cada <library>/<slug>/katas/*.json comprueba: campos, tipos, que stub/canonical/test
parsean, que el slug es canonico y coincide con la carpeta, y que la solucion canonica
pasa sus propios tests (ejecucion real, igual que hara Pyodide).

La ejecucion de canonical+test ocurre en un SUBPROCESO aislado (no en el proceso del
validador): evita que un `sys.exit()` en una kata tumbe todo el lote, evita que un
`while True` cuelgue el validador para siempre (timeout), y evita que una kata
contamine sys.modules/environ para las siguientes.

Uso: python validate_library.py <library_dir>
"""

import ast
import json
import subprocess
import sys
from pathlib import Path

from scan_repo import CONCEPT_SLUGS

REQUIRED = {"concept": str, "level": int, "title_en": str,
            "spec_html_en": str, "stub": str, "test": str, "canonical": str}

# Codigo que se ejecuta en el subproceso hijo. Recibe por stdin un JSON
# {"canonical": ..., "test": ...} y escribe en stdout un JSON {"errors": [...]}.
# Captura BaseException (no solo Exception) para que un sys.exit() o un
# KeyboardInterrupt dentro de la kata no tumben el subproceso: se reportan como
# error de esa kata y el subproceso termina limpio (returncode 0).
RUNNER_CODE = """
import json
import sys
import inspect
import asyncio


def main():
    data = json.loads(sys.stdin.read())
    ns = {}
    errors = []
    try:
        exec(data["canonical"], ns)
        exec(data["test"], ns)
    except BaseException as e:
        errors.append(f"canonical/test raised at import time: {e!r}")
        print(json.dumps({"errors": errors}))
        return

    tests = [(n, f) for n, f in ns.items() if n.startswith("test_") and callable(f)]
    if not tests:
        errors.append("no test_* functions found")
        print(json.dumps({"errors": errors}))
        return

    for name, fn in tests:
        try:
            # Un test puede ser sincrono o una corrutina (async def). Si devuelve
            # una corrutina la ejecutamos aqui (este subproceso no tiene un bucle
            # de eventos en marcha; en el navegador el runner de la app hace await).
            r = fn()
            if inspect.iscoroutine(r):
                asyncio.run(r)
        except BaseException as e:
            errors.append(f"{name} failed against canonical: {e!r}")

    print(json.dumps({"errors": errors}))


main()
"""


def _run_canonical(kata, timeout=10):
    """Ejecuta canonical + test en un subproceso aislado con timeout.

    Devuelve la lista de errores reportada por el runner hijo. Si el subproceso
    cuelga (p. ej. un `while True` en un test), se mata a los `timeout` segundos
    y se reporta como error de esa kata, no como fallo del validador entero.
    """
    payload = json.dumps({"canonical": kata["canonical"], "test": kata["test"]})
    try:
        proc = subprocess.run(
            [sys.executable, "-c", RUNNER_CODE],
            input=payload,
            capture_output=True,
            text=True,
            encoding="utf-8",
            timeout=timeout,
        )
    except subprocess.TimeoutExpired:
        return [f"execution timed out after {timeout}s"]

    if proc.returncode != 0:
        stderr = (proc.stderr or "").strip()[:500] or "(no stderr)"
        return [f"subprocess exited with code {proc.returncode}: {stderr}"]

    # Parsear solo la última línea no vacía del stdout. Si canonical o test
    # contienen print(), stdout se contamina con múltiples líneas. El runner
    # siempre escribe el JSON como última línea, así que extrae solo esa.
    lines = [l for l in proc.stdout.splitlines() if l.strip()]
    if not lines:
        return ["subprocess produced no output"]

    try:
        result = json.loads(lines[-1])
    except json.JSONDecodeError:
        stdout_snippet = proc.stdout.strip()[:500]
        return [f"subprocess produced invalid output: {stdout_snippet!r}"]

    return result.get("errors", [])


def validate_kata(path, timeout=10):
    path = Path(path)
    errors = []
    try:
        kata = json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError) as e:
        return [f"unreadable JSON: {e}"]

    if not isinstance(kata, dict):
        return ["kata JSON must be an object"]

    for field, typ in REQUIRED.items():
        if field not in kata:
            errors.append(f"missing field: {field}")
            continue
        value = kata[field]
        # bool subclasea int: sin este check explicito, "level": true pasaria
        # el isinstance(value, int) en silencio.
        if typ is int and isinstance(value, bool):
            errors.append(f"field {field} must be {typ.__name__}")
        elif not isinstance(value, typ):
            errors.append(f"field {field} must be {typ.__name__}")
    if errors:
        return errors

    folder_slug = path.parent.parent.name
    if kata["concept"] not in CONCEPT_SLUGS:
        errors.append(f"unknown concept slug: {kata['concept']}")
    if kata["concept"] != folder_slug:
        errors.append(f"folder slug '{folder_slug}' != concept '{kata['concept']}'")
    if kata["level"] not in (1, 2, 3, 4):
        errors.append(f"level must be 1-4, got {kata['level']}")

    for field in ("stub", "canonical", "test"):
        try:
            ast.parse(kata[field])
        except SyntaxError as e:
            errors.append(f"{field} does not parse: {e}")
    if errors:
        return errors

    errors.extend(_run_canonical(kata, timeout=timeout))
    return errors


def main():
    if len(sys.argv) != 2:
        print("usage: validate_library.py <library_dir>")
        sys.exit(2)
    root = Path(sys.argv[1])
    katas = sorted(root.glob("*/katas/*.json"))
    if not katas:
        print(f"FAIL: no kata JSONs under {root}")
        sys.exit(1)
    failed = 0
    for k in katas:
        errs = validate_kata(k)
        if errs:
            failed += 1
            print(f"FAIL {k}")
            for e in errs:
                print(f"  - {e}")
        else:
            print(f"PASS {k}")
    print(f"\n{len(katas) - failed}/{len(katas)} skeletons valid")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
