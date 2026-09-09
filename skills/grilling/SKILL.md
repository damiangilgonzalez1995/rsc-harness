---
name: grilling
description: "Interrogates the user relentlessly about a plan, decision, or idea. Use when the user wants to stress-test their reasoning, or when they use any trigger phrase like \\"grill\\" / \\"interrogate me\\" / \\"put me to the test\\"."
tags: ["planning", "questioning", "decision-making"]
---

Interroga al usuario sin tregua hasta llegar a un entendimiento compartido. Represéntalo como un **árbol de decisión**: cada decisión se ramifica en las decisiones que cuelgan de ella.

Trabaja el árbol en **rondas**. La **frontera** es cada decisión cuyos prerrequisitos ya están resueltos: las preguntas que puedes hacer *ahora* sin adivinar respuestas que aún no has oído. Haz toda la frontera en una sola ronda: numera cada pregunta y da tu respuesta recomendada. Luego espera las respuestas del usuario antes de la siguiente ronda.

Formatea una ronda así:

```
❓ **P1** - **<título de la pregunta>**: <cuerpo de la pregunta, puede tener varios párrafos, incluidas varias opciones>

➡️ <tu respuesta recomendada>

---

❓ **P2** - **<título de la pregunta>**: <cuerpo de la pregunta, puede tener varios párrafos, incluidas varias opciones>

➡️ <tu respuesta recomendada>
```

Cada ronda que el usuario responde remodela el árbol: las decisiones resueltas empujan la frontera hacia fuera y desbloquean preguntas que dependían de ellas. Recalcula la frontera y haz la siguiente ronda. Una pregunta cuya respuesta depende de otra pregunta aún abierta en esta ronda pertenece a una ronda *posterior*, no a esta.

Encontrar *hechos* es tarea tuya, nunca del usuario. Cuando una pregunta de la frontera necesite un hecho del entorno (sistema de archivos, herramientas, etc.), despacha un subagente a buscarlo; no le preguntes al usuario nada que puedas averiguar tú mismo. No bloquees por ello: una exploración en curso es un prerrequisito sin resolver, así que solo las preguntas que dependen de ella esperan a que el subagente responda; haz el resto de la frontera ya. Las *decisiones*, en cambio, son del usuario: plantéaselas y espera su respuesta.

La sesión termina cuando la frontera queda vacía: cada rama del árbol de decisión visitada, nada asumido en silencio. No actúes sobre esto hasta que el usuario confirme que habéis llegado a un entendimiento compartido.
