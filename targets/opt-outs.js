// Which `.no-*` switches are the TEAM's decision and which are THIS MACHINE's.
//
// `project-manifest` moved disarmed gates into the committed declaration because they are
// decisions and decisions should not evaporate on `git clone`. What it did not settle is that
// not every switch is the same kind of decision, and one of them is actively dangerous to share:
//
//   `.no-harness` means "do not offer to build the harness ON THIS MACHINE" — the bootstrap says
//   exactly that when it offers it. Let it travel and one person declining, once, would silence
//   the offer in every future clone: a whole team losing the harness because somebody's laptop
//   said no. The same reasoning covers an MCP connection (consent is individual), a check that
//   compares two scopes of one machine, and a nudge that can only fire in a project with no
//   `.git/` — which a clone, by construction, is not.
//
// A table and not a chain of ifs, so a test can iterate it and `clone-bootstrap.mjs` — which is
// committed, standalone and cannot import from the package — can be held against it instead of
// drifting away from it in silence.

/** Decisions of the project: they belong in `.rsc.json` and are rebuilt in a clone. */
export const PROJECT_OPT_OUTS = [
  'archive-guard',    // docs/archive/ closed to the agent: what sweep archived stays archived for everyone
  'audit',            // cadence of this project's skill audit
  'claudemd-check',   // the root CLAUDE.md context budget
  'copypasta-hint',   // the session-start reminder to look in the recipe book before building a new piece
  'danger-guard',     // foot-gun denial, keyed to the committed user profile
  'feature-gate',     // per-turn re-injection of the SDD gate
  'gitmoji',          // the commit-message convention
  'knowledge-sync',   // 01-TOOLS/ + docs/ sync: one person off and the team stops seeing their work
  'ship-guard',       // branch/trunk discipline
  'stack-hints',      // the session-start reminder that matches the stack (security floor, front-end model)
  'trunk-guard',      // «desbloquea main»: the default branch open for the agent, for the whole team
  'trunk-open',       // «ramas y PR»: the default branch closed even with nothing that looks complex
  'worktree-cleanup', // the reaper's notice (it only ever names, never acts)
  'worktree-isolation', // «no uses worktrees»: same-folder sessions allowed to share a checkout
];

/** Decisions of one machine: never written to the manifest, never applied from it. */
export const MACHINE_OPT_OUTS = [
  'context7',   // an MCP connection is machine wiring, and its consent is individual
  'git',        // only fires with no .git/, which a clone cannot be
  'harness',    // "not offered again ON THIS MACHINE" — the bootstrap's own words
  'inspo',      // the Inspo design MCP: same as context7, connecting it is one person's call
  'plugin-check', // installing a Claude Code plugin happens per machine (scope user)
  'scope-check',// compares the project and home scopes OF THIS MACHINE
];

export const isProjectOptOut = (name) => PROJECT_OPT_OUTS.includes(name);

/** The project-level subset of a manifest's `optOuts`, unknown names dropped. */
export const projectOptOuts = (list) => [...new Set((list || []).filter(isProjectOptOut))].sort();
