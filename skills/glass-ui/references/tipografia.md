# Tipografía

La letra se decide por proyecto. Este catálogo sirve para **proponer** opciones al usuario cuando el proyecto no tiene ya la suya. La demo usa Geist + Doto, pero eso no es un valor por defecto que haya que repetir.

## Orden de decisión

1. **El proyecto ya tiene letra** (tokens, `@font-face`, `@fontsource*`, guía de marca): úsala en texto, titulares y cifras. Solo pregunta si quiere añadir una letra de titulares o cifras de puntos.
2. **No la tiene:** propón 3–4 parejas del catálogo que encajen con el sector del proyecto y con el estilo elegido. Varía las propuestas de un proyecto a otro y explica cada una en media línea (qué transmite). Usa `AskUserQuestion` con un `preview` de muestra («Buenas tardes, Aitana · 236 h») si ayuda a decidir.
3. **Cifras:** ofrece tres opciones. Puntos (Doto, solo cifras cortas y con `aria-label`), la letra de texto en `tabular-nums` o una monoespaciada.

## Catálogo (todas libres, en Fontsource)

Comprueba el nombre exacto del paquete con `npm view <paquete> version` antes de instalarlo.

| Pareja (texto / titulares) | Transmite | Encaja con |
|---|---|---|
| Geist / Geist | Técnica, neutra, actual | Suave, Formal |
| Inter / Inter Display | Producto SaaS sobrio, máxima legibilidad | Formal |
| IBM Plex Sans / IBM Plex Sans | Corporativa, ingenieril, datos | Formal |
| Manrope / Manrope | Amable, redondeada sin ser infantil | Suave, Bruma |
| Plus Jakarta Sans / Plus Jakarta Sans | Cálida, de app de consumo | Suave, Bruma |
| DM Sans / Fraunces | Editorial con serif expresiva en titulares | Bruma |
| Instrument Sans / Instrument Serif | Editorial elegante, revista | Bruma, Nocturna |
| Space Grotesk / Space Grotesk | Tecnológica, con carácter | Nocturna |
| Satoshi o General Sans (Fontshare) / ídem | Moderna, de estudio de diseño | Nocturna, Suave |
| Outfit / Outfit | Geométrica, limpia, de bienestar | Bruma, Nocturna |

| Cifras | Paquete | Nota |
|---|---|---|
| Puntos | `@fontsource/doto` | Peso 800 estático; cuadrada; solo números cortos |
| Mono | `@fontsource-variable/jetbrains-mono`, `@fontsource-variable/geist-mono` | Para paneles técnicos |
| Tabular de la propia letra | — | `font-variant-numeric: tabular-nums`; la opción más sobria |

## Cómo se aplica

Solo en tokens, para que cambiar de letra sea editar tres líneas:

```css
@theme {
  --font-sans: "Manrope Variable", ui-sans-serif, system-ui, sans-serif;
  --font-display: "Fraunces Variable", ui-serif, Georgia, serif;
  --font-dot: "Doto", ui-monospace, monospace; /* o la de texto, o una mono */
}
```

Ajusta por letra (no copies los valores de Geist): `--num-scale` (Doto se ve más pequeña que una sans al mismo tamaño), el tracking de titulares (las serif van a 0 o un poco negativo; las grotescas a −0,02/−0,03 em) y los pesos que de verdad tiene la fuente. Revisa en las capturas que nada se corte con la letra nueva: cambian los anchos.
