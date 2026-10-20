---
name: implement-spec
description: "Implement the result of /to-spec and /to-tickets in code, orchestrating parallel implementer subagents over the ticket graph."
tags: ["implementation", "spec", "tickets", "subagents", "orchestration"]
profiles: [core, ui, full]
origin: damiangil
---

Te han dado una spec. Esa spec debería tener tickets asociados que describen cómo implementarla. Si no los tiene, **para**: lanza `to-tickets` sobre la spec y vuelve aquí con el grafo ya publicado. Sin tickets no hay frontera que repartir, y esto se convierte en una implementación a ciegas.

El issue tracker debería estar descrito en `docs/agents/issue-tracker.md`. Si falta, pregunta al usuario dónde viven los tickets y cómo se cierra el trabajo (PR, issue, fichero).

El objetivo es la spec entera implementada en una sola **rama de integración**, con cada ticket resuelto de la forma en que el issue tracker cierra el trabajo.

Los tickets no son una lista de pasos. Son un **grafo de tareas** con relaciones de bloqueo entre ellos. Eso significa que siempre hay una **frontera** de tickets listos para cogerse.

La comunicación con los subagentes debe ser escasa. Comunica sobre todo con **punteros de contexto**: a la spec, a los tickets, a las notas de investigación y a los commits anteriores. No dupliques información que ya está disponible a través de un puntero.

Lanza los **subagentes implementadores** en segundo plano siempre que se pueda, para tener la máxima concurrencia.

## Pasos

1. Lee la spec y los tickets para entender el grafo de tareas.

2. (opcional) Usa un **subagente explorador** para la exploración que pidan los tickets: ficheros relevantes del código o documentación externa. Asegúrate de que puede guardar ficheros: debe dejar sus notas en Markdown en una carpeta fuera del repo, accesible para todos los subagentes siguientes. Así los **subagentes implementadores** se centran en implementar y no en explorar.

3. Crea la rama de integración. Si el issue tracker cierra el trabajo con PRs, o el usuario pide una, abre una PR en borrador después del primer merge del paso 5 (una rama sin commits por delante de main no puede abrirla), marcada como que cierra la spec y los tickets.

4. Usa **subagentes implementadores** para implementar cada ticket, cada uno en su propio worktree y en su propia rama (`superpowers:using-git-worktrees`). Cada subagente implementador:
   - confirma que su worktree parte de la rama de integración antes de empezar, y se reinicia sobre ella si no;
   - llama a la herramienta Skill con `superpowers:test-driven-development` para construir el ticket;
   - fusiona la punta de la rama de integración en su propia rama antes de decir que ha terminado.

5. Cuando un **subagente implementador** termina, fusiona su trabajo en la rama de integración con un **subagente fusionador**.

6. Si eso cambia la **frontera** de tickets disponibles, lanza más **subagentes implementadores** para los tickets nuevos. Así se mantiene la máxima concurrencia.

7. Cuando todos los tickets estén completos, llama a la herramienta Skill con `code-review` sobre la rama de integración. Arregla todo lo que salga de la revisión en un único **subagente implementador**.

8. Si existe una PR en borrador, márcala como lista para revisar y escribe su cuerpo con `pr`. Si no, resuelve cada ticket de la forma en que el issue tracker cierra el trabajo e informa de la rama de integración.

9. Limpia todos los worktrees de los **subagentes implementadores**.
