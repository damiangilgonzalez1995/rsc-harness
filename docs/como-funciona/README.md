# Cómo funciona este harness

Tres documentos para entender qué hace este proyecto cuando lo instalas y trabajas con Claude Code. Están escritos sin tecnicismos y se leen en este orden.

| Documento | Qué responde | Formato |
|---|---|---|
| [El harness explicado para cualquiera](mapa-del-harness.md) | Qué es, qué instala, qué pasa en cada turno de conversación, qué hace cada pieza. Doce secciones con diagramas y ejemplos. | Markdown |
| [Tres sesiones con memoria](tres-sesiones-con-memoria.html) | Qué cambia de verdad entre la sesión uno y la sesión tres: qué recuerda el proyecto, quién lo escribe y dónde. Se lee como una línea de tiempo. | HTML, ábrelo en el navegador |
| [Anatomía del harness](anatomia-del-harness.html) | El detalle técnico hook a hook: cuándo se dispara cada uno, qué inyecta y qué bloquea. | HTML, ábrelo en el navegador |

## La idea en una frase

Claude Code, por sí solo, empieza cada conversación en blanco. Este harness le pone tres cosas alrededor: **skills** (manuales que se activan cuando tu petición encaja con ellos), **hooks** (código que se ejecuta en momentos fijos, como al arrancar la sesión o antes de cada comando) y **memoria en ficheros** (para que lo aprendido sobreviva al cierre de la sesión).

## Lo que este fork cambia respecto al original

Este proyecto es un fork de [rsc-harness](https://github.com/ericrisco/rsc-harness), de Eric Risco. Las diferencias que afectan a lo que cuentan estos documentos:

- La cadena de especificación original (`specify` → `plan` → `tasks` → `ship`) se ha sustituido por otro flujo: aclarar primero con `grill-with-docs` o `wayfinder`, escribir la spec con `superpowers:brainstorming` o `to-spec`, registrar las decisiones con `write-adr` en `docs/adr/`, construir con `superpowers:writing-plans` y `superpowers:executing-plans` (o con `to-tickets` e `implement` si se viene de `wayfinder`), y revisar con `code-review` antes de fusionar.
- La documentación del proyecto vive en `docs/`, no en `02-DOCS/`.
- El catálogo incluye las skills propias del autor del fork, junto a las del original que no se solapan con ellas.
