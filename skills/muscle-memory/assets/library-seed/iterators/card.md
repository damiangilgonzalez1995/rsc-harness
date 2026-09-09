# Iterators (`__iter__`/`__next__`)

## What it is
An iterator is any object with `__next__` (returns the next value, or raises `StopIteration` when exhausted) and `__iter__` (returns itself). Implementing both by hand — the "iterator protocol" — is how `for` loops and `next()` work under the hood, and lets you build custom lazy sequences without a generator function.

## Idiomatic example
```python
class Countdown:
    def __init__(self, start: int):
        self.current = start

    def __iter__(self):
        return self

    def __next__(self):
        if self.current < 0:
            raise StopIteration
        value = self.current
        self.current -= 1
        return value
```

## Common mistakes
- Forgetting `__iter__` must return `self` (or another iterator) — without it the object isn't recognized as iterable.
- Forgetting to raise `StopIteration` at all, causing an infinite loop when the object is used in a `for` loop.
- Mutating the "current position" state incorrectly, so the iterator skips a value or repeats one.
- Confusing an *iterable* (has `__iter__` returning a fresh iterator each time, like a `list`) with an *iterator* (also has `__next__` and gets exhausted after one pass).

## Where you see it in real code
- Custom paginators that fetch one page from an API at a time via `__next__`.
- Database cursors that stream rows lazily instead of loading a full result set.
- Wrapping an external stream (socket, sensor feed) so it can be used directly in a `for` loop.
