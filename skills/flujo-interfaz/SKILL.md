---
name: flujo-interfaz
description: "Use when work touches a screen — building or reshaping a landing, dashboard, app screen, component or prototype — to pick WHICH design skill leads and in what order the rest follow. Routes: direction first (diseno-landing or ingeniero-diseno-web), then motion, polish, originality and perception. NOT the review itself (that is `revision-interfaz`), NOT how the interface is wired (that is `ui-engineering`)."
tags: ["ui-design", "routing", "workflow"]
profiles: [ui, full]
recommends: [ingeniero-diseno-web, diseno-landing, revision-interfaz]
---

# Flujo de interfaz — quien manda en cada paso

Hay dieciseis skills de diseno y se solapan. Esta skill no disena nada: decide **cual toca** y en
que orden, para que ninguna pantalla se construya a ojo.

**El orden, en una linea:** que dice -> como se ve -> como se mueve -> pulido -> originalidad ->
psicologia.

La direccion la marca una skill, nunca el criterio del agente. Empezar a escribir CSS sin haber
elegido direccion es el error que esta skill existe para evitar.

## Paso 1 · Direccion (obligatorio, elige UNA)

| Construyes | Skill | Por que esa |
|---|---|---|
| Una landing, una web de marketing | `diseno-landing` | Es la unica que habla de negocio: oferta, objeciones, FAQ, reversion de riesgo, SEO. Su Parte B ya trae las reglas visuales. |
| Cualquier otra cosa: dashboard, pantalla de app, prototipo, presentacion, visualizacion | `ingeniero-diseno-web` | Direccion de arte, design system declarado, 25 recetas ancladas y puntos de control que frenan a confirmar. |

Para una landing no uses `ingeniero-diseno-web`: `diseno-landing` ya la cubre entera. Se solapan
porque son de autores distintos que resolvieron lo mismo.

Si el usuario no sabe que aspecto quiere, `ingeniero-diseno-web` propone tres escuelas con
referencias reales antes de construir nada.

## Paso 2 · Espectaculo, solo si toca

`sitios-calidad-premio` para un lanzamiento, un portafolio o algo que tiene que impresionar: GSAP,
un unico motor de scroll suave, Three.js solo con proposito.

En un dashboard o una herramienta de uso diario, saltatela: el espectaculo se paga en cada uso.

## Paso 3 · Movimiento

- `animar` — decide en orden si debe animarse, con que proposito, herramienta, propiedades, curva y
  duracion. Su puerta de frecuencia puede concluir que lo correcto es no animar.
- `diseno-apple` — solo si hay gestos, arrastre u hojas deslizantes: muelles con fisica real,
  interrumpibilidad, traspaso de velocidad.
- `vocabulario-animacion` — cuando el usuario describe un efecto y no sabe como se llama.
- `video-a-superprompt` — cuando aporta un video de referencia.

## Paso 4 · Pulido

`revision-interfaz` orquesta las seis `mejor-*` (layout, tipografia, colores, accesibilidad, ui,
redaccion) y consolida un unico informe ordenado por severidad. Invoca una `mejor-*` suelta solo
para una duda puntual de su terreno.

## Paso 5 · Que no parezca de IA

`tastemaker` va despues del pulido, porque necesita algo que auditar, y antes que las leyes, porque
cambia estructura y no solo detalles. Tiene un modo auditar que no toca nada. Necesita Python.

## Paso 6 · Psicologia

- `leyes-de-percepcion` — que ve el ojo primero y como se agrupan las cosas.
- `leyes-de-retencion` — por que se abandona un flujo a mitad. Su tabla sintoma -> ley es lo mas
  rentable de las dieciseis.

## Como se construye por dentro

La arquitectura de la interfaz —limites de componentes, estado en la URL o en el componente,
estados de carga, vacio y error, formularios, actualizacion optimista— es de `ui-engineering`, no
de las skills de diseno. Las mecanicas del framework son de `angular`, `react` o `nextjs`.

## Atajos

| Situacion | Cadena |
|---|---|
| Landing nueva | `diseno-landing` -> `animar` -> `revision-interfaz` |
| Dashboard o pantalla nueva | `ingeniero-diseno-web` -> `revision-interfaz` |
| Pantalla que parece hecha por IA | `tastemaker` (auditar) -> `leyes-de-percepcion` |
| Un flujo pierde usuarios a mitad | `leyes-de-retencion` -> `mejor-redaccion` -> `mejor-accesibilidad` |
| Solo pulir lo que ya hay | `revision-interfaz` |

## Donde encaja en la metodologia

Esta cadena vive **dentro** del paso de construir, no lo sustituye. El trabajo sigue llegando con
su spec escrita y su plan, y al cerrar se revisa igual: `revision-de-cambios` (que se ha roto),
`revision-interfaz` (como esta la pantalla) y `code-review` (si hace lo que pedia la spec), antes
de fusionar.
