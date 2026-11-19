#!/usr/bin/env python3
"""Cortes y transcripción de la skill shortform-editing (adaptado de becario-editor v1.0).

Uso (con el Python del editor, el de ~/.editor-video/rutas.json):
  editor.py cortar ROOT reels/brutos/X.mp4   quita silencios y transcribe: deja reels/trabajo/X/cortado.mp4,
                                             cortado.palabras.json, cortado.srt y cortado.cortes.json
  editor.py estado                           qué herramientas hay y dónde
  editor.py silencios ENTRADA [SALIDA]       solo quita los silencios de un clip
  editor.py subtitulos ENTRADA               solo transcribe (deja .srt y .palabras.json al lado)
  editor.py analizar VIDEO                   medidas de un vídeo (planos, ritmo, volumen) y hoja de miniaturas

reels/brutos/ nunca se modifica: todo lo que sale va a reels/trabajo/.
Nada sale a internet: el modelo de voz lo descarga la preparación (paso 1), con permiso.
Whisper: large-v3-turbo en la GPU (CUDA float16) si la hay; si CUDA falla, ese mismo large-v3-turbo en CPU
(int8), más lento; sin GPU NVIDIA, small en CPU (int8).
"""
import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path

VERSION = "2.0"
BASE = Path(os.environ.get("EDITOR_VIDEO_HOME") or (Path.home() / ".editor-video"))
RUTAS = BASE / "rutas.json"
ES_WIN = os.name == "nt"

MODELO_GPU = ("large-v3-turbo", "cuda", "float16")
MODELO_CPU = ("small", "cpu", "int8")

for flujo in (sys.stdout, sys.stderr):
    try:
        flujo.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass


# ---------------------------------------------------------------- utilidades
def leer_rutas():
    try:
        return json.loads(RUTAS.read_text(encoding="utf-8-sig"))
    except Exception:
        return {}


def herramienta(nombre):
    r = leer_rutas().get(nombre)
    if r and Path(r).exists():
        return r
    return shutil.which(nombre)


def correr(cmd, **kw):
    return subprocess.run([str(c) for c in cmd], capture_output=True, text=True,
                          encoding="utf-8", errors="replace", **kw)


def fallar(msg, pista=None):
    print("FALLO:", msg)
    if pista:
        print("Qué hacer:", pista)
    sys.exit(1)


def aviso(msg):
    print("AVISO:", msg, flush=True)


def ffmpeg():
    f = herramienta("ffmpeg")
    if not f:
        fallar("no encuentro FFmpeg.", "haz primero la preparación (paso 1).")
    return f


def ffprobe():
    return herramienta("ffprobe")


def duracion(ruta):
    fp = ffprobe()
    if fp:
        r = correr([fp, "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", ruta])
        try:
            return float(r.stdout.strip())
        except ValueError:
            pass
    r = correr([ffmpeg(), "-hide_banner", "-i", ruta])
    m = re.search(r"Duration: (\d+):(\d+):([\d.]+)", r.stderr)
    if not m:
        fallar(f"no puedo leer la duración de {ruta}.", "comprueba que es un vídeo o audio normal (MP4, MOV, MP3, WAV…).")
    return int(m.group(1)) * 3600 + int(m.group(2)) * 60 + float(m.group(3))


def tiene_video(ruta):
    r = correr([ffmpeg(), "-hide_banner", "-i", ruta])
    return bool(re.search(r"Stream #.*: Video: (?!mjpeg|png)", r.stderr))


def tiene_audio(ruta):
    r = correr([ffmpeg(), "-hide_banner", "-i", ruta])
    return "Audio:" in r.stderr


def lado(ruta, sufijo, ext=None):
    """Archivo de salida junto al de entrada; si la entrada está en brutos/, referencias/ o exportados/,
    va a la carpeta hermana trabajo/ (esas carpetas no se tocan)."""
    p = Path(ruta)
    carpeta = p.parent
    if carpeta.name.lower() in ("brutos", "referencias", "exportados"):
        carpeta = carpeta.parent / "trabajo"
        carpeta.mkdir(parents=True, exist_ok=True)
    return carpeta / (p.stem + sufijo + (ext or p.suffix))


# ---------------------------------------------------------------- estado
def cmd_estado(_a):
    r = leer_rutas()
    print(f"shortform-editing · editor v{VERSION} · herramientas en {BASE}")
    if not r:
        print("Aún no hay nada preparado (falta el paso 1).")
        return
    for k in ("python", "node", "ffmpeg", "ffprobe", "hyperframes", "chrome", "modelo"):
        if k in r:
            print(f"  {k:12} {r[k]}")
    for nombre in ("large-v3-turbo", "small"):
        ok = (BASE / "modelos" / f"whisper-{nombre}" / "model.bin").exists()
        print(f"  whisper-{nombre:14} {'sí' if ok else 'no'}")


# ---------------------------------------------------------------- silencios
def detectar_silencios(entrada, umbral, minimo):
    r = correr([ffmpeg(), "-hide_banner", "-nostats", "-i", entrada, "-vn",
                "-af", f"silencedetect=noise={umbral}dB:d={minimo}", "-f", "null", "-"])
    ini = [float(x) for x in re.findall(r"silence_start: (-?[\d.]+)", r.stderr)]
    fin = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", r.stderr)]
    total = duracion(entrada)
    if len(fin) < len(ini):
        fin.append(total)
    return [(max(0.0, s), e) for s, e in zip(ini, fin)], total


def tramos_a_dejar(silencios, total, margen):
    dejar, t = [], 0.0
    for s, e in silencios:
        a, b = s + margen, e - margen          # se deja un poco de aire a cada lado de la voz
        if b - a < 0.08:
            continue
        if a > t:
            dejar.append((t, a))
        t = b
    if total - t > 0.05:
        dejar.append((t, total))
    return [(round(a, 3), round(b, 3)) for a, b in dejar if b - a > 0.05]


def renderizar_tramos(entrada, tramos, salida, con_video):
    """Corta y une con trim/concat; por bloques para no hacer órdenes larguísimas (Windows)."""
    tmp = Path(tempfile.mkdtemp(prefix="editor-"))
    partes = []
    try:
        for i in range(0, len(tramos), 40):
            bloque = tramos[i:i + 40]
            f, etiquetas = [], []
            for j, (a, b) in enumerate(bloque):
                d = b - a
                fade = min(0.012, d / 4)
                if con_video:
                    f.append(f"[0:v]trim=start={a}:end={b},setpts=PTS-STARTPTS[v{j}]")
                f.append(f"[0:a]atrim=start={a}:end={b},asetpts=PTS-STARTPTS,"
                         f"afade=t=in:d={fade:.3f},afade=t=out:st={d - fade:.3f}:d={fade:.3f}[a{j}]")
                etiquetas.append((f"[v{j}]" if con_video else "") + f"[a{j}]")
            n = len(bloque)
            f.append("".join(etiquetas) + f"concat=n={n}:v={1 if con_video else 0}:a=1" +
                     ("[v][a]" if con_video else "[a]"))
            parte = tmp / (f"p{i:05d}" + (".mp4" if con_video else ".m4a"))
            cmd = [ffmpeg(), "-hide_banner", "-y", "-i", entrada, "-filter_complex", ";".join(f)]
            if con_video:
                cmd += ["-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-preset", "veryfast", "-crf", "18",
                        "-pix_fmt", "yuv420p"]
            else:
                cmd += ["-map", "[a]"]
            cmd += ["-c:a", "aac", "-b:a", "192k", str(parte)]
            r = correr(cmd)
            if r.returncode:
                fallar("FFmpeg no pudo cortar el clip: " + r.stderr.strip()[-400:])
            partes.append(parte)
        if len(partes) == 1:
            shutil.move(str(partes[0]), salida)
        else:
            lista = tmp / "lista.txt"
            lista.write_text("".join(f"file '{p.as_posix()}'\n" for p in partes), encoding="utf-8")
            r = correr([ffmpeg(), "-hide_banner", "-y", "-f", "concat", "-safe", "0", "-i", lista,
                        "-c", "copy", "-movflags", "+faststart", salida])
            if r.returncode:
                fallar("FFmpeg no pudo unir los trozos: " + r.stderr.strip()[-400:])
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def quitar_silencios(entrada, salida, umbral, minimo, margen, cortes_json):
    """Quita los silencios de `entrada` y deja el resultado en `salida` (nunca escribe junto a la entrada)."""
    if not tiene_audio(entrada):
        fallar("el clip no tiene sonido, así que no hay silencios que quitar ni voz que transcribir.")
    con_video = tiene_video(entrada)
    Path(salida).parent.mkdir(parents=True, exist_ok=True)
    silencios, total = detectar_silencios(entrada, umbral, minimo)
    tramos = tramos_a_dejar(silencios, total, margen)
    if not tramos:
        fallar("todo el clip parece silencio.", f"prueba con un umbral más bajo, por ejemplo --umbral {umbral - 10}.")
    renderizar_tramos(entrada, tramos, salida, con_video)
    nuevo = duracion(salida)
    quitados = [(round(s, 2), round(e, 2)) for s, e in silencios]
    Path(cortes_json).write_text(json.dumps(
        {"entrada": str(entrada), "umbral_db": umbral, "minimo_s": minimo, "margen_s": margen,
         "silencios": quitados, "tramos_que_quedan": tramos}, indent=1, ensure_ascii=False), encoding="utf-8")
    print(f"OK silencios {Path(salida).name}: {total:.1f} s → {nuevo:.1f} s "
          f"({len(silencios)} silencios quitados, {total - nuevo:.1f} s menos)")
    return salida


def cmd_silencios(a):
    entrada = str(Path(a.entrada).expanduser())
    if not Path(entrada).exists():
        fallar(f"no existe {entrada}.")
    con_video = tiene_video(entrada)
    salida = a.salida or str(lado(entrada, "_sin_silencios", ".mp4" if con_video else ".m4a"))
    return quitar_silencios(entrada, salida, a.umbral, a.minimo, a.margen, lado(salida, "", ".cortes.json"))


# ---------------------------------------------------------------- whisper
def asegurar_modelo(nombre="small"):
    """Ruta local del modelo Whisper. No descarga nada: eso lo hace la preparación (paso 1), con permiso."""
    destino = BASE / "modelos" / f"whisper-{nombre}"
    if (destino / "model.bin").exists():
        return str(destino)
    fallar(f"no está el modelo de voz Whisper {nombre} en {destino}.",
           "repite la preparación (paso 1) dando permiso para descargarlo (preparar.ps1 -Acepto / preparar.sh --acepto).")


def dlls_cuda():
    """Las DLL de cuBLAS y cuDNN vienen en los paquetes pip nvidia-*; Windows no las busca solo."""
    if not ES_WIN or not hasattr(os, "add_dll_directory"):
        return
    for sp in sys.path:
        raiz = Path(sp) / "nvidia"
        if raiz.is_dir():
            for bin_ in raiz.glob("*/bin"):
                try:
                    os.add_dll_directory(str(bin_))
                    os.environ["PATH"] = str(bin_) + os.pathsep + os.environ.get("PATH", "")
                except OSError:
                    pass


def elegir_modelo():
    """(modelo, device, compute_type): GPU si ctranslate2 ve una tarjeta CUDA; si no, CPU."""
    try:
        import ctranslate2
        if ctranslate2.get_cuda_device_count() > 0:
            return MODELO_GPU
    except Exception:
        pass
    return MODELO_CPU


def cargar_whisper():
    from faster_whisper import WhisperModel
    modelo, device, tipo = elegir_modelo()
    if device == "cuda":
        dlls_cuda()
        ruta = asegurar_modelo(modelo)
        try:
            m = WhisperModel(ruta, device=device, compute_type=tipo)
            print(f"  Whisper {modelo} · cuda", flush=True)
            return m
        except Exception as e:
            # Con GPU la preparación solo baja este modelo: se usa el mismo en CPU, sin pedir otro.
            print(f"  AVISO: CUDA no disponible ({str(e)[:80]}); uso {modelo} en CPU, irá bastante más lento.",
                  flush=True)
            m = WhisperModel(ruta, device="cpu", compute_type="int8")
            print(f"  Whisper {modelo} · cpu", flush=True)
            return m
    modelo, device, tipo = MODELO_CPU
    m = WhisperModel(asegurar_modelo(modelo), device=device, compute_type=tipo)
    print(f"  Whisper {modelo} · cpu", flush=True)
    return m


def audio_16k(ruta):
    """Extrae antes el audio (mono 16 kHz) con FFmpeg: no dependemos de PyAV ni de rutas con tildes."""
    import numpy as np
    r = subprocess.run([ffmpeg(), "-v", "error", "-i", str(ruta), "-vn", "-ac", "1", "-ar", "16000", "-f", "f32le", "-"],
                       capture_output=True)
    if r.returncode or not r.stdout:
        fallar("FFmpeg no pudo leer el audio de " + str(ruta) + ": " + r.stderr.decode("utf-8", "replace")[-300:])
    return np.frombuffer(r.stdout, np.float32)


def transcribir(ruta, idioma="es"):
    """Palabras con sus tiempos: [{"p", "ini", "fin"}] (el formato que lee componer.py). Puede ser []."""
    try:
        import faster_whisper  # noqa: F401
    except ImportError:
        fallar("falta faster-whisper en este Python.",
               "usa el Python del editor (el de ~/.editor-video/rutas.json) o repite la preparación.")
    modelo = cargar_whisper()
    t0 = time.time()
    segmentos, info = modelo.transcribe(audio_16k(ruta), language=idioma or None, word_timestamps=True,
                                        beam_size=5, condition_on_previous_text=False, vad_filter=True)
    palabras = []
    for s in segmentos:
        for w in (s.words or []):
            p = w.word.strip()
            if p:
                palabras.append({"p": p, "ini": round(w.start, 2), "fin": round(w.end, 2)})
    print(f"  {len(palabras)} palabras, idioma {info.language}, {time.time() - t0:.0f} s", flush=True)
    return palabras


def agrupar(palabras, max_palabras=4, max_letras=28):
    grupos, actual = [], []
    for w in palabras:
        texto = " ".join(x["p"] for x in actual + [w])
        if actual and (len(actual) >= max_palabras or len(texto) > max_letras):
            grupos.append(actual)
            actual = []
        actual.append(w)
        if re.search(r"[.!?…,:;]$", w["p"]):
            grupos.append(actual)
            actual = []
    if actual:
        grupos.append(actual)
    return grupos


def hms(t):
    t = max(0.0, t)
    h, r = divmod(int(round(t * 1000)), 3600000)
    m, r = divmod(r, 60000)
    s, ms = divmod(r, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def escribir_transcripcion(palabras, srt, max_palabras=4):
    """Deja SRT (para leer) y .palabras.json (para componer.py) con el mismo nombre base."""
    lineas = []
    for i, g in enumerate(agrupar(palabras, max_palabras), 1):
        ini, fin = g[0]["ini"], max(g[-1]["fin"], g[0]["ini"] + 0.3)
        lineas.append(f"{i}\n{hms(ini)} --> {hms(fin)}\n{' '.join(x['p'] for x in g)}\n")
    Path(srt).write_text("\n".join(lineas), encoding="utf-8")
    Path(srt).with_suffix(".palabras.json").write_text(json.dumps(palabras, ensure_ascii=False, indent=0),
                                                        encoding="utf-8")


def cmd_subtitulos(a):
    entrada = str(Path(a.entrada).expanduser())
    if not Path(entrada).exists():
        fallar(f"no existe {entrada}.")
    if not tiene_audio(entrada):
        fallar("el clip no tiene sonido: no hay voz que subtitular.", "sigue sin subtítulos.")
    palabras = transcribir(entrada, a.idioma)
    if not palabras:
        aviso("Whisper no ha oído ninguna palabra; dejo la transcripción vacía.")
    srt = Path(a.salida) if a.salida else lado(entrada, "", ".srt")
    escribir_transcripcion(palabras, srt, a.palabras)
    print(f"OK subtítulos {srt.name}: {len(palabras)} palabras")
    print("   texto:", " ".join(x["p"] for x in palabras)[:300])
    return str(srt), palabras


# ---------------------------------------------------------------- cortar (silencios + transcripción)
def cmd_cortar(a):
    raiz = Path(a.raiz).expanduser().resolve()
    bruto = Path(a.bruto).expanduser()
    if not bruto.is_absolute():
        bruto = raiz / bruto
    if not bruto.is_file():
        fallar(f"no existe el bruto {bruto}.", "pon el vídeo en reels/brutos/ y vuelve a intentarlo.")
    trabajo = raiz / "reels" / "trabajo" / bruto.stem
    trabajo.mkdir(parents=True, exist_ok=True)
    cortado = trabajo / "cortado.mp4"
    if not tiene_video(str(bruto)):
        fallar(f"{bruto.name} no tiene imagen.", "usa el vídeo vertical original (MP4 o MOV).")
    quitar_silencios(str(bruto), str(cortado), a.umbral, a.minimo, a.margen, trabajo / "cortado.cortes.json")
    palabras = transcribir(cortado, a.idioma)
    if not palabras:
        aviso("Whisper no ha oído ninguna palabra: el reel saldrá sin subtítulos. "
              "Comprueba que el clip tiene voz y que se oye bien.")
    escribir_transcripcion(palabras, trabajo / "cortado.srt")
    rel = trabajo.relative_to(raiz).as_posix()
    print(f"OK cortar {bruto.name} → {rel}/cortado.mp4 ({duracion(str(cortado)):.1f} s, {len(palabras)} palabras)")
    print(f"   clip: {rel}/cortado.mp4 · palabras: {rel}/cortado.palabras.json")
    return cortado


# ---------------------------------------------------------------- analizar
def cmd_analizar(a):
    video = str(Path(a.video).expanduser())
    if not Path(video).exists():
        fallar(f"no existe {video}.")
    total = duracion(video)
    info = correr([ffmpeg(), "-hide_banner", "-i", video]).stderr
    m = re.search(r"Video: .*?(\d{3,5})x(\d{3,5}).*?([\d.]+) fps", info)
    ancho, alto, fps = (m.group(1), m.group(2), m.group(3)) if m else ("?", "?", "?")
    cortes = len(re.findall(r"pts_time", correr([ffmpeg(), "-hide_banner", "-i", video, "-an", "-vf",
                 "select='gt(scene,0.3)',showinfo", "-f", "null", "-"]).stderr)) if tiene_video(video) else 0
    lufs = "?"
    if tiene_audio(video):
        e = correr([ffmpeg(), "-hide_banner", "-nostats", "-i", video, "-vn", "-af", "ebur128", "-f", "null", "-"]).stderr
        mm = re.findall(r"I:\s+(-?[\d.]+) LUFS", e)
        lufs = mm[-1] if mm else "?"
    hoja = Path(a.salida) if a.salida else lado(video, "_hoja", ".png")
    if tiene_video(video):
        paso = max(total / 12, 0.5)
        correr([ffmpeg(), "-hide_banner", "-y", "-i", video, "-vf",
                f"fps=1/{paso:.3f},scale=270:-2,tile=4x3:padding=6:color=white", "-frames:v", "1", hoja])
    datos = {"video": Path(video).name, "duracion_s": round(total, 1), "tamano": f"{ancho}x{alto}", "fps": fps,
             "cambios_de_plano": cortes, "cambios_por_minuto": round(cortes / total * 60, 1) if total else 0,
             "plano_medio_s": round(total / (cortes + 1), 2), "volumen_lufs": lufs,
             "hoja": str(hoja) if hoja.exists() else None}
    print(json.dumps(datos, ensure_ascii=False, indent=1))
    return datos


# ---------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser(prog="editor.py", description="Cortes y transcripción (shortform-editing)")
    sub = ap.add_subparsers(dest="orden", required=True)
    sub.add_parser("estado")

    def opciones_silencio(p):
        p.add_argument("--umbral", type=float, default=-35, help="dB por debajo de los cuales es silencio (-35)")
        p.add_argument("--minimo", type=float, default=0.45, help="segundos mínimos para cortar (0,45)")
        p.add_argument("--margen", type=float, default=0.12, help="aire que se deja junto a la voz (0,12 s)")

    p = sub.add_parser("cortar")
    p.add_argument("raiz", help="raíz del proyecto (la carpeta que contiene reels/)")
    p.add_argument("bruto", help="vídeo de reels/brutos/ (relativo a la raíz o absoluto)")
    p.add_argument("--idioma", default="es")
    opciones_silencio(p)
    p = sub.add_parser("silencios")
    p.add_argument("entrada")
    p.add_argument("salida", nargs="?")
    opciones_silencio(p)
    p = sub.add_parser("subtitulos")
    p.add_argument("entrada")
    p.add_argument("--salida")
    p.add_argument("--idioma", default="es")
    p.add_argument("--palabras", type=int, default=4, help="palabras como mucho por subtítulo (4)")
    p = sub.add_parser("analizar")
    p.add_argument("video")
    p.add_argument("--salida", help="dónde dejar la hoja de miniaturas (.png)")
    a = ap.parse_args()
    {"estado": cmd_estado, "cortar": cmd_cortar, "silencios": cmd_silencios, "subtitulos": cmd_subtitulos,
     "analizar": cmd_analizar}[a.orden](a)


if __name__ == "__main__":
    main()
