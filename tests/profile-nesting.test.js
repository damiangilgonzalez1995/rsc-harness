import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WORKFLOW_GATE_TEXT } from '../targets/hook-once.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// --- Profile nesting -------------------------------------------------------
//
// scripts/lib/manifest.js filters skills into a profile by membership, not by
// accumulation: profiles are explicit supersets, not additive tiers. The spec
// is minimal ⊆ core ⊆ ui ⊆ full. A skill that declares `core` but not `ui`
// silently hides from anyone who told the wizard they have a frontend, even
// though the ui bundle is supposed to be the serious bundle PLUS design.
test('profile nesting: minimal is a subset of core, core is a subset of ui', () => {
  const manifest = JSON.parse(readFileSync(join(ROOT, 'manifest.json'), 'utf8'));
  const byProfile = (name) =>
    new Set(manifest.skills.filter((s) => (s.profiles || []).includes(name)).map((s) => s.id));

  const minimal = byProfile('minimal');
  const core = byProfile('core');
  const ui = byProfile('ui');

  assert.ok(minimal.size > 0, 'minimal profile is not empty');
  assert.ok(core.size > 0, 'core profile is not empty');
  assert.ok(ui.size > 0, 'ui profile is not empty');

  const notInCore = [...minimal].filter((id) => !core.has(id));
  assert.deepEqual(notInCore, [], `minimal ids missing from core: ${notInCore.join(', ')}`);

  const notInUi = [...core].filter((id) => !ui.has(id));
  assert.deepEqual(notInUi, [], `core ids missing from ui: ${notInUi.join(', ')}`);
});

// --- Gate citations point at real skills -----------------------------------
//
// The workflow gate is quoted from three surfaces: the per-turn hook text, the
// always-on body (the only copy a hookless assistant ever sees), and the short
// form baked into plain-markdown targets. Each backtick-quoted identifier in
// those surfaces must resolve to an installed skill directory or carry the
// `superpowers:` prefix — otherwise the gate routes to nothing.
const skillsDir = join(ROOT, 'skills');
const knownSkillIds = new Set(
  readdirSync(skillsDir).filter((d) => existsSync(join(skillsDir, d, 'SKILL.md')))
);

function slugLikeBacktickIds(text) {
  const spans = [...text.matchAll(/`([^`]+)`/g)].map((m) => m[1]);
  // Plain ids (`write-adr`) and `superpowers:` prefixes, PLUS a relative pointer to another
  // skill's file (`../sdd/SKILL.md`) — the shape the old SDD chain used before it was retired.
  return [...new Set(spans.filter((s) =>
    /^[a-z][a-z0-9-]*$/.test(s) ||
    /^superpowers:[a-z-]+$/.test(s) ||
    /^\.\.\/[a-z0-9-]+\/SKILL\.md$/.test(s)
  ))];
}

function resolves(id) {
  if (id.startsWith('superpowers:')) return true;
  const relMatch = id.match(/^\.\.\/([a-z0-9-]+)\/SKILL\.md$/);
  if (relMatch) return knownSkillIds.has(relMatch[1]);
  return knownSkillIds.has(id);
}

function assertAllResolve(ids, label) {
  const dead = ids.filter((id) => !resolves(id));
  assert.deepEqual(dead, [], `${label} cites skills that do not exist: ${dead.join(', ')}`);
}

test('the per-turn workflow gate only cites real skills', () => {
  const ids = slugLikeBacktickIds(WORKFLOW_GATE_TEXT);
  assert.ok(ids.length > 0, 'sanity: the gate text names at least one skill');
  assertAllResolve(ids, 'targets/hook-once.mjs WORKFLOW_GATE_TEXT');
});

test('the suggest always-on body only cites real skills', () => {
  const body = readFileSync(join(ROOT, 'skills/suggest/SKILL.md'), 'utf8');
  const ids = slugLikeBacktickIds(body);
  assert.ok(ids.length > 0, 'sanity: the body names at least one skill');
  assertAllResolve(ids, 'skills/suggest/SKILL.md body');
});

test('the plain-markdown gate summary only cites real skills', () => {
  const src = readFileSync(join(ROOT, 'targets/_md-block.js'), 'utf8');
  const lineMatch = src.split('\n').find((l) => l.includes('rsc-suggest — always-on operations layer'));
  assert.ok(lineMatch, 'sanity: found the codeHooks===false literal in _md-block.js');
  // Strip the JS template-literal delimiters (the unescaped opening/closing backticks) before
  // unescaping the inner \` code-span backticks, so the delimiters are not mistaken for spans.
  const delimited = lineMatch.trim().replace(/^\?\s*`/, '').replace(/`$/, '');
  const literal = delimited.replace(/\\`/g, '`');
  const ids = slugLikeBacktickIds(literal);
  assert.ok(ids.length > 0, 'sanity: the summary names at least one skill');
  assertAllResolve(ids, 'targets/_md-block.js plain-markdown gate summary');
});
