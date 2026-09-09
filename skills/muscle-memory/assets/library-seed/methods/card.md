# Instance, `@staticmethod` and `@classmethod`

## What it is
A regular method receives the instance as `self` and can read/change its state. `@staticmethod` drops that first argument entirely — it's just a function namespaced under the class. `@classmethod` receives the class itself as `cls`, which is the idiomatic way to build alternative constructors.

## Idiomatic example
```python
class Temperature:
    def __init__(self, celsius: float):
        self.celsius = celsius

    def to_fahrenheit(self) -> float:
        return self.celsius * 9 / 5 + 32

    @staticmethod
    def is_valid(celsius: float) -> bool:
        return celsius >= -273.15

    @classmethod
    def from_fahrenheit(cls, fahrenheit: float) -> "Temperature":
        return cls((fahrenheit - 32) * 5 / 9)
```

## Common mistakes
- Marking a method `@staticmethod` when it actually needs `self` or `cls`.
- Using `ClassName` hardcoded inside a `@classmethod` instead of `cls`, which breaks subclassing.
- Forgetting the decorator and calling `self.method()` when the intent was a helper that ignores instance state.

## Where you see it in real code
- `@classmethod` alternative constructors like `dict.fromkeys()` or `datetime.fromisoformat()`.
- `@staticmethod` utility/validation helpers grouped under a class for namespacing.
- Factory classes that pick an implementation via a `@classmethod` based on config.
