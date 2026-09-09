# muscle-memory — gimnasio de práctica de Python

> La skill más compleja de esta biblioteca. Este README la presenta y documenta
> todos sus archivos. Las instrucciones que Claude ejecuta viven en
> [`SKILL.md`](SKILL.md); aquí se explica **qué es y cómo está montada**.

## Qué es

Un **gimnasio de código**: mantiene en forma tu habilidad de programar **a mano**
cuando delegas la mayor parte del código en agentes de IA.

La idea diferencial: los ejercicios (**katas**) **salen de tu propio código
reciente**, no de ejercicios genéricos. La skill escanea tu repositorio, encuentra
funciones/métodos con lógica real, y los **reconstruye** como katas pequeñas
(resolubles en 10 minutos o menos) que reconoces como tuyas — pero despojadas de
sus dependencias, para que se puedan resolver de forma aislada.

Resuelves las katas en una **app web local (offline)** con feedback instantáneo
verde/rojo, y tu progreso se guarda entre sesiones con **repetición espaciada**
(los conceptos que fallas vuelven antes; los que dominas se retiran).

## Cómo funciona: 3 modos

La skill detecta el modo según lo que pidas:

| Modo | Se activa con frases como | Qué hace |
|---|---|---|
| **Generar** (por defecto) | "quiero practicar", "ponme ejercicios" | Escanea el repo y monta una sesión nueva de katas (7 por defecto). |
| **Corregir** | "revisa mi solución", "corrige esto" | Ejecuta tu solución contra los tests, la compara con la canónica y te da feedback (tono coach). |
| **Progreso** | "cómo voy", "sube el nivel", "ya no quiero practicar X" | Informe de estado, ajusta niveles o retira/reactiva un tema. |

### El flujo de "Generar" (resumido)

1. `scan_repo.py` busca en tu repo los mejores **candidatos de reconstrucción**
   (funciones con lógica real, ordenadas por peso).
2. Claude **reconstruye** cada candidato como kata autocontenida (mismo nombre y
   lógica reales, sin las dependencias del framework).
3. `validate_library.py` comprueba que cada kata pasa sus propios tests y usa solo
   la librería estándar.
4. `build_session.py` empaqueta la sesión para la app web.
5. Se abre la app en el navegador; resuelves y pulsas *Run*.

## Estructura de archivos

```
muscle-memory/
├── SKILL.md                     Instrucciones que ejecuta Claude (los 3 modos)
├── README.md                    Este documento (presentación de la skill)
├── .gitignore                   Ignora cachés y datos locales (.superpowers/, etc.)
│
├── assets/                      Plantillas que se COPIAN al gimnasio del usuario
│   ├── app/
│   │   └── index.html           La app web offline (interfaz del gimnasio)
│   ├── user-readme.md           README que se copia dentro de la carpeta del usuario
│   └── library-seed/            Biblioteca semilla de katas genéricas (fallback)
│       └── <concepto>/
│           ├── card.md          Explicación del concepto
│           └── katas/
│               └── l<N>-*.json  Katas de ese concepto por nivel (l1..l4)
│
├── scripts/                     Herramientas en Python
│   ├── scan_repo.py             Escanea el repo y saca candidatos de reconstrucción
│   ├── build_session.py         Construye una sesión para la app desde un JSON
│   └── validate_library.py      Valida que las katas pasan sus tests (solo stdlib)
│
├── tests/                       Tests (pytest) de los tres scripts
│   ├── test_scan_repo.py
│   ├── test_build_session.py
│   └── test_validate_library.py
│
├── references/
│   └── kata-authoring.md        Guía para crear katas (incluye el "gotcha" técnico)
│
└── docs/                        Diseño y plan de la skill
    ├── 2026-07-16-muscle-memory-design.md
    └── plans/2026-07-16-muscle-memory.md
```

### Los scripts, en detalle

- **`scan_repo.py`** — `python scan_repo.py --days 7 --repo <ruta>`. Lee los `.py`
  modificados recientemente e imprime dos bloques: `## Reconstruction candidates`
  (el material principal: símbolos reales con su peso de lógica) y
  `## Candidate concepts` (para progreso/niveles).
- **`build_session.py`** — `python build_session.py <sesion.json> <GYM>`. Escribe
  la sesión (`sessions/<id>.js`), regenera el manifiesto, guarda las soluciones
  canónicas, registra la sesión en `progress.json` y añade una línea a `history.md`.
- **`validate_library.py`** — `python validate_library.py <carpeta>`. Comprueba que
  cada kata pasa sus tests y usa solo la librería estándar; imprime `PASS`/`FAIL`.

### La biblioteca semilla (fallback)

`assets/library-seed/` contiene katas genéricas organizadas por concepto, usadas
**solo** cuando el escaneo del repo no da suficiente material real. Conceptos
incluidos (20):

`adapter`, `async`, `classes`, `comprehensions`, `context-managers`, `dataclasses`,
`decorators`, `dunder-methods`, `enums`, `exceptions`, `factory`, `generators`,
`inheritance`, `iterators`, `methods`, `observer`, `properties`, `singleton`,
`strategy`, `typing`.

Cada concepto trae un `card.md` (explicación) y una o varias katas por nivel
(`l1` = básico … `l4` = avanzado).

## Dónde viven tus datos (no están en este repo)

Al usar la skill, se crea una carpeta `muscle-memory/` **dentro del proyecto en el
que trabajas** (ignorada por git), con tu app, tus sesiones, tus soluciones y tu
`progress.json`. Es **por proyecto** a propósito: practicas sobre el código que
realmente estás tocando. Nada de eso está en este repositorio público — aquí solo
está la skill "de fábrica", no tu progreso personal.

## Nota técnica (gotcha)

El validador corre en **CPython**, no en el navegador (Pyodide). Al crear katas
asíncronas, los tests deben ser `async def` + `await`, **nunca** `asyncio.run(...)`
(rompe dentro del navegador). Detalle completo en
[`references/kata-authoring.md`](references/kata-authoring.md).
