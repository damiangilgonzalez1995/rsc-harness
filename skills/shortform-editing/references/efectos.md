# Efectos `fx`

51 efectos de vídeo que siguen la cara y pueden ir **detrás de la cabeza** (la persona queda delante). Son de
Vibha Ramprakash (@vibha.in.progress), licencia MIT: `scripts/fx/LICENSE`, `scripts/fx/NOTICE` y
`scripts/fx/models/NOTICE.md`. Los nombres se quedan en inglés, tal cual. Lista viva:
`PY -X utf8 S/fx/fx.py --list` (`PY`, `S` y `ROOT` como en el SKILL.md).

## En el plan

```json
{"ini": 0.0, "fin": 2.6, "fx": "noise", "opts": {"images": "ROOT/reels/marca/miniaturas"}}
```

`componer.py` los aplica sobre el clip ya cortado, antes de dibujar recursos y subtítulos, con los tiempos
remapeados. `opts` son las opciones de la tabla (todas opcionales); `text` con varias líneas usa `|`.

- Ventanas cortas: 1,5-4 s. Pocos y con intención: como mucho uno cada 5-10 s.
- Los subtítulos no ven los efectos: si uno ocupa el tercio inferior, añade un recurso `hueco` en ese tramo
  (oculta los subtítulos mientras dura; nunca los sube).
- `images`: carpeta con imágenes o clips. Usa la ruta absoluta de `reels/marca/miniaturas/` (inventadas) o
  una carpeta que aporte la persona; sin `images`, el efecto usa fotogramas del propio vídeo.
- Zoom nunca por encima de 2×. Los de cámara (`locked-on`, `lean-in`, `spotlight`, `slow-push`) van primero si
  se solapan con otros.
- Solo añaden imagen: ni sonido ni subtítulos.
- Son efectos de inicio; si la persona los compara con un reel profesional, dilo con honestidad.

## Prueba rápida sin montar

```bash
PY -X utf8 S/fx/fx.py --plan efectos.json reels/trabajo/X/cortado.mp4 reels/trabajo/X/check.png --still 1.2,4.5
```

con `efectos.json` = `{"effects": [{"fx": "noise", "start": 0, "end": 2.6}]}`. Mira los PNG pequeños: si tapan
la cara, se salen por el borde o no se leen, cambia texto, tiempos u opciones.

## Los 51

| # | `fx` | Qué hace | `opts` |
|---|---|---|---|
| 1 | `noise` | reels que se apilan detrás de la cabeza, uno cada cuarto de segundo | `images`, `size` |
| 2 | `lineup` | fichas numeradas en abanico sobre la cabeza | `text` (nombres con `\|`) |
| 3 | `locked-on` | corchetes que se clavan en la cara y la cámara la sigue | `zoom` (1,35), `text` |
| 4 | `orbit` | reels que giran alrededor de la cabeza | `images`, `count`, `speed`, `size` |
| 5 | `lean-in` | acercamiento rápido en una palabra | `zoom` (1,45, máx. 2), `speed` |
| 6 | `backdrop-word` | una palabra gigante cae detrás | `text`, `color`, `font` (`bold`/`serif`) |
| 7 | `spotlight` | se apagan las luces y solo queda la persona iluminada | `text`, `color`, `push` |
| 8 | `the-bill` | instrucciones impresas como un tique en la pared | `text` (líneas con `\|`) |
| 9 | `moody` | gradación de color | `grade` (`moody`, `bw`, `warm`, `cool`, `pop`) |
| 10 | `swipe` | deslizador de antes y después | `grade` |
| 11 | `todo` | checklist junto a la cabeza que se va marcando | `text` (puntos con `\|`), `ticks`, `title` |
| 12 | `tap` | botón «Seguir» que pasa a «Siguiendo» | `at`, `x`, `y` (0-1), `color` |
| 13 | `pause-point` | congela la imagen y señala con una flecha dibujada | `text`, `color`, `label_x` |
| 14 | `uninstall` | barra de desinstalar que rompe la imagen | `text` |
| 15 | `reel-frame` | el vídeo se encoge en una tarjeta de reel | `text` (usuario) |
| 16 | `shortcut-rain` | teclas que llueven detrás | `text` (teclas con `\|`), `count` |
| 17 | `reject-stamp` | un sello rojo golpea la pantalla | `text`, `color`, `angle`, `y` |
| 18 | `countdown-flip` | reloj 3, 2, 1 sobre la cabeza | `from` |
| 19 | `rabbit-hole` | la imagen se mete en sí misma girando | `ratio`, `speed`, `spin` |
| 20 | `cover-star` | portada de revista con el título detrás de la cabeza | `text`, `lines`, `issue`, `color` |
| 21 | `scribble` | garabatos de rotulador alrededor | `text`, `color` |
| 22 | `red-collage` | blanco y negro, palabra roja gigante detrás y tres líneas | `text`, `lines`, `tag` |
| 23 | `split-headline` | un titular baja y empuja a la persona hacia abajo | `text`, `hl`, `pill` |
| 24 | `pastel-word` | sala pastel, palabra gigante detrás y una ficha de perfil | `text`, `name`, `handle` |
| 25 | `check-pills` | papel cuadriculado, reels clavados y pastillas que se pulsan | `text`, `images` |
| 26 | `headline-box` | acercamiento con titular de dos líneas, la segunda en caja | `text`, `zoom` |
| 27 | `profile-wall` | cuadrícula de reels en la pared y un contador | `images`, `count`, `label` |
| 28 | `tier-list` | cae una tier list y algo vuela al nivel S | `title`, `item`, `others` |
| 29 | `broll-split` | pantalla partida: recurso arriba, persona abajo | `images`, `text` |
| 30 | `phone-fan` | reels en abanico de móviles bajo un titular de dos líneas | `images`, `text` (vacío = sin titular), `body`, `x`, `y`, `spread`, `scale` |
| 31 | `dot-reveal` | el plano se forma con puntos que brillan | `color`, `cell` |
| 32 | `headline-wall` | titulares que se apilan detrás y un total delante | `text` (`titular::dato\|…`), `total`, `label` |
| 33 | `checklist` | lista de tareas bajo la barbilla que gira y se marca | `text` (`paso::dato\|…`), `title` |
| 34 | `glass-widgets` | widgets de cristal esmerilado alrededor de la cabeza | `text`, `name`, `handle`, `look` |
| 35 | `timeline` | grado rojo de cine con línea de tiempo y REC | `text`, `sub`, `tc` |
| 36 | `comment-box` | caja de comentarios que escribe, publica y recibe respuesta | `text` |
| 37 | `liquid-glass-graph` | tarjeta de cristal con una gráfica que sube y un número | `text`, `from`, `to`, `color` |
| 38 | `carousel-spin` | carrusel 3D de reels alrededor | `images`, `count`, `size`, `turns` |
| 39 | `match-cut` | páginas que cortan sobre una palabra fija detrás | `text`, `color` |
| 40 | `apple-toggles` | tarjeta de ajustes que activa interruptores | `text` (filas con `\|`), `ticks`, `color`, `pos` |
| 41 | `led-sign` | bajan las luces y un cartel LED se escribe detrás | `text`, `color`, `push` |
| 42 | `slow-push` | acercamiento lento con el fondo desenfocándose | `zoom` (1,6), `blur` |
| 43 | `over-the-shoulder-zoom` | la cámara entra en una esquina con una gráfica de cristal, luego en la otra | `text`, `to`, `zoom` |
| 44 | `messages` | notificaciones de mensajes que se apilan | `text` (con `\|`), `title`, `y` |
| 45 | `place-in-grid` | la persona se encoge al centro de una cuadrícula 3×3 de reels | `images`, `views` |
| 46 | `tape-label` | tira de cinta con una frase sobre el pecho | `text` |
| 47 | `select-resize` | caja de selección que agranda un número | `text` |
| 48 | `wave-trim` | panel con la onda de voz cuyos silencios se recortan | — |
| 49 | `huge-strike` | palabra enorme con serifa detrás, tachada con una línea | `text`, `at` |
| 50 | `crayon-write` | una cera escribe una palabra detrás y la subraya | `text` |
| 51 | `fan-build` | portadas de reels que se reparten en abanico detrás | `images`, `count` |

**Aspectos con nombre** (variantes, no cuentan en los 51): `glitter-spotlight` (= `spotlight` con brillo
dorado); `cover-star` con `look=editorial`; `liquid-glass-graph` con `look=bento`; `apple-toggles` con
`pos=below` para ponerlo bajo la barbilla.

Alias que también valen: `bill`, `to-do`, `follow`, `stamp`, `countdown`, `cover`, `rain`, `pause`, `fan`,
`push`, `tape`, `strike`, `crayon`, `grid` y otros (bloque `ALIASES` de `scripts/fx/fx.py`).

## Los que mejor casan con la receta por defecto

`noise` y `phone-fan` (gancho), `fan-build`, `orbit`, `profile-wall` (redes, alcance), `lean-in` y
`slow-push` (subrayar una frase), `backdrop-word`, `huge-strike` y `crayon-write` (una palabra detrás de la
cabeza). Los de texto encima (`split-headline`, `headline-box`, `red-collage`) cuentan como frase grande.
