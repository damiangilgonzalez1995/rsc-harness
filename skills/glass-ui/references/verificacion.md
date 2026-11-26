# Verificación

El cristal engaña: en el editor todo parece bien y en el navegador sale plano, blanco o solapado. Verifica siempre en navegador real con Playwright (Chromium).

## Capturas

Un script `shoot.mjs` que recorre cada pantalla × cada estilo × tres anchos: 1440×900, 820×1180, 390×844 (más una captura con scroll en móvil para pantallas largas y una con `?nogl=1`). Usa `?bar=0` para ocultar conmutadores de prototipo. Espera ~1,5 s tras cargar para que el shader y las entradas terminen.

Abre **cada** PNG y busca:

- cristal que sale blanco plano o sin fondo detrás (padre con transform/overflow, o `body` con fondo opaco);
- textos cortados o que saltan de línea donde no deben (fechas, cifras con unidad);
- solapes (avatares apilados, barra inferior tapando contenido: añade `padding-bottom` del alto de la barra);
- scroll horizontal (`document.documentElement.scrollWidth > innerWidth`);
- más de un degradado protagonista en pantalla.

## Interacción

Un `probar.mjs` con pruebas reales sobre el DOM, por cada estilo:

- arrastrar una tarjeta (ratón en escritorio, toque en móvil) y comprobar que cambia de columna;
- abrir el detalle y cerrarlo con Escape;
- hoja móvil: arrastre corto vuelve a su sitio, arrastre largo cierra, **y un segundo arrastre tras uno corto también cierra**;
- cambiar de periodo cambia cifras y gráfica;
- el conmutador de estilos conserva la ruta.

Recoge `console` y `pageerror`: el criterio es 0 errores y 0 avisos (filtra solo "GPU stall due to ReadPixels", que es del driver WebGL).

## Accesibilidad mínima

Contraste ≥ 4,5:1 del texto sobre cada superficie, foco visible, `aria-label` en cifras de Doto y botones de icono, y una pasada con `reducedMotion: 'reduce'` en el contexto de Playwright.
