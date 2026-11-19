#!/usr/bin/env python3
"""Hoja de contacto de un reel: un still cada 2 s de cortado.mp4 y una hoja con todos (adaptado de storyboard.py).

Uso:  python hoja.py ROOT X [--plan plan.json] [--cada 2] [--columnas 6]
Deja en ROOT/reels/trabajo/X/:
  stills/still_NNN.png   un fotograma cada --cada segundos, con el tiempo, lo que se dice y,
                         con --plan, los recursos, efectos y cortes que tocan en ese instante
  hoja.png               todos los stills en una cuadrícula (la que se enseña antes de aprobar)
  hoja.json              lo mismo en datos, para revisarlo sin abrir la imagen
Los tiempos son los de cortado.mp4 (los mismos del plan). Las imágenes las escribe FFmpeg (no OpenCV),
así funciona con espacios y tildes en las rutas.
"""
import argparse
import json
import math
import re
import shutil
import sys
import tempfile
import textwrap
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import editor  # noqa: E402
import plan as planes  # noqa: E402

FUENTE = Path(__file__).resolve().parent / "motor" / "fonts" / "Outfit-Variable.ttf"


def activos(lista, t, clave):
    return [str(e.get(clave)) for e in lista if float(e["ini"]) <= t < float(e["fin"])]


def dicho(palabras, t, ventana=1.0):
    """Palabras que suenan alrededor de t (de t - ventana/2 a t + ventana*1.5)."""
    return " ".join(w["p"] for w in palabras if float(w["fin"]) > t - ventana / 2 and float(w["ini"]) < t + ventana * 1.5)


def color_fondo(raiz):
    try:
        estilo = json.loads((raiz / "reels" / "marca" / "estilo.json").read_text(encoding="utf-8-sig"))
        c = str((estilo.get("colores") or {}).get("fondo") or "")
        if re.fullmatch(r"#[0-9a-fA-F]{6}", c):
            return "0x" + c[1:]
    except Exception:
        pass
    return "white"


def still(video, t, destino, cabecera, pie, tmp, ancho):
    """Un fotograma con dos rótulos; los textos van en ficheros para no pelear con el escapado de FFmpeg."""
    n = destino.stem
    (tmp / f"{n}_a.txt").write_text(cabecera, encoding="utf-8")
    (tmp / f"{n}_b.txt").write_text(pie or " ", encoding="utf-8")
    caja = "fontfile=fuente.ttf:expansion=none:fontcolor=white:box=1:boxcolor=black@0.62:boxborderw=6"
    fa, fb = max(12, ancho // 14), max(11, ancho // 16)
    # Outfit trae mucho interlineado: se recorta algo más de la mitad del cuerpo
    vf = (f"scale={ancho}:-2,"
          f"drawtext={caja}:textfile={n}_a.txt:fontsize={fa}:line_spacing=-{int(fa * 0.55)}:x=8:y=8,"
          f"drawtext={caja}:textfile={n}_b.txt:fontsize={fb}:line_spacing=-{int(fb * 0.55)}:x=8:y=h-th-12")
    r = editor.correr([editor.ffmpeg(), "-hide_banner", "-v", "error", "-y", "-ss", f"{t:.3f}", "-i", video,
                       "-frames:v", "1", "-vf", vf, str(destino)], cwd=tmp)
    if r.returncode or not destino.exists():
        editor.fallar(f"FFmpeg no pudo sacar el still de {t:.1f} s: " + r.stderr.strip()[-300:])


def generar(raiz, nombre, ruta_plan=None, cada=2.0, columnas=6, ancho=216):
    raiz = Path(raiz).expanduser().resolve()
    trabajo = raiz / "reels" / "trabajo" / nombre
    datos = None
    if ruta_plan:
        ruta_plan = Path(ruta_plan).expanduser()
        if not ruta_plan.is_absolute() and not ruta_plan.exists():
            ruta_plan = raiz / ruta_plan                     # relativo a la raíz, como clip y palabras
        datos = planes.leer_plan(ruta_plan)
        clip = resolver(raiz, datos["clip"])
        ruta_palabras = resolver(raiz, datos["palabras"])
    else:
        clip, ruta_palabras = trabajo / "cortado.mp4", trabajo / "cortado.palabras.json"
    if not clip.is_file():
        editor.fallar(f"no encuentro el clip {clip}.", "corta primero el bruto (editor.py cortar ROOT reels/brutos/X.mp4) "
                      "para tener reels/trabajo/X/cortado.mp4.")
    palabras = json.loads(ruta_palabras.read_text(encoding="utf-8-sig")) if ruta_palabras.is_file() else []
    total = editor.duracion(str(clip))
    tiempos = [round(i * cada, 3) for i in range(max(1, math.ceil(total / cada - 1e-6)))]
    trabajo.mkdir(parents=True, exist_ok=True)
    carpeta = trabajo / "stills"
    if carpeta.exists():
        shutil.rmtree(carpeta)
    carpeta.mkdir()
    indice = []
    tmp = Path(tempfile.mkdtemp(prefix="hoja-"))
    try:
        shutil.copyfile(FUENTE, tmp / "fuente.ttf")
        for i, t in enumerate(tiempos):
            fila = {"t": int(t) if t == int(t) else t, "archivo": f"stills/still_{i:03d}.png",
                    "palabras": dicho(palabras, t)}
            cabecera = f"{t:.0f} s" if t == int(t) else f"{t:.1f} s"
            if datos is not None:
                fila["recursos"] = activos(datos["recursos"], t, "tipo")
                fila["fx"] = activos(datos["fx"], t, "fx")
                fila["camara"] = activos(datos["camara"], t, "tipo")
                fila["se_corta"] = planes.remapear(t, datos["cortes"]) is None
                extra = fila["recursos"] + fila["fx"] + [f"cám. {c}" for c in fila["camara"]]
                if fila["se_corta"]:
                    extra.append("SE CORTA")
                if extra:
                    cabecera += "\n" + "\n".join(extra)       # una línea por elemento: nada se corta por el borde
            still(str(clip), min(t, max(total - 0.05, 0)), carpeta / f"still_{i:03d}.png", cabecera,
                  "\n".join(textwrap.wrap(fila["palabras"], 24)[:3]), tmp, ancho)
            indice.append(fila)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    filas = math.ceil(len(tiempos) / columnas)
    hoja = trabajo / "hoja.png"
    r = editor.correr([editor.ffmpeg(), "-hide_banner", "-v", "error", "-y", "-framerate", "1", "-i", "still_%03d.png",
                       "-vf", f"tile={min(columnas, len(tiempos))}x{filas}:padding=8:margin=8:color={color_fondo(raiz)}",
                       "-frames:v", "1", "-update", "1", str(hoja)], cwd=carpeta)
    if r.returncode or not hoja.exists():
        editor.fallar("FFmpeg no pudo montar la hoja: " + r.stderr.strip()[-300:])
    (trabajo / "hoja.json").write_text(json.dumps(
        {"clip": clip.relative_to(raiz).as_posix() if clip.is_relative_to(raiz) else str(clip), "cada_s": cada,
         "duracion_s": round(total, 2), "stills": indice}, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"OK hoja {hoja} ({len(tiempos)} stills cada {cada:g} s)")
    return hoja


def resolver(raiz, ruta):
    p = Path(ruta)
    return p if p.is_absolute() else raiz / p


def main():
    ap = argparse.ArgumentParser(description="Hoja de contacto de un reel (stills cada 2 s).")
    ap.add_argument("raiz", help="raíz del proyecto (la carpeta que contiene reels/)")
    ap.add_argument("nombre", help="carpeta del reel en reels/trabajo/")
    ap.add_argument("--plan", help="plan.json: anota recursos, efectos y cortes en cada still")
    ap.add_argument("--cada", type=float, default=2.0, help="segundos entre stills (2)")
    ap.add_argument("--columnas", type=int, default=6)
    a = ap.parse_args()
    try:
        generar(a.raiz, a.nombre, a.plan, a.cada, a.columnas)
    except ValueError as e:
        editor.fallar(str(e), "corrige plan.json y vuelve a sacar la hoja.")


if __name__ == "__main__":
    main()
