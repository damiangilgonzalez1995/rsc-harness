import re
import subprocess
import sys

from conftest import SCRIPTS

FX = SCRIPTS / "fx"


def test_modelo_de_cara_donde_lo_busca_componer():
    texto = (SCRIPTS / "motor" / "componer.py").read_text(encoding="utf-8")
    assert 'SCRIPTS / "fx" / "models" / "yunet.onnx"' in texto
    assert (FX / "models" / "yunet.onnx").stat().st_size > 100_000
    assert (FX / "models" / "selfie_segmenter.tflite").is_file()


def test_licencias_y_atribucion():
    assert "Vibha Ramprakash" in (FX / "LICENSE").read_text(encoding="utf-8")
    assert "Vibha Ramprakash" in (FX / "NOTICE").read_text(encoding="utf-8")
    assert "Vibha Ramprakash" in (FX / "models" / "NOTICE.md").read_text(encoding="utf-8")
    fuentes = list((FX / "fonts").glob("*.ttf"))
    assert fuentes
    licencias = [p.name for p in (FX / "fonts").glob("*.txt")]
    assert len(licencias) >= 8


def test_fuentes_que_usa_fx_existen():
    texto = (FX / "fx.py").read_text(encoding="utf-8")
    nombres = set(re.findall(r"'([A-Za-z0-9-]+\.ttf)'", texto))
    assert nombres
    faltan = [n for n in nombres if not (FX / "fonts" / n).is_file()]
    assert not faltan, faltan


def test_fx_lista_efectos_desde_su_carpeta():
    r = subprocess.run([sys.executable, "-X", "utf8", str(FX / "fx.py"), "--list"], capture_output=True, text=True,
                       encoding="utf-8", errors="replace")
    assert r.returncode == 0, r.stderr
    assert "phone-fan" in r.stdout and "noise" in r.stdout


def test_fx_busca_fuentes_y_modelos_junto_a_fx_py():
    import importlib.util
    spec = importlib.util.spec_from_file_location("fx_mod", FX / "fx.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    from pathlib import Path
    assert Path(mod.ROOT) == FX
    assert all(Path(p).is_file() for p in mod.FONT.values())


def test_phone_fan_del_spike():
    texto = (FX / "fx.py").read_text(encoding="utf-8")
    cuerpo = texto.split("def fx_phone_fan", 1)[1].split("@effect(", 1)[0]
    for clave in ("'body'", "'spread'", "'scale'", "e.o.get('x')", "e.o.get('y')"):
        assert clave in cuerpo


def _deps_fx():
    try:
        import cv2  # noqa: F401
        import mediapipe  # noqa: F401
        return True
    except ImportError:
        return False


import os  # noqa: E402
import shutil  # noqa: E402

import pytest  # noqa: E402

FFMPEG = shutil.which("ffmpeg")
con_deps = pytest.mark.skipif(not (FFMPEG and _deps_fx()), reason="sin ffmpeg o sin cv2/mediapipe")


def _skill_en_tildes(tmp_path):
    """Copia scripts/fx en una carpeta con espacio y tildes, como quedará en un proyecto de Windows."""
    raiz = tmp_path / "proyecto ñá" / "skill ñá"
    shutil.copytree(FX, raiz / "fx", ignore=shutil.ignore_patterns("__pycache__"))
    clip = tmp_path / "proyecto ñá" / "clip ñá.mp4"
    subprocess.run([FFMPEG, "-v", "error", "-y", "-f", "lavfi", "-i", "testsrc2=s=360x640:d=1.5:r=30",
                    "-f", "lavfi", "-i", "sine=d=1.5", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac",
                    "-shortest", str(clip)], check=True)
    return raiz / "fx" / "fx.py", clip


def _entorno_sin_ffmpeg_en_path(tmp_path):
    """PATH sin ffmpeg y rutas.json (en un EDITOR_VIDEO_HOME temporal) apuntando al ffmpeg de verdad."""
    casa = tmp_path / "casa ñ"
    casa.mkdir()
    import json
    (casa / "rutas.json").write_text(json.dumps({"ffmpeg": FFMPEG, "ffprobe": shutil.which("ffprobe")}),
                                     encoding="utf-8")
    sistema = os.path.join(os.environ.get("SystemRoot", r"C:\Windows"), "System32")
    return dict(os.environ, EDITOR_VIDEO_HOME=str(casa), PATH=os.pathsep.join([os.path.dirname(sys.executable), sistema]))


@con_deps
def test_fx_funciona_en_ruta_con_tildes(tmp_path):
    fx, clip = _skill_en_tildes(tmp_path)
    salida = clip.parent / "salida ñá.mp4"
    r = subprocess.run([sys.executable, "-X", "utf8", str(fx), "spotlight", str(clip), str(salida), "--start", "0.2",
                        "--end", "1.2", "--text", "hola"], capture_output=True, text=True, encoding="utf-8",
                       errors="replace", env=_entorno_sin_ffmpeg_en_path(tmp_path), timeout=300)
    assert r.returncode == 0, r.stdout + r.stderr
    assert salida.is_file() and salida.stat().st_size > 1000


@con_deps
def test_fx_still_en_ruta_con_tildes(tmp_path):
    fx, clip = _skill_en_tildes(tmp_path)
    png = clip.parent / "still ñá.png"
    r = subprocess.run([sys.executable, "-X", "utf8", str(fx), "spotlight", str(clip), str(png), "--start", "0.2",
                        "--end", "1.2", "--text", "hola", "--still", "0.8"], capture_output=True, text=True,
                       encoding="utf-8", errors="replace", env=_entorno_sin_ffmpeg_en_path(tmp_path), timeout=300)
    assert r.returncode == 0, r.stdout + r.stderr
    assert png.read_bytes()[:8] == b"\x89PNG\r\n\x1a\n"
    assert "saved" in r.stdout
