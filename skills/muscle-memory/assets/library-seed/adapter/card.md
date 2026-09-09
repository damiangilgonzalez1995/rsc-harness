# Adapter

## What it is
The Adapter pattern wraps an object with an incompatible interface so it can be used wherever the expected interface is required, without modifying the wrapped object. The adapter translates calls: it receives a call in the new shape and turns it into the call(s) the wrapped (often legacy or third-party) object actually understands.

## Idiomatic example
```python
class LegacyLogger:
    def write_log(self, text):
        print(f'[legacy] {text}')


class LoggerAdapter:
    def __init__(self, legacy_logger):
        self.legacy_logger = legacy_logger

    def log(self, message):
        self.legacy_logger.write_log(message)
```

## Common mistakes
- Modifying the legacy/third-party class directly instead of wrapping it, coupling your code to something you don't control or can't safely change.
- Building an adapter that only renames a method (`log` calls `write_log`) when the real incompatibility is in the *data shape* — the adapter also needs to transform arguments, not just forward them.
- Forgetting that an adapter can hold state (e.g. "has this been initialized yet") when the legacy interface needs multiple calls to do what the new interface does in one.

## Where you see it in real code
- ORM/driver adapters that expose a common `execute(query)` interface over different underlying database client libraries.
- Third-party SDK wrappers in a codebase, isolating a vendor's clunky API behind the app's own clean interface.
- Adapting between sync and async interfaces, or between an old versioned API response shape and the shape the rest of the app expects.
