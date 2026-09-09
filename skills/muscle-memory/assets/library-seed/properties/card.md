# The `@property` decorator

## What it is
`@property` turns a method into something accessed like a plain attribute (no parentheses), letting you compute a value on the fly or add validation on write, without changing the calling code. Pair it with `@name.setter` when the attribute also needs to be assignable.

## Idiomatic example
```python
class Circle:
    def __init__(self, radius: float):
        self._radius = radius

    @property
    def area(self) -> float:
        return 3.14159 * self._radius ** 2
```

## Common mistakes
- Defining a setter without a matching getter property first (the `@x.setter` decorator needs `x` to already be a property).
- Forgetting the leading underscore convention for the backing attribute (`self._radius`), which causes infinite recursion if the property and attribute share the same name.
- Putting expensive or side-effecting work behind a property, surprising callers who expect attribute access to be cheap.

## Where you see it in real code
- Read-only computed fields on models (`full_name` from `first_name` + `last_name`).
- Validated setters (e.g. rejecting a negative `price` or empty `email`).
- Lazy-loaded attributes that fetch or cache a value the first time they're read.
