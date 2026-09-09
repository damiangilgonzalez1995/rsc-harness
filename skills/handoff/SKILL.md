---
name: handoff
description: "Compacts the current conversation into a handoff document so another agent can continue the work."
tags: ["handoff", "documentation", "continuity"]
profiles: [core, ui, full]
---

Redacta un documento de traspaso que resuma la conversación actual para que un agente nuevo pueda continuar con el trabajo. 

Guárdalo en el directorio temporal del sistema operativo del usuario, no en el espacio de trabajo actual.

Incluye una sección de "skills sugeridas" en el documento, que recomiende las skills que el agente debería invocar.

No dupliques contenido que ya esté recogido en otros artefactos (PRDs, planes, ADRs, issues, commits, diffs). En su lugar, haz referencia a ellos mediante su ruta o URL.

Redacta (oculta) cualquier información sensible, como claves de API, contraseñas o información de identificación personal.

Si el usuario pasó argumentos, trátalos como una descripción de aquello en lo que se centrará la siguiente sesión y adapta el documento en consecuencia.