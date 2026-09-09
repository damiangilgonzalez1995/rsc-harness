# Context managers (`with`, `__enter__`/`__exit__`)

## What it is
A context manager guarantees setup and teardown around a block of code, even if it raises: `__enter__` runs on entering the `with` block, `__exit__` always runs on leaving it. `contextlib.contextmanager` turns a generator function into a context manager without writing a class: everything before `yield` is `__enter__`, everything after is `__exit__`.

## Idiomatic example
```python
from contextlib import contextmanager

@contextmanager
def timer(log: list):
    log.append("start")
    yield
    log.append("end")
```

## Common mistakes
- Forgetting `__exit__` must return a truthy value to suppress an exception — returning `None` (the default) lets the exception propagate, which is usually what you want.
- Writing a `@contextmanager` generator with no `yield` (or more than one), instead of exactly one.
- Doing cleanup in `__enter__` instead of `__exit__`, so it never runs if the `with` block fails partway through.
- Not wrapping the `yield` in `try`/`finally` inside a `@contextmanager` function, so a failing block skips the cleanup.

## Where you see it in real code
- Database transactions and connection pools (`with connection.cursor() as cur:`).
- File handles (`with open(path) as f:`) that always close, even on error.
- Temporarily patching config or state in tests (`with mock.patch(...):`).
