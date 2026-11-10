---
name: redesign
description: "Rediseño completo de interfaz en cascada: crea PRODUCT.md/DESIGN.md si faltan, lanza 5 subagentes en paralelo (crítica, tipografía, color, movimiento, galería), consolida resultados y programa el rediseño. Una skill que orquesta todo."
tags: [ui, ux, design, orchestration, impeccable, emil]
profiles: [ui, full]
requires: [impeccable]
origin: damiangil
---

# Redesign — rediseño completo en cascada

Una skill, todo el pipeline. No eliges qué lanzar: se lanzan los 5 análisis en paralelo y decides después qué aplicar.

## Requisito

`impeccable` debe estar instalada (`npx impeccable install`). Sin ella, este flujo no funciona.

## Flujo

### 1. Contexto (automático)

Si no existe `PRODUCT.md` → créalo con los datos del proyecto (no preguntes, infiere del código).
Si no existe `DESIGN.md` → créalo documentando el sistema visual actual.

### 2. Capturas "antes"

Crea la carpeta de la ejecución, `docs/redesign/<AAAA-MM-DD>/`, y guarda en `capturas/antes/` un PNG
por cada pantalla principal del estado actual. Se usan en el informe y en el contraste final.

### 3. Lanzar subagentes (en paralelo)

Lanza 5 subagentes en worktrees aislados, todos a la vez:

| Agente | Entrega | Capítulos Impeccable | Skills Emil |
|--------|---------|---------------------|-------------|
| **crítica** | Lista priorizada de problemas UX | `reference/critique.md`, `reference/audit.md` | — |
| **tipografía** | Propuesta tipográfica con escala | `reference/typography.md`, `reference/hierarchy.md` | — |
| **color** | Paleta nueva + tokens | `reference/color.md`, `reference/dark-mode.md` | — |
| **movimiento** | Dónde animar, dónde quitar, qué curvas | `reference/motion.md`, `reference/performance.md` | `animar`, `choreograph`, `animation-performance` |
| **galería** | 3 direcciones de estilo con referencias | `reference/style-guide.md`, `reference/inspiration.md` | `tastemaker` |

Cada subagente recibe:
- Ruta exacta a los capítulos que debe leer
- El PRODUCT.md y DESIGN.md del proyecto
- Instrucción de entregar solo hallazgos, no implementar
- La sección «Formato de los hallazgos» de [`informe.md`](informe.md): deja su resultado en `hallazgos/<agente>.json` con esa forma

### 4. Informe y elección

Cuando los 5 JSON estén en `hallazgos/`, lanza un subagente nuevo, **consolidar-informe**, con el
contenido de [`informe.md`](informe.md) y la ruta de la carpeta de la ejecución. Él monta
`informe.html`; tú no lees los cinco informes, así tu contexto queda libre para lo que sigue.

Abre el informe en el navegador y pregunta en la terminal solo lo que trae **Tu decisión**: qué
dirección de estilo sigue el usuario (de las 3 de galería) y qué hallazgos aplica.

### 5. Prototipo navegable

Con la dirección elegida, genera un prototipo HTML navegable de las pantallas principales en
`prototipo/` y guarda sus capturas en `capturas/despues/`. No toca el código real todavía.

### 6. Contrastar

Vuelve a lanzar **consolidar-informe** sobre la misma carpeta: añade la sección **Antes / después**
al mismo `informe.html`. Ábrelo y confirma con el usuario antes de tocar código.

### 7. Programar

Solo tras confirmación: aplica los cambios usando las skills de pulido (`revision-interfaz`, `mejor-*`) y movimiento (`animar`, `choreograph`).

## Invocación

```
/redesign
```

Sin argumentos. Todo se lanza automático.

## Lo que NO hace

- No pregunta qué análisis lanzar (los lanza todos)
- No pregunta por PRODUCT.md/DESIGN.md (los crea si faltan)
- No implementa sin confirmación del prototipo
