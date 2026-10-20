#!/usr/bin/env node
// rsc Worklog checkpoint (claude). Wired by targets/claude.js onto PreCompact and
// SessionEnd as `node ...` so it runs on every platform including Windows.
//   argv[2] = absolute project root
// Reminds the agent to run a Worklog Sweep (capture what we did this session into
// docs/raw/worklog/). The hook only reminds; the agent writes the worklog.
// Silent when this workspace has no harness wiki yet.
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.argv[2] || process.cwd();

// No harness wiki here → nothing to document into. Stay silent.
if (!existsSync(join(root, 'docs', 'wiki'))) process.exit(0);

// The sweep used to open with the agent running `ls docs/raw/worklog` to see what was there, and in
// a wiki scaffolded before that folder existed (or whose .gitkeep never got committed) that printed
// an error into the session on every compaction. The hook already knows the answer, so it says it:
// what is there, or that the folder has to be created first. Nothing is left to list blindly.
// It does not create the folder itself: an untracked docs/raw/worklog/ is where the session memory
// prefers to keep its journal, and moving that store mid-session would orphan the session's anchor.
let state;
try {
  const entries = readdirSync(join(root, 'docs', 'raw', 'worklog')).filter((name) => name.endsWith('.md'));
  state = `docs/raw/worklog/ exists with ${entries.length} worklog file(s); no need to list it.`;
} catch {
  state = 'docs/raw/worklog/ does not exist yet: create it first (mkdir -p docs/raw/worklog); do not list it.';
}

process.stdout.write(`
===== rsc worklog checkpoint =====
If this session did meaningful work (files changed, a decision made, a commit),
run a WORKLOG SWEEP before context is lost:
  ${state}
  1. Write docs/raw/worklog/<YYYY-MM-DD>-<slug>.md using the harness
     wiki-worklog-template.md (what we did · why · files touched · outcome · next).
  2. Compile it into wiki/ (update existing articles first; wikilinks + Related);
     append significant decisions to docs/wiki/harness/decisions.md.
Skip entirely if this was a pure read/answer turn with no changes.
==================================
`);
