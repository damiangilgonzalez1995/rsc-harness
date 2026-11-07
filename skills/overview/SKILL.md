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

El motor es `scripts/overview.mjs`: Node sin dependencias, por CLI o como módulo (`record`, `scan`). Solo lee git, sin shell.

## Datos

- `docs/overview/overview.json`, en git: `zones[]` (`id`, `label`, `paths` con globs, `reviewSkills`, `cadenceDays`, `checks`), que es lo que lee el motor, y lo que escribe `start` (`questions[]`, `sources[]`, `verifications[]`, `hiddenZones[]`, `pendingMessage`). Esquema completo en [`zones.md`](zones.md).
- `docs/overview/reviews/<fecha>-<skill>-<commit>.json`, en git: una revisión por archivo, con `skill`, `at`, `branch`, `commit`, `scope`, `pr` opcional, `zones` y `files` (`{path: blob sha}`). Un archivo por revisión evita conflictos al mergear ramas.
- `.rsc/overview/state.json`, fuera de git: el estado calculado.

## Modos

| Modo | Cuándo | Dónde |
|---|---|---|
| `start` | Arranque: un proyecto nuevo, una spec que bajar a tierra, o un proyecto sin `overview.json` | [`start.md`](start.md) |
| `record` | Registrar una revisión que se acaba de pasar | abajo |
| `scan` | Qué zonas piden revisión ahora | abajo |

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
