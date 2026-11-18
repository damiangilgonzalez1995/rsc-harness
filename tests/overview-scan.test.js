import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { record, scan, weightyKind } from '../skills/overview/scripts/overview.mjs';
import { DAY, git, put, commit, repo, zone, dashboardRepo } from './fixtures/overview-fixture.js';

// Scan completo (ticket 04): endpoints nuevos sin cubrir, última PR cubierta, foto semanal y salud
// global. El modo rápido (aviso de sesión) no hace nada de lo caro.
const API = {
  version: 1,
  project: 'scan-fixture',
  zones: [
    { id: 'api-endpoints', label: 'Endpoints API', paths: ['app/**', 'server/**'], reviewSkills: ['security-scan'], cadenceDays: 30, checks: [] },
    { id: 'docs', label: 'Docs', paths: ['guide/**'], reviewSkills: ['docs-review'], cadenceDays: 30, checks: [] },
  ],
  questions: [{ id: 'q1', zone: 'docs', text: '¿?', state: 'open' }],
};
const BASE = {
  'app/routers/users.py': 'from fastapi import APIRouter\nrouter = APIRouter()\n\n@router.get("/users")\ndef list_users():\n    return []\n',
  'server/index.js': "const app = require('express')();\napp.set('x', 1);\napp.get('/health', (req, res) => res.send('ok'));\n",
  'guide/intro.md': '# intro\n',
};
const OPTS = { gh: false };
const keys = (z) => z.uncoveredEndpoints.map((e) => `${e.method} ${e.route} ${e.file}`).sort();

function reviewedRepo() {
  const root = repo({ config: API, files: BASE });
  record({ root, skill: 'security-scan', scope: 'global' });
  commit(root, 'review');
  return root;
}

test('rutas FastAPI y Express añadidas tras la revisión salen sin cubrir y la zona en rojo', () => {
  const root = reviewedRepo();
  put(root, 'app/routers/orders.py', 'from fastapi import APIRouter\nrouter = APIRouter()\n\n@router.post("/orders")\nasync def create():\n    return {}\n');
  put(root, 'server/billing.js', "const router = require('express').Router();\nrouter.delete(\"/invoices/:id\", handler);\n");
  commit(root, 'nuevas rutas');
  const z = zone(scan({ root, ...OPTS }), 'api-endpoints');
  assert.deepEqual(keys(z), ['DELETE /invoices/:id server/billing.js', 'POST /orders app/routers/orders.py']);
  assert.equal(z.color, 'red');
  const fastapi = z.uncoveredEndpoints.find((e) => e.file === 'app/routers/orders.py');
  assert.equal(fastapi.stack, 'fastapi');
  assert.equal(fastapi.line, 4);
});

test('un endpoint ya revisado con el mismo contenido no aparece', () => {
  const root = reviewedRepo();
  const z = zone(scan({ root, ...OPTS }), 'api-endpoints');
  assert.deepEqual(z.uncoveredEndpoints, []);
  assert.equal(z.color, 'green');
});

test('un archivo cambiado pero con los mismos endpoints no los da por nuevos', () => {
  const root = reviewedRepo();
  put(root, 'server/index.js', `${BASE['server/index.js']}// comentario\n`);
  commit(root, 'comentario');
  const z = zone(scan({ root, ...OPTS }), 'api-endpoints');
  assert.deepEqual(z.uncovered, ['server/index.js']);
  assert.deepEqual(z.uncoveredEndpoints, []);
  // Sigue sin cubrir un archivo de dos: eso ya es rojo por cobertura, pero no por endpoints.
  assert.equal(z.coverage, 0.5);
});

test('Next: app/**/route.ts con exports GET/POST cuenta como endpoints', () => {
  const root = reviewedRepo();
  put(root, 'app/(shop)/orders/[id]/route.ts', 'export async function GET(req: Request) {}\nexport const POST = async () => {};\nexport function helper() {}\n');
  commit(root, 'next');
  const z = zone(scan({ root, ...OPTS }), 'api-endpoints');
  assert.deepEqual(keys(z), ['GET /orders/[id] app/(shop)/orders/[id]/route.ts', 'POST /orders/[id] app/(shop)/orders/[id]/route.ts']);
  assert.equal(z.color, 'red');
});

test('el modo rápido sigue sin detectar endpoints ni escribir historia', () => {
  const root = reviewedRepo();
  put(root, 'app/routers/orders.py', '@router.post("/orders")\ndef create():\n    pass\n');
  commit(root, 'orders');
  const state = scan({ root, fast: true });
  assert.deepEqual(zone(state, 'api-endpoints').uncoveredEndpoints, []);
  assert.equal(state.kpis.uncoveredEndpoints, 0);
  assert.throws(() => readFileSync(join(root, '.rsc', 'overview', 'history.json')));
});

test('la historia guarda una entrada por semana ISO y no la duplica al volver a ejecutar', () => {
  const root = reviewedRepo();
  const now = new Date();
  scan({ root, ...OPTS, now });
  scan({ root, ...OPTS, now });
  const file = join(root, '.rsc', 'overview', 'history.json');
  let h = JSON.parse(readFileSync(file, 'utf8'));
  assert.equal(h.length, 1);
  assert.match(h[0].week, /^\d{4}-W\d{2}$/);
  assert.equal(typeof h[0].health, 'number');
  assert.equal(h[0].commits, 2); // init + review, los dos de esta semana
  scan({ root, ...OPTS, now: new Date(now.getTime() + 7 * DAY) });
  h = JSON.parse(readFileSync(file, 'utf8'));
  assert.equal(h.length, 2);
  assert.ok(h[0].week < h[1].week);
});

test('semana ISO: el 1 de enero de 2027 cae en 2026-W53', () => {
  const root = reviewedRepo();
  scan({ root, ...OPTS, now: new Date('2027-01-01T12:00:00Z') });
  const h = JSON.parse(readFileSync(join(root, '.rsc', 'overview', 'history.json'), 'utf8'));
  assert.equal(h[0].week, '2026-W53');
});

test('última PR cubierta: el campo pr de las revisiones y los merge commits de ramas revisadas', () => {
  const root = repo({ config: API, files: BASE });
  record({ root, skill: 'security-scan', scope: 'global', pr: 3 });
  commit(root, 'review');
  assert.deepEqual(scan({ root, ...OPTS }).kpis.lastCoveredPr, { number: 3, source: 'review' });

  git(root, 'checkout', '-q', '-b', 'feat/orders');
  put(root, 'app/routers/orders.py', 'x = 1\n');
  commit(root, 'orders');
  record({ root, skill: 'security-scan' }); // scope pr sin número
  commit(root, 'review orders');
  git(root, 'checkout', '-q', 'main');
  git(root, 'merge', '-q', '--no-ff', '-m', 'Merge pull request #12 from someone/feat/orders', 'feat/orders');
  // Una PR mergeada sin revisión no cuenta como cubierta.
  git(root, 'checkout', '-q', '-b', 'feat/raw');
  put(root, 'README.md', 'raw\n');
  commit(root, 'raw');
  git(root, 'checkout', '-q', 'main');
  git(root, 'merge', '-q', '--no-ff', '-m', 'Merge pull request #20 from someone/feat/raw', 'feat/raw');
  assert.deepEqual(scan({ root, ...OPTS }).kpis.lastCoveredPr, { number: 12, source: 'merge' });
});

test('sin PRs, la última PR cubierta es null', () => {
  const root = reviewedRepo();
  assert.equal(scan({ root, ...OPTS }).kpis.lastCoveredPr, null);
});

test('salud global de 0 a 100: todo cubierto es 100 y nada revisado es 0', () => {
  const allOk = repo({ config: { ...API, zones: [API.zones[0]] }, files: BASE });
  record({ root: allOk, skill: 'security-scan', scope: 'global' });
  assert.equal(scan({ root: allOk, ...OPTS }).kpis.health, 100);
  const none = repo({ config: API, files: BASE });
  assert.equal(scan({ root: none, ...OPTS }).kpis.health, 0);
});

test('la salud baja cuando entra un endpoint sin cubrir', () => {
  const root = reviewedRepo();
  const before = scan({ root, ...OPTS }).kpis.health;
  put(root, 'app/routers/orders.py', '@router.post("/orders")\ndef create():\n    pass\n');
  commit(root, 'orders');
  const after = scan({ root, ...OPTS });
  assert.ok(after.kpis.health < before, `${after.kpis.health} < ${before}`);
  assert.ok(zone(after, 'api-endpoints').health <= 40);
});

test('estado para el dashboard: KPIs, historial por zona y skill recomendada', () => {
  const now = new Date();
  const root = dashboardRepo({ now });
  const state = scan({ root, ...OPTS, now });
  assert.deepEqual(state.zones.map((z) => [z.id, z.color]), [
    ['api-endpoints', 'red'], ['frontend', 'green'], ['database', 'amber'], ['docs', 'never'],
  ]);
  assert.deepEqual(state.kpis.zonesNeedingReview, ['api-endpoints', 'database', 'docs']);
  assert.equal(state.kpis.uncoveredFiles, 2); // orders.py y guide/intro.md
  assert.equal(state.kpis.uncoveredEndpoints, 1);
  assert.equal(state.kpis.openQuestions, 1);
  assert.deepEqual(state.kpis.lastCoveredPr, { number: 7, source: 'review' });
  const api = zone(state, 'api-endpoints');
  assert.equal(api.recommendedSkill, 'secure-coding'); // nunca lanzada: va antes que security-scan
  assert.equal(api.checks[0].id, 'server-validation');
  assert.equal(api.reviewHistory.length, 1);
  assert.deepEqual(Object.keys(api.reviewHistory[0]).sort(), ['at', 'branch', 'coveredNow', 'file', 'pr', 'scope', 'skill']);
  assert.equal(api.reviewHistory[0].coveredNow, 1);
  assert.equal(zone(state, 'docs').recommendedSkill, 'docs-review');
  const disk = JSON.parse(readFileSync(join(root, '.rsc', 'overview', 'state.json'), 'utf8'));
  assert.deepEqual(disk.kpis, state.kpis);
});

// ── verificaciones del subagente de docs y comprobaciones (ticket 07) ──────────────────────
// El motor no lanza agentes: lee lo que el agente de `scan` dejó en overview.json.
test('el estado lleva las verificaciones por zona y la última de cada una', () => {
  const now = new Date('2026-11-07T12:00:00Z');
  const config = {
    ...API,
    zones: [API.zones[0], { ...API.zones[1], checks: [{ id: 'readme', label: 'README al día', status: 'unknown', date: '2026-11-06' }] }],
    verifications: [
      { what: 'Supabase local', result: 'verified', evidence: 'psql', at: '2026-11-01' }, // de `start`: no es de zona
      { zone: 'docs', date: '2026-10-01', agent: 'overview-verifier', ok: true, notes: [] },
      { zone: 'docs', date: '2026-11-05', agent: 'overview-verifier', ok: false, notes: ['El README cita `npm run dev`, que no existe'] },
      { zone: 'api-endpoints', date: '2026-11-04', agent: 'overview-verifier', ok: true, notes: ['ok'] },
    ],
  };
  const root = repo({ config, files: BASE });
  const state = scan({ root, ...OPTS, now });
  assert.equal(state.verifications.length, 3);
  assert.deepEqual(zone(state, 'docs').lastVerification, {
    date: '2026-11-05', agent: 'overview-verifier', ok: false, notes: ['El README cita `npm run dev`, que no existe'], ageDays: 2,
  });
  assert.equal(zone(state, 'api-endpoints').lastVerification.ok, true);
  assert.deepEqual(zone(state, 'docs').checks[0], { id: 'readme', label: 'README al día', status: 'unknown', date: '2026-11-06' });
});

test('sin verificaciones, lastVerification es null', () => {
  const state = scan({ root: reviewedRepo(), ...OPTS });
  assert.deepEqual(state.verifications, []);
  assert.equal(zone(state, 'docs').lastVerification, null);
});

// ── el rojo se reserva para lo que pesa (ticket 07) ──────────────────────────────────────────
// Rojo: endpoint nuevo, tabla o migración, o archivo de auth sin cubrir, o cobertura por debajo de
// 0,5. Ámbar: cobertura por debajo de 0,9 o fuera de cadencia.

test('detectores de peso: tablas y migraciones, y auth por la ruta', () => {
  const kind = (path, src = '') => weightyKind(path, () => src);
  for (const p of ['migrations/0001_init.py', 'alembic/versions/ab12_users.py', 'supabase/migrations/20260101_x.sql', 'prisma/schema.prisma']) {
    assert.equal(kind(p), 'table', p);
  }
  assert.equal(kind('db/002.sql', 'ALTER TABLE users ADD COLUMN x int;'), 'table');
  assert.equal(kind('db/003.sql', 'create table orders (id int);'), 'table');
  assert.equal(kind('app/models.py', 'op.create_table("orders")'), 'table');
  assert.equal(kind('db/seed.sql', 'insert into users values (1);'), null);
  for (const p of ['src/auth/guard.ts', 'api/login.py', 'lib/jwt.js', 'app/userSession.ts', 'supabase/rls_policies.sql', 'core/permissions.py', 'api/oauth.py']) {
    assert.equal(kind(p), 'auth', p);
  }
  for (const p of ['web/App.tsx', 'web/tokens.css', 'app/urls.py', 'docs/auth.md']) assert.equal(kind(p), null, p);
});

test('un CSS cambiado deja frontend en ámbar, no en rojo', () => {
  const now = new Date();
  const root = dashboardRepo({ now });
  put(root, 'web/styles.css', 'body { margin: 0; }\n');
  commit(root, 'estilos');
  const z = zone(scan({ root, ...OPTS, now }), 'frontend');
  assert.equal(z.coverage, 0.5);
  assert.deepEqual(z.uncoveredWeighty, []);
  assert.equal(z.color, 'amber');
});

test('una migración nueva pone database en rojo y sale en uncoveredWeighty', () => {
  const now = new Date();
  const root = dashboardRepo({ now });
  put(root, 'db/002_orders.sql', 'CREATE TABLE orders (id int);\n');
  commit(root, 'migración');
  const z = zone(scan({ root, ...OPTS, now }), 'database');
  assert.equal(z.coverage, 0.5);
  assert.deepEqual(z.uncoveredWeighty, [{ kind: 'table', file: 'db/002_orders.sql' }]);
  assert.equal(z.color, 'red');
  assert.ok(z.health <= 40, `salud ${z.health} con una tabla sin cubrir`);
});

test('cobertura por debajo de 0,5 es rojo aunque no haya nada de peso', () => {
  const root = reviewedRepo();
  put(root, 'guide/a.md', 'a\n');
  put(root, 'guide/b.md', 'b\n');
  record({ root, skill: 'docs-review', scope: 'global' });
  put(root, 'guide/intro.md', 'cambiada\n');
  put(root, 'guide/a.md', 'cambiada\n');
  const z = zone(scan({ root, ...OPTS }), 'docs');
  assert.ok(z.coverage < 0.5);
  assert.deepEqual(z.uncoveredWeighty, []);
  assert.equal(z.color, 'red');
});

// ── los fallos encontrados pesan en el color (ticket 08) ─────────────────────────────────────
// Verde = revisado y sin fallos abiertos. Un check en `fail` pone la zona en rojo aunque esté
// cubierta entera; una verificación con ok:false (los docs no cuadran), como mínimo en ámbar.
// Revisar los archivos de nuevo no cierra un fallo: solo lo cierra el check al pasar a pass o na.
const withChecks = (checks, extra = {}) => ({
  ...API,
  zones: [{ ...API.zones[0], checks }, API.zones[1]],
  ...extra,
});
function coveredRepo(config) {
  const root = repo({ config, files: BASE });
  record({ root, skill: 'security-scan', scope: 'global' });
  record({ root, skill: 'docs-review', scope: 'global' });
  commit(root, 'reviews');
  return root;
}

test('cobertura total y un check en fail: rojo, con el fallo en findings', () => {
  const root = coveredRepo(withChecks([
    { id: 'rate-limiting', label: 'Rate limiting', skill: 'secure-coding', status: 'fail', note: 'sin límite en /login', date: '2026-11-08' },
    { id: 'cors-own-domain', label: 'CORS', status: 'pass' },
  ]));
  const state = scan({ root, ...OPTS });
  const z = zone(state, 'api-endpoints');
  assert.equal(z.coverage, 1);
  assert.equal(z.color, 'red');
  assert.deepEqual(z.findings, [
    { source: 'check', id: 'rate-limiting', label: 'Rate limiting', skill: 'secure-coding', note: 'sin límite en /login', date: '2026-11-08' },
  ]);
  assert.ok(z.health <= 40, `salud ${z.health} con un fallo abierto`);
  assert.equal(z.recommendedSkill, 'secure-coding', 'la skill del check que falla');
  assert.equal(state.kpis.openFindings, 1);
  assert.ok(state.kpis.zonesNeedingReview.includes('api-endpoints'));
  assert.equal(zone(state, 'docs').color, 'green');
  assert.deepEqual(zone(state, 'docs').findings, []);
});

test('al pasar el check a pass (o na), la zona vuelve a verde; revisar de nuevo no basta', () => {
  const failing = withChecks([{ id: 'rate-limiting', label: 'Rate limiting', status: 'fail', note: 'x' }]);
  const root = coveredRepo(failing);
  record({ root, skill: 'security-scan', scope: 'global' });
  assert.equal(zone(scan({ root, ...OPTS }), 'api-endpoints').color, 'red', 'otra revisión no cierra el fallo');

  for (const status of ['pass', 'na']) {
    put(root, 'docs/overview/overview.json', JSON.stringify(withChecks([{ id: 'rate-limiting', label: 'Rate limiting', status, note: '' }])));
    const state = scan({ root, ...OPTS });
    assert.equal(zone(state, 'api-endpoints').color, 'green', status);
    assert.deepEqual(zone(state, 'api-endpoints').findings, []);
    assert.equal(state.kpis.openFindings, 0);
  }
});

test('una verificación con ok:false y cobertura total deja la zona en ámbar', () => {
  const config = withChecks([], {
    verifications: [
      { zone: 'docs', date: '2026-11-01', agent: 'overview-verifier', ok: true, notes: [] },
      { zone: 'docs', date: '2026-11-08', agent: 'overview-verifier', ok: false, notes: ['El README cita `npm run dev`', 'Falta `PORT`'] },
    ],
  });
  const state = scan({ root: coveredRepo(config), ...OPTS });
  const z = zone(state, 'docs');
  assert.equal(z.coverage, 1);
  assert.equal(z.color, 'amber');
  assert.deepEqual(z.findings, [{
    source: 'verification', id: 'overview-verifier', label: 'Los docs no cuadran con el código', skill: null,
    note: 'El README cita `npm run dev` · Falta `PORT`', date: '2026-11-08',
  }]);
  assert.equal(state.kpis.openFindings, 1);
});

test('una verificación posterior con ok:true cierra el fallo de docs', () => {
  const config = withChecks([], {
    verifications: [
      { zone: 'docs', date: '2026-11-01', agent: 'overview-verifier', ok: false, notes: ['x'] },
      { zone: 'docs', date: '2026-11-08', agent: 'overview-verifier', ok: true, notes: [] },
    ],
  });
  const z = zone(scan({ root: coveredRepo(config), ...OPTS }), 'docs');
  assert.equal(z.color, 'green');
  assert.deepEqual(z.findings, []);
});

test('el modo rápido también ve los fallos (el aviso de sesión los cuenta)', () => {
  const root = coveredRepo(withChecks([{ id: 'rls', label: 'RLS', status: 'fail', note: 'solo una tabla' }]));
  const z = zone(scan({ root, ...OPTS, fast: true }), 'api-endpoints');
  assert.equal(z.color, 'red');
  assert.equal(z.findings.length, 1);
});

test('una zona nunca revisada con un check en fail sale en rojo, no en gris', () => {
  const root = repo({ config: withChecks([{ id: 'keys-out-of-code', label: 'Claves fuera del código', skill: 'security-scan', status: 'fail', note: 'settings.py:13' }]), files: BASE });
  const z = zone(scan({ root, ...OPTS }), 'api-endpoints');
  assert.equal(z.reviews, 0);
  assert.equal(z.color, 'red');
  assert.equal(z.findings.length, 1);
});
