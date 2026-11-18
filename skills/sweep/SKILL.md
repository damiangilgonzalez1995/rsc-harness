---
name: sweep
description: "Use when the project's written context may have gone stale — on `/sweep`, every few weeks, before a big feature, or when the agent keeps doing work nobody asked for. Scans TODO/FIXME, `.scratch/*/issues`, `docs/wiki`, lessons and CLAUDE.md, checks each claim against git, has a blind verifier confirm it, reports Obsoleto / Conflicto / Sin pruebas and archives to `docs/archive/` only with consent. NOT reviewing a diff (that is `code-review`), NOT a session retrospective (that is `retro`), NOT filing the docs inbox into the wiki (that is `harness`)."
tags: [context, cleanup, stale, wiki, tickets, archive]
recommends: [code-review, harness, retro]
profiles: [core, ui, full]
origin: damiangil
---

# Sweep: barrer el contexto que ya no es verdad

Un TODO que ya se hizo, un ticket que ya se fusionó o una página de la wiki que el código contradice
siguen pareciendo instrucciones. El agente los lee y se pone a hacer un trabajo que nadie pidió. Esta
skill encuentra ese contexto, lo prueba contra git y lo archiva **solo si la persona dice que sí**.

Hay una regla que manda sobre todas las demás: **sin pruebas no se toca.** Si git no demuestra que algo
está obsoleto, se queda donde está, aunque lo parezca.

## Fase 1 · Escanear

Recorre estas fuentes y saca de cada elemento **una afirmación** corta que se pueda comprobar. Por
ejemplo: «falta validar el email en el registro» o «el login usa sesiones, no JWT».

| Fuente | Cómo |
|---|---|
| TODO / FIXME / XXX en el código | `git grep -n -E "TODO|FIXME|XXX"` (solo lo versionado) |
| Tickets locales | `.scratch/*/issues/*.md` con su `status:` |
| Wiki | `docs/wiki/**/*.md` (decisiones, specs, páginas de tema) |
| Lecciones | `tasks/lessons.md`, `docs/wiki/**/lessons*.md` y similares |
| Instrucciones del agente | `CLAUDE.md` y `AGENTS.md`, fuera del bloque `rsc-suggest`, que es del harness |

`docs/archive/` no se escanea: ya está archivado y el hook `archive-guard` no te deja leerlo.

Si salen más de 40 afirmaciones, enseña el recuento por fuente y pregunta por cuál empezar.

## Fase 2 · Buscar pruebas en git

Busca para cada afirmación lo que la confirma o la desmiente. Apunta el SHA del commit y la ruta.

- **Código que cambió:** `git log -S "<símbolo>" --oneline` y `git log --follow -- <ruta>`.
- **Quién y cuándo escribió la línea:** `git blame -L <n>,<n> <ruta>`.
- **¿Existe todavía?** El fichero, la función o el endpoint que nombra.
- **Tickets:** el `status:`, y si hay un commit o una PR fusionada que lo cierra.

Con eso, clasifica cada afirmación de forma provisional:

- **Obsoleto:** git muestra que ya no es verdad. El TODO ya está hecho, el ticket está fusionado
  pero sigue `in_progress`, o la página describe código que ya no existe.
- **Conflicto:** dos fuentes se contradicen, o la spec y el código discrepan. Aquí rige la regla del
  harness: en lo `completed` manda el código; en lo `in_progress` o `not_started`, la spec.
- **Sin pruebas:** no encuentras nada concluyente. Esa afirmación termina aquí y no se toca.

## Fase 3 · Verificador a ciegas

El que encontró la prueba tiende a creérsela. Por eso cada afirmación marcada **Obsoleto** o
**Conflicto** pasa por el agente `finding-verifier`, uno por afirmación, con contexto limpio. Si el
proyecto no lo tiene, usa un `general-purpose` con la misma postura.

Pásale **solo** esto:

1. La afirmación, en una frase.
2. Los punteros: SHA, rutas y líneas.
3. La raíz del repo.

No le pases el documento original ni tu razonamiento: eso es lo que lo volvería ciego al error.
Su encargo: «demuestra que esta afirmación **sigue siendo verdad** hoy». Su veredicto decide:

- **REFUTED:** no pudo sostener que sigue vigente, así que se queda en Obsoleto o en Conflicto.
- **CONFIRMED:** sigue vigente, así que vuelve a Sin pruebas y no se toca.
- **UNPROVEN:** va a Sin pruebas.

Lanza los verificadores en paralelo y en segundo plano. Pide a cada uno un informe de 100 palabras
como máximo.

## Fase 4 · Informe en tres cajas

Una tabla por caja, ordenada por fuente:

| Afirmación | Dónde | Prueba | Propuesta |
|---|---|---|---|
| «Falta validar el email» | `src/auth.ts:42` (TODO) | `a1b2c3d` añade `validateEmail` | Quitar el TODO |

- **Obsoleto:** cada fila con su propuesta. Un documento o un ticket se archiva; un comentario en el
  código se quita.
- **Conflicto:** las dos versiones, una al lado de la otra, y qué diría la regla del `status:`.
  Pregunta cuál gana. No se archiva nada hasta que la persona decide.
- **Sin pruebas:** solo la lista, para que se vea que se miró. No se propone nada.

Di el recuento: «38 afirmaciones → 9 obsoletas, 2 en conflicto, 27 sin pruebas».

## Fase 5 · Archivar, con permiso

Pregunta una vez por caja («¿archivo las 9 obsoletas?») y deja que la persona quite filas. Si dice
que sí:

1. `mkdir -p docs/archive/<AAAA-MM-DD>` y `git mv <ruta> docs/archive/<AAAA-MM-DD>/<ruta>`, manteniendo
   la ruta relativa. Mover hacia el archivo es lo único que el hook deja hacer allí.
2. En el código no se archiva nada: se borra la línea del TODO con una edición normal.
3. Si la raíz no tiene un `.ignore` que nombre `docs/archive/`, añade esa línea con la herramienta
   Write o Edit. Así la búsqueda sin ruta tampoco entra en el archivo.
4. Añade una línea por elemento a `docs/archive-log.md`, fuera del archivo: fecha, ruta, por qué y
   SHA de la prueba. Así se puede saber qué se archivó sin abrir el archivo.
5. Haz un solo commit: `🔥 chore(sweep): archiva N elementos obsoletos`.

Nunca borres: archivar es mover, y la persona puede abrir `docs/archive/` cuando quiera. Un agente no
puede, salvo que la persona cree `.rsc/.no-archive-guard`.

## Qué rompe esto

| Síntoma | Causa | Arreglo |
|---|---|---|
| Se archivó algo que seguía vigente | Se saltó el verificador o se le pasó el documento entero | Afirmación sola más punteros, y CONFIRMED vuelve a Sin pruebas |
| Informe enorme que nadie lee | Se mezclaron Sin pruebas con lo accionable | Sin pruebas va solo como lista |
| La spec «corrige» código ya fusionado | Se ignoró el `status:` | En lo `completed` manda el código |
| El agente sigue obedeciendo lo archivado | No había `.ignore` y la búsqueda entraba en el archivo | Paso 3 de la fase 5 |
