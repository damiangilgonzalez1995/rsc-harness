import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { wireHook } from '../targets/claude.js';

// El aviso de overview al abrir sesión: una línea, solo si alguna zona está en rojo, y nunca a costa
// del arranque. Se prueba la copia materializada en `.rsc/` por wireHook, porque session-start
// importa el motor como hermano: contra la copia de targets/ un import roto pasaría desapercibido.

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SUGGEST = join(ROOT, 'skills', 'suggest', 'SKILL.md');

function git(root, ...args) {
  const r = spawnSync('git', args, { cwd: root, encoding: 'utf8', windowsHide: true });
  assert.equal(r.status, 0, `git ${args.join(' ')}: ${r.stderr}`);
  return r.stdout.trim();
}

function put(root, rel, body) {
  mkdirSync(dirname(join(root, rel)), { recursive: true });
  writeFileSync(join(root, rel), body);
}

const zone = (id, dir) => ({ id, label: id, paths: [`${dir}/**`], reviewSkills: ['security-scan'], cadenceDays: 30, checks: [] });
const CONFIG = { version: 1, project: 'fixture', zones: [zone('api-endpoints', 'api'), zone('database', 'db'), zone('docs', 'guide')], questions: [] };

// Proyecto con git, el harness cableado y una revisión de security-scan que cubre todo. `stale`
// cambia esas zonas después de la revisión, y así quedan en rojo (cobertura 0).
function project({ config = CONFIG, stale = [] } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'rsc-ovss-'));
  git(root, 'init', '-q', '-b', 'main');
  git(root, 'config', 'user.email', 'test@example.com');
  git(root, 'config', 'user.name', 'Test');
  git(root, 'config', 'commit.gpgsign', 'false');
  git(root, 'config', 'core.autocrlf', 'false');
  put(root, 'api/users.js', 'export const users = 1;\n');
  put(root, 'db/schema.sql', 'create table t (id int);\n');
  put(root, 'guide/intro.md', 'hola\n');
  if (config) put(root, 'docs/overview/overview.json', JSON.stringify(config, null, 2));
  git(root, 'add', '.');
  git(root, 'commit', '-q', '-m', 'init');
  mkdirSync(join(root, '.claude'), { recursive: true });
  wireHook({ projectRoot: root, hookTarget: join(root, '.claude', 'settings.json'), skillDir: (id) => join(root, '.claude', 'skills', id) });
  if (config) {
    const r = spawnSync('node', [join(root, '.rsc', 'overview.mjs'), 'record', '--skill', 'security-scan', '--scope', 'global', '--root', root], { encoding: 'utf8', windowsHide: true });
    assert.equal(r.status, 0, r.stderr);
  }
  for (const f of stale) put(root, f, 'cambiado\n');
  return root;
}

// El tope real es ~800 ms. Bajo la carga de la suite completa un scan legítimo puede pasarse, así que
// los tests que esperan la línea le dan margen; el tope tiene su propio test.
const ROOMY = { RSC_OVERVIEW_BUDGET_MS: '20000' };

function sessionStart(root, { markers = mkdtempSync(join(tmpdir(), 'rsc-ovss-mark-')), session = `s-${Math.random()}`, source = 'startup', extra = ROOMY } = {}) {
  const home = mkdtempSync(join(tmpdir(), 'rsc-ovss-home-'));
  const r = spawnSync('node', [join(root, '.rsc', 'session-start.mjs'), SUGGEST, root], {
    cwd: root, encoding: 'utf8', windowsHide: true,
    input: JSON.stringify({ session_id: session, source }),
    env: { ...process.env, RSC_NO_UPDATE_CHECK: '1', RSC_HOOK_MARKER_DIR: markers, HOME: home, USERPROFILE: home, ...extra },
  });
  assert.equal(r.status, 0, r.stderr);
  return r.stdout;
}

const LINE = /overview: \d+ zonas? en rojo/g;

test('con zonas en rojo sale una línea que las nombra y da el comando', () => {
  const out = sessionStart(project({ stale: ['api/users.js', 'db/schema.sql'] }));
  assert.match(out, /overview: 2 zonas en rojo \(api-endpoints, database\) — `\/overview scan`/);
  assert.equal(out.match(LINE).length, 1);
});

test('una sola zona en rojo usa el singular', () => {
  const out = sessionStart(project({ stale: ['db/schema.sql'] }));
  assert.match(out, /overview: 1 zona en rojo \(database\) — `\/overview scan`/);
});

test('sin overview.json no sale nada', () => {
  assert.doesNotMatch(sessionStart(project({ config: null })), /overview:/);
});

test('con todo en verde no sale nada', () => {
  assert.doesNotMatch(sessionStart(project()), /overview:/);
});

test('si el scan se pasa del tope, se calla', () => {
  const root = project({ stale: ['api/users.js'] });
  assert.doesNotMatch(sessionStart(root, { extra: { RSC_OVERVIEW_BUDGET_MS: '1' } }), /overview:/);
});

test('con dos scopes cableados la línea sale una sola vez por sesión', () => {
  const root = project({ stale: ['api/users.js'] });
  const markers = mkdtempSync(join(tmpdir(), 'rsc-ovss-mark-'));
  const outs = [sessionStart(root, { markers, session: 's-dos' }), sessionStart(root, { markers, session: 's-dos' })];
  assert.equal(outs.join('').match(LINE).length, 1);
});

test('tras compact, resume o clear en la misma sesión la línea no vuelve a salir', () => {
  // El cuerpo de suggest sí se reinyecta tras compactar (su clave lleva `source`); el aviso, no.
  const root = project({ stale: ['api/users.js'] });
  const markers = mkdtempSync(join(tmpdir(), 'rsc-ovss-mark-'));
  const session = 's-compact';
  assert.equal(sessionStart(root, { markers, session }).match(LINE).length, 1);
  for (const source of ['compact', 'resume', 'clear']) {
    assert.doesNotMatch(sessionStart(root, { markers, session, source }), LINE, `source=${source}`);
  }
});

test('una zona cubierta entera pero con un check en fail también cuenta como en rojo (ticket 08)', () => {
  const failing = { ...zone('database', 'db'), checks: [{ id: 'rls', label: 'RLS', status: 'fail', note: 'solo una tabla' }] };
  const config = { ...CONFIG, zones: [zone('api-endpoints', 'api'), failing, zone('docs', 'guide')] };
  const out = sessionStart(project({ config }));
  assert.match(out, /overview: 1 zona en rojo \(database\) — `\/overview scan`/);
});
