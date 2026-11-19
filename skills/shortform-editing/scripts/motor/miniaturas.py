"""Invented reel thumbnails in the brand palette, for the resources that show a feed or a wall of reels
(reels-muro, vistas, movil-feed). No photos, no faces, no real accounts: gradient, soft blobs, a featureless
line silhouette or abstract shapes, an invented Spanish headline and invented view/like counts.

Usage:
  python -X utf8 miniaturas.py --estilo ROOT/reels/marca/estilo.json --n 16 --salida ROOT/reels/marca/miniaturas
"""
import argparse
import json
import random
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

AQUI = Path(__file__).resolve().parent
FUENTES = AQUI / "fonts"
W, H = 540, 960
NEUTRO = {"fondo": "#FFFFFF", "texto": "#FFFFFF", "trazo": "#1F1F24", "acento": "#FFC83D",
          "suave": "#BFC8D6", "extra": "#A9C4A4"}
TITULOS = [
    ("rutina", "5 errores que todos cometemos"), ("idea", "Lo que nadie te cuenta"),
    ("reto", "¿Y si empiezas hoy?"), ("rutina", "Esto cambió mi semana"),
    ("consejo", "3 ideas para tu lunes"), ("verdad", "No es pereza, es cansancio"),
    ("truco", "El truco de los 10 minutos"), ("antes y después", "Un mes después"),
    ("método", "Mi método favorito"), ("resumen", "Lo que aprendí este año"),
    ("pregunta", "La pregunta incómoda"), ("mitos", "Mitos que hay que soltar"),
    ("consejo", "Hazlo simple"), ("idea", "Un consejo que sí funciona"),
    ("encuesta", "¿Te pasa también?"), ("guía", "Guarda esto para luego"),
]


def color(h, defecto):
    h = str(h or "")
    if len(h) == 7 and h.startswith("#"):
        try:
            return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))
        except ValueError:
            pass
    return color(defecto, "#000000")


def mezcla(a, b, t):
    return tuple(round(x + (y - x) * t) for x, y in zip(a, b))


def luminancia(c):
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]


def fuente(nombre, peso, tam, carpeta_marca):
    """Bundled variable font set to `peso`, or a brand font file from reels/marca/fuentes, or Pillow's default."""
    incluidas = {"outfit": "Outfit-Variable.ttf", "source serif 4": "SourceSerif4-Variable.ttf",
                 "caveat": "Caveat-Variable.ttf"}
    candidatos = []
    if str(nombre).lower() in incluidas:
        candidatos.append(FUENTES / incluidas[str(nombre).lower()])
    if carpeta_marca and carpeta_marca.is_dir():
        clave = "".join(ch for ch in str(nombre).lower() if ch.isalnum())
        candidatos += sorted(p for p in carpeta_marca.iterdir() if p.suffix.lower() in (".ttf", ".otf")
                             and "".join(ch for ch in p.stem.lower() if ch.isalnum()).startswith(clave))
    candidatos.append(FUENTES / "Outfit-Variable.ttf")
    for p in candidatos:
        try:
            f = ImageFont.truetype(str(p), tam)
            try:
                f.set_variation_by_axes([peso])
            except Exception:
                pass
            return f
        except OSError:
            continue
    return ImageFont.load_default()


def envolver(d, texto, f, ancho):
    lineas, actual = [], ""
    for palabra in texto.split():
        prueba = (actual + " " + palabra).strip()
        if d.textlength(prueba, font=f) <= ancho or not actual:
            actual = prueba
        else:
            lineas.append(actual)
            actual = palabra
    if actual:
        lineas.append(actual)
    return lineas


def silueta(d, cx, cy, esc, tinta, relleno, ancho):
    """Head and shoulders, no features (an oval and a rounded shoulder arc)."""
    r = 70 * esc
    if relleno:
        d.ellipse([cx - r, cy - r * 1.15, cx + r, cy + r * 1.15], fill=relleno)
        d.pieslice([cx - 2.1 * r, cy + 1.35 * r, cx + 2.1 * r, cy + 5.2 * r], 180, 360, fill=relleno)
    d.ellipse([cx - r, cy - r * 1.15, cx + r, cy + r * 1.15], outline=tinta, width=ancho)
    d.arc([cx - 2.1 * r, cy + 1.35 * r, cx + 2.1 * r, cy + 5.2 * r], 180, 360, fill=tinta, width=ancho)


def formas(d, R, pal, tinta):
    """Abstract option: stacked circles and a wavy hand line."""
    for k in range(3):
        x, y, r = R.randint(90, 450), R.randint(400, 700), R.randint(50, 120)
        d.ellipse([x - r, y - r, x + r, y + r], fill=pal[k % len(pal)], outline=tinta, width=5)
    pts = [(40 + i * 23, 760 + 18 * ((i % 4) - 1.5)) for i in range(21)]
    d.line(pts, fill=tinta, width=6, joint="curve")


def miniatura(i, colores, fuentes_marca, carpeta_marca, R):
    c = {k: color(colores.get(k), v) for k, v in NEUTRO.items()}
    pares = [(c["suave"], c["acento"]), (c["fondo"], c["extra"]), (c["trazo"], c["suave"]),
             (c["extra"], c["fondo"]), (c["acento"], c["suave"]), (c["fondo"], c["suave"])]
    a, b = pares[i % len(pares)]
    img = Image.new("RGB", (W, H))
    d = ImageDraw.Draw(img)
    for y in range(H):
        d.line([(0, y), (W, y)], fill=mezcla(a, b, y / H))
    claro = luminancia(mezcla(a, b, 0.5)) > 150
    tinta = c["trazo"] if claro else c["fondo"]
    # soft blobs
    capa = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    dc = ImageDraw.Draw(capa)
    for k in range(2):
        x, y, r = R.randint(0, W), R.randint(300, 900), R.randint(140, 240)
        dc.ellipse([x - r, y - r, x + r, y + r], fill=(*[c["fondo"], c["extra"], c["suave"]][(i + k) % 3], 110))
    img.paste(capa.filter(ImageFilter.GaussianBlur(50)), (0, 0), capa.filter(ImageFilter.GaussianBlur(50)))
    d = ImageDraw.Draw(img)
    if i % 3 == 2:
        formas(d, R, [c["suave"], c["extra"], c["acento"]], tinta)
    else:
        relleno = [c["suave"], c["extra"], c["acento"], None][i % 4]
        silueta(d, W / 2 + R.randint(-60, 60), 470, 1.15, tinta, relleno, 6)
    # headline
    kicker, titulo = TITULOS[i % len(TITULOS)]
    fk = fuente(fuentes_marca.get("titulos", "Outfit"), 700, 24, carpeta_marca)
    ft = fuente(fuentes_marca.get("titulos", "Outfit"), 800, 66, carpeta_marca)
    kw = d.textlength(kicker.upper(), font=fk) + 36
    d.rounded_rectangle([40, 70, 40 + kw, 70 + 46], radius=23, fill=c["acento"] if claro else c["suave"])
    d.text((58, 80), kicker.upper(), font=fk, fill=c["trazo"])
    y = 140
    for linea in envolver(d, titulo, ft, W - 80)[:3]:
        d.text((40, y), linea, font=ft, fill=tinta)
        y += 70
    # invented counts
    fm = fuente(fuentes_marca.get("titulos", "Outfit"), 700, 30, carpeta_marca)
    vistas = R.choice(["12,4 mil", "86 mil", "230 mil", "1,1 M", "2,4 M", "640 mil"])
    likes = R.choice(["1.204", "8,7 mil", "21 mil", "64 mil", "131 mil"])
    sombra = Image.new("RGBA", (W, 200), (0, 0, 0, 0))
    ImageDraw.Draw(sombra).rectangle([0, 0, W, 200], fill=(0, 0, 0, 70))
    img.paste(sombra.filter(ImageFilter.GaussianBlur(30)), (0, H - 170), sombra.filter(ImageFilter.GaussianBlur(30)))
    d = ImageDraw.Draw(img)
    blanco = c["fondo"] if luminancia(c["fondo"]) > 150 else (255, 255, 255)
    d.polygon([(34, H - 66), (34, H - 34), (60, H - 50)], fill=blanco)
    d.text((72, H - 68), vistas, font=fm, fill=blanco)
    x = 72 + d.textlength(vistas, font=fm) + 34
    d.ellipse([x, H - 64, x + 16, H - 48], fill=blanco)
    d.ellipse([x + 12, H - 64, x + 28, H - 48], fill=blanco)
    d.polygon([(x, H - 56), (x + 28, H - 56), (x + 14, H - 36)], fill=blanco)
    d.text((x + 40, H - 68), likes, font=fm, fill=blanco)
    return img


def main():
    ap = argparse.ArgumentParser(description="Genera miniaturas de reels inventadas con la paleta de la marca.")
    ap.add_argument("--estilo", required=True, help="ruta de reels/marca/estilo.json")
    ap.add_argument("--n", type=int, default=16)
    ap.add_argument("--salida", required=True, help="carpeta de salida (p. ej. reels/marca/miniaturas)")
    ap.add_argument("--semilla", type=int, default=7)
    a = ap.parse_args()
    ruta = Path(a.estilo)
    if not ruta.is_file():
        sys.exit(f"ERROR: no encuentro {ruta}")
    estilo = json.loads(ruta.read_text(encoding="utf-8-sig"))
    salida = Path(a.salida)
    salida.mkdir(parents=True, exist_ok=True)
    R = random.Random(a.semilla)
    for i in range(max(1, a.n)):
        img = miniatura(i, estilo.get("colores") or {}, estilo.get("fuentes") or {}, ruta.parent / "fuentes", R)
        img.save(salida / f"miniatura_{i + 1:02d}.png")
    print(f"LISTO {a.n} miniaturas en {salida}")


if __name__ == "__main__":
    main()
