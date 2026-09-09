# Mecánica de skills

La rama específica de skills de [`writing-for-agents`](SKILL.md): qué cambia cuando el documento es una skill (frontmatter, la elección de invocación y las skills router). Todo lo demás sobre escribirla es la referencia universal en `SKILL.md`.

## Invocación

Dos opciones, que intercambian las dos cargas:

- Una skill **invocada por el modelo** conserva una `description`, así que el agente puede dispararla de forma autónoma, y otras skills pueden alcanzarla. Aun así puedes escribir su nombre: la invocación por modelo siempre *incluye* el alcance del usuario; una `description` solo añade descubrimiento por el agente, nunca quita el del humano. La `description` es el puntero de contexto de primer nivel de la skill, forzado a estar siempre cargado: carga de contexto permanente a cambio de descubribilidad. Una skill invocada por el modelo cuyo contenido es todo referencia es también un hogar para referencia compartida: otra skill puede invocarla, así que la referencia que necesitan varias skills vive en un solo sitio. Mecánica: omite `disable-model-invocation`, y escribe una `description` orientada al modelo que lleve las ramas de disparo (las reglas de redacción de punteros de `SKILL.md` aplican en su totalidad).
- Una skill **invocada por el usuario** retira la `description` del alcance del agente: solo el humano que escribe su nombre puede invocarla, y ninguna otra skill puede. Cero carga de contexto, pero gasta carga cognitiva: tú eres el índice que debe recordar que existe. Mecánica: pon `disable-model-invocation: true`; la `description` se vuelve orientada al humano: un resumen de una línea, sin las ramas de disparo.

Elige invocación por modelo solo cuando el agente deba alcanzar la skill por su cuenta, o cuando otra skill deba hacerlo. Si solo se dispara a mano, hazla invocada por usuario y no pagues carga de contexto.

La referencia compartida que necesitan dos skills invocadas por usuario no puede vivir en ninguna de las dos: sin `description`, ninguna puede disparar a la otra. Empújala a un fichero plano fuera del sistema de skills: referencia externa a la que cualquier skill puede apuntar.

## Dividir por invocación

El corte de invocación de la división (el corte de secuencia vive en `SKILL.md`): separa una skill invocada por el modelo cuando tienes una palabra clave distinta que debería dispararla por sí sola (una palabra de disparo que realmente usas en tus prompts), o cuando otra skill debe alcanzarla. Pagas carga de contexto por la nueva `description` siempre cargada, así que ese alcance independiente tiene que merecer la pena.

## Skills router

Cuando las skills invocadas por usuario se multiplican más allá de lo que puedes recordar, esa carga cognitiva acumulada se cura con una **skill router**: una skill invocada por usuario que nombra a las demás y cuándo recurrir a cada una, para que el humano tenga que recordar una sola skill en lugar de muchas. Solo puede insinuar, nunca dispararlas: las skills invocadas por usuario no tienen `description`, así que nada excepto el humano puede alcanzarlas.
