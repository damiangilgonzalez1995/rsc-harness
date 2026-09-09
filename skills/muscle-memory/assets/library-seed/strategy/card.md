# Strategy

## What it is
The Strategy pattern extracts an algorithm into an interchangeable unit — often just a plain function in Python — so the object using it doesn't hardcode *how* something is computed. The caller passes in "the strategy" (a function or callable object) and the surrounding code stays the same no matter which strategy is used, including swapping it at runtime.

## Idiomatic example
```python
def apply_shipping(order, shipping_strategy):
    return shipping_strategy(order)


def standard_shipping(order):
    return order.weight * 0.5
```

## Common mistakes
- Reaching for a class hierarchy (`ShippingStrategy` base class + subclasses) when a plain function already satisfies the interface — Python doesn't need inheritance for this.
- Hardcoding the choice of strategy with `if/elif` inside the calling code instead of accepting the strategy as a parameter.
- Storing the strategy once at construction time with no way to change it later, when the whole point of a runtime strategy is being able to swap it.

## Where you see it in real code
- `sorted(items, key=...)` and `list.sort(key=...)` — the `key` function is a strategy for comparison.
- Pricing/discount engines that plug in a different calculation function per promotion or customer tier.
- Compression or serialization libraries that accept a `codec`/`format` callable to swap the algorithm without touching the caller.
