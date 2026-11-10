# Comprobaciones senior por zona

Lo que un senior revisa en cada zona y se suele echar de menos cuando ya es tarde. `start` siembra estas comprobaciones en el `checks[]` de cada zona de `overview.json`, con `status: "unknown"`; `scan` y las skills de revisión las actualizan.

Cada comprobación se escribe así en la zona:

```json
{ "id": "rate-limiting", "label": "Rate limiting en login, registro y endpoints caros", "skill": "secure-coding", "status": "unknown", "note": "" }
```

- `status`: `unknown` (sin mirar), `pass` (comprobado con evidencia), `fail` (falla; `note` dice dónde) o `na` (no aplica; `note` dice por qué).
- `pass` exige la prueba de la columna **Prueba**, nunca «parece bien».
- `skill` es la que la revisa; si el proyecto usa otra, se cambia en `overview.json`.

## `security` y `secrets` — los 10 puntos

Revísalos **cada mes y antes de lanzar**. Son el mínimo, no una auditoría: la auditoría es `hardening`. El detalle de cada prueba está en `secure-coding` (`references/pre-publish.md`).

| Zona | id | Comprobación | Skill | Prueba |
|---|---|---|---|---|
| `security` | `rate-limiting` | Rate limiting en login, registro, recuperación de contraseña, OTP y endpoints caros | `secure-coding` | Ráfaga de peticiones que acaba en 429 |
| `secrets` | `keys-out-of-code` | Claves fuera del código: en `.env` ignorado por git, nunca en el repo ni en su historia | `security-scan` | Búsqueda de secretos en el árbol y en el historial; `.env` en `.gitignore` |
| `secrets` | `prod-secrets-in-platform` | Secretos de producción en la plataforma (Vercel, Supabase, GitHub Secrets), no en ficheros ni en el YAML de CI | `secure-coding` | Lista de nombres de variables en la plataforma; CI sin valores en línea |
| `security` | `per-ip-limits` | Límites por IP además de por usuario, para quien no ha iniciado sesión | `secure-coding` | Ráfaga sin sesión desde una IP que acaba en 429 |
| `security` | `validated-inputs` | Entradas validadas con esquema y consultas parametrizadas; nada de SQL, shell ni rutas concatenadas | `security-scan` | Búsqueda de concatenación en consultas y `shell=True`; esquemas en cada entrada |
| `security` | `server-validation` | Validación en el servidor: la del navegador es solo experiencia de uso | `secure-coding` | Petición directa a la API, saltándose el front, que se rechaza |
| `security` | `rls` | RLS: cada usuario ve solo sus datos (o el filtro por dueño en cada consulta) | `supabase` | Consulta con la sesión de otro usuario que no devuelve nada |
| `security` | `hashing-encryption` | Contraseñas con hash lento (Argon2id o bcrypt) y datos sensibles cifrados | `secure-coding` | Algoritmo de hash en el código; columna sensible cifrada |
| `security` | `session-expiry` | Sesiones que caducan, se invalidan al salir y rotan al iniciar sesión | `secure-coding` | Token caducado o de una sesión cerrada que se rechaza |
| `security` | `cors-own-domain` | CORS limitado a tu dominio, nunca `*` con credenciales | `secure-coding` | Petición con otro `Origin` que no recibe cabeceras CORS |

## `api-endpoints`

| id | Comprobación | Skill | Prueba |
|---|---|---|---|
| `authz-per-object` | Cada endpoint comprueba que el objeto es del usuario, no solo que hay sesión | `secure-coding` | Pedir el id de otro usuario devuelve 404 |
| `error-shape` | Errores con forma estable y sin trazas al cliente | `api-design` | Un error provocado no enseña la pila |
| `idempotency` | Lo que cobra, envía o crea algo aguanta un reintento sin duplicar | `api-design` | Repetir la petición no crea dos |
| `pagination` | Los listados están paginados y tienen tope | `api-design` | Un listado sin parámetros devuelve un máximo |

## `frontend`

| id | Comprobación | Skill | Prueba |
|---|---|---|---|
| `state-placement` | Cada dato vive en un sitio: servidor, URL, estado global o local del componente, sin copias que se desincronizan | `ui-engineering` | Recorrer los componentes con estado y sus fuentes |
| `hooks-rules` | Hooks y efectos sin dependencias que faltan ni efectos que hacen lo que debería hacer un evento | `react` | Lint de hooks en verde |
| `protected-routes` | Rutas protegidas también en el servidor; quien entra sin sesión va al login | `secure-coding` | Abrir una ruta privada sin sesión |
| `refresh-mid-flow` | Recargar o pulsar «atrás» a mitad de un flujo no pierde lo escrito ni deja el flujo roto | `ui-engineering` | Recargar en cada paso del flujo principal |
| `empty-error-loading` | Cada pantalla tiene estado vacío, de error y de carga | `ui-engineering` | Forzar lista vacía, API caída y red lenta |
| `hydration` | Sin errores de hidratación: nada distinto entre servidor y cliente (fechas, aleatorios, `window`) | `nextjs` | Consola limpia al cargar en producción |
| `bundle-secrets` | Ningún secreto en el bundle: solo llegan al navegador variables públicas a propósito (`NEXT_PUBLIC_`, `VITE_`) | `security-scan` | Buscar claves en el bundle construido |
| `api-client` | Una sola capa habla con la API, con tipos y manejo de errores común | `ui-engineering` | Buscar `fetch` sueltos por los componentes |

## `database`

| id | Comprobación | Skill | Prueba |
|---|---|---|---|
| `tenant-isolation` | Si es multitenant, cada tabla con datos de cliente lleva su empresa y la consulta la filtra | `supabase` | Consulta con un usuario de otra empresa |
| `migrations-versioned` | Cada cambio de esquema es una migración en git, aplicada igual en todos los entornos | `db-migrations` | El esquema de una base nueva coincide con el de producción |
| `indexes` | Índices en las columnas por las que se filtra y se une | `postgresdb` | Plan de las consultas más frecuentes |
| `no-hard-delete` | Lo que importa se anula, no se borra, y queda quién y cuándo | `postgresdb` | Buscar `DELETE` sobre tablas de negocio |

## `ai`

| id | Comprobación | Skill | Prueba |
|---|---|---|---|
| `ai-evals` | Hay casos de prueba con umbrales, y se pasan antes de cambiar un prompt o un modelo | `agent-eval` | Ejecutar los evals |
| `prompt-injection` | El texto de terceros se trata como datos, nunca como instrucciones | `agent-safety` | Caso con instrucciones incrustadas en la entrada |
| `ai-failure-path` | Tiempo de espera, reintento y mensaje al usuario si el modelo falla | `llm-pipeline` | Simular fallo del proveedor |
| `ai-cost-cap` | Tope de coste por usuario y por mes | `cost-tracking` | Superar el tope en pruebas |

## `docs`

| id | Comprobación | Skill | Prueba |
|---|---|---|---|
| `docs-match-code` | Los docs cuadran con el código: comandos, rutas, variables y endpoints existen | `technical-writing` | Ejecutar los comandos del README |
| `decisions-recorded` | Las decisiones importantes están escritas, con su motivo | `write-adr` | Cada decisión de `questions[]` en **Decidido** tiene dónde consta |

## Resto de zonas

| Zona | id | Comprobación | Skill | Prueba |
|---|---|---|---|---|
| `tests` | `critical-paths-tested` | El flujo principal tiene una prueba de punta a punta | `e2e-testing` | Ejecutarla en verde |
| `tests` | `no-flaky` | Ninguna prueba falla a ratos | `code-review` | Tres pasadas seguidas iguales |
| `dependencies` | `no-known-cves` | Sin vulnerabilidades altas o críticas alcanzables | `security-scan` | `npm audit`, `pip-audit` o equivalente |
| `dependencies` | `lockfile` | Lockfile en git e instalación reproducible (`npm ci`) | `security-scan` | Instalar desde cero |
| `network` | `exposed-ports` | Solo están abiertos los puertos que hacen falta; la base no es pública | `hardening` | Lista de puertos y reglas de entrada |
| `network` | `tls` | HTTPS en todo lo público | `hardening` | Petición por HTTP que redirige |
| `backups` | `restore-tested` | Hay copias y se ha probado a restaurar una | `backups` | Restauración en un entorno aparte |
| `code-review` | `reviewed-before-merge` | Todo cambio pasa revisión antes de fusionarse | `code-review` | Revisiones registradas en `docs/overview/reviews/` |
| `observability` | `errors-tracked` | Los errores de producción llegan a algún sitio con contexto y sin datos personales | `observability` | Error provocado que aparece en el panel |
| `accessibility` | `keyboard-and-labels` | Todo se usa con teclado, con foco visible y etiquetas en los formularios | `mejor-accesibilidad` | Recorrer el flujo principal con el tabulador |
| `performance` | `slow-paths` | Las pantallas y endpoints principales responden dentro de su presupuesto | `performance` | Medir el flujo principal |
| `ci-deploy` | `ci-runs-tests` | La CI ejecuta las pruebas y bloquea si fallan | `github-actions` | Una PR con un test roto queda en rojo |
| `ci-deploy` | `rollback` | Se puede volver a la versión anterior | `deployment` | Plan de vuelta atrás escrito |
| `hardening` | `audit-done` | Auditoría por zonas antes de lanzar | `hardening` | Informe de `hardening` con fecha |
