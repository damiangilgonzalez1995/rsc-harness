import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

// docs/archive/ is where `sweep` moves context that git proved stale. Archived is not deleted, so
// a person can still open it, but an agent that reads it is back to acting on dead instructions —
// the side quests the archive exists to stop. The guard denies looking INSIDE it and lets things
// be moved INTO it, because archiving is the one job that has to name the folder.
const GUARD = join(dirname(fileURLToPath(import.meta.url)), '..', 'targets', 'archive-guard.mjs');

function project(files = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'rsc-archive-'));
  for (const [name, body] of Object.entries(files)) {
    mkdirSync(join(dir, name, '..'), { recursive: true });
    writeFileSync(join(dir, name), body);
  }
  return dir;
}

function decide(root, payload, raw) {
  const out = spawnSync('node', [GUARD, root], {
    encoding: 'utf8',
    input: raw ?? JSON.stringify(payload),
  }).stdout;
  if (!out.trim()) return 'allow';
  return JSON.parse(out).hookSpecificOutput.permissionDecision;
}

const root = project();
const at = (...p) => join(root, ...p);

test('Read of a file inside docs/archive/ is denied', () => {
  assert.equal(decide(root, { tool_name: 'Read', tool_input: { file_path: at('docs', 'archive', 'old.md') } }), 'deny');
});

test('a relative or forward-slash path counts too', () => {
  assert.equal(decide(root, { tool_name: 'Read', tool_input: { file_path: 'docs/archive/old.md' } }), 'deny');
  assert.equal(decide(root, { tool_name: 'Edit', tool_input: { file_path: at('docs', 'archive').replace(/\\/g, '/') + '/x.md' } }), 'deny');
});

test('Grep and Glob pointed at the archive are denied', () => {
  assert.equal(decide(root, { tool_name: 'Grep', tool_input: { pattern: 'TODO', path: at('docs', 'archive') } }), 'deny');
  assert.equal(decide(root, { tool_name: 'Glob', tool_input: { pattern: 'docs/archive/**/*.md' } }), 'deny');
});

test('Write and NotebookEdit inside the archive are denied', () => {
  assert.equal(decide(root, { tool_name: 'Write', tool_input: { file_path: at('docs', 'archive', 'n.md'), content: 'x' } }), 'deny');
  assert.equal(decide(root, { tool_name: 'NotebookEdit', tool_input: { notebook_path: at('docs', 'archive', 'n.ipynb') } }), 'deny');
});

test('the rest of docs/ is untouched, including a folder whose name only starts the same', () => {
  assert.equal(decide(root, { tool_name: 'Read', tool_input: { file_path: at('docs', 'wiki', 'index.md') } }), 'allow');
  assert.equal(decide(root, { tool_name: 'Read', tool_input: { file_path: at('docs', 'archive-notes.md') } }), 'allow');
  assert.equal(decide(root, { tool_name: 'Grep', tool_input: { pattern: 'x' } }), 'allow');
});

test('a shell command that reads the archive is denied', () => {
  for (const command of ['cat docs/archive/old.md', 'grep -r TODO docs/archive', 'ls docs/archive/', 'Get-Content docs\\archive\\old.md']) {
    assert.equal(decide(root, { tool_name: 'Bash', tool_input: { command } }), 'deny', command);
  }
});

test('moving something INTO the archive is allowed: that is how sweep archives', () => {
  for (const command of [
    'mkdir -p docs/archive/2026-11',
    'git mv docs/wiki/old.md docs/archive/2026-11/old.md',
    'mkdir -p docs/archive/x && git mv .scratch/a/issues/01-b.md docs/archive/x/',
    'mv TODO.md docs/archive/',
  ]) {
    assert.equal(decide(root, { tool_name: 'Bash', tool_input: { command } }), 'allow', command);
  }
});

test('a move OUT of the archive is still reading it back: denied', () => {
  assert.equal(decide(root, { tool_name: 'Bash', tool_input: { command: 'git mv docs/archive/old.md docs/wiki/old.md' } }), 'deny');
});

test('the deny reason names the folder and how to get a person to open it', () => {
  const out = spawnSync('node', [GUARD, root], {
    encoding: 'utf8',
    input: JSON.stringify({ tool_name: 'Read', tool_input: { file_path: 'docs/archive/a.md' } }),
  }).stdout;
  const reason = JSON.parse(out).hookSpecificOutput.permissionDecisionReason;
  assert.match(reason, /docs\/archive/);
  assert.match(reason, /\.no-archive-guard/);
});

test('fails open: broken input, unknown tool, no path', () => {
  assert.equal(decide(root, null, '{ not json'), 'allow');
  assert.equal(decide(root, { tool_name: 'WebFetch', tool_input: { url: 'https://x/docs/archive/a' } }), 'allow');
  assert.equal(decide(root, { tool_name: 'Read', tool_input: {} }), 'allow');
});

test('.rsc/.no-archive-guard switches it off', () => {
  const off = project({ '.rsc/.no-archive-guard': '' });
  assert.equal(decide(off, { tool_name: 'Read', tool_input: { file_path: 'docs/archive/a.md' } }), 'allow');
});
