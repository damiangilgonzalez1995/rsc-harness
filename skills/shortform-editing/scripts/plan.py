"""Plan de edición de un reel (el que lee motor/componer.py): lectura, validación y remapeo de tiempos.

Formato (rutas relativas a la raíz del proyecto; mira motor/ejemplo_plan.json):
  {"clip": "reels/trabajo/X/cortado.mp4", "palabras": "reels/trabajo/X/cortado.palabras.json",
   "cortes": [{"ini", "fin", "motivo"}], "camara": [{"ini", "fin", "tipo", "zoom"}],
   "recursos": [{"ini", "fin", "tipo", "opts", "zona"}], "fx": [{"ini", "fin", "fx", "opts"}],
   "enfasis": [...], "congelar_final": 0, "aprobado": false}

Los tiempos son segundos sobre cortado.mp4 (el clip ya sin silencios). Los «cortes» quitan trozos más
(muletillas, tomas repetidas); después de cortarlos, lo que va detrás se mueve hacia atrás: eso es «remapear».
"""
import json
import re
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parent


def _nombres_fx():
    """Efectos de fx/fx.py: los de @effect('…'), sus alias y los aspectos con nombre propio (LOOK_NAMES)."""
    f = SCRIPTS / "fx" / "fx.py"
    if not f.exists():
        return set()
    texto = f.read_text(encoding="utf-8")
    nombres = set(re.findall(r"^@effect\('([a-z0-9-]+)'", texto, re.M))
    for bloque in ("ALIASES", "LOOK_NAMES"):
        m = re.search(rf"^{bloque} = \{{(.*?)\}}\s*(#.*)?$", texto, re.M | re.S)
        if m:
            nombres |= set(re.findall(r"'([a-z0-9-]+)':", m.group(1)))
    return nombres


def _recursos():
    d = SCRIPTS / "motor" / "recursos"
    return {p.stem for p in d.glob("*.js")} if d.exists() else set()


NOMBRES_FX = _nombres_fx()
RECURSOS = _recursos()


def fusionar(cortes):
    """Ordena los cortes y une los que se tocan o se solapan. Devuelve [(ini, fin)]."""
    pares = sorted((float(c["ini"]), float(c["fin"])) for c in cortes if float(c["fin"]) > float(c["ini"]))
    juntos = []
    for a, b in pares:
        if juntos and a <= juntos[-1][1]:
            juntos[-1] = (juntos[-1][0], max(juntos[-1][1], b))
        else:
            juntos.append((a, b))
    return juntos


def tramos_que_quedan(cortes, total):
    quedan, t = [], 0.0
    for a, b in fusionar(cortes):
        if a > t:
            quedan.append((t, a))
        t = max(t, b)
    if total > t:
        quedan.append((t, total))
    return [(_n(a), _n(b)) for a, b in quedan]


def _n(x):
    x = round(x, 3)
    return int(x) if x == int(x) else x


def remapear(t, cortes):
    """Tiempo t de cortado.mp4 → tiempo en el reel ya sin los cortes; None si t cae dentro de un corte."""
    quitado = 0.0
    for a, b in fusionar(cortes):
        if t < a:
            break
        if t < b:
            return None
        quitado += b - a
    return _n(t - quitado)


def remapear_tramo(ini, fin, cortes):
    """Recorta [ini, fin] a lo que queda tras los cortes y lo remapea (abarca desde el primer trozo
    que queda hasta el último); None si no queda nada (el tramo cae entero dentro de un corte)."""
    trozos = [(max(ini, a), min(fin, b)) for a, b in tramos_que_quedan(cortes, fin + 1)]
    trozos = [(x, y) for x, y in trozos if y - x > 0.05]
    if not trozos:
        return None
    x, y = trozos[0][0], trozos[-1][1]
    quitado_hasta_y = sum(b - a for a, b in fusionar(cortes) if b <= y)
    return (remapear(x, cortes), _n(y - quitado_hasta_y))


def _tramo_valido(e, que, i):
    try:
        ini, fin = float(e["ini"]), float(e["fin"])
    except (KeyError, TypeError, ValueError):
        raise ValueError(f"{que} {i} necesita «ini» y «fin» en segundos.")
    if ini >= fin:
        raise ValueError(f"{que} {i} empieza después de acabar ({e['ini']} ≥ {e['fin']}).")


def leer_plan(ruta):
    ruta = Path(ruta)
    try:
        datos = json.loads(ruta.read_text(encoding="utf-8-sig"))
    except Exception as e:
        raise ValueError(f"no puedo leer el plan {ruta.name}: {e}")
    if not isinstance(datos, dict):
        raise ValueError("el plan debe ser un objeto JSON.")
    for clave in ("clip", "palabras"):
        if not datos.get(clave):
            raise ValueError(f"el plan no dice «{clave}» (p. ej. reels/trabajo/X/cortado.mp4 y cortado.palabras.json).")
    for clave in ("cortes", "camara", "recursos", "fx", "enfasis"):
        datos.setdefault(clave, [])
    datos.setdefault("aprobado", False)
    for i, c in enumerate(datos["cortes"], 1):
        _tramo_valido(c, "el corte", i)
    for i, c in enumerate(datos["camara"], 1):
        _tramo_valido(c, "el movimiento de cámara", i)
    for i, r in enumerate(datos["recursos"], 1):
        _tramo_valido(r, "el recurso", i)
        if r.get("tipo") not in RECURSOS:
            raise ValueError(f"el recurso {i} es «{r.get('tipo')}», que no existe "
                             f"(hay: {', '.join(sorted(RECURSOS)) or 'ninguno'}).")
    for i, e in enumerate(datos["fx"], 1):
        _tramo_valido(e, "el efecto", i)
        nombre = str(e.get("fx", "")).lower().lstrip("/")
        if nombre not in NOMBRES_FX:
            raise ValueError(f"el efecto {i} es «{e.get('fx')}», que no existe (python fx/fx.py --list).")
    return datos
