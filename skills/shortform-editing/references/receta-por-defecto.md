# Receta por defecto

La estructura de reel que se usa cuando el proyecto aún no tiene `docs/wiki/reels/receta.md`, y la base para
escribirla en el paso 2. Es genérica: los colores, fuentes, logo y tono salen de la marca, nunca de aquí.

**Idea central:** más visual que texto. El tono es cercano, con un punto de humor; lo que cuenta la historia
son los recursos animados (reels, vistas, personas, móviles), no los rótulos. Como mucho **dos frases grandes**
en todo el reel.

## Estructura

| Tramo | Cuánto | Qué lleva |
|---|---|---|
| Gancho | 0-3 s | un efecto visual fuerte desde el primer fotograma: `noise` (reels que se apilan detrás de la cabeza) o `phone-fan` (abanico de móviles con un titular corto de 2 líneas). Un `golpe` de cámara en la palabra clave. La palabra clave en `enfasis` |
| Planteamiento | 3-10 s | un recurso visual que explique la situación sin texto: `reels-muro` con su contador, `vistas` si va de alcance, `movil-feed` si va de redes |
| Desarrollo | el centro | **un recurso cada 5-8 s**, alternando lados y tipos: `campana` (lo normal frente a los extremos), `personas` («no eres la única»), `doodle` o `subrayado-circulo` para respirar, una tarjeta (`tarjeta-lista`, `mito-realidad`, `pregunta-publico`, `chat-comentarios`) si hay una lista o un contraste. Empujes de cámara suaves entre recursos |
| Giro o remate | 1 vez | la primera de las dos frases grandes: `frase-remate` o `palabra-caja` sobre la cabeza, o un efecto de palabra detrás (`backdrop-word`, `huge-strike`, `crayon-write`) |
| Salida | últimos 3-5 s | `movil-feed` con `apagar` (el móvil que se apaga y se va) si encaja con el mensaje; la segunda frase grande solo si hace falta |
| Cierre | 2,5-3 s | `cierre-firma` con logo, handle y frase de `estilo.json`; `congelar_final` si la última palabra queda pegada al corte |

## Reglas de la receta

- **Cortes:** silencios fuera (lo hace `cortar`) y, en el plan, muletillas, tomas repetidas y frases a medias.
  Nunca dentro de una palabra.
- **Cámara:** `golpe` (1,2) en 2-4 palabras clave; `empuje` (1,08-1,15) en frases que se alargan. Nunca más de
  1,35.
- **Huecos:** ningún tramo de más de 6 s sin recurso, efecto o movimiento de cámara.
- **Efectos `fx`:** 1-3 por reel, de 1,5-4 s; el del gancho casi siempre.
- **Tarjetas bajo la barbilla:** ocultan los subtítulos; úsalas cuando lo dicho y lo escrito coinciden, y no
  más de 2-3 por reel.
- **Texto:** las frases en pantalla resumen, no repiten palabra por palabra lo que se dice (para eso están los
  subtítulos). Sin emojis: para eso está `doodle`.
- **Duración:** la que pida el contenido; si pasa de 60 s, propón qué cortar.
- **Subtítulos:** siempre en el tercio inferior, estilo por defecto (ver [subtitulos.md](subtitulos.md)).

## Lo que no funciona (aprendido)

- Subtítulos altos o bajo la barbilla: se leen peor y tapan la cara. Abajo.
- Muchos rótulos grandes: el reel parece una presentación. Dos como mucho.
- Un estilo editorial sobrio con mucho texto en pastillas gustó menos que el visual.
- Recursos encima de la cara, aunque sean un segundo.
- Vídeos de origen pequeños (por ejemplo 576×1024): con zoom quedan blandos. Pide el original en mejor calidad
  y limita los `golpe` a 1,15.
- La posición de la cara se mide como media del clip: si la persona se mueve mucho, revisa los stills de los
  recursos que apuntan a la cara.

## Al escribir `receta.md` del proyecto

Copia esta estructura y ajústala a la entrevista y a las referencias: qué recursos encajan con su tema, qué
efectos le gustan, qué tono (más humor o más sereno), duración típica y cómo cierra. Apunta también lo que
no quiere. Es un documento vivo: cada «para todos» de una corrección se añade aquí.
