import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildManifest } from '../scripts/build-manifest.js';
import { skillsForProfile } from '../scripts/lib/manifest.js';

test('manifest lists all skills with required fields', () => {
  const m = buildManifest();
  assert.ok(m.skills.length >= 29);
  const fastapi = m.skills.find((s) => s.id === 'fastapi');
  assert.ok(fastapi.tags.includes('python'));
  assert.equal(m.counts.skills, m.skills.length);
});

test('manifest publishes the complete agent and command surfaces with source receipts', () => {
  const m = buildManifest();
  assert.equal(m.counts.agents, 33);
  assert.equal(m.counts.commands, 43);
  assert.equal(m.counts.fixedCommands, 10);
  assert.equal(m.agents.length, m.counts.agents);
  assert.equal(m.commands.length, m.counts.commands);
  assert.deepEqual(m.sourceReceipts.map((receipt) => receipt.agent).sort(), [
    'cpp-reviewer', 'go-reviewer', 'python-reviewer',
  ]);
  const agentIds = new Set(m.agents.map((agent) => agent.id));
  for (const receipt of m.sourceReceipts) {
    assert.ok(agentIds.has(receipt.agent), `receipt points at unknown agent ${receipt.agent}`);
    assert.ok(receipt.sources.every((source) => source.url.startsWith('https://')));
  }
  const aliases = m.commands.filter((command) => command.kind === 'agent').map((command) => command.id);
  assert.ok(aliases.includes('go-review'));
  assert.ok(aliases.includes('spring-boot-build'));
});

test('every recommends id references a real skill', () => {
  const m = buildManifest();
  const ids = new Set(m.skills.map((s) => s.id));
  for (const s of m.skills) {
    for (const r of s.recommends || []) {
      assert.ok(ids.has(r), `${s.id} recommends unknown ${r}`);
    }
  }
});

test('bro is present in every default profile', () => {
  const m = buildManifest();
  for (const profile of ['minimal', 'core', 'full']) {
    assert.ok(skillsForProfile(m, profile).includes('bro'), `${profile} profile must install bro`);
  }
});


test('every recommends entry in every skill points to a skill directory that actually exists', async () => {
  const { readdirSync, readFileSync, statSync } = await import('node:fs');
  const { join } = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const { parseFrontmatter } = await import('../scripts/lib/frontmatter.js');
  const ROOT = fileURLToPath(new URL('..', import.meta.url));
  const SKILLS = join(ROOT, 'skills');
  const ids = readdirSync(SKILLS).filter((d) => {
    try { return statSync(join(SKILLS, d)).isDirectory() && statSync(join(SKILLS, d, 'SKILL.md')).isFile(); }
    catch { return false; }
  });
  const known = new Set(ids);
  const dangling = [];
  for (const id of ids) {
    const fm = parseFrontmatter(readFileSync(join(SKILLS, id, 'SKILL.md'), 'utf8'));
    for (const r of fm.recommends || []) {
      if (!known.has(r)) dangling.push(`${id} -> ${r}`);
    }
  }
  assert.deepEqual(dangling, [], `recommends pointing at skills/ directories that do not exist (build-manifest silently drops these):\n${dangling.join('\n')}`);
});
