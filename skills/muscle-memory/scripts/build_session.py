#!/usr/bin/env python3
"""Vuelca una sesion adaptada al directorio de datos del usuario.

Entrada: JSON de sesion (katas ya adaptadas, con campo canonical).
Salidas: sessions/<id>.js (sin canonical), manifest.js regenerado,
canonicas en sessions/canonical/, y registro en progress.json.
"""

import json
import re
import sys
from pathlib import Path

SESSION_FIELDS = ("id", "date", "project", "title", "lang", "katas")
KATA_FIELDS = ("id", "title", "concept", "level", "spec_html", "stub", "test", "canonical", "skeleton")


def fail(msg):
    print(f"[error] {msg}", file=sys.stderr)
    sys.exit(1)


def _natural_key(filename):
    """Clave de orden natural: los tramos numericos del nombre (sin .js)
    se comparan como int, no como string, para que '-2' ordene tras la
    base y '-10' tras '-2' (sorted(..., reverse=True) da el mas reciente
    primero de verdad, no solo por orden ASCII de caracteres)."""
    stem = filename[:-3] if filename.endswith(".js") else filename
    return [int(part) if part.isdigit() else part
            for part in re.split(r"(\d+)", stem)]


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

    # 1. Canonicas fuera de la app (primero limpiar huerfanas de una regeneracion
    #    con menos katas que la vez anterior)
    for old_canonical in canonical_dir.glob(f"{session['id']}__*.py"):
        old_canonical.unlink()
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
    #    (orden natural sobre el nombre, no orden ASCII puro: ver _natural_key)
    files = sorted((p.name for p in sessions_dir.glob("*.js") if p.name != "manifest.js"),
                   key=_natural_key, reverse=True)
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
    #    (idempotente: reejecutar el mismo id no debe duplicar su entrada)
    history_path = Path(user_dir) / "history.md"
    if not history_path.is_file():
        history_path.write_text("# Training history\n", encoding="utf-8")
    history_content = history_path.read_text(encoding="utf-8")
    marker = f"<!-- session: {session['id']} -->"
    if marker not in history_content:
        concepts_line = ", ".join(f"{k['concept']} (N{k['level']})" for k in session["katas"])
        entry = (f"\n## {session['date']} — {session['project']}\n"
                 f"{marker}\n- Sesion: {concepts_line}\n")
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
