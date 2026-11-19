import argparse
import hashlib
import importlib
import json
import os
import shutil
import subprocess
import sys
import types
from pathlib import Path

import pytest

from conftest import SCRIPTS

EDITOR = SCRIPTS / "editor.py"
FFMPEG = shutil.which("ffmpeg")
con_ffmpeg = pytest.mark.skipif(not FFMPEG, reason="sin ffmpeg")


def cargar(monkeypatch, tmp_path):
    monkeypatch.setenv("EDITOR_VIDEO_HOME", str(tmp_path / "home"))
    import editor
    return importlib.reload(editor)


def falso_ct2(monkeypatch, n):
    mod = types.ModuleType("ctranslate2")
    mod.get_cuda_device_count = lambda: n
    monkeypatch.setitem(sys.modules, "ctranslate2", mod)


def bruto(ruta, dur=4, voz=1.5):
    """Clip 1080x1920 con `voz` s de tono y el resto silencio."""
    ruta.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run([FFMPEG, "-v", "error", "-y", "-f", "lavfi", "-i", f"color=c=black:s=1080x1920:d={dur}",
                    "-f", "lavfi", "-i", f"sine=d={voz}", "-filter_complex",
                    f"[1:a]apad=whole_dur={dur}[a]", "-map", "0:v", "-map", "[a]", "-shortest",
                    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", str(ruta)], check=True)
    return ruta


def huella(ruta):
    return hashlib.sha256(Path(ruta).read_bytes()).hexdigest()


def test_base_usa_variable_de_entorno(monkeypatch, tmp_path):
    editor = cargar(monkeypatch, tmp_path)
    assert editor.BASE == Path(tmp_path / "home")


def test_elegir_modelo_gpu(monkeypatch, tmp_path):
    editor = cargar(monkeypatch, tmp_path)
    falso_ct2(monkeypatch, 1)
    assert editor.elegir_modelo() == ("large-v3-turbo", "cuda", "float16")


def test_elegir_modelo_cpu(monkeypatch, tmp_path):
    editor = cargar(monkeypatch, tmp_path)
    falso_ct2(monkeypatch, 0)
    assert editor.elegir_modelo() == ("small", "cpu", "int8")


def test_cargar_whisper_cae_a_cpu(monkeypatch, tmp_path):
    editor = cargar(monkeypatch, tmp_path)
    falso_ct2(monkeypatch, 1)
    llamadas = []

    class Falso:
        def __init__(self, ruta, device, compute_type):
            llamadas.append((ruta, device, compute_type))
            if device == "cuda":
                raise RuntimeError("cublas64_12.dll not found")

    fw = types.ModuleType("faster_whisper")
    fw.WhisperModel = Falso
    monkeypatch.setitem(sys.modules, "faster_whisper", fw)
    monkeypatch.setattr(editor, "asegurar_modelo", lambda nombre: f"modelos/{nombre}")
    m = editor.cargar_whisper()
    assert isinstance(m, Falso)
    assert [c[1] for c in llamadas] == ["cuda", "cpu"]
    # mismo modelo ya descargado, en CPU: no pide small (que la preparación con GPU no baja)
    assert llamadas[1] == ("modelos/large-v3-turbo", "cpu", "int8")


def test_sin_cudnn_usa_el_modelo_descargado_en_cpu(monkeypatch, tmp_path, capsys):
    """Con GPU solo se baja large-v3-turbo; si CUDA falla, se usa ese mismo en CPU y nunca se pide small."""
    editor = cargar(monkeypatch, tmp_path)
    falso_ct2(monkeypatch, 1)
    d = tmp_path / "home" / "modelos" / "whisper-large-v3-turbo"
    d.mkdir(parents=True)
    (d / "model.bin").write_bytes(b"x")
    llamadas = []

    class Falso:
        def __init__(self, ruta, device, compute_type):
            llamadas.append((ruta, device, compute_type))
            if device == "cuda":
                raise RuntimeError("Could not load library cudnn_ops64_9.dll")

    fw = types.ModuleType("faster_whisper")
    fw.WhisperModel = Falso
    monkeypatch.setitem(sys.modules, "faster_whisper", fw)
    editor.cargar_whisper()
    assert llamadas == [(str(d), "cuda", "float16"), (str(d), "cpu", "int8")]
    salida = capsys.readouterr().out
    assert "lento" in salida and "small" not in salida


def test_modelo_ausente_no_descarga(monkeypatch, tmp_path):
    """Nada sale a internet fuera de la preparación: sin el modelo, falla con la pista de preparar."""
    editor = cargar(monkeypatch, tmp_path)
    fw = types.ModuleType("faster_whisper")
    fw.download_model = lambda *a, **k: pytest.fail("no debe descargar nada")
    monkeypatch.setitem(sys.modules, "faster_whisper", fw)
    with pytest.raises(SystemExit):
        editor.asegurar_modelo("small")


def test_modelo_presente(monkeypatch, tmp_path):
    editor = cargar(monkeypatch, tmp_path)
    d = tmp_path / "home" / "modelos" / "whisper-small"
    d.mkdir(parents=True)
    (d / "model.bin").write_bytes(b"x")
    assert editor.asegurar_modelo("small") == str(d)


def test_dlls_cuda_en_path(monkeypatch, tmp_path):
    editor = cargar(monkeypatch, tmp_path)
    sp = tmp_path / "site"
    (sp / "nvidia" / "cublas" / "bin").mkdir(parents=True)
    monkeypatch.setattr(editor, "ES_WIN", True)
    monkeypatch.setattr(sys, "path", [str(sp)])
    monkeypatch.setattr(os, "add_dll_directory", lambda p: None, raising=False)
    monkeypatch.setenv("PATH", "x")
    editor.dlls_cuda()
    assert str(sp / "nvidia" / "cublas" / "bin") in os.environ["PATH"].split(os.pathsep)


@con_ffmpeg
def test_silencios_con_espacios_y_tildes(tmp_path):
    clip = bruto(tmp_path / "proyecto ñá" / "reels" / "brutos" / "Mi vídeo 1.mp4")
    antes = huella(clip)
    env = dict(os.environ, EDITOR_VIDEO_HOME=str(tmp_path / "home"))
    r = subprocess.run([sys.executable, str(EDITOR), "silencios", str(clip)], capture_output=True,
                       text=True, encoding="utf-8", env=env)
    assert r.returncode == 0, r.stdout + r.stderr
    salida = tmp_path / "proyecto ñá" / "reels" / "trabajo" / "Mi vídeo 1_sin_silencios.mp4"
    assert salida.exists()
    assert json.loads((salida.parent / "Mi vídeo 1_sin_silencios.cortes.json").read_text(encoding="utf-8"))
    assert huella(clip) == antes


@con_ffmpeg
def test_cortar_deja_cortado_y_palabras(monkeypatch, tmp_path):
    editor = cargar(monkeypatch, tmp_path)
    raiz = tmp_path / "proyecto ñá"
    clip = bruto(raiz / "reels" / "brutos" / "Mi vídeo 1.mp4")
    antes = huella(clip)
    palabras = [{"p": "Hola", "ini": 0.1, "fin": 0.5}, {"p": "mundo.", "ini": 0.6, "fin": 1.0}]
    monkeypatch.setattr(editor, "transcribir", lambda ruta, idioma: palabras)
    editor.cmd_cortar(argparse.Namespace(raiz=str(raiz), bruto="reels/brutos/Mi vídeo 1.mp4", idioma="es",
                                         umbral=-35, minimo=0.45, margen=0.12))
    trabajo = raiz / "reels" / "trabajo" / "Mi vídeo 1"
    assert (trabajo / "cortado.mp4").exists()
    assert json.loads((trabajo / "cortado.palabras.json").read_text(encoding="utf-8")) == palabras
    assert (trabajo / "cortado.srt").read_text(encoding="utf-8").startswith("1\n")
    assert json.loads((trabajo / "cortado.cortes.json").read_text(encoding="utf-8"))["tramos_que_quedan"]
    assert huella(clip) == antes
    assert sorted(p.name for p in (raiz / "reels" / "brutos").iterdir()) == ["Mi vídeo 1.mp4"]


@con_ffmpeg
def test_cortar_sin_palabras_no_revienta(monkeypatch, tmp_path, capsys):
    editor = cargar(monkeypatch, tmp_path)
    raiz = tmp_path / "proyecto"
    bruto(raiz / "reels" / "brutos" / "tono.mp4")
    monkeypatch.setattr(editor, "transcribir", lambda ruta, idioma: [])
    editor.cmd_cortar(argparse.Namespace(raiz=str(raiz), bruto=str(raiz / "reels" / "brutos" / "tono.mp4"),
                                         idioma="es", umbral=-35, minimo=0.45, margen=0.12))
    trabajo = raiz / "reels" / "trabajo" / "tono"
    assert (trabajo / "cortado.mp4").exists()
    assert json.loads((trabajo / "cortado.palabras.json").read_text(encoding="utf-8")) == []
    assert "AVISO" in capsys.readouterr().out


def test_cortar_rechaza_bruto_inexistente(monkeypatch, tmp_path):
    editor = cargar(monkeypatch, tmp_path)
    with pytest.raises(SystemExit):
        editor.cmd_cortar(argparse.Namespace(raiz=str(tmp_path), bruto="reels/brutos/no.mp4", idioma="es",
                                             umbral=-35, minimo=0.45, margen=0.12))


def test_formato_palabras_como_componer():
    """componer.py lee w["p"], w["ini"], w["fin"]: el ejemplo del motor usa el mismo formato que cortar."""
    plan = json.loads((SCRIPTS / "motor" / "ejemplo_plan.json").read_text(encoding="utf-8"))
    assert plan["clip"].endswith("/cortado.mp4") and plan["palabras"].endswith("/cortado.palabras.json")
    texto = (SCRIPTS / "motor" / "componer.py").read_text(encoding="utf-8")
    assert 'w["p"]' in texto and 'w["ini"]' in texto and 'w["fin"]' in texto
