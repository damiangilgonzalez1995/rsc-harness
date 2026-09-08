# Personalización del harness — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir el fork de `rsc-harness` en `@damiangil/harness`: catálogo sin skills duplicadas, documentación en `docs/`, onboarding en tres paquetes y gate que enruta al flujo de Damián.

**Architecture:** Se trabaja de fuera hacia dentro. Primero se deja el repo verificable en Windows (finales de línea), luego los cambios mecánicos y aislados (fallo de Windows, rutas, nombre), después el borrado de skills con sus tests huérfanos, luego la importación del catálogo propio, y por último las dos piezas de comportamiento: el reparto del onboarding y el texto del gate. Cada tarea deja el repo en verde antes de la siguiente.

**Tech Stack:** Node 22 ESM, `node --test` (TAP), Ajv para validar frontmatter, sin framework de build.

**Spec:** [`docs/superpowers/specs/2026-09-08-personalizacion-harness-design.md`](../specs/2026-09-08-personalizacion-harness-design.md)

## Global Constraints

- Rama de trabajo: `personalizacion-harness`. Ya creada, ya contiene la spec.
- Node ESM en todo el repo: `import`, nunca `require`, en ficheros `.js` y `.mjs`.
- Todo fichero del repo se escribe con finales de línea LF.
- El catálogo entero está en inglés: `name`, `description`, `tags` y cuerpo de cada `SKILL.md`.
- El frontmatter de cada skill obedece `schema/frontmatter.schema.json`: `name` (`^[a-z0-9-]+$`), `description` (10–1024 caracteres), `tags` (mínimo uno). `profiles` solo admite los valores del enum; la Tarea 7 lo amplía.
- `manifest.json` es generado: nunca se edita a mano, se regenera con `npm run manifest`.
- Commits con gitmoji al principio del asunto, sin líneas de atribución.
- Baseline verificado el 2026-09-08 tras `npm install` y la Tarea 1: `npm test` en verde, `npm run validate` sin salida, `npm run drift:check` sin fallos. Cualquier fallo posterior lo ha introducido la tarea en curso.

---

### Task 1: Normalizar los finales de línea

El repo se clonó con `core.autocrlf=true` y sin `.gitattributes`, así que el checkout tiene CRLF. `scripts/lib/frontmatter.js:2` exige `/^---\n/`, de modo que ninguna skill parsea: 90 tests fallan y `drift:check` reporta 831 enlaces rotos. Sin esta tarea no hay forma de saber si el resto del plan rompe algo.

**Files:**
- Create: `.gitattributes`
- Test: `tests/frontmatter.test.js` (ya existe, sirve de comprobante)

**Interfaces:**
- Consumes: nada.
- Produces: un árbol de trabajo en LF. Todas las tareas siguientes dependen de ello.

- [ ] **Step 1: Comprobar el fallo de partida**

```bash
node --test tests/manifest.test.js 2>&1 | grep -E "^# (pass|fail)"
```

Esperado: `# fail 2` o más, con el error `no frontmatter block`.

- [ ] **Step 2: Crear `.gitattributes`**

```gitattributes
# El repo se escribe y se lee en LF en todas las plataformas: los parsers de
# frontmatter y de enlaces exigen \n, y un checkout con CRLF los rompe entero.
* text=auto eol=lf
*.png binary
*.jpg binary
*.gif binary
*.ico binary
*.woff binary
*.woff2 binary
```

- [ ] **Step 3: Renormalizar el árbol**

```bash
git add --renormalize .
git checkout -- .
```

- [ ] **Step 4: Comprobar que ya no hay CRLF**

```bash
node -e "const b=require('fs').readFileSync('skills/sdd/SKILL.md','utf8');console.log('CRLF:',(b.match(/\r\n/g)||[]).length)"
```

Esperado: `CRLF: 0`

- [ ] **Step 5: Verificar el baseline completo**

```bash
npm test 2>&1 | grep -E "^# (tests|pass|fail)"
npm run validate
npm run drift:check
```

Esperado: `# fail 0`, `validate` sin salida de error, `drift:check` sin la línea `FAIL:`. Si algún test sigue fallando, anotarlo aquí como fallo preexistente antes de continuar — pasa a ser el baseline real y las tareas siguientes se juzgan contra él.

- [ ] **Step 6: Commit**

```bash
git add .gitattributes
git add -u
git commit -m "🔧 Fijar LF en todo el repo con .gitattributes"
```

---

### Task 2: Arreglar el fallo de Windows en los hooks

Dos hooks comparan `import.meta.url` con una URL construida a mano. En Windows la comparación nunca es cierta, así que la memoria automática de sesión y el guardián de gitmoji no se ejecutan jamás. La corrección está verificada en el proyecto `aurora`.

**Files:**
- Modify: `targets/session-memory-adapter.mjs:128`
- Modify: `targets/gitmoji-guard.mjs:224`
- Test: `tests/session-memory.test.js`, `tests/gitmoji-guard.test.js`

**Interfaces:**
- Consumes: nada.
- Produces: `isMain()` en ninguna parte — la corrección es inline en cada fichero.

- [ ] **Step 1: Escribir el test que falla**

En `tests/session-memory.test.js`, añadir:

```js
test('session-memory-adapter: el guardia de entrypoint usa pathToFileURL', () => {
  const src = readFileSync(join(ROOT, 'targets/session-memory-adapter.mjs'), 'utf8');
  assert.match(src, /pathToFileURL\(process\.argv\[1\]\)\.href/,
    'compara URLs con pathToFileURL; `file://${process.argv[1]}` nunca coincide en Windows');
  assert.doesNotMatch(src, /file:\/\/\$\{process\.argv\[1\]\}/);
});
```

Si el fichero de test no importa ya `readFileSync`, `join` y `ROOT`, copiar el patrón de cabecera de `tests/always-on-body.test.js:1-12`.

- [ ] **Step 2: Ejecutar el test y verlo fallar**

```bash
node --test tests/session-memory.test.js
```

Esperado: FAIL, `compara URLs con pathToFileURL`.

- [ ] **Step 3: Corregir `targets/session-memory-adapter.mjs`**

Añadir a los imports del principio del fichero:

```js
import { pathToFileURL } from 'node:url';
```

Y sustituir la línea 128:

```js
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
```

- [ ] **Step 4: Ejecutar el test y verlo pasar**

```bash
node --test tests/session-memory.test.js
```

Esperado: PASS.

- [ ] **Step 5: Repetir para `targets/gitmoji-guard.mjs`**

Añadir el mismo test en `tests/gitmoji-guard.test.js` apuntando a `targets/gitmoji-guard.mjs`, verlo fallar, aplicar el mismo import y la misma sustitución en la línea 224, verlo pasar.

- [ ] **Step 6: Comprobar la premisa del prefijo `"M "` — resultó falsa**

Se creía que `session-memory-core.mjs` dejaba el prefijo de estado de `git
status` (p. ej. `"M "`) pegado a los nombres de fichero. Al comprobarlo, la
función real que parsea esa salida, `parseStatus` en
`targets/session-memory-core.mjs` (usada por `snapshot()`), ya opera sobre
`--porcelain=v1 -z`, localiza el separador en vez de cortar bytes fijos y
resuelve renombrados correctamente. No hay fallo que arreglar aquí: no se
escribe test ni se extrae ninguna función nueva.

- [ ] **Step 7: Commit**

```bash
git add targets/session-memory-adapter.mjs targets/gitmoji-guard.mjs targets/session-memory-core.mjs tests/session-memory.test.js tests/gitmoji-guard.test.js
git commit -m "🐛 Arreglar la deteccion de entrypoint en Windows"
```

---

### Task 3: Renombrar `02-DOCS/` a `docs/`

Unas 1.050 menciones en 278 ficheros. Se hace de una pasada porque los tests y `doctor` comprueban la ruta y una mezcla los rompería.

**Files:**
- Modify: todo fichero de texto del repo que contenga `02-DOCS`
- Test: los 26 ficheros de `tests/` que la mencionan, `tests/onboarding-docs.test.js` entre ellos

**Interfaces:**
- Consumes: árbol en LF (Tarea 1).
- Produces: la cadena `02-DOCS` deja de existir en el repo.

- [ ] **Step 1: Contar el punto de partida**

```bash
grep -rl "02-DOCS" --exclude-dir=node_modules --exclude-dir=.git . | wc -l
grep -ro "02-DOCS" --exclude-dir=node_modules --exclude-dir=.git . | wc -l
```

Anotar ambos números.

- [ ] **Step 2: Sustituir en todo el repo**

```bash
grep -rl "02-DOCS" --exclude-dir=node_modules --exclude-dir=.git . \
  | xargs sed -i 's|02-DOCS|docs|g'
```

- [ ] **Step 3: Comprobar que no queda ninguna**

```bash
grep -rn "02-DOCS" --exclude-dir=node_modules --exclude-dir=.git . | wc -l
```

Esperado: `0`.

- [ ] **Step 4: Revisar a mano los sitios donde `docs` ya significaba otra cosa**

```bash
git diff -U0 -- .gitignore README.md site/ | grep "^[+-].*docs" | head -40
```

Buscar frases que ahora digan una tontería, del tipo `docs/ -> RSC docs/raw/migrated/docs/`. Corregirlas leyendo el contexto. El `.gitignore` ya se limpió al escribir la spec, así que no debería aparecer.

- [ ] **Step 5: Regenerar el manifest y verificar**

```bash
npm run manifest
npm test 2>&1 | grep -E "^# (pass|fail)"
npm run validate
npm run drift:check
```

Esperado: mismos números que el baseline de la Tarea 1.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "📁 Mover la documentacion del harness de 02-DOCS a docs"
```

---

### Task 4: Renombrar el paquete a `@damiangil/harness`

**Files:**
- Modify: `package.json:2`
- Modify: todo fichero que contenga `@ericrisco/rsc`
- Test: `tests/rsc-cli.test.js`, `tests/manifest-file.test.js`

**Interfaces:**
- Consumes: nada.
- Produces: la cadena `@ericrisco/rsc` deja de existir.

- [ ] **Step 1: Contar el punto de partida**

```bash
grep -rl "@ericrisco/rsc" --exclude-dir=node_modules --exclude-dir=.git . | wc -l
```

- [ ] **Step 2: Sustituir**

```bash
grep -rl "@ericrisco/rsc" --exclude-dir=node_modules --exclude-dir=.git . \
  | xargs sed -i 's|@ericrisco/rsc|@damiangil/harness|g'
```

- [ ] **Step 3: Comprobar**

```bash
grep -rn "@ericrisco/rsc" --exclude-dir=node_modules --exclude-dir=.git . | wc -l
node -e "console.log(require('./package.json').name)"
```

Esperado: `0` y `@damiangil/harness`.

- [ ] **Step 4: Regenerar el manifest y verificar**

```bash
npm run manifest
npm test 2>&1 | grep -E "^# (pass|fail)"
```

Esperado: igual que el baseline. El campo `version` de `manifest.json` sale de `package.json` y no cambia.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "🏷️ Renombrar el paquete a @damiangil/harness"
```

---

### Task 5: Borrar las skills duplicadas

Se borran 19 directorios: los 14 de la cadena SDD, los 4 duplicados sueltos y `decision-records`.

**Files:**
- Delete: `skills/{sdd,sdd-init,specify,clarify,plan,tasks,analyze,implement,verify,review,ship,constitution,idea-refinement,decision-challenge,code-review,debug,parallel,worktrees,decision-records}/`
- Delete: `scripts/spec-gate.js`, `scripts/lib/spec-gate.js`
- Delete: `tests/{spec-gate,spec-gate-subject,spec-status-drift,specify-contract,specify-doubt}.test.js`
- Modify: `package.json` (script `spec:gate`)
- Modify: `targets/commands.js:30`
- Modify: los `SKILL.md` que quedan y contengan enlaces a skills borradas

**Interfaces:**
- Consumes: nada.
- Produces: un catálogo de 253 skills. `build-manifest.js:32` ya filtra los `recommends` que apuntan a skills inexistentes, así que el manifest se limpia solo; los enlaces del cuerpo no, y por eso los detecta `drift:check`.

- [ ] **Step 1: Escribir el test que falla**

Crear `tests/no-duplicate-skills.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// Skills retiradas porque duplican el flujo propio o el plugin superpowers.
// Ver docs/superpowers/specs/2026-09-08-personalizacion-harness-design.md
const RETIRED = [
  'sdd', 'sdd-init', 'specify', 'clarify', 'plan', 'tasks', 'analyze',
  'implement', 'verify', 'review', 'ship', 'constitution', 'idea-refinement',
  'decision-challenge', 'code-review', 'debug', 'parallel', 'worktrees',
  'decision-records',
];

test('las skills retiradas no vuelven al catalogo', () => {
  const back = RETIRED.filter((id) => existsSync(join(ROOT, 'skills', id, 'SKILL.md')));
  assert.deepEqual(back, [], `siguen en el catalogo: ${back.join(', ')}`);
});
```

- [ ] **Step 2: Ejecutar y verlo fallar**

```bash
node --test tests/no-duplicate-skills.test.js
```

Esperado: FAIL, con las 19 listadas.

- [ ] **Step 3: Borrar los directorios**

```bash
git rm -r -q skills/sdd skills/sdd-init skills/specify skills/clarify skills/plan \
  skills/tasks skills/analyze skills/implement skills/verify skills/review skills/ship \
  skills/constitution skills/idea-refinement skills/decision-challenge \
  skills/code-review skills/debug skills/parallel skills/worktrees skills/decision-records
```

- [ ] **Step 4: Ejecutar y verlo pasar**

```bash
node --test tests/no-duplicate-skills.test.js
```

Esperado: PASS.

- [ ] **Step 5: Quitar los comandos huérfanos**

En `targets/commands.js:30`, la línea es:

```js
  ...['specify', 'clarify', 'plan', 'tasks', 'analyze', 'implement', 'verify', 'review', 'ship', 'debug'].map((name) => skillCommand(name)),
```

Borrarla entera: los diez comandos respaldaban skills que ya no existen. Actualizar `tests/commands.test.js` para que no espere esos comandos.

- [ ] **Step 6: Borrar el instrumental de `specify`**

```bash
git rm -q scripts/spec-gate.js scripts/lib/spec-gate.js \
  tests/spec-gate.test.js tests/spec-gate-subject.test.js tests/spec-status-drift.test.js \
  tests/specify-contract.test.js tests/specify-doubt.test.js
```

Y quitar de `package.json` la línea del script `"spec:gate"`.

- [ ] **Step 7: Reparar los enlaces rotos que quedan**

```bash
npm run manifest
npm run drift:check
```

`drift:check` listará los `SKILL.md` supervivientes que enlazan a skills borradas. Para cada uno: si la frase señala la skill como siguiente paso, reescribirla nombrando la equivalente del flujo nuevo (`superpowers:writing-plans` por `plan`, `superpowers:systematic-debugging` por `debug`, `to-spec` por `specify`, `write-adr` por `decision-records`); si solo la menciona de pasada, quitar la mención. No dejar enlaces a ficheros inexistentes.

- [ ] **Step 8: Verificar entero**

```bash
npm run manifest
npm test 2>&1 | grep -E "^# (pass|fail)"
npm run validate
npm run drift:check
node -e "console.log(require('./manifest.json').counts.skills)"
```

Esperado: sin fallos, y `253` skills.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "🔥 Retirar la cadena SDD y las skills duplicadas"
```

---

### Task 6: Importar el catálogo propio traducido

37 skills nuevas: las 36 de `github.com/damiangilgonzalez1995/claude-skills` más `escribir-adr`, que hoy solo existe en `~/.claude/skills/`. Todas al inglés.

**Files:**
- Create: `skills/<id>/SKILL.md` × 37, más los ficheros auxiliares que cada una traiga
- Test: `tests/own-catalog.test.js` (nuevo)

**Interfaces:**
- Consumes: catálogo ya podado (Tarea 5).
- Produces: los ids que la Tarea 7 reparte en paquetes. Ids en inglés y en kebab: `animate`, `apple-design`, `landing-design`, `web-design-engineer`, `perception-laws`, `retention-laws`, `better-accessibility`, `better-colors`, `better-layout`, `better-writing`, `better-typography`, `better-ui`, `award-quality-sites`, `tastemaker`, `video-to-superprompt`, `animation-vocabulary`, `grill-me`, `grill-with-docs`, `grilling`, `wayfinder`, `to-spec`, `to-tickets`, `to-questionnaire`, `own-implement`, `change-review`, `own-code-review`, `research`, `prototype`, `domain-modeling`, `handoff`, `write-adr`, `teach`, `wait-what`, `writing-for-agents`, `claude-project-setup`, `muscle-memory`, `interface-review`.

- [ ] **Step 1: Clonar el repo de origen fuera del árbol de trabajo**

```bash
git clone --depth 1 https://github.com/damiangilgonzalez1995/claude-skills /tmp/claude-skills
ls /tmp/claude-skills
```

Las skills viven en `1-planificar/`, `2-implementar/`, `3-interfaz/`, `4-revisar-y-cerrar/` y `9-otras/`. El `instalar.py` y `docs/` de ese repo no se copian.

- [ ] **Step 2: Escribir el test que falla**

Crear `tests/own-catalog.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter } from '../scripts/lib/frontmatter.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const OWN = [
  'animate', 'apple-design', 'landing-design', 'web-design-engineer',
  'perception-laws', 'retention-laws', 'better-accessibility', 'better-colors',
  'better-layout', 'better-writing', 'better-typography', 'better-ui',
  'award-quality-sites', 'tastemaker', 'video-to-superprompt', 'animation-vocabulary',
  'grill-me', 'grill-with-docs', 'grilling', 'wayfinder', 'to-spec', 'to-tickets',
  'to-questionnaire', 'own-implement', 'change-review', 'own-code-review',
  'research', 'prototype', 'domain-modeling', 'handoff', 'write-adr', 'teach',
  'wait-what', 'writing-for-agents', 'claude-project-setup', 'muscle-memory',
  'interface-review',
];

test('el catalogo propio esta completo', () => {
  const missing = OWN.filter((id) => !existsSync(join(ROOT, 'skills', id, 'SKILL.md')));
  assert.deepEqual(missing, [], `faltan: ${missing.join(', ')}`);
});

test('el catalogo propio esta en ingles', () => {
  // Palabras funcionales del castellano que no aparecen en prosa inglesa.
  const spanish = /\b(cuando|usar|para|desde|entonces|porque|sobre|tambien|hacia|entre)\b/i;
  const offenders = [];
  for (const id of OWN) {
    const src = readFileSync(join(ROOT, 'skills', id, 'SKILL.md'), 'utf8');
    const prose = src.replace(/```[\s\S]*?```/g, '').replace(/`[^`]*`/g, '');
    if (spanish.test(prose)) offenders.push(id);
  }
  assert.deepEqual(offenders, [], `siguen en castellano: ${offenders.join(', ')}`);
});

test('el frontmatter propio declara nombre, descripcion y tags', () => {
  for (const id of OWN) {
    const fm = parseFrontmatter(readFileSync(join(ROOT, 'skills', id, 'SKILL.md'), 'utf8'));
    assert.equal(fm.name, id, `${id}: el campo name debe coincidir con el directorio`);
    assert.ok(fm.description.length >= 10, `${id}: descripcion demasiado corta`);
    assert.ok((fm.tags || []).length >= 1, `${id}: sin tags`);
  }
});
```

- [ ] **Step 3: Ejecutar y verlo fallar**

```bash
node --test tests/own-catalog.test.js
```

Esperado: FAIL, con las 37 en `faltan:`.

- [ ] **Step 4: Traer e ir traduciendo, de cuatro en cuatro**

Para cada grupo de cuatro skills: copiar el directorio a `skills/<id-nuevo>/`, traducir `SKILL.md` entero al inglés (frontmatter y cuerpo, y los ficheros auxiliares que traiga, como `ADR-PLANTILLA.md` → `ADR-TEMPLATE.md`), poner `name:` igual al nombre del directorio, y ajustar los enlaces internos a los ficheros renombrados.

La traducción es prosa técnica: conserva la estructura, las tablas y el tono directo del original. No resume ni añade. Las reglas y los criterios de acabado se traducen literalmente; perder un matiz ahí cambia el comportamiento de la skill.

Tras cada grupo:

```bash
node --test tests/own-catalog.test.js 2>&1 | grep -E "^# (pass|fail)"
npm run drift:check
git add skills/ && git commit -m "✨ Traer <ids> al catalogo, en ingles"
```

- [ ] **Step 5: Resolver el choque de nombres de `research` y `writing-for-agents`**

Comprobado el 2026-09-08: ninguno de esos ids existe hoy en `skills/`. Aun así, comprobarlo antes de copiar, porque la Tarea 5 puede haber cambiado el catálogo:

```bash
ls -d skills/research skills/writing-for-agents skills/prototype skills/handoff skills/teach 2>/dev/null
```

Si alguna existe, se aplica la regla de la spec: gana la de Damián. Se borra la de rsc en el mismo commit, y se añade su id a la lista `RETIRED` de `tests/no-duplicate-skills.test.js`.

- [ ] **Step 6: Poner `write-adr` a escribir en `docs/adr/`**

Comprobar que la skill traducida apunta a `docs/adr/` y no a otra ruta:

```bash
grep -n "docs/adr" skills/write-adr/SKILL.md
```

Esperado: al menos las referencias del procedimiento (índice, numeración, nombre de fichero).

- [ ] **Step 7: Verificar entero**

```bash
npm run manifest
npm test 2>&1 | grep -E "^# (pass|fail)"
npm run validate
npm run drift:check
node -e "console.log(require('./manifest.json').counts.skills)"
```

Esperado: sin fallos, y `290` skills.

- [ ] **Step 8: Commit final de la tarea**

```bash
git add -A
git commit -m "✨ Completar el catalogo propio traducido al ingles"
```

---

### Task 7: Los tres paquetes del onboarding

Hoy `buildOnboardingPlan` elige entre dos perfiles con la variable `needsSdd`. Pasa a elegir entre tres, y a declarar el plugin superpowers.

**Files:**
- Modify: `schema/frontmatter.schema.json` (enum de `profiles`)
- Modify: `scripts/lib/onboarding.js:159-166`
- Modify: `scripts/lib/default-skill-floor.js`
- Modify: `targets/claude.js` (escritura de `enabledPlugins`)
- Modify: el frontmatter `profiles:` de las skills que cambian de paquete
- Test: `tests/onboarding.test.js`, `tests/default-skill-floor.test.js`, `tests/base-install.test.js`

**Interfaces:**
- Consumes: los ids de la Tarea 6.
- Produces: `profiles` admite `minimal | core | ui | full`. `buildOnboardingPlan(record, evidence)` devuelve un `policy` con un campo nuevo `plugins: ['superpowers@claude-plugins-official']` cuando el perfil no es `minimal`.

- [ ] **Step 1: Ampliar el enum del schema**

En `schema/frontmatter.schema.json`:

```json
"profiles": { "type": "array", "items": { "enum": ["minimal", "core", "ui", "full"] } }
```

- [ ] **Step 2: Escribir el test que falla**

En `tests/onboarding.test.js`:

```js
test('un proyecto con frontend recibe el paquete de interfaz', () => {
  const plan = buildOnboardingPlan(
    { schemaVersion: 1, technicalLevel: 'technical', accompaniment: 'L1',
      projectKind: 'software', softwareScope: 'growing',
      goal: 'construir el panel de control', targets: ['claude'] },
    { schemaVersion: 1, signals: ['manifest:package.json'], stacks: ['node', 'react'],
      complexitySignals: [], sourceFileCount: 40, parentHarness: null },
  );
  assert.ok(plan.policy.skills.includes('tastemaker'), 'trae las skills de diseno');
  assert.ok(plan.policy.skills.includes('grill-with-docs'), 'y tambien las de flujo');
});

test('un proyecto sin frontend no recibe las skills de diseno', () => {
  const plan = buildOnboardingPlan(
    { schemaVersion: 1, technicalLevel: 'technical', accompaniment: 'L1',
      projectKind: 'software', softwareScope: 'growing',
      goal: 'construir la api de cobros', targets: ['claude'] },
    { schemaVersion: 1, signals: ['manifest:go.mod'], stacks: ['go'],
      complexitySignals: [], sourceFileCount: 40, parentHarness: null },
  );
  assert.ok(!plan.policy.skills.includes('tastemaker'), 'sin skills de diseno');
  assert.ok(plan.policy.skills.includes('grill-with-docs'), 'con las de flujo');
});

test('el perfil serio declara el plugin superpowers', () => {
  const plan = buildOnboardingPlan(
    { schemaVersion: 1, technicalLevel: 'technical', accompaniment: 'L1',
      projectKind: 'software', softwareScope: 'growing',
      goal: 'construir la api de cobros', targets: ['claude'] },
    { schemaVersion: 1, signals: ['manifest:go.mod'], stacks: ['go'],
      complexitySignals: [], sourceFileCount: 40, parentHarness: null },
  );
  assert.deepEqual(plan.policy.plugins, ['superpowers@claude-plugins-official']);
});
```

- [ ] **Step 3: Ejecutar y verlo fallar**

```bash
node --test tests/onboarding.test.js
```

Esperado: FAIL en los tres.

- [ ] **Step 4: Implementar la señal de interfaz y el tercer perfil**

En `scripts/lib/onboarding.js`, junto a la definición de `needsSdd` (línea 159):

```js
const UI_STACKS = new Set(['nextjs', 'react', 'vue', 'svelte']);
const needsWorkflow = isSoftware && (normalized.softwareScope !== 'small' || complexitySignals.length > 0);
const hasInterface = needsWorkflow && (evidence.stacks || []).some((stack) => UI_STACKS.has(stack));
const profile = !needsWorkflow ? 'minimal' : (hasInterface ? 'ui' : 'core');
```

`skillsForProfile` filtra por pertenencia, así que una skill de interfaz lleva `profiles: [ui, full]` y una de flujo `profiles: [core, ui, full]`. Renombrar `needsSdd` a `needsWorkflow` en todo el fichero: ya no hay SDD que nombrar.

- [ ] **Step 5: Etiquetar cada skill con su paquete**

Poner en el frontmatter de cada skill importada en la Tarea 6:

- Las 16 de diseño más `interface-review` y `ui-engineering`: `profiles: [ui, full]`
- Las 19 de flujo: `profiles: [core, ui, full]`
- `teach`: `profiles: [minimal, core, ui, full]`

Y quitar `core` del frontmatter de `ui-engineering`, que hasta ahora lo tenía.

- [ ] **Step 6: Ejecutar los dos primeros tests y verlos pasar**

```bash
node --test tests/onboarding.test.js
```

Esperado: pasan los de paquetes; sigue fallando el del plugin.

- [ ] **Step 7: Declarar el plugin en la política**

En el objeto `policy` de `buildOnboardingPlan`:

```js
plugins: needsWorkflow ? ['superpowers@claude-plugins-official'] : [],
```

Y añadir la decisión correspondiente, junto a las demás llamadas a `selected`:

```js
if (needsWorkflow) {
  decisions.push(selected('superpowers', 'plugin',
    'The planning and execution chain lives in the superpowers plugin, kept current by Claude Code.'));
}
```

- [ ] **Step 8: Escribirlo en `.claude/settings.json`**

En `targets/claude.js`, donde ya se leen y escriben los `settings` (línea 102 en adelante), añadir antes de guardar:

```js
if (policy.plugins?.length) {
  settings.enabledPlugins ||= {};
  for (const id of policy.plugins) settings.enabledPlugins[id] = true;
}
```

El formato está verificado contra `~/.claude/settings.json`: `enabledPlugins` es un objeto `{"superpowers@claude-plugins-official": true}`, y `claude-plugins-official` es el marketplace que Claude Code trae de serie.

- [ ] **Step 9: Escribir el test de la instalación y verlo pasar**

En `tests/base-install.test.js`, siguiendo el patrón de los tests de hooks que ya hay: instalar en un directorio temporal con una política que lleve `plugins`, y comprobar que el `.claude/settings.json` resultante contiene la clave con valor `true`.

```bash
node --test tests/onboarding.test.js tests/base-install.test.js
```

Esperado: PASS.

- [ ] **Step 10: Verificar entero**

```bash
npm run manifest
npm test 2>&1 | grep -E "^# (pass|fail)"
npm run validate
```

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "✨ Repartir el onboarding en tres paquetes y declarar superpowers"
```

---

### Task 8: Reescribir el gate

El texto que Claude lee en cada turno. Es la pieza que hace que todo lo anterior se use.

**Files:**
- Modify: `targets/hook-once.mjs:92` (`SDD_GATE_TEXT`)
- Modify: `skills/suggest/SKILL.md` (sección 1, el cuerpo largo)
- Modify: `targets/_md-block.js:23` (la versión de tres líneas, inline)
- Test: `tests/always-on-body.test.js`, `tests/gate-honesty.test.js`, `tests/doctor-hook-counts.test.js`

**Interfaces:**
- Consumes: los ids de las Tareas 5, 6 y 7.
- Produces: `WORKFLOW_GATE_TEXT`, exportada desde `targets/hook-once.mjs`. `scripts/doctor.js:9` y `targets/userprompt-gate.mjs:16` la importan por ese nombre.

- [ ] **Step 1: Actualizar el test del gate**

`tests/always-on-body.test.js` exige hoy que el cuerpo nombre `` `specify` `` y `` `debug` ``, que ya no existen. Sustituir esas dos aserciones (líneas 24 y 26):

```js
  assert.match(body, /`grill-with-docs`/, 'names the clarity route');
  assert.match(body, /`superpowers:systematic-debugging`/, 'names the bug route');
```

Y mantener intactas las demás: el techo de 8000 bytes, la prohibición de gritar en mayúsculas, y la que impide que el cuerpo repita las líneas del gate palabra por palabra.

- [ ] **Step 2: Ejecutar y verlo fallar**

```bash
node --test tests/always-on-body.test.js
```

Esperado: FAIL, `names the clarity route`.

- [ ] **Step 3: Escribir el gate nuevo**

En `targets/hook-once.mjs`, sustituir la constante entera:

```js
export const WORKFLOW_GATE_TEXT = `===== workflow gate (highest precedence) =====
Before acting on this turn: if the user wants to BUILD, ADD or CHANGE something — in ANY
language, judged by intent, not by keywords — route it through the chain below FIRST. No
feature code is written by ANY skill until the what is clear and the user has approved it.
1. Not clear yet? -> \`grill-with-docs\` for a green idea or an open question; \`wayfinder\`
   when the work is too large to hold in one session. Both leave their trail under docs/.
2. Clear? -> \`to-spec\` writes the spec. Record every hard-to-reverse call with \`write-adr\`.
3. Then build. Pick by size, and ask when unsure: ordinary work goes
   \`superpowers:writing-plans\` -> \`superpowers:executing-plans\`; work that came out of
   \`wayfinder\`, or too large for one plan, goes \`to-tickets\` -> \`implement\`, ticket by ticket.
Always: \`superpowers:test-driven-development\`, and \`superpowers:verification-before-completion\`
before calling anything done. Bugs enter through \`superpowers:systematic-debugging\`.
One-line change, typo, or a fix restoring intended behaviour? -> skip the chain, do it, say so.
==============================================
\`;
```

Sustituir el nombre `SDD_GATE_TEXT` por `WORKFLOW_GATE_TEXT` en `scripts/doctor.js:9` y `:289`, `targets/userprompt-gate.mjs:16` y `:31`, y `tests/always-on-body.test.js:6` y `:55`.

- [ ] **Step 4: Reescribir la sección 1 de `skills/suggest/SKILL.md`**

Es el cuerpo largo del mismo mensaje, el que reciben los asistentes sin hooks. Debe enseñar la misma cadena sin copiar las frases del gate palabra por palabra — hay un test que lo comprueba. Mantener intactas las otras cuatro cosas que solo ese fichero hace, y que su test exige: `catalog --available`, `consult`, `user-profile.md`, `.rsc/.no-harness` y el `bloque-brújula`.

- [ ] **Step 5: Actualizar la versión de tres líneas**

Vive inline en `targets/_md-block.js:23`, en la plantilla que reciben los asistentes sin hooks (Cursor y la familia AGENTS.md). Reescribirla para que nombre `grill-with-docs`, `to-spec` y `superpowers:writing-plans`. Comprobar antes que la ruta que cita ya diga `docs/wiki/harness/user-profile.md`: la Tarea 3 la habrá cambiado.

- [ ] **Step 6: Ejecutar y verlo pasar**

```bash
node --test tests/always-on-body.test.js tests/gate-honesty.test.js tests/doctor-hook-counts.test.js
```

Esperado: PASS. Si falla el techo de 8000 bytes del cuerpo, recortar prosa del cuerpo, no del gate.

- [ ] **Step 7: Medir el coste por turno**

```bash
node -e "import('./targets/hook-once.mjs').then(m=>console.log('gate bytes:',Buffer.byteLength(m.WORKFLOW_GATE_TEXT)))"
```

Anotar el número. El gate anterior ocupaba unos 900 bytes; si el nuevo pasa de 1400, recortar. Se inyecta en cada mensaje del usuario.

- [ ] **Step 8: Verificar entero**

```bash
npm run manifest
npm test 2>&1 | grep -E "^# (pass|fail)"
npm run validate
npm run drift:check
```

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "✨ Reescribir el gate para enrutar al flujo propio"
```

---

### Task 9: Instalación de prueba y limpieza

Comprobar en un proyecto de verdad que lo instalado es lo que se diseñó.

**Files:**
- Modify: ninguno del repo, salvo lo que la prueba revele
- Delete: `~/.claude/skills/escribir-adr/`

**Interfaces:**
- Consumes: todo lo anterior.
- Produces: nada. Es la verificación final.

- [ ] **Step 1: Preparar dos proyectos de prueba**

```bash
mkdir -p /tmp/prueba-api /tmp/prueba-web
cd /tmp/prueba-api && git init -q && echo '{"name":"api","dependencies":{"express":"^4"}}' > package.json
cd /tmp/prueba-web && git init -q && echo '{"name":"web","dependencies":{"react":"^18","next":"^14"}}' > package.json
```

- [ ] **Step 2: Instalar el harness en los dos**

Desde cada directorio, ejecutar el CLI local del repo (no `npx`, que bajaría la versión publicada):

```bash
node C:/Users/Usuario/Documents/GitHub/rsc-harness/scripts/rsc.js init
```

- [ ] **Step 3: Comprobar lo instalado**

```bash
ls /tmp/prueba-api/.claude/skills | wc -l
ls /tmp/prueba-web/.claude/skills | wc -l
ls /tmp/prueba-api/.claude/skills | grep -c tastemaker
node -e "console.log(require('/tmp/prueba-api/.claude/settings.json').enabledPlugins)"
```

Esperado: el proyecto web trae más skills que el de api; `tastemaker` aparece en el web y no en el de api (`grep -c` devuelve `0`); y los dos declaran `superpowers@claude-plugins-official: true`.

- [ ] **Step 4: Comprobar que no hay duplicados**

```bash
ls /tmp/prueba-web/.claude/skills | grep -E "^(sdd|specify|plan|implement|debug|code-review|decision-records)$"
```

Esperado: sin resultados.

- [ ] **Step 5: Comprobar dónde escribe**

```bash
ls /tmp/prueba-web/docs 2>/dev/null; ls /tmp/prueba-web/02-DOCS 2>/dev/null
```

Esperado: existe `docs/`, no existe `02-DOCS/`.

- [ ] **Step 6: Borrar la copia global de `escribir-adr`**

Solo cuando `skills/write-adr/SKILL.md` exista en el repo y los pasos anteriores hayan pasado:

```bash
rm -rf /c/Users/Usuario/.claude/skills/escribir-adr
```

- [ ] **Step 7: Limpiar los proyectos de prueba**

```bash
rm -rf /tmp/prueba-api /tmp/prueba-web /tmp/claude-skills
```

- [ ] **Step 8: Verificación final del repo**

```bash
npm test 2>&1 | grep -E "^# (tests|pass|fail)"
npm run validate
npm run drift:check
grep -rn "02-DOCS\|@ericrisco/rsc" --exclude-dir=node_modules --exclude-dir=.git . | wc -l
```

Esperado: `# fail 0`, las dos comprobaciones sin errores, y `0` menciones.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "✅ Verificar la instalacion en proyectos de prueba"
```
