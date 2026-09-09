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

    def test_sys_exit_en_canonical_no_tumba_el_validador(self):
        # sys.exit() hereda de BaseException (no de Exception); antes del fix
        # esto se propagaba fuera de validate_kata y tumbaba todo el lote.
        bad = dict(GOOD, canonical="import sys\nsys.exit(1)")
        p = write_kata(self.tmp.name, bad)
        errs = validate_library.validate_kata(p)
        self.assertTrue(errs, "debe reportar error, no reventar")

    def test_bucle_infinito_en_test_da_timeout_acotado(self):
        # Un test que cuelga no debe colgar el validador: con timeout=2 debe
        # devolver en tiempo acotado un error de timeout.
        bad = dict(GOOD, test="def test_cuelga():\n    while True:\n        pass")
        p = write_kata(self.tmp.name, bad)
        errs = validate_library.validate_kata(p, timeout=2)
        self.assertTrue(any("timed out" in e.lower() for e in errs))

    def test_level_bool_da_error(self):
        # bool subclasea int: isinstance(True, int) es True, asi que sin check
        # explicito "level": true se aceptaria en silencio como int valido.
        bad = dict(GOOD, level=True)
        p = write_kata(self.tmp.name, bad)
        errs = validate_library.validate_kata(p)
        self.assertTrue(any("level" in e and "int" in e for e in errs))

    def test_json_top_level_no_objeto_da_error_limpio(self):
        d = Path(self.tmp.name) / "classes" / "katas"
        d.mkdir(parents=True, exist_ok=True)
        p = d / "l1-bad.json"
        p.write_text("42", encoding="utf-8")
        errs = validate_library.validate_kata(p)
        self.assertTrue(errs, "debe reportar error, no reventar con TypeError")

    def test_canonical_con_print_y_tests_que_pasan_devuelve_lista_vacia(self):
        # Kata cuyo canonical() hace print('debug') pero los tests pasan.
        # Con el código actual (sin fix), json.loads(proc.stdout) falla al ver
        # múltiples líneas. Con el fix, parsea solo la última (JSON) e ignora prints.
        canonical_with_print = (
            "class User:\n"
            "    def __init__(self, name):\n"
            "        print('debug init')\n"
            "        self.name = name"
        )
        kata = dict(
            GOOD,
            canonical=canonical_with_print,
        )
        p = write_kata(self.tmp.name, kata)
        errs = validate_library.validate_kata(p)
        self.assertEqual(errs, [], f"debe pasar sin errores, pero obtuvo: {errs}")

    def test_canonical_con_print_y_test_fallando_contiene_razon_error(self):
        # Kata con print en canonical + un test que falla con mensaje claro.
        # El fix debe parsear solo el JSON final (ignorando prints) y devolver
        # el mensaje real de error del test, no un genérico "invalid output".
        canonical_with_print = (
            "class User:\n"
            "    def __init__(self, name):\n"
            "        print('debug init')\n"
            "        self.name = name"
        )
        test_with_failing_assertion = (
            "def test_stores_name():\n"
            "    u = User('Ana')\n"
            "    assert u.name == 'Bob', 'el nombre debe ser Bob'"
        )
        kata = dict(
            GOOD,
            canonical=canonical_with_print,
            test=test_with_failing_assertion,
        )
        p = write_kata(self.tmp.name, kata)
        errs = validate_library.validate_kata(p)
        self.assertTrue(errs, "debe reportar error")
        # El error reportado debe contener la razón real ('el nombre debe ser Bob'),
        # no un genérico "invalid output".
        self.assertTrue(
            any("el nombre debe ser bob" in e.lower() for e in errs),
            f"debe mencionar el error real. Errores: {errs}",
        )
        self.assertFalse(
            any("invalid output" in e.lower() for e in errs),
            "el veredicto no debe ser el fallback generico. Errores: {errs}".format(errs=errs),
        )


if __name__ == "__main__":
    unittest.main()
