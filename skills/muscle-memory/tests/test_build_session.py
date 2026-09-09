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

    def test_manifest_orden_natural_mismo_dia(self):
        run_build(SESSION, self.dir)
        second = dict(SESSION, id="2026-07-16-demo-2")
        run_build(second, self.dir)
        manifest = (self.dir / "sessions" / "manifest.js").read_text(encoding="utf-8")
        self.assertLess(
            manifest.index("2026-07-16-demo-2.js"),
            manifest.index("2026-07-16-demo.js"),
            "la sesion mas reciente del mismo dia (sufijo -2) debe ir primero "
            "(orden natural, no orden de string puro)")

    def test_historial_idempotente_al_reejecutar_mismo_id(self):
        run_build(SESSION, self.dir)
        run_build(SESSION, self.dir)
        history = (self.dir / "history.md").read_text(encoding="utf-8")
        self.assertEqual(
            history.count(f"<!-- session: {SESSION['id']} -->"), 1,
            "reejecutar la misma sesion no debe duplicar su entrada en history.md")
        self.assertEqual(history.count("## 2026-07-16 — demo"), 1)

    def test_limpia_canonicas_huerfanas_al_regenerar(self):
        session_dos_katas = dict(SESSION)
        session_dos_katas["katas"] = SESSION["katas"] + [{
            "id": "kata-02",
            "title": "Segunda kata",
            "concept": "classes",
            "level": 1,
            "spec_html": "<p>Otra kata.</p>",
            "stub": "class Other:\n    ...",
            "test": "def test_other():\n    assert Other()",
            "canonical": "class Other:\n    pass",
            "skeleton": "classes/l1-other",
        }]
        run_build(session_dos_katas, self.dir)
        canonical_dir = self.dir / "sessions" / "canonical"
        self.assertTrue((canonical_dir / f"{SESSION['id']}__kata-01.py").is_file())
        self.assertTrue((canonical_dir / f"{SESSION['id']}__kata-02.py").is_file())

        # Regenerar el mismo id sin kata-02: la canonica vieja debe desaparecer.
        run_build(SESSION, self.dir)
        self.assertTrue((canonical_dir / f"{SESSION['id']}__kata-01.py").is_file())
        self.assertFalse(
            (canonical_dir / f"{SESSION['id']}__kata-02.py").is_file(),
            "la canonica huerfana de una kata quitada debe eliminarse al regenerar")


if __name__ == "__main__":
    unittest.main()
