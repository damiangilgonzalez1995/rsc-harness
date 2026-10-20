#!/usr/bin/env node
// rsc Ship guard (claude). Wired by targets/claude.js onto PreToolUse (matcher Bash|PowerShell)
// as `node ...` so it runs on every platform including Windows.
//   argv[2] = absolute project root   stdin = PreToolUse hook JSON
//
// Enforces the "close the feature before you leave it" rule at the one deterministic
// moment it matters: when a Bash command tries to switch to the trunk (main/master)
// or merge into it. If the current feature branch has commits that were never pushed,
// the guard DENIES the command and tells the agent to run `ship` (commit → push → PR).
// Uncommitted changes alone only earn a hint: they may be the user's own work, and git
// already refuses a switch that would overwrite them. Opening the PR itself is `ship`'s job and the skill's
// hard rule; this hook guarantees you cannot quietly abandon unsaved/unpushed work.
//
// Design: precise (only fires on a trunk switch/merge), local-only (no network, no gh),
// and FAIL-OPEN — any ambiguity (detached HEAD, no repo, git error) allows the command.
// Opt out per project with .rsc/.no-ship-guard.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.argv[2] || process.cwd();

function allow() { process.exit(0); }
function deny(reason) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: reason,
    },
  }));
  process.exit(0);
}

// "Not a git repo" means: nothing to enforce. (The .no-ship-guard opt-out is checked
// AFTER the sello below — it opts out of THIS guard's branch-hygiene rules, not of a
// different feature that happens to share the hook. The sello has its own switch.)
if (!existsSync(join(root, '.git'))) allow();

// Read the tool call. Only Bash commands can move branches.
let input = {};
try { input = JSON.parse(readFileSync(0, 'utf8') || '{}'); } catch { allow(); }
if (!['Bash', 'PowerShell'].includes(input.tool_name || input.toolName)) allow();
const command = input.tool_input?.command || input.toolInput?.command || '';
if (typeof command !== 'string' || !command) allow();

// ---- sello gate (opt-in) ----------------------------------------------------
// When the sello is ON for this project, delivery commands (commit, push, PR)
// must match the sealed bytes. OFF (the default) → this block is a no-op and the
// guard behaves exactly as before. checkSello itself fails open on environment
// problems and denies only on real divergence/no-review/corruption (spec).
// Deliberately BEFORE the .no-ship-guard opt-out: that file disables this guard's
// branch-hygiene rules; the sello is a separate opt-in with its own `sello off`.
try {
  const { checkSello, isEnabled, isDeliveryCommand } = await import(new URL('./sello.mjs', import.meta.url));
  if (isDeliveryCommand(command) && isEnabled(root)) {
    const verdict = checkSello(root);
    if (!verdict.ok) deny(verdict.message);
  }
} catch { /* sello lib missing/unloadable → nothing to enforce, fail open */ }

// Ship-guard's own opt-out (branch hygiene only — the sello above already ran).
if (existsSync(join(root, '.rsc', '.no-ship-guard'))) allow();

// Does this command try to land on / move to the trunk?
const TRUNK = /\bgit\s+(?:checkout|switch)\s+(?:-{1,2}\S+\s+)*(?:main|master)\b/;
const MERGE = /\bgit\s+merge\b/;
if (!TRUNK.test(command) && !MERGE.test(command)) allow();

const git = (...args) => {
  const r = spawnSync('git', ['-C', root, ...args], { windowsHide: true, encoding: 'utf8' });
  return r.status === 0 ? (r.stdout || '').trim() : null;
};

const branch = git('rev-parse', '--abbrev-ref', 'HEAD');
// Not on a feature branch (already trunk, detached, or git failed) → nothing to guard.
if (!branch || branch === 'HEAD' || branch === 'main' || branch === 'master') allow();

const tail = '\n(If this is intentional and you accept the risk, create .rsc/.no-ship-guard to disable this guard.)';

// 1) Uncommitted changes are NOT a reason to deny. They may well be the user's own work in the main
// checkout, not the agent's: in real sessions this denied five branch switches over a diff the agent
// had no business committing, and "commit them first" pushed it to do exactly that. Git itself
// refuses a switch that would overwrite local changes, and carries the rest along untouched, so the
// switch is left to git and the agent gets a hint: leave that diff alone and work in a worktree.
// The unpushed-commits rule below is the guard's real purpose and still denies.
const dirty = git('status', '--porcelain');
const worktreeHint = dirty && dirty.length > 0
  ? `The working tree on "${branch}" has uncommitted changes, and they may be the user's, not yours: ` +
    `do not commit, stash or discard them to make room. If git refuses the switch, work in a separate ` +
    `worktree instead: \`git worktree add .claude/worktrees/<name> -b <branch> origin/main\` ` +
    `(or \`npx @damiangilgonzalez/harness worktrees new <name>\`).`
  : '';
function hint() {
  if (!worktreeHint) allow();
  process.stdout.write(JSON.stringify({
    systemMessage: 'ship-guard: hay cambios sin commitear en el árbol; no se tocan.',
    hookSpecificOutput: { hookEventName: 'PreToolUse', additionalContext: worktreeHint },
  }));
  process.exit(0);
}

// 2) Commits exist but were never pushed.
const upstream = git('rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}');
if (upstream) {
  const ahead = git('rev-list', '--count', `${upstream}..HEAD`);
  if (ahead && Number(ahead) > 0) {
    deny(`Feature branch "${branch}" has ${ahead} commit(s) not pushed to ${upstream}. Push them and open the PR — run the \`ship\` skill — before switching to the trunk.${worktreeHint ? `\n${worktreeHint}` : ''}${tail}`);
  }
} else {
  // No upstream at all: if the branch carries commits beyond the trunk, it was never pushed.
  const aheadOfTrunk = git('rev-list', '--count', 'main..HEAD') ?? git('rev-list', '--count', 'master..HEAD');
  if (aheadOfTrunk && Number(aheadOfTrunk) > 0) {
    deny(`Feature branch "${branch}" was never pushed (no upstream, ${aheadOfTrunk} commit(s) ahead of the trunk). Push it and open a PR — run the \`ship\` skill — before leaving it.${worktreeHint ? `\n${worktreeHint}` : ''}${tail}`);
  }
}

hint();
