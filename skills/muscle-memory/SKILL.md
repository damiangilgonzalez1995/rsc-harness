---
name: muscle-memory
description: "Python practice gym — generates short katas from the user's recent code, tracks progress, and reviews solutions. Use when the user wants to practice/keep their coding sharp, review a kata solution, or check practice progress."
tags: ["practice", "python", "katas"]
---

# Muscle Memory

## 1. Purpose and mode detection

Keeps hand-coding skill sharp for someone who delegates most coding to agents. It
mines the user's own recent code for concepts (classes, decorators, context
managers, design patterns...), turns them into tiny Python katas (<=10 min each),
and lets the user solve them in a local, offline-capable web app with instant
green/red feedback. Progress is tracked with spaced repetition across sessions.

There are three modes. Pick one from the user's message; if genuinely ambiguous,
ask in a single line rather than guessing.

- **Generate** (default): "quiero practicar", "ponme ejercicios", "practice
  session", "keep my coding sharp" -> build a new session of katas.
- **Review**: "review my solution", "revisa mi solucion", "corrige esto" -> mark
  a submitted solution and update progress.
- **Progress**: "how am I doing", "como voy", "sube el nivel", "ya no quiero
  practicar X", "stop asking me about X" -> report status, adjust levels, or
  retire/reactivate a topic.

Run the bootstrap check (section 2) before any of the three, every time.

## 2. Bootstrap (automatic, idempotent)

The gym lives **inside the project the user is working in**, in a git-ignored
folder so it never enters commits, CI, or PRs. The data folder is
`<project-root>/muscle-memory/`, where `<project-root>` is the top level of the
current git repo (`git rev-parse --show-toplevel`); if the cwd is not a git
repo, fall back to the cwd itself. Every path below (`GYM`) means this folder.
Progress and history are therefore per-project, which is intended: practice
follows the code you are actually working on.

First, make sure git ignores the folder: if `<project-root>/.gitignore` does
not already ignore it, append a line `/muscle-memory/` to it. (Skip this step
when there is no git repo.)

Then check whether `GYM` (`<project-root>/muscle-memory/`) exists.

- **If it does not exist**, create it in one pass:
  - Copy `assets/app/` (this skill's folder) to `GYM/app/`.
  - Copy `assets/library-seed/` to `GYM/library/`.
  - Copy `assets/user-readme.md` to `GYM/README.md`.
  - Create empty `GYM/sessions/` and `GYM/solutions/`.
  - Create `GYM/progress.json` with
    `{"concepts": {}, "excluded": [], "sessions": []}`.
- **If it already exists, do not touch it.** Don't re-copy the app or the
  library seed. The app is only refreshed if the user explicitly asks to
  update it (e.g. "update the muscle-memory app").

`scripts/build_session.py` also creates `progress.json` with this same shape if
it is missing when a session is built, so a missing bootstrap step is not fatal
to Generate — but do the bootstrap explicitly so `library/`, `app/` and
`README.md` exist too.

## 3. Generate: build a practice session

**How many katas:** default **7** per session. Honor any count the user asks
for ("ponme 5", "una sesion corta"). This is the target for step 2.

**The point of this skill is that katas come from the user's OWN code.** The
default path is to *reconstruct real code from the repo*, not to serve generic
library exercises. The library is a fallback for when the scan yields too
little, never the first choice.

1. Run the scanner from the current repo:
   `python <skill-dir>/scripts/scan_repo.py --days 7 --repo <cwd>`.
   - If it prints `[warn] Not a git repository` or `[warn] No .py files
     modified...`, say so and offer to pick a topic from
     `GYM/library/` instead (list the concept folder names).
   - Read **`## Reconstruction candidates`** first — this is your primary
     material: real functions/methods from the repo, ranked by how much logic
     they carry (`file:line symbol(sig) [logic N]`). Also read
     `## Candidate concepts` (used only for progress/leveling).
   - Widen the window if needed: if fewer than the target number of good
     candidates appear, re-run with `--days 30` (or higher) before falling
     back to the library.

2. Pick the session's katas — target the requested count (default 7),
   **reconstruction candidates first**, applying the balancing rules:
   - Prefer symbols with real, self-contained logic you can rebuild without
     the project's frameworks (validation, parsing, access rules, scoring,
     state machines, dispatch). Skip thin framework glue (a route handler that
     just calls a service, a Pydantic/SQLAlchemy model with no logic).
   - Spread across different files/subsystems so the session isn't all one
     corner of the repo.
   - Only fill remaining slots from `GYM/library/` if the scan can't supply
     enough good candidates. Say so if you fall back.

   **Balancing rules (mandatory, never skip):**
   - Never pick a slug listed in `progress.json.excluded`.
   - Never reuse a `skeleton` provenance id that appears in any of the last 3
     entries of `progress.json.sessions[].skeletons` (don't reconstruct the
     same real symbol, or reuse the same library skeleton, twice in a row).
   - Skim `GYM/history.md` (most recent entries) for what was covered recently.

3. Build each kata. **For a reconstruction candidate (default path):**
   - `Read` the symbol's real source at `file:line`.
   - Rebuild it as a **self-contained, stdlib-only kata**: keep the real name,
     the real parameter names, and the real logic; strip the framework
     dependencies (replace a SQLAlchemy row with a plain dict/dataclass, a
     `Session` query with an in-memory list, `UUID`/`datetime` are fine —
     they are stdlib). The user must recognize their own code.
   - Write the four fields: `spec_html` (1-3 sentences, in the conversation
     language, describing the real behavior), `stub` (real signature + a
     `# TODO`), `test` (2-4 `test_*` with didactic asserts covering the real
     rules/branches), `canonical` (your dependency-free reconstruction).
   - Classify the kata's dominant `concept` (a slug from `CONCEPT_SLUGS`, e.g.
     the access-scope function is `exceptions`/`comprehensions`/`classes`
     depending on what it exercises) and set `level` from
     `progress.json.concepts[slug].level` (default 1). Set `skeleton` to the
     provenance id `repo:<relpath>#<symbol>`.
   - **Validate before shipping** (the validator is CPython, not the browser —
     see `references/kata-authoring.md`): confirm the canonical passes its own
     tests, uses only stdlib, and — if async — the tests are `async def` +
     `await`, never `asyncio.run(...)`. The cheap way: drop the kata JSON into
     a temp `library/<slug>/katas/` dir and run
     `python <skill-dir>/scripts/validate_library.py <tmpdir>` until `PASS`.

   **For a library fallback kata:** read `GYM/library/<slug>/katas/l<level>-*.json`,
   translate `spec_html_en` -> `spec_html`, recontextualize names to the repo
   where it helps, and set `skeleton` to `lib:<slug>/<file-without-.json>`.

4. Write the session as JSON (`id`, `date`, `project`, `title`, `lang`,
   `katas[]` with `id`, `title`, `concept`, `level`, `spec_html`, `stub`,
   `test`, `canonical`, `skeleton`) to a temp file, built with `json.dumps` (or
   an equivalent structured writer) — never hand-assembled, to avoid escaping
   bugs.
   - `id` MUST follow `YYYY-MM-DD-<repo-slug>` (repo folder name, lowercased,
     non-alphanumerics to `-`). If a session with that `id` already exists in
     `GYM/sessions/`, append `-2`, `-3`, ... — `build_session.py`
     uses `id` as both the filename and the dedup key, so reusing one silently
     overwrites the earlier session's `.js`, its canonicals, and its
     `progress.json` entry.
   - `project` is the repo folder name; `date` is today in `YYYY-MM-DD`.
   - Each kata's `id` is `kata-01`, `kata-02`, ...; `title` is the adapted
     (translated) title, `spec_html` the adapted enunciado.
   Then run:
   `python <skill-dir>/scripts/build_session.py <tmp.json> <GYM>`
   This writes `sessions/<id>.js`, regenerates `sessions/manifest.js`, writes
   the canonical solutions to `sessions/canonical/`, registers the session in
   `progress.json`, and appends an entry to `history.md`.

5. **Open the app for the user automatically** — do not just tell them the
   path. Launch `GYM/app/index.html` in their default browser:
   - Windows: `cmd.exe /c start "" "<GYM-windows-path>\app\index.html"`
   - macOS: `open "<GYM>/app/index.html"`
   - Linux: `xdg-open "<GYM>/app/index.html"`
   If a browser tab for the app is likely already open (a session was generated
   earlier this conversation), tell them to reload instead of opening a second
   tab. Also print the `file://` URL as a fallback in case the auto-open is
   blocked. Then, in one sentence, tell them to solve the katas and hit Run.

**Speed budget**: reconstructing 7 katas from real code is real work (reading
source, rebuilding, validating) — a few minutes is expected and fine; the
value is in the relevance, not the speed. Reuse across katas: validate them in
one batch (one temp dir, one `validate_library.py` run). Pure library-fallback
sessions are the fast path but not the goal.

## 4. Review: mark a submitted solution

1. Read the solution from `GYM/solutions/` (the user downloads it
   there from the app) or directly from the chat if pasted.
2. Run it against the kata's test with local Python (everything is stdlib):
   `exec` the solution and the kata's `test` code in the same namespace and
   call the `test_*` functions, same approach as
   `scripts/validate_library.py`'s subprocess runner. If there is no local
   Python available, say so explicitly and rely on the green/red result the
   user reports from the app instead.
3. Compare the solution with `sessions/canonical/<sessionId>__<kataId>.py`.
   Give feedback as a **diff**, at most 2-3 improvement points, coach tone:
   celebrate what's right before pointing out what to improve. Never lecture.
4. Update `progress.json` for that concept: `seen += 1`; `passed += 1` if it
   passed; `last = <today>`; raise `level` (max 4) after 2 consecutive passes
   at the current level; lower it after 2 consecutive failures.
5. Append a line to `history.md`:
   `- Resultado: X/Y en verde; <concepto> fallada (<motivo corto>)`.

## 5. Progress: status, adjustments, retiring topics

- Give a short summary built from `progress.json` (mastered concepts, weak
  ones, what's due next per spaced repetition) plus recent `history.md`
  entries.
- Manual adjustments on request (e.g. "sube el nivel de X") edit
  `progress.json` directly.
- **Retiring a topic**: if the user says "ya no quiero practicar X" / "ya me
  lo se" / "stop asking me about X", add the slug to `progress.json.excluded`
  and append to `history.md`:
  `- Usuario retira "X": ya lo domina. No volver a proponerlo.`
  Generate must never pick an excluded slug (section 3, balancing rules).
- **Reactivating**: if the user asks to practice it again, remove the slug
  from `excluded` and append a matching note to `history.md`.

## 6. Non-negotiables

- Katas are solvable in **10 minutes or less**.
- Katas are **reconstructed from the user's own code** by default (real names,
  real logic, framework deps stripped so they run in Pyodide). The generic
  library is a fallback only when the scan can't supply enough — and you say so
  when you fall back. Inventing an unrelated toy domain is a failure of the
  skill's whole purpose.
- **Run the code before judging it** — never give feedback on a solution
  without actually executing it against its test.
- Tone is **coach, not judge**: celebrate before correcting.
- **Never write outside `GYM` (the project's `muscle-memory/` folder).** The skill only reads the
  analyzed repo; it never modifies it.
