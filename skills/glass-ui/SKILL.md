---
name: glass-ui
description: "Use when building or restyling a web app, dashboard or screen with the glass aesthetic: frosted glass (glassmorphism, Apple Liquid Glass, Fluent Mica/Acrylic), blurred mesh-gradient backgrounds with grain, pills, dot-matrix numerals and spring motion, on desktop and mobile. Asks the user to pick one of four styles (soft, formal, mist, nocturne) and a typeface that fits the project. NOT a marketing landing page (that is `diseno-landing`), NOT a generic visual direction pass (that is `tastemaker`)."
tags: [glassmorphism, liquid-glass, ui, motion, design-system]
recommends: [animar, diseno-apple, mejor-accesibilidad, mejor-colores, mejor-tipografia, tastemaker]
profiles: [ui, full]
origin: damiangil
---

# Glass UI

Un look de cuatro estilos sobre la misma base técnica. El 80 % es CSS (paleta acotada, radios, cristal con borde luminoso). El 20 % restante son librerías: fondo fluido, lente, cifras de puntos y muelles.

El código de [references/plantillas.md](references/plantillas.md) sale de una demo de panel de agencia probada con Playwright en los cuatro estilos y en 1440, 820 y 390 px.

## Pasos

1. **Pregunta el estilo al usuario, siempre**, antes de escribir código (con `AskUserQuestion` si está disponible), aunque el encargo parezca dejarlo claro. Ofrece las cuatro variantes con una línea cada una:
   - **Suave**: cristal claro, todo redondo, fondo de degradado vivo, cifras de puntos, toques dorados.
   - **Formal**: profesional y denso, esquinas de 4–8 px, materiales Mica/Acrylic, tablas, dorado solo en 2 px.
   - **Bruma**: clara y editorial, niebla gris, tarjeta héroe esmerilada oscura, métricas en píldoras de color vivo, titular con píldoras dentro de la frase.
   - **Nocturna**: oscura, fondo casi negro con un brillo, portadas desenfocadas, filas con botón circular tipo play, detalle tipo reproductor.

   Pregunta también si mantiene la paleta de marca o usa los degradados vivos de las referencias, y la **tipografía** (paso 2). Luego lee [references/estilos.md](references/estilos.md). Hecho cuando el usuario ha elegido y sabes radios, material, tipografía de cifras, uso del acento y muelles del estilo.
2. **Tipografía del proyecto, no la de la demo.** Geist + Doto son solo el ejemplo; la letra cambia de un proyecto a otro. Primero busca la que ya usa el proyecto (`@font-face`, `@fontsource*` en `package.json`, `--font-*` en tokens, `font-family` en CSS, guía de marca): si existe, úsala para todo. Si no hay, pregunta al usuario ofreciendo 3–4 parejas acordes al proyecto y al estilo elegido, con [references/tipografia.md](references/tipografia.md) como catálogo. Pregunta aparte si quiere cifras de puntos (Doto) o cifras con la propia letra en tabular. Hecho cuando la fuente de texto, la de titulares y la de cifras están decididas por el proyecto o por el usuario, y viven solo en `--font-sans`, `--font-display` y `--font-dot`.
3. **Monta el stack** con versiones exactas (`--save-exact`; Paper Shaders rompe la API entre 0.0.x): `vite react react-dom tailwindcss @tailwindcss/vite motion @paper-design/shaders-react lucide-react` más los paquetes `@fontsource*` de las fuentes elegidas y `playwright` en dev. Sin React: el CSS es idéntico, `@paper-design/shaders` y `motion` tienen versión JS. Hecho cuando `npm run dev` sirve una página vacía sin errores.
4. **Tokens y materiales.** Copia las plantillas de [references/plantillas.md](references/plantillas.md): tokens con radios en variables (`--r-card`, `--r-ctl`…), `.glass`, `.glass-flat`, `.grain-layer`, `.lens`, todo dentro de `@layer components` para que Tailwind no lo pise. El estilo se aplica con `data-estilo` en `<html>` antes del primer render. Hecho cuando ningún radio ni color de superficie está escrito a mano en el JSX.
5. **Fondo.** Un `MeshGradient` con fallback de manchas CSS (`?nogl=1` lo fuerza), grano encima y velo si hay texto blanco. Hecho cuando el fondo se ve detrás del cristal (si el cristal sale blanco plano, algo tapa la capa fija: revisa el `background` de `body`).
6. **Movimiento.** `<MotionConfig reducedMotion="user">` en la raíz, presets de muelle por estilo, `layoutId` para indicadores y hojas, cifras que cuentan con `animate()` sobre un `MotionValue` (motion 14 no trae `AnimateNumber`). Hecho cuando cada interacción principal tiene respuesta física y es interrumpible.
7. **Responsive.** ≥1024 barra lateral; 768–1023 solo iconos; <768 barra inferior flotante + botón de acción, hojas que se cierran arrastrando. Hecho cuando 1440, 820 y 390 px se ven sin scroll horizontal, sin textos cortados y sin solapes.
8. **Verifica** con [references/verificacion.md](references/verificacion.md). Hecho cuando todas las capturas están **miradas** (no solo generadas), las pruebas de interacción están en verde y la consola tiene 0 errores y 0 avisos.

## Reglas duras

- **Un degradado protagonista por pantalla.** El resto, superficies neutras.
- **Presupuesto de cristal:** máximo ~4 superficies con `backdrop-filter` visibles a la vez; el resto `.glass-flat` (mismo aspecto, sin blur).
- `backdrop-filter` nunca dentro de un padre con `transform`, `opacity` animada u `overflow: hidden`: el cristal sale plano. Anima la opacidad de cada pieza, no del contenedor.
- Anima `transform` y `opacity`; el `blur` queda fijo.
- Texto sobre degradado con velo oscuro debajo hasta contraste ≥ 4,5:1. Texto secundario sobre cristal claro: `#2C4A66` o más oscuro.
- La lente (`feDisplacementMap` en `backdrop-filter`) solo funciona en Chromium: actívala con la clase `.has-lens` puesta por JS tras montar el SVG; el resto de navegadores recibe blur + saturate.
- Las cifras de puntos (si el usuario las eligió) solo para cifras cortas, siempre con `aria-label` con el número legible.
- `prefers-reduced-transparency`: superficies opacas. `prefers-reduced-motion`: shader a velocidad 0 y sin deriva CSS.
- Muelles con rebote: limita a ≥ 0 cualquier altura o anchura que el rebote pueda volver negativa.
- Fotos y retratos: solo del usuario. Por defecto, siluetas y formas CSS/SVG desenfocadas con grano.

## Vocabulario del sector

Glassmorphism; Liquid Glass (Apple, refracción); Mica (opaco teñido, superficies de larga vida) y Acrylic (translúcido, superficies transitorias) de Microsoft Fluent; mesh gradient; grain / noise overlay; dot-matrix numerals; hairline border; tabular numerals; spring physics; shared layout transition; bottom sheet; data-dense enterprise dashboard.
