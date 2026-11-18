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
| **galería** | 3 direcciones de estilo con referencias reales | `reference/style-guide.md`, `reference/inspiration.md` | `tastemaker` + Inspo MCP si está conectado |

Cada subagente recibe:
- Ruta exacta a los capítulos que debe leer
- El PRODUCT.md y DESIGN.md del proyecto
- Instrucción de entregar solo hallazgos, no implementar
- La sección «Formato de los hallazgos» de [`informe.md`](informe.md): deja su resultado en `hallazgos/<agente>.json` con esa forma

**Galería con Inspo.** Si el MCP Inspo está conectado (herramientas `mcp__inspo__*`), la galería saca sus referencias de ahí antes de proponer nada. Busca webs reales por el estilo del PRODUCT.md (`search_screens`), por los colores actuales (`find_by_color`) y por cada sección que se rediseña (`find_examples_for_macrostructure`). Cada una de las 3 direcciones va anclada a 2 o 3 webs con su URL y una frase de qué se toma de cada una: el principio, no los píxeles. Si Inspo no está conectado, la galería sigue como siempre. En el informe final se ofrece una vez instalarlo, si en la sesión no se ha ofrecido ya (el comando está en `skills/design/references/inspiration-sources.md`).

### 4. Informe y elección

Cuando los 5 JSON estén en `hallazgos/`, lanza un subagente nuevo, **consolidar-informe**, con el
contenido de [`informe.md`](informe.md) y la ruta de la carpeta de la ejecución. Él monta
`informe.html`; tú no lees los cinco informes, así tu contexto queda libre para lo que sigue.

Abre el informe en el navegador y pregunta en la terminal solo lo que trae **Tu decisión**: qué
dirección de estilo sigue el usuario (de las 3 de galería) y qué hallazgos aplica.

### 5. Prototipo navegable

Con la dirección elegida, genera un prototipo HTML navegable de las pantallas principales en
`prototipo/` y guarda sus capturas en `capturas/despues/`. No toca el código real todavía.

**Primero estático.** El prototipo va sin animaciones: maquetación, tipografía y color quietos. Una animación tapa un layout flojo, así que el movimiento no entra hasta que la versión quieta convence.

### 6. Contrastar

Vuelve a lanzar **consolidar-informe** sobre la misma carpeta: añade la sección **Antes / después**
al mismo `informe.html`. Ábrelo y confirma con el usuario antes de tocar código.

### 7. Programar

Solo tras confirmación, en dos tiempos: primero la versión estática con las skills de pulido (`revision-interfaz`, `mejor-*`); cuando esa pasa la revisión, el movimiento con `animar` y `choreograph`, usando el informe del subagente de movimiento.

## Invocación

```
/redesign
```

Sin argumentos. Todo se lanza automático.

## Lo que NO hace

- No pregunta qué análisis lanzar (los lanza todos)
- No pregunta por PRODUCT.md/DESIGN.md (los crea si faltan)
- No implementa sin confirmación del prototipo
