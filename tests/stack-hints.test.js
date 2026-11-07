import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

// The session start hint matches the project's stack: a front-end project gets the five-word
// mental model, a project with a backend or secrets gets the ten-hole security floor, and a
// project with neither gets neither (the hint must cost nothing where it does not apply).
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SESSION_START = join(ROOT, 'targets', 'session-start.mjs');

function project(files = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'rsc-stack-'));
  for (const [name, body] of Object.entries(files)) {
    mkdirSync(join(dir, name, '..'), { recursive: true });
    writeFileSync(join(dir, name), body);
  }
  return dir;
}

function run(root, extra = {}) {
  const home = mkdtempSync(join(tmpdir(), 'rsc-stack-home-'));
  return spawnSync('node', [SESSION_START, join(ROOT, 'skills', 'suggest', 'SKILL.md'), root], {
    encoding: 'utf8',
    input: JSON.stringify({ session_id: `s-${Math.random()}`, source: 'startup' }),
    env: { ...process.env, RSC_NO_UPDATE_CHECK: '1', HOME: home, USERPROFILE: home, ...extra },
  }).stdout;
}

test('React project: gets the front-end model, not the security floor', () => {
  const out = run(project({ 'package.json': '{"dependencies":{"react":"19.0.0","vite":"6.0.0"}}' }));
  assert.match(out, /rsc front-end model/);
  assert.match(out, /hydration/);
  assert.doesNotMatch(out, /rsc security floor/);
});

test('project with an API and an .env: gets the security floor with the ten holes', () => {
  const out = run(project({ 'package.json': '{"dependencies":{"express":"5.0.0"}}', '.env': 'KEY=1\n' }));
  assert.match(out, /rsc security floor/);
  for (const hole of ['rate limiting', 'RLS', 'validation on\nthe SERVER', 'CORS only with your own domain']) {
    assert.ok(out.includes(hole), `names: ${hole}`);
  }
  assert.doesNotMatch(out, /rsc front-end model/);
});

test('Next.js project: gets both', () => {
  const out = run(project({ 'package.json': '{"dependencies":{"next":"15.0.0","react":"19.0.0"}}' }));
  assert.match(out, /rsc security floor/);
  assert.match(out, /rsc front-end model/);
});

test('front-end project without PRODUCT.md: is told to offer `/impeccable init` once', () => {
  const out = run(project({ 'package.json': '{"dependencies":{"react":"19.0.0"}}' }));
  assert.match(out, /no PRODUCT\.md/);
  assert.match(out, /\/impeccable init/);
  assert.match(out, /\/impeccable document/);
});

test('front-end project that already has PRODUCT.md: no design-context nudge', () => {
  const out = run(project({ 'package.json': '{"dependencies":{"react":"19.0.0"}}', 'PRODUCT.md': '# Product\n' }));
  assert.match(out, /rsc front-end model/);
  assert.doesNotMatch(out, /impeccable init/);
});

test('backend-only project: no design-context nudge', () => {
  const out = run(project({ 'package.json': '{"dependencies":{"express":"5.0.0"}}', '.env': 'K=1\n' }));
  assert.doesNotMatch(out, /impeccable/);
});

test('project with neither a front end nor a backend: gets neither', () => {
  const out = run(project({ 'README.md': '# notes\n' }));
  assert.doesNotMatch(out, /rsc security floor|rsc front-end model/);
});

test('.rsc/.no-stack-hints opts out', () => {
  const out = run(project({ 'package.json': '{"dependencies":{"next":"15.0.0"}}', '.rsc/.no-stack-hints': '' }));
  assert.doesNotMatch(out, /rsc security floor|rsc front-end model/);
});

test('the hint and the skill reference agree on the ten holes', () => {
  // The hook text is a summary; the reference is the source. If one grows a hole the other lacks,
  // the session would remind about something the proofs do not cover.
  const ref = readFileSync(join(ROOT, 'skills/secure-coding/references/pre-publish.md'), 'utf8');
  const rows = ref.split('\n').filter((l) => /^\| \d+ \|/.test(l));
  assert.equal(rows.length, 10, 'the reference lists ten holes');
  const hook = readFileSync(SESSION_START, 'utf8');
  for (const word of ['rate limiting', 'RLS', 'CORS', 'sessions that expire', 'hashed passwords']) {
    assert.ok(hook.includes(word), `hook names ${word}`);
  }
});
