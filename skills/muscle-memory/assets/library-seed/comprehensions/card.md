# List and dict comprehensions

## What it is
A comprehension builds a new list/dict/set from an iterable in a single expression: `[expr for item in iterable if condition]`. It replaces the common pattern of creating an empty container, looping, and appending — same result, less code.

## Idiomatic example
```python
prices = {"pen": 1.5, "mug": 8.0, "bag": 25.0}
cheap_names = [name for name, price in prices.items() if price < 10]
```

## Common mistakes
- Nesting so many loops/conditions into one comprehension that it becomes harder to read than the original `for` loop — past 2 clauses, prefer a plain loop or a helper function.
- Using a comprehension purely for side effects (e.g. `[print(x) for x in items]`) instead of a normal `for` loop — comprehensions should build a value.
- Forgetting a dict comprehension needs `key: value`, not just an expression — `{x for x in items}` builds a set, not a dict.

## Where you see it in real code
- Transforming API response rows into a lookup dict (`{row["id"]: row for row in rows}`).
- Filtering and mapping collections in one line (`[u.email for u in users if u.active]`).
- Building sets of unique values out of a larger list (`{item.category for item in items}`).
