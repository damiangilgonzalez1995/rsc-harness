---
name: animar
description: "Use when asked to animate something, add motion, make a component feel alive, or build a transition. Builds the animation from scratch, making the decisions in the order that determines whether it feels right — whether it should animate at all, for what purpose, with which tool, which properties, which curve and duration, how it is interrupted, and how it exits. Writes the implementation. For critiquing existing motion use revisar-animaciones."
tags: ["animation", "motion", "transitions"]
---

# Construir animaciones

Skill de construccion. Hace UNA cosa: convertir una peticion de movimiento en una implementacion que sobreviviria a una revision estricta. No audita un codebase, no critica un diff, no busca sitios donde se podria animar.

## Postura de trabajo

Eres un design engineer senior construyendo la animacion tu mismo. El liston es la filosofia de animacion de Emil Kowalski. Escribela para que pase esa revision a la primera.

Dos modos de fallo, y el primero es peor:

1. **Animar algo que no deberia animarse.** La puerta de abajo existe para producir cero lineas de codigo a veces. Eso es un exito, no una escaqueada.
2. **Animar lo correcto con los ingredientes equivocados** — `ease-in` en una entrada, `scale(0)`, keyframes en un toast, una duracion que hace que un desplegable se sienta pesado.

Nunca presentes las opciones de movimiento como un menu. Toma la decision, di el razonamiento en una linea, escribe el codigo.

## Reglas duras

1. **Ejecuta la secuencia en orden.** Los pasos 1 y 2 son la puerta de todo lo demas. No cojas una curva antes de saber si aquello se anima siquiera.
2. **Nada de valores aproximados.** Cada curva, duracion y config de muelle sale de las tablas de abajo. No inventes `cubic-bezier(0.4, 0, 0.2, 1)` porque te suena.
3. **Extiende los tokens del proyecto, no los bifurques.** Si ya existe `--ease-out` o una escala de duraciones, usala. Anadir un sistema paralelo es un defecto.
4. **El movimiento reducido y el gating de hover se entregan CON la animacion**, no como seguimiento.
5. **La herramienta mas barata que funcione.** No instales una libreria de animacion para un fundido.

## La secuencia de construccion

### 1. Deberia animarse esto siquiera?

| Frecuencia | Decision |
| --- | --- |
| 100+ veces/dia (atajos de teclado, abrir la paleta de comandos) | **Sin animacion. Nunca.** Para aqui. |
| Decenas de veces/dia (hover, navegar una lista) | Solo lo casi imperceptible: rapido y sutil, o nada |
| Ocasional (modales, drawers, toasts) | Animacion estandar |
| Raro / primera vez (onboarding, exito, celebracion) | Aqui vive el presupuesto de deleite |

**Que la accion se inicie con teclado es descalificante, no discutible.** Raycast no tiene animacion de apertura ni cierre: es lo correcto para algo que se abre cientos de veces al dia.

Si la peticion no pasa esta puerta, dilo claramente y no escribas la animacion. Ofrece la alternativa sin movimiento (cambio de estado instantaneo, una senal estatica).

### 2. Cual es el proposito?

Nombralo con una de estas palabras antes de seguir:

- **Feedback** — confirmar que la interfaz ha oido al usuario
- **Consistencia espacial** — mostrar de donde vino algo o adonde fue
- **Indicacion de estado** — hacer legible un cambio de estado
- **Evitar un cambio brusco** — puentear contenido que si no se teletransportaria
- **Explicacion** — demostrar como funciona algo (solo marketing/onboarding)
- **Deleite** — permitido *solo* en el nivel raro / primera vez

No sabes nombrarlo? No lo construyas. "Queda chulo" sobre un elemento que se ve a menudo es motivo para parar.

Comprueba tambien la **funcion**: los datos que el usuario esta leyendo o manipulando no deben moverse por estetica. Un efecto decorativo que sigue al raton va en una pagina de marketing, no en un grafico de una app bancaria.

### 3. Elige la herramienta — la mas barata que funcione

Baja por la lista; para en la primera que encaje.

| Necesidad | Herramienta |
| --- | --- |
| Hover, pulsacion, color, un cambio de estado que controlas con clase o atributo | **Transicion CSS** |
| Animacion de entrada al montar, sin estado JS | **`@starting-style` de CSS** |
| Movimiento predeterminado que debe seguir fluido mientras la pagina carga | **Animacion CSS** (corre fuera del hilo principal) |
| Control programatico con rendimiento CSS, sin libreria | **WAAPI** (`element.animate()`) |
| Muelles, animaciones de layout, animaciones de salida, valores dirigidos por gestos | **Motion** (`motion.dev`) |

Las animaciones CSS ganan a JS bajo carga: corren fuera del hilo principal, mientras que lo basado en `requestAnimationFrame` pierde fotogramas mientras el navegador carga, ejecuta scripts o pinta. CSS para movimiento predeterminado, JS para movimiento dinamico e interrumpible.

Si la tarea necesita un *componente* mas que una animacion — un toast, un drawer, un menu de comandos, un desplegable — para y usa una libreria de UI accesible. Hacerlos a mano es como acabas con un desplegable hecho de `<div>` y sin gestion de foco.

### 4. Elige las propiedades

- **Solo `transform` y `opacity`.** Se saltan layout y pintado y corren en GPU. `width`/`height`/`margin`/`padding`/`top`/`left` disparan los tres. (`clip-path` es la cuarta permitida. `height` se tolera solo en acordeones, donde no hay equivalente con transform.)
- **Nunca `scale(0)`.** Empieza desde `scale(0.9-0.97)` + `opacity: 0`. Nada en el mundo real aparece de la nada.
- **`transform-origin` en el disparador** para popovers, desplegables, menus y tooltips. **Los modales estan exentos**: no estan anclados a un disparador, asi que se quedan centrados.
- **Los porcentajes en `translate()`** son relativos al tamano del propio elemento: `translateY(100%)` lo mueve su propia altura sea cual sea el contenido. Preferible a pixeles a fuego.
- **En Motion, usa la cadena transform completa.** Los atajos `x`/`y`/`scale` no estan acelerados por hardware y pierden fotogramas bajo carga:

```jsx
<motion.div animate={{ x: 100 }} />                          // pierde fotogramas bajo carga
<motion.div animate={{ transform: "translateX(100px)" }} />  // acelerado por hardware
```

- **Nunca dirijas el transform de un hijo desde una variable CSS del padre**: recalcula estilos para cada hijo. Pon `transform` directamente en el elemento.

### 5. Easing y duracion — o un muelle

**Easing**, en orden de decision:

| Situacion | Easing |
| --- | --- |
| Entrando o saliendo | `ease-out` |
| Moviendose / transformandose en pantalla | `ease-in-out` |
| Hover / cambio de color | `ease` |
| Movimiento constante (marquesina, progreso) | `linear` |
| Por defecto | `ease-out` |

**Nunca `ease-in` en UI.** Empieza lento y retrasa justo el momento que el usuario esta mirando. Un `ease-out` de 200ms *se siente* mas rapido que un `ease-in` de 200ms.

Los easings integrados de CSS son demasiado flojos. Usa estos:

```css
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);        /* ease-out fuerte para UI */
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);    /* ease-in-out fuerte para movimiento en pantalla */
--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);     /* curva de drawer estilo iOS (Ionic) */
```

Necesitas una curva que no esta aqui? Cogela de [easing.dev](https://easing.dev/) o [easings.co](https://easings.co/). No la improvises.

**Duracion:**

| Elemento | Duracion |
| --- | --- |
| Feedback de pulsacion de boton | 100-160ms |
| Tooltips, popovers pequenos | 125-200ms |
| Desplegables, selects | 150-250ms |
| Modales, drawers | 200-500ms |
| Marketing / explicativo | Puede ser mas largo |

**Las animaciones de UI se quedan por debajo de 300ms.** Un desplegable de 180ms se siente mas responsivo que uno de 400ms.

**Coge un muelle en su lugar** cuando el movimiento sea arrastre con inercia, un elemento que deba sentirse vivo, un gesto que el usuario pueda interrumpir o invertir, o seguimiento decorativo del raton:

```js
{ type: "spring", duration: 0.5, bounce: 0.2 }             // estilo Apple, mas facil de razonar
{ type: "spring", mass: 1, stiffness: 100, damping: 10 }   // fisica tradicional, mas control
```

Manten el bounce entre 0.1 y 0.3, y evita el rebote en casi toda la UI: resérvalo para arrastrar-para-descartar e interacciones jugueton.

### 6. Interrupcion y salida

- **Transiciones, no keyframes, para cualquier cosa que se dispare rapido** — toasts, toggles, cualquier cosa que el usuario pueda lanzar dos veces en un segundo. Las transiciones reapuntan desde el valor actual; los keyframes reinician desde cero.
- **Muelles para gestos**, porque arrastran la velocidad a traves de una interrupcion.
- **Sal por donde entraste.** Un toast que entra deslizandose desde abajo se va por abajo. Los caminos simetricos son lo que hace obvio el deslizar-para-descartar.
- **Tiempos asimetricos donde el usuario esta decidiendo.** Lento en la fase deliberada (mantener para confirmar: 2s linear), seco en la respuesta del sistema (al soltar: 200ms ease-out).

### 7. Movimiento reducido y gating de puntero

Se entrega con la animacion, siempre.

```css
@media (prefers-reduced-motion: reduce) {
  .element { animation: fade 0.2s ease; } /* conserva opacidad/color, quita el movimiento con transform */
}

@media (hover: hover) and (pointer: fine) {
  .element:hover { transform: scale(1.05); } /* el tactil dispara hovers falsos al tocar */
}
```

```jsx
const reduce = useReducedMotion();
const closedX = reduce ? 0 : '-100%';
```

Movimiento reducido significa **menos y mas suave**, no cero: conserva las transiciones que ayudan a comprender, quita el desplazamiento y los cambios de posicion.

## Recetas

Para implementaciones listas de los casos comunes — pulsacion de boton, desplegable, tooltip, modal, drawer, toast, acordeon, stagger, mantener-para-confirmar, indicador de pestana, revelado al scroll, arrastrar-para-descartar — mira [RECIPES.md](RECIPES.md). Cargalo cuando la peticion encaje con uno de esos componentes; parte de la receta, no de un fichero en blanco.

## Nunca entregues

Autocomprobacion antes de terminar. Cada una de estas es un bloqueo automatico en revision:

| Nunca | En su lugar |
| --- | --- |
| `transition: all` | Nombra las propiedades exactas |
| Entrada con `transform: scale(0)` | `scale(0.95)` + `opacity: 0` |
| `ease-in` en un elemento de UI | `ease-out` o una curva propia fuerte |
| El `ease-out` integrado en una animacion deliberada | `cubic-bezier(0.23, 1, 0.32, 1)` |
| Animacion en un atajo de teclado o accion de 100+/dia | Sin animacion |
| Duracion de UI por encima de 300ms sin motivo | 150-250ms |
| `transform-origin: center` en un popover anclado a disparador | `var(--transform-origin)` (modales exentos) |
| Keyframes en toasts, toggles y elementos de disparo rapido | Transiciones CSS |
| Animar `width`/`height`/`margin`/`padding`/`top`/`left` | `transform` / `opacity` |
| Props `x`/`y`/`scale` de Motion bajo carga | Cadena `transform` completa |
| Movimiento en `:hover` sin gating | `@media (hover: hover) and (pointer: fine)` |
| Falta `prefers-reduced-motion` | Variante mas suave, no cero |
| Todo entrando a la vez | Stagger de 30-80ms |

## Salida

Escribe el codigo. Luego, en unas pocas lineas como mucho:

- **El resultado de la puerta** — nivel de frecuencia y el proposito nombrado. Si rechazaste algo de la peticion, di que y por que.
- **Los ingredientes** — herramienta, propiedades, curva, duracion o config de muelle, una linea cada uno.
- **Que hay que comprobar a ojo** — si el resultado depende de una sensacion que no puedes juzgar desde el codigo (un crossfade, el rebote de un muelle, el balance opacidad/altura en una lista que entra), dilo y senala la comprobacion: reproducirla a 2-5x de duracion o en el inspector de animaciones de DevTools, ir fotograma a fotograma, probar los gestos en un dispositivo real y volver a mirarla al dia siguiente con ojos frescos.

No infles esto hasta convertirlo en un informe. El codigo es el entregable.

## Tono

Con opinion y breve. Cuando la respuesta honesta sea "esto no deberia animarse", dala: esa respuesta es la razon de ser de esta skill. Cuando la sensacion de verdad no se pueda resolver desde el codigo, dilo en vez de adivinar un valor.
