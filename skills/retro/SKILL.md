---
name: retro
description: "Conduct a retrospective on a coding session: find what in the agent's environment (navigation, checks, standards, steering files, tooling) should change so future runs go better."
tags: ["retrospective", "session-review", "agent-environment"]
disable-model-invocation: true
profiles: [core, ui, full]
origin: damiangil
---

El usuario ha pedido una **retrospectiva**. Vas a proponer mejoras en el **entorno** del agente de código para que las próximas ejecuciones salgan mejor.

## Pasos

1. Llama a la herramienta Skill con `writing-for-agents` para tener la guía de estilo.

2. Lee las fuentes primarias de la sesión que indique el usuario. Puede que tengas que buscar en los registros de sesión de esta máquina (en Claude Code, `~/.claude/projects/`). Si el usuario no indica ninguna, usa la sesión actual.

3. Busca candidatos a mejora en estas categorías:

- **Navegación**: ¿le costó al agente encontrar los ficheros correctos? ¿Hay dependencias ocultas entre ficheros? ¿Un **puntero de navegación** lo pondría más fácil? _Úsalo cuando_ la sesión tardó mucho en encontrar una información.
- **Comprobaciones automáticas**: ¿hay comprobaciones automáticas que pillarían los errores que cometió el agente? Linting, tipos, tests, linters del sistema de ficheros. Lee primero el comando de comprobación del propio repo (los scripts `lint`/`check` de su `package.json` o de su herramienta de build, su workflow de CI), para que el hallazgo sea una comprobación que ya existe pero está sin conectar o rota en silencio, y no una reinvención. Un repo sin ninguna **barrera** (ni hook de pre-commit ni job de CI que ejecute su lint/typecheck/test) es en sí un hallazgo: un repo sin lint es una oportunidad perdida permanente, no un punto de partida neutro. _Úsalo cuando_ el agente cometió un error que una comprobación automática habría pillado, o el repo no tiene ninguna barrera.
- **Estándares de código**: ¿hay que darle al **agente revisor** una regla nueva que haga cumplir? ¿Hay que quitar o aclarar una regla existente? Clasifica primero la infracción: una **mecánica** (un patrón sintáctico fijo, una API prohibida, una forma de import, una regla de ubicación de ficheros) lleva una comprobación determinista, sin más: una regla propia en el linter del repo, un hook de pre-commit nuevo o un job de CI nuevo, lo que salga más barato según el lenguaje y la barrera que ya tenga el repo. Por defecto, construye la comprobación antes que escribir la regla. Reserva `CODING_STANDARDS.md` para las **decisiones de criterio** de verdad (coherencia entre ficheros, "encaja con el estilo de alrededor", cualquier cosa que ninguna barrera pueda sustituir). _Úsalo cuando_ el agente revisor no pilló un error.
- **AGENTS.md / CLAUDE.md global**: ¿hay instrucciones de dirección que deberían pasar a los estándares de código (o a comprobaciones automáticas)? _Úsalo cuando_ el fichero es especialmente grande, en el repo O en el ámbito global del usuario.
- **Economía de herramientas**: ¿hizo el agente llamadas a herramientas caras que se podrían simplificar? ¿Hay alguna herramienta propia (CLIs, MCPs) que gaste muchos tokens? _Úsalo cuando_ el agente hizo una llamada cara.
- **Instrucciones sin efecto**: busca instrucciones en los ficheros de dirección que no cambian el comportamiento del agente. _Úsalo cuando_ los ficheros de dirección son grandes y difíciles de manejar.
- **Acceso a la información**: busca formas de darle al agente más acceso a la información. Volcar los logs del servidor de desarrollo, acceso de solo lectura a servicios de terceros. _Úsalo cuando_ el agente no tenía una información clave.

4. Presenta estos candidatos al usuario, ordenados por gravedad. Tú no aplicas nada: el usuario decide qué se cambia.

## Referencia

### Implementación frente a revisión

Recuerda que todo el trabajo pasa por dos fases: implementación y revisión. El agente que implementa es el que más **presión de contexto** tiene: se encarga de explorar, escribir el código y depurar los fallos.

El agente revisor es el que menos presión de contexto tiene: recibe un diff, así que no tiene que explorar. Muchas veces no necesita escribir código ni depurar.

Eso significa que el agente revisor debe ser el responsable de hacer cumplir los estándares de código, no el que implementa.

### Ficheros

Tienes acceso a varios ficheros en el repo:

- `CLAUDE.md`/`AGENTS.md`: estos ficheros entran en la ventana de contexto de cualquier agente que trabaje en el repo. Hay que usarlos con muchísima moderación, normalmente solo para **punteros de navegación** a otros ficheros.
- `CODING_STANDARDS.md`: este fichero se lee durante la revisión, no durante la implementación. Añade **punteros de navegación** a carpetas de docs si el fichero de estándares pasa de 1.000 líneas.
- Docs: usa los docs como ficheros de referencia, señalados desde otros ficheros. Busca docs existentes antes de escribir otros nuevos.
- Skills: usa skills para docs (porque su descripción entra en la ventana de contexto del agente) o para comandos que invoca el usuario. Sigue los consejos de la skill `writing-for-agents`.
