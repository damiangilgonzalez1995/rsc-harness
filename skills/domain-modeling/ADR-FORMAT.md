# Formato de ADR

Los ADRs viven en `docs/adr/` y usan numeración secuencial: `0001-slug.md`, `0002-slug.md`, etc.

Crea el directorio `docs/adr/` de forma perezosa — solo cuando haga falta el primer ADR.

## Plantilla

```md
# {Título corto de la decisión}

{1-3 frases: cuál es el contexto, qué decidimos y por qué.}
```

Eso es todo. Un ADR puede ser un único párrafo. El valor está en registrar *que* se tomó una decisión y *por qué* — no en rellenar secciones.

## Secciones opcionales

Inclúyelas solo cuando aporten valor genuino. La mayoría de los ADRs no las necesitarán.

- **Status** en el frontmatter (`proposed | accepted | deprecated | superseded by ADR-NNNN`) — útil cuando las decisiones se revisan
- **Opciones consideradas** — solo cuando las alternativas rechazadas merezcan recordarse
- **Consecuencias** — solo cuando haya efectos colaterales no obvios que merezca la pena señalar

## Numeración

Escanea `docs/adr/` para encontrar el número más alto existente e incrementa en uno.

## Cuándo ofrecer un ADR

Las tres condiciones deben ser ciertas:

1. **Difícil de revertir** — el coste de cambiar de opinión más adelante es relevante
2. **Sorprendente sin contexto** — un futuro lector mirará el código y se preguntará "¿por qué demonios lo hicieron así?"
3. **Resultado de un trade-off real** — había alternativas genuinas y elegiste una por razones específicas

Si una decisión es fácil de revertir, sáltala — simplemente la revertirás. Si no es sorprendente, nadie se preguntará por qué. Si no había una alternativa real, no hay nada que registrar más allá de "hicimos lo obvio".

### Qué califica

- **Forma arquitectónica.** "Usamos un monorepo." "El write model es event-sourced, el read model se proyecta en Postgres."
- **Patrones de integración entre contextos.** "Ordering y Billing se comunican vía eventos de dominio, no HTTP síncrono."
- **Elecciones tecnológicas que conllevan lock-in.** Base de datos, message bus, proveedor de auth, target de despliegue. No cada librería — solo las que costaría un trimestre cambiar.
- **Decisiones de límites y alcance.** "Los datos del Cliente son propiedad del contexto Customer; otros contextos los referencian solo por ID." Los no-s explícitos son tan valiosos como los sí-s.
- **Desviaciones deliberadas del camino obvio.** "Usamos SQL manual en lugar de un ORM porque X." Cualquier cosa donde un lector razonable asumiría lo contrario. Esto evita que el siguiente ingeniero "arregle" algo que era deliberado.
- **Restricciones no visibles en el código.** "No podemos usar AWS por requisitos de compliance." "Los tiempos de respuesta deben estar por debajo de 200ms por el contrato de la API del partner."
- **Alternativas rechazadas cuando el rechazo no es obvio.** Si consideraste GraphQL y elegiste REST por razones sutiles, regístralo — de lo contrario alguien volverá a sugerir GraphQL dentro de seis meses.
