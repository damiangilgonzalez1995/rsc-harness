# La memoria del harness: qué recuerda, dónde y cómo usarla

Claude Code empieza cada conversación en blanco. El harness le da memoria guardándola en ficheros, en tres capas distintas. Cada una responde a una pregunta diferente:

| Capa | Qué guarda | Dónde | Quién la escribe | ¿Viaja con el repo? |
|---|---|---|---|---|
| **1. La wiki del proyecto** | Lo que el proyecto *sabe*: decisiones, stack, cómo se hace cada cosa, hechos del negocio | `docs/wiki/` (y `docs/attachments/`, `01-TOOLS/`) | El agente y tú, mientras trabajáis | Sí, es un fichero más del repo |
| **2. El diario de sesión** | *Dónde lo dejaste*: rama, ficheros tocados, commits, lecciones aprobadas | `.rsc/memory/` o `docs/raw/worklog/.rsc-memory/` | Los hooks, solos | No, nunca sale de tu máquina |
| **3. La sincronización del conocimiento** | Lo mismo que la capa 1, pero llevado a tu equipo sin pensar en git | Rama `rsc/knowledge` del remoto | Los hooks, solos | Sí, a través de `origin` |

Hay una cuarta memoria que **no** es del harness: la propia de Claude Code, en `~/.claude/projects/`. Está fuera del proyecto, no la ves en el repo y ningún compañero que clone la recibe. El harness la reserva para *cómo te gusta trabajar a ti* (tus preferencias personales), nunca para hechos del proyecto.

---

## 1. La wiki del proyecto (`docs/wiki/`)

Es la memoria de verdad. Si algo debe saberlo la próxima sesión, otro agente u otra persona, tiene que estar aquí.

**Cómo usarla:** dilo en lenguaje normal.

> «Recuerda que toda la facturación va por una sola sociedad, Nadsan 2006 S.L.»

El agente lo escribe en la página de ese tema dentro de `docs/wiki/` (si no existe, la crea y la enlaza desde `docs/wiki/index.md`) y **te dice la ruta** donde lo ha guardado. Si no te dice una ruta dentro de `docs/wiki/`, no lo ha guardado en el proyecto: pídeselo.

Lo que no va a la wiki:

- Tus preferencias personales («háblame de tú», «no me expliques git»): van a la memoria de Claude Code.
- Tu perfil (`docs/wiki/harness/user-profile.md`): está en la wiki, pero es tuyo y la sincronización nunca lo envía.

---

## 2. El diario de sesión (automático y local)

No tienes que hacer nada. Los hooks del harness apuntan, en cada evento de la sesión (arranque, mensaje, edición, fin de turno, compactación, cierre):

- la rama y el worktree;
- qué ficheros ha tocado **esta** sesión (lo que ya estaba sucio al empezar y no ha cambiado no cuenta);
- sus commits propios (los que trae un `git merge` de compañeros, no);
- cuántas ediciones lleva, para avisarte de que compactes al cruzar el umbral (20 por defecto).

Al abrir una sesión nueva en la misma rama, el agente recibe un resumen corto (4 KB como mucho) de dónde lo dejó la anterior. Si otra sesión está trabajando a la vez en la misma carpeta, también te lo dice.

**Lo que nunca guarda:** tus mensajes, las respuestas, la salida de las herramientas, el contenido de los ficheros ni nada con forma de secreto. Se borra a los 30 días y nunca hace peticiones de red.

### Lecciones aprobadas

Puedes fijar una lección para que se inyecte en cada sesión de este proyecto. Solo se guarda si la apruebas expresamente:

```bash
npx @damiangilgonzalez/harness@latest memory learn \
  --text "Los tests de integración necesitan Docker arrancado" \
  --evidence "falló el CI del 28/10 por esto" --confidence 0.9 --approve
```

Para lecciones que deben cambiar el comportamiento del agente de forma duradera (una regla, una comprobación), es mejor la skill `continuous-learning`, que las lleva a `CLAUDE.md`, a una skill o a la wiki.

### Comandos

| Comando | Qué hace |
|---|---|
| `memory status` | Dice si la memoria está activa en este proyecto y en qué modo (`full`, `assisted`, `degraded`) |
| `memory resume` | Muestra lo que recibiría el agente al empezar una sesión en esta rama |
| `memory save --session handoff` | Fuerza un punto de guardado ahora mismo |
| `memory learn … --approve` | Guarda una lección aprobada |
| `memory off` / `memory on` | Apaga o enciende la memoria en todo el proyecto |

Todos se lanzan como `npx @damiangilgonzalez/harness@latest <comando>` desde la raíz del proyecto.

---

## 3. La sincronización del conocimiento (`rsc/knowledge`)

Sirve para que la capa 1 esté igual en todas las máquinas del equipo sin que nadie piense en git. Está **encendida por defecto**.

**Qué sincroniza:** `01-TOOLS/`, `docs/wiki/` y `docs/attachments/`. Nada más: ni el código, ni el resto de `docs/`, ni tu perfil, ni la plantilla `01-TOOLS/_TEMPLATE/`.

**Cómo funciona:**

1. **Al acabar cada turno del agente**, lo que haya cambiado en esas carpetas se comitea en tu rama (`📝 docs(auto): …`) y se sube en segundo plano a la rama `rsc/knowledge` del remoto, con `[skip ci]` para no lanzar despliegues.
2. **Antes de cada mensaje tuyo**, lo que tus compañeros han subido a `rsc/knowledge` baja a tu rama de trabajo (`📥 docs(auto): sync desde rsc/knowledge`) y se te dice en una línea quién cambió qué.
3. **Llega a `main` dentro de vuestras pull requests normales**: cada rama ya lleva el conocimiento, así que entra con la primera que se fusione.

**Lo que nunca hace:**

- Subir código, ni un commit que no sea suyo: tu trabajo sin subir se queda sin subir.
- Comitear en `main` si `main` está cerrada para el agente. Se considera cerrada si el proyecto tiene CI, despliegue o un equipo (dos o más autores en los últimos 50 commits). En ese caso el conocimiento sube igualmente, pero sin commit en `main`.
- Sobrescribir un fichero que estás editando. Si un compañero cambió lo mismo que tú, te lo dice y deja tu versión intacta.
- Hacer commit si tienes código del agente sin comitear: así la documentación no queda por delante del código que describe. Sube igualmente y los ficheros quedan para comitearlos junto con ese código.

**Cuándo no hace nada (y es normal):** sin remoto `origin`, sin `.rsc.json` en la raíz del repo, sin ninguna de las carpetas de conocimiento, con un rebase o un merge a medias, o en agentes en la nube.

La primera vez que se activa, te lo anuncia en un mensaje. Lo que baja llega con un mensaje de retraso, salvo que la última consulta al remoto tenga más de 3 minutos: entonces consulta antes de responder (3 segundos como mucho).

### Comandos

| Comando | Qué hace |
|---|---|
| `knowledge-sync status` | Si está activa (y si no, por qué), la rama, lo pendiente de subir y la última consulta al remoto |
| `knowledge-sync off` | La apaga **para todo el proyecto**: se apunta en `.rsc.json`; comitéalo para que el equipo tenga la misma decisión |
| `knowledge-sync on` | La vuelve a encender |

`memory off` no apaga la sincronización, ni al revés: son dos decisiones distintas. La memoria promete no hacer peticiones de red; la sincronización existe precisamente para hablar con `origin`.

---

## Cómo comprobar que todo funciona

En la raíz de un proyecto con el harness instalado:

```bash
npx @damiangilgonzalez/harness@latest doctor                  # salud general, hooks y memoria
npx @damiangilgonzalez/harness@latest memory status           # ¿diario activo?
npx @damiangilgonzalez/harness@latest knowledge-sync status   # ¿sincronización activa? y si no, el motivo
```

Si `knowledge-sync status` da `"active": false`, el campo `reason` te dice por qué: `no-origin` (no hay remoto), `no-knowledge-folders` (no existe `docs/wiki/` ni `01-TOOLS/`), `opted-out` (alguien la apagó), `harness-not-at-repo-root` o `no-harness`.

## Llevarlo a un proyecto que ya tenía el harness

Basta con actualizar desde la raíz del proyecto:

```bash
npx @damiangilgonzalez/harness@latest sync
```

Eso copia `knowledge-sync.mjs` y `trunk-policy.mjs` en `.rsc/` y añade sus dos hooks (mensaje y fin de turno) al fichero de configuración local del asistente (`.claude/settings.local.json` en Claude Code), junto a los de la memoria.
