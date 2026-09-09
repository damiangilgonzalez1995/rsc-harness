# Inheritance and `super()`

## What it is
Inheritance lets a subclass reuse and extend a base class's behavior. `super().__init__(...)` calls the parent's constructor so you don't duplicate its setup logic, and overriding a method lets a subclass replace or extend specific behavior while keeping the rest.

## Idiomatic example
```python
class Employee:
    def __init__(self, name: str):
        self.name = name

class Manager(Employee):
    def __init__(self, name: str, team_size: int):
        super().__init__(name)
        self.team_size = team_size
```

## Common mistakes
- Forgetting to call `super().__init__()` in the subclass, so the parent's attributes never get set.
- Overriding a method and losing the parent's behavior entirely when the intent was to extend it (missing a `super().method()` call inside the override).
- Deep inheritance chains where a small change in the base class breaks unrelated subclasses — prefer composition when behaviors don't share a true "is-a" relationship.

## Where you see it in real code
- Framework base classes (e.g. Django `Model`, FastAPI's exception classes) that you subclass and extend.
- Domain hierarchies like `Vehicle` -> `Car`/`Truck`, or `Notification` -> `EmailNotification`/`SMSNotification`.
- Overriding a `process()` or `validate()` method per subclass while sharing the rest of the workflow.
