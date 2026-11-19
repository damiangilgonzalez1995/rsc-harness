import json
import shutil
import subprocess
import sys

import pytest

from conftest import SCRIPTS

FFMPEG = shutil.which("ffmpeg")
pytestmark = pytest.mark.skipif(not FFMPEG, reason="sin ffmpeg")
PNG = b"\x89PNG\r\n\x1a\n"


def proyecto(tmp_path, nombre="mi reel", dur=6):
    raiz = tmp_path / "proyecto ñá"
    trabajo = raiz / "reels" / "trabajo" / nombre
    trabajo.mkdir(parents=True)
    subprocess.run([FFMPEG, "-v", "error", "-y", "-f", "lavfi", "-i", f"testsrc2=s=540x960:d={dur}:r=30",
                    "-f", "lavfi", "-i", f"sine=f=440:d={dur}", "-c:v", "libx264", "-pix_fmt", "yuv420p",
                    "-c:a", "aac", "-shortest", str(trabajo / "cortado.mp4")], check=True)
    (trabajo / "cortado.palabras.json").write_text(json.dumps(
        [{"p": "Hola", "ini": 0.2, "fin": 0.6}, {"p": "qué", "ini": 2.1, "fin": 2.4}, {"p": "tal", "ini": 2.5, "fin": 2.8}],
        ensure_ascii=False), encoding="utf-8")
    return raiz, trabajo


def correr(*args):
    return subprocess.run([sys.executable, str(SCRIPTS / "hoja.py"), *map(str, args)], capture_output=True,
                          text=True, encoding="utf-8")


def test_hoja_stills_cada_2_s(tmp_path):
    raiz, trabajo = proyecto(tmp_path)
    r = correr(raiz, "mi reel")
    assert r.returncode == 0, r.stdout + r.stderr
    hoja = trabajo / "hoja.png"
    assert hoja.read_bytes()[:8] == PNG
    stills = sorted((trabajo / "stills").glob("*.png"))
    assert len(stills) == 3
    indice = json.loads((trabajo / "hoja.json").read_text(encoding="utf-8"))
    assert [s["t"] for s in indice["stills"]] == [0, 2, 4]
    assert indice["stills"][1]["palabras"] == "qué tal"


def test_hoja_con_plan_anota_recursos(tmp_path):
    raiz, trabajo = proyecto(tmp_path)
    plan = trabajo / "plan.json"
    plan.write_text(json.dumps({
        "clip": "reels/trabajo/mi reel/cortado.mp4", "palabras": "reels/trabajo/mi reel/cortado.palabras.json",
        "cortes": [{"ini": 4.5, "fin": 5.5}],
        "recursos": [{"ini": 1.5, "fin": 3, "tipo": "vistas"}],
        "fx": [{"ini": 3.5, "fin": 4.5, "fx": "noise"}]}, ensure_ascii=False), encoding="utf-8")
    r = correr(raiz, "mi reel", "--plan", plan)
    assert r.returncode == 0, r.stdout + r.stderr
    indice = json.loads((trabajo / "hoja.json").read_text(encoding="utf-8"))
    por_t = {s["t"]: s for s in indice["stills"]}
    assert por_t[2]["recursos"] == ["vistas"]
    assert por_t[4]["fx"] == ["noise"]
    assert por_t[0]["recursos"] == [] and por_t[0]["fx"] == []
    assert (trabajo / "hoja.png").read_bytes()[:8] == PNG


def test_hoja_sin_clip_falla_claro(tmp_path):
    raiz = tmp_path / "vacío"
    (raiz / "reels" / "trabajo").mkdir(parents=True)
    r = correr(raiz, "nada")
    assert r.returncode != 0
    assert "cortado.mp4" in r.stdout + r.stderr
