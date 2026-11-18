# Harness decisions

- Accepted plan `4d1eeb275eb784fe265d0176350244fc5ad3f92a6cf0836238630308ad7cf110`.
- Project kind: software.
- SDD: selected.

## 2026-11-18 · Inspo MCP como fuente de ideas de diseño

- **Opciones:**
  1. instalar la skill `cook`;
  2. solo documentar Inspo;
  3. integrar Inspo en el aviso de inicio, `redesign`, `design-loop` y `flujo-interfaz`.
- **Elegida: la 3.** `cook` duplica a `design-loop` y `variant-explorer`, y una nota en la documentación no la lee nadie cuando le faltan ideas.
- `.no-inspo` es un opt-out de máquina: conectar un MCP es consentimiento individual, como Context7.
- **Regla nueva:** primero estático, después movimiento.
- Fuente: `raw/worklog/2026-11-18-inspo-mcp-diseno.md`.

## 2026-11-18 · sweep y el archivo cerrado
- El contexto obsoleto se archiva (se mueve a `docs/archive/`), nunca se borra, y solo con permiso. Lo que no tiene pruebas no se toca.
- El agente no puede leer `docs/archive/` (hook `archive-guard`), pero puede mover cosas hacia dentro. Es una decisión de equipo: `.no-archive-guard` es un opt-out de proyecto.
- Spec contra código: el `status:` del ticket decide. En lo completed manda el código; en lo pendiente, la spec. Un conflicto se pregunta.
