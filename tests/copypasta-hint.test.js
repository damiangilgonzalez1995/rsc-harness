import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

// A skill is matched by its description, and only when the request reads like its trigger. "Add
// rate limiting" does not read like "bring me a template", so with the copypasta skill installed the
// agent still built pieces from scratch. The session start therefore says it once, up front: before
// creating the structure of a new piece, look in the recipe book and offer the recipe that fits.
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SESSION_START = join(ROOT, 'targets', 'session-start.mjs');

function dir(prefix, files = {}) {
  const d = mkdtempSync(join(tmpdir(), prefix));
  for (const [name, body] of Object.entries(files)) {
    mkdirSync(join(d, name, '..'), { recursive: true });
    writeFileSync(join(d, name), body);
  }
  return d;
}

function run(root, homeFiles = {}) {
  const home = dir('rsc-cp-home-', homeFiles);
  return spawnSync('node', [SESSION_START, join(ROOT, 'skills', 'suggest', 'SKILL.md'), root], {
    encoding: 'utf8',
    input: JSON.stringify({ session_id: `s-${Math.random()}`, source: 'startup' }),
    env: { ...process.env, RSC_NO_UPDATE_CHECK: '1', HOME: home, USERPROFILE: home },
  }).stdout;
}

const INSTALLED = { '.claude/skills/copypasta/SKILL.md': '---\nname: copypasta\n---\n' };

test('copypasta installed in the project: the session is told to look in the recipe book first', () => {
  const out = run(dir('rsc-cp-', INSTALLED));
  assert.match(out, /rsc recipe book/);
  assert.match(out, /npx @damiangilgonzalez\/harness recipes list/);
  // The user decides: the agent proposes the recipe, it does not copy it behind their back.
  assert.match(out, /offer it to the user/i);
  assert.match(out, /\.rsc\/\.no-copypasta-hint/);
});

test('copypasta installed for the user (home): the hint is there too', () => {
  assert.match(run(dir('rsc-cp-'), INSTALLED), /rsc recipe book/);
});

test('copypasta not installed: no hint (it would name a command the project cannot use)', () => {
  assert.doesNotMatch(run(dir('rsc-cp-')), /rsc recipe book/);
});

test('.rsc/.no-copypasta-hint silences it', () => {
  const out = run(dir('rsc-cp-', { ...INSTALLED, '.rsc/.no-copypasta-hint': '' }));
  assert.doesNotMatch(out, /rsc recipe book/);
});
