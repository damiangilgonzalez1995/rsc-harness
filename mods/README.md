# mods

Mods de Claude Code para probar de uno en uno. No se publican con el paquete npm (`files` de `package.json` no incluye `mods/`).

| Mod | Origen | Qué hace |
| --- | --- | --- |
| `context-bar` | ídem | barra de contexto; `/context-bar` la enciende o apaga |
| `prompt-enhancer` | propio | botones Enhance / Send; Enhance reescribe el borrador en la caja |
| `modelo-justo` | propio | clasifica la petición y cambia a Haiku/Sonnet/Opus; `/modelo-justo on\|off` |
| `where-am-i` | catálogo (MIT, copiado y revisado) | resumen vivo encima del prompt; `/where` da uno largo |

## Probar uno (sin instalarlo)

Cada terminal carga solo su mod con `--plugin-dir`:

```powershell
.\mods\probar.ps1 -Lista               # nombres
.\mods\probar.ps1 usage-meter          # este mod, en esta terminal
.\mods\probar.ps1 -Nuevas              # una pestaña de Windows Terminal por mod
```

Equivale a `claude --plugin-dir mods/plugins/<mod>`.

## Instalar los que te gusten

Dentro de Claude Code, en la terminal:

```
/plugin marketplace add damiangilgonzalez1995/rsc-harness
/plugin install prompt-enhancer@harness-mods
```

Elige alcance **User** para tenerlo también en la pestaña Code de la app de escritorio.
