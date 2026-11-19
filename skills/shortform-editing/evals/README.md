# Evals — shortform-editing

These are routing and capability checks for a human or an LLM judge, not a renderer test — nothing here
encodes a video. The scripts have their own tests: `tests/shortform-editing-inventario.test.js` (inventory and
the `## Reels` section of `CLAUDE.md`), `tests/shortform-editing-subs.test.js` (captions never above 70 % of
the height) and the local pytest suite in `skills/shortform-editing/tests/`.

Read `cases.yaml` and confirm the skill's `description` fires on every `should_trigger` prompt — including
the Spanish ones in the person's own words («edita el último vídeo de brutos», «corrige: el gancho más
grande») and the Catalan symptom-first one (captions covering the face) — and that each `should_not_trigger`
prompt routes to the named sibling instead (`video-shorts`, `social-publisher`, `remotion-video`,
`shortform-packaging`).

For the `capability` scenario, have the skill walk the empty project and grade the transcript line by line
against `must_include`: inventory first and `CLAUDE.md` updated, install only after explaining the ~3 GB and
getting a yes, brand interview (or a one-line skip when a handoff package brings `marca.md`), cut and
transcribe without touching `reels/brutos/`, contact sheet and an explicit yes before rendering, lower-third
captions and a free face, nothing uploaded, a new `_vN` export, and every turn ending in a question.
