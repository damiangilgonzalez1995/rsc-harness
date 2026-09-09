---
name: mejor-accesibilidad
description: "Use to bring the project up to accessibility standards and best practices — native elements vs. ARIA, focus rings, full keyboard support, focus trapping, tap target sizes, form labels, announced errors, accessible names, reduced motion, live regions, alt text, heading structure, and zoom."
tags: ["accessibility", "a11y", "aria", "keyboard-navigation"]
profiles: [ui, full]
---

# Accesibilidad

Casi toda la accesibilidad es gratis si usas la plataforma. Los elementos nativos vienen con soporte de teclado, las etiquetas reales se anuncian solas y un anillo de foco visible es una regla CSS.

Escribe cada arreglo en el sistema de estilos del proyecto, y usa los valores exactos de abajo en vez de sustitutos que se les parezcan.

Revisar son dos recorridos. Solo teclado, donde cada flujo se completa sin raton. Y luego lector de pantalla, donde cada control anuncia un nombre, un rol y su estado. Ante la duda, coge el defecto de la plataforma antes que una reconstruccion propia, y quita ARIA antes que anadirlo.

La medicion de contraste y los arreglos de color son de `mejor-colores`. El dimensionado de texto y el zoom de inputs en iOS son de `mejor-tipografia`. El layout espacial RTL es de `mejor-layout`.

## Elementos nativos primero

La primera regla de ARIA: no uses ARIA cuando existe un elemento nativo. `<button>` para acciones, `<a href>` para navegacion, nunca `<div onClick>`. Un enlace de verdad debe soportar Cmd/Ctrl/clic central. Nada de ARIA es mejor que ARIA mal puesto. Ver [semantics-and-aria.md](semantics-and-aria.md) para landmarks, boton-frente-a-enlace y estados deshabilitados.

## Anillos de foco visibles

Estiliza `:focus-visible`, no `:focus` a secas. Los usuarios de teclado reciben anillo y los de raton normalmente no. Prefiere el indicador del navegador sin modificar.

Un anillo propio necesita un token de foco del proyecto u otro color explicito. Verifica el indicador entero contra cada color adyacente que cruza, incluido `currentColor`. Usa al menos un perimetro solido de `2px` o un area visible equivalente. Nunca uses `outline: none` sin un reemplazo verificado, y preserva los colores del sistema en modo de colores forzados. Las recetas estan en [focus-and-keyboard.md](focus-and-keyboard.md).

## Soporte completo de teclado

Toda interaccion con puntero necesita un camino de teclado. Sigue los patrones del ARIA APG: Escape cierra las capas, las flechas mueven dentro de un widget compuesto, Tab mueve entre widgets, Enter y Espacio activan.

Usa solo `tabindex="0"` para unirse al orden natural de tabulacion y `tabindex="-1"` para foco programatico. Los valores positivos rompen ese orden. Los widgets compuestos usan roving tabindex, donde el elemento activo es `0` y todos los demas `-1`.

## Atrapa y restaura el foco

Los modales ponen `inert` en el contenido de fondo, mueven el foco dentro al abrirse y lo devuelven al disparador al cerrarse. Anade `overscroll-behavior: contain` para que el fondo no haga scroll.

## Area minima de pulsacion

La base de nivel AA de WCAG 2.5.8 es un objetivo de 24x24 pixeles CSS, o una de sus excepciones (espaciado, control equivalente, en linea, agente de usuario y esencial). Apunta a 44x44px en tactil y 40x40px en escritorio donde la densidad lo permita. Extiende con un pseudo-elemento cuando el elemento visible deba seguir siendo mas pequeno.

Nunca dejes que las areas extendidas se solapen. Da `pointer-events: none` a las capas decorativas, para que un resplandor no se trague los clics del control de debajo. Tamanos y reglas de colision en [hit-areas.md](hit-areas.md).

## Etiqueta y tipa cada control

Cada input lleva un `<label for>` o un `<label>` que lo envuelve. Un placeholder nunca es una etiqueta. Etiqueta y control comparten un unico objetivo de pulsacion, sin zona muerta entre una casilla y su texto.

Anade `autocomplete` con un `name` con significado, mas el `type` y el `inputmode` que invocan el teclado correcto. Nunca bloquees pegar: la gente pega contrasenas y codigos de un solo uso. Ver [forms.md](forms.md).

## Errores que se anuncian

Manten el boton de envio habilitado hasta que arranque la peticion, y entonces deshabilitalo con un spinner y la etiqueta original. Valida al enviar. Marca los campos que fallan con `aria-invalid="true"`, apunta `aria-describedby` al texto de error en linea y pon el foco en el primer campo invalido.

Usa el `disabled` nativo cuando un control no este disponible de verdad. Coge `aria-disabled="true"` solo cuando deba seguir siendo enfocable, y entonces bloquea puntero, teclado y comportamiento de formulario en codigo, y estiliza el estado explicitamente.

## Nombres accesibles en todas partes

Los botones de solo icono necesitan un `aria-label` descriptivo. El texto visible de la etiqueta debe aparecer en el nombre accesible. Los elementos decorativos llevan `aria-hidden="true"`, nunca sobre un elemento enfocable.

## No te apoyes solo en el color

El estado necesita una pista redundante: un icono, texto o un subrayado junto al color. Averigua que requisito de contraste WCAG aplica y usa `mejor-colores` para medir el par renderizado. Cuando falle, reporta el par y el requisito que no alcanza, y deja los colores en paz salvo que te lo pidan.

## Respeta prefers-reduced-motion

Envuelve el movimiento en `@media (prefers-reduced-motion: no-preference)` para que sea opt-in. Bajo movimiento reducido, sustituye deslizamientos y escalas por fundidos de opacidad, y elimina del todo el parallax y la reproduccion automatica.

Dos reglas se mantienen sea cual sea la preferencia: el contenido que se reproduce solo necesita un control de pausa visible, y los toasts que llevan una accion o un error se quedan hasta que se descartan. Ver [motion-and-zoom.md](motion-and-zoom.md).

## Anuncia el contenido dinamico

Tres mecanismos, tres trabajos. `aria-describedby` lleva la validacion especifica de un campo. Una region viva cortes (`role="status"`) lleva actualizaciones no urgentes no ligadas a un control, como toasts y recuentos de resultados. `role="alert"` lleva errores urgentes no ligados, y nada mas.

Los anuncios corteses repetidos necesitan una region vacia estable renderizada antes de que su texto se actualice. Las alertas insertadas dinamicamente tienen soporte irregular, asi que pruébalas en los lectores de pantalla que te importen. Ver [screen-readers.md](screen-readers.md).

## Texto alternativo segun el proposito

Las imagenes decorativas llevan `alt=""`. Las informativas describen el significado. Las funcionales describen la accion: un boton con icono de busqueda es `alt="Buscar"`, no `alt="lupa"`.

## La estructura es navegacion

Usa encabezados que describan sus secciones y formen un esquema coherente. Da a la pagina un unico `<h1>` y anida los niveles por debajo sin saltarte ninguno. Expon un unico landmark `<main>` primario visible. Cuando la navegacion repetida o el chrome lo preceden, haz que un enlace "Saltar al contenido" sea el primer elemento enfocable. Los encabezados con ancla llevan `scroll-margin-top`.

## Sobrevive al zoom y al redimensionado de texto

La pagina debe funcionar al 200% de zoom y refluir a 320px de ancho sin scroll horizontal. Usa `min-height` en vez de `height` fijo en contenedores de texto. Prefiere breakpoints en `rem` donde encajen en el codebase, y nunca dejes que el meta viewport limite cuanto puede ampliar el lector.

## Antes de terminar

| Error | Arreglo |
| --- | --- |
| Color de foco propio que se asume que funciona en todas partes | Verificalo contra cada color adyacente y en modo de colores forzados |
| Actualizacion cortes repetida que se anuncia de forma inconsistente | Manten una region de estado vacia estable y actualiza su texto |
| Region viva `assertive` para un toast rutinario | Usa `polite`; reserva `assertive` para errores |
| `aria-hidden="true"` sobre un elemento enfocable | Quitalo o haz el elemento no enfocable |
| Envio deshabilitado hasta que el formulario es valido | Dejalo habilitado; valida al enviar y enfoca el primer error |
| Tratamiento de hover que se queda pegado tras un toque en tactil | Pon el estilo de hover tras `@media (hover: hover)` |
| Tooltip sobre un control `disabled` nativo | Texto al lado, o `aria-disabled` para que siga siendo enfocable |

## Como reportar

**Severidad.** `ALTA` impide una tarea, oculta contenido a la tecnologia asistiva o crea un fallo sistemico. `MEDIA` hace una interaccion apreciablemente mas dificil. `BAJA` es pulido aislado.

**Verificacion.** Sin navegador: nombres accesibles en cada elemento interactivo, manejadores de teclado en controles no nativos, estilos de foco, guardas de `prefers-reduced-motion` y etiquetas de formulario ligadas a sus inputs. Con navegador: tabula el flujo en orden, lee nombres y roles computados del arbol de accesibilidad, confirma un indicador de foco visible en cada parada y pasa una auditoria automatica. Reporta como `No verificado` toda comprobacion que no pudieras ejecutar.

**Formato.** Agrupa los hallazgos bajo el principio que incumplen, ordenados por severidad, una fila por causa raiz listando todas sus ubicaciones:

| Severidad | Ubicacion | Antes | Despues | Por que |
| --- | --- | --- | --- | --- |

Termina con `Bloquear` si queda alguna `ALTA`, y `Aprobar` en caso contrario. Nunca `Aprobar` cobertura que no inspeccionaste. Si no hay nada, di "Sin hallazgos accionables de accesibilidad" y reporta la verificacion.
