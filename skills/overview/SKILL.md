---
name: overview
description: "Use when starting a project ('empezar proyecto', 'bajar a tierra'): settle the senior questions and checks by rounds and seed the review zones. Or for the 'project overview', 'estado del proyecto', 'qué falta por revisar': which zones need review, judged by current file content (blob sha). NOT a security audit (that is `hardening`), NOT a diff scan (that is `security-scan`), NOT a data dashboard (that is `dashboard`)."
tags: [overview, project-status, review-coverage, start-project, zones, cadence]
recommends: [hardening, security-scan, code-review]
profiles: [minimal, core, ui, full]
origin: damiangil
---

# Overview

El estado del proyecto de un vistazo: qué zonas piden revisión, con qué skill, y qué parte de sus archivos está revisada **con el contenido que tienen hoy**. `start` crea `docs/overview/overview.json`; los demás modos solo actúan si existe, y sin él no hacen nada.

El motor es `scripts/overview.mjs`: Node sin dependencias, por CLI o como módulo (`record`, `scan`, `render`). Solo lee git, sin shell.

## Datos

- `docs/overview/overview.json`, en git: `zones[]` (`id`, `label`, `paths` con globs, `reviewSkills`, `cadenceDays`, `checks`), que es lo que lee el motor, y lo que escribe `start` (`questions[]`, `sources[]`, `verifications[]`, `hiddenZones[]`, `pendingMessage`). Esquema completo en [`zones.md`](zones.md).
- `docs/overview/reviews/<fecha>-<skill>-<commit>.json`, en git: una revisión por archivo, con `skill`, `at`, `branch`, `commit`, `scope`, `pr` opcional, `zones` y `files` (`{path: blob sha}`). Un archivo por revisión evita conflictos al mergear ramas.
- `.rsc/overview/state.json`, fuera de git: el estado calculado (`kpis` y `zones[]`; la forma exacta está en la cabecera de `overview.mjs`).
- `.rsc/overview/history.json`, fuera de git: una foto `{week, health, commits}` por semana ISO.
- `.rsc/overview/overview.html`, fuera de git: el dashboard que genera `show`.

## Modos

| Modo | Cuándo | Dónde |
|---|---|---|
| `start` | Arranque: un proyecto nuevo, una spec que bajar a tierra, o un proyecto sin `overview.json` | [`start.md`](start.md) |
| `record` | Registrar una revisión que se acaba de pasar | abajo |
| `scan` | Qué zonas piden revisión ahora | abajo |
| `show` | Ver el estado en el dashboard HTML | abajo |

Si el usuario pide el estado y no hay `overview.json`, ofrece `start`.

## Modo `start`

Lee [`start.md`](start.md) y sigue sus pasos en orden: leer las fuentes, comprobar antes de preguntar, sembrar las zonas, cruzar el banco, el mapa opcional, preguntar por rondas y la puerta de construcción. Referencias que usa: [`questions.md`](questions.md) (el banco por zona), [`checks.md`](checks.md) (comprobaciones senior por zona, con la skill que revisa cada una), [`zones.md`](zones.md) (zonas por defecto y esquema de `overview.json`) y [`map.md`](map.md) (el mapa opcional).

## Modo `record`

```bash
node scripts/overview.mjs record --skill security-scan [--scope pr|global] [--pr 41] [--root .]
```

- Escribe una revisión de `--skill` sobre las zonas que la tienen en `reviewSkills`. Si ninguna la tiene, no escribe nada.
- `pr`: los archivos cambiados frente al merge-base con la rama principal, más los cambios sin commitear. `global`: todos los archivos de esas zonas.
- Sin `--scope`: `pr` fuera de la rama principal o con `--pr`, `global` en ella. La principal sale de `origin/HEAD`, o si no de `main` o `master`.
- El id de skill debe cumplir `^[a-z0-9:_-]+$`. `.env*`, lo ignorado por git y `docs/overview/` nunca entran en `files`.
- Lo normal es que lo lance el hook al ejecutar una skill de revisión; a mano solo si el hook no está.

## Modo `scan`

```bash
node scripts/overview.mjs scan [--fast] [--no-gh] [--root .]
```

- Un archivo está cubierto si alguna revisión de una skill de su zona lo registra con su blob sha actual. Si cambió después, deja de estar cubierto, sea cual sea la fecha.
- Por zona: `coverage` (cubiertos ÷ total), `uncovered`, `ageDays` desde la revisión más reciente que aún cubre algo, y `color`:
  - `never`: la zona nunca se revisó;
  - `red`: lo que pesa. Un endpoint nuevo, una tabla o migración, o un archivo de auth sin cubrir; o cobertura por debajo de 0,5;
  - `amber`: cobertura por debajo de 0,9 (un CSS cambiado se queda aquí), o todo cubierto pero fuera de la cadencia (la edad sola no pasa de ámbar);
  - `green`: cobertura de 0,9 o más dentro de la cadencia.
- Endpoints nuevos sin cubrir (`uncoveredEndpoints`): rutas FastAPI (`@router.get`, `@app.post`…), Express (`app|router.get(...)`) y Next (`app/**/route.ts` con `export GET/POST…`) de archivos sin cubrir que no estaban en la versión revisada del archivo.
- De peso sin cubrir (`uncoveredWeighty`, `{kind, file}`), también en `--fast`:
  - `table`: `CREATE TABLE` o `ALTER TABLE` en `.sql`, archivos bajo `migrations/`, `alembic/versions/` o `supabase/migrations/`, `prisma/schema.prisma` y `op.create_table`;
  - `auth`: rutas con `auth`, `login`, `session`, `jwt`, `token`, `permission`, `rls` o `policy` en el nombre o el directorio (estilos, docs e imágenes no cuentan).
- KPIs: `health` (0–100, cobertura ponderada por archivos, con techo de 80 si caduca y 40 con algo de peso sin cubrir; nunca revisada vale 0), `zonesNeedingReview`, `uncoveredFiles`, `uncoveredEndpoints`, `openQuestions` y `lastCoveredPr` (del campo `pr` de las revisiones, de los merge commits de ramas revisadas y de `gh` si está; `--no-gh` lo salta).
- `--fast` es el modo del aviso de sesión: mismos colores por cobertura y edad, sin endpoints, sin merges ni `gh`, y sin escribir `state.json` ni la historia: solo devuelve el estado. `render` nunca reutiliza un estado rápido ni uno ilegible; si es el caso, hace antes el scan completo.
- Cuenta el resultado en una línea por zona que pida revisión, con su `recommendedSkill` (la primera de `reviewSkills` que nunca se lanzó en la zona, o la de revisión más antigua).

## Modo `show`

```bash
node scripts/overview.mjs show [--no-gh] [--no-open] [--root .]
node scripts/overview.mjs render [--no-gh] [--root .]
```

- `show` hace un scan completo, genera `.rsc/overview/overview.html` y lo abre con el navegador por defecto. Con `--no-open` (o la variable `OVERVIEW_NO_OPEN`) solo lo genera. En los dos casos imprime la ruta.
- `render` solo genera el HTML a partir del `state.json` que haya; si no hay, hace antes el scan.
- Es un único HTML estático: se abre con doble clic (`file://`), sin servidor ni librerías, y lleva el estado incrustado en `<script type="application/json" id="overview-state">`.
- Arriba van los KPIs (salud global, zonas que piden revisión, archivos sin cubrir, preguntas abiertas y última PR cubierta). Debajo, un cuadrado de color por zona: las de más peso (urgencia × archivos) ocupan 2×2, como mucho 3. Al final, dos gráficas: salud y commits por semana, y revisiones de este mes por skill.
- Al pulsar un cuadrado se abre su detalle: endpoints y archivos sin cubrir, comprobaciones, historial de revisiones y skill recomendada. Se enlaza directo con `overview.html#zone=<id>`.
- Después de abrirlo, di en una línea qué zonas piden revisión y con qué skill: puede que el usuario no mire el HTML.
