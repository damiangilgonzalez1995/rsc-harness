# Entrevista de marca

Se hace **una vez por proyecto** y solo si no existe `docs/wiki/reels/marca.md`. Si el proyecto trae un
paquete de traspaso, no se pregunta nada: se dice en una línea y se sigue.

## Cómo preguntar

- Una pregunta por mensaje, en su idioma, con un ejemplo de respuesta. Nada de formularios largos.
- Propón tú cuando dude: «si no lo tienes claro, te propongo estos tres colores» (y enséñalos como códigos
  `#RRGGBB` con su nombre).
- Lo que ya se sepa (logo en `reels/marca/`, una web, otro documento del proyecto) no se vuelve a preguntar:
  se confirma.
- Siete preguntas como mucho. Lo que falte se rellena con valores neutros y se apunta como provisional.

## Las preguntas

1. **De qué va y para quién.** «¿Sobre qué hablas en tus reels y a quién se los diriges?» Sirve para elegir
   recursos (un tema delicado pide tono sereno y cero burla).
2. **Tono.** «Si tu reel fuera una persona, ¿cómo hablaría?» Ofrece opciones: cercano con humor, sereno y
   cálido, directo y enérgico. Pregunta también qué **no** quiere (por ejemplo: nada de emojis, nada de humor
   con ciertos temas).
3. **Colores.** Un color principal, uno de acento y, si los tiene, dos suaves. Si no tiene, propón una paleta
   con buen contraste sobre vídeo.
4. **Fuentes.** ¿Tiene fuentes de marca? Si las tiene, que deje los `.ttf`/`.otf` en `reels/marca/` (y su
   licencia). Si no, se usan las incluidas: Outfit (títulos y subtítulos), Source Serif 4 (frases) y Caveat
   (manuscrita).
5. **Logo y firma.** Logo en `reels/marca/` (PNG con fondo transparente o SVG), su `@handle` y, si quiere, una
   frase corta de despedida para el cierre.
6. **Referencias.** «Deja en `reels/referencias/` de 3 a 5 reels que te encanten, como archivo.» Mejor si se
   parecen entre sí. No se descargan de internet ni con la sesión del navegador. Si no tiene, se sigue con la
   receta por defecto.
7. **Reglas propias.** Duración típica, cosas que siempre o nunca deben salir, cómo suele cerrar.

## Qué se escribe

`docs/wiki/reels/marca.md` — corto y en sus palabras:

```markdown
# Marca

- Tema y público: …
- Tono: … · Nunca: …
- Colores: fondo #…, texto #…, acento #…, trazo #…, suave #…, extra #… (qué es cada uno)
- Fuentes: títulos …, texto …, manuscrita …, subtítulos …
- Logo: reels/marca/… · Handle: @… · Frase de cierre: «…»
- Pendiente o provisional: …
```

`reels/marca/estilo.json` — lo que leen el motor y los recursos:

```json
{"colores": {"fondo": "#FFFFFF", "texto": "#FFFFFF", "acento": "#FFC83D", "trazo": "#1F1F24",
             "suave": "#BFC8D6", "extra": "#A9C4A4"},
 "fuentes": {"titulos": "Outfit", "texto": "Source Serif 4", "manuscrita": "Caveat", "subtitulos": "Outfit"},
 "logo": "logo.png", "handle": "@ejemplo", "cierre": {"frase": "nos vemos en el próximo"}}
```

Cómo repartir los colores:

| Clave | Para qué | Pista |
|---|---|---|
| `fondo` | tarjetas y paneles claros | claro, casi blanco |
| `texto` | letras directamente sobre el vídeo (subtítulos) | claro; contrasta con `trazo` |
| `trazo` | tinta: bordes de subtítulos, líneas, texto en tarjetas | oscuro |
| `acento` | palabra activa, círculos, lo destacado | el color más vivo de la marca |
| `suave`, `extra` | rellenos de figuras, burbujas, barras | tonos suaves de la marca |

`logo` es relativo a `reels/marca/` (o a la raíz). Las fuentes se nombran por su familia; si es una de marca,
el motor la busca en `reels/marca/`.

Después: `receta.md` desde [receta-por-defecto.md](receta-por-defecto.md), `referencias.md` si hubo
referencias ([analizar-referencias.md](analizar-referencias.md)), las miniaturas inventadas y un resumen de 5
líneas que termina en «¿cambio algo?».
