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

function run(root, extra = {}, homeFiles = {}) {
  const home = mkdtempSync(join(tmpdir(), 'rsc-stack-home-'));
  for (const [name, body] of Object.entries(homeFiles)) writeFileSync(join(home, name), body);
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

// Inspo MCP (free design-reference library): a front-end project is told how to use it when it is
// connected, and offered it once when it is not. Detection reads ~/.claude.json (user scope and the
// per-project entry) and the project's .mcp.json; anything unreadable counts as "not connected".
const REACT = { 'package.json': '{"dependencies":{"react":"19.0.0"}}' };
const INSPO_URL = 'https://inspomcp.dev/api/mcp';

test('front-end project without Inspo: offered once with the install command', () => {
  const out = run(project(REACT));
  assert.match(out, /Inspo/);
  assert.ok(out.includes(`claude mcp add --transport http --scope user inspo ${INSPO_URL}`), 'names the command');
  assert.match(out, /\.rsc\/\.no-inspo/);
});

test('Inspo in the user scope of ~/.claude.json: usage hint, no install offer', () => {
  const claudeJson = JSON.stringify({ mcpServers: { inspo: { type: 'http', url: INSPO_URL } } });
  const out = run(project(REACT), {}, { '.claude.json': claudeJson });
  assert.match(out, /Inspo MCP is connected/);
  assert.match(out, /search_screens/);
  assert.doesNotMatch(out, /claude mcp add --transport http --scope user inspo/);
});

test('Inspo under another key but with its URL, in this project entry of ~/.claude.json: connected', () => {
  const root = project(REACT);
  const claudeJson = JSON.stringify({ projects: { [root]: { mcpServers: { refs: { type: 'http', url: INSPO_URL } } } } });
  const out = run(root, {}, { '.claude.json': claudeJson });
  assert.match(out, /Inspo MCP is connected/);
});

test('Inspo configured for ANOTHER project only: still offered here', () => {
  const claudeJson = JSON.stringify({ projects: { '/somewhere/else': { mcpServers: { inspo: { url: INSPO_URL } } } } });
  const out = run(project(REACT), {}, { '.claude.json': claudeJson });
  assert.doesNotMatch(out, /Inspo MCP is connected/);
  assert.match(out, /--scope user inspo/);
});

test('Inspo in the project .mcp.json: connected', () => {
  const out = run(project({ ...REACT, '.mcp.json': JSON.stringify({ mcpServers: { inspo: { type: 'http', url: INSPO_URL } } }) }));
  assert.match(out, /Inspo MCP is connected/);
});

test('a broken ~/.claude.json does not break the hook: treated as not connected', () => {
  const out = run(project(REACT), {}, { '.claude.json': '{ not json' });
  assert.match(out, /rsc front-end model/);
  assert.match(out, /--scope user inspo/);
});

test('.rsc/.no-inspo silences the offer but keeps the front-end model', () => {
  const out = run(project({ ...REACT, '.rsc/.no-inspo': '' }));
  assert.match(out, /rsc front-end model/);
  assert.doesNotMatch(out, /Inspo/);
});

test('backend-only project and .rsc/.no-stack-hints: no Inspo at all', () => {
  assert.doesNotMatch(run(project({ 'package.json': '{"dependencies":{"express":"5.0.0"}}', '.env': 'K=1\n' })), /Inspo/);
  assert.doesNotMatch(run(project({ ...REACT, '.rsc/.no-stack-hints': '' })), /Inspo/);
});
