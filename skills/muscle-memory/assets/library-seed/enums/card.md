# `Enum`

## What it is
`Enum` gives a fixed, named set of constant values (e.g. statuses, categories) instead of scattering magic strings or numbers through the code. Each member has a name and a value, compares by identity, and can carry its own methods.

## Idiomatic example
```python
from enum import Enum

class Status(Enum):
    PENDING = "pending"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
```

## Common mistakes
- Comparing an enum member to its raw value (`Status.PENDING == "pending"`) instead of to another member — by default this is `False`, since `Enum` members are not equal to plain strings unless you use `StrEnum`/mixins.
- Reassigning or duplicating a value across members without realizing `Enum` aliases duplicates to the same member instead of erroring.
- Using `Enum` for values that need arithmetic or ordering without inheriting from `IntEnum`, which supports comparisons.

## Where you see it in real code
- Order/ticket status fields (`PENDING`, `IN_PROGRESS`, `CLOSED`) instead of free-text strings.
- Configuration choices (log level, environment: `DEV`, `STAGING`, `PROD`).
- Enum methods that map a member to display text or the next valid state in a workflow.
