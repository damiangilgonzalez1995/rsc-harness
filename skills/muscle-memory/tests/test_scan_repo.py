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

    def test_detecta_base_cualificada(self):
        """Bases cualificadas como enum.Enum deben producir 'inheritance' y 'enums'."""
        code = textwrap.dedent('''
            import enum

            class Status(enum.Enum):
                OPEN = 1
                CLOSED = 2
        ''')
        test_file = Path(self.tmp.name) / "enum_qualified.py"
        test_file.write_text(code, encoding="utf-8")
        info = scan_repo.extract_concepts(str(test_file))
        self.assertIn("inheritance", info["signals"])
        self.assertIn("enums", info["signals"])


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
