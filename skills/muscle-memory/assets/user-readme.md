# muscle-memory

Your local training folder for the `muscle-memory` Claude Code skill. It lives
inside the project you're working in and is git-ignored, so it never enters
commits, CI, or pull requests. Everything here is yours and local; the rest of
the repo is only ever read, never written to. Progress and history are
per-project — practice follows the code you're actually working on.

## What's in here

- **`app/index.html`** — the training app. Self-contained (Pyodide + CodeMirror
  load from CDN, everything else is inline). Open it by double-clicking, no
  server needed.
- **`sessions/`** — one file per training session (`<date>-<project>.js`),
  plus `manifest.js` (which sessions the app shows, most recent first) and
  `canonical/` (reference solutions used for review; not shown in the app).
- **`library/`** — the concept catalog: one folder per concept (e.g.
  `context-managers/`, `strategy/`), each with a `card.md` study note and a
  `katas/` folder of ready-made kata skeletons. Read `card.md` files directly
  as a cheat sheet, or ask Claude to pull from them.
- **`solutions/`** — drop your downloaded `.py` solutions here for Claude to
  review them.
- **`progress.json`** — machine-readable progress: per-concept level, hits and
  misses, and any topics you've retired.
- **`history.md`** — a human-readable training log: what you practiced, what
  passed/failed, and any topics you asked to stop seeing.

## Opening the app

Double-click `app/index.html` (or open it in a browser). It reads
`sessions/manifest.js` to list your sessions — after Claude generates a new
one, just reload the page.

## Asking Claude for things

- **Start a session**: "quiero practicar" / "ponme ejercicios" / "keep my
  coding sharp" — Claude scans your current repo's recent code and builds a
  3-kata session out of it.
- **Get a solution reviewed**: drop the downloaded `.py` file in `solutions/`
  (or just paste your code) and say "revisa mi solucion" / "review my
  solution".
- **Check progress**: "como voy" / "how am I doing" — a short summary of
  what's solid, what's weak, and what's due next.
- **Retire a topic**: "ya no quiero practicar X" / "ya me lo se" — Claude
  stops proposing it. Ask again later to bring it back.
