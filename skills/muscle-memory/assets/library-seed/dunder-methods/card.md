# Dunder methods (`__repr__`, `__eq__`, `__len__`, `__iter__`)

## What it is
Dunder ("double underscore") methods let your objects plug into Python's built-in syntax: `repr(obj)`, `obj1 == obj2`, `len(obj)`, `for x in obj`. Implement the ones your object's use case needs instead of writing custom `.compare()` or `.count()` methods.

## Idiomatic example
```python
class Playlist:
    def __init__(self, songs: list):
        self.songs = songs

    def __repr__(self) -> str:
        return f"Playlist({self.songs!r})"

    def __len__(self) -> int:
        return len(self.songs)
```

## Common mistakes
- Implementing `__eq__` but forgetting it changes hashability (a class with custom `__eq__` becomes unhashable unless `__hash__` is also defined).
- Implementing `__eq__` without checking the type of the other operand — should return `NotImplemented` if the other is not the expected type, rather than raising `AttributeError`.
- Confusing `__repr__` (unambiguous, for developers) with `__str__` (readable, for end users) — `__repr__` is the fallback if `__str__` is missing.
- Writing `__iter__` that returns `self` without a working `__next__`, or forgetting to raise `StopIteration`.

## Where you see it in real code
- `__repr__` on every domain entity to make debugging and logs readable.
- `__eq__`/`__hash__` on value objects so they work correctly in sets and as dict keys.
- `__len__`/`__iter__` on custom collections (e.g. a `Batch` or `Queue` wrapper) so they behave like built-in containers.
