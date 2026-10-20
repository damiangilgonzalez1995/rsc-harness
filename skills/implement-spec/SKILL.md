---
name: implement-spec
description: "Implement the result of /to-spec and /to-tickets in code, orchestrating parallel implementer subagents over the ticket graph."
tags: ["implementation", "spec", "tickets", "subagents", "orchestration"]
disable-model-invocation: true
profiles: [core, ui, full]
origin: damiangil
---

Te han dado una spec. Esa spec debería tener tickets asociados que describen cómo implementarla.

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
   - fusiona la punta de la rama de integración en su propia rama antes de decir que ha terminado;
   - si el ticket cambia algo visible, adjunta una captura del entorno donde el usuario lo va a probar;
   - entrega un informe final de **150 palabras como máximo**: qué cambió, ficheros, resultado de los tests y bloqueos. El detalle va al commit o al ticket, no a la respuesta. Pon este tope literal en el prompt de cada subagente: cada entrega entra entera en tu contexto, y decenas de entregas largas te hacen olvidar lo que acaba de decir el usuario.

5. Cuando un **subagente implementador** termina, revisa su entrega antes de fusionar. Si toca algo visible y no trae captura, o dice que no lo ha mirado en un navegador, **no está hecho**: devuélvesela para que lo mire. Si la entrega es buena, fusiona su trabajo en la rama de integración con un **subagente fusionador**.

6. Si eso cambia la **frontera** de tickets disponibles, lanza más **subagentes implementadores** para los tickets nuevos. Así se mantiene la máxima concurrencia.

7. Cuando todos los tickets estén completos, llama a la herramienta Skill con `code-review` sobre la rama de integración. Arregla todo lo que salga de la revisión en un único **subagente implementador**.

8. Si existe una PR en borrador, márcala como lista para revisar y escribe su cuerpo con `pr`. Si no, resuelve cada ticket de la forma en que el issue tracker cierra el trabajo e informa de la rama de integración.

9. Limpia todos los worktrees de los **subagentes implementadores**.
