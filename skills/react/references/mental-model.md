# The front-end mental model — five words that explain most bugs

Frameworks change every few months; these five ideas do not. When something on screen is wrong,
find which of the five is misplaced before touching code.

| Word | What it is | The mistake it explains |
|---|---|---|
| **Component** | A function that takes props and returns UI. A boundary, not a file. | One giant component that fetches, formats and renders: nothing reusable, everything re-renders. |
| **State** | Data that changes over time and that the screen must reflect. | State copied from props, or derived values stored (`fullName` in `useState`) and left to drift. |
| **Hooks** | The way a function component remembers (`useState`) or reaches outside itself (`useEffect`). | Effects used to *compute* things (derive in render instead), missing/extra dependencies, hooks called in conditions. |
| **Rendering** | Running your component to produce a description of the UI; React diffs it and updates the DOM. | Thinking render is a one-off: it runs on every state/prop change, so it must be pure and cheap. |
| **Hydration** | In SSR/SSG, the server sends HTML; the browser then attaches React to it so it becomes interactive. | Server and client producing different output (`Date.now()`, `Math.random()`, `window`, locale formatting): hydration mismatch. |

## Rules that follow

- **State** goes to the outermost place that still needs it and no further (URL → server → shared
  parent → component). See [`../SKILL.md`](../SKILL.md) and `ui-engineering`.
- **Derive, don't mirror.** If it can be computed from props/state during render, compute it there.
- **Render is pure.** No fetches, timers, `localStorage`, random or time reads in the body. Those
  go in event handlers or effects.
- **An effect is for synchronizing with something outside React** (a subscription, the DOM, a
  network call). If you are using it to set state from other state, delete it.
- **Hydration needs identical first output.** Anything that differs between server and browser
  renders after mount (`useEffect` sets it) or is marked with `suppressHydrationWarning` only for
  genuinely unavoidable text (a timestamp). Never use that flag to silence a real mismatch.
- **Server vs client boundary** (frameworks with server components): data and secrets stay on the
  server side; the client component gets only what it needs. A secret read in a client component
  is public. See `secure-coding` hole 3 and 6.

## Quick diagnosis

| Symptom | Look first at |
|---|---|
| "Text content does not match server-rendered HTML" | Hydration: a non-deterministic value in the first render |
| Value is one step behind / stale in a handler | State: closure over an old value; use the functional update or derive it |
| Infinite re-render loop | Hooks: an effect that sets state it depends on |
| Whole tree re-renders on every keystroke | State: it lives too high; colocate it or select a narrow slice |
| Works on reload, breaks on navigation (or reverse) | State: it should be in the URL, or an effect ran once too often |
