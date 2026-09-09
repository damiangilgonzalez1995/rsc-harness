---
name: prototype
description: "Builds a throwaway prototype to answer a design question. Use when the user wants to check whether a state model or logic \\"feels right\\", or explore what a UI should look like."
tags: ["prototyping", "design", "exploration"]
profiles: [core, ui, full]
---

# Prototipo

Un prototipo es **código desechable que responde a una pregunta**. La pregunta decide la forma.

## Elige la rama

Identifica qué pregunta se está respondiendo — a partir del mensaje del usuario, del código de alrededor, o preguntándole si está disponible:

- **"¿Esta lógica / este modelo de estados se siente bien?"** → [LOGIC.md](LOGIC.md). Construye una mini-app de terminal interactiva que empuje la máquina de estados a través de casos difíciles de razonar sobre el papel.
- **"¿Qué aspecto debería tener esto?"** → [UI.md](UI.md). Genera varias variaciones de UI radicalmente distintas en una sola ruta, conmutables mediante un parámetro de búsqueda en la URL y una barra flotante inferior.

Las dos ramas producen artefactos muy diferentes — equivocarse aquí desperdicia el prototipo entero. Si la pregunta es genuinamente ambigua y el usuario no está localizable, elige por defecto la rama que mejor encaje con el código de alrededor (un módulo de backend → lógica; una página o componente → UI) y deja escrita la suposición al principio del prototipo.

## Reglas que aplican a ambas ramas

1. **Desechable desde el primer día, y marcado claramente como tal.** Ubica el código del prototipo cerca de donde se usará de verdad (junto al módulo o la página que está prototipando) para que el contexto sea obvio — pero nómbralo de forma que cualquier lector casual vea que es un prototipo, no producción. Para rutas de UI desechables, respeta la convención de rutas que el proyecto ya use; no inventes una estructura nueva de nivel superior.
2. **Un solo comando para ejecutarlo.** Lo que el gestor de tareas del proyecto ya soporte — `pnpm <nombre>`, `python <ruta>`, `bun <ruta>`, etc. El usuario debe poder arrancarlo sin pensar.
3. **Sin persistencia por defecto.** El estado vive en memoria. La persistencia es lo que el prototipo está _comprobando_, no algo de lo que deba depender. Si la pregunta implica explícitamente una base de datos, usa una BD de usar y tirar o un archivo local con un nombre claro tipo "PROTOTIPO — bórrame".
4. **Sáltate el pulido.** Sin tests, sin manejo de errores más allá de lo que haga el prototipo _ejecutable_, sin abstracciones. El objetivo es aprender algo rápido.
5. **Muestra el estado.** Tras cada acción (lógica) o en cada cambio de variante (UI), imprime o renderiza todo el estado relevante para que el usuario vea qué cambió.
6. **Captúralo cuando termines.** Integra la decisión validada en el código real, y luego captura el prototipo en sí como **fuente primaria**: commitéalo a una rama desechable, fuera de main, y deja un puntero de contexto a esa rama en el issue de implementación. Captura también la respuesta — el veredicto y la pregunta que zanjó — en el issue o en un commit. La rama main conserva solo la decisión validada.
