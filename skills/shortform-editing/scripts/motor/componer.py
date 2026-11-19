"""Builds a reel as ONE HyperFrames composition (video + camera + resources + captions) and renders it.

Usage:
  python -X utf8 componer.py PLAN.json --proyecto ROOT [--desde S --hasta S] [--still t1,t2,...] [--sin-render]

- Brand colours and fonts come from ROOT/reels/marca/estilo.json (required).
- Relative `clip` / `palabras` paths in the plan resolve against ROOT.
- The full render (no --still, --sin-render, --desde/--hasta) needs "aprobado": true in the plan, set only after
  the person says yes to the contact sheet; otherwise it exits with an error.
- Output: ROOT/reels/exportados/<name>_vN.mp4 (N = next free number; never overwrites) for an approved whole-clip
  render. Partial (--desde/--hasta) or unapproved --still renders are tests: ROOT/reels/trabajo/<name>/
  prueba_<desde>-<hasta>.mp4, overwritten by the same test, never a version.
  Composition, intermediate files and stills: ROOT/reels/trabajo/<name>/.
- Times in the plan, --desde/--hasta and --still are in clip time (before removing `cortes`).
- Tools come from ~/.editor-video/rutas.json (python, node, ffmpeg, ffprobe, hyperframes).
"""
import argparse
import html
import json
import os
import re
import shutil
import subprocess
import sys
import time
from pathlib import Path

AQUI = Path(__file__).resolve().parent
SCRIPTS = AQUI.parent
FX_PY = SCRIPTS / "fx" / "fx.py"                       # Task 5 ports the effects here
MODELO_CARA = SCRIPTS / "fx" / "models" / "yunet.onnx"
FPS = 30
W, H = 1080, 1920
ZOOM_MAX = 1.35
EXT_IMG = (".png", ".jpg", ".jpeg", ".webp")
EXT_FUENTE = (".ttf", ".otf", ".woff", ".woff2")
# Bundled fonts (SIL OFL 1.1, see fonts/OFL.txt): family -> [(file, weight range, style)]
INCLUIDAS = {
    "outfit": ("Outfit", [("Outfit-Variable.ttf", "100 900", "normal")]),
    "source serif 4": ("Source Serif 4", [("SourceSerif4-Variable.ttf", "200 900", "normal"),
                                          ("SourceSerif4-Italic-Variable.ttf", "200 900", "italic")]),
    "caveat": ("Caveat", [("Caveat-Variable.ttf", "400 700", "normal")]),
}
CARA_DEFECTO = {"cx": 0.5, "cy": 0.3, "arriba": 0.2, "abajo": 0.4, "izq": 0.36, "der": 0.64,
                "barbilla": 0.43, "cabeza": 0.15, "muestras": 0}

RUTAS = {}


def fase(t):
    print("· " + t, flush=True)


def aviso(t):
    print("AVISO: " + t, flush=True)


def herramientas():
    """Loads ~/.editor-video/rutas.json once."""
    if not RUTAS:
        f = Path.home() / ".editor-video" / "rutas.json"
        if not f.exists():
            sys.exit(f"ERROR: faltan las herramientas ({f}). Ejecuta primero la preparación (paso 1).")
        RUTAS.update(json.loads(f.read_text(encoding="utf-8-sig")))
        for k in ("node", "ffmpeg", "ffprobe", "hyperframes"):
            if not RUTAS.get(k):
                sys.exit(f"ERROR: rutas.json no tiene «{k}». Repite la preparación (paso 1).")
    return RUTAS


def correr(cmd, **kw):
    r = subprocess.run([str(c) for c in cmd], capture_output=True, text=True, encoding="utf-8", errors="replace", **kw)
    if r.returncode:
        sys.exit(f"ERROR al ejecutar {Path(str(cmd[0])).name}:\n{(r.stdout + r.stderr)[-1500:]}")
    return r


def duracion(ruta):
    r = correr([RUTAS["ffprobe"], "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", ruta])
    return float(r.stdout.strip())


# ------------------------------------------------------------ project layout
def siguiente_salida(exportados, nombre):
    """exportados/<nombre>_vN.mp4 with N = 1 + highest existing version (never overwrites)."""
    patron = re.compile(re.escape(nombre) + r"_v(\d+)\.mp4$", re.I)
    # iterdir + escaped regex: a glob pattern would treat [ ] in the name as a character class
    carpeta = Path(exportados)
    usados = [int(m.group(1)) for f in (carpeta.iterdir() if carpeta.is_dir() else []) if (m := patron.match(f.name))]
    return Path(exportados) / f"{nombre}_v{max(usados, default=0) + 1}.mp4"


def es_montaje_completo(a):
    """A full render is the delivery: no --still, no --sin-render, no --desde/--hasta."""
    return not str(a.still or "").strip() and not a.sin_render and a.desde is None and a.hasta is None


def comprobar_aprobado(plan, a):
    """The person's «sí» is required for the full render; checks, compositions and partial tests are free."""
    if es_montaje_completo(a) and plan.get("aprobado") is not True:
        sys.exit('ERROR: el plan no está aprobado. Enseña la hoja de contacto y, cuando la persona diga que sí, '
                 'pon "aprobado": true en el plan. (Sin aprobar puedes probar con --still, --sin-render o '
                 '--desde/--hasta.)')


def ruta_salida(plan, a, exportados, trabajo, nombre, desde, hasta):
    """Delivery (approved, whole clip) -> exportados/<nombre>_vN.mp4. Anything else is a test that never spends a
    version: trabajo/<clip>/prueba_<desde>-<hasta>.mp4 (overwritten by the next identical test)."""
    if plan.get("aprobado") is True and a.desde is None and a.hasta is None:
        return siguiente_salida(exportados, nombre)
    return Path(trabajo) / f"prueba_{round(desde, 2):g}-{round(hasta, 2):g}.mp4"


def resolver(raiz, ruta):
    p = Path(ruta)
    return p if p.is_absolute() else raiz / p


def nombre_reel(plan, clip):
    """Base name of the reel: plan.salida (stem only), else the clip name (or its folder for cortado.mp4)."""
    if plan.get("salida"):
        return Path(str(plan["salida"])).stem
    return clip.parent.name if clip.stem == "cortado" else clip.stem


def cargar_estilo(raiz):
    f = raiz / "reels" / "marca" / "estilo.json"
    if not f.is_file():
        sys.exit(f"ERROR: falta reels/marca/estilo.json en {raiz}. Haz primero la entrevista de marca "
                 "(colores y fuentes) y guárdala ahí.")
    try:
        estilo = json.loads(f.read_text(encoding="utf-8-sig"))
    except json.JSONDecodeError as e:
        sys.exit(f"ERROR: reels/marca/estilo.json no es JSON válido ({e}).")
    if not isinstance(estilo, dict):
        sys.exit("ERROR: reels/marca/estilo.json debe ser un objeto JSON.")
    return estilo


# ------------------------------------------------------------ times (as in plan.py)
def fusionar(cortes):
    out = []
    for a, b in sorted((float(c["ini"]), float(c["fin"])) for c in cortes):
        if out and a <= out[-1][1]:
            out[-1][1] = max(out[-1][1], b)
        else:
            out.append([a, b])
    return out


def quedan(cortes, total):
    res, t = [], 0.0
    for a, b in fusionar(cortes):
        if a > t:
            res.append((t, a))
        t = max(t, b)
    if total > t:
        res.append((t, total))
    return res


def remapear(t, cortes, dentro=None):
    """Clip time -> final video time. Inside a cut: None, or the edge (dentro='ini'|'fin')."""
    quitado = 0.0
    for a, b in fusionar(cortes):
        if t < a:
            break
        if t < b:
            return None if dentro is None else a - quitado
        quitado += b - a
    return t - quitado


def tramo(ini, fin, cortes):
    a, b = remapear(ini, cortes, "ini"), remapear(fin, cortes, "fin")
    return (a, b) if b - a > 0.05 else None


# ------------------------------------------------------------ face
def detectar_cara(clip, destino):
    """Face box (fractions of 1080x1920), median over 1 frame/s. Frames come through an ffmpeg pipe, so paths
    with spaces or accents work (cv2.VideoCapture does not read them on Windows)."""
    if not MODELO_CARA.exists():
        aviso(f"no está el detector de caras ({MODELO_CARA}); uso una cara centrada por defecto.")
        return dict(CARA_DEFECTO)
    try:
        import cv2
        import numpy as np
    except ImportError:
        aviso("opencv no está instalado en el venv; uso una cara centrada por defecto.")
        return dict(CARA_DEFECTO)
    # Quarter-size frames (270x480) keep the buffer small; coordinates are scaled back by dividing by the
    # small size (the face box is stored as fractions of the frame).
    w, h = W // 4, H // 4
    r = subprocess.run([RUTAS["ffmpeg"], "-v", "error", "-i", str(clip), "-vf",
                        f"fps=1,scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},scale={w}:{h}",
                        "-f", "rawvideo", "-pix_fmt", "bgr24", "pipe:1"], capture_output=True)
    if r.returncode:
        sys.exit(f"ERROR: ffmpeg no ha podido leer el clip para buscar la cara ({clip}):\n"
                 + r.stderr.decode("utf-8", "replace")[-1500:])
    datos = r.stdout
    n = len(datos) // (w * h * 3)
    fd = cv2.FaceDetectorYN.create(str(MODELO_CARA), "", (w, h), 0.6, 0.3, 20)
    filas = []
    for i in range(n):
        img = np.frombuffer(datos, np.uint8, w * h * 3, i * w * h * 3).reshape(h, w, 3)
        _, f = fd.detect(img)
        if f is None or not len(f):
            continue
        q = max(f, key=lambda q: q[2] * q[3] * q[-1])
        x, y, bw, bh = q[:4]
        ojos_y, boca_y = (q[5] + q[7]) / 2, (q[11] + q[13]) / 2
        barbilla = max(y + bh, boca_y + 0.95 * (boca_y - ojos_y))
        filas.append([x, y, x + bw, y + bh, barbilla])
    if not filas:
        aviso("no he encontrado ninguna cara en el clip; uso una cara centrada por defecto.")
        return dict(CARA_DEFECTO)
    izq, arriba, der, abajo, barb = np.median(np.array(filas), axis=0)
    alto = abajo - arriba
    cara = {"cx": (izq + der) / 2 / w, "cy": (arriba + abajo) / 2 / h, "arriba": arriba / h, "abajo": abajo / h,
            "izq": izq / w, "der": der / w, "barbilla": barb / h, "cabeza": max(0.0, arriba - 0.5 * alto) / h}
    cara = {k: round(float(v), 4) for k, v in cara.items()}
    cara["muestras"] = len(filas)
    destino.write_text(json.dumps(cara, indent=1), encoding="utf-8")
    return cara


def cara_cacheada(clip, carpeta):
    destino = carpeta / "cara.json"
    if destino.exists() and destino.stat().st_mtime > Path(clip).stat().st_mtime:
        return json.loads(destino.read_text(encoding="utf-8"))
    fase("cara: detectando (1 fotograma/s)")
    return detectar_cara(clip, destino)


# ------------------------------------------------------------ base video
def preparar_base(clip, cortes, desde, hasta, con_audio, solo_video, congelar=0.0):
    total = duracion(clip)
    trozos = [(max(a, desde), min(b, hasta)) for a, b in quedan(cortes, total)]
    trozos = [(a, b) for a, b in trozos if b - a > 0.02]
    if not trozos:
        sys.exit("ERROR: no queda nada del clip entre --desde y --hasta tras los cortes.")
    f, etq = [], []
    for j, (a, b) in enumerate(trozos):
        d, fade = b - a, min(0.012, (b - a) / 4)
        f.append(f"[0:v]trim=start={a:.3f}:end={b:.3f},setpts=PTS-STARTPTS[v{j}]")
        f.append(f"[0:a]atrim=start={a:.3f}:end={b:.3f},asetpts=PTS-STARTPTS,"
                 f"afade=t=in:d={fade:.3f},afade=t=out:st={d - fade:.3f}:d={fade:.3f}[a{j}]")
        etq.append(f"[v{j}][a{j}]")
    cola_v = f",tpad=stop_mode=clone:stop_duration={congelar:.3f}" if congelar > 0 else ""
    f.append("".join(etq) + f"concat=n={len(trozos)}:v=1:a=1[vc]" + ("[a0]" if congelar > 0 else "[a]"))
    if congelar > 0:
        f.append(f"[a0]apad=pad_dur={congelar:.3f}[a]")
    f.append(f"[vc]scale={W}:{H}:force_original_aspect_ratio=increase:flags=lanczos,crop={W}:{H},"
             f"fps={FPS},setsar=1,format=yuv420p{cola_v}[v]")
    correr([RUTAS["ffmpeg"], "-hide_banner", "-y", "-i", clip, "-filter_complex", ";".join(f), "-map", "[v]",
            "-map", "[a]", "-c:v", "libx264", "-preset", "veryfast", "-crf", "14", "-g", "15", "-c:a", "aac",
            "-b:a", "192k", con_audio])
    correr([RUTAS["ffmpeg"], "-hide_banner", "-y", "-i", con_audio, "-map", "0:v", "-c", "copy", solo_video])
    return duracion(con_audio)


# ------------------------------------------------------------ fx.py effects (behind the head, etc.)
def aplicar_fx(lista, ventana, base, trabajo):
    """Runs scripts/fx/fx.py --plan over base.mp4 (already cut) before HyperFrames. Skipped if fx.py is missing."""
    efectos = []
    for e in lista:
        v = ventana(float(e["ini"]), float(e["fin"]))
        if v:
            efectos.append({"fx": e["fx"], "start": v[0], "end": v[1], **(e.get("opts") or {})})
    if not efectos:
        return
    if not FX_PY.exists():
        aviso(f"no está {FX_PY}; me salto los efectos fx ({', '.join(e['fx'] for e in efectos)}).")
        return
    trabajo.mkdir(parents=True, exist_ok=True)
    plan_fx, salida = trabajo / "efectos.json", trabajo / "base_fx.mp4"
    plan_fx.write_text(json.dumps({"effects": efectos}, ensure_ascii=False, indent=1), encoding="utf-8")
    fase(f"fx.py: {', '.join(e['fx'] for e in efectos)}")
    env = dict(os.environ, PYTHONUTF8="1")
    env["PATH"] = str(Path(RUTAS["ffmpeg"]).parent) + os.pathsep + env.get("PATH", "")
    r = subprocess.run([RUTAS.get("python") or sys.executable, "-X", "utf8", str(FX_PY), "--plan", str(plan_fx),
                        str(base), str(salida)], capture_output=True, text=True, encoding="utf-8", errors="replace",
                       env=env)
    if r.returncode or not salida.exists():
        sys.exit("ERROR fx.py:\n" + (r.stdout + r.stderr)[-1500:])
    correr([RUTAS["ffmpeg"], "-hide_banner", "-y", "-i", salida, "-an", "-vf",
            f"scale={W}:{H},fps={FPS},setsar=1,format=yuv420p",
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "14", "-g", "15", base])


# ------------------------------------------------------------ brand assets
def _norm(s):
    return re.sub(r"[^a-z0-9]", "", str(s).lower())


def preparar_fuentes(estilo, raiz, comp):
    """Copies the fonts the brand names (bundled or from reels/marca/fuentes/) and returns @font-face entries
    [(family, file, weight, style)]. The bundled three are always available as fallbacks."""
    (comp / "fonts").mkdir(parents=True, exist_ok=True)
    pedidas = [str(v) for v in (estilo.get("fuentes") or {}).values() if v]
    familias, vistas = [], set()
    for fam in ["Outfit", "Source Serif 4", "Caveat"] + pedidas:
        fam = re.sub(r"['\"\\;{}<>]", "", fam).strip()
        if not fam or fam.lower() in vistas:
            continue
        vistas.add(fam.lower())
        if fam.lower() in INCLUIDAS:
            nombre, ficheros = INCLUIDAS[fam.lower()]
            for fich, peso, est in ficheros:
                shutil.copyfile(AQUI / "fonts" / fich, comp / "fonts" / fich)
                familias.append((fam, fich, peso, est))
            continue
        propias = raiz / "reels" / "marca" / "fuentes"
        hallados = sorted(p for p in propias.glob("*") if p.suffix.lower() in EXT_FUENTE
                          and _norm(p.stem).startswith(_norm(fam))) if propias.is_dir() else []
        if not hallados:
            aviso(f"no encuentro la fuente «{fam}» (ni incluida ni en reels/marca/fuentes/); se verá otra.")
            continue
        for p in hallados:
            destino = f"marca-{_norm(p.stem)}{p.suffix.lower()}"
            shutil.copyfile(p, comp / "fonts" / destino)
            est = "italic" if "italic" in p.stem.lower() else "normal"
            m = re.search(r"(thin|extralight|light|regular|medium|semibold|bold|extrabold|black)", p.stem.lower())
            pesos = {"thin": "100", "extralight": "200", "light": "300", "regular": "400", "medium": "500",
                     "semibold": "600", "bold": "700", "extrabold": "800", "black": "900"}
            peso = pesos[m.group(1)] if m and "variable" not in p.stem.lower() else "100 900"
            familias.append((fam, destino, peso, est))
    return familias


def preparar_miniaturas(raiz, comp):
    origen = raiz / "reels" / "marca" / "miniaturas"
    lista = []
    if origen.is_dir():
        (comp / "miniaturas").mkdir(parents=True, exist_ok=True)
        for p in sorted(origen.iterdir()):
            if p.suffix.lower() in EXT_IMG:
                destino = f"m{len(lista) + 1:02d}{p.suffix.lower()}"
                shutil.copyfile(p, comp / "miniaturas" / destino)
                lista.append(f"miniaturas/{destino}")
    return lista


def preparar_logo(estilo, raiz, comp):
    logo = estilo.get("logo")
    if not logo:
        return ""
    for base in (raiz / "reels" / "marca", raiz):
        p = resolver(base, logo)
        if p.is_file():
            (comp / "marca").mkdir(parents=True, exist_ok=True)
            destino = comp / "marca" / f"logo{p.suffix.lower()}"
            shutil.copyfile(p, destino)
            return f"marca/{destino.name}"
    aviso(f"no encuentro el logo «{logo}» (relativo a reels/marca/ o a la raíz); el cierre irá sin logo.")
    return ""


# ------------------------------------------------------------ composition
def escribir_composicion(comp, total, cara, palabras, camara, recursos, estilo, raiz, enfasis=()):
    hf = Path(RUTAS["hyperframes"])
    shutil.copyfile(hf / "node_modules" / "gsap" / "dist" / "gsap.min.js", comp / "gsap.min.js")
    shutil.copyfile(AQUI / "subs.js", comp / "subs.js")
    shutil.copyfile(AQUI / "marca.js", comp / "marca.js")
    tipos = sorted({r["tipo"] for r in recursos})
    for t in tipos:
        origen = AQUI / "recursos" / f"{t}.js"
        if not re.fullmatch(r"[a-z0-9-]+", t) or not origen.exists():
            sys.exit(f"ERROR: no existe el recurso «{t}» (mira scripts/motor/recursos/).")
        shutil.copyfile(origen, comp / f"rec-{t}.js")
    familias = preparar_fuentes(estilo, raiz, comp)
    miniaturas = preparar_miniaturas(raiz, comp)
    if not miniaturas and any(t in ("reels-muro", "vistas", "movil-feed") for t in tipos):
        aviso("no hay miniaturas en reels/marca/miniaturas/; las tarjetas saldrán lisas "
              "(crea unas inventadas con miniaturas.py).")
    estilo = dict(estilo, logo=preparar_logo(estilo, raiz, comp))
    fondo = (estilo.get("colores") or {}).get("trazo") or "#000000"
    fondo = fondo if re.fullmatch(r"#[0-9a-fA-F]{6}", str(fondo)) else "#000000"
    fuentes_css = "\n".join(f'@font-face {{ font-family: "{fam}"; src: url("fonts/{fich}"); '
                            f'font-weight: {peso}; font-style: {est}; font-display: block; }}'
                            for fam, fich, peso, est in familias)
    capas = "\n".join(f'<div id="rec{i}" class="capa"></div>' for i in range(len(recursos)))
    datos = {"total": round(total, 3), "estilo": estilo, "camara": camara, "recursos": recursos,
             "enfasis": list(enfasis)}
    precarga = "".join(f'<span style="font-family:\'{html.escape(fam)}\';font-style:{est};font-weight:{w}">Aá</span>'
                       for fam, _, _, est in familias for w in (400, 600, 700, 800))

    def js(v):
        return json.dumps(v, ensure_ascii=False).replace("</", "<\\/")

    pagina = f"""<!doctype html>
<html lang="es" data-resolution="portrait"><head><meta charset="UTF-8"><meta name="viewport" content="width={W}, height={H}">
<script src="gsap.min.js"></script>
<script>window.REC = window.REC || {{}}; window.MINIATURAS = {js(miniaturas)};</script>
<script src="marca.js"></script>
{''.join(f'<script src="rec-{t}.js"></script>' for t in tipos)}
<script src="subs.js"></script>
<style>
{fuentes_css}
* {{ margin:0; padding:0; box-sizing:border-box; }}
html, body {{ width:{W}px; height:{H}px; overflow:hidden; background:{fondo}; }}
#cam {{ position:absolute; left:0; top:0; width:{W}px; height:{H}px; overflow:hidden; }}
#mueve {{ position:absolute; left:0; top:0; width:{W}px; height:{H}px; will-change:transform; }}
#clip {{ position:absolute; left:0; top:0; width:{W}px; height:{H}px; object-fit:cover; }}
.capa {{ position:absolute; left:0; top:0; width:{W}px; height:{H}px; pointer-events:none; overflow:hidden; }}
#precarga {{ position:absolute; left:-9999px; top:0; opacity:0; }}
</style></head>
<body><div id="root" data-composition-id="main" data-start="0" data-duration="{total:.3f}" data-width="{W}" data-height="{H}" data-fps="{FPS}">
<div id="cam"><div id="mueve"><video id="clip" class="clip" src="base.mp4" muted playsinline data-start="0" data-duration="{total:.3f}" data-track-index="0"></video></div></div>
{capas}
<div id="subs" class="capa"></div>
<div id="precarga">{precarga}</div>
</div>
<script>
window.CARA = {js(cara)};
window.PALABRAS = {js(palabras)};
window.DATOS = {js(datos)};
(function () {{
  var D = window.DATOS, C = window.CARA, tl = gsap.timeline({{ paused: true }});
  var ctx = {{ cara: C, estilo: D.estilo }}, apartar = [];
  D.recursos.forEach(function (r, i) {{
    var res = window.REC[r.tipo](tl, document.getElementById("rec" + i), r.ini, r.fin - r.ini, r.opts || {{}}, ctx) || {{}};
    apartar.push({{ ini: r.ini, fin: r.fin, zona: r.zona || res.zona || "pantalla" }});
  }});
  // Camera: only the video layer zooms, around the face. Captions and resources stay fixed in frame
  // coordinates (the caption layer is never moved or scaled by the camera).
  var mueve = document.getElementById("mueve");
  gsap.set(mueve, {{ transformOrigin: (C.cx * {W}) + "px " + (C.cy * {H}) + "px", scale: 1 }});
  D.camara.forEach(function (c) {{
    var z = Math.min(c.zoom || (c.tipo === "golpe" ? 1.2 : 1.12), {ZOOM_MAX});
    if (c.tipo === "golpe") {{
      tl.to(mueve, {{ scale: z, duration: 0.06, ease: "power2.out" }}, c.ini);
      tl.to(mueve, {{ scale: 1, duration: 0.06, ease: "power2.in" }}, c.fin - 0.06);
    }} else {{
      var d = Math.max(0.3, c.fin - c.ini);
      tl.fromTo(mueve, {{ scale: 1 }}, {{ scale: z, duration: d, ease: "sine.inOut", immediateRender: false }}, c.ini);
      tl.set(mueve, {{ scale: 1 }}, c.fin);
    }}
  }});
  window.SUBS(tl, document.getElementById("subs"), window.PALABRAS, {{ estilo: D.estilo, apartar: apartar, enfasis: D.enfasis || [] }});
  tl.set({{}}, {{}}, D.total);
  window.__timelines = window.__timelines || {{}};
  window.__timelines["main"] = tl;
  tl.seek(0);
}})();
</script></body></html>
"""
    (comp / "index.html").write_text(pagina, encoding="utf-8")


def render(comp, salida):
    env = dict(os.environ, HYPERFRAMES_NO_TELEMETRY="1")
    env["PATH"] = os.pathsep.join([str(Path(RUTAS["node"]).parent), str(Path(RUTAS["ffmpeg"]).parent),
                                   env.get("PATH", "")])
    if RUTAS.get("chrome"):
        env["HYPERFRAMES_BROWSER_PATH"] = RUTAS["chrome"]
    cli = Path(RUTAS["hyperframes"]) / "node_modules" / "hyperframes" / "bin" / "hyperframes.mjs"
    r = subprocess.run([RUTAS["node"], str(cli), "render", "-o", str(salida), "--quiet"], cwd=comp, env=env,
                       capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=3600)
    if r.returncode or not Path(salida).exists():
        sys.exit("ERROR HyperFrames:\n" + (r.stdout + r.stderr)[-2000:])


# ------------------------------------------------------------ main
def main():
    for s in (sys.stdout, sys.stderr):
        try:
            s.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass
    ap = argparse.ArgumentParser(description="Monta un reel como una composición HyperFrames.")
    ap.add_argument("plan")
    ap.add_argument("--proyecto", required=True, help="raíz del proyecto (la carpeta que contiene reels/)")
    ap.add_argument("--desde", type=float)
    ap.add_argument("--hasta", type=float)
    ap.add_argument("--still", default="", help="instantes (tiempo del clip) separados por comas")
    ap.add_argument("--sin-render", action="store_true", help="solo escribe la composición")
    a = ap.parse_args()

    raiz = Path(a.proyecto).resolve()
    estilo = cargar_estilo(raiz)
    plan = json.loads(Path(a.plan).read_text(encoding="utf-8-sig"))
    if "estilo" in plan:
        aviso("el campo «estilo» del plan ya no se usa: el estilo sale de reels/marca/estilo.json.")
    comprobar_aprobado(plan, a)
    herramientas()
    clip = resolver(raiz, plan["clip"])
    if not clip.is_file():
        sys.exit(f"ERROR: no encuentro el clip {clip}")
    ruta_palabras = resolver(raiz, plan["palabras"])
    if not ruta_palabras.is_file():
        sys.exit(f"ERROR: no encuentro las palabras {ruta_palabras}")
    cortes = plan.get("cortes", [])
    nombre = nombre_reel(plan, clip)
    trabajo = raiz / "reels" / "trabajo" / nombre
    exportados = raiz / "reels" / "exportados"
    trabajo.mkdir(parents=True, exist_ok=True)
    comp = trabajo / "comp"
    if comp.exists():
        shutil.rmtree(comp)
    comp.mkdir(parents=True)

    total_clip = duracion(clip)
    desde = a.desde if a.desde is not None else 0.0
    hasta = min(a.hasta if a.hasta is not None else total_clip, total_clip)
    t0 = remapear(desde, cortes, "fin")
    salida = ruta_salida(plan, a, exportados, trabajo, nombre, desde, hasta)
    salida.parent.mkdir(parents=True, exist_ok=True)

    cara = cara_cacheada(clip, trabajo)
    fase(f"cara: {cara}")

    inicio = time.time()
    congelar = float(plan.get("congelar_final", 0) or 0) if hasta >= total_clip - 0.01 else 0.0
    con_audio = trabajo / "base_audio.mp4"
    total = preparar_base(clip, cortes, desde, hasta, con_audio, comp / "base.mp4", congelar)
    fase(f"base: {hasta - desde:.2f} s del clip -> {total:.2f} s tras cortes")

    def ventana(ini, fin):
        tr = tramo(max(ini, desde), min(fin, hasta), cortes)
        if not tr:
            return None
        x, y = round(tr[0] - t0, 3), round(min(tr[1] - t0, total), 3)
        if congelar and fin > total_clip - 0.01:
            y = round(total, 3)
        return (x, y) if y - x > 0.05 else None

    palabras = []
    for w in json.loads(ruta_palabras.read_text(encoding="utf-8-sig")):
        v = ventana(float(w["ini"]), float(w["fin"]))
        if v:
            palabras.append({"p": w["p"], "ini": v[0], "fin": v[1]})
    camara, recursos = [], []
    for c in plan.get("camara", []):
        v = ventana(float(c["ini"]), float(c["fin"]))
        if v:
            camara.append({"tipo": c.get("tipo", "golpe"), "zoom": min(float(c.get("zoom", 0) or 0), ZOOM_MAX) or None,
                           "ini": v[0], "fin": v[1]})
    for r in plan.get("recursos", []):
        v = ventana(float(r["ini"]), float(r["fin"]))
        if v:
            rec = {"tipo": r["tipo"], "ini": v[0], "fin": v[1], "opts": r.get("opts", {})}
            if r.get("zona"):
                rec["zona"] = r["zona"]
            recursos.append(rec)
    fase(f"{len(palabras)} palabras, {len(camara)} cámaras, {len(recursos)} recursos")
    aplicar_fx(plan.get("fx", []), ventana, comp / "base.mp4", trabajo / "fx")
    escribir_composicion(comp, total, cara, palabras, camara, recursos, estilo, raiz, plan.get("enfasis") or [])
    if a.sin_render:
        print(f"LISTO composición en {comp}")
        return

    sin_audio = trabajo / "render_sinaudio.mp4"
    fase("render HyperFrames…")
    t_r = time.time()
    render(comp, sin_audio)
    dt = time.time() - t_r
    fase(f"render: {dt:.1f} s para {total:.1f} s de vídeo ({dt / total:.2f} s por segundo)")
    correr([RUTAS["ffmpeg"], "-hide_banner", "-y", "-i", sin_audio, "-i", con_audio,
            "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-ar", "48000",
            "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", salida])
    for t in [float(x) for x in a.still.split(",") if x.strip()]:
        rt = (remapear(t, cortes, "fin") or 0.0) - t0
        png = trabajo / f"{salida.stem}_t{t:g}.png"
        correr([RUTAS["ffmpeg"], "-hide_banner", "-y", "-ss", f"{max(0, rt):.3f}", "-i", salida, "-frames:v", "1", png])
        fase(f"still {t:g} s -> {png}")
    fase(f"total: {time.time() - inicio:.1f} s")
    print(f"LISTO {salida}")


if __name__ == "__main__":
    main()
