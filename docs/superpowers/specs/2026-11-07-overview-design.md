# `overview`: el estado del proyecto de un vistazo

Fecha: 2026-11-07 · Estado: pendiente de aprobación

## Intención

En un proyecto vivo entra código nuevo (endpoints, tablas, pantallas, integraciones) y las revisiones que tocan (seguridad, RLS, documentación, conexiones…) se quedan atrás sin que nadie lo note. Además, hay decisiones "de senior" que conviene plantearse desde el primer día (multitenant, sesiones que caducan, recargar a mitad de un flujo, validar en el servidor, CORS…) y que solo echas de menos cuando ya es tarde.

`overview` junta las dos cosas en una sola vista del estado del proyecto:

1. **Al empezar:** recorre poco a poco un banco de preguntas genérico (backend, frontend, base de datos, seguridad, IA, datos del cliente, móvil, operación…) y registra qué está decidido, qué sigue abierto y qué no aplica.
2. **Mientras trabajas:** un hook apunta solo cada revisión que se lanza: qué skill, cuándo y **qué archivos cubrió, con la huella de su contenido**.
3. **Cuando lo pides o al abrir sesión:** cruza el contenido actual de cada archivo con lo que se revisó, y dice qué zonas piden revisión y con qué skill. Por ejemplo: "3 endpoints nuevos sin revisión de seguridad → `security-scan` / `secure-coding`".
4. **Un dashboard HTML ligero** que lo enseña todo sin abrir el código ni la documentación.

Es para cualquier proyecto; Vera fue solo el ejemplo de origen.

## Objetivos

- Ver de un vistazo cada zona del proyecto: cuándo se revisó, con qué skill, qué parte de sus archivos está revisada con el contenido que tienen hoy y si pide revisión.
- Que las revisiones se registren solas mediante un hook.
- Que funcione con varias ramas en paralelo: las revisiones de todas las ramas se suman al mergear, sin conflictos y sin dar por revisado lo que no se revisó.
- Avisar con una línea al iniciar sesión cuando una zona pide revisión.
- Sustituir a `bajar-a-tierra`, que se borra: sus preguntas, estados, comprobaciones y rondas pasan a ser la fase de arranque de `overview`.

## No objetivos

- No lanza las revisiones por su cuenta: recomienda la skill y es el usuario quien la ejecuta.
- No sustituye a `security-scan`, `hardening`, `code-review` ni a ninguna otra; solo las coordina y las registra.
- No es una puerta de CI ni bloquea merges.
- No necesita servidor, base de datos ni dependencias externas.
- No migra registros antiguos de `bajar-a-tierra`. Si un proyecto tiene uno, el modo `start` lo lee como una fuente más.

## Anti-objetivos (fallaría aunque funcione)

- Que parezca una pantalla de bolsa: sin porcentajes al estilo ticker y sin fondo negro.
- Que dependa de que alguien apunte las revisiones a mano.
- **Que dé una falsa sensación de cobertura**, por ejemplo marcando "seguridad revisada" en archivos que se escribieron o cambiaron después de la revisión.
- Que dé la lata en cada turno: el aviso sale una vez por sesión y en una sola línea.
- Que provoque conflictos de merge entre ramas.
- Que el dashboard pese o necesite instalar algo para abrirse.

## Lo que decidió el usuario

- **Nombre en inglés:** la skill se llama `overview`, y todos los identificadores (ficheros, claves del JSON, zonas) van en inglés.
- **Los datos van en `docs/overview/`**, con `docs/overview/overview.json`, y en git.
- **Se instala siempre** con el harness, en todos los perfiles.
- **`bajar-a-tierra` se borra** (`~/.claude/skills/bajar-a-tierra/`), sin redirección.
- **Registro automático por hook** al lanzar una skill de revisión.
- **Registro por archivo y por contenido**, no solo por fecha, para que las ramas en paralelo funcionen y no haya falsa cobertura.
- **Dashboard** (maqueta validada: `.superpowers/brainstorm/*/content/dashboard-squares-v4.html`):
  - fondo claro, colores suaves, nada de estética de bolsa;
  - **cuadrados, no rectángulos**: las zonas destacadas ocupan 2×2 y el resto 1×1;
  - arriba, KPIs: salud global, zonas que piden revisión, archivos o commits sin revisar, preguntas abiertas y la última PR cubierta;
  - una cuadrícula con muchas zonas, documentación incluida (si cuadra con el código y cuándo pasó el agente de docs);
  - un par de gráficas sencillas: la salud frente al código nuevo de las últimas semanas, y las revisiones lanzadas este mes;
  - el color depende de **la cobertura del contenido actual y de la antigüedad**: una revisión antigua sobre archivos intactos sigue en verde, y una reciente con archivos nuevos o cambiados sale en rojo.
- **Contenido de partida:** el banco genérico parte de `bajar-a-tierra/PREGUNTAS.md` y `COMPROBACIONES.md`, de `Vera-Symplia/docs/wiki/proyecto/preguntas-antes-de-empezar.md` (sin lo propio de Vera) y de las dos referencias que pasó el usuario:
  - los 10 agujeros de seguridad: rate limiting, claves fuera del código, secretos de producción en Vercel/Supabase/GitHub, límites por IP, entradas validadas y consultas parametrizadas, validación en el servidor, RLS, hash y cifrado, sesiones que vencen y CORS solo con tu dominio, con la pauta de revisarlo cada mes y antes de lanzar;
  - el vocabulario de frontend: componentes, estado, hooks, renderizado, hidratación, rutas, API y secretos en el bundle.

  Como el borrado de `bajar-a-tierra` es definitivo, su contenido se copia al repo **antes** de borrarla.

## Modelo de datos

### En git: `docs/overview/`

```
docs/overview/
  overview.json                 # configuración y decisiones: cambia poco
  reviews/
    2026-11-07T1012-security-scan-a1f9c2.json   # una revisión = un archivo
    2026-11-05T1730-code-review-77be01.json
```

**`overview.json`** guarda las zonas y las preguntas. Esquema orientativo:

```json
{
  "version": 1,
  "project": "name",
  "zones": [
    {
      "id": "api-endpoints",
      "label": "Endpoints API",
      "paths": ["**/routers/**", "**/api/**", "app/**/route.ts"],
      "reviewSkills": ["security-scan", "secure-coding"],
      "cadenceDays": 30,
      "checks": [{ "id": "server-validation", "label": "Validación en el servidor", "skill": "secure-coding", "status": "fail", "note": "3 rutas" }]
    }
  ],
  "questions": [ { "id": "multitenant", "zone": "database", "text": "…", "state": "decided", "answer": "…", "who": "user" } ]
}
```

**Cada revisión es un archivo propio** en `reviews/`, con un nombre único (fecha, skill y commit corto):

```json
{
  "skill": "security-scan",
  "at": "2026-11-07T10:12:00Z",
  "branch": "feat/orders",
  "commit": "a1f9c2…",
  "scope": "pr",
  "pr": 41,
  "zones": ["api-endpoints", "security"],
  "files": { "app/routers/orders.py": "<git blob sha>", "app/routers/lines.py": "<git blob sha>" }
}
```

- **`files`** registra cada archivo cubierto con el hash de git de su contenido (blob sha). En una revisión de PR van los archivos cambiados respecto al merge-base con la rama principal. En una global, todos los archivos que caen en las zonas de esa skill.
- **Por qué un archivo por revisión:** dos ramas nunca escriben el mismo archivo, así que al mergear las revisiones de ambas se suman sin conflictos.
- **Por qué el blob sha:** un squash merge conserva el contenido y por tanto el hash, así que la revisión sigue valiendo en `main` aunque desaparezcan los commits de la rama.

### Fuera de git: `.rsc/overview/`

Lo que se recalcula siempre (salud por zona, archivos pendientes, foto semanal para las gráficas) y el `overview.html` generado. `.rsc/` ya está en `.gitignore`.

## Regla de cobertura y color

Un archivo cuenta como **revisado por la skill S** si alguna revisión de S registra ese archivo con **el mismo blob sha que tiene hoy en `HEAD`**. Si el archivo cambió después, deja de estar cubierto, sea cual sea la fecha.

Para cada zona:
- **cobertura** = archivos de la zona revisados por alguna de sus `reviewSkills` ÷ archivos de la zona;
- **antigüedad** = días desde la revisión más reciente que sigue cubriendo algo, frente a `cadenceDays`;
- **color:** verde si la cobertura es alta y la revisión está dentro de la cadencia. Si los archivos están intactos, la edad sola no pasa de ámbar. Rojo si hay archivos nuevos o cambiados de peso (endpoints, tablas, auth) sin cubrir. Gris discontinuo si la zona nunca se revisó.

Los umbrales exactos los fija el builder.

Así se resuelve el caso de las ramas en paralelo. Si la rama A pasa seguridad y la B no, al mergear las dos los archivos de A salen cubiertos y los nuevos o cambiados de B salen pendientes. Lo mismo ocurre con un archivo revisado en una rama y modificado en otra.

## Piezas

### 1. Skill `skills/overview/`

- `SKILL.md`: frontmatter con el formato del repo (`description` en inglés con "Use when…"; triggers como "start a project", "empezar proyecto", "project overview", "qué falta por revisar", "estado del proyecto"; `NOT` frente a `hardening`, `security-scan` y `dashboard`). En `profiles` van todos, como `hardening`. El cuerpo describe tres modos:
  - **`start`:** el flujo de `bajar-a-tierra` (leer fuentes → comprobar antes de preguntar → cruzar el banco → preguntar por rondas al estilo `grilling` → puerta de construcción). El resultado se escribe en `overview.json`. Se conservan sus siete estados. `MAPA.md` (artifact del flujo del proyecto) queda como paso opcional.
  - **`scan`:** ejecuta el analizador (pieza 3), lanza un subagente de solo lectura para lo que no sale por patrones (docs que no cuadran, estado de cada comprobación senior) y actualiza `checks` en `overview.json`.
  - **`show`:** genera y abre el dashboard.
- `questions.md`: el banco genérico, agrupado por zona.
- `checks.md`: las comprobaciones senior por zona (los 10 de seguridad, los de frontend, etc.), cada una con la skill que la revisa.
- Las zonas por defecto (con globs, skills de revisión y cadencia) las siembra `start` en `overview.json`. Son estas: `api-endpoints`, `frontend`, `database` (RLS y migraciones), `security`, `docs`, `tests`, `dependencies`, `ai` (prompts y evals), `network` (conexiones y puertos), `secrets`, `backups`, `code-review`, `observability`, `accessibility`, `performance`, `ci-deploy` y `hardening`. Se ocultan las que no aplican al stack detectado.
- `evals/cases.yaml`, como el resto de skills.

### 2. Registro: `scripts/record.mjs` (usado por el hook)

- Recibe la skill y el scope, mira qué zonas tienen esa skill en `reviewSkills` y calcula la lista de archivos: los cambiados frente al merge-base si es `pr`, o todos los de esas zonas si es `global`. Saca el blob sha de cada uno (`git ls-files -s` o `git hash-object` para los que tienen cambios sin commitear) y escribe un archivo nuevo en `docs/overview/reviews/`.
- Si no existe `docs/overview/overview.json`, no hace nada y sale callado. Así el hook puede estar siempre cableado.

### 3. Analizador: `scripts/scan.mjs`

Node sin dependencias. Lee `overview.json` y `reviews/*.json`, lista los archivos actuales de cada zona con su blob sha, aplica la regla de cobertura, detecta endpoints nuevos sin cubrir con patrones sencillos por stack (decoradores de FastAPI, rutas de Express, `route.ts` de Next…), saca los números de PR de los merge commits (y de `gh` si está) y escribe el estado calculado y la foto semanal en `.rsc/overview/`.

Tiene un **modo rápido** sin detección de endpoints, para el aviso de sesión, con un tope de tiempo.

### 4. Hooks de registro automático

- **`PostToolUse` con matcher `Skill`:** lee `tool_input.skill` y, si es una skill de revisión de alguna zona, llama a `record.mjs`.
- **`UserPromptSubmit`:** las skills que el usuario lanza escribiendo `/security-scan` no pasan por la herramienta Skill, así que este hook detecta los prompts que empiezan por `/<skill-de-revisión>` y registra igual.
- **Scope:** `pr` si se está en una rama distinta de la principal o el prompt menciona una PR; `global` si se pide explícitamente o se está en la rama principal.
- **Momento del registro (decisión mía):** se registra al lanzar la skill, con los archivos tal como están en ese momento.
- Se cablean en `targets/claude.js` igual que los guards actuales (scripts en `.rsc/`, con dedup y sin tocar hooks ajenos), siempre, porque la skill es de suelo.

### 5. Aviso al iniciar sesión

En `targets/session-start.mjs`, siguiendo el patrón de `auditDue()`: si existe `docs/overview/overview.json`, ejecuta `scan.mjs` en modo rápido. Si alguna zona está en rojo, saca una línea como esta, una vez por sesión: "overview: 3 zonas piden revisión (api-endpoints, database, security) — `/overview scan`". Si se pasa del tope de tiempo, se calla.

### 6. Dashboard: `scripts/render.mjs` → `.rsc/overview/overview.html`

- Es un único HTML estático con los datos incrustados, para que funcione con `file://` sin servidor. SVG en línea para las gráficas, sin librerías.
- Lleva lo validado en la maqueta v4. Al pulsar un cuadrado se abre su detalle: comprobaciones, archivos y endpoints sin cubrir, docs que no cuadran, historial de revisiones de esa zona y la skill recomendada.
- **2×2 (decisión mía):** los cuadrados grandes no son fijos. Se los ganan las zonas con más peso, es decir, la urgencia combinada con el número de archivos. Como mucho, unas 3.
- El diseño final se pule con las skills del harness (`dataviz`, `mejor-*`). La maqueta fija la estructura, no el acabado.

### 7. Limpieza

- Copiar el contenido útil de `~/.claude/skills/bajar-a-tierra/` a `skills/overview/` y después borrar esa carpeta.
- Añadir `.superpowers/` al `.gitignore` del repo, porque contiene las maquetas de esta sesión.

## Lo que queda para el builder

- Umbrales exactos de cobertura, de color y de cadencia por zona.
- Patrones de detección de endpoints por stack y globs por defecto.
- Cómo detectar el stack para ocultar zonas.
- Cómo se detecta la rama principal (`origin/HEAD`, `main` o `master`).
- Tests: `record.mjs`, `scan.mjs` y los hooks se prueban con un repo git de fixture que incluya dos ramas con revisiones distintas mergeadas (con merge y con squash), siguiendo el estilo de `tests/`. `npm run manifest`, `validate`, `test` y `eval-lint` en verde.
- Documentar la skill en `docs/catalogo.md`, en `docs/referencia-tecnica.md` y en el README, como el resto.
