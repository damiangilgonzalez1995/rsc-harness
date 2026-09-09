# ADR index

An ADR is an architecture decision already made, with its rationale and the
alternatives that were discarded. **They are read before touching the area they
cover**, not after.

Rules for this folder:

- **MADR format**, one file per decision: `ADR-NNN-title-in-kebab-case.md`.
- An ADR **is not edited to change your mind**: a new one is written that
  replaces it, and the old one is marked *Superseded by ADR-NNN* with the link.
- An ADR **is not a plan or a design**. Designs and plans live elsewhere and do
  not replace an ADR.

## Where to start depending on what you're touching

### Area

| ADR | What it's about | Status |
|---|---|---|
| `[001](./ADR-001-title.md)` | What it decides and when to read it. | Accepted |

### Retired or superseded

| ADR | What happened |
|---|---|

## When a new ADR is needed

A structural refactor, a major dependency change, an architecture decision, or
a change to a contract. The practical test: if in six months someone is going to
ask "why is it done this way" and the answer isn't in the code, an ADR is needed.
