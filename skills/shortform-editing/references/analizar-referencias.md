# Analizar reels de referencia

Es el paso más caro en tokens: se hace una vez y se guarda en `docs/wiki/reels/referencias.md`. Se trabaja con
medidas y hojas pequeñas, nunca con fotogramas a tamaño completo uno a uno.

## Las referencias

- Están en `reels/referencias/`, como archivo, puestas por la persona. Hacen falta 3-5; con menos, sigue y
  dilo. Con más, usa las 5 más recientes.
- No se descargan de internet, ni con enlaces ni con la sesión del navegador.

## Medir cada una

```bash
PY -X utf8 S/editor.py analizar reels/referencias/<video> --salida reels/trabajo/referencias/<video>_hoja.png
```

Devuelve duración, tamaño, cambios de plano (total y por minuto), plano medio en segundos y volumen (LUFS), y
deja una hoja de 12 miniaturas. Mira la hoja, no el vídeo. Si tiene voz y quieres ver cómo arranca, transcribe
solo ese reel con `editor.py subtitulos`.

## Qué apuntar de cada una

- **Primeros 3 segundos:** qué se ve, qué texto aparece, cómo engancha.
- **Ritmo:** cambios de plano por minuto, cortes secos, pausas.
- **Cámara:** acercamientos, cuándo y cuánto.
- **Subtítulos:** tamaño, color, borde, palabras por golpe, posición (si los llevan altos, se apunta pero aquí
  van abajo igualmente).
- **Gráficos:** qué tipo (listas, flechas, muros de miniaturas, móviles, figuras), cuántos, cuánto texto.
- **Color:** cálido, frío, contrastado, blanco y negro.
- **Sonido:** música, efectos (esta skill aún no añade sonido: apúntalo igual).
- **Final:** bucle, llamada a la acción, firma.

## De medidas a reglas propias

Busca lo que tienen **en común**, no el calco de una. Nada de sus textos, logos, música, personas ni
plantillas. Traduce cada patrón a lo que esta skill sabe hacer: un ritmo a «un recurso cada N s», un tipo de
gráfico a un recurso de [recursos.md](recursos.md), un golpe visual a un efecto de [efectos.md](efectos.md).

`docs/wiki/reels/referencias.md`:

```markdown
# Referencias (analizadas el AAAA-MM-DD)

| Reel | Duración | Planos/min | Gancho | Gráficos | Final |
|---|---|---|---|---|---|

## Lo que tienen en común
- …

## Cómo lo aplicamos
- … (recurso / efecto / regla de la receta)
```

Los vídeos de referencia no se suben al repositorio ni se copian fuera de `reels/referencias/`. Termina con un
resumen de 5 líneas y pregunta qué cambiaría antes de pasarlo a `receta.md`.
