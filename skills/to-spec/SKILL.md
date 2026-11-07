---
name: to-spec
description: "Turns the current conversation into a spec (PRD) and publishes it to the project's issue tracker — no interview, just a synthesis of what has already been discussed."
tags: ["spec", "prd", "issue-tracker"]
profiles: [core, ui, full]
origin: damiangil
---


# To Spec

Esta skill toma el contexto de la conversación actual y el entendimiento del codebase y produce una spec (puede que conozcas este documento como PRD). NO entrevistes al usuario — solo sintetiza lo que ya sabes.

El issue tracker y el vocabulario de etiquetas de triaje deberían haberte sido proporcionados. Si no hay tracker configurado, guarda la spec como archivo local (p. ej. `.scratch/<slug-de-la-feature>/spec.md`).

## Proceso

1. Explora el repo para entender el estado actual del codebase, si no lo has hecho ya. Usa el vocabulario del glosario de dominio del proyecto en toda la spec, y respeta los ADRs del área que tocas.

2. Boceta las costuras (seams) por las que vas a testear la feature. Se prefieren las costuras existentes a las nuevas. Usa la costura más alta posible. Si hacen falta costuras nuevas, propónlas en el punto más alto que puedas. Cuantas menos costuras haya en el codebase, mejor — el número ideal es una.

Confirma con el usuario que esas costuras coinciden con sus expectativas.

3. Escribe la spec usando la plantilla de abajo y publícala en el issue tracker del proyecto. Aplica la etiqueta de triaje `ready-for-agent` — no hace falta más triaje.

<plantilla-spec>

## Planteamiento del problema

El problema que enfrenta el usuario, desde la perspectiva del usuario.

## Solución

La solución al problema, desde la perspectiva del usuario.

## Historias de usuario

Una lista LARGA y numerada de historias de usuario. Cada historia de usuario debe seguir el formato:

1. Como <actor>, quiero <feature>, para <beneficio>

<ejemplo-historia-usuario>
1. Como cliente de banca móvil, quiero ver el saldo de mis cuentas, para tomar decisiones mejor informadas sobre mi gasto
</ejemplo-historia-usuario>

Esta lista de historias de usuario debe ser extremadamente extensa y cubrir todos los aspectos de la feature.

## Decisiones de implementación

Una lista de las decisiones de implementación tomadas. Puede incluir:

- Los módulos que se construirán/modificarán
- Las interfaces de esos módulos que se modificarán
- Aclaraciones técnicas del desarrollador
- Decisiones arquitectónicas
- Cambios de schema
- Contratos de API
- Interacciones concretas

NO incluyas rutas de archivo concretas ni snippets de código. Pueden quedar obsoletos muy rápido.

Excepción: si un prototipo produjo un snippet que codifica una decisión con más precisión que la prosa (máquina de estados, reducer, schema, forma de un tipo), inclúyelo dentro de la decisión correspondiente y anota brevemente que salió de un prototipo. Recórtalo a las partes ricas en decisión — no una demo funcional, solo lo importante.

## Decisiones de seguridad y de front

Solo si la feature toca autenticación, un endpoint, una tabla, un secreto o una pantalla. Si no toca nada de eso, escribe «No aplica» y por qué.

- **Seguridad.** De los 10 puntos de `secure-coding` (`references/pre-publish.md`: rate limiting, claves fuera del código, secretos de producción, límites por IP, entradas validadas, validación en el servidor, RLS, hash y cifrado, sesiones que vencen, CORS), anota los que aplican a esta feature y los que quedan fuera a propósito. Cada uno que aplique se convierte en una historia de usuario o en un criterio de aceptación comprobable.
- **Front.** Dónde vive el estado de cada pieza nueva (URL, servidor, padre compartido o componente), qué es componente de servidor y qué de cliente, y qué primer render debe ser idéntico en servidor y navegador (hidratación). Detalle en `react` y `nextjs` (`references/mental-model.md` y `references/rendering-hydration.md`).

## Decisiones de testing

Una lista de las decisiones de testing tomadas. Incluye:

- Una descripción de qué hace bueno a un test (testear solo comportamiento externo, no detalles de implementación)
- Qué módulos se testearán
- Precedentes para los tests (es decir, tests de tipo similar ya existentes en el codebase)

## Fuera de alcance

Una descripción de lo que queda fuera del alcance de esta spec.

## Notas adicionales

Cualquier nota adicional sobre la feature.

</plantilla-spec>
