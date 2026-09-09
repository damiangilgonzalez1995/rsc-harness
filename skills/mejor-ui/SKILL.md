---
name: mejor-ui
description: "Use to polish and improve a project's UI — concentric border radii, optical alignment, surface depth, shadows vs. borders, interruptible animations, staggered entrances, icon transitions, press scaling, theme-switch transition suppression, and motion containment."
tags: ["ui-polish", "visual-design", "motion"]
profiles: [ui, full]
---

# Acabado de UI

El acabado sale de un monton de detalles pequenos que se acumulan. Esta skill es la referencia de cuales merecen la pena y que valores toman.

Al revisar, ralentiza la interfaz. Lo que se siente raro al 10% de velocidad es lo que esta sutilmente mal a velocidad normal.

Conserva la libreria de componentes, los tokens y la densidad del proyecto, y ajustate a su lenguaje de movimiento salvo donde una regla de abajo prescriba una interaccion exacta.

Cada duracion, curva, escala y desenfoque de abajo es un valor concreto, no un rango que aproximar. `cubic-bezier(0.2, 0, 0, 1)` no es `cubic-bezier(0.4, 0, 0.2, 1)`, y `0.96` no es `0.95`. Usa lo que esta escrito.

El wrapping de texto, el renderizado de fuentes, los numeros tabulares y el espaciado del texto son de `mejor-tipografia`. Las areas de pulsacion, el foco, el soporte de teclado, ARIA y el movimiento reducido son de `mejor-accesibilidad`. La agrupacion, el espaciado de secciones, los breakpoints y el RTL espacial son de `mejor-layout`.

## Radio de borde concentrico

Radio exterior = radio interior + padding. Radios descuadrados en elementos anidados es lo que mas a menudo hace que una interfaz se sienta rara. Las recetas de radio, sombra y contorno estan en [surfaces.md](surfaces.md).

## Alineacion optica antes que geometrica

Cuando el centrado geometrico se ve raro, alinea opticamente. Los botones con icono, los triangulos de reproduccion y los iconos asimetricos necesitan todos un empujon manual.

## Sombras para elevacion, bordes para estructura

Donde un borde existe solo para crear profundidad, prefiere valores de `box-shadow` transparentes en capas. Conserva los bordes que comunican estructura o estado: divisores, separadores y estados seleccionado o de foco.

## Animaciones interrumpibles

Usa transiciones CSS para los cambios de estado interactivos, porque se pueden interrumpir a mitad de animacion. Reserva los keyframes para secuencias por fases que se reproducen una vez.

## Divide y escalona las animaciones de entrada

Para una entrada por fases poco frecuente donde la secuencia comunica jerarquia, parte el contenido en trozos semanticos y escalonalos ~100ms. Animar un unico contenedor te da menos por el mismo coste. Deja sin escalonar las interacciones de alta frecuencia. Ver [enter-exit.md](enter-exit.md).

## Animaciones de salida sutiles

Usa un `translateY` fijo pequeno en vez de la altura completa. Las salidas deben ser mas suaves que las entradas. Usa `ease-out` en ambas direcciones.

## Animaciones contextuales de iconos

Anima los iconos con `opacity`, `scale` y `blur` en vez de conmutar la visibilidad. Usa exactamente estos valores: escala de `0.25` a `1`, opacidad de `0` a `1`, desenfoque de `4px` a `0px`.

Con una libreria de movimiento (`motion` o `framer-motion` en `package.json`), usa la ruta de import de ese paquete, o la de los imports cercanos donde existan ambos. Usa `transition: { type: "spring", duration: 0.3, bounce: 0 }`. El rebote es siempre `0`.

Sin libreria, manten los dos iconos en el DOM con uno posicionado en absoluto, y funde entre ellos con `cubic-bezier(0.2, 0, 0, 1)`. Eso te da entrada y salida sin dependencias. Las dos recetas estan en [icon-transitions.md](icon-transitions.md).

## Contornos de imagen

Da a las imagenes un contorno de `1px` a baja opacidad para una profundidad consistente. Negro puro en modo claro (`oklch(0 0 0 / 0.1)`), blanco puro en oscuro (`oklch(1 0 0 / 0.1)`). Nunca un casi-negro tipo slate o zinc, y nunca un neutro tenido. Un contorno tenido recoge la superficie de debajo y se lee como suciedad en el borde de la imagen.

## Escala al pulsar

Un `scale(0.96)` al hacer clic da al boton feedback tactil. Siempre `0.96`; por debajo de `0.95` se siente exagerado. Anade una prop `static` para apagarlo donde el movimiento distraiga. Ver [recetas para CSS, Tailwind y Motion](animations.md#scale-on-press).

## Sin animacion en la carga de pagina

Usa `initial={false}` en `AnimatePresence` para dejar las animaciones de entrada fuera del primer render. Comprueba que no rompa las entradas de pagina intencionadas.

## Suprime las transiciones al cambiar de tema

Un cambio de tema modifica color, fondo, borde y sombra en casi todos los elementos a la vez. Todas las transiciones sobre esas propiedades se disparan juntas y el cambio se emborrona en vez de saltar limpio. Inyecta `*,*::before,*::after{transition:none !important}`, fuerza un reflow y quitalo en el siguiente fotograma. Ver la [receta](animations.md#suppress-transitions-on-theme-switch).

## Transiciona solo lo que cambia

Nombra siempre las propiedades exactas: `transition-property: scale, opacity`. El `transition-transform` de Tailwind cubre `transform, translate, scale, rotate`.

## Usa `will-change` con moderacion

Solo para `transform`, `opacity` y `filter`, que la GPU puede componer. Nunca `will-change: all`. Anadelo cuando veas tirones en el primer fotograma, no antes. Ver [performance.md](performance.md).

## Ajusta el grosor del icono al peso del texto

Un icono junto a texto lleva el peso optico del texto: trazo de `1.5px` junto a texto regular (400), `2px` junto a semibold (600). Un unico grosor de trazo por set de iconos y una unica libreria de iconos por superficie. El dimensionado y el volteo RTL estan en [icons.md](icons.md).

## Un solo SVG, recoloreado por estado

Los iconos usan `currentColor` y toman los estados hover, seleccionado y deshabilitado del color y la opacidad de CSS, nunca de assets separados. La variante de contorno es la de por defecto; el relleno marca el estado activo.

## Contencion del movimiento

Da a las interacciones de alta frecuencia feedback instantaneo, o una transicion de `150ms` o menos sobre opacidad y color. Una animacion propia ahi cobra su coste de atencion en cada disparo.

Todo cambio de estado animado necesita ademas una pista estatica: color, un icono o una etiqueta. El movimiento nunca es el unico canal de feedback.

## Antes de terminar

| Error | Arreglo |
| --- | --- |
| Los iconos se ven descentrados | Empujalos opticamente con padding, o arregla el SVG |
| Entrada o salida por fases brusca | Escalona las entradas poco frecuentes; manten las salidas sutiles |
| El cambio de tema funde toda la pagina | Desactiva las transiciones durante el cambio, fuerza un reflow, restaura en el siguiente fotograma |
| `transition: all` en elementos | Especifica las propiedades exactas |
| Tiron en el primer fotograma de la animacion | Anade `will-change: transform` (con moderacion) |
| Icono de trazo fino junto a texto en negrita | Ajusta el grosor de trazo al peso del texto |

## Como reportar

**Severidad.** `ALTA` rompe una interaccion, hace el movimiento inusable, o deja un cambio de estado visible solo mientras corre la animacion. `MEDIA` es una inconsistencia visible en superficies, iconos o movimiento. `BAJA` es pulido aislado.

**Verificacion.** Sin navegador: cada estado que define el componente (hover, foco, activo, cargando y vacio), mas las duraciones y easings leidos del codigo. Con navegador: recorre cada estado y reproduce el movimiento al 10% de velocidad en el panel de Animaciones. Reporta como `No verificado` toda comprobacion que no pudieras ejecutar.

**Formato.** Agrupa los hallazgos bajo el principio que incumplen, ordenados por severidad, una fila por causa raiz listando todas sus ubicaciones:

| Severidad | Ubicacion | Antes | Despues | Por que |
| --- | --- | --- | --- | --- |

Termina con `Bloquear` si queda alguna `ALTA`, y `Aprobar` en caso contrario. Nunca `Aprobar` cobertura que no inspeccionaste. Si no hay nada, di "Sin hallazgos accionables de acabado de UI" y reporta la verificacion.
