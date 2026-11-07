---
name: flujo-interfaz
description: "Use when work touches a screen — building or reshaping a landing, dashboard, app screen, component or prototype — to pick WHICH design skill leads and in what order the rest follow. Routes: project context first (impeccable init), then direction (diseno-landing or ingeniero-diseno-web), motion, polish, originality and perception. NOT the review itself (that is `revision-interfaz`), NOT how the interface is wired (that is `ui-engineering`)."
tags: ["ui-design", "routing", "workflow"]
profiles: [ui, full]
recommends: [ingeniero-diseno-web, diseno-landing, revision-interfaz, emil-design-eng]
origin: damiangil
---

# Flujo de interfaz — quien manda en cada paso

Hay muchas skills de diseno y se solapan. Esta skill no disena nada: decide **cual toca** y en
que orden, para que ninguna pantalla se construya a ojo.

**El orden, en una linea:** contexto -> que dice -> como se ve -> como se mueve -> pulido ->
originalidad -> psicologia -> casos extremos.

La direccion la marca una skill, nunca el criterio del agente. Empezar a escribir CSS sin haber
elegido direccion es el error que esta skill existe para evitar.

## Paso 0 · Contexto del proyecto (una vez, al empezar la interfaz)

`impeccable` (externa, de pbakaus) guarda dos ficheros en la raiz que luego leen todos sus
comandos: `PRODUCT.md` (para quien es, que hace, restricciones) y `DESIGN.md` (el sistema visual).
Sin ellos critica y audita a ciegas.

| Situacion | Que hacer | Cuando |
|---|---|---|
| No hay `PRODUCT.md` y vas a disenar la **primera pantalla** | `/impeccable init` | Antes de elegir direccion. Una vez por proyecto; no a mitad de una pantalla. |
| Ya hay interfaz construida y no hay `DESIGN.md` | `/impeccable document` | Antes de criticar, auditar o rehacer algo existente. |
| Cambia el publico o el producto | Reejecutar `init` | Solo entonces. |

Si `impeccable` no esta instalada, **proponla una vez** y sigue sin ella si el usuario dice que no:
`npx impeccable install` (pregunta si por proyecto o global; despues recargar y ejecutar
`/impeccable init`). No esta incluida en el catalogo a proposito: trae su propio motor y hooks, y
instalarla es decision del usuario. Aviso: pide direcciones visuales a impeccable.style
(`npx impeccable telemetry off` lo apaga) y sus hooks corren aunque se denieguen sus comandos.

## Paso 1 · Direccion (obligatorio, elige UNA)

| Construyes | Skill | Por que esa |
|---|---|---|
| Una landing, una web de marketing | `diseno-landing` | Es la unica que habla de negocio: oferta, objeciones, FAQ, reversion de riesgo, SEO. Su Parte B ya trae las reglas visuales. |
| Cualquier otra cosa: dashboard, pantalla de app, prototipo, presentacion, visualizacion | `ingeniero-diseno-web` | Direccion de arte, design system declarado, 25 recetas ancladas y puntos de control que frenan a confirmar. |

Para una landing no uses `ingeniero-diseno-web`: `diseno-landing` ya la cubre entera. Se solapan
porque son de autores distintos que resolvieron lo mismo.

Si el usuario no sabe que aspecto quiere, `ingeniero-diseno-web` propone tres escuelas con
referencias reales antes de construir nada. Con `impeccable`, `/impeccable shape` planifica la UX
antes del codigo.

## Paso 2 · Espectaculo, solo si toca

`sitios-calidad-premio` para un lanzamiento, un portafolio o algo que tiene que impresionar: GSAP,
un unico motor de scroll suave, Three.js solo con proposito.

En un dashboard o una herramienta de uso diario, saltatela: el espectaculo se paga en cada uso.

## Paso 3 · Movimiento

La filosofia comun es la de Emil Kowalski (`emil-design-eng`): el mejor movimiento a veces es
ninguno. Primero decide si animar, luego como.

| Necesitas | Skill |
|---|---|
| Construir una animacion | `animar` (en React Native / Expo: `animate-expo`) |
| Gestos, arrastre, hojas deslizantes | `diseno-apple` (muelles, interrumpibilidad, velocidad) |
| Varios elementos que se mueven a la vez | `choreograph` (quien lidera, quien sigue, que no se mueve) |
| Va a trompicones | `animation-performance` |
| Revisar un diff con movimiento | `review-animations` (tabla antes/despues, veredicto Block/Approve) |
| Auditar el movimiento de todo el codigo | `improve-animations` |
| Ver donde faltaria movimiento | `find-animation-opportunities` |
| Sobra movimiento | `remove-animations` |
| Describe un efecto y no sabe su nombre | `vocabulario-animacion` |
| Aporta un video de referencia | `video-a-superprompt` |

## Paso 4 · Pulido

- **Con `impeccable`:** `critique` (UX puntuada con heuristicas, que arreglar primero) -> `audit`
  (accesibilidad, rendimiento, responsive, de P0 bloqueante a P3 pulido) -> `polish` (la pasada
  final antes de publicar).
- **Siempre:** `revision-interfaz` orquesta las seis `mejor-*` (layout, tipografia, colores,
  accesibilidad, ui, redaccion) y consolida un unico informe ordenado por severidad. Invoca una
  `mejor-*` suelta solo para una duda puntual de su terreno. Si ya corriste `impeccable audit`, no
  repitas accesibilidad: usa `revision-interfaz` para lo que el audit no cubre (copy, tipografia,
  color).
- **Movil:** `mobile-native` arregla lo que delata una web (hover, `100vh`, zoom en inputs, safe
  areas).

## Paso 5 · Que no parezca de IA

`tastemaker` va despues del pulido, porque necesita algo que auditar, y antes que las leyes, porque
cambia estructura y no solo detalles. Tiene un modo auditar que no toca nada. Necesita Python.
`impeccable critique` tambien caza el "AI slop"; si ya lo corriste, no dupliques con `tastemaker`
en modo auditar.

## Paso 6 · Psicologia

- `leyes-de-percepcion` — que ve el ojo primero y como se agrupan las cosas.
- `leyes-de-retencion` — por que se abandona un flujo a mitad. Su tabla sintoma -> ley es lo mas
  rentable de todas.

## Paso 7 · Casos extremos

`break-ui` alimenta el componente con el peor dato posible (nombres larguisimos, listas vacias,
emoji, cifras enormes) detras de un interruptor y lista todo lo que se rompe. Va al final, cuando
la pantalla ya esta bien en el caso feliz. Para toasts, `ask-sonner`; para elegir libreria de UI,
`pick-ui-library`.

## Como se construye por dentro

La arquitectura de la interfaz —limites de componentes, estado en la URL o en el componente,
estados de carga, vacio y error, formularios, actualizacion optimista— es de `ui-engineering`, no
de las skills de diseno. Las mecanicas del framework son de `angular`, `react` o `nextjs`.

## Atajos

| Situacion | Cadena |
|---|---|
| Proyecto nuevo, primera pantalla | `impeccable init` -> direccion (`diseno-landing` o `ingeniero-diseno-web`) |
| Landing nueva | `diseno-landing` -> `animar` -> `revision-interfaz` |
| Dashboard o pantalla nueva | `ingeniero-diseno-web` -> `revision-interfaz` |
| Pantalla que parece hecha por IA | `impeccable critique` (o `tastemaker` auditar) -> `leyes-de-percepcion` |
| Antes de publicar | `impeccable audit` -> `polish` -> `revision-interfaz` -> `break-ui` |
| Un flujo pierde usuarios a mitad | `leyes-de-retencion` -> `mejor-redaccion` -> `mejor-accesibilidad` |
| Se siente lento o recargado | `find-animation-opportunities` / `remove-animations` -> `animation-performance` |
| Solo pulir lo que ya hay | `revision-interfaz` |

## Cuando cuenta como hecho

Un cambio visual no esta hecho sin una **captura del entorno donde el usuario lo va a probar**
(su navegador, su URL, su viewport; no un test ni un render aislado si el usuario no prueba ahi).
Que compile y pasen los tests no dice nada de como se ve. Si no puedes abrirlo, dilo y no lo
declares terminado: "no lo he mirado en un navegador" es un trabajo sin acabar, no un matiz.

## Donde encaja en la metodologia

Esta cadena vive **dentro** del paso de construir, no lo sustituye. El trabajo sigue llegando con
su spec escrita y su plan, y al cerrar se revisa igual: `revision-de-cambios` (que se ha roto),
`revision-interfaz` (como esta la pantalla) y `code-review` (si hace lo que pedia la spec), antes
de fusionar.
