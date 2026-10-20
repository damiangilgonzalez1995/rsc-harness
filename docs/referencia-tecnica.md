# Referencia técnica

Todo lo que el README resume en una imagen, aquí con detalle: la CLI completa, el onboarding por
dentro, cómo recomienda, los asistentes soportados, el formato de una skill y cómo contribuir.

[← Volver al README](../README.md) · [Catálogo de skills](catalogo.md)

---

## Instalar

```bash
npx @damiangilgonzalez/harness@latest onboard
```

¿Prefieres el comando corto `rsc`? Instálalo una vez, de forma global:

```bash
npm install -g @damiangilgonzalez/harness   # después, solo: rsc
```

¿Trabajas en el propio catálogo? Clona y enlaza:

```bash
git clone https://github.com/damiangilgonzalez1995/rsc-harness.git ~/rsc-skills
cd ~/rsc-skills && npm install && npm link
```

> **Ejecútalo dentro del proyecto que vas a equipar, no dentro de este repo.** El `package.json`
> del catálogo se llama `@damiangilgonzalez/harness`, así que `npx @damiangilgonzalez/harness`
> *desde dentro de un clon de `rsc-harness`* resuelve al bin local (sin enlazar) y muere con
> `sh: rsc: command not found`. Si trabajas en el catálogo, usa `node scripts/rsc.js …`, el
> `npm link` de arriba, o fija la versión publicada con `npx @damiangilgonzalez/harness@latest …`.

Todo se queda **en el proyecto**, y los ficheros reales de cada skill se escriben **una sola vez**
en `.rsc/skills/<id>/`. Cada asistente que eliges recibe un enlace simbólico a esa base compartida:
ninguna copia se duplica entre IDEs. (Si el sistema de ficheros no admite enlaces, cae a una copia
real automáticamente.) En los asistentes con agentes en fichero se instalan también los agentes
base; los especialistas de stack siguen siendo selectivos. Los asistentes con comandos nativos
reciben solo las entradas cuya skill, agente o memoria local existe de verdad.

## El onboarding por dentro

```
$ rsc onboard
 ██████╗ ███████╗ ██████╗     ← logotipo con degradado animado
 ██╔══██╗██╔════╝██╔════╝
 ██████╔╝███████╗██║
  294 skills · one CLI · zero bloat

How technical should the conversation be?
How much accompaniment do you want?
What are you building or running?
What do you want this project to achieve?

RSC_ONBOARDING_PLAN
Plan id: <sha256>
Selected: …
Deferred: …
Accept this exact harness plan?
```

La primera pasada pregunta **qué nivel técnico** quieres en la conversación, el nivel de
acompañamiento, para qué es el proyecto, su objetivo y los asistentes. Después enseña el plan
completo. Una web pequeña puede aplazar SDD, agentes y guardias de código; un harness de
operaciones no los recibe solo por vivir en un repositorio. Cada componente aplazado guarda la
evidencia que haría que rsc lo recomendara más adelante. `rsc reassess` informa de esa evidencia,
pero no puede instalar nada sin un plan aceptado de nuevo.

Los adaptadores de terminal y de chat producen las mismas respuestas normalizadas y el mismo id de
plan. Si la evidencia del proyecto cambia entre la vista previa y la aceptación, rsc devuelve
`RSC_PLAN_CHANGED` y no escribe nada. Tras aplicar un plan aceptado verifica el recibo y el estado
gestionado antes de imprimir `RSC_ONBOARDING_READY`. Ese veredicto exige además que exista el suelo
del harness: `01-TOOLS/_TEMPLATE/` y `docs/wiki/harness/`. Si falta, la instalación se aplica pero
imprime `RSC_ONBOARDING_INCOMPLETE` con cada ruta que falta y la acción que la crea.

Si el proyecto ya tiene una skill propia con el nombre de una del catálogo, el plan la lista en
**Your own skills this plan replaces**: avisa antes de aceptar; renombrar tu carpeta y regenerar el
plan conserva la tuya.

### Para un agente sin modo interactivo

```bash
npx @damiangilgonzalez/harness@latest onboard --technical-level mixed --accompaniment L1 \
  --project-kind software --goal "small compound-interest website" \
  --software-scope small --target codex
# Cuando la persona acepte el plan impreso:
npx @damiangilgonzalez/harness@latest onboard --technical-level mixed --accompaniment L1 \
  --project-kind software --goal "small compound-interest website" \
  --software-scope small --target codex --accept-plan PRINTED_SHA256_ID
```

- **Elegir asistentes sin preguntas:** añade `--target claude` (separados por comas para varios).
- **¿Dos asistentes ya instalados?** rsc pregunta en vez de adivinar. `--target` lo zanja.
- **Ya instalado, solo refrescar skills y hooks:** `rsc sync`.
- **Añadir una skill por id:** `rsc add <id>` · **explorar:** `rsc consult "<lo que quieres>"` o `rsc list`.

## La CLI completa

Los proyectos nuevos entran por `rsc onboard`. Las formas directas `add` e `install --profile` son
controles de mantenimiento para proyectos que ya tienen un `.rsc.json`; no se saltan el onboarding
en una carpeta nueva.

```bash
rsc onboard                         # onboarding en lenguaje llano (recomendado)
rsc reassess                        # revisa los disparadores de lo aplazado; nunca instala solo
rsc add fastapi postgresdb           # instala skills concretas, por nombre
rsc add youtube-api remotion-video   # …crecer un canal, editar con Remotion
rsc add fastapi --target claude,codex   # en varios asistentes a la vez
rsc install --profile minimal        # la base: orient + suggest + bro + unslop + show-me + eli5 + harness + init + teach
rsc install --profile core           # la base + el flujo SDD completo
rsc install --profile full           # todo (las 294 skills)
rsc install --profile full --without go
rsc consult "I want to launch a SaaS"  # solo recomienda, no instala
rsc registry refresh                 # escribe .rsc/skill-registry.{json,md}
rsc list                             # skills, agentes y comandos instalados
rsc capabilities                    # superficies instaladas/disponibles + modo de memoria
rsc doctor                           # salud, respaldo, hooks y memoria local; sale con 1 si algo falla
rsc repair                           # devuelve el harness a lo declarado (--dry-run para ver sin escribir)
rsc memory status                    # full / assisted / unsupported / degraded
rsc memory save --session handoff    # fuerza un checkpoint local determinista
rsc memory resume                    # imprime la continuación de esta rama/worktree
rsc memory learn --text "…" --evidence "…" --confidence 0.8 --approve
rsc memory off                       # apaga hooks, comandos e inyección en todo el proyecto
rsc sync --target claude,codex       # refresca skills/hooks gestionados desde la versión actual
rsc backups                          # lista las instantáneas locales del proyecto
rsc restore latest --dry-run         # previsualiza restaurar la más reciente
rsc restore <snapshot-id>            # restaura una instantánea
rsc upgrade --dry-run                # muestra los comandos npm + sync
rsc uninstall postgresdb --dry-run   # previsualiza una desinstalación
rsc worktrees new login              # fetch y .claude/worktrees/login en la rama login desde la rama por defecto de origin
rsc worktrees new login --branch feat/login
rsc worktrees                        # lista los worktrees cuyo trabajo ya está fusionado
rsc worktrees reap --merged          # lista todos los worktrees fusionados y limpios…
rsc worktrees reap --merged --confirm   # …y los borra de una vez (branch -d, nunca -D)
```

### Worktrees

`rsc worktrees new <nombre>` ejecuta `git fetch origin` y corta la rama nueva desde
`origin/<por defecto>` (leída de `origin/HEAD`, o `main`/`master` si no hay), nunca desde un `main`
local que puede ir muy atrás. Un worktree nace solo con lo que git versiona: los `.env` y las
dependencias **no** se copian. Para preparar cada worktree nuevo, versiona un hook en
`scripts/dev/preparar-worktree.sh` (se ejecuta con `bash`) o `scripts/dev/preparar-worktree.mjs`
(con `node`); corre con el worktree nuevo como directorio de trabajo y `RSC_MAIN_WORKTREE` apuntando
al checkout principal, por ejemplo `cp "$RSC_MAIN_WORKTREE/.env" . && npm ci`. Un fichero idéntico
byte a byte al del checkout principal no bloquea la limpieza; uno editado dentro del worktree sí.
`reap --merged` nunca se lleva un worktree con cambios, uno con un fichero que no está en ningún
commit, ni uno cuya rama no se ha fusionado.

### Actualizar a mano

```bash
npm install -g @damiangilgonzalez/harness@latest   # instalación global: trae el catálogo nuevo
rsc sync                                           # refresca skills + hooks (detecta tu asistente)
rsc upgrade --dry-run                              # enseña los comandos sin escribir nada
```

Con `npx` no hay nada que actualizar: `npx @damiangilgonzalez/harness@latest` siempre trae el
último catálogo publicado. Cada `sync` hace antes una instantánea del proyecto, así que una
actualización mala siempre se puede deshacer con `rsc backups` y `rsc restore`.

## Memoria de sesión

En los asistentes locales soportados, rsc guarda un checkpoint del estado observable del
repositorio en momentos seguros: rama, worktree, HEAD, rutas cambiadas, commits y estado del
registro SDD. Cuando se abre una sesión nueva en el mismo checkout, ese estado se inyecta antes de
la primera acción del agente. Una edición terminada se conserva aunque el cliente anterior se
cerrara antes de su evento normal de fin de sesión.

- **Completa:** Claude Code, Codex, Gemini CLI y OpenCode. Codex pide revisar y confiar en el hook
  del proyecto una vez con `/hooks`; hasta entonces `doctor` avisa de que falta esa confianza.
- **Asistida:** Cursor de escritorio. Su hook de arranque no espera, así que rsc instala además una
  regla local siempre activa que hace la lectura antes de actuar.
- **Nunca en la nube:** Cursor Cloud, Codex Cloud, agentes remotos, almacenamiento en la nube y
  sincronización no están soportados a propósito. La memoria no hace ninguna petición de red.

El diario nunca guarda prompts, respuestas, salidas de herramientas, contenido de ficheros ni
secretos. Vive en una ruta local excluida de git, se queda 30 días e inyecta como mucho 4.096
bytes. `rsc memory off` apaga toda la memoria del proyecto; `rsc memory on` la vuelve a encender.

## Cómo recomienda

Dos caras, un catálogo (`manifest.json`):

- **En la terminal:** `rsc` y `rsc consult` puntúan el catálogo contra tus palabras (TF-IDF
  multilingüe combinado con pesos exactos de tags e ids y sinónimos de intención), lo mezclan con lo
  que detectan en tu repo y lo amplían con el `recommends` de cada skill.
- **En el chat:** `rsc-suggest` es una skill mínima siempre activa. Cuando una tarea se beneficiaría
  de una skill que no tienes, la nombra y, con una confirmación de una palabra, ejecuta
  `rsc add <id>` por ti. Es parte del suelo: se instala con todos los perfiles.

La detección del repo asocia señales reales a skills: `package.json` + `next` → `nextjs`;
`go.mod` → `go`; `pyproject.toml` → `fastapi`; `*.sql`/`prisma/` → `postgresdb`;
`Dockerfile`/`.github/` → `docker`/`github-actions`; etcétera. Un repo vacío simplemente pregunta
en lenguaje llano.

## Asistentes soportados

`skills/<name>/` es la fuente del catálogo. Al instalar, los ficheros reales caen **una vez** en
`.rsc/skills/<id>/`; cada asistente elegido recibe un enlace (o un fichero convertido) a esa base.
El asistente pregunta cuáles; `--target a,b` lo hace sin preguntas.

| Target | Destino de la skill (→ `.rsc/skills/<id>/`) | Detector siempre activo |
| --- | --- | --- |
| `claude` | `.claude/skills/<id>/` → enlace (copia en Windows) | hook SessionStart en `.claude/settings.json` |
| `codex` | `.codex/rsc/<id>/` → enlace | bloque en `AGENTS.md` |
| `copilot` | `.github/rsc/<id>/` → enlace | bloque en `.github/copilot-instructions.md` |
| `cursor` | `.cursor/rules/<id>.mdc` (convertido) | regla always-apply |
| `gemini` | `.gemini/rsc/<id>/` → enlace | bloque en `GEMINI.md` |
| `windsurf` | `.windsurf/rsc/<id>/` → enlace | regla en `.windsurf/rules/rsc-suggest.md` |
| `cline` | `.clinerules/rsc/<id>/` → enlace | regla en `.clinerules/rsc-suggest.md` |
| `antigravity` | `.antigravity/rsc/<id>/` → enlace | bloque en `.antigravity/AGENTS.md` |
| `zed` | `.zed/rsc/<id>/` → enlace | bloque en `AGENTS.md` |
| `continue` | `.continue/rsc/<id>/` → enlace | regla en `.continue/rules/rsc-suggest.md` |
| `roo` | `.roo/rsc/<id>/` → enlace | regla en `.roo/rules/rsc-suggest.md` |
| `amp` | `.amp/rsc/<id>/` → enlace | bloque en `AGENTS.md` |
| `opencode` | `.opencode/rsc/<id>/` → enlace | bloque en `AGENTS.md` |
| `jules` | `.jules/rsc/<id>/` → enlace | bloque en `AGENTS.md` |
| `junie` | `.junie/rsc/<id>/` → enlace | bloque en `.junie/guidelines.md` |
| `kiro` | `.kiro/rsc/<id>/` → enlace | documento en `.kiro/steering/rsc-suggest.md` |
| `aider` | `.aider/rsc/<id>/` → enlace | bloque en `CONVENTIONS.md` |

> `codex`, `zed`, `amp`, `opencode` y `jules` comparten el mismo `AGENTS.md` raíz; el bloque es
> idempotente, así que elegir varios lo escribe una sola vez.

Las superficies más ricas son, a propósito, más estrechas que el soporte de skills:

| Asistentes | Agentes de stack | Comandos nativos | Continuación de sesión local |
| --- | --- | --- | --- |
| Claude Code | sí | entradas de agente y memoria; las skills ya se invocan solas | completa |
| Codex | sí | sin superficie de comandos de proyecto | completa tras confiar en `/hooks` |
| Cursor de escritorio | sí | sí | asistida |
| Gemini CLI, OpenCode | sí | sí | completa |
| GitHub Copilot | sí | sí | no soportada |
| Junie, Kiro | sí | no soportado | no soportada |
| Windsurf, Cline, Roo | no soportado | sí | no soportada |
| Antigravity, Zed, Continue, Amp, Jules, Aider | no soportado | no soportado | no soportada |

`manifest.json` es el inventario público generado: 34 agentes (5 base + 29 especialistas
selectivos) y 43 entradas de comando (10 fijas + 33 alias de stack). "No soportado" significa que
rsc no escribe nada para esa superficie; no imita una función del proveedor con un fichero sin
verificar.

## Formato de una skill

Cada skill es una carpeta en `skills/<name>/` cuyo frontmatter de `SKILL.md` controla tanto cuándo
se activa como lo que recomienda el instalador:

```yaml
---
name: my-skill
description: Use when [specific triggers]… Triggers: 'phrase', 'frase'. NOT x (that is sibling).
tags: [keyword, keyword]        # sobre lo que busca el consult
recommends: [sibling-skill]     # lo que el sistema ofrece instalar después
profiles: [core, full]          # opcional: pertenencia a perfiles
origin: risco
---
```

La especificación completa de las Agent Skills está en
[agentskills.io/specification](https://agentskills.io/specification).

## Estructura del repo y cómo contribuir

`skills/<name>/` es la **única fuente de verdad**: cada skill se escribe ahí, una vez. Después de
editar cualquiera:

```bash
npm run manifest      # regenera manifest.json desde skills/*/SKILL.md
npm run validate      # valida el frontmatter con ajv y la integridad de recommends
npm test              # tests unitarios y de integración
bash scripts/eval-lint.sh   # valida cada skills/*/evals/cases.yaml
```

`manifest.json` se genera, nunca se edita a mano; el CI ejecuta `npm run manifest:check` y falla si
está desactualizado o si el número de skills no cuadra. Añadir una skill es: crear
`skills/<id>/SKILL.md` con `tags` y `recommends`, ejecutar `npm run manifest` y listo. La rúbrica
con la que se mide es `scripts/skill-rubric.md`.

Los bugs, por las [issues de GitHub](https://github.com/damiangilgonzalez1995/rsc-harness/issues);
las PRs que arreglan patrones de detección, endpoints de proveedores o erratas son bienvenidas.

## Skills de terceros

Casi todo el catálogo se escribe aquí. Estas no, y conservan el crédito de su autor:

| Skills | Origen | Licencia |
| --- | --- | --- |
| `design-eng` · `animate` · `animate-expo` · `review-animations` · `improve-animations` · `find-animation-opportunities` · `animation-vocabulary` · `apple-design` · `prototype` · `pick-ui-library` · `write-swift` · `ask-sonner` | [emilkowalski/skills](https://github.com/emilkowalski/skills), de Emil Kowalski, commit `d23d7f8` | MIT |
| parte del corpus de señales de IA en `design` | [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) | MIT |

Adaptadas, no copiadas: cada una lleva frontmatter de rsc, evals de enrutado, traspasos a sus
hermanas y, donde declara una regla obligatoria, un comprobador con su test. El nivel de oficio es
del autor original. Si quieres la fuente del material de movimiento y no esta adaptación, ve a
[animations.dev](https://animations.dev/).
