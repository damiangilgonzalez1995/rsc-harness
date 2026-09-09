# muscle-memory — Diseño

Fecha: 2026-07-16 · Estado: aprobado en conversación · Sustituye al prototipo `gimnasio-codigo.skill`

## 1. Objetivo

Skill de Claude Code para que quien delega mucho en agentes de código no pierda la mano programando. Genera mini-ejercicios (katas) de Python inspirados en el código reciente de los repos del usuario, que se resuelven en una app web local con corrección instantánea, y lleva un progreso con repetición espaciada.

Problemas del prototipo que este diseño corrige:

1. **Lentitud**: cada sesión regeneraba un HTML de ~900 líneas desde cero. Ahora la app es estática (se instala una vez) y generar una sesión es seleccionar y adaptar esqueletos ya escritos, no redactar.
2. **Ensuciaba el repo**: creaba `gimnasio/` dentro del proyecto analizado. Ahora todo vive en una carpeta central única; los repos solo se leen.
3. **UI de plantilla**: al diseñarse la app una sola vez, puede pulirse de verdad.
4. **Nombre e idioma**: pasa a `muscle-memory`; código, UI y estructura en inglés. Los enunciados y el feedback de las katas se generan en el idioma del usuario.

## 2. Decisiones cerradas

| Decisión | Valor |
|---|---|
| Nombre | `muscle-memory` (skill y carpeta central) |
| Audiencia | El usuario ahora; diseñada portable para compartirla después |
| Ejecución del código de katas | 100% navegador (Pyodide). Solo stdlib. Nunca toca la máquina ni Docker |
| Lenguaje de las katas | Python a fondo (catálogo amplio). Arquitectura preparada para otros lenguajes, sin construirlos |
| Idioma | Código/UI/estructura en inglés; enunciados y feedback en el idioma del usuario |
| Biblioteca de conceptos | Doble uso: chuleta de estudio para el usuario + catálogo de ideas para el generador |
| Ubicación de datos | Carpeta central única `~/muscle-memory/`, independiente de todo repo |

## 3. Arquitectura: dos piezas

### 3.1 La skill (lógica) — `~/.claude/skills/muscle-memory/`

```
muscle-memory/
├── SKILL.md                  Flujos: bootstrap, generate, review, progress
├── references/
│   └── kata-authoring.md     Cómo escribir/adaptar katas y tests (evolución del doc del prototipo)
├── scripts/
│   └── scan_repo.py          Escáner AST de repos (evolución de analizar_git.py, salida en inglés)
└── assets/
    ├── app/
    │   └── index.html        La app web pulida, autocontenida
    └── library-seed/         Biblioteca semilla (fichas + esqueletos de kata)
```

### 3.2 La carpeta del usuario (datos) — `~/muscle-memory/`

Creada por el flujo *bootstrap* la primera vez. La skill nunca escribe fuera de ella.

```
~/muscle-memory/
├── app/
│   └── index.html            Copiado del asset en bootstrap; NO se regenera por sesión
├── sessions/
│   ├── manifest.js           window.MM_MANIFEST = ["2026-07-16-ati-platform.js", ...]
│   ├── <session-id>.js       Una sesión: window.MM_SESSIONS.push({...})
│   └── canonical/
│       └── <session-id>__<kata-id>.py   Solución canónica adaptada (no visible en la app)
├── library/
│   └── <concept>/
│       ├── card.md           Ficha de estudio
│       └── katas/
│           └── l<nivel>-<slug>.json     Esqueletos de kata listos
├── solutions/                Aquí descarga el usuario sus soluciones para revisión
├── progress.json             Progreso, repetición espaciada y temas excluidos
├── history.md                Track record legible (diario de sesiones y decisiones)
└── README.md                 Qué es cada cosa, cómo abrir la app
```

## 4. Formatos de datos

### 4.1 Sesión (`sessions/<session-id>.js`)

JS y no JSON para poder cargarse desde `file://` sin servidor (los `fetch` de JSON locales los bloquea CORS; los `<script>` no). `session-id` = `YYYY-MM-DD-<repo-slug>` (sufijo `-2`, `-3`... si hay varias el mismo día).

```js
window.MM_SESSIONS = window.MM_SESSIONS || [];
window.MM_SESSIONS.push({
  "id": "2026-07-16-ati-platform",
  "date": "2026-07-16",
  "project": "ATI_PLATFORM",
  "title": "Session 12 - context managers, strategy, typing",
  "lang": "es",
  "katas": [
    {
      "id": "kata-01",
      "title": "Reconstruye el context manager",
      "concept": "context-managers",
      "level": 2,
      "spec_html": "<p>...enunciado en el idioma del usuario...</p>",
      "stub": "class Cronometro:\n    # TODO\n    ...",
      "test": "def test_...():\n    assert ..., \"mensaje didactico\""
    }
  ]
});
```

El JSON de cada sesión se construye con `json.dumps` (script o python inline), nunca a mano, para no romper el escapado.

### 4.2 Manifest (`sessions/manifest.js`)

Lista de archivos de sesión, el más reciente primero. La skill lo reescribe al crear cada sesión. La app lo carga con `<script>` y después inyecta dinámicamente un `<script src="sessions/<file>">` por entrada (funciona en `file://`).

### 4.3 Ficha de biblioteca (`library/<concept>/`)

- `card.md`: explicación corta del concepto, ejemplo idiomático, errores típicos, y en qué código real se suele ver. Legible como chuleta; usable por el generador como contexto.
- `katas/l<nivel>-<slug>.json`: esqueleto completo listo para usar o adaptar:

```json
{
  "concept": "context-managers",
  "level": 2,
  "title_en": "Rebuild the context manager",
  "spec_html_en": "<p>...</p>",
  "stub": "...",
  "test": "...",
  "canonical": "..."
}
```

Los esqueletos se escriben en inglés (neutro, compartible); al generar la sesión se traducen/adaptan al idioma del usuario y al dominio del repo.

### 4.4 Progreso (`progress.json`)

```json
{
  "concepts": {
    "context-managers": {"seen": 3, "passed": 2, "last": "2026-07-15", "level": 2}
  },
  "excluded": ["singleton"],
  "sessions": [
    {"id": "2026-07-16-ati-platform", "concepts": ["context-managers", "strategy", "typing"],
     "skeletons": ["context-managers/l2-timer", "strategy/l2-discounts", "typing/l1-hints"]}
  ]
}
```

Lo escribe solo Claude (en *review* y *generate*). El `localStorage` del navegador guarda únicamente estado de UI (código en curso, katas superadas en verde) y no es fuente de verdad.

- `excluded`: temas que el usuario ha retirado ("esto ya me lo sé"). La generación NUNCA los elige; solo se reactivan si el usuario lo pide.
- `sessions[].skeletons`: qué esqueletos de la biblioteca se usaron (`<slug>/<archivo sin .json>`), para no repetir el mismo ejercicio en sesiones cercanas.

### 4.5 Track record legible (`history.md`)

Diario humano del entrenamiento, en la raíz de `~/muscle-memory/`. Doble uso: el usuario lo lee ("qué hice esta semana"), y Claude lo consulta antes de generar para balancear temas. Una entrada por evento, append-only:

```markdown
## 2026-07-16 — ATI_PLATFORM
- Sesion: context managers (N2), strategy (N2), typing (N1)
- Resultado: 2/3 en verde; typing fallada (olvido de Optional)

## 2026-07-17
- Usuario retira "singleton": ya lo domina. No volver a proponerlo.
```

Lo actualizan los flujos: *generate* anota la sesión creada, *review* anota resultados, y *progress* anota retiradas/reactivaciones y cambios de nivel. Reglas de balanceo al generar: no repetir un concepto dominado dos sesiones seguidas (los fallados sí repiten: repetición espaciada), no reutilizar un esqueleto ya usado en las últimas 3 sesiones (variar de la biblioteca o adaptar distinto), y nunca proponer temas en `excluded`.

## 5. Flujos de la skill

### 5.0 Bootstrap (primera vez, automático)

Si `~/muscle-memory/` no existe: copiar `assets/app/` y `assets/library-seed/` → `app/` y `library/`, crear `sessions/`, `solutions/`, `progress.json` vacío y `README.md`. Idempotente: si existe, no toca nada (salvo actualización explícita de la app pedida por el usuario).

### 5.1 Generate (por defecto): "ponme ejercicios", "quiero practicar"

1. Ejecutar `scan_repo.py --days 7 --repo <cwd>` (funciona desde cualquier repo). Sin git o sin Python reciente → avisar y ofrecer elegir tema de la biblioteca.
2. Elegir 3 conceptos (configurable) por prioridad: fallados según `progress.json` (repetición espaciada) → nuevos en el código de la semana → fundamentos relacionados. Aplicando el balanceo de §4.5: descartar los `excluded`, no repetir un concepto dominado dos sesiones seguidas, y no reutilizar esqueletos de las últimas 3 sesiones (`sessions[].skeletons`).
3. Para cada concepto: coger de `library/<concept>/katas/` el esqueleto del nivel que toque y **adaptarlo**: enunciado al idioma del usuario (el idioma en que conversa con Claude; queda registrado en el campo `lang` de la sesión) y contexto/nombres al dominio del repo (p. ej. la kata de strategy usa "descuento de tarifas de mantenimiento" si el repo es ATI). Si la adaptación no aporta, usarlo tal cual traducido. Si el concepto no tiene ficha, crearla (card + 1-2 esqueletos) y dejarla en la biblioteca: crece una vez, sirve siempre.
4. Escribir `sessions/<session-id>.js`, actualizar `manifest.js`, guardar canónicas adaptadas en `sessions/canonical/`.
5. Registrar la sesión en `progress.json` (incluidos los `skeletons` usados), añadir la entrada del día a `history.md`, y decirle al usuario que abra (o recargue) `~/muscle-memory/app/index.html`.

Presupuesto de velocidad: pasos 1-5 sin crear fichas nuevas deben ser un puñado de operaciones cortas (~1 min de trabajo del agente). Crear fichas nuevas es lo único que puede tardar más, y se amortiza.

### 5.2 Review: "revisa mi solución"

1. Leer de `solutions/` (o del chat).
2. Ejecutar la solución contra los tests de la kata con el Python local si lo hay (todo es stdlib); si no hay Python en la máquina, usar el resultado verde/rojo que reporta el usuario desde la app y decirlo explícitamente.
3. Revisión cualitativa: comparar con la canónica de `sessions/canonical/`, mostrar mejoras como **diff**, máximo 2-3 puntos, tono entrenador (celebrar antes de corregir).
4. Actualizar `progress.json` (acierto/fallo, subir nivel si hay varios aciertos seguidos) y anotar el resultado en `history.md`.

### 5.3 Progress: "¿cómo voy?", "sube el nivel", "ya no quiero practicar X"

Resumen corto desde `progress.json` + `history.md` (dominados, flojos, qué toca) y ajustes manuales: nivel, añadir conceptos, y **retirar temas** ("esto ya me lo sé") → añadir el slug a `excluded` y dejar constancia en `history.md`; reactivar si el usuario lo pide.

## 6. La app web

Un solo `index.html` autocontenido (CSS y JS inline). Requisitos:

- **Funciona con doble clic** (`file://`), sin servidor. Única dependencia externa: CDN de Pyodide y CodeMirror (requiere internet).
- **Pantallas**: selector de sesiones (historial con fecha, proyecto y estado), vista de kata (enunciado, editor con resaltado, botones Run / Download solution / Reset), y panel de progreso (conceptos superados por sesión, a partir del estado local).
- **Runner**: Pyodide ejecuta código del usuario + tests `test_*` en el mismo namespace; resultados por test con mensaje del assert; distinción entre "no compila" y "test falla" (heredado del prototipo, que funcionaba bien).
- **UI**: en inglés, cuidada (se diseña una vez): tema claro/oscuro, responsive, estados de carga de Pyodide claros, celebración al pasar todo en verde. El diseño visual concreto se decide en implementación con la skill de frontend-design.
- **Persistencia local**: código en curso y katas superadas en `localStorage`, con clave por sesión+kata.
- **Download solution**: descarga `.py` con cabecera (kata, concepto, fecha) para dejar en `solutions/`.

## 7. Catálogo semilla de la biblioteca (~18 conceptos)

Fundamentos: classes & `__init__` · instance/static/class methods · properties · dataclasses · dunder methods · inheritance & `super()` · exceptions (custom, try/except/else/finally) · typing (`Optional`, `Union`, `TypedDict`, `Protocol`) · enums.

Intermedio: context managers · decorators (con y sin argumentos) · generators & `yield` · comprehensions · iterators · async/await básico.

Patrones: factory · strategy · observer · adapter · singleton (con su crítica).

Cada uno con `card.md` + 2-3 esqueletos de kata en niveles distintos (N1 recuerdo, N2 reconstrucción, N3 aplicación, N4 refactor). Reglas de las katas (del prototipo, se mantienen): ≤25 líneas a escribir, ≤10 min, un solo concepto, stub con firmas puestas, 2-3 asserts con mensajes didácticos, solo stdlib.

## 8. Fuera de alcance (explícito)

- Otros lenguajes (TypeScript, etc.): la estructura `library/<concept>/` y el campo `concept` no presuponen Python, pero no se construye nada más.
- `micropip`/paquetes externos en el navegador.
- Servidor local, cuentas, sync entre máquinas.
- Empaquetado/distribución pulida de la skill (fase "compartible después").

## 9. Criterios de éxito

1. Desde un repo cualquiera, "ponme ejercicios" produce una sesión de 3 katas abrible con doble clic en <2 min de principio a fin.
2. Cero escrituras fuera de `~/muscle-memory/`.
3. Una kata se resuelve en <10 min y el verde/rojo funciona offline de lógica (solo CDN al cargar).
4. Un concepto fallado reaparece en la siguiente sesión; uno dominado sube de nivel.
5. La biblioteca es legible como material de estudio por sí sola.
