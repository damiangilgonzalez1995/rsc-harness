"""Motor tests (local, not in CI). Run with the editor venv:
    python -X utf8 -m pytest skills/shortform-editing/tests/test_motor.py
"""
import importlib.util
import json
import re
import subprocess
import sys
from pathlib import Path

MOTOR = Path(__file__).resolve().parent.parent / "scripts" / "motor"
RECURSOS = MOTOR / "recursos"
ESPERADOS = ["reels-muro", "vistas", "campana", "personas", "movil-feed", "hueco",
             "frase-remate", "palabra-caja", "chat-comentarios", "doodle", "subrayado-circulo",
             "cierre-firma", "tarjeta-lista", "pregunta-publico", "mito-realidad", "acotacion"]
HEX = re.compile(r"#[0-9a-fA-F]{6}")


def cargar_componer():
    spec = importlib.util.spec_from_file_location("componer", MOTOR / "componer.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def test_no_brand_constants_in_resources():
    faltan = [n for n in ESPERADOS if not (RECURSOS / f"{n}.js").is_file()]
    assert not faltan, f"faltan recursos: {faltan}"
    for js in RECURSOS.glob("*.js"):
        texto = js.read_text(encoding="utf-8")
        assert not HEX.search(texto), f"{js.name} lleva un color fijo; debe salir de estilo.json"


def test_componer_rechaza_plan_sin_estilo(tmp_path):
    raiz = tmp_path / "proyecto ñ"
    (raiz / "reels" / "brutos").mkdir(parents=True)
    plan = raiz / "plan.json"
    plan.write_text(json.dumps({"clip": "reels/brutos/a.mp4", "palabras": "reels/trabajo/a.palabras.json"}),
                    encoding="utf-8")
    r = subprocess.run([sys.executable, "-X", "utf8", str(MOTOR / "componer.py"), str(plan), "--proyecto", str(raiz)],
                       capture_output=True, text=True, encoding="utf-8", errors="replace")
    assert r.returncode != 0
    assert "falta reels/marca/estilo.json" in (r.stdout + r.stderr)


def test_version_no_pisa_con_corchetes(tmp_path):
    componer = cargar_componer()
    exportados = tmp_path / "exportados"
    exportados.mkdir()
    (exportados / "reel [final]_v1.mp4").write_bytes(b"x")
    assert componer.siguiente_salida(exportados, "reel [final]").name == "reel [final]_v2.mp4"


# Cards that occupy the lower band (where captions live) hide the captions while on screen.
ZONAS_TARJETAS_BAJAS = ["campana", "personas", "chat-comentarios", "tarjeta-lista", "pregunta-publico",
                        "mito-realidad"]


def test_tarjetas_bajas_ocultan_subtitulos():
    import re
    for n in ZONAS_TARJETAS_BAJAS:
        texto = (RECURSOS / f"{n}.js").read_text(encoding="utf-8")
        zonas = re.findall(r'return \{ zona: "([a-z]+)" \}', texto)
        assert zonas == ["pantalla"], f"{n} devuelve {zonas}"
    for js in RECURSOS.glob("*.js"):
        if js.stem != "hueco":
            assert 'zona: "abajo"' not in js.read_text(encoding="utf-8"), js.name


def _ffmpeg():
    import shutil
    rutas = Path.home() / ".editor-video" / "rutas.json"
    if rutas.exists():
        r = json.loads(rutas.read_text(encoding="utf-8-sig"))
        if r.get("ffmpeg") and Path(r["ffmpeg"]).exists() and r.get("ffprobe") and Path(r["ffprobe"]).exists():
            return r["ffmpeg"], r["ffprobe"]
    f, p = shutil.which("ffmpeg"), shutil.which("ffprobe")
    return (f, p) if f and p else (None, None)


def test_sin_render_subtitulos_fuera_de_la_camara(tmp_path):
    import os
    from html.parser import HTMLParser
    import pytest
    ffmpeg, ffprobe = _ffmpeg()
    if not ffmpeg:
        pytest.skip("ffmpeg no disponible")
    casa = tmp_path / "casa"
    hf = casa / "hf"
    (hf / "node_modules" / "gsap" / "dist").mkdir(parents=True)
    (hf / "node_modules" / "gsap" / "dist" / "gsap.min.js").write_text("/* stub */", encoding="utf-8")
    (casa / ".editor-video").mkdir()
    (casa / ".editor-video" / "rutas.json").write_text(json.dumps(
        {"node": "node", "ffmpeg": ffmpeg, "ffprobe": ffprobe, "hyperframes": str(hf)}), encoding="utf-8")
    raiz = tmp_path / "proyecto ñ"
    trabajo = raiz / "reels" / "trabajo" / "corto"
    trabajo.mkdir(parents=True)
    (raiz / "reels" / "marca").mkdir(parents=True)
    (raiz / "reels" / "marca" / "estilo.json").write_text(json.dumps(
        {"colores": {"texto": "#FFFFFF", "trazo": "#111111", "acento": "#FFC83D"}, "fuentes": {"titulos": "Outfit"}}),
        encoding="utf-8")
    subprocess.run([ffmpeg, "-v", "error", "-y", "-f", "lavfi", "-i", "testsrc=s=320x568:d=1.5:r=30", "-f", "lavfi",
                    "-i", "sine=d=1.5", "-shortest", "-c:v", "libx264", "-c:a", "aac", str(trabajo / "cortado.mp4")],
                   check=True)
    (trabajo / "cortado.palabras.json").write_text(json.dumps(
        [{"p": "hola", "ini": 0.1, "fin": 0.5}, {"p": "mundo", "ini": 0.5, "fin": 1.0}]), encoding="utf-8")
    plan = raiz / "plan.json"
    plan.write_text(json.dumps({"clip": "reels/trabajo/corto/cortado.mp4",
                                "palabras": "reels/trabajo/corto/cortado.palabras.json",
                                "camara": [{"ini": 0.2, "fin": 1.0, "tipo": "golpe", "zoom": 1.2}],
                                "recursos": [{"ini": 0.2, "fin": 1.2, "tipo": "campana"}]}), encoding="utf-8")
    env = dict(os.environ, HOME=str(casa), USERPROFILE=str(casa))
    r = subprocess.run([sys.executable, "-X", "utf8", str(MOTOR / "componer.py"), str(plan), "--proyecto", str(raiz),
                        "--sin-render"], capture_output=True, text=True, encoding="utf-8", errors="replace", env=env)
    assert r.returncode == 0, r.stdout + r.stderr
    pagina = (trabajo / "comp" / "index.html").read_text(encoding="utf-8")

    class Ancestros(HTMLParser):
        def __init__(self):
            super().__init__()
            self.pila, self.subs = [], None

        def handle_starttag(self, tag, attrs):
            d = dict(attrs)
            if tag in ("meta", "br", "img", "source"):
                return
            if d.get("id") == "subs":
                self.subs = [i for _, i in self.pila]
            self.pila.append((tag, d.get("id")))

        def handle_endtag(self, tag):
            while self.pila and self.pila.pop()[0] != tag:
                pass

    p = Ancestros()
    p.feed(pagina)
    assert p.subs is not None, "no hay capa #subs"
    assert "cam" not in p.subs and "mueve" not in p.subs, p.subs
    assert "root" in p.subs
    assert "window.SUBS(" in pagina and "estilo: D.estilo" in pagina and "apartar: apartar" in pagina
    # the camera only animates #mueve; nothing tweens the caption layer
    assert 'getElementById("subs")' in pagina
    assert "tl.to(subs" not in pagina and "fromTo(subs" not in pagina


def test_detectar_cara_informa_fallo_de_ffmpeg(tmp_path, monkeypatch):
    import pytest
    ffmpeg, ffprobe = _ffmpeg()
    if not ffmpeg:
        pytest.skip("ffmpeg no disponible")
    pytest.importorskip("cv2")
    componer = cargar_componer()
    modelo = tmp_path / "yunet.onnx"
    modelo.write_bytes(b"x")
    monkeypatch.setattr(componer, "MODELO_CARA", modelo)
    componer.RUTAS.update({"ffmpeg": ffmpeg, "ffprobe": ffprobe})
    roto = tmp_path / "roto ñ.mp4"
    roto.write_bytes(b"no es un video")
    with pytest.raises(SystemExit) as e:
        componer.detectar_cara(roto, tmp_path / "cara.json")
    msg = str(e.value)
    assert "ERROR" in msg and "ffmpeg" in msg and "ninguna cara" not in msg


def test_version_no_pisa(tmp_path):
    componer = cargar_componer()
    exportados = tmp_path / "reels" / "exportados"
    exportados.mkdir(parents=True)
    assert componer.siguiente_salida(exportados, "clip").name == "clip_v1.mp4"
    (exportados / "clip_v1.mp4").write_bytes(b"x")
    assert componer.siguiente_salida(exportados, "clip").name == "clip_v2.mp4"
    (exportados / "clip_v3.mp4").write_bytes(b"x")
    assert componer.siguiente_salida(exportados, "clip").name == "clip_v4.mp4"


# ---------------------------------------------------------------- the «sí»: approval and test renders
def _proyecto_con_estilo(tmp_path, plan_extra):
    raiz = tmp_path / "proyecto ñ"
    (raiz / "reels" / "marca").mkdir(parents=True)
    (raiz / "reels" / "marca" / "estilo.json").write_text("{}", encoding="utf-8")
    plan = raiz / "plan.json"
    plan.write_text(json.dumps({"clip": "reels/trabajo/a/cortado.mp4", "palabras": "reels/trabajo/a/cortado.palabras.json",
                                **plan_extra}), encoding="utf-8")
    return raiz, plan


def _correr(plan, raiz, *extra):
    return subprocess.run([sys.executable, "-X", "utf8", str(MOTOR / "componer.py"), str(plan), "--proyecto", str(raiz),
                           *extra], capture_output=True, text=True, encoding="utf-8", errors="replace")


def test_render_completo_sin_aprobar_se_niega(tmp_path):
    raiz, plan = _proyecto_con_estilo(tmp_path, {})
    r = _correr(plan, raiz)
    assert r.returncode != 0
    salida = r.stdout + r.stderr
    assert "hoja de contacto" in salida and '"aprobado": true' in salida
    assert not (raiz / "reels" / "exportados").exists()


def test_render_completo_con_aprobado_falso_se_niega(tmp_path):
    raiz, plan = _proyecto_con_estilo(tmp_path, {"aprobado": False})
    r = _correr(plan, raiz)
    assert r.returncode != 0 and '"aprobado": true' in (r.stdout + r.stderr)


def test_aprobacion_solo_se_exige_en_el_render_completo():
    componer = cargar_componer()
    from types import SimpleNamespace as A
    base = dict(still="", sin_render=False, desde=None, hasta=None)
    assert componer.es_montaje_completo(A(**base))
    assert not componer.es_montaje_completo(A(**dict(base, still="1.5")))
    assert not componer.es_montaje_completo(A(**dict(base, sin_render=True)))
    assert not componer.es_montaje_completo(A(**dict(base, desde=2.0)))
    assert not componer.es_montaje_completo(A(**dict(base, hasta=5.0)))
    componer.comprobar_aprobado({"aprobado": True}, A(**base))          # no exit
    componer.comprobar_aprobado({}, A(**dict(base, sin_render=True)))   # allowed without approval
    componer.comprobar_aprobado({}, A(**dict(base, desde=1.0)))
    componer.comprobar_aprobado({}, A(**dict(base, still="2")))
    import pytest
    with pytest.raises(SystemExit):
        componer.comprobar_aprobado({"aprobado": "si"}, A(**base))


def test_montaje_parcial_va_a_trabajo_y_no_gasta_version(tmp_path):
    componer = cargar_componer()
    from types import SimpleNamespace as A
    exportados, trabajo = tmp_path / "exportados", tmp_path / "trabajo" / "a"
    parcial = A(still="", sin_render=False, desde=2.0, hasta=8.5)
    s = componer.ruta_salida({"aprobado": True}, parcial, exportados, trabajo, "a", 2.0, 8.5)
    assert s == trabajo / "prueba_2-8.5.mp4"
    # an unapproved still check is a test too, never a delivery
    s = componer.ruta_salida({}, A(still="3", sin_render=False, desde=None, hasta=None), exportados, trabajo, "a",
                             0.0, 12.0)
    assert s == trabajo / "prueba_0-12.mp4"
    completo = A(still="3", sin_render=False, desde=None, hasta=None)
    assert componer.ruta_salida({"aprobado": True}, completo, exportados, trabajo, "a", 0.0, 12.0) == \
        exportados / "a_v1.mp4"
