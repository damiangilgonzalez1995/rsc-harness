# Recursos animados

Son los gráficos que se dibujan encima del vídeo: `scripts/motor/recursos/<tipo>.js`. Toman colores y fuentes
de `reels/marca/estilo.json`, nunca llevan emojis ni fotos de terceros, y saben dónde está la cara. La fuente
de verdad de cada uno es el comentario de cabecera de su fichero; esto es el resumen para elegir.

En el plan:

```json
{"ini": 6.0, "fin": 10.5, "tipo": "reels-muro", "opts": {"lado": "der"}, "zona": "lado"}
```

`ini`/`fin` en segundos de `cortado.mp4`. `opts` y `zona` son opcionales. La **zona** dice a los subtítulos
qué evitar (ver [subtitulos.md](subtitulos.md)): `pantalla` y `abajo` los ocultan solo mientras dura el
recurso (nunca los suben hacia la cara), el resto no los mueve.

Colores de marca que usan: `fondo` (tarjetas), `texto` (letras sobre el vídeo), `trazo` (tinta y líneas),
`acento` (lo destacado), `suave` y `extra` (rellenos). `*palabra*` en un texto la marca en el acento cuando el
recurso lo admite.

## Visuales (la base de la receta)

| `tipo` | Qué es | `opts` principales | Zona |
|---|---|---|---|
| `reels-muro` | muro de miniaturas de reels que caen en cascada a un lado, con un contador de vistas que se acelera | `imgs` (n.º o nombre en `reels/marca/miniaturas/`), `lado` `izq`/`der`, `columnas` 1-3, `ancho`, `x`, `y`, `cadencia`, `contador` `{de, a, en, dur}` o `false`, `semilla` | `lado` |
| `vistas` | una miniatura con pastillas de vistas y «me gusta» que suben, y corazones que salen | `img`, `x`, `y`, `ancho`, `de`, `a`, `likes`, `en`, `sube`, `corazones`, `semilla` | `lado` |
| `movil-feed` | un móvil dibujado con un feed que pasa rápido y se para; puede apagarse e irse («dejar las redes») | `imgs`, `para`, `x`, `y`, `ancho`, `scroll` `{en, dur}`, `apagar` (segundo o `null`) | `lado` |
| `campana` | tarjeta bajo la barbilla con una campana de Gauss que se dibuja y figuras en histograma; se encienden los extremos | `ticks` `{poca, extremos, normal}`, `nota`, `centro`, `semilla` | `pantalla` |
| `personas` | fila de figuras de línea (sin rasgos) que se encienden juntas y saludan; un corazón encima («no eres la única») | `n` 5-9, `ticks` `{juntos, corazon}`, `semilla` | `pantalla` |
| `doodle` | pegatina de línea que se dibuja y se rellena (sustituye a los emojis) | `dibujo` `taza`/`chispa`/`zzz`/`corazon`/`nube`/`interrogacion`/`bombilla`/`etiqueta`, `x`, `y`, `tam`, `texto` (solo `etiqueta`), `color` | `izquierda`/`derecha` |
| `subrayado-circulo` | palabra manuscrita sobre la cabeza con un círculo o doble subrayado de rotulador | `texto`, `forma` `circulo`/`subrayado`, `x`, `y`, `tam` | `arriba` |
| `acotacion` | nota irónica manuscrita en una esquina con una flecha que apunta a la persona | `texto`, `lado`, `color`, `tam`, `ancho`, `apunta` `cara`/`gesto`, `punta` `{x, y}` | `izquierda`/`derecha` |

## Texto (con medida: como mucho dos frases grandes por reel)

| `tipo` | Qué es | `opts` principales | Zona |
|---|---|---|---|
| `frase-remate` | frase grande en cursiva en la pared sobre la cabeza, con una palabra subrayada en el acento | `texto` (`\n` fuerza salto), `resalta`, `tinta` `clara`/`oscura`, `tam`, `ocultar_subs` | `arriba` (o `pantalla` con `ocultar_subs`) |
| `palabra-caja` | palabra clave sobre una caja que crece; línea pequeña de contexto encima | `palabra`, `antes`, `tinta`, `caja_en`, `lugar` `arriba`/`izquierda` | `arriba` |

## Tarjetas bajo la barbilla (ocultan los subtítulos mientras están)

| `tipo` | Qué es | `opts` principales | Zona |
|---|---|---|---|
| `tarjeta-lista` | tarjeta con título y 2-3 puntos que se marcan uno a uno | `titulo`, `items`, `ticks`, `lado` `centro`/`derecha` | `pantalla` |
| `chat-comentarios` | 2-4 burbujas de chat que entran por turnos (nombres inventados) | `titulo`, `mensajes` (texto o `{texto, quien}`), `ticks` | `pantalla` |
| `pregunta-publico` | caja de pregunta o encuesta con dos opciones, una marcada y barras de porcentaje | `pregunta` (≤ 48 letras), `opciones` (2, ≤ 18 letras), `marca`, `porcentajes`, `etiqueta` | `pantalla` |
| `mito-realidad` | dos tarjetas de papel: el mito tachado y encima la realidad | `mito`, `realidad`, `etiquetas`, `grande` | `pantalla` |

## Cierre y utilidades

| `tipo` | Qué es | `opts` principales | Zona |
|---|---|---|---|
| `cierre-firma` | plano final (2,5-3 s): fondo de marca con manchas suaves, logo, handle y frase de despedida | `frase`, `handle`, `logo` (por defecto, los de `estilo.json`) | `pantalla` |
| `hueco` | no dibuja nada: oculta los subtítulos mientras un efecto `fx` ocupa el tercio inferior | `zona` (por defecto `abajo`, que los oculta) | la de `opts` |

## Notas

- Las miniaturas de `reels-muro`, `vistas` y `movil-feed` salen de `reels/marca/miniaturas/`. Si no hay, las
  tarjetas salen lisas: genera unas inventadas con `scripts/motor/miniaturas.py`. Reales, solo si la persona
  las aporta.
- Duración razonable: 3-6 s por recurso; las tarjetas con varios pasos (`campana`, `personas`, `tarjeta-lista`)
  necesitan 5-8 s para leerse.
- `ticks` y similares van en segundos desde el inicio del recurso, no del vídeo.
- Un recurso con nombre mal escrito hace fallar la hoja: los nombres válidos son los ficheros de
  `scripts/motor/recursos/`.
