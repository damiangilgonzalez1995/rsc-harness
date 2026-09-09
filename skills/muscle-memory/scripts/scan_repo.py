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


# Nodos que denotan "logica real" (no glue): ramas, bucles, comprehensions,
# comparaciones, manejo de errores... Cuantos mas, mas jugosa es la funcion
# para convertirla en una kata de reconstruccion.
_LOGIC_NODES = (
    ast.If, ast.For, ast.While, ast.Try, ast.With, ast.Raise, ast.Assert,
    ast.BoolOp, ast.Compare, ast.IfExp, ast.comprehension,
    ast.ListComp, ast.SetComp, ast.DictComp, ast.GeneratorExp,
)


def _signature(fn):
    """Firma legible: nombre(arg1, arg2, ...) sin tipos, para el menu del scan."""
    a = fn.args
    parts = [arg.arg for arg in (a.posonlyargs + a.args)]
    if a.vararg:
        parts.append("*" + a.vararg.arg)
    if a.kwonlyargs:
        if not a.vararg:
            parts.append("*")
        parts.extend(arg.arg for arg in a.kwonlyargs)
    if a.kwarg:
        parts.append("**" + a.kwarg.arg)
    return f"{fn.name}({', '.join(parts)})"


def _logic_score(fn):
    """Cuenta nodos de logica dentro de la funcion (excluye su propia cabecera)."""
    return sum(1 for n in ast.walk(fn) if isinstance(n, _LOGIC_NODES))


def _reconstruction_candidates(tree):
    """Funciones/metodos con logica reconstruible, ordenados por riqueza de logica.

    Devuelve lista de dicts: name, qualname, sig, line, score, is_async.
    Se salta cabeceras triviales (score < 2) y los dunder salvo los interesantes.
    """
    out = []
    for node in ast.walk(tree):
        if isinstance(node, ast.ClassDef):
            for m in node.body:
                if isinstance(m, (ast.FunctionDef, ast.AsyncFunctionDef)):
                    _maybe_candidate(out, m, prefix=node.name + ".")
        elif isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            # Solo funciones a nivel de modulo aqui; los metodos ya salen arriba.
            if not any(node in getattr(c, "body", []) for c in ast.walk(tree)
                       if isinstance(c, ast.ClassDef)):
                _maybe_candidate(out, node, prefix="")
    out.sort(key=lambda c: -c["score"])
    return out


def _maybe_candidate(out, fn, prefix):
    score = _logic_score(fn)
    if score < 2:
        return
    if fn.name.startswith("__") and fn.name.endswith("__") and fn.name != "__eq__":
        return
    out.append({
        "name": fn.name,
        "cls": prefix,  # "Clase." o "" ; la firma ya incluye el nombre de la funcion
        "sig": _signature(fn),
        "line": fn.lineno,
        "score": score,
        "is_async": isinstance(fn, ast.AsyncFunctionDef),
    })


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
            # Captura bases simples (ast.Name) y cualificadas (ast.Attribute).
            # Ej: class Status(Enum) -> "Enum", class Status(enum.Enum) -> "Enum"
            bases = []
            for b in node.bases:
                if isinstance(b, ast.Name):
                    bases.append(b.id)
                elif isinstance(b, ast.Attribute):
                    bases.append(b.attr)
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
        "candidates": _reconstruction_candidates(tree),
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
    all_candidates = []
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
        for c in info["candidates"]:
            c["file"] = rel
            all_candidates.append(c)
        print()

    # Menu principal para Generate: codigo REAL que merece reconstruir como kata.
    # Cada linea es un simbolo del repo; Generate lee su fuente y lo reconstruye
    # en Python puro (misma logica y nombres, sin dependencias del framework).
    if all_candidates:
        all_candidates.sort(key=lambda c: -c["score"])
        print("## Reconstruction candidates (real code to turn into katas)")
        print("Read each symbol's source and rebuild it as a stdlib-only kata.\n")
        for c in all_candidates[:20]:
            tag = "async " if c["is_async"] else ""
            print(f"- {c['file']}:{c['line']} {tag}{c['cls']}{c['sig']} "
                  f"[logic {c['score']}]")
        print()

    if global_signals:
        print("## Candidate concepts (for progress/leveling)")
        for slug, n in sorted(global_signals.items(), key=lambda x: -x[1]):
            print(f"- {slug} (in {n} file/s)")


if __name__ == "__main__":
    main()
