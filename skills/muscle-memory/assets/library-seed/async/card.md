# `async`/`await`

## What it is
`async def` defines a coroutine: calling it doesn't run the body immediately, it returns a coroutine object that must be awaited or scheduled to actually run. `await` pauses the current coroutine until another awaitable finishes, letting the event loop run other work meanwhile. `asyncio.run(...)` starts the event loop and runs one coroutine to completion; `asyncio.gather(...)` runs several coroutines concurrently and waits for all of them.

## Idiomatic example
```python
import asyncio

async def fetch(name: str) -> str:
    await asyncio.sleep(0.01)
    return f"{name}: ok"

asyncio.run(fetch("service"))
```

## Common mistakes
- Calling an `async def` function without `await`/`asyncio.run` — you get a coroutine object back, not the result, and Python warns it was "never awaited".
- Using `time.sleep()` inside a coroutine instead of `await asyncio.sleep()` — it blocks the whole event loop instead of yielding control.
- Awaiting independent coroutines one by one in a loop instead of running them concurrently with `asyncio.gather(...)`.

## Where you see it in real code
- Concurrent HTTP calls to multiple services, gathered together instead of awaited sequentially.
- Async web frameworks (FastAPI route handlers) that `await` database or network calls without blocking other requests.
- Background tasks that poll or wait for an event without freezing the rest of the program.
