# Observer

## What it is
The Observer pattern lets a subject keep a list of dependents ("observers"/subscribers) and notify all of them when something happens, without the subject knowing anything about what each observer does with the notification. It decouples "the thing that changes" from "the things that react to the change."

## Idiomatic example
```python
class Publisher:
    def __init__(self):
        self.subscribers = []

    def subscribe(self, callback):
        self.subscribers.append(callback)

    def notify(self, event):
        for callback in self.subscribers:
            callback(event)
```

## Common mistakes
- Mutating the subscriber list while iterating over it inside `notify` (e.g. a callback that unsubscribes itself), which can skip subscribers or raise.
- Forgetting to provide an `unsubscribe`, so observers accumulate forever and keep getting notified even after they should have stopped listening.
- Letting `notify` swallow exceptions from one observer silently, hiding bugs, or letting one failing observer stop every other observer from being notified.

## Where you see it in real code
- GUI/event systems: button `on_click` handlers, DOM `addEventListener`.
- Pub/sub messaging (Redis pub/sub, `asyncio` event emitters) notifying all consumers of a topic.
- Reactive state: signals/stores that re-render every subscribed component when the underlying value changes.
