# Skills personales: el ciclo spec-driven

Guía de las 37 skills personales del catálogo: qué hace cada una, en qué fase del ciclo se usa y
en qué orden. Viene del antiguo repositorio `claude-skills`, que este harness sustituye.

Las skills viven en [`skills/`](../../skills/), junto al resto del catálogo. Sus cuerpos están en
español; solo la `description` de cada una está traducida al inglés, para que Claude decida
cuándo activarlas.

## La filosofía: spec-driven development

La fuente de verdad es un **documento escrito**, no un mensaje de chat. Primero se baja la idea a
tierra, después se escribe la spec, se planifica, se implementa y al final se revisa contra lo
especificado. Cada skill ocupa un sitio en ese ciclo.

![La filosofía: spec-driven development](../img/00-filosofia.png)

Tres cosas hacen que funcione, y son las que más se saltan:

- **Lo que aclaras vuelve a la spec.** Aclarar no es una conversación suelta: es cerrar un hueco
  para poder escribir el documento.
- **Las decisiones difíciles de revertir quedan en un ADR** con `write-adr`, en `docs/adr/`. Una
  decisión que solo está en el chat se pierde al cerrar la sesión.
- **La revisión se hace contra la spec**, no contra el gusto de quien revisa. Si el código no
  cumple lo especificado, se vuelve a la spec, no se discute en el PR.

## El mapa de implementación

La cadena depende del **tamaño** de la tarea, y el agente encadena cada paso él solo: no hace
falta escribir cada `/comando`.

![Mapa de implementación: la cadena según el tamaño](../img/05-mapa-implementacion.png)

| Tamaño | Cadena |
|---|---|
| Una línea (errata, config) | Hacerlo sin más, diciendo que se salta la cadena |
| Pequeño (una sesión, un ticket) | `superpowers:brainstorming` si la idea está verde, o `grill-with-docs` si ya hay plan → `implement` → `code-review` → `pr` |
| Grande (varias sesiones o muchas piezas) | `grill-with-docs` o `wayfinder` → `to-spec` (+ `write-adr`) → `to-tickets` → `implement-spec` → `code-review` → `pr` |

`superpowers:writing-plans` y `superpowers:executing-plans` ya no forman parte de la cadena:
hacían lo mismo que `to-tickets` e `implement`, y mezclar las dos cadenas hacía que se perdieran
los tickets.

Siempre, en cualquier fase que toque código: `superpowers:test-driven-development` y
`superpowers:verification-before-completion` antes de dar algo por terminado. Los bugs empiezan
por `superpowers:systematic-debugging`.

## El flujo en una línea

```
Pequeño:  brainstorming (idea verde)  o  grill-with-docs (hay plan)  →  implement
Grande:   grill-with-docs  o  wayfinder  →  to-spec (+ write-adr)  →  to-tickets  →  implement-spec
Ambos:    →  code-review (estándares + spec)  →  pr (resumen, evidencia, peligro de fusión)
```

Es el mismo flujo que el harness inyecta como regla en cada mensaje (`targets/hook-once.mjs`).
Si cambias uno, cambia el otro.

---

## Las fases

| Fase | Skills | Guía |
|---|---|---|
| **1 · Planificar** | `claude-project-setup`, `superpowers:brainstorming`, `grill-with-docs`, `wayfinder`, `research`, `to-questionnaire`, `prototype`, `to-spec`, `write-adr`, `to-tickets` | [1-planificar.md](1-planificar.md) |
| **2 · Implementar** | `implement` (pequeño), `implement-spec` (grande) | [2-implementar.md](2-implementar.md) |
| **3 · Interfaz** | Las 16 de diseño | [3-interfaz.md](3-interfaz.md) |
| **4 · Revisar y cerrar** | `code-review`, `pr`, `revision-de-cambios`, `revision-interfaz`, `handoff` | [4-revisar-y-cerrar.md](4-revisar-y-cerrar.md) |
| **9 · Otras** | `teach`, `muscle-memory`, `wait-what`, `writing-for-agents`, `retro` | [9-otras.md](9-otras.md) |

`grilling`, `grill-me` y `domain-modeling` están instaladas, pero no hace falta invocarlas: van
dentro de `grill-with-docs`.

Para explicar todo esto a alguien no técnico: [guia-para-clase.md](guia-para-clase.md).

---

## Instalación

Ya no hace falta clonar nada ni ejecutar un instalador. En el proyecto:

```bash
npx @damiangilgonzalez/harness@latest onboard
```

El onboarding decide el paquete según el proyecto:

| Proyecto | Recibe |
|---|---|
| Pequeño | Lo básico (`orient`, `suggest`, `harness`, `teach`…) |
| Software con entidad | Básico + todo el flujo de trabajo + el plugin superpowers declarado |
| Con interfaz (React, Next, Vue, Svelte, Angular) | Lo anterior + las 16 de diseño + `ui-engineering` |

Para añadir una skill suelta: `npx @damiangilgonzalez/harness@latest add <nombre>`.

## Los esquemas

Las imágenes de `docs/img/` y `docs/img/readme/` están diseñadas a partir de
[`docs/design/brief-imagenes.md`](../design/brief-imagenes.md), que dice qué cuenta cada una. El
`.mmd` de cada esquema es su estructura. Para cambiar un esquema: edita su `.mmd` y su ficha en el
brief, y vuelve a generar el PNG con el mismo nombre.
