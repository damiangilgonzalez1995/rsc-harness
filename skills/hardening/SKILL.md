---
name: hardening
description: "Use when the user asks for hardening, a security or privacy audit of the product, or aligning it with SOC 2, ISO 27001 or ISO 27701: audits by zones with read-only subagents, checks every finding by hand, gives the list by severity, the user decides, and the chosen fixes go to spec and tickets. NOT a quick scan of a diff (that is `security-scan`), NOT secure-coding rules while writing code (that is `secure-coding`)."
tags: [security, hardening, soc2, iso27001, iso27701, privacy, audit]
recommends: [to-spec, to-tickets, write-adr, implement-spec]
profiles: [minimal, core, ui, full]
origin: damiangil
---

# Hardening

Proceso de cinco pasos: alcance, auditoría, comprobación, lista y decisión, y arreglo. El usuario dicta por voz y quiere frases cortas y sin jerga. Cada decisión es suya; la gravedad y el arreglo son propuestas.

## 1. Alcance

Pregunta todo de una vez, con opciones:

- **Normas.** El dictado deforma los números («ISO 27101» era 27701). Confirma cuáles son.
- **Qué cubre.** Solo el producto (código, base, accesos, secretos, registros, dependencias, contenedores, CI) o también las políticas de empresa.
- **Qué entregar.** Auditar y luego arreglar lo que elija (recomendado), solo auditar, o arreglarlo todo.

**Hecho cuando** las tres respuestas son del usuario.

## 2. Auditoría en tres zonas

Lee primero el documento de estado del proyecto (el que diga su `AGENTS.md` o `CLAUDE.md`): manda sobre lo que encuentren los agentes. Lanza **tres subagentes en paralelo, solo de lectura**, uno por zona, con el encargo de [`zonas.md`](zonas.md). Mientras trabajan, crea un worktree para el informe si otra sesión usa la carpeta.

**Hecho cuando** las tres zonas han devuelto sus hallazgos con evidencia `fichero:línea`.

## 3. Comprobación a mano

Un agente auditor se equivoca con el mismo aplomo con que acierta. Abre tú el código de **cada hallazgo alto o crítico y de cada medio**, y contrasta cada uno con el estado del proyecto. Ejemplo real: un agente dio por vivas dos tablas que una migración ya había borrado.

- Se confirma: márcalo con ✔ en el informe.
- No se sostiene: corrígelo o quítalo, y dile al usuario qué cambió.
- El mismo fallo en dos zonas: une los hallazgos en uno.

**Hecho cuando** cada hallazgo medio o superior está confirmado, corregido o quitado.

## 4. Informe y lista

Escribe el informe en la wiki o en `docs/` del proyecto (por ejemplo, `docs/wiki/seguridad/auditoria-hardening.md`, o con fecha si ya existe) y enlázalo desde su índice. Lleva lo siguiente:

- resumen;
- hallazgos por gravedad, cada uno con controles, evidencia, escenario y arreglo;
- «Bien hecho» y «No aplica todavía»;
- inventario de datos personales.

Al usuario dale **la lista entera, numerada, de más a menos grave**, cada hallazgo en una o dos frases llanas: qué pasa y qué podría hacer alguien con ello. Que la conteste a su manera, punto por punto. Si un punto no se entiende, explica qué programa es y cómo pasa, con una imagen cotidiana.

**Hecho cuando** el usuario ha respondido a cada número o lo ha dejado expresamente para después.

## 5. Decisión y arreglo

Dale a cada número un destino y escríbelo en «Decisión del usuario», con fecha, en el informe:

| Destino | Qué haces |
|---|---|
| Se arregla | Entra en la tanda de arreglos |
| Anotado | Una fila en el roadmap del proyecto con «Anotado, sin preocupar por ahora» |
| Pendiente que ya existía | Busca su ticket abierto (`gh issue list --search`); si no lo hay, créalo y enlázalo en el roadmap |
| Aceptado o descartado | Una línea con su razón |

La tanda de arreglos sigue la cadena del proyecto, en una rama aparte:

1. Spec y tickets (`to-spec` y `to-tickets`), con un ticket por arreglo independiente.
2. Un ADR (`write-adr`) para lo difícil de revertir, como los roles de la base.
3. Desarrollo con agentes en paralelo (`implement-spec`). Cada arreglo lleva su prueba, que falla antes del arreglo y pasa después.

La PR queda sin fusionar.

**Hecho cuando** cada número tiene su destino escrito y la tanda está en tickets.
