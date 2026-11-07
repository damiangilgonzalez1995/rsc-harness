# Zonas por defecto

Las zonas que `start` siembra en `docs/overview/overview.json`. Son un punto de partida: el usuario edita luego `paths`, `reviewSkills` y `cadenceDays` a su gusto.

## Cómo sembrarlas

1. Detecta el stack con lo comprobado en el paso 2 de [`start.md`](start.md): `package.json` y sus dependencias, `pyproject.toml`, `requirements*.txt`, `go.mod`, `supabase/`, `prisma/`, `*.sql`, `.github/workflows/`, `Dockerfile`, SDKs de modelos (`openai`, `anthropic`, `langchain`…).
2. Por cada zona de la tabla, mira la columna **Se oculta si**. Si se cumple, la zona va a `hiddenZones` con el motivo, y no a `zones`.
3. Las demás van a `zones` con sus `paths`, `reviewSkills` y `cadenceDays`, y su `checks[]` sale de [`checks.md`](checks.md) con `status: "unknown"`.
4. Ajusta los `paths` a las carpetas reales del proyecto: quita los globs que no casan con nada y añade los que falten (por ejemplo `backend/app/routers/**`). Una zona con cero archivos se oculta.
5. Si `overview.json` ya existe, conserva lo que el usuario haya cambiado y añade solo lo que falte.

Los globs los interpreta `scripts/overview.mjs`: `**/` es cero o más carpetas, `**` cualquier cosa, `*` y `?` no cruzan `/`. No hay llaves (`{a,b}`): escribe un glob por patrón. Las rutas son relativas a la raíz y con `/`, también en Windows.

## Tabla

| id | label | paths | reviewSkills | cadenceDays | Se oculta si |
|---|---|---|---|---|---|
| `api-endpoints` | Endpoints API | `**/routers/**`, `**/routes/**`, `**/api/**`, `**/controllers/**`, `**/endpoints/**`, `app/**/route.ts`, `app/**/route.js`, `pages/api/**` | `security-scan`, `secure-coding`, `api-design` | 30 | No hay backend ni rutas de API |
| `frontend` | Frontend | `**/components/**`, `**/hooks/**`, `**/pages/**`, `app/**/*.tsx`, `app/**/*.jsx`, `src/**/*.tsx`, `src/**/*.jsx`, `**/*.vue`, `**/*.svelte`, `**/*.astro` | `ui-engineering`, `code-review` | 30 | No hay framework de interfaz |
| `database` | Base de datos (RLS y migraciones) | `**/migrations/**`, `supabase/**`, `prisma/**`, `**/*.sql`, `**/models/**` | `db-migrations`, `supabase`, `security-scan` | 30 | No hay base de datos |
| `security` | Seguridad | `**/auth/**`, `**/*auth*`, `**/middleware*`, `**/security/**`, `**/permissions/**` | `security-scan`, `secure-coding`, `hardening` | 30 | Nunca |
| `secrets` | Secretos y configuración | `.env.example`, `**/config/**`, `**/settings*`, `**/*secret*`, `.github/workflows/**` | `security-scan`, `secure-coding` | 30 | Nunca |
| `docs` | Documentación | `README.md`, `AGENTS.md`, `CLAUDE.md`, `docs/**` | `technical-writing` | 30 | Nunca |
| `tests` | Pruebas | `tests/**`, `**/test/**`, `**/__tests__/**`, `**/*.test.*`, `**/*.spec.*`, `**/test_*.py` | `code-review`, `e2e-testing` | 60 | Nunca |
| `dependencies` | Dependencias | `**/package.json`, `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, `requirements*.txt`, `pyproject.toml`, `poetry.lock`, `uv.lock`, `go.mod`, `go.sum`, `Cargo.toml`, `Cargo.lock` | `security-scan`, `deprecation` | 30 | Nunca |
| `ai` | IA (prompts y evals) | `**/prompts/**`, `**/evals/**`, `**/agents/**`, `**/llm/**`, `**/*.prompt*` | `prompt-engineering`, `agent-eval`, `agent-safety` | 30 | No hay SDK de modelos ni prompts |
| `network` | Conexiones y puertos | `**/Dockerfile`, `docker-compose*.yml`, `**/nginx/**`, `**/*.conf`, `**/*proxy*`, `**/*cors*` | `hardening`, `security-scan` | 60 | Ningún glob casa con nada |
| `backups` | Copias de seguridad | `**/backup*/**`, `**/*backup*`, `supabase/**` | `backups` | 90 | No hay base de datos |
| `code-review` | Revisión de código | `src/**`, `app/**`, `lib/**`, `backend/**`, `frontend/**`, `packages/**`, `server/**` | `code-review` | 14 | Nunca |
| `observability` | Observabilidad | `**/*logger*`, `**/*logging*`, `**/telemetry/**`, `**/monitoring/**`, `**/*sentry*`, `**/*otel*` | `observability` | 60 | Ningún glob casa con nada |
| `accessibility` | Accesibilidad | los mismos `paths` que `frontend` | `mejor-accesibilidad`, `accessibility` | 60 | Se oculta `frontend` |
| `performance` | Rendimiento | los `paths` de `frontend` y de `api-endpoints` que no se oculten | `performance` | 90 | Se ocultan `frontend` y `api-endpoints` |
| `ci-deploy` | CI y despliegue | `.github/**`, `.gitlab-ci.yml`, `**/Dockerfile`, `vercel.json`, `netlify.toml`, `fly.toml`, `render.yaml`, `railway.json` | `github-actions`, `deployment` | 60 | Ningún glob casa con nada |
| `hardening` | Auditoría completa | la unión de los `paths` de `api-endpoints`, `security`, `secrets`, `database` y `network` que no se oculten | `hardening` | 90 | Nunca |

La primera skill de `reviewSkills` es la que recomienda `scan` cuando la zona pide revisión.

## Esquema de `overview.json`

```json
{
  "version": 1,
  "project": "nombre",
  "updated": "2026-11-07",
  "zones": [
    {
      "id": "api-endpoints",
      "label": "Endpoints API",
      "paths": ["**/routers/**", "app/**/route.ts"],
      "reviewSkills": ["security-scan", "secure-coding", "api-design"],
      "cadenceDays": 30,
      "checks": [{ "id": "authz-per-object", "label": "…", "skill": "secure-coding", "status": "unknown", "date": "2026-11-07", "note": "" }]
    }
  ],
  "hiddenZones": [{ "id": "ai", "reason": "No hay SDK de modelos en package.json ni en pyproject.toml" }],
  "sources": [{ "doc": "docs/spec.md", "version": "v2, 2026-10-30", "author": "…", "notes": "borrador; leído entero" }],
  "verifications": [
    { "what": "Supabase local", "result": "verified", "evidence": "psql: 12 tablas", "at": "2026-11-07" },
    { "zone": "docs", "date": "2026-11-07", "agent": "overview-verifier", "ok": false, "notes": ["README cita `npm run dev`, que no está en package.json"] }
  ],
  "questions": [
    { "id": "multitenant", "zone": "users", "text": "…", "state": "decided", "answer": "…", "source": "usuario, 2026-11-07", "who": "user" },
    { "id": "mobile-https", "zone": "mobile", "text": "…", "state": "decided", "notApplicable": true, "answer": "No hay móvil: es un panel de escritorio", "source": "docs/spec.md §2", "who": "user" }
  ],
  "pendingMessage": { "to": "interlocutor", "questions": ["data-credentials"], "parked": ["data-quality"] }
}
```

- El motor lee `zones[]`, `questions[]` (para el KPI de preguntas abiertas) y las verificaciones de zona de `verifications[]`; el resto lo escribe y lee el agente.
- `questions[].state`: `verified`, `documented`, `contradiction`, `proposal`, `external`, `open` o `decided` (los siete estados de [`start.md`](start.md)). `notApplicable: true` marca la que no aplica, con el motivo en `answer`.
- `questions[].zone` es el grupo de [`questions.md`](questions.md) (`problem`, `users`, `frontend`…).
- `verifications[]` guarda dos tipos de entrada:
  - las de `start`, de acceso a sistemas: `{what, result, evidence, at}`, con `result` `verified`, `failed` o `untested`;
  - las de zona, que deja `scan` tras su subagente: `{zone, date, agent, ok, notes[]}`. `ok` dice si los docs cuadran con el código de la zona. El dashboard enseña la última de cada zona.
- `checks[].status`: `unknown`, `pass`, `fail` o `na` (ver [`checks.md`](checks.md)), y `date`, la fecha en que se evaluó.
