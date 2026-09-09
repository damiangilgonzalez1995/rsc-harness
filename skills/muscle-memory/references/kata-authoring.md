# Kata authoring guide

How to write a new kata skeleton for `library/<concept>/katas/l<level>-<slug>.json`,
and how to adapt an existing skeleton into a session kata. Read this whenever
Generate needs to create a card that doesn't exist yet, or whenever you want to
extend the library with a new concept.

A skeleton is a JSON object with exactly these fields:

```json
{
  "concept": "context-managers",
  "level": 2,
  "title_en": "Build ManagedConnection with __enter__/__exit__",
  "spec_html_en": "<p>...</p>",
  "stub": "...",
  "test": "...",
  "canonical": "..."
}
```

`concept` must be one of the canonical slugs in `scripts/scan_repo.py`'s
`CONCEPT_SLUGS`, and must match the folder it lives in
(`scripts/validate_library.py` enforces both). `level` is `1`-`4`. Everything
must be valid Python (`stub`, `test`, `canonical` are each parsed and, for
`canonical` + `test`, actually executed — run `validate_library.py` after
writing a new card and fix anything it reports as `FAIL`).

> **Gotcha — the validator is not the browser.** `validate_library.py` runs
> katas on local CPython, but the user solves them in Pyodide (browser wasm),
> where an asyncio event loop is *already running*. A kata can pass the
> validator and still fail in the app. The known case: `asyncio.run(...)`
> inside a test raises `RuntimeError: cannot be called from a running event
> loop` in Pyodide (see the async rule under "How to write tests" — use
> `async def test_*` + `await`). Whenever a new concept could behave
> differently under a running event loop or in wasm, verify it in the actual
> app, not just the validator.

## The concept card (`library/<concept>/card.md`)

Every concept folder also has a `card.md`: the study material the user reads,
and the context Generate leans on. When you add a new concept, write its card
with exactly these four sections, in this order (match the 20 existing cards),
in English:

```markdown
# <Concept name>

## What it is
One short paragraph: what the concept is and when you reach for it.

## Idiomatic example
​```python
# a few lines of the canonical, idiomatic form
​```

## Common mistakes
- 2-4 bullets naming the real pitfalls (mutable default args, forgetting
  `self`, comparing without an `isinstance` guard, ...).

## Where you see it in real code
- 1-3 bullets tying it to real-world usage (ORM models, service classes,
  context-managed connections, ...).
```

Keep it tight — it is a study cheat-sheet, not a tutorial.

## Signal -> concept slug mapping

This is what `scan_repo.py` detects in the user's code and how it maps to a
library folder name. Use it to pick the right concept when a scan surfaces
several signals in the same file:

| Signal in the user's code | Slug |
|---|---|
| Any class definition | `classes` |
| `@staticmethod` / `@classmethod` (no `property`) | `methods` |
| `@property` | `properties` |
| `@dataclass` decorator or `from dataclasses import ...` | `dataclasses` |
| Non-`__init__`/`__enter__`/`__exit__`/`__iter__`/`__next__` dunder method | `dunder-methods` |
| Class with base classes, or `from abc import ...` | `inheritance` |
| `class X(Enum)` or `from enum import ...` | `enums` |
| `try`/`except` block | `exceptions` |
| `Optional`/`Union`/`Protocol`/`TypedDict` from `typing` | `typing` |
| `__enter__` method, or `from contextlib import ...` | `context-managers` |
| Any other decorator (not `dataclass`/`property`/`static`/`classmethod`) | `decorators` |
| `yield` / `yield from` in a function | `generators` |
| List/set/dict comprehension or generator expression | `comprehensions` |
| `__iter__`/`__next__` methods | `iterators` |
| `async def`, `await`, or `import asyncio` | `async` |
| A class/function that builds and returns other objects by type/config | `factory` |
| An object holding a swappable callable/behavior | `strategy` |
| A publish/subscribe or notify-list pattern | `observer` |
| A class wrapping one interface to expose another | `adapter` |
| A class restricting itself to one instance (module-level cache, `__new__` guard) | `singleton` |

If a scanned file shows a signal not in this table, fall back to the closest
fundamental (usually `classes` or `exceptions`) rather than inventing a new
slug — `CONCEPT_SLUGS` is a closed set on purpose.

## Brevity rules (non-negotiable)

- **<=25 lines to write.** Count only the code the user actually has to
  produce (the stub's `TODO` region), not the surrounding class/test scaffolding.
- **One concept per kata.** Don't smuggle a second concept in "for realism" —
  a context-manager kata should not also require a decorator.
- **Spec is 1-3 sentences.** State the class/function name, its
  signature, and the exact behavior expected. No prose, no motivation
  paragraph. Use `<code>` for identifiers.
- **Stdlib or Pyodide-safe only.** No `pip`/`micropip` packages. The kata
  runs both via local `python` (Review) and via Pyodide in the browser
  (the app) — anything not in the standard library breaks one of the two.
- **Stub comes with the signature already in place.** The user fills in a
  body, not a blank page: parameter names, `self`, return type intent (via the
  spec) should already be visible in the stub. A bare `pass` with no signature
  is a bad stub.

## How to write tests

- Test functions are named `test_*` — this is how both the local runner and
  the app's Pyodide runner discover them (`ns` gets `exec`'d, then every
  callable starting with `test_` is invoked).
- Every `assert` carries a **didactic message** as its second argument: it
  should explain the rule being checked, not just restate the assertion
  (`"__exit__ must run even if the with-block raises"`, not `"failed"`).
- Cover **3 cases**: the normal/happy path, one edge case (empty input,
  boundary value, "equal to the limit" rather than strictly over/under), and
  one case that exercises error handling if the concept involves it
  (exception raised/propagated, invalid state).
- **Do not depend on dict ordering, wall-clock time, or `repr()`/`str()`
  output** unless the kata is specifically about `__repr__`/`__str__`. Compare
  values, not incidental representations.
- **Tests must be self-contained and order-independent.** Each `test_*`
  function builds its own fixtures (fresh instances, fresh lists) — never
  rely on a previous test having run first or on module-level mutable state
  a test mutates and another reads.
- **Async katas: write `async def test_*` and `await` the coroutine — never
  `asyncio.run(...)`.** In the browser (Pyodide) an event loop is already
  running, so `asyncio.run()` raises `RuntimeError: asyncio.run() cannot be
  called from a running event loop`, even though it works under local
  `python`. Both runners detect a coroutine-returning test and await it, so an
  `async def test_x(): result = await my_coro(...)` works in both. A sync
  helper test (e.g. `inspect.iscoroutinefunction(...)`) stays a plain `def`.
- Prefer 2-3 test functions per kata (see the examples below); more than 4
  usually means the kata covers more than one concept.

## One example per level

**Level 1 — recall** (`classes/katas/l1-init.json`): fill in a constructor
whose fields are already used elsewhere in the stub (`deposit` reads
`self.balance`). Tests check each stored field plus one line of behavior that
depends on it.

**Level 2 — reconstruction** (`context-managers/katas/l2-managed-connection.json`):
implement a small protocol (`__init__`/`__enter__`/`__exit__`) from a spec
that states each method's exact side effect. Tests check the happy path, the
exact order of side effects, and that cleanup still runs when the block
raises.

**Level 3 — application** (`strategy/katas/l3-router-swap.json`): build a
class that composes a behavior at runtime (`Router` holding a swappable
`strategy` callable) and exercises it through 2-3 collaborators. Tests check
the initial behavior, that swapping actually changes behavior, and that
swapping back works (state isn't hidden anywhere else).

**Level 4 — refactor** (`comprehensions/katas/l4-heavy-pallets.json`): a
working implementation is given (a manual loop) and the task is to rewrite it
idiomatically (as a comprehension) without changing behavior. The spec says
explicitly "it already works, rewrite the body as...". Tests are behavioral
only (they don't inspect the source) so both the loop and the comprehension
would pass — the human value is in reading the rewritten `canonical`.

## Mistakes to avoid

- Writing a spec that describes *why* something matters instead of *what* to
  implement — cut it to the signature and the behavior.
- A stub that gives away the solution (e.g. already showing the one line
  that matters) or one so bare it doesn't compile the surrounding scaffolding.
- Tests with generic messages (`"wrong result"`) instead of naming the rule.
- Mixing two concepts in one kata "to save a slot" — write two katas instead.
- A `canonical` that doesn't actually satisfy its own `test` — this is
  exactly what `validate_library.py` catches; never skip running it after
  writing or editing a skeleton.
- Depending on insertion order of a `dict`/`set` literal across Python
  versions, or on `datetime.now()`/`time.time()` inside a test.
- Forgetting the `concept` field must equal the folder name
  (`library/<slug>/katas/...json` -> `"concept": "<slug>"`), or picking a
  `level` outside `1`-`4` — `validate_library.py` rejects both.

## How to adapt a skeleton for a session

When Generate reuses an existing `library/<slug>/katas/l<level>-*.json` for a
session kata, adapt only two things:

1. **Translate the statement** (`spec_html_en` -> `spec_html`) and the title
   (`title_en` -> `title`) into the language the user is conversing in. Keep it
   literal unless recontextualizing (below) requires renaming something inside
   it.
2. **Recontextualize names to the user's domain** when it adds clarity — e.g.
   rename `Router`/`plan`/`distance` to something from the scanned repo's
   domain if a natural fit exists (a maintenance-incident router, a
   discount-strategy for tariffs...). If nothing fits naturally, keep the
   original names translated as-is; a forced rename is worse than a neutral
   one.

**Do not touch the test's structure** beyond consistent renames. If you
rename `Router` to `IncidentRouter` in the `spec_html`/`stub`, rename it
identically in `test` and `canonical` too — the same identifier, everywhere,
in all three fields. Do not add, remove, or reorder assertions, do not change
what's being tested, and do not introduce a second concept while adapting.
The three cases (happy path, edge case, error case) and their didactic
messages carry over unchanged except for the renamed identifiers.
