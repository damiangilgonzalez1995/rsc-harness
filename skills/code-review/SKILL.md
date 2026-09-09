---
name: code-review
description: "Reviews changes from a fixed point (commit, branch, tag, or merge-base) along two axes — Standards (does the code follow the repo's documented coding standards?) and Spec (does the code match what the source issue/PRD asked for?). Runs both reviews in parallel sub-agents and reports them side by side. Use when the user wants to review a branch, a PR, work in progress, or asks to \\"review from X\\"."
tags: ["code-review", "standards", "spec-compliance"]
profiles: [core, ui, full]
---

Revisión en dos ejes del diff entre `HEAD` y un punto fijo que proporciona el usuario:

- **Estándares** — ¿el código se ajusta a los estándares de codificación documentados de este repo?
- **Spec** — ¿el código implementa fielmente el issue / PRD / spec de origen?

Ambos ejes se ejecutan como **sub-agentes paralelos** para que no contaminen el contexto del otro, y luego esta skill agrega sus hallazgos.

El issue tracker debería haberte sido proporcionado. Si falta `docs/agents/issue-tracker.md`, busca el spec de origen en las ubicaciones habituales del proyecto (`docs/`, `specs/`, `.scratch/`) o pregunta al usuario.

## Proceso

### 1. Fijar el punto fijo

Lo que diga el usuario es el punto fijo — un SHA de commit, nombre de rama, tag, `main`, `HEAD~5`, etc. Si no especifica ninguno, pregúntalo.

Captura el comando de diff una vez: `git diff <punto-fijo>...HEAD` (tres puntos, para que la comparación sea contra el merge-base). Anota también la lista de commits vía `git log <punto-fijo>..HEAD --oneline`.

Antes de seguir, confirma que el punto fijo resuelve (`git rev-parse <punto-fijo>`) y que el diff no está vacío. Una ref inválida o un diff vacío debe fallar aquí — no dentro de dos sub-agentes paralelos.

### 2. Identificar la fuente del spec

Busca el spec de origen, en este orden:

1. Referencias a issues en los mensajes de commit (`#123`, `Closes #45`, `!67` de GitLab, etc.) — recupéralas vía el flujo de `docs/agents/issue-tracker.md`.
2. Una ruta que el usuario haya pasado como argumento.
3. Un archivo PRD/spec bajo `docs/`, `specs/` o `.scratch/` que coincida con el nombre de la rama o la feature.
4. Si no encuentras nada, pregunta al usuario dónde está el spec. Si dice que no hay, el sub-agente de **Spec** se salta y reporta "no hay spec disponible".

### 3. Identificar las fuentes de estándares

Cualquier cosa en el repo que documente cómo debe escribirse el código, como `CODING_STANDARDS.md` o `CONTRIBUTING.md`. (En este proyecto: `CLAUDE.md` y `docs/CARTA-MAGNA.md`.)

Además de lo que el repo documente, el eje de Estándares siempre lleva el **smell baseline** de abajo — un conjunto fijo de code smells de Fowler (_Refactoring_, cap. 3) que aplica incluso cuando el repo no documenta nada. Dos reglas lo condicionan:

- **El repo manda.** Un estándar documentado del repo siempre gana; donde el repo avale algo que el baseline marcaría, suprime el smell.
- **Siempre es un juicio.** Cada smell es una heurística etiquetada ("posible Feature Envy"), nunca una violación dura — y, como cualquier estándar aquí, sáltate lo que el tooling ya imponga.

Cada smell se lee *qué es* → *cómo arreglarlo*; contrástalo con el diff:

- **Nombre misterioso (Mysterious Name)** — una función, variable o tipo cuyo nombre no revela qué hace o qué guarda. → renómbralo; si no sale un nombre honesto, el diseño está turbio.
- **Código duplicado (Duplicated Code)** — la misma forma de lógica aparece en más de un hunk o archivo del cambio. → extrae la forma compartida, llámala desde ambos.
- **Feature Envy** — un método que hurga en los datos de otro objeto más que en los suyos. → mueve el método a los datos que envidia.
- **Grupos de datos (Data Clumps)** — los mismos pocos campos o params viajan siempre juntos (un tipo que quiere nacer). → agrúpalos en un solo tipo, pasa ese.
- **Obsesión por primitivos (Primitive Obsession)** — un primitivo o string que hace de concepto de dominio que merece su propio tipo. → dale al concepto su propio tipo pequeño.
- **Switches repetidos (Repeated Switches)** — el mismo `switch`/cascada de `if` sobre el mismo tipo se repite por el cambio. → reemplázalo con polimorfismo, o un mapa que ambos sitios compartan.
- **Cirugía de escopeta (Shotgun Surgery)** — un cambio lógico obliga a ediciones dispersas en muchos archivos del diff. → reúne lo que cambia junto en un solo módulo.
- **Cambio divergente (Divergent Change)** — un archivo o módulo se edita por varias razones no relacionadas. → divídelo para que cada módulo cambie por una sola razón.
- **Generalidad especulativa (Speculative Generality)** — abstracción, parámetros o hooks añadidos para necesidades que el spec no tiene. → bórralo; vuelve a hacerlo inline hasta que aparezca una necesidad real.
- **Cadenas de mensajes (Message Chains)** — navegación larga `a.b().c().d()` de la que el llamante no debería depender. → oculta el recorrido tras un método del primer objeto.
- **Intermediario (Middle Man)** — una clase o función que casi solo delega hacia adelante. → córtala, llama al objetivo real directamente.
- **Herencia rechazada (Refused Bequest)** — una subclase o implementador que ignora o sobrescribe casi todo lo que hereda. → suelta la herencia, usa composición.

### 4. Lanzar ambos sub-agentes en paralelo

Envía un único mensaje con dos llamadas a la herramienta `Agent`. Usa el subagente `general-purpose` para ambos.

**Prompt del sub-agente de Estándares** — incluye:

- El comando de diff completo y la lista de commits.
- La lista de archivos-fuente de estándares que encontraste en el paso 3, **más el smell baseline del paso 3 pegado completo** — el sub-agente no tiene otro acceso a él.
- El encargo: "Reporta — por archivo/hunk donde proceda — (a) cada lugar donde el diff viola un estándar documentado: cita el estándar (archivo + la regla); y (b) cualquier smell del baseline que detectes: nómbralo y cita el hunk. Distingue violaciones duras de juicios — las infracciones de estándar documentado pueden ser duras, pero los smells del baseline son siempre juicios, y un estándar documentado del repo prevalece sobre el baseline. Sáltate lo que el tooling imponga. Menos de 400 palabras."

**Prompt del sub-agente de Spec** — incluye:

- El comando de diff y la lista de commits.
- La ruta o el contenido recuperado del spec.
- El encargo: "Reporta: (a) requisitos que el spec pedía y que faltan o están parciales; (b) comportamiento en el diff que no se pidió (scope creep); (c) requisitos que parecen implementados pero cuya implementación parece incorrecta. Cita la línea del spec por cada hallazgo. Menos de 400 palabras."

Si falta el spec, sáltate el sub-agente de Spec y anótalo en el reporte final.

### 5. Agregar

Presenta los dos reportes bajo los encabezados `## Estándares` y `## Spec`, verbatim o ligeramente limpiados. **No** fusiones ni reordenes los hallazgos — los dos ejes son deliberadamente separados (ver _Por qué dos ejes_).

Termina con un resumen de una línea: total de hallazgos por eje, y el peor problema _dentro de cada eje_ (si lo hay). No elijas un único ganador entre ejes — eso es el reordenamiento que la separación existe para evitar.

## Por qué dos ejes

Un cambio puede pasar un eje y fallar el otro:

- Código que sigue todos los estándares pero implementa lo equivocado → **Estándares pasa, Spec falla.**
- Código que hace exactamente lo que pedía el issue pero rompe las convenciones del proyecto → **Spec pasa, Estándares falla.**

Reportarlos por separado evita que un eje enmascare al otro.
