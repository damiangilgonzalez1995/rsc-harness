# Formato de CONTEXT.md

## Estructura

```md
# {Nombre del Contexto}

{Una o dos frases describiendo qué es este contexto y por qué existe.}

## Lenguaje

**Pedido**:
{Una o dos frases describiendo el término}
_Evitar_: Compra, transacción

**Factura**:
Una solicitud de pago enviada a un cliente tras la entrega.
_Evitar_: Recibo, solicitud de cobro

**Cliente**:
Una persona u organización que realiza pedidos.
_Evitar_: Comprador, usuario, cuenta
```

## Reglas

- **Sé opinado.** Cuando existan varias palabras para el mismo concepto, elige la mejor y lista las demás bajo `_Evitar_`.
- **Mantén las definiciones ajustadas.** Una o dos frases como máximo. Define lo que ES, no lo que hace.
- **Incluye solo términos específicos del contexto de este proyecto.** Los conceptos generales de programación (timeouts, tipos de error, patrones de utilidad) no pertenecen aquí aunque el proyecto los use mucho. Antes de añadir un término pregúntate: ¿es un concepto propio de este contexto, o un concepto general de programación? Solo el primero pertenece.
- **Agrupa términos bajo subtítulos** cuando emerjan clústeres naturales. Si todos los términos pertenecen a una sola área cohesionada, una lista plana está bien.

## Repos de contexto único vs. múltiple

**Contexto único (la mayoría de los repos):** Un solo `CONTEXT.md` en la raíz del repo.

**Múltiples contextos:** Un `CONTEXT-MAP.md` en la raíz lista los contextos, dónde viven y cómo se relacionan entre sí:

```md
# Mapa de Contextos

## Contextos

- [Ordering](./src/ordering/CONTEXT.md) — recibe y rastrea los pedidos de clientes
- [Billing](./src/billing/CONTEXT.md) — genera facturas y procesa pagos
- [Fulfillment](./src/fulfillment/CONTEXT.md) — gestiona el picking y el envío en el almacén

## Relaciones

- **Ordering → Fulfillment**: Ordering emite eventos `OrderPlaced`; Fulfillment los consume para empezar el picking
- **Fulfillment → Billing**: Fulfillment emite eventos `ShipmentDispatched`; Billing los consume para generar facturas
- **Ordering ↔ Billing**: Tipos compartidos para `CustomerId` y `Money`
```

La skill infiere qué estructura aplica:

- Si existe `CONTEXT-MAP.md`, léelo para encontrar los contextos
- Si solo existe un `CONTEXT.md` en la raíz, es contexto único
- Si no existe ninguno, crea un `CONTEXT.md` en la raíz de forma perezosa cuando se resuelva el primer término

Cuando existen múltiples contextos, infiere a cuál corresponde el tema actual. Si no está claro, pregunta.
