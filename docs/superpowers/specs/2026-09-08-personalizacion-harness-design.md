# Personalización del harness: de rsc a `@damiangil/harness`

Fecha: 2026-09-08
Estado: aprobado, pendiente de plan de implementación

## Qué se persigue

Convertir el fork de `rsc-harness` en el harness personal de Damián: que instale sus
skills en vez de la cadena SDD de Eric, que guarde su documentación en `docs/`, y que
el mensaje que Claude lee en cada turno enrute a su forma de trabajar.

La restricción que manda sobre todo lo demás: **ninguna skill duplicada**. Si algo de
rsc hace lo mismo que algo de Damián, gana lo de Damián y lo de rsc se borra.

## 1. Catálogo de skills

### Se borran del repo (18)

Cadena SDD completa: `sdd`, `sdd-init`, `specify`, `clarify`, `plan`, `tasks`,
`analyze`, `implement`, `verify`, `review`, `ship`, `constitution`,
`idea-refinement`, `decision-challenge`.

Duplicados fuera de la cadena: `code-review` (mismo nombre que la suya), `debug`
(lo cubre `superpowers:systematic-debugging`), `parallel`
(`superpowers:dispatching-parallel-agents`), `worktrees`
(`superpowers:using-git-worktrees`).

`implement` y `code-review` chocaban además por nombre exacto, no solo por función.

### Sobreviven de rsc (14)

`orient`, `suggest`, `harness`, `bro`, `init`, `unslop`, `fable-operator`,
`simplify-code`, `deprecation`, `automation-strategy`,
`source-grounded-development`, `ui-engineering`, `eli5`, `show-me`.

`ui-engineering` se queda porque cubre cómo se *construye* una interfaz (estado,
componentes, formularios), hueco que las skills de diseño de Damián no cubren.

Las ~240 skills de stack del catálogo (react, aws, postgres…) no se tocan.

### Entran al catálogo (36 + 1)

Las 36 de https://github.com/damiangilgonzalez1995/claude-skills, más `write-adr`
(la actual `escribir-adr`, hoy solo local en `~/.claude/skills/`).

Todas **traducidas al inglés**, para que el catálogo quede en un solo idioma. La
traducción incluye cuerpo y descripción; hay que revisarla skill a skill para no
perder los matices de redacción del original.

Al terminar, se borra `~/.claude/skills/escribir-adr/`: su sitio pasa a ser el repo.

### Superpowers

No se copia. El instalador lo **declara como plugin** en la configuración del
proyecto, de modo que Claude Code lo descargue y lo mantenga al día. Copiarlo
congelaría la versión 6.3.0 y obligaría a re-copiar cada actualización.

## 2. Onboarding: tres paquetes

| Paquete | Contenido |
|---|---|
| **Básico** (proyecto pequeño) | `orient`, `suggest`, `harness`, `bro`, `init`, `teach` |
| **Serio** (software con entidad) | Básico + flujo de trabajo de Damián + las 14 de rsc que sobreviven salvo `ui-engineering` + plugin superpowers declarado |
| **Con interfaz** | Serio + las 16 skills de diseño + `ui-engineering` |

El flujo de trabajo de Damián son: `grill-me`, `grill-with-docs`, `grilling`,
`wayfinder`, `to-spec`, `to-tickets`, `to-questionnaire`, `implement`,
`revision-de-cambios`, `code-review`, `research`, `prototype`, `domain-modeling`,
`handoff`, `write-adr`, `wait-what`, `writing-for-agents`, `claude-project-setup`,
`muscle-memory`.

Las 16 de diseño: `animar`, `diseno-apple`, `diseno-landing`, `ingeniero-diseno-web`,
`leyes-de-percepcion`, `leyes-de-retencion`, `mejor-accesibilidad`, `mejor-colores`,
`mejor-layout`, `mejor-redaccion`, `mejor-tipografia`, `mejor-ui`,
`sitios-calidad-premio`, `tastemaker`, `video-a-superprompt`, `vocabulario-animacion`.

El tercer paquete es nuevo: hoy `scripts/lib/onboarding.js` solo distingue
`minimal` y `core` mediante `needsSdd`. Hay que añadir una tercera señal, derivada
de la evidencia de stack ya detectada (presencia de framework de frontend) o de la
respuesta del usuario en el onboarding.

## 3. El gate

`SDD_GATE_TEXT` (en `targets/hook-once.mjs`) se reescribe. Contenido, en inglés en
el repo:

1. **¿Está claro el qué y el cómo?** Si no: idea verde o dudas de fondo →
   `grill-with-docs` (interroga y deja ADRs y glosario en `docs/`). Trabajo enorme
   sin punto de entrada → `wayfinder` (mapa de decisiones antes de tocar código).
2. **Con el qué claro, la spec**: `to-spec`. Toda decisión difícil de revertir se
   registra con `write-adr`.
3. **Ejecución**, eligiendo según tamaño y preguntando si hay duda: lo normal con
   `superpowers:writing-plans` → `superpowers:executing-plans`; lo enorme, o lo que
   venga de `wayfinder`, con `to-tickets` → `implement`, ticket a ticket.
4. **Siempre**: `superpowers:test-driven-development` y
   `superpowers:verification-before-completion`. Los bugs entran por
   `superpowers:systematic-debugging`.
5. **Excepción**: cambio de una línea, typo o bug obvio se hace directo, diciendo
   que se salta la cadena.

El gate elegido es deliberadamente enrutador y no prescriptivo en el paso 3: el
agente decide entre las dos vías de ejecución según el tamaño del trabajo.

Se reescribe también la sección 1 de `skills/suggest/SKILL.md`, que es el cuerpo
largo del mismo mensaje, y `targets/…/suggest-always-on.md`, que es su versión de
tres líneas.

`scripts/doctor.js` importa `SDD_GATE_TEXT` para medir su tamaño; el gate nuevo es
más largo que el actual (~500 bytes) y hay que comprobar que no dispare avisos.

## 4. Rutas

`docs/` pasa a `docs/` en **todo** el repo, no solo en lo que se instala: los
tests y `doctor` comprueban la ruta, y una mezcla los rompería. Son ~1.050
menciones repartidas por skills (221 ficheros), scripts (20), targets (8), tests
(26) y web (3).

Estructura resultante:

```
docs/
  wiki/harness/     perfil, decisiones, plan de instalación
  raw/worklog/      diario automático de sesiones
  inbox/            bandeja
  adr/              ADRs de write-adr
  grillme/          lo que deja grill-with-docs
  superpowers/      specs/ y plans/
```

El diario automático y la wiki siguen funcionando igual: solo cambian de sitio. No
se fusionan con los ADRs de `grill-with-docs`, que viven en su propia carpeta bajo
el mismo techo.

La línea `docs/` del `.gitignore` se elimina (hecho ya, al crear esta spec), junto
con el bloque de comentarios sobre la migración a la extinta ruta `02-DOCS/`.

## 5. Nombre del paquete

`@ericrisco/rsc` → `@damiangil/harness`, en `package.json` y en todos los textos de
instalación repartidos por hooks, skills y README (`npx @damiangil/harness@latest`).

## 6. Fallo de Windows

`targets/gitmoji-guard.mjs:224` y `targets/session-memory-adapter.mjs:128` usan:

```js
if (import.meta.url === `file://${process.argv[1]}`)
```

En Windows nunca coincide, así que la memoria automática y el guardián de commits
no se ejecutan nunca. Corrección verificada en el proyecto `aurora`:

```js
import { pathToFileURL } from 'node:url';
if (import.meta.url === pathToFileURL(process.argv[1]).href)
```

Detalle menor asociado (creído, luego descartado): se pensó que
`session-memory-core.mjs` dejaba el prefijo `"M "` pegado a los nombres de
fichero al parsear la salida de `git status`. Al implementarlo se comprobó que
`parseStatus` (misma fichero, usada por `snapshot()`) ya parseaba el formato
`--porcelain=v1 -z`, localizaba el separador en vez de cortar bytes fijos y
resolvía renombrados correctamente. No había nada que arreglar.

## Criterio de acabado

- `npm run validate` y `npm run drift:check` pasan.
- `npm test` no supera el baseline de fallos de entorno Windows (symlinks,
  Python, hooks de git) ni introduce ninguno nuevo: se compara el conjunto de
  nombres de tests que fallan antes y después, no el recuento total.
- Ninguna mención viva de `02-DOCS` en el repo, salvo `site/clase/` (material
  didáctico del usuario, sin versionar), que se deja intacto a propósito.
- Ninguna mención de `@ericrisco/rsc`.
- Instalación de prueba en un proyecto limpio: recibe el paquete correcto de los
  tres, con superpowers declarado y sin skills duplicadas.

## Fuera de alcance, para después

- Vaciar `~/.claude/skills` y dejar el harness como fuente única. Mientras el fork
  no esté probado, conviven las dos copias.
- Convertir el reparto en tres paquetes en un ajuste configurable.
