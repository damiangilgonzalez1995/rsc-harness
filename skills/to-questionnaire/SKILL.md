---
name: to-questionnaire
description: "Turns a decision you cannot answer alone into a questionnaire for someone else to fill in."
tags: ["planning", "questionnaire", "decision-making"]
---

Convierte algo que el usuario no puede responder solo en un **cuestionario**: un documento Markdown que entrega a una persona para rellenarlo de forma asíncrona, o para completarlo juntos en una reunión. El destinatario tiene un conocimiento que al usuario le falta; el cuestionario se lo extrae.

**Interroga sobre el envío, no sobre el tema.** Pregunta al usuario solo sobre el *envío*, que siempre puede responder: a quién va dirigido y qué necesita a cambio. Las preguntas del documento apuntan entonces a la **brecha** entre lo que sabe el destinatario y lo que necesita el usuario.

1. **¿A quién va dirigido?** Pregunta, en un solo intercambio, el rol, la experiencia y la relación del destinatario con el usuario. Esto fija el tono del cuestionario y cuánto contexto debe llevar. Terminado cuando sabes quién es el destinatario y qué sabe que el usuario no sabe.

2. **¿Qué necesitas de vuelta?** Pregunta, en un solo intercambio, las decisiones o hechos concretos que el usuario no puede resolver solo y que necesita de esta persona. Terminado cuando tienes una lista concreta de lo que el usuario debe poder hacer o decidir al recibir las respuestas.

3. **Escribe el cuestionario.** Redacta preguntas dirigidas a la brecha de los pasos 1-2, siguiendo la estructura de documento de abajo. Escríbelo en `to-questionnaire-<slug>.md` en el directorio actual (el slug sale del tema) e informa de la ruta. Terminado cuando el fichero existe y cada punto que el usuario nombró en el paso 2 está cubierto por una pregunta.

## Estructura del documento

Enmarca el documento como un **cuestionario de descubrimiento**: al usuario le falta contexto, el destinatario lo tiene. Ordena las preguntas de más a menos importante, ya que al ser asíncrono puede que solo tengas una pasada, y agrúpalas bajo encabezados `##` por tema en cuanto haya más de un puñado. Escríbelo con la plantilla de abajo.

<plantilla-cuestionario>

# <Título del cuestionario>

**Propósito:** por qué existe este cuestionario y qué decisión depende de él.

**De:** <el usuario>, **Para:** <el destinatario>, **Cómo se usarán tus respuestas:** <a dónde van>

## Contexto

Un párrafo que oriente a un destinatario que no estaba en la cabeza del usuario. Suficiente para responder bien, no una página.

## Cómo responder

Plazo y esfuerzo aproximado. Las respuestas parciales y los "no lo sé" son útiles: marca lo que no tengas claro en vez de saltártelo.

## <Encabezado del tema>

Una sección `##` por tema. Debajo, sus preguntas, de más a menos importante. Cada pregunta es una sola idea, nunca compuesta, con un hueco de respuesta justo debajo, y una línea de _por qué importa_ solo donde la pregunta se pueda malinterpretar o invite a una respuesta de relleno.

<ejemplo-pregunta>
### ¿Qué carga se espera que soporte el sistema en el lanzamiento?

_Por qué importa: decide si aprovisionamos para picos de tráfico ahora o lo aplazamos._

>
</ejemplo-pregunta>

## ¿Algo más?

Un cierre general: ¿algo que no hayamos preguntado y deberíamos saber?

</plantilla-cuestionario>
