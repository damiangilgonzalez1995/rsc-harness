import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { syncInstalled } from '../scripts/install-apply.js';
import { writeManifest } from '../scripts/lib/manifest-file.js';
import { DEFAULT_SKILL_FLOOR } from '../scripts/lib/default-skill-floor.js';

function repo() {
  const d = mkdtempSync(join(tmpdir(), 'rsc-syncfloor-'));
  execFileSync('git', ['init', '-q'], { cwd: d });
  return d;
}

// A declaration is frozen at the moment it was written, so a skill the catalog later makes part of
// the default floor never reached it: sync rebuilt exactly what was declared. The fixture declares
// a harness written before `bro` joined the floor.
test('upgrading brings in a base skill the declaration predates', async () => {
  const d = repo();
  writeManifest(d, {
    targets: ['claude'], skills: ['orient', 'suggest'], ownSkills: [],
    catalogVersion: '1.2.2', tier: null, optOuts: [],
  });
  const r = await syncInstalled({ target: 'claude', home: d, cwd: d });
  assert.ok(r.synced.includes('bro'), 'the floor must arrive with the upgrade');
  assert.ok(existsSync(join(d, '.claude', 'skills', 'bro', 'SKILL.md')), 'and be on disk, not just named');
});

// The pointer is the actual symptom: a body that routes somewhere nothing answers.
test('after sync, nothing the always-on body routes to is missing', async () => {
  const d = repo();
  writeManifest(d, {
    targets: ['claude'], skills: ['orient', 'suggest'], ownSkills: [],
    catalogVersion: '1.2.2', tier: null, optOuts: [],
  });
  await syncInstalled({ target: 'claude', home: d, cwd: d });
  const body = readFileSync(join(d, '.claude', 'skills', 'suggest', 'SKILL.md'), 'utf8');
  for (const id of DEFAULT_SKILL_FLOOR) {
    if (!body.includes(`../${id}/SKILL.md`)) continue;
    assert.ok(existsSync(join(d, '.claude', 'skills', id)), `the body points at ${id} and it is not installed`);
  }
});

// The floor is a repair for an existing harness, never a reason to create one. A directory
// that declares nothing is not a harness with three skills missing.
test('sync on a directory with no harness still installs nothing', async () => {
  const d = repo();
  const r = await syncInstalled({ target: 'claude', home: d, cwd: d });
  assert.deepEqual(r.synced, []);
  assert.equal(existsSync(join(d, '.claude', 'skills')), false);
});

// The floor must survive the trip: sync writes what it installed, so the next command
// (and the next machine reading the manifest) sees the same harness.
test('the floor sync added is recorded in the manifest, not just on disk', async () => {
  const d = repo();
  writeManifest(d, {
    targets: ['claude'], skills: ['orient', 'suggest'], ownSkills: [],
    catalogVersion: '1.2.2', tier: null, optOuts: [],
  });
  await syncInstalled({ target: 'claude', home: d, cwd: d });
  const m = JSON.parse(readFileSync(join(d, '.rsc.json'), 'utf8'));
  assert.ok(m.skills.includes('bro'), 'a declaration that still omits it would re-open the gap');
});

// The worst part of that gap was not the gap: `doctor` found nothing and `repair`
// answered "this harness is healthy" while a floor skill
// was not there. A check that cannot see the only failure it would ever be asked about
// is worse than no check, so this is the bucket that sees it.
test('a harness whose declaration predates a mandatory skill is reported, not called healthy', async () => {
  const { divergence } = await import('../scripts/lib/divergence.js');
  const d = repo();
  writeManifest(d, {
    targets: ['claude'], skills: ['orient', 'suggest'], ownSkills: [],
    catalogVersion: '1.2.2', tier: null, optOuts: [],
  });
  const v = divergence({ cwd: d, target: 'claude' });
  assert.deepEqual(v.floorMissing, ['bro']);
});

test('a harness that already declares the whole floor reports nothing', async () => {
  const d = repo();
  writeManifest(d, {
    targets: ['claude'], skills: [...DEFAULT_SKILL_FLOOR], ownSkills: [],
    catalogVersion: '2.0.1', tier: null, optOuts: [],
  });
  const { divergence } = await import('../scripts/lib/divergence.js');
  assert.deepEqual(divergence({ cwd: d, target: 'claude' }).floorMissing, []);
});

// Same rule as sync: no declaration, no harness, nothing to report.
test('a directory with no harness is not reported as missing its floor', async () => {
  const { divergence } = await import('../scripts/lib/divergence.js');
  const d = repo();
  assert.deepEqual(divergence({ cwd: d, target: 'claude' }).floorMissing, []);
});

// El gate de código nombra el flujo entero. Una declaración escrita antes de que el gate nombrara
// `implement-spec` y `pr` quedaba con el gate apuntando a skills que nunca se instalaron.
test('con el gate conectado, el update trae las skills nuevas del flujo', async () => {
  const { CODE_FLOW_FLOOR } = await import('../scripts/lib/default-skill-floor.js');
  const d = repo();
  writeManifest(d, {
    targets: ['claude'], skills: ['orient', 'suggest', 'bro', 'to-spec', 'implement'], ownSkills: [],
    catalogVersion: '1.3.13', tier: null, optOuts: [],
  });
  const r = await syncInstalled({ target: 'claude', home: d, cwd: d });
  for (const id of ['implement-spec', 'pr', 'retro']) {
    assert.ok(r.synced.includes(id), `${id} debe llegar con el update`);
    assert.ok(existsSync(join(d, '.claude', 'skills', id, 'SKILL.md')), `${id} debe estar en disco`);
  }
  assert.ok(CODE_FLOW_FLOOR.every((id) => r.synced.includes(id)));
});

test('sin gate (codeHooks: false), el update no añade el flujo', async () => {
  const { withCodeFlowFloor } = await import('../scripts/lib/default-skill-floor.js');
  assert.deepEqual(withCodeFlowFloor(['orient'], { codeHooks: false }), ['orient']);
});

test('cada skill del suelo del flujo existe en el catálogo', async () => {
  const { CODE_FLOW_FLOOR } = await import('../scripts/lib/default-skill-floor.js');
  for (const id of CODE_FLOW_FLOOR) {
    assert.ok(existsSync(join(import.meta.dirname, '..', 'skills', id, 'SKILL.md')), `${id} no existe en skills/`);
  }
});
