---
name: shortform-editing
description: "Use when a creator who talks to camera wants a raw vertical clip turned into a finished branded reel, guided step by step — installs local tools (Whisper, ffmpeg, HyperFrames) with consent, interviews the brand (colours, fonts, logo, tone, reference reels), cuts silences, burns branded captions in the lower third, adds face-tracked effects and animated visual resources, shows a contact sheet for approval and exports 1080×1920 versions; checks what already exists and records progress in CLAUDE.md. NOT writing the script or hook (that is `video-shorts`), NOT a Remotion codebase (that is `remotion-video`), NOT scheduling or publishing (that is `social-publisher`)."
tags: [video-editing, shortform, reels, captions, whisper, ffmpeg, hyperframes, brand, vertical-video, guided]
recommends: [video-shorts, shortform-packaging, shortform-strategy, viral-score, social-publisher, brand-identity]
origin: risco
---

# Editor de reels guiado

Conviertes el vídeo en bruto de alguien que habla a cámara en un reel vertical terminado, con su marca, en su
ordenador. La persona no sabe de vídeo: tú llevas el recorrido, paso a paso, y en cada respuesta dices en qué
paso estáis, qué falta y **terminas con una pregunta**. Habla con ella en su idioma, sin jerga.

No escribes el guion ni el gancho (`video-shorts`), no publicas ni programas (`social-publisher`) y no montas
proyectos de Remotion (`remotion-video`). Las palabras del texto de publicación y la portada son de
`shortform-packaging`.

## Reglas duras (antes que cualquier gusto)

1. **Subtítulos abajo.** Van en el tercio inferior: borde superior de la caja a partir del 70 % de la altura,
   borde inferior por encima del 13 % final (botones de Instagram). Nunca bajo la barbilla, nunca sobre la
   cara: ninguna zona los sube; si algo ocupa el tercio inferior, se ocultan mientras dura. No los recoloques a mano: `subs.js` ya los pone ahí. Detalle en
   [references/subtitulos.md](references/subtitulos.md).
2. **La cara libre.** Ningún recurso, efecto ni texto tapa la cara. Si una hoja o un still lo muestra, se
   mueve o se quita.
3. **Nada sale a internet**, salvo la instalación del paso 1 y solo con permiso explícito. Nada de cookies del
   navegador ni de descargar reels ajenos: las referencias las aporta la persona como archivo.
4. **`reels/brutos/` es intocable.** Todo lo que se genera va a `reels/trabajo/` y `reels/exportados/`.
5. **Sin fotos ni caras de terceros.** Las miniaturas de ejemplo son inventadas (`miniaturas.py`); las reales,
   solo si la persona las aporta.
6. **Nunca montes sin un «sí»** a la hoja de contacto. Cada montaje es una versión nueva `_vN`; ninguna se pisa.
7. **Humor sin herir.** Los recursos con ironía no ridiculizan diagnósticos, enfermedades ni identidades.

## Dónde está cada cosa

- `S` = la carpeta `scripts/` de esta skill. `ROOT` = la raíz del proyecto (la que contiene `reels/`).
- `PY` = el `python` de `~/.editor-video/rutas.json` (lo escribe el paso 1). Lanza Python siempre con `-X utf8`.
- Proyecto de la persona:

| Ruta | Qué es |
|---|---|
| `reels/brutos/` | los vídeos tal cual salen del móvil (solo lectura) |
| `reels/referencias/` | 3-5 reels que le gustan, como archivo (opcional) |
| `reels/trabajo/<clip>/` | `cortado.mp4`, `cortado.palabras.json`, `cortado.srt`, `cortado.cortes.json`, `plan.json`, `hoja.png`, stills y pruebas `prueba_<desde>-<hasta>.mp4` |
| `reels/exportados/<clip>_vN.mp4` | las versiones entregadas |
| `reels/marca/estilo.json` | colores, fuentes, logo, handle y frase de cierre (lo leen el motor y los recursos) |
| `reels/marca/` y `reels/marca/miniaturas/` | logos, fuentes propias y miniaturas inventadas |
| `docs/wiki/reels/marca.md`, `receta.md`, `referencias.md` | lo aprendido de la marca, la receta y las referencias |

`estilo.json`: `{"colores": {"fondo", "texto", "acento", "trazo", "suave", "extra"}, "fuentes": {"titulos",
"texto", "manuscrita", "subtitulos"}, "logo", "handle", "cierre": {"frase"}}`. Colores en `#RRGGBB`.

## Paso 0 · Estado (siempre primero)

```bash
node S/inventario.mjs ROOT
```

Imprime qué hay (`herramientas`, `rutaHerramientas`, `marca`, `receta`, `referencias`, `estilo`,
`miniaturas`, `brutosPendientes`, `planesAprobados`, `exportados`, `falta`, `siguiente`) y reescribe la sección `## Reels` de `CLAUDE.md`
entre `<!-- reels:inicio -->` y `<!-- reels:fin -->`, sin tocar nada fuera. Vuelve a lanzarlo **al terminar
cada paso** para que el estado quede apuntado.

Lo que existe no se rehace: dilo en una línea («ya tienes marca y plantillas; vamos directos a editar») y
sigue. Si faltan carpetas de `reels/`, créalas vacías. `siguiente` ya trae el paso que toca; la tabla dice por
qué:

| Si… | Paso |
|---|---|
| `herramientas` es `false` | 1 · Preparar |
| no hay `marca` | 2 · Marca |
| hay `marca` pero falta `estilo`, `receta` o `miniaturas` | 2, solo lo que falte (sin entrevista) |
| hay `planesAprobados` (plan con `"aprobado": true` y sin `_vN`) | 4 · Montar, directamente: sin rehacer transcripción ni hoja |
| hay `brutosPendientes` | 3 · Editar (el más reciente, o el que diga) |
| pide «corrige: …» | 5 · Corregir |
| nada pendiente | pregúntale qué quiere hacer |

## Paso 1 · Preparar (una vez por ordenador)

1. Comprueba sin escribir nada: Windows
   `powershell -NoProfile -ExecutionPolicy Bypass -File "S\preparar.ps1" -SoloComprobar`; Mac/Linux
   `bash S/preparar.sh --solo-comprobar`.
2. Lánzalo sin opciones: lista qué bajaría y cuánto ocupa (unos 3 GB) y sale con código 3 sin descargar nada.
3. Explícale la lista con palabras normales: Whisper y su modelo de voz (transcribe en su ordenador),
   FFmpeg (corta y exporta), Node + HyperFrames + GSAP (dibujan subtítulos y recursos), Python con las
   librerías de efectos; todo en `~/.editor-video`, fuera del proyecto. **Pide permiso.**
4. Solo con un «sí»: repite con `-Acepto` / `--acepto`. Tarda: usa el tiempo de espera máximo o segundo plano.
   Si se corta, se repite la misma orden y salta lo hecho.
5. Confirma con `PY -X utf8 S/editor.py estado` y vuelve al paso 0.

Si algo falla: [references/problemas.md](references/problemas.md).

## Paso 2 · Marca (una vez por proyecto)

**Paquete de traspaso.** Si el proyecto ya trae `docs/wiki/reels/marca.md` (y quizá `receta.md` y
`referencias.md`), no hay entrevista: dilo en una línea («ya traes la marca; me salto la entrevista»). Si
trae `docs/raw/reels/marca/`, copia sus logos y fuentes a `reels/marca/`. Escribe `estilo.json` desde
`marca.md` si falta, y sigue.

**Sin paquete:**

1. Entrevista corta, de una pregunta por mensaje: [references/entrevista-marca.md](references/entrevista-marca.md).
2. Si deja reels de referencia en `reels/referencias/`, analízalos:
   [references/analizar-referencias.md](references/analizar-referencias.md).
3. Escribe `docs/wiki/reels/marca.md`, `docs/wiki/reels/referencias.md` y `reels/marca/estilo.json`.
4. Escribe `docs/wiki/reels/receta.md` partiendo de
   [references/receta-por-defecto.md](references/receta-por-defecto.md) y ajustándola a lo que dijo y a las
   referencias.
5. Miniaturas inventadas para los recursos de feed:
   `PY -X utf8 S/motor/miniaturas.py --estilo ROOT/reels/marca/estilo.json --salida ROOT/reels/marca/miniaturas`.
6. Resúmele la marca en 5 líneas y pregunta qué cambiaría.

## Paso 3 · Editar (un vídeo)

1. **Cortar y transcribir** (nunca toca `reels/brutos/`):
   `PY -X utf8 S/editor.py cortar ROOT reels/brutos/X.mp4 --idioma es` → `reels/trabajo/X/cortado.mp4` y
   `cortado.palabras.json` (`[{"p", "ini", "fin"}]`).
2. **Trabaja desde el texto, no desde el vídeo.** Lee `cortado.palabras.json` y corrige ahí los nombres
   propios y palabras mal oídas (los subtítulos salen de ese fichero).
3. **Escribe `reels/trabajo/X/plan.json`** con `docs/wiki/reels/receta.md` (o la receta por defecto), el
   catálogo de [references/recursos.md](references/recursos.md) y el de
   [references/efectos.md](references/efectos.md). Formato:

```json
{"clip": "reels/trabajo/X/cortado.mp4", "palabras": "reels/trabajo/X/cortado.palabras.json",
 "cortes":   [{"ini": 4.2, "fin": 5.1, "motivo": "muletilla"}],
 "camara":   [{"ini": 1.0, "fin": 2.4, "tipo": "empuje", "zoom": 1.12}],
 "recursos": [{"ini": 2.6, "fin": 5.6, "tipo": "palabra-caja", "opts": {"palabra": "empezar"}}],
 "fx":       [{"ini": 0.0, "fin": 2.5, "fx": "noise", "opts": {}}],
 "enfasis":  ["empezar"], "congelar_final": 0, "aprobado": false}
```

   Tiempos en segundos de `cortado.mp4`; el motor quita los `cortes` y mueve lo demás. `camara.tipo`:
   `golpe` (salto seco, 1,2) o `empuje` (acercamiento suave, 1,12); máximo 1,35. Ejemplo mínimo en
   `S/motor/ejemplo_plan.json`.
4. **Hoja de contacto** (también valida el plan):
   `PY -X utf8 S/hoja.py ROOT X --plan reels/trabajo/X/plan.json` → `reels/trabajo/X/hoja.png` y `hoja.json`.
   Revísala tú primero con [references/revision.md](references/revision.md) (mira `hoja.png` una vez y lee
   `hoja.json`; no abras fotogramas sueltos a tamaño completo) y arregla el plan antes de enseñarla.
5. Dale la ruta completa de `hoja.png` y un resumen de 4-6 líneas: duración final, gancho, recursos, efectos
   y qué has decidido tú. Pregunta: **«¿La apruebas o qué cambio?»**. Pide todas sus notas en un mensaje.

## Paso 4 · Montar (solo con el «sí»)

1. Pon `"aprobado": true` en el plan **solo tras un sí explícito de la persona** a la hoja (o a la corrección
   que pidió). Nunca lo pongas por tu cuenta: `componer.py` se niega a montar el reel completo sin él.
2. `PY -X utf8 S/motor/componer.py reels/trabajo/X/plan.json --proyecto ROOT --still t1,t2,…` con un instante
   en mitad de cada recurso y de cada efecto. Tarda (≈4 s por segundo de vídeo más los efectos): tiempo de
   espera máximo o segundo plano. Sale `reels/exportados/X_vN.mp4` y los stills en `reels/trabajo/X/`.
   `--desde S --hasta S` monta solo un trozo para probar (no hace falta aprobar): va a
   `reels/trabajo/X/prueba_<desde>-<hasta>.mp4`, no gasta versión ni se entrega. Lo mismo un `--still` sin
   aprobar.
3. Revisa los stills con [references/revision.md](references/revision.md). Si falla algo de las reglas duras,
   corrige el plan y monta otra versión antes de entregar.
4. Entrega: ruta del MP4, duración, qué decidiste tú (para que pueda corregirlo) y que lo vea antes de
   publicarlo. Lanza el inventario. Pregunta si lo da por bueno o qué corrige.

## Paso 5 · Corregir

«Corrige: el gancho más grande», «quita la frase del segundo 12», «un zoom cuando digo X»: traduce cada nota a
un cambio del plan (o de `cortado.palabras.json` si es de texto). Si el cambio es pequeño y claro, monta
directamente la versión siguiente (su petición explícita es el sí para ese cambio); si cambia la estructura, pon `"aprobado": false`, regenera la hoja y espera
el «sí». La versión anterior nunca se toca. Una corrección vale para este vídeo; solo si dice «siempre» o
«para todos», apúntala en `docs/wiki/reels/receta.md`.

## Referencias

- [references/entrevista-marca.md](references/entrevista-marca.md) — preguntas de la entrevista y cómo
  escribir `marca.md` y `estilo.json`.
- [references/analizar-referencias.md](references/analizar-referencias.md) — medir 3-5 reels con
  `editor.py analizar` y sacar reglas propias sin copiar.
- [references/receta-por-defecto.md](references/receta-por-defecto.md) — la estructura del reel por defecto.
- [references/recursos.md](references/recursos.md) — los 16 recursos animados, sus `opts` y su zona.
- [references/efectos.md](references/efectos.md) — los 51 efectos `fx` con seguimiento de cara.
- [references/subtitulos.md](references/subtitulos.md) — posición, zonas seguras y énfasis.
- [references/revision.md](references/revision.md) — la lista de comprobación de la hoja y los stills.
- [references/problemas.md](references/problemas.md) — problemas y soluciones de los scripts locales
  (`scripts/preparar.*`, `scripts/editor.py cortar`, `scripts/hoja.py`, `scripts/fx/`).
