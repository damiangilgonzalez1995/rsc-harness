"""preparar.ps1 / preparar.sh: nunca descargan nada sin -Acepto / --acepto.

Los tests usan un HOME/USERPROFILE temporal: nunca tocan el ~/.editor-video real.
"""
import os
import shutil
import subprocess

import pytest

from conftest import SCRIPTS

POWERSHELL = shutil.which("powershell") or shutil.which("pwsh")
BASH = shutil.which("bash")


def entorno(tmp_path):
    casa = tmp_path / "casa ñ"
    casa.mkdir()
    env = dict(os.environ, USERPROFILE=str(casa), HOME=str(casa))
    env.pop("EDITOR_VIDEO_HOME", None)
    return casa, env


@pytest.mark.skipif(not POWERSHELL, reason="sin PowerShell")
def test_preparar_no_descarga_sin_permiso(tmp_path):
    casa, env = entorno(tmp_path)
    r = subprocess.run([POWERSHELL, "-NoProfile", "-ExecutionPolicy", "Bypass", "-File",
                        str(SCRIPTS / "preparar.ps1"), "-SoloComprobar"],
                       capture_output=True, text=True, encoding="utf-8", errors="replace", env=env, timeout=180)
    assert r.returncode == 0, r.stdout + r.stderr
    assert not (casa / ".editor-video" / "venv").exists()
    assert not (casa / ".editor-video" / "modelos").exists()


@pytest.mark.skipif(not POWERSHELL, reason="sin PowerShell")
def test_preparar_sin_acepto_no_instala(tmp_path):
    """Sin -Acepto: dice lo que falta y pide permiso; no crea venv ni modelos."""
    casa, env = entorno(tmp_path)
    r = subprocess.run([POWERSHELL, "-NoProfile", "-ExecutionPolicy", "Bypass", "-File",
                        str(SCRIPTS / "preparar.ps1")],
                       capture_output=True, text=True, encoding="utf-8", errors="replace", env=env, timeout=180)
    salida = r.stdout + r.stderr
    assert not (casa / ".editor-video" / "venv").exists()
    assert not (casa / ".editor-video" / "modelos").exists()
    assert "-Acepto" in salida


def test_preparar_sh_exige_acepto():
    texto = (SCRIPTS / "preparar.sh").read_text(encoding="utf-8")
    assert "--acepto" in texto and "--solo-comprobar" in texto
    assert ".becario-editor" not in texto and "BECARIO_EDITOR_HOME" not in texto and ".editor-video" in texto


@pytest.mark.skipif(not BASH or os.name == "nt", reason="bash de verdad solo fuera de Windows")
def test_preparar_sh_no_descarga_sin_permiso(tmp_path):
    casa, env = entorno(tmp_path)
    r = subprocess.run([BASH, str(SCRIPTS / "preparar.sh"), "--solo-comprobar"], capture_output=True, text=True,
                       env=env, timeout=180)
    assert r.returncode == 0, r.stdout + r.stderr
    assert not (casa / ".editor-video" / "venv").exists()
