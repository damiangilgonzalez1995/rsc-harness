# Subtítulos

Los dibuja `scripts/motor/subs.js` a partir de `reels/trabajo/<clip>/cortado.palabras.json`. No se colocan a
mano: el plan solo influye con las **zonas** de los recursos y con `enfasis`.

## Dónde van (lo que más se ha corregido)

**En el tercio inferior.** No bajo la barbilla, no a la altura de la boca, nunca sobre la cara. Un reel con
los subtítulos altos es un reel mal hecho aunque todo lo demás esté bien.

Sobre el cuadro de 1080×1920:

| Medida | Valor | En píxeles |
|---|---|---|
| Borde superior por defecto | 0,74 · alto | ≈ 1421 |
| Borde superior, nunca por encima de | 0,70 · alto | 1344 |
| Borde inferior, nunca por debajo de | 0,87 · alto | 1670 |
| Reserva de Instagram (descripción, botones) | el 13 % inferior | 1670-1920 |

Si la caja sale alta (dos líneas grandes), crece hacia abajo; no sube. **Ninguna zona los sube**: si algo
ocupa el tercio inferior, los subtítulos se ocultan mientras dura, nunca se suben a la barbilla. El test
`tests/shortform-editing-subs.test.js` del catálogo falla si alguna zona los deja por encima del 70 %.

## Cuando un recurso ocupa sitio

Cada recurso declara una zona (ver [recursos.md](recursos.md)); un recurso del plan puede forzarla con
`"zona"`. Mientras el recurso está en pantalla (y solo entonces: las palabras dichas antes de que entre se
ven enteras, y las que vienen después de que salga, también):

| Zona | Qué hacen los subtítulos |
|---|---|
| `pantalla`, `abajo` | se ocultan (tarjetas grandes bajo la barbilla, cierre, frases que repiten lo dicho, efectos en el tercio inferior). **No suben nunca** |
| `arriba`, `izquierda`, `derecha`, `lado`, `esquina` | no se mueven |

Los efectos `fx` se pintan en el vídeo y los subtítulos no los ven. Si un efecto ocupa el tercio inferior (por
ejemplo `phone-fan` bajo la barbilla), pon a la vez un recurso `hueco` en el mismo tramo: oculta los
subtítulos mientras dura el efecto (no los sube). Mejor aún, que el efecto dure poco: es tiempo sin
subtítulos.

## Cómo se ven (estilo por defecto)

- Fuente `fuentes.subtitulos` de `estilo.json` (si falta, `fuentes.titulos`), peso 800, 86 px.
- Relleno `colores.texto`, trazo grueso de 16 px y sombra en `colores.trazo`: se leen sobre cualquier fondo.
- La palabra que suena va en `colores.acento` con un pequeño salto (1 → 1,08).
- Golpes de 2-3 palabras (unas 16 letras); se corta en signos de puntuación y en pausas de más de 0,28 s; una
  palabra suelta se une a la vecina; se quita la puntuación final.
- `enfasis` del plan: palabras que siempre salen solas en su golpe (la palabra clave del gancho, un número).

## Si la persona pide otra cosa

- «Más grandes / en otro color»: cambia `fuentes.subtitulos` o los colores en `reels/marca/estilo.json` (vale
  para todos sus reels; díselo).
- «Más arriba»: explícale que arriba tapan la cara y quedan bajo la cabecera de Instagram; propón otra cosa
  (contraste, tamaño). Solo si insiste, súbelos dentro del tercio inferior, nunca por encima del 60 %.
- «Me tapan algo»: quita o mueve el recurso, o márcalo `pantalla` para ese tramo.
- Errores de texto: se corrigen en `cortado.palabras.json` (campo `p`), no en el `.srt`.
