---
name: domain-modeling
description: "Build and refine the project's domain model. Use when the user wants to pin down domain terminology or a ubiquitous language, record an architectural decision, or when another skill needs to keep the domain model up to date."
tags: ["domain-modeling", "glossary", "architecture"]
---

# Modelado de Dominio

Construye y afina activamente el modelo de dominio del proyecto a medida que diseñas. Esta es la disciplina *activa*: cuestionar términos, inventar escenarios límite y escribir el glosario y las decisiones en el momento en que se cristalizan. (Simplemente *leer* `CONTEXT.md` para sacar vocabulario no es esta skill — eso es un hábito de una línea que cualquier skill puede hacer. Esta skill es para cuando estás *cambiando* el modelo, no solo consumiéndolo.)

## Estructura de ficheros

La mayoría de los repos tienen un único contexto:

```
/
├── CONTEXT.md
├── docs/
│   └── adr/
│       ├── 0001-orders-event-sourced.md
│       └── 0002-postgres-para-write-model.md
└── src/
```

Si existe un `CONTEXT-MAP.md` en la raíz, el repo tiene varios contextos. El mapa indica dónde vive cada uno:

```
/
├── CONTEXT-MAP.md
├── docs/
│   └── adr/                          ← decisiones de todo el sistema
├── src/
│   ├── ordering/
│   │   ├── CONTEXT.md
│   │   └── docs/adr/                 ← decisiones específicas del contexto
│   └── billing/
│       ├── CONTEXT.md
│       └── docs/adr/
```

Crea los ficheros de forma perezosa: solo cuando tengas algo que escribir. Si no existe `CONTEXT.md`, créalo cuando se resuelva el primer término. Si no existe `docs/adr/`, créalo cuando haga falta el primer ADR.

## Durante la sesión

### Contrasta contra el glosario

Cuando el usuario use un término que entre en conflicto con el lenguaje ya existente en `CONTEXT.md`, señálalo de inmediato. "Tu glosario define 'cancelación' como X, pero parece que te refieres a Y — ¿cuál es?"

### Afina el lenguaje difuso

Cuando el usuario use términos vagos o sobrecargados, propón un término canónico preciso. "Estás diciendo 'cuenta' — ¿te refieres al Cliente o al Usuario? Son cosas distintas."

### Discute escenarios concretos

Cuando se estén discutiendo relaciones del dominio, ponlas a prueba con escenarios específicos. Inventa escenarios que exploren los casos límite y obliguen al usuario a ser preciso sobre los límites entre conceptos.

### Cruza con el código

Cuando el usuario afirme cómo funciona algo, comprueba si el código coincide. Si encuentras una contradicción, sácala a la luz: "Tu código cancela Pedidos enteros, pero acabas de decir que la cancelación parcial es posible — ¿cuál es la correcta?"

### Actualiza CONTEXT.md sobre la marcha

Cuando un término quede resuelto, actualiza `CONTEXT.md` ahí mismo. No los acumules — captúralos según ocurren. Usa el formato de [CONTEXT-FORMAT.md](./CONTEXT-FORMAT.md).

`CONTEXT.md` debe estar totalmente libre de detalles de implementación. No trates `CONTEXT.md` como una especificación, un borrador, ni un repositorio de decisiones de implementación. Es un glosario y nada más.

### Ofrece ADRs con moderación

Solo ofrece crear un ADR cuando las tres cosas sean ciertas:

1. **Difícil de revertir** — el coste de cambiar de opinión más adelante es relevante
2. **Sorprendente sin contexto** — un futuro lector se preguntará "¿por qué lo hicieron así?"
3. **Resultado de un trade-off real** — había alternativas genuinas y elegiste una por razones específicas

Si falta alguna de las tres, salta el ADR. Usa el formato de [ADR-FORMAT.md](./ADR-FORMAT.md).
