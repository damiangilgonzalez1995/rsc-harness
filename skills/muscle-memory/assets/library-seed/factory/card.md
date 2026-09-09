# Factory

## What it is
The Factory pattern hides *how* an object gets constructed behind a function or method: callers ask for "a thing that does X" by name/key, instead of importing and instantiating a concrete class directly. A simple factory is a function that switches on a key; a registry-based factory keeps a dict mapping keys to constructors, so new types register themselves instead of the factory function growing an `if/elif` chain forever.

## Idiomatic example
```python
def create_shape(kind, **kwargs):
    if kind == 'circle':
        return Circle(**kwargs)
    if kind == 'square':
        return Square(**kwargs)
    raise ValueError(f'unknown shape: {kind}')
```

## Common mistakes
- Growing an ever-longer `if/elif` chain instead of switching to a registry dict once the number of cases grows.
- Forgetting the final `else`/`raise` branch, so an unknown key silently returns `None` instead of failing loudly.
- Coupling the factory to concrete classes directly (`Circle`, `Square` imported everywhere) instead of letting the caller depend only on the factory function's return type/interface.

## Where you see it in real code
- ORMs and serializers picking a field/column type from a string tag (`"varchar"`, `"integer"`).
- Plugin systems where each plugin registers itself under a name at import time (`@register('slack')`).
- Parser/exporter libraries choosing an implementation from a file extension or content-type string.
