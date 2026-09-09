# Type hints: `Optional`, `|`, `TypedDict`

## What it is
Type hints document what a function expects and returns without changing runtime behavior; tools like mypy and editors use them to catch mistakes early. `Optional[X]` (or `X | None`) means "X or nothing"; `TypedDict` describes the expected shape of a dict with named, typed keys.

## Idiomatic example
```python
from typing import Optional

def find_user(user_id: int) -> Optional[str]:
    users = {1: "Ana", 2: "Bo"}
    return users.get(user_id)
```

## Common mistakes
- Annotating a parameter as `Optional[X]` but forgetting the default is also `None` (`def f(x: Optional[int] = None)`), or forgetting to actually handle the `None` case in the body.
- Confusing `TypedDict` (a typing-only shape check, zero runtime behavior) with a real class or `dataclass` — a `TypedDict` is still just a plain `dict` at runtime.
- Using `Union`/`|` in a signature but never narrowing the type before using type-specific behavior, which is what type checkers flag.

## Where you see it in real code
- API layer functions where a lookup may legitimately return nothing (`Optional[User]`).
- `TypedDict` for JSON payloads exchanged with external APIs where a full class would be overkill.
- Public library functions annotated so IDEs autocomplete correctly for callers.
