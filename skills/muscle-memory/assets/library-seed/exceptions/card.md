# Custom exceptions and `try`/`except`/`else`/`finally`

## What it is
Custom exception classes (subclassing `Exception`) let callers catch your specific error instead of a generic one. `try`/`except` handles the failure; `else` runs only if no exception was raised; `finally` always runs, for cleanup that must happen either way.

## Idiomatic example
```python
class InsufficientFundsError(Exception):
    pass

def withdraw(balance: float, amount: float) -> float:
    if amount > balance:
        raise InsufficientFundsError(f"cannot withdraw {amount} from {balance}")
    return balance - amount
```

## Common mistakes
- Catching bare `except:` (or `except Exception:` too broadly), swallowing bugs you didn't mean to handle.
- Raising a generic `Exception("...")` instead of a specific custom exception, forcing callers to parse the message string.
- Putting cleanup logic in `except` instead of `finally`, so it gets skipped when no exception occurs.

## Where you see it in real code
- Domain-specific exceptions like `OutOfStockError`, `PaymentDeclinedError` that a service layer catches and maps to an HTTP status.
- `finally` blocks that release a lock, close a connection, or roll back a transaction.
- `else` blocks that run code only after a risky operation succeeded (e.g. logging a successful write).
