# muscle-memory — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir la skill `muscle-memory`: genera katas de Python desde el código reciente del usuario, resolubles en una app web local (Pyodide), con biblioteca de estudio y progreso con repetición espaciada.

**Architecture:** Dos piezas: la skill en `~/.claude/skills/muscle-memory/` (lógica + assets: app web estática y biblioteca semilla) y la carpeta de datos `~/muscle-memory/` que la skill monta en bootstrap. Generar sesión = escanear repo con AST, seleccionar esqueletos de la biblioteca, adaptarlos y volcar un `.js` con un script helper. Spec: `docs/2026-07-16-muscle-memory-design.md` (misma carpeta padre que este plan).

**Tech Stack:** Python 3 stdlib (scripts, sin dependencias), HTML/CSS/JS vainilla + CodeMirror 5 y Pyodide por CDN (app), unittest (tests de scripts).

## Global Constraints

- Todo el trabajo ocurre en `C:\Users\Usuario\.claude\skills\muscle-memory\` (la skill). La carpeta de datos del usuario es `C:\Users\Usuario\muscle-memory\` y SOLO la crea/toca el flujo bootstrap/generate; los repos analizados solo se leen.
- Scripts: Python 3 stdlib puro, sin `pip install` de nada. Tests con `unittest` (no pytest).
- Código, identificadores, UI y esqueletos de biblioteca en **inglés**. Documentación interna y comentarios en **español**. Enunciados de kata generados: en el idioma del usuario en runtime (no aplica a los seeds, que van en inglés).
- Katas: ≤25 líneas a escribir, un solo concepto, solo stdlib (deben correr en Pyodide), 2-3 asserts con mensajes didácticos, stub con firmas puestas.
- Slugs de concepto canónicos (única fuente: `CONCEPT_SLUGS` en `scripts/scan_repo.py`; las carpetas de `library-seed/` usan estos mismos nombres): `classes, methods, properties, dataclasses, dunder-methods, inheritance, exceptions, typing, enums, context-managers, decorators, generators, comprehensions, iterators, async, factory, strategy, observer, adapter, singleton`.
- Niveles de kata: 1 recall (rellenar hueco), 2 rebuild (escribir desde spec), 3 apply (usar el patrón en contexto nuevo), 4 refactor (mejorar versión naíf).
- En Windows el intérprete es `python` (3.12). Los comandos de verificación se dan con `python`.
- Commits: Conventional Commits en español, en el repo git de la propia skill (se inicializa en Task 1).

## Estructura de archivos final

```
~/.claude/skills/muscle-memory/
├── SKILL.md                      (Task 9)
├── references/
│   └── kata-authoring.md         (Task 9)
├── scripts/
│   ├── scan_repo.py              (Task 2)
│   ├── validate_library.py       (Task 3)
│   └── build_session.py          (Task 4)
├── tests/
│   ├── test_scan_repo.py         (Task 2)
│   ├── test_validate_library.py  (Task 3)
│   └── test_build_session.py     (Task 4)
├── assets/
│   ├── app/index.html            (Task 8)
│   ├── user-readme.md            (Task 9; plantilla del README de ~/muscle-memory)
│   └── library-seed/
│       └── <slug>/card.md + katas/l<level>-<slug>.json   (Tasks 5-7)
└── docs/  (ya existe: spec y este plan)
```

---

### Task 1: Scaffolding y repo git de la skill

**Files:**
- Create: `scripts/`, `tests/`, `references/`, `assets/app/`, `assets/library-seed/` (carpetas), `.gitignore`

**Interfaces:**
- Produces: repo git inicializado donde commitean el resto de tareas.

- [ ] **Step 1: Crear carpetas y .gitignore**

```bash
cd /c/Users/Usuario/.claude/skills/muscle-memory
mkdir -p scripts tests references assets/app assets/library-seed
printf '__pycache__/\n*.pyc\n' > .gitignore
```

- [ ] **Step 2: Inicializar git y commit inicial**

```bash
git init
git add .
git commit -m "chore: scaffolding de la skill muscle-memory con spec y plan"
```

Expected: commit con `docs/`, `.gitignore` y carpetas (git no trackea vacías; basta con que entren cuando tengan contenido).

---

### Task 2: `scripts/scan_repo.py` — escáner AST del repo

Evolución de `analizar_git.py` del prototipo (está en `C:\Users\Usuario\AppData\Local\Temp\claude\...\scratchpad\gimnasio-codigo-extract\gimnasio-codigo\scripts\analizar_git.py` si sigue ahí; si no, este task es autocontenido). Cambios: salida en inglés, emite slugs canónicos, detecta `async` e iteradores y bases `Enum`, args `--days/--repo/--max-files`.

**Files:**
- Create: `scripts/scan_repo.py`
- Test: `tests/test_scan_repo.py`

**Interfaces:**
- Produces: CLI `python scripts/scan_repo.py --days 7 --repo <path>` → texto legible con secciones `## <file>` y bloque final `## Candidate concepts` con líneas `- <slug> (in N file/s)`. Constante `CONCEPT_SLUGS: set[str]` importable (la usa Task 3). Función `extract_concepts(path) -> dict | None` con claves `classes, functions, decorators, imports, signals` (signals = subconjunto de `CONCEPT_SLUGS`).

- [ ] **Step 1: Escribir el test que falla**

`tests/test_scan_repo.py`:

```python
"""Tests del escáner AST. Sin dependencias: unittest + tempfile."""
import subprocess
import sys
import tempfile
import textwrap
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))
import scan_repo


SAMPLE = textwrap.dedent('''
    from dataclasses import dataclass
    from enum import Enum
    import contextlib

    class Status(Enum):
        OPEN = 1

    @dataclass
    class Ticket:
        title: str

    class Timer:
        def __enter__(self):
            return self
        def __exit__(self, *exc):
            return False

    class Feed:
        def __iter__(self):
            return self
        def __next__(self):
            raise StopIteration

    async def fetch():
        return [x for x in range(3)]

    def numbers():
        yield 1
''')


class TestExtractConcepts(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.file = Path(self.tmp.name) / "sample.py"
        self.file.write_text(SAMPLE, encoding="utf-8")

    def tearDown(self):
        self.tmp.cleanup()

    def test_detecta_senales_basicas(self):
        info = scan_repo.extract_concepts(str(self.file))
        for slug in ("dataclasses", "enums", "context-managers",
                     "iterators", "async", "generators", "comprehensions"):
            self.assertIn(slug, info["signals"], f"falta {slug}")

    def test_senales_son_slugs_canonicos(self):
        info = scan_repo.extract_concepts(str(self.file))
        self.assertTrue(set(info["signals"]) <= scan_repo.CONCEPT_SLUGS)

    def test_archivo_con_sintaxis_rota_devuelve_none(self):
        bad = Path(self.tmp.name) / "bad.py"
        bad.write_text("def :", encoding="utf-8")
        self.assertIsNone(scan_repo.extract_concepts(str(bad)))


class TestCli(unittest.TestCase):
    def test_carpeta_inexistente_avisa_sin_reventar(self):
        proc = subprocess.run(
            [sys.executable, str(Path(__file__).resolve().parent.parent / "scripts" / "scan_repo.py"),
             "--repo", "Z:/no/existe"],
            capture_output=True, text=True,
        )
        self.assertEqual(proc.returncode, 0)
        self.assertIn("[error]", proc.stdout)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Ejecutar y ver que falla**

```bash
cd /c/Users/Usuario/.claude/skills/muscle-memory
python -m unittest tests.test_scan_repo -v
```

Expected: FAIL/ERROR con `ModuleNotFoundError: No module named 'scan_repo'`.

- [ ] **Step 3: Implementar `scripts/scan_repo.py`**

```python
#!/usr/bin/env python3
"""Escanea los cambios recientes de un repo para alimentar la generacion de katas.

Salida legible en ingles: archivos .py tocados, resumen por archivo (clases,
funciones, decoradores, imports) y conceptos candidatos como slugs canonicos.

Uso:
    python scan_repo.py --days 7 --repo /path/to/project
"""

import argparse
import ast
import os
import subprocess
import sys
from datetime import datetime, timedelta

# Unica fuente de verdad de los slugs. Las carpetas de library-seed/ usan estos nombres.
CONCEPT_SLUGS = {
    "classes", "methods", "properties", "dataclasses", "dunder-methods",
    "inheritance", "exceptions", "typing", "enums", "context-managers",
    "decorators", "generators", "comprehensions", "iterators", "async",
    "factory", "strategy", "observer", "adapter", "singleton",
}


def run_git(repo, args):
    try:
        out = subprocess.run(["git", "-C", repo, *args],
                             capture_output=True, text=True, check=True)
        return out.stdout.strip()
    except (subprocess.CalledProcessError, FileNotFoundError):
        return None


def recent_files(repo, days):
    since = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
    out = run_git(repo, ["log", f"--since={since}", "--name-only",
                         "--pretty=format:", "--", "*.py"])
    if out is None:
        return None
    return sorted({l.strip() for l in out.splitlines() if l.strip().endswith(".py")})


def _deco_name(node):
    if isinstance(node, ast.Name):
        return node.id
    if isinstance(node, ast.Attribute):
        return node.attr
    if isinstance(node, ast.Call):
        return _deco_name(node.func)
    return None


def extract_concepts(path):
    """Devuelve dict con classes/functions/decorators/imports/signals, o None si no parsea."""
    try:
        with open(path, "r", encoding="utf-8") as f:
            tree = ast.parse(f.read(), filename=path)
    except (SyntaxError, OSError, UnicodeDecodeError):
        return None

    classes, functions, decorators, imports = [], [], set(), set()
    signals = set()

    for node in ast.walk(tree):
        if isinstance(node, ast.ClassDef):
            bases = [b.id for b in node.bases if isinstance(b, ast.Name)]
            classes.append((node.name, bases))
            signals.add("classes")
            for d in node.decorator_list:
                name = _deco_name(d)
                if name:
                    decorators.add(name)
                    if name == "dataclass":
                        signals.add("dataclasses")
            methods = {n.name for n in node.body
                       if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef))}
            if "__enter__" in methods:
                signals.add("context-managers")
            if methods & {"__iter__", "__next__"}:
                signals.add("iterators")
            if any(m.startswith("__") and m.endswith("__")
                   and m not in {"__init__", "__enter__", "__exit__", "__iter__", "__next__"}
                   for m in methods):
                signals.add("dunder-methods")
            if bases:
                signals.add("inheritance")
                if "Enum" in bases:
                    signals.add("enums")
        elif isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            functions.append(node.name)
            if isinstance(node, ast.AsyncFunctionDef):
                signals.add("async")
            for d in node.decorator_list:
                name = _deco_name(d)
                if name:
                    decorators.add(name)
            if any(isinstance(n, (ast.Yield, ast.YieldFrom)) for n in ast.walk(node)):
                signals.add("generators")
        elif isinstance(node, (ast.ListComp, ast.SetComp, ast.DictComp, ast.GeneratorExp)):
            signals.add("comprehensions")
        elif isinstance(node, ast.Await):
            signals.add("async")
        elif isinstance(node, ast.Try):
            signals.add("exceptions")
        elif isinstance(node, (ast.Import, ast.ImportFrom)):
            mod = getattr(node, "module", None)
            if isinstance(node, ast.Import):
                for a in node.names:
                    imports.add(a.name.split(".")[0])
            elif mod:
                imports.add(mod.split(".")[0])
                names = {a.name for a in node.names}
                if mod == "dataclasses":
                    signals.add("dataclasses")
                if mod == "enum":
                    signals.add("enums")
                if mod == "typing" and names & {"Protocol", "TypedDict", "Optional", "Union"}:
                    signals.add("typing")
                if mod == "abc":
                    signals.add("inheritance")
                if mod == "contextlib":
                    signals.add("context-managers")
                if mod == "asyncio":
                    signals.add("async")

    if decorators - {"dataclass", "property", "staticmethod", "classmethod"}:
        signals.add("decorators")
    if decorators & {"property", "staticmethod", "classmethod"}:
        signals.add("properties" if "property" in decorators else "methods")

    assert signals <= CONCEPT_SLUGS, f"slug fuera de catalogo: {signals - CONCEPT_SLUGS}"
    return {
        "classes": classes,
        "functions": functions[:20],
        "decorators": sorted(decorators),
        "imports": sorted(imports),
        "signals": sorted(signals),
    }


def main():
    p = argparse.ArgumentParser(description="Scan recent repo changes for kata generation.")
    p.add_argument("--days", type=int, default=7)
    p.add_argument("--repo", default=".")
    p.add_argument("--max-files", type=int, default=15)
    args = p.parse_args()

    repo = os.path.abspath(args.repo)
    if not os.path.isdir(repo):
        print(f"[error] Folder does not exist: {repo}")
        sys.exit(0)

    files = recent_files(repo, args.days)
    if files is None:
        print("[warn] Not a git repository (or git unavailable).")
        print("Ask the user for a folder or .py files and read them directly.")
        sys.exit(0)
    if not files:
        print(f"[warn] No .py files modified in the last {args.days} days.")
        print("Widen the window (--days) or ask which topic to practice.")
        sys.exit(0)

    print(f"# Recent code scan ({args.days} days) in {repo}\n")
    print(f".py files touched: {len(files)}\n")

    global_signals = {}
    for rel in files[: args.max_files]:
        path = os.path.join(repo, rel)
        if not os.path.isfile(path):
            continue
        info = extract_concepts(path)
        if not info:
            continue
        print(f"## {rel}")
        if info["classes"]:
            desc = ", ".join(f"{n}" + (f"({', '.join(b)})" if b else "")
                             for n, b in info["classes"])
            print(f"- Classes: {desc}")
        if info["functions"]:
            print(f"- Functions: {', '.join(info['functions'])}")
        if info["decorators"]:
            print(f"- Decorators: {', '.join(info['decorators'])}")
        if info["imports"]:
            print(f"- Imports: {', '.join(info['imports'])}")
        if info["signals"]:
            print(f"- Concepts: {', '.join(info['signals'])}")
            for s in info["signals"]:
                global_signals[s] = global_signals.get(s, 0) + 1
        print()

    if global_signals:
        print("## Candidate concepts")
        for slug, n in sorted(global_signals.items(), key=lambda x: -x[1]):
            print(f"- {slug} (in {n} file/s)")


if __name__ == "__main__":
    main()
```

- [ ] **Step 4: Ejecutar tests y ver verde**

```bash
python -m unittest tests.test_scan_repo -v
```

Expected: `OK` (4 tests).

- [ ] **Step 5: Prueba de humo real y commit**

```bash
python scripts/scan_repo.py --days 30 --repo /c/Users/Usuario/Documents/GitHub/ATI_PLATFORM | tail -20
git add scripts/scan_repo.py tests/test_scan_repo.py
git commit -m "feat: escaner AST de repos con slugs canonicos"
```

Expected: sección `## Candidate concepts` con slugs del backend de ATI.

---

### Task 3: `scripts/validate_library.py` — validador de esqueletos

Gate de calidad de la biblioteca: cada esqueleto debe tener todos los campos, parsear, y su canónica debe pasar sus propios tests. Se usa al final de Tasks 5-7 y cada vez que se cree una ficha nueva en runtime.

**Files:**
- Create: `scripts/validate_library.py`
- Test: `tests/test_validate_library.py`

**Interfaces:**
- Consumes: `CONCEPT_SLUGS` de `scan_repo.py`; carpetas `<library>/<slug>/katas/*.json` con campos `concept, level, title_en, spec_html_en, stub, test, canonical`.
- Produces: CLI `python scripts/validate_library.py <library_dir>` → imprime `PASS <ruta>` / `FAIL <ruta>: <motivo>` por esqueleto y `exit 0` solo si todo pasa. Función `validate_kata(path) -> list[str]` (lista de errores, vacía si OK).

- [ ] **Step 1: Escribir el test que falla**

`tests/test_validate_library.py`:

```python
"""Tests del validador de esqueletos de kata."""
import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))
import validate_library

GOOD = {
    "concept": "classes",
    "level": 1,
    "title_en": "Fill the constructor",
    "spec_html_en": "<p>Complete <code>__init__</code> so name is stored.</p>",
    "stub": "class User:\n    # TODO\n    ...",
    "test": ("def test_stores_name():\n"
             "    u = User('Ana')\n"
             "    assert u.name == 'Ana', 'constructor must store name'"),
    "canonical": "class User:\n    def __init__(self, name):\n        self.name = name",
}


def write_kata(tmpdir, data, slug="classes", fname="l1-init.json"):
    d = Path(tmpdir) / slug / "katas"
    d.mkdir(parents=True, exist_ok=True)
    p = d / fname
    p.write_text(json.dumps(data), encoding="utf-8")
    return p


class TestValidateKata(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()

    def tearDown(self):
        self.tmp.cleanup()

    def test_esqueleto_correcto_sin_errores(self):
        p = write_kata(self.tmp.name, GOOD)
        self.assertEqual(validate_library.validate_kata(p), [])

    def test_campo_ausente_da_error(self):
        bad = {k: v for k, v in GOOD.items() if k != "canonical"}
        p = write_kata(self.tmp.name, bad)
        errs = validate_library.validate_kata(p)
        self.assertTrue(any("canonical" in e for e in errs))

    def test_canonica_que_no_pasa_sus_tests_da_error(self):
        bad = dict(GOOD, canonical="class User:\n    pass")
        p = write_kata(self.tmp.name, bad)
        errs = validate_library.validate_kata(p)
        self.assertTrue(any("test_stores_name" in e for e in errs))

    def test_slug_de_carpeta_desconocido_da_error(self):
        p = write_kata(self.tmp.name, dict(GOOD, concept="wat"), slug="wat")
        errs = validate_library.validate_kata(p)
        self.assertTrue(any("slug" in e.lower() for e in errs))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Ejecutar y ver que falla**

```bash
python -m unittest tests.test_validate_library -v
```

Expected: `ModuleNotFoundError: No module named 'validate_library'`.

- [ ] **Step 3: Implementar `scripts/validate_library.py`**

```python
#!/usr/bin/env python3
"""Valida los esqueletos de kata de una biblioteca muscle-memory.

Por cada <library>/<slug>/katas/*.json comprueba: campos, tipos, que stub/canonical/test
parsean, que el slug es canonico y coincide con la carpeta, y que la solucion canonica
pasa sus propios tests (ejecucion real, igual que hara Pyodide).

Uso: python validate_library.py <library_dir>
"""

import ast
import json
import sys
from pathlib import Path

from scan_repo import CONCEPT_SLUGS

REQUIRED = {"concept": str, "level": int, "title_en": str,
            "spec_html_en": str, "stub": str, "test": str, "canonical": str}


def _run_canonical(kata):
    """Ejecuta canonical + test y corre las test_*. Devuelve lista de errores."""
    ns = {}
    try:
        exec(kata["canonical"], ns)  # noqa: S102 - contenido propio de la biblioteca
        exec(kata["test"], ns)
    except Exception as e:  # noqa: BLE001
        return [f"canonical/test raised at import time: {e!r}"]
    errors = []
    tests = [(n, f) for n, f in ns.items() if n.startswith("test_") and callable(f)]
    if not tests:
        return ["no test_* functions found"]
    for name, fn in tests:
        try:
            fn()
        except Exception as e:  # noqa: BLE001
            errors.append(f"{name} failed against canonical: {e!r}")
    return errors


def validate_kata(path):
    path = Path(path)
    errors = []
    try:
        kata = json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError) as e:
        return [f"unreadable JSON: {e}"]

    for field, typ in REQUIRED.items():
        if field not in kata:
            errors.append(f"missing field: {field}")
        elif not isinstance(kata[field], typ):
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

    errors.extend(_run_canonical(kata))
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
```

- [ ] **Step 4: Verde y commit**

```bash
python -m unittest tests.test_validate_library -v
git add scripts/validate_library.py tests/test_validate_library.py
git commit -m "feat: validador de esqueletos de la biblioteca"
```

Expected: `OK` (4 tests).

---

### Task 4: `scripts/build_session.py` — volcado mecánico de sesiones

Claude escribe UNA cosa en generate: un JSON de sesión adaptada. Este script hace el resto (escapado, manifest, canónicas, progreso), que es donde el prototipo perdía tiempo y podía romper el JS.

**Files:**
- Create: `scripts/build_session.py`
- Test: `tests/test_build_session.py`

**Interfaces:**
- Consumes: JSON de sesión con `id, date, project, title, lang, katas[]` donde cada kata tiene `id, title, concept, level, spec_html, stub, test, canonical, skeleton` (mismos nombres que el esqueleto pero ya adaptados/traducidos; `canonical` NO va a la app, se separa aquí; `skeleton` es el origen en la biblioteca, formato `<slug>/<archivo-sin-.json>`, p. ej. `"classes/l1-init"`).
- Produces: CLI `python build_session.py <session.json> <user_dir>` → escribe `user_dir/sessions/<id>.js` (sin campo canonical), reescribe `user_dir/sessions/manifest.js`, escribe `user_dir/sessions/canonical/<id>__<kata-id>.py`, añade la sesión a `user_dir/progress.json` (`sessions[]` con `id`, `concepts` y `skeletons`; crea el archivo si no existe, esquema `{"concepts": {}, "excluded": [], "sessions": []}`), y APPENDEA a `user_dir/history.md` una entrada `## <date> — <project>` con la línea `- Sesion: <concept> (N<level>), ...` (crea el archivo con el título `# Training history` si no existe). Formato del .js: `window.MM_SESSIONS = window.MM_SESSIONS || [];\nwindow.MM_SESSIONS.push(<json.dumps>);`. Manifest: `window.MM_MANIFEST = [<archivos, mas reciente primero>];`.

- [ ] **Step 1: Escribir el test que falla**

`tests/test_build_session.py`:

```python
"""Tests del constructor de sesiones."""
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parent.parent / "scripts" / "build_session.py"

SESSION = {
    "id": "2026-07-16-demo",
    "date": "2026-07-16",
    "project": "demo",
    "title": "Session 1 - classes",
    "lang": "es",
    "katas": [{
        "id": "kata-01",
        "title": "Completa el constructor",
        "concept": "classes",
        "level": 1,
        "spec_html": "<p>Guarda <code>name</code>.</p>",
        "stub": "class User:\n    # TODO\n    ...",
        "test": "def test_name():\n    assert User('Ana').name == 'Ana', 'debe guardar name'",
        "canonical": "class User:\n    def __init__(self, name):\n        self.name = name",
        "skeleton": "classes/l1-init",
    }],
}


def run_build(session, user_dir):
    src = Path(user_dir) / "session_input.json"
    src.write_text(json.dumps(session), encoding="utf-8")
    return subprocess.run([sys.executable, str(SCRIPT), str(src), str(user_dir)],
                          capture_output=True, text=True)


class TestBuildSession(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.dir = Path(self.tmp.name)

    def tearDown(self):
        self.tmp.cleanup()

    def test_escribe_js_manifest_canonica_y_progreso(self):
        proc = run_build(SESSION, self.dir)
        self.assertEqual(proc.returncode, 0, proc.stderr)
        js = (self.dir / "sessions" / "2026-07-16-demo.js").read_text(encoding="utf-8")
        self.assertIn("MM_SESSIONS.push", js)
        self.assertNotIn("canonical", js, "la canonica no debe llegar a la app")
        manifest = (self.dir / "sessions" / "manifest.js").read_text(encoding="utf-8")
        self.assertIn("2026-07-16-demo.js", manifest)
        canon = self.dir / "sessions" / "canonical" / "2026-07-16-demo__kata-01.py"
        self.assertTrue(canon.is_file())
        progress = json.loads((self.dir / "progress.json").read_text(encoding="utf-8"))
        self.assertEqual(progress["sessions"][0]["id"], "2026-07-16-demo")
        self.assertEqual(progress["sessions"][0]["concepts"], ["classes"])
        self.assertEqual(progress["sessions"][0]["skeletons"], ["classes/l1-init"])
        self.assertEqual(progress["excluded"], [])

    def test_appendea_historial_legible(self):
        run_build(SESSION, self.dir)
        second = dict(SESSION, id="2026-07-17-demo", date="2026-07-17")
        run_build(second, self.dir)
        history = (self.dir / "history.md").read_text(encoding="utf-8")
        self.assertIn("# Training history", history)
        self.assertIn("## 2026-07-16 — demo", history)
        self.assertIn("## 2026-07-17 — demo", history)
        self.assertIn("classes (N1)", history)
        self.assertLess(history.index("2026-07-16"), history.index("2026-07-17"),
                        "el historial es append-only, cronologico")

    def test_manifest_pone_lo_mas_reciente_primero(self):
        run_build(SESSION, self.dir)
        second = dict(SESSION, id="2026-07-17-demo", date="2026-07-17")
        run_build(second, self.dir)
        manifest = (self.dir / "sessions" / "manifest.js").read_text(encoding="utf-8")
        self.assertLess(manifest.index("2026-07-17-demo.js"),
                        manifest.index("2026-07-16-demo.js"))

    def test_kata_invalida_falla_con_mensaje(self):
        bad = json.loads(json.dumps(SESSION))
        del bad["katas"][0]["stub"]
        proc = run_build(bad, self.dir)
        self.assertNotEqual(proc.returncode, 0)
        self.assertIn("stub", proc.stderr + proc.stdout)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Ejecutar y ver que falla**

```bash
python -m unittest tests.test_build_session -v
```

Expected: FAIL (script inexistente, returncode != 0 en el primer test).

- [ ] **Step 3: Implementar `scripts/build_session.py`**

```python
#!/usr/bin/env python3
"""Vuelca una sesion adaptada al directorio de datos del usuario.

Entrada: JSON de sesion (katas ya adaptadas, con campo canonical).
Salidas: sessions/<id>.js (sin canonical), manifest.js regenerado,
canonicas en sessions/canonical/, y registro en progress.json.
"""

import json
import sys
from pathlib import Path

SESSION_FIELDS = ("id", "date", "project", "title", "lang", "katas")
KATA_FIELDS = ("id", "title", "concept", "level", "spec_html", "stub", "test", "canonical", "skeleton")


def fail(msg):
    print(f"[error] {msg}", file=sys.stderr)
    sys.exit(1)


def load_session(path):
    try:
        session = json.loads(Path(path).read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError) as e:
        fail(f"unreadable session JSON: {e}")
    for f in SESSION_FIELDS:
        if f not in session:
            fail(f"session missing field: {f}")
    if not session["katas"]:
        fail("session has no katas")
    for kata in session["katas"]:
        for f in KATA_FIELDS:
            if f not in kata:
                fail(f"kata {kata.get('id', '?')} missing field: {f}")
    return session


def write_outputs(session, user_dir):
    sessions_dir = Path(user_dir) / "sessions"
    canonical_dir = sessions_dir / "canonical"
    canonical_dir.mkdir(parents=True, exist_ok=True)

    # 1. Canonicas fuera de la app
    for kata in session["katas"]:
        (canonical_dir / f"{session['id']}__{kata['id']}.py").write_text(
            kata["canonical"], encoding="utf-8")
    public = dict(session)
    public["katas"] = [{k: v for k, v in kata.items() if k != "canonical"}
                       for kata in session["katas"]]

    # 2. Archivo de sesion (JS para poder cargarse desde file://)
    js = ("window.MM_SESSIONS = window.MM_SESSIONS || [];\n"
          f"window.MM_SESSIONS.push({json.dumps(public, ensure_ascii=False, indent=2)});\n")
    (sessions_dir / f"{session['id']}.js").write_text(js, encoding="utf-8")

    # 3. Manifest regenerado del contenido real de la carpeta, mas reciente primero
    files = sorted((p.name for p in sessions_dir.glob("*.js") if p.name != "manifest.js"),
                   reverse=True)
    (sessions_dir / "manifest.js").write_text(
        f"window.MM_MANIFEST = {json.dumps(files, indent=2)};\n", encoding="utf-8")

    # 4. Progreso: registrar la sesion con sus esqueletos (los aciertos los anota review)
    progress_path = Path(user_dir) / "progress.json"
    if progress_path.is_file():
        progress = json.loads(progress_path.read_text(encoding="utf-8"))
    else:
        progress = {"concepts": {}, "excluded": [], "sessions": []}
    progress.setdefault("excluded", [])
    progress["sessions"] = [s for s in progress["sessions"] if s["id"] != session["id"]]
    progress["sessions"].append(
        {"id": session["id"],
         "concepts": [k["concept"] for k in session["katas"]],
         "skeletons": [k["skeleton"] for k in session["katas"]]})
    progress_path.write_text(json.dumps(progress, ensure_ascii=False, indent=2),
                             encoding="utf-8")

    # 5. Track record legible: una entrada por sesion, append-only
    history_path = Path(user_dir) / "history.md"
    if not history_path.is_file():
        history_path.write_text("# Training history\n", encoding="utf-8")
    concepts_line = ", ".join(f"{k['concept']} (N{k['level']})" for k in session["katas"])
    entry = f"\n## {session['date']} — {session['project']}\n- Sesion: {concepts_line}\n"
    with open(history_path, "a", encoding="utf-8") as f:
        f.write(entry)


def main():
    if len(sys.argv) != 3:
        fail("usage: build_session.py <session.json> <user_dir>")
    session = load_session(sys.argv[1])
    write_outputs(session, sys.argv[2])
    print(f"Session {session['id']} written: {len(session['katas'])} katas")


if __name__ == "__main__":
    main()
```

- [ ] **Step 4: Verde y commit**

```bash
python -m unittest tests.test_build_session -v
git add scripts/build_session.py tests/test_build_session.py
git commit -m "feat: constructor mecanico de sesiones (js + manifest + canonicas + progreso + historial)"
```

Expected: `OK` (4 tests).

---

### Task 5: Biblioteca semilla — fundamentos (9 conceptos)

Contenido, no código: 9 fichas con esqueletos. El gate es `validate_library.py` en verde.

**Files:**
- Create: `assets/library-seed/<slug>/card.md` y `assets/library-seed/<slug>/katas/l<level>-<slug>.json` para: `classes, methods, properties, dataclasses, dunder-methods, inheritance, exceptions, typing, enums`.

**Interfaces:**
- Consumes: formato de esqueleto de Task 3 (`concept, level, title_en, spec_html_en, stub, test, canonical`).
- Produces: 9 carpetas con `card.md` + 2 esqueletos cada una (niveles 1 y 2), que Tasks 6-7 imitan y Task 8 usa como fixture.

**Formato de `card.md`** (obligatorio, mismas 4 secciones siempre; en inglés):

```markdown
# Classes and `__init__`

## What it is
One short paragraph: what the concept is and when you reach for it.

## Idiomatic example
```python
class Ticket:
    def __init__(self, title: str, priority: int = 0):
        self.title = title
        self.priority = priority
```

## Common mistakes
- Bullet list, 2-4 items (e.g. forgetting `self`, mutable default arguments).

## Where you see it in real code
- 1-3 bullets tying it to real-world usage (ORM models, service classes...).
```

**Esqueleto ejemplo completo** — `assets/library-seed/classes/katas/l1-init.json` (los demás siguen exactamente esta forma; reglas: ≤25 líneas a escribir, un concepto, stdlib puro, 2-3 asserts con mensaje didáctico, stub con firmas):

```json
{
  "concept": "classes",
  "level": 1,
  "title_en": "Fill in the constructor",
  "spec_html_en": "<p>The class <code>Account</code> needs its constructor: store <code>owner</code> and start <code>balance</code> at 0.</p>",
  "stub": "class Account:\n    # TODO: __init__ storing owner, balance starts at 0\n    ...\n\n    def deposit(self, amount):\n        self.balance += amount\n",
  "test": "def test_stores_owner():\n    a = Account('Ana')\n    assert a.owner == 'Ana', 'constructor must store owner'\n\ndef test_balance_starts_at_zero():\n    a = Account('Ana')\n    assert a.balance == 0, 'a new account must start with balance 0'\n\ndef test_deposit_works_on_top():\n    a = Account('Ana')\n    a.deposit(50)\n    assert a.balance == 50, 'deposit(50) on a fresh account must leave balance 50'",
  "canonical": "class Account:\n    def __init__(self, owner):\n        self.owner = owner\n        self.balance = 0\n\n    def deposit(self, amount):\n        self.balance += amount\n"
}
```

- [ ] **Step 1: Escribir las 9 fichas (card.md) siguiendo el formato de 4 secciones**
- [ ] **Step 2: Escribir 2 esqueletos por concepto (l1 y l2)**. Guía por concepto: `classes` l1 rellenar `__init__` / l2 clase completa desde spec · `methods` instance vs `@staticmethod`/`@classmethod` · `properties` property de solo lectura / property+setter con validación · `dataclasses` campos y defaults / `field(default_factory=...)` · `dunder-methods` `__repr__`+`__eq__` / `__len__`+`__iter__` · `inheritance` subclase con `super().__init__` / override de método · `exceptions` excepción custom / `try/except/else/finally` · `typing` anotar firmas con `Optional`/`|` / `TypedDict` · `enums` Enum básico / Enum con método.
- [ ] **Step 3: Validar todo**

```bash
python scripts/validate_library.py assets/library-seed
```

Expected: `18/18 skeletons valid`, exit 0. Si algo falla, arreglar y repetir.

- [ ] **Step 4: Commit**

```bash
git add assets/library-seed
git commit -m "feat: biblioteca semilla, fundamentos (9 conceptos, 18 katas)"
```

---

### Task 6: Biblioteca semilla — intermedio (6 conceptos)

**Files:**
- Create: `assets/library-seed/<slug>/...` para `context-managers, decorators, generators, comprehensions, iterators, async`.

**Interfaces:** idénticas a Task 5.

- [ ] **Step 1: Fichas + 2 esqueletos por concepto (niveles 2 y 3, salvo la excepción indicada)**. Guía: `context-managers` `__enter__/__exit__` / `contextlib.contextmanager` · `decorators` decorador simple / decorador con argumentos · `generators` generador básico / pipeline con `yield` · `comprehensions` list+dict comprehension (l2) / refactor de bucle a comprehension (l4, archivo `l4-...json`, con la versión naíf incluida en el stub) · `iterators` `__iter__`/`__next__` / protocolo con `StopIteration` · `async` corrutina básica con `asyncio.run` / `asyncio.gather`. **Ojo async en Pyodide**: los tests síncronos deben usar `asyncio.run(...)` dentro del test, no top-level await.
- [ ] **Step 2: Validar y commit**

```bash
python scripts/validate_library.py assets/library-seed
git add assets/library-seed
git commit -m "feat: biblioteca semilla, intermedio (6 conceptos)"
```

Expected: `30/30 skeletons valid`.

---

### Task 7: Biblioteca semilla — patrones (5 conceptos)

**Files:**
- Create: `assets/library-seed/<slug>/...` para `factory, strategy, observer, adapter, singleton`.

**Interfaces:** idénticas a Task 5.

- [ ] **Step 1: Fichas + 2 esqueletos por concepto (niveles 2 y 3)**. Guía: `factory` función factory por clave / factory con registro (dict de constructores) · `strategy` función como estrategia / intercambio en runtime · `observer` suscripción + notify / desuscripción · `adapter` envolver interfaz incompatible / adapter con composición · `singleton` implementación con `__new__` + **card.md debe incluir la crítica** (por qué suele ser mala idea, alternativas: módulo, inyección).
- [ ] **Step 2: Validar y commit**

```bash
python scripts/validate_library.py assets/library-seed
git add assets/library-seed
git commit -m "feat: biblioteca semilla, patrones (5 conceptos)"
```

Expected: `40/40 skeletons valid`.

---

### Task 8: La app — `assets/app/index.html`

Un archivo autocontenido (CSS/JS inline; CodeMirror y Pyodide por CDN). **Al implementar, cargar la skill `frontend-design` para el pase visual** — los requisitos de abajo son funcionales; el look debe ser intencional, no plantilla. Referencia funcional: el prototipo (`plantilla.html`) resolvía bien el runner Pyodide; su lógica se transcribe abajo adaptada.

**Files:**
- Create: `assets/app/index.html`

**Interfaces:**
- Consumes: `sessions/manifest.js` (`window.MM_MANIFEST: string[]`) y archivos de sesión (`window.MM_SESSIONS.push({...})`) con el formato exacto de Task 4. La app vive en `app/index.html`, así que las rutas relativas son `../sessions/manifest.js` y `../sessions/<file>`.
- Produces: UI en inglés con: pantalla de selector de sesiones, vista de kata, panel de progreso local, descarga de solución.

**Requisitos funcionales (checklist de aceptación):**

1. **Carga de datos sin servidor**: incluir `<script src="../sessions/manifest.js">`; en el arranque, por cada entrada de `MM_MANIFEST` inyectar `<script src="../sessions/" + file>` dinámicamente y esperar sus `onload`/`onerror`; al terminar, renderizar con `window.MM_SESSIONS`. Si no hay manifest o está vacío → pantalla de bienvenida: "No sessions yet — ask Claude for a training session".
2. **Selector de sesiones**: lista con fecha, proyecto, título y nº de katas superadas (de localStorage). La más reciente arriba y abierta por defecto.
3. **Vista de kata**: tabs/lista de las 3 katas (título, concepto, nivel, ✓ si superada), enunciado (`spec_html`), editor CodeMirror (modo python), botones **Run**, **Download solution**, **Reset**.
4. **Runner Pyodide** (lógica del prototipo, funciona): al pulsar Run, pasar `_USER_CODE` y `_TEST_CODE` como globals y ejecutar este runner, que devuelve JSON:

```python
import json, traceback
_ns = {}
_out = {"compiles": True, "error": None, "results": []}
try:
    exec(_USER_CODE, _ns)
except Exception:
    _out["compiles"] = False
    _out["error"] = traceback.format_exc()
if _out["compiles"]:
    try:
        exec(_TEST_CODE, _ns)
    except Exception:
        _out["compiles"] = False
        _out["error"] = traceback.format_exc()
if _out["compiles"]:
    for _n, _f in list(_ns.items()):
        if _n.startswith("test_") and callable(_f):
            try:
                _f()
                _out["results"].append({"name": _n, "ok": True, "error": None})
            except AssertionError as e:
                _out["results"].append({"name": _n, "ok": False, "error": str(e) or "assert failed"})
            except Exception as e:
                _out["results"].append({"name": _n, "ok": False, "error": type(e).__name__ + ": " + str(e)})
json.dumps(_out)
```

   Mostrar: banner de estado (all green / N of M / does not compile con traceback), una línea por test con su mensaje. Estado de carga de Pyodide visible ("Loading Python..." → "Python ready"); botón Run deshabilitado hasta ready.
5. **Persistencia local**: código en curso por kata (`mm_code_<sessionId>_<kataId>`) y superadas (`mm_done`, objeto `{"<sessionId>_<kataId>": true}`) en localStorage. Reset vuelve al stub (con confirm).
6. **Download solution**: descarga `<kataId>_solution.py` con cabecera comentada (kata, concepto, fecha) via Blob. Hint en la UI: guardarla en `~/muscle-memory/solutions/` y pedir revisión a Claude.
7. **Panel de progreso**: por sesión, katas superadas / total (localStorage). Nada de leer progress.json (fuente de verdad de Claude, no de la app).
8. **UI**: inglés, tema claro/oscuro (seguir `prefers-color-scheme` + toggle), responsive (el editor usable en tablet; en móvil aviso amable de que mejor pantalla grande), estados vacíos cuidados, celebración discreta al superar una kata.

**Pasos:**

- [ ] **Step 1: Fixture de prueba** — construir una sesión real de fixture usando los scripts ya hechos:

```bash
cd /c/Users/Usuario/.claude/skills/muscle-memory
mkdir -p /tmp/mm-fixture && python - <<'PY'
import json, subprocess, sys
from pathlib import Path
kata = json.loads(Path("assets/library-seed/classes/katas/l1-init.json").read_text(encoding="utf-8"))
session = {"id": "2026-07-16-fixture", "date": "2026-07-16", "project": "fixture",
           "title": "Fixture session", "lang": "en",
           "katas": [{"id": "kata-01", "title": kata["title_en"], "concept": kata["concept"],
                      "level": kata["level"], "spec_html": kata["spec_html_en"],
                      "stub": kata["stub"], "test": kata["test"], "canonical": kata["canonical"],
                      "skeleton": "classes/l1-init"}]}
Path("/tmp/mm-session.json").write_text(json.dumps(session), encoding="utf-8")
subprocess.run([sys.executable, "scripts/build_session.py", "/tmp/mm-session.json", "/tmp/mm-fixture"], check=True)
PY
mkdir -p /tmp/mm-fixture/app && cp assets/app/index.html /tmp/mm-fixture/app/ 2>/dev/null || true
```

- [ ] **Step 2: Implementar `index.html`** cumpliendo la checklist 1-8 (con `frontend-design` para el pase visual).
- [ ] **Step 3: Verificación manual en navegador** — copiar el html al fixture (`cp assets/app/index.html /tmp/mm-fixture/app/`), abrir `/tmp/mm-fixture/app/index.html` con doble clic y comprobar la checklist completa: sesión visible, kata carga, Run con el stub → rojo con mensajes, pegar la canónica → todo verde + ✓ persistente tras recargar, Download descarga el .py, Reset restaura, tema oscuro/claro, y estado vacío (abrir el html sin carpeta sessions al lado).
- [ ] **Step 4: Commit**

```bash
git add assets/app/index.html
git commit -m "feat: app web estatica (selector de sesiones, editor, runner pyodide)"
```

---

### Task 9: `SKILL.md`, `references/kata-authoring.md` y README del usuario

El cerebro de la skill: los 4 flujos operando sobre las piezas ya construidas.

**Files:**
- Create: `SKILL.md`, `references/kata-authoring.md`, `assets/user-readme.md`

**Interfaces:**
- Consumes: todo lo anterior (scripts por ruta, formatos de datos, app).
- Produces: skill invocable. Frontmatter de SKILL.md: `name: muscle-memory`; `description` en inglés con disparadores en inglés Y español ("quiero practicar", "ponme ejercicios", "keep my coding sharp", "practice session", "review my solution", "how am I doing")..

**Contenido obligatorio de SKILL.md** (secciones; redactar en inglés, conciso como el prototipo pero con las rutas nuevas):

1. **Purpose + mode detection**: generate (default) / review / progress; en caso de duda preguntar en una línea. Añadir a los disparadores del description: "ya no quiero practicar X" / "stop asking me about X" (modo progress, retirada de tema).
2. **Bootstrap (automático, idempotente)**: si `~/muscle-memory/` no existe → copiar `assets/app/` → `~/muscle-memory/app/`, `assets/library-seed/` → `~/muscle-memory/library/`, `assets/user-readme.md` → `~/muscle-memory/README.md`, crear `sessions/`, `solutions/` y `progress.json` (`{"concepts": {}, "sessions": []}`). Si existe, no tocar nada (la app solo se recopia si el usuario pide actualizarla).
3. **Generate**: (a) `python <skill>/scripts/scan_repo.py --days 7 --repo <cwd>`; sin git o sin señales → avisar y ofrecer elegir de `~/muscle-memory/library/`; (b) elegir 3 conceptos: fallados según `progress.json` primero (espaciado), luego nuevos del scan, luego fundamentos relacionados; nivel según `progress.json.concepts[slug].level` (default 1); **reglas de balanceo obligatorias**: nunca conceptos de `progress.json.excluded`; no repetir un concepto dominado dos sesiones seguidas (los fallados sí repiten); no reutilizar esqueletos de las últimas 3 sesiones (`sessions[].skeletons`) — variar de la biblioteca o adaptar distinto; consultar `history.md` para el contexto ("qué toca esta semana"); cada kata del JSON de sesión lleva su campo `skeleton` (`<slug>/<archivo-sin-.json>`); (c) por concepto, leer `library/<slug>/katas/l<level>-*.json`, adaptarlo: traducir enunciado al idioma de la conversación y recontextualizar nombres al dominio del repo (si no aporta, traducir tal cual); si no hay ficha del concepto → crearla (card + 1-2 esqueletos siguiendo `references/kata-authoring.md`), validarla con `python <skill>/scripts/validate_library.py ~/muscle-memory/library` y seguir; (d) escribir el JSON de sesión a un archivo temporal y ejecutar `python <skill>/scripts/build_session.py <tmp.json> ~/muscle-memory`; (e) decir al usuario que abra/recargue `~/muscle-memory/app/index.html`, en 2 frases. **Presupuesto: sin fichas nuevas, generar debe costar ~1 min.**
4. **Review**: leer solución de `~/muscle-memory/solutions/` (o chat); ejecutar contra el test de la kata con `python` local (todo stdlib) — si no hay Python decirlo y usar el verde/rojo que reporte el usuario; comparar con `sessions/canonical/<sessionId>__<kataId>.py`; feedback como diff, máximo 2-3 mejoras, tono entrenador (celebrar antes de corregir); actualizar `progress.json`: `concepts[slug]` → `seen+=1`, `passed+=1` si pasó, `last=<fecha>`, subir `level` (máx 4) con 2 aciertos seguidos en el nivel actual, bajar si 2 fallos seguidos; anotar el resultado en `history.md` (append: `- Resultado: X/Y en verde; <concepto> fallada (<motivo corto>)`).
5. **Progress**: resumen corto desde `progress.json` + `history.md` (dominados / flojos / qué toca); ajustes a petición ("sube nivel") editando el JSON; **retirada de temas**: si el usuario dice "ya no quiero practicar X / ya me lo sé" → añadir el slug a `progress.json.excluded` y anotar en `history.md` (`- Usuario retira "X": ya lo domina. No volver a proponerlo.`); reactivar (sacar de `excluded` + anotar) si lo pide.
6. **Non-negotiables** (del prototipo, siguen vigentes): katas ≤10 min; salen del código del usuario (genéricas solo como fallback); ejecutar antes de opinar; entrenador, no juez; nunca escribir fuera de `~/muscle-memory/`.

**`references/kata-authoring.md`**: adaptación del `generacion-katas.md` del prototipo (está íntegro en `docs/2026-07-16-muscle-memory-design.md` §7 en resumen; contenido fuente en el zip del prototipo): mapeo señal→slug canónico, reglas de brevedad (≤25 líneas, 1 concepto, 1-3 frases de spec, stdlib/Pyodide), cómo escribir tests (`test_*`, asserts con mensaje didáctico, caso normal + borde + error esperado, sin depender de orden de dict ni tiempos exactos), un ejemplo completo por nivel (1-4), y errores a evitar. Redactar en inglés. Añadir sección nueva: **cómo adaptar un esqueleto** (traducir enunciado, renombrar al dominio del repo, NO tocar la estructura del test salvo renombres consistentes en stub+test+canonical).

**`assets/user-readme.md`**: media página en inglés: qué es cada carpeta, cómo abrir la app, cómo pedir sesión/revisión a Claude.

- [ ] **Step 1: Escribir los tres archivos según lo anterior**
- [ ] **Step 2: Revisión de consistencia** — comprobar que cada ruta/comando citado en SKILL.md existe (`scripts/scan_repo.py`, `scripts/build_session.py`, `scripts/validate_library.py`, `assets/app/index.html`, formato de progreso de Task 4).
- [ ] **Step 3: Commit**

```bash
git add SKILL.md references/kata-authoring.md assets/user-readme.md
git commit -m "feat: SKILL.md con los 4 flujos, guia de autoria y readme de usuario"
```

---

### Task 10: Verificación end-to-end (criterios de éxito de la spec)

**Files:** ninguno nuevo (se crea `~/muscle-memory/` real).

- [ ] **Step 1: Suite completa en verde**

```bash
cd /c/Users/Usuario/.claude/skills/muscle-memory
python -m unittest discover -s tests -v
python scripts/validate_library.py assets/library-seed
```

Expected: todos OK, `40/40 skeletons valid`.

- [ ] **Step 2: Bootstrap real** — seguir SKILL.md al pie de la letra para montar `C:\Users\Usuario\muscle-memory\`. Verificar: estructura completa, `progress.json` vacío válido, app abre con doble clic y muestra el estado "no sessions yet".
- [ ] **Step 3: Generate real desde ATI** — desde `C:\Users\Usuario\Documents\GitHub\ATI_PLATFORM`, ejecutar el flujo generate completo cronometrando: scan → 3 conceptos → adaptar → build_session → abrir app. Criterio: <2 min de principio a fin sin fichas nuevas; katas en español con contexto del dominio ATI; **cero escrituras fuera de `~/muscle-memory/`** (comprobar `git status` limpio en ATI).
- [ ] **Step 4: Resolver y revisar** — resolver una kata en la app (verde), descargarla a `solutions/`, ejecutar el flujo review: feedback con diff contra canónica y `progress.json` actualizado (seen/passed/last).
- [ ] **Step 5: Repetición espaciada y balanceo** — simular un fallo (editar `progress.json`: un concepto con `passed < seen`) y generar otra sesión: el concepto fallado debe reaparecer. Verificar además que: `history.md` tiene una entrada por sesión y por review; un slug metido en `excluded` NO aparece en la nueva sesión aunque el scan lo detecte; y los `skeletons` de la sesión anterior no se reutilizan.
- [ ] **Step 6: Commit final y cierre**

```bash
git add -A
git commit -m "chore: verificacion e2e completada"
```

Marcar los criterios de éxito de la spec §9 uno a uno; el que falle, arreglar antes de dar por terminado.
