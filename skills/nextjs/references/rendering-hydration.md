# Rendering and hydration in the App Router

Short version of the five-word model (component, state, hooks, rendering, hydration) applied to
Next.js. The generic model is in `../../react/references/mental-model.md` when `react` is installed.

## Where each piece runs

| Piece | Runs | Can use | Cannot use |
|---|---|---|---|
| **Server Component** (default) | Server only, at request or build time | `await`, DB, secrets, `fs` | state, effects, event handlers, browser APIs |
| **Client Component** (`"use client"`) | Server for the first HTML **and** the browser after | state, effects, handlers | secrets (anything it imports ships to the browser) |
| **Server Action** (`"use server"`) | Server, called from the browser | DB, secrets | trusting its input: it is a public endpoint |

## Hydration, step by step

1. The server renders the component tree to HTML and streams it.
2. The browser paints that HTML (fast, not yet interactive).
3. The JS loads and React **hydrates**: it renders the client components again and expects the
   *same* output to attach handlers to the existing DOM.
4. If the output differs, React warns (and may discard and re-render the subtree).

## What breaks hydration

- `Date.now()`, `new Date()` formatting, `Math.random()`, `crypto.randomUUID()` in the render body.
- `typeof window !== "undefined"` branches that change the markup.
- Locale/time-zone formatting that differs between server and browser.
- Invalid nesting (`<div>` inside `<p>`, `<a>` inside `<a>`) that the browser "fixes" before React looks.
- Reading `localStorage`/`matchMedia` during render.

**Fix pattern:** render a stable first output, then update after mount.

```tsx
"use client";
import { useEffect, useState } from "react";

export function LocalTime({ iso }: { iso: string }) {
  const [text, setText] = useState(iso);          // same on server and first client render
  useEffect(() => setText(new Date(iso).toLocaleString()), [iso]); // browser-only, after hydration
  return <time dateTime={iso}>{text}</time>;
}
```

For values that must exist in render and legitimately differ (theme from a cookie), read them on
the server and pass them down, so both sides agree.

## Rules

- Keep `"use client"` as deep (as leaf-like) as possible; a client boundary drags its imports into
  the bundle.
- Pass the client component data, not the secret that produced it.
- Treat every Server Action and Route Handler as a public API: authenticate, authorize the object
  and validate the input again. See `secure-coding` (the 10 holes, points 5–7).
- `suppressHydrationWarning` is for a single known-different text node, never a blanket fix.
