---
name: write-adr
description: "Use when you need to record an architecture decision, open an ADR, amend or replace an existing one, or when a change is hard to revert and someone will ask in six months why it's done this way (structural refactor, major dependency, API contract, data partitioning, module boundaries)."
tags: ["adr", "architecture", "documentation"]
---

# Write an ADR

An ADR records a decision **already made**, with its rationale and the alternatives that were discarded. It is read before touching the area it covers. It is not a plan or a design: those live in specs and plans and do not replace it.

## When one is worth it

All three at once; if one is missing, there is no ADR:

1. **Hard to reverse**: changing your mind later is costly.
2. **Surprising without context**: reading the code, someone will ask "why on earth is it like this".
3. **Real trade-off**: there were genuine alternatives and one was chosen for concrete reasons.

Explicit "no"s count as much as "yes"es ("issues are NOT indexed").

## Procedure

1. **Read `docs/adr/README.md`** if it exists. Its rules on format, numbering, and the index override this skill. If it doesn't exist, create it from the [`README-TEMPLATE.md`](README-TEMPLATE.md) template.
2. **Number**: the highest one in `docs/adr/` plus one. Never reuse or backfill gaps.
3. **File**: `docs/adr/ADR-NNN-title-in-kebab-case.md`, three digits, a title with no accents or emoji.
4. **Body** from [`ADR-TEMPLATE.md`](ADR-TEMPLATE.md). Each decision is numbered `D1`, `D2`... so it can be cited ("ADR-036 D1") and superseded one at a time.
5. **Index**: add the row to the README, in the section of the area it touches, with a sentence saying what it decides and when to read it ("read before touching X").
6. **Cross-references**: if it supersedes or amends another ADR, touch that one too (see below).
7. **Confirm with the user** the title and the decisions before writing the file. The decision is theirs; you write it up.

## Changing your mind

An accepted ADR **is not rewritten**. Two paths:

- **Amendment** (same decision, new nuance): a blockquote `> **Amendment YYYY-MM-DD.** ...` right below the affected D, stating what changes and the trade-off accepted. Reflected in the index row.
- **Replacement** (different decision): a new ADR. The old one becomes `Status: Superseded by ADR-NNN` with a link and moves to the "Retired or superseded" section of the index. A single D can be superseded on its own ("Its D3 is superseded by ADR-041").

This way the history explains why it changed.

## Done criteria

- The file exists, the index has the row, and the affected ADRs point to the new one.
- Each D states what is done **and** what was rejected by doing it.
- "Discarded alternatives" has at least one with the reason for rejection; without it, someone will propose it again.
- Every figure, file, or PR cited is real: it has been checked against the repo.

## Common mistakes

| Mistake | Fix |
|---|---|
| An ADR that describes a plan ("we'll do X in three phases") | Only what was decided. The plan goes in `docs/superpowers/plans/` |
| Editing the old ADR to say the new thing | A dated amendment, or a new ADR that supersedes it |
| Context that tells the story of the session | Context that explains the problem and why the previous state didn't work |
| Consequences that are only positive | Note the accepted cost; that's what keeps the discussion from reopening |
| Deciding on your own a D the user hasn't stated | Ask. Recording is yours; deciding is theirs |
