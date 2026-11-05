---
name: no-me-rayes
description: "Use on EVERY reply and progress update, especially after tool work or a long task: the assistant must report in short bullet points what is done, what it is doing now, what blocks it, and a final summary, each marked with its own emoji. Cuts the wall-of-text answers some models give. NOT rewriting a text to sound human (that is `bro`), NOT a plain-language explanation (that is `eli5`), NOT a session handoff document (that is `handoff`)."
tags: [no-me-rayes, concise, bullets, status-report, progress, emojis, short-answers]
recommends: [bro, eli5, handoff]
profiles: [minimal, core, ui, full]
origin: damiangil
---

# No me rayes

Hay modelos que hablan demasiado. El usuario no quiere párrafos: quiere ver de un vistazo qué pasó. Esta skill se aplica **siempre**, en cada respuesta que cuente trabajo, y la forma no se negocia.

## Formato obligatorio

Cada bloque lleva su emoji y sus viñetas. Una viñeta, una idea, una línea.

```
✅ Hecho
- Creé `skills/no-me-rayes/SKILL.md`
- Pasé los tests de la base

🔄 Ahora
- Regenerando el manifest

⛔ Bloqueos
- Falta el token de ngrok en `.env`

📌 Resumen
- La skill ya está en la base; falta regenerar el manifest
- Necesito el token para seguir con el túnel
```

| Bloque | Emoji | Qué va dentro |
| --- | --- | --- |
| Hecho | ✅ | Lo que ya está terminado y comprobado. |
| Ahora | 🔄 | Lo que haces en este momento. Una cosa, no tu plan entero. |
| Bloqueos | ⛔ | Lo que te frena y qué necesitas del usuario para seguir. |
| Resumen | 📌 | Dos o tres viñetas con lo esencial, para quien solo lea esto. |

## Reglas

1. **Viñetas, nunca párrafos.** Ninguna viñeta pasa de una línea. Si no cabe, se parte en dos viñetas.
2. **Solo los bloques que tengan algo.** Si no hay bloqueos, no escribas «Bloqueos: ninguno»: omite el bloque. `📌 Resumen` va siempre al final.
3. **Resumen al cerrar un trabajo largo.** Tras varios pasos o herramientas, `📌 Resumen` es lo que el usuario lee de verdad: que se entienda sin subir.
4. **Lo hecho es lo comprobado.** No pongas ✅ a algo que no has ejecutado o verificado; va en 🔄 o se dice que no se probó.
5. **El bloqueo lleva su salida.** Cada ⛔ dice qué hace falta y de quién, no solo que algo falla.
6. **Sin relleno.** Nada de «Claro, voy a…», ni de repetir lo que ya se vio en la herramienta, ni de cerrar con un párrafo de cortesía.
7. **Código, rutas y comandos van exactos**, entre comillas inversas; no se resumen ni se parafrasean.
8. **Una pregunta de una frase o una respuesta de una línea** no necesita los bloques: responde en una línea. Los bloques son para contar trabajo.

## Cómo convive con el resto

- **`orient`** cierra cada turno con su bloque-brújula (📍 ✅ 🧭 ➡️). Esta skill manda sobre **el cuerpo** de la respuesta; la brújula va después, sin repetir lo que ya dijo `✅ Hecho`.
- **`bro`** reescribe un texto para que suene humano; **`eli5`** explica sin jerga. Si el usuario los pide, mandan ellos sobre el contenido; el formato de viñetas se mantiene.
- **`handoff`** genera un documento de traspaso para otro agente; esto es el parte del turno, no ese documento.

## Hecho cuando

La respuesta se entiende leyendo solo los emojis y la primera palabra de cada viñeta.
