# Generators (`yield`)

## What it is
A generator function uses `yield` instead of `return` to produce a sequence of values lazily, one at a time, without building the whole list in memory. Each step of iteration (`next()`, or a `for` loop) resumes the function right after the last `yield`.

## Idiomatic example
```python
def even_numbers(limit: int):
    n = 0
    while n < limit:
        if n % 2 == 0:
            yield n
        n += 1
```

## Common mistakes
- Calling the generator function and expecting a list back — it returns a generator object; you must iterate it (or wrap in `list(...)`) to get values.
- Iterating a generator twice, expecting it to restart — generators are exhausted after one full pass and must be recreated.
- Doing all the work eagerly and `yield`-ing only at the end, defeating the purpose of lazy evaluation.

## Where you see it in real code
- Streaming large files or query results line by line instead of loading everything into memory.
- Data pipelines that chain generators (`read -> filter -> transform`), each stage lazily pulling from the previous one.
- Unbounded sequences (retry delays, IDs) that would never fit in a list.
