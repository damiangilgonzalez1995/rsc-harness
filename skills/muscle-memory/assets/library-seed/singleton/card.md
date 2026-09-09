# Singleton

## What it is
The Singleton pattern restricts a class to a single shared instance, usually enforced via `__new__`: the first call creates the instance and stores it; every later call returns that same stored instance instead of creating a new one.

## Idiomatic example
```python
class Singleton:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
```

## Common mistakes
- Forgetting that `__init__` still runs on *every* call to `Singleton()`, even when `__new__` returns the cached instance — re-initializing shared state by accident unless you guard it (e.g. `if not hasattr(self, ...)`).
- Sharing the `_instance` attribute across unrelated subclasses instead of keying storage by `cls`, so every subclass ends up returning the base class's single instance.
- **Reaching for Singleton at all**: it is global mutable state with a design-pattern name, which makes it hard to test (state leaks between tests unless explicitly reset) and hides a class's dependencies, since any code can silently reach the shared instance instead of receiving it explicitly.

## Where you see it in real code
- Usually a mistake: a "singleton database connection" or "singleton config" that becomes impossible to swap out in tests without monkeypatching class internals.
- **Better alternatives, almost always preferable**: a plain **module** (Python modules are already singletons — imported once, shared everywhere — with no `__new__` gymnastics needed), or **dependency injection** (construct the shared object once at startup and pass it explicitly to whoever needs it, keeping dependencies visible and testable).
- Legitimate uses are narrow: a process-wide resource that must genuinely be unique (e.g. a hardware lock), and even then a module-level instance usually beats a `__new__`-based class.
