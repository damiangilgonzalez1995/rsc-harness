---
name: to-tickets
description: "Breaks down a plan, a spec, or the current conversation into a set of \\"tracer bullet\\" tickets (vertical slices), each declaring which tickets block it, and publishes them to the configured tracker — as local files (one per ticket) or as issues with native blocking links in a real tracker."
tags: ["tickets", "planning", "issue-tracker"]
---


# To Tickets

Descompone un plan, una spec o una conversación en un conjunto de **tickets** — vertical slices tipo "bala trazadora" (tracer bullet), cada uno declarando los tickets que lo **bloquean**.

El issue tracker y el vocabulario de etiquetas de triaje deberían haberte sido proporcionados. Si no hay tracker configurado, usa por defecto el modo de archivos locales descrito más abajo.

## Proceso

### 1. Reunir contexto

Trabaja con lo que ya haya en el contexto de la conversación. Si el usuario pasa una referencia como argumento (ruta de una spec, número o URL de un issue), recupérala y lee su cuerpo completo y sus comentarios.

### 2. Explorar el codebase (opcional)

Si aún no has explorado el codebase, hazlo para entender el estado actual del código. Los títulos y descripciones de los tickets deben usar el vocabulario del glosario de dominio del proyecto y respetar los ADRs del área que tocas.

Busca oportunidades de "prefactorizar" el código para facilitar la implementación. "Haz que el cambio sea fácil, y luego haz el cambio fácil."

### 3. Bocetar los vertical slices

Divide el trabajo en tickets **bala trazadora**.

<reglas-vertical-slice>

- Cada slice corta un camino estrecho pero COMPLETO a través de todas las capas (schema, API, UI, tests) — vertical, NO una rebanada horizontal de una sola capa
- Un slice completado es demoable o verificable por sí solo
- Cada slice está dimensionado para caber en una sola ventana de contexto fresca
- Cualquier prefactorización debe hacerse primero

</reglas-vertical-slice>

Da a cada ticket sus **aristas de bloqueo** — los otros tickets que deben completarse antes de que pueda empezar. Un ticket sin bloqueadores puede empezar de inmediato.

**Los refactors anchos son la excepción al vertical slicing.** Un **refactor ancho** es un único cambio mecánico — renombrar una columna, retipar un símbolo compartido — cuyo **radio de impacto** se extiende por todo el codebase, de modo que una sola edición rompe miles de call sites a la vez y ningún vertical slice puede aterrizar en verde. No lo fuerces a ser una bala trazadora; secuéncialo como **expand–contract**. Primero expande: añade la forma nueva junto a la vieja para que nada se rompa. Luego migra los call sites por lotes dimensionados según el radio de impacto (por paquete, por directorio), cada lote como su propio ticket bloqueado por el expand, manteniendo la CI en verde de lote en lote porque la forma vieja sigue existiendo. Finalmente contrae: borra la forma vieja cuando no quede ningún caller, en un ticket bloqueado por todos los lotes de migración. Cuando ni siquiera los lotes puedan mantenerse en verde por sí solos, conserva la secuencia pero deja que compartan una rama de integración que todos bloquean hacia un ticket final de integrar-y-verificar — el verde solo se promete allí.

### 4. Interrogar al usuario

Presenta la descomposición propuesta como una lista numerada. Para cada ticket, muestra:

- **Título**: nombre corto y descriptivo
- **Bloqueado por**: qué otros tickets (si los hay) deben completarse antes
- **Qué entrega**: el comportamiento de extremo a extremo que este ticket hace funcionar

Pregunta al usuario:

- ¿La granularidad se siente correcta? (¿demasiado gruesa / demasiado fina?)
- ¿Las aristas de bloqueo son correctas — cada ticket depende solo de tickets que genuinamente lo condicionan?
- ¿Habría que fusionar algún ticket o dividirlo más?

Itera hasta que el usuario apruebe la descomposición.

### 5. Publicar los tickets en el tracker configurado

Publica los tickets aprobados. El **cómo** depende del tracker configurado — los tickets son los mismos en ambos casos, solo cambia la forma de las aristas de bloqueo:

- **Archivos locales** → escribe un archivo por ticket en `.scratch/<slug-de-la-feature>/issues/<NN>-<slug>.md`, numerados desde `01` en orden de dependencias (bloqueadores primero). El "Bloqueado por" de cada archivo lista los números/títulos de los que depende. Usa la plantilla de ticket-por-archivo de abajo — un ticket por archivo, nunca un único archivo combinado.
- **Un issue tracker real (GitHub, Linear, …)** → publica un issue por ticket en orden de dependencias (bloqueadores primero) para que las aristas de bloqueo de cada ticket puedan referenciar identificadores reales. Usa la relación nativa de bloqueo / sub-issue de la plataforma si la tiene; si no, pon en el "Bloqueado por" de cada ticket los issues que lo bloquean. Aplica la etiqueta de triaje `ready-for-agent` salvo instrucción en contra — los tickets son agarrables por un agente por construcción.

Trabaja la **frontera**: cualquier ticket cuyos bloqueadores estén todos hechos. Para una cadena puramente lineal, eso significa de arriba a abajo.

NO cierres ni modifiques ningún issue padre.

<plantilla-ticket-local>

# <NN> — <Título del ticket>

**Qué construir:** el comportamiento de extremo a extremo que este ticket hace funcionar, desde la perspectiva del usuario — no una lista de implementación capa por capa.

**Bloqueado por:** los números/títulos de los tickets que condicionan este, o "Ninguno — puede empezar de inmediato".

**Estado:** ready-for-agent

- [ ] Criterio de aceptación 1
- [ ] Criterio de aceptación 2

</plantilla-ticket-local>

<plantilla-issue>

## Padre

Una referencia al issue padre en el tracker (si el origen fue un issue existente; si no, omite esta sección).

## Qué construir

El comportamiento de extremo a extremo que este ticket hace funcionar, desde la perspectiva del usuario — no implementación capa por capa.

## Criterios de aceptación

- [ ] Criterio 1
- [ ] Criterio 2

## Bloqueado por

- Una referencia a cada ticket que lo bloquea, o "Ninguno — puede empezar de inmediato".

</plantilla-issue>

En cualquiera de las dos formas, evita rutas de archivo concretas o snippets de código — se quedan obsoletos rápido. Excepción: si un prototipo produjo un snippet que codifica una decisión con más precisión que la prosa (máquina de estados, reducer, schema, forma de un tipo), inclúyelo y anota brevemente que salió de un prototipo. Recórtalo a las partes ricas en decisión — no una demo funcional, solo lo importante.
