# Decorators

## What it is
A decorator wraps a function to add behavior (logging, timing, retrying) without changing its body. `@my_decorator` above a function is sugar for `func = my_decorator(func)`. Always use `functools.wraps` inside the wrapper so the decorated function keeps its original `__name__` and docstring.

## Idiomatic example
```python
from functools import wraps

def log_calls(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        print(f"calling {func.__name__}")
        return func(*args, **kwargs)
    return wrapper
```

## Common mistakes
- Forgetting `@wraps(func)` on the inner wrapper, so introspection tools see the wrapper's name/docstring instead of the original function's.
- Forgetting to `return` the wrapper from the decorator, or forgetting the wrapper returns the wrapped call's result.
- Building a decorator *with arguments* but missing one level of nesting — it needs three: `decorator_factory(args) -> decorator(func) -> wrapper(*a, **kw)`.

## Where you see it in real code
- Web framework routes (`@app.get("/users")`), which register a function without changing how it's called.
- Caching (`@functools.lru_cache`) and retry/backoff decorators around flaky I/O calls.
- Access control (`@login_required`) wrapping view functions with a check before the real body runs.
