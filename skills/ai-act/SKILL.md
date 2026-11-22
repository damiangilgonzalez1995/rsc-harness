---
name: ai-act
description: "Use when someone building a product with AI asks what the EU AI Act requires of it: classifies role and risk level, dates each duty, reviews the code (AI notice, synthetic-content marking, logs, retention, human oversight) and drafts Annex IV, instructions-for-use and FRIA skeletons. NOT scoping every framework or a control register (that is `compliance`), NOT a security audit (that is `hardening`), NOT retention schedules or a ROPA (that is `data-policy`)."
tags: [ai-act, eu-ai-act, normativa, high-risk, transparency, logging, human-oversight, fria, annex-iv]
recommends: [compliance, hardening, data-policy, gdpr-privacy, agent-safety, write-adr]
origin: damiangil
---

# AI Act

Para quien construye un producto con IA: qué le exige el Reglamento (UE) 2024/1689 y cómo dejarlo por escrito. Cinco pasos: rol, riesgo, obligaciones con fecha, revisión del proyecto y documentación. Frases cortas y sin jerga. Cada decisión es del usuario; la clasificación y los arreglos son propuestas.

## Límites

Díselos al usuario al empezar y escríbelos en la cabecera de cada documento que generes.

- **Guía de ingeniería, no asesoría jurídica.** Una clasificación de alto riesgo, una duda sobre el art. 5 y una FRIA las firma un especialista.
- **Cumple quien despliega.** Las obligaciones recaen en el proveedor (art. 3.3) y en el responsable del despliegue (art. 3.4). Una skill, una plantilla o un documento generado facilitan el cumplimiento; ninguno lo acredita.
- **Cada afirmación normativa lleva su artículo.** Lo que no puedas atar a un artículo, preséntalo como criterio de ingeniería o como «pendiente de verificar».
- **Verificado a 2026-11-21.** El calendario ya cambió una vez (Reglamento (UE) 2026/1744, julio de 2026). Antes de afirmar una fecha, recompruébala en fuente primaria: EUR-Lex o el AI Act Service Desk de la Comisión, con las direcciones y el método de [`references/calendario.md`](references/calendario.md). Si la fuente no abre, da la fecha como «verificada a 2026-11-21, sin recomprobar».

## 1. Rol

Pregunta de una vez las preguntas de rol de [`references/clasificacion.md`](references/clasificacion.md): proveedor, responsable del despliegue, integrador de un modelo ajeno por API o autor de código abierto. Una misma empresa puede tener dos roles.

Avisa siempre del **art. 25.1.c**: quien cambia la finalidad prevista de un sistema, también de uno de uso general, de modo que pasa a ser de alto riesgo, se convierte en su proveedor.

**Hecho cuando** cada rol está escrito con el artículo que lo sustenta y el usuario lo ha confirmado.

## 2. Nivel de riesgo

Lee primero el código y el README con las señales de [`references/clasificacion.md`](references/clasificacion.md). Después pregunta lo que el código calla: finalidad prevista, sobre quién decide el sistema, sector y si hay usuarios en la UE.

Clasifica en este orden: prohibido (art. 5), alto riesgo (art. 6 con los anexos I y III), transparencia (art. 50), mínimo. Los niveles se acumulan: un sistema de alto riesgo que conversa con personas lleva también el art. 50 (art. 50.6).

**Hecho cuando** el nivel está escrito con su artículo, las respuestas son del usuario y cada duda abierta tiene nombre de quien la resuelve.

## 3. Qué toca y desde cuándo

Da las obligaciones en dos bloques, con las tablas de [`references/calendario.md`](references/calendario.md), y compara cada fecha con la de hoy:

- **Ya exigible, sea cual sea el riesgo**: alfabetización (art. 4), prácticas prohibidas (art. 5), transparencia (art. 50) y, si hay datos personales, el RGPD.
- **Solo alto riesgo**: arts. 9 a 15 y 17 para el proveedor; registro y conservación de logs al menos seis meses (arts. 12, 19 y 26.6); supervisión humana (arts. 14 y 26.2); FRIA (art. 27); vigilancia e incidentes (arts. 72 y 73).

**Hecho cuando** cada obligación lleva artículo, destinatario y fecha, y las fechas están recomprobadas o marcadas como no recomprobadas.

## 4. Revisión del proyecto

Revisa el repositorio, solo en lectura, contra las siete zonas de [`references/checklist.md`](references/checklist.md): aviso de IA, marcado de contenido sintético, registro y trazabilidad, retención y borrado, supervisión humana y parada, seudonimización en trazas y transferencias internacionales.

Cada hallazgo lleva evidencia `fichero:línea`, su artículo y su carácter: **exigible ya**, **solo alto riesgo** o **buena práctica**. Entrega la lista numerada, primero lo exigible ya. El usuario decide el destino de cada número: se arregla, se anota o se acepta con su razón. Lo que se arregla sigue la cadena del proyecto (`to-spec`, `to-tickets`).

**Hecho cuando** las siete zonas tienen hallazgos o un «sin hallazgos» con evidencia, y cada número tiene un destino dicho por el usuario.

## 5. Documentación

Cuando la pidan, genera el esqueleto desde [`references/plantillas-documentacion.md`](references/plantillas-documentacion.md): registro de decisión de clasificación, documentación técnica (anexo IV), instrucciones de uso (art. 13) o FRIA (art. 27). Rellena desde el repositorio lo que el repositorio demuestra y deja marcado `[HUMANO]` lo que exige juicio.

**Hecho cuando** el documento está en `docs/` del proyecto con su cabecera de límites, y cada campo está relleno con evidencia o marcado `[HUMANO]`.

## Errores frecuentes

| Error | En su lugar |
|---|---|
| Citar de memoria la fecha del alto riesgo | Leerla en `references/calendario.md` y recomprobarla en fuente |
| Aviso de IA solo en los términos y condiciones | Aviso visible en la primera interacción (art. 50.5) |
| Leer «seis meses» como permiso para guardar conversaciones | Registro de eventos separado del contenido; el RGPD sigue mandando (arts. 19.1 y 26.6) |
| Tratar a quien llama a un modelo por API como proveedor del modelo | Es proveedor posterior de un sistema (art. 3.68) |
| Presentar una plantilla rellena o una ISO 42001 como cumplimiento | Decir qué facilita y quién firma |
