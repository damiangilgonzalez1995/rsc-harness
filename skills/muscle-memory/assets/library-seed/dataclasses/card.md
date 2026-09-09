# `@dataclass`

## What it is
`@dataclass` generates `__init__`, `__repr__` and `__eq__` for you from type-annotated class fields, so you stop hand-writing boilerplate for classes that are mostly a bag of data. Use `field(default_factory=...)` when a default needs to be a fresh mutable object per instance.

## Idiomatic example
```python
from dataclasses import dataclass, field

@dataclass
class Order:
    order_id: str
    items: list = field(default_factory=list)
    discount: float = 0.0
```

## Common mistakes
- Using a mutable literal as a default (`items: list = []`) instead of `field(default_factory=list)` — raises `ValueError` in a dataclass, and is a shared-state bug elsewhere.
- Putting a field without a default before one with a default, which is a `TypeError` at class definition time.
- Forgetting that `@dataclass` equality compares field values, not identity — don't add a custom `__eq__` unless you mean to override that.

## Where you see it in real code
- API request/response schemas and config objects.
- Value objects passed between layers (e.g. `SensorReading`, `CartItem`).
- Lightweight domain entities before reaching for a full ORM model.
