import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

// The copypasta skill is kept in two repos on purpose: here, where the harness installs it, and in
// CopyPasta-Kitchen, where people who never heard of the harness find it. Two copies drift unless
// something compares them. This file is that comparison.
//
// It can only compare when the other repo is on disk. CI of this repo does not have it, so the
// cross-repo test SKIPS there (visibly, not silently); the checks on our own copy always run.
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OURS = join(ROOT, 'skills', 'copypasta', 'SKILL.md');

function kitchenCopy() {
  const roots = [];
  if (process.env.COPYPASTA_KITCHEN_DIR) roots.push(process.env.COPYPASTA_KITCHEN_DIR);
  roots.push(join(ROOT, '..', 'CopyPasta-Kitchen'));
  try {
    // Inside a git worktree ROOT is nested; the sibling repo sits next to the MAIN checkout.
    const common = execFileSync('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'], { cwd: ROOT, encoding: 'utf8' }).trim();
    roots.push(join(dirname(common), '..', 'CopyPasta-Kitchen'));
  } catch { /* not a git checkout (installed package): nothing to add */ }
  for (const root of roots) {
    const file = join(root, 'skills', 'copypasta', 'SKILL.md');
    if (existsSync(file)) return file;
  }
  return null;
}

const normalize = (text) => text.replace(/\r\n/g, '\n');

test('the copypasta skill sends the agent to the recipe book this harness ships', () => {
  const text = readFileSync(OURS, 'utf8');
  assert.ok(text.includes('npx @damiangilgonzalez/harness recipes'), 'the skill names the harness command');
  // Fetching the recipe book from a git branch or through another runtime would bypass the version
  // this release depends on (tests/recipes-command.test.js holds that pin).
  assert.doesNotMatch(text, /git\+https|uvx/,'the skill must not fetch the recipe book around the dependency');
});

test('the two copies of the copypasta skill are byte-identical', (t) => {
  const theirs = kitchenCopy();
  if (!theirs) {
    t.skip('CopyPasta-Kitchen is not on disk (set COPYPASTA_KITCHEN_DIR to compare)');
    return;
  }
  assert.equal(
    normalize(readFileSync(theirs, 'utf8')),
    normalize(readFileSync(OURS, 'utf8')),
    `skills/copypasta/SKILL.md differs from ${theirs}: carry the change to both repos`,
  );
});
