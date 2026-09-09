# Classes and `__init__`

## What it is
A class bundles related data and behavior together. `__init__` is the constructor: it runs once when you create an instance, and its job is to set up the object's initial state on `self`. Reach for a class when you have data that always travels together with the operations that act on it.

## Idiomatic example
```python
class Ticket:
    def __init__(self, title: str, priority: int = 0):
        self.title = title
        self.priority = priority
```

## Common mistakes
- Forgetting `self` as the first parameter of `__init__` (and every instance method).
- Using a mutable default argument (`def __init__(self, tags=[])`) — it is shared across all instances.
- Assigning to a bare local variable instead of `self.attr`, so the value never sticks to the instance.
- Doing real work (I/O, network calls) inside `__init__` instead of just setting up state.

## Where you see it in real code
- ORM models (SQLAlchemy, Django) are classes whose `__init__`/fields describe a database row.
- Service/handler classes that group a resource (e.g. `PaymentProcessor`) with the config it needs.
- DTOs and request/response objects in API clients.
