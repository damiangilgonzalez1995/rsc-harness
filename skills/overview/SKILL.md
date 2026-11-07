---
name: overview
description: "Use when the user wants the project overview: which zones need review, what is covered by the current content, or start a project with senior checks. Records each review run with the blob sha of every covered file. NOT a security audit (that is `hardening`), NOT a quick diff scan (that is `security-scan`), NOT a data dashboard (that is `dashboard`)."
tags: [overview, project-status, review-coverage, start-project, zones, cadence]
recommends: [hardening, security-scan, code-review]
profiles: [minimal, core, ui, full]
origin: damiangil
---

# Overview

El estado del proyecto de un vistazo: qué zonas piden revisión, con qué skill, y qué parte de sus archivos está revisada **con el contenido que tienen hoy**. Solo actúa en proyectos con `docs/overview/overview.json`; sin él no hace nada.

El motor es `scripts/overview.mjs`: Node sin dependencias, por CLI o como módulo (`record`, `scan`). Solo lee git, sin shell.

## Datos

- `docs/overview/overview.json`, en git: `zones[]` (`id`, `label`, `paths` con globs, `reviewSkills`, `cadenceDays`, `checks`) y `questions[]`.
- `docs/overview/reviews/<fecha>-<skill>-<commit>.json`, en git: una revisión por archivo, con `skill`, `at`, `branch`, `commit`, `scope`, `pr` opcional, `zones` y `files` (`{path: blob sha}`). Un archivo por revisión evita conflictos al mergear ramas.
- `.rsc/overview/state.json`, fuera de git: el estado calculado.

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
node scripts/overview.mjs scan [--fast] [--root .]
```

- Un archivo está cubierto si alguna revisión de una skill de su zona lo registra con su blob sha actual. Si cambió después, deja de estar cubierto, sea cual sea la fecha.
- Por zona: `coverage` (cubiertos ÷ total), `uncovered`, `ageDays` desde la revisión más reciente que aún cubre algo, y `color`:
  - `never`: la zona nunca se revisó;
  - `red`: cobertura por debajo de 0,8 (código nuevo o cambiado sin cubrir);
  - `amber`: cobertura entre 0,8 y 0,9, o todo cubierto pero fuera de la cadencia (la edad sola no pasa de ámbar);
  - `green`: cobertura de 0,9 o más dentro de la cadencia.
- `--fast` es el modo del aviso de sesión.
- Cuenta el resultado en una línea por zona que pida revisión, con la skill recomendada (la primera de `reviewSkills`).

Los modos `start` y `show` se añaden en otros pasos.
