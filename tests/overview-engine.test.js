import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { record, render, scan } from '../skills/overview/scripts/overview.mjs';
import { ENGINE, DAY, CONFIG, git, put, repo, reviewsOf, zone } from './fixtures/overview-fixture.js';

// El motor de `overview` decide si un archivo está revisado por el CONTENIDO (blob sha), no por la
// fecha: el anti-objetivo es la falsa cobertura. Estos tests montan un repo git de verdad, con ramas,
// merge y squash, porque es justo ahí donde una cobertura por fecha o por commit se rompería.

test('sin overview.json, record y scan no hacen nada', () => {
  const root = repo({ config: null });
  assert.equal(record({ root, skill: 'security-scan', scope: 'global' }), null);
  assert.equal(scan({ root }), null);
  assert.equal(existsSync(join(root, 'docs', 'overview')), false);
  assert.equal(existsSync(join(root, '.rsc', 'overview', 'state.json')), false);
});

test('record global cubre todos los archivos de las zonas de esa skill, con su blob sha', () => {
  const root = repo();
  const out = record({ root, skill: 'security-scan', scope: 'global' });
  assert.ok(out && existsSync(out.path));
  const review = JSON.parse(readFileSync(out.path, 'utf8'));
  assert.equal(review.skill, 'security-scan');
  assert.equal(review.scope, 'global');
  assert.equal(review.branch, 'main');
  assert.equal(review.commit, git(root, 'rev-parse', 'HEAD'));
  assert.deepEqual(review.zones, ['api-endpoints']);
  assert.deepEqual(review.files, { 'api/users.js': git(root, 'rev-parse', 'HEAD:api/users.js') });
});

test('record pr cubre lo cambiado frente al merge-base más lo que no está commiteado', () => {
  const root = repo();
  put(root, 'api/old.js', 'old\n');
  git(root, 'add', '.');
  git(root, 'commit', '-q', '-m', 'old');
  git(root, 'checkout', '-q', '-b', 'feat/orders');
  put(root, 'api/orders.js', 'orders\n');
  git(root, 'add', '.');
  git(root, 'commit', '-q', '-m', 'orders');
  put(root, 'api/lines.js', 'lines\n'); // sin commitear
  put(root, 'README.md', 'cambio fuera de zona\n');
  const out = record({ root, skill: 'security-scan', pr: 41 });
  const review = JSON.parse(readFileSync(out.path, 'utf8'));
  assert.equal(review.scope, 'pr');
  assert.equal(review.pr, 41);
  assert.equal(review.branch, 'feat/orders');
  assert.deepEqual(Object.keys(review.files).sort(), ['api/lines.js', 'api/orders.js']);
  assert.equal(review.files['api/lines.js'], git(root, 'hash-object', 'api/lines.js'));
});

test('una skill que no revisa ninguna zona no escribe nada', () => {
  const root = repo();
  assert.equal(record({ root, skill: 'bro', scope: 'global' }), null);
  assert.deepEqual(reviewsOf(root), []);
});

test('el nombre de skill se valida antes de usarlo en un fichero', () => {
  const root = repo({ config: { ...CONFIG, zones: [{ ...CONFIG.zones[0], reviewSkills: ['../evil', 'a b', 'ok:skill'] }] } });
  for (const bad of ['../evil', 'a b', 'X', '$(rm)', '']) {
    assert.equal(record({ root, skill: bad, scope: 'global' }), null, bad);
  }
  assert.deepEqual(reviewsOf(root), []);
  // Los dos puntos son válidos en el id, pero no en un nombre de fichero de Windows.
  const out = record({ root, skill: 'ok:skill', scope: 'global' });
  assert.ok(out);
  assert.doesNotMatch(out.file, /:/);
});

test('.env* y los ficheros ignorados quedan fuera de files', () => {
  const root = repo();
  put(root, '.gitignore', 'api/secret.txt\n');
  put(root, 'api/.env', 'KEY=1\n');
  put(root, 'api/.env.local', 'KEY=2\n');
  put(root, 'api/secret.txt', 'shh\n');
  git(root, 'add', '.gitignore', 'api/.env');
  git(root, 'commit', '-q', '-m', 'env');
  const out = record({ root, skill: 'security-scan', scope: 'global' });
  const review = JSON.parse(readFileSync(out.path, 'utf8'));
  assert.deepEqual(Object.keys(review.files), ['api/users.js']);
});

test('dos registros seguidos escriben archivos distintos', () => {
  const root = repo();
  const now = new Date('2026-11-07T10:12:00Z');
  const a = record({ root, skill: 'security-scan', scope: 'global', now });
  const b = record({ root, skill: 'security-scan', scope: 'global', now });
  assert.notEqual(a.file, b.file);
  assert.equal(reviewsOf(root).length, 2);
});

test('scan: zona nunca revisada sale never y el estado va a .rsc/overview/state.json', () => {
  const root = repo();
  const state = scan({ root });
  assert.equal(zone(state, 'api-endpoints').color, 'never');
  assert.equal(zone(state, 'docs').color, 'never');
  const disk = JSON.parse(readFileSync(join(root, '.rsc', 'overview', 'state.json'), 'utf8'));
  assert.deepEqual(disk.zones.map((z) => z.color), ['never', 'never']);
});

test('scan: revisión reciente con todo cubierto sale green', () => {
  const root = repo();
  record({ root, skill: 'security-scan', scope: 'global' });
  const z = zone(scan({ root }), 'api-endpoints');
  assert.equal(z.color, 'green');
  assert.equal(z.coverage, 1);
  assert.deepEqual(z.uncovered, []);
});

test('scan: un archivo modificado tras la revisión deja de contar como cubierto', () => {
  const root = repo();
  record({ root, skill: 'security-scan', scope: 'global' });
  put(root, 'api/users.js', 'export const users = 2;\n');
  const z = zone(scan({ root }), 'api-endpoints');
  assert.deepEqual(z.uncovered, ['api/users.js']);
  assert.equal(z.covered, 0);
});

test('scan: zona intacta con revisión vieja no pasa de amber', () => {
  const root = repo();
  record({ root, skill: 'security-scan', scope: 'global', now: new Date(Date.now() - 400 * DAY) });
  const z = zone(scan({ root }), 'api-endpoints');
  assert.equal(z.color, 'amber');
  assert.ok(z.ageDays >= 399);
});

test('scan: zona con archivos nuevos sin cubrir sale red', () => {
  const root = repo();
  record({ root, skill: 'security-scan', scope: 'global' });
  put(root, 'api/orders.js', 'orders\n');
  put(root, 'api/lines.js', 'lines\n');
  git(root, 'add', '.');
  git(root, 'commit', '-q', '-m', 'nuevos');
  const z = zone(scan({ root }), 'api-endpoints');
  assert.equal(z.color, 'red');
  assert.deepEqual(z.uncovered, ['api/lines.js', 'api/orders.js']);
});

test('scan --fast calcula los mismos colores', () => {
  const root = repo();
  record({ root, skill: 'security-scan', scope: 'global' });
  const state = scan({ root, fast: true });
  assert.equal(state.fast, true);
  assert.equal(zone(state, 'api-endpoints').color, 'green');
});

// `git ls-files -o` lista un repo anidado como `dir/`, y `hash-object --stdin-paths` falla entero con
// él: sin respaldo, ningún archivo cambiado o nuevo tendría blob y la zona parecería al día.
test('scan: si hash-object --stdin-paths falla, se hashea archivo por archivo', () => {
  const root = repo();
  record({ root, skill: 'security-scan', scope: 'global' });
  put(root, 'api/new.js', 'nuevo\n');
  put(root, 'api/users.js', 'export const users = 2;\n');
  const nested = join(root, 'api', 'vendor');
  mkdirSync(nested, { recursive: true });
  git(nested, 'init', '-q');
  put(root, 'api/vendor/x.js', 'x\n');
  const z = zone(scan({ root }), 'api-endpoints');
  assert.deepEqual(z.uncovered, ['api/new.js', 'api/users.js']);
  assert.notEqual(z.color, 'green');
});

test('scan: una ruta con salto de línea se ignora y no descuadra los demás hashes', { skip: process.platform === 'win32' && 'Windows no admite saltos de línea en nombres de archivo' }, () => {
  const root = repo();
  record({ root, skill: 'security-scan', scope: 'global' });
  put(root, 'api/a\nb.js', 'raro\n');
  put(root, 'api/new.js', 'nuevo\n');
  const z = zone(scan({ root }), 'api-endpoints');
  assert.deepEqual(z.uncovered, ['api/new.js']);
  assert.equal(z.covered, 1);
});

// El scan rápido corre en el Worker del arranque y puede morir a medias por el tope de tiempo: si
// escribiera state.json, lo dejaría truncado o empobrecido (sin endpoints) para el dashboard.
test('scan --fast no escribe state.json', () => {
  const root = repo();
  record({ root, skill: 'security-scan', scope: 'global' });
  scan({ root, fast: true });
  assert.equal(existsSync(join(root, '.rsc', 'overview', 'state.json')), false);
});

test('render no reutiliza un estado rápido ni uno truncado: vuelve a hacer el scan completo', () => {
  const root = repo();
  record({ root, skill: 'security-scan', scope: 'global' });
  const dir = join(root, '.rsc', 'overview');
  mkdirSync(dir, { recursive: true });
  const renderedState = () => {
    const html = readFileSync(render({ root, gh: false }).path, 'utf8');
    return JSON.parse(/id="overview-state">([\s\S]*?)<\/script>/.exec(html)[1]).state;
  };
  writeFileSync(join(dir, 'state.json'), JSON.stringify({ version: 1, fast: true, kpis: {}, zones: [] }));
  let state = renderedState();
  assert.equal(state.fast, false);
  assert.equal(state.zones.length, 2);
  writeFileSync(join(dir, 'state.json'), '{"version":1,"fast":false,"zon');
  state = renderedState();
  assert.equal(state.zones.length, 2);
});

// Dos ramas en paralelo: A pasa seguridad y B no. Tras mergear, lo de A cuenta y lo de B queda
// pendiente. Con squash desaparecen los commits de A, pero el blob sha se conserva.
function twoBranches(root) {
  git(root, 'checkout', '-q', '-b', 'feat/a');
  put(root, 'api/a.js', 'a\n');
  git(root, 'add', '.');
  git(root, 'commit', '-q', '-m', 'a');
  const rev = record({ root, skill: 'security-scan' });
  assert.equal(JSON.parse(readFileSync(rev.path, 'utf8')).scope, 'pr');
  git(root, 'add', '.');
  git(root, 'commit', '-q', '-m', 'review a');
  git(root, 'checkout', '-q', 'main');
  git(root, 'checkout', '-q', '-b', 'feat/b');
  put(root, 'api/b.js', 'b\n');
  git(root, 'add', '.');
  git(root, 'commit', '-q', '-m', 'b');
  git(root, 'checkout', '-q', 'main');
}

function assertMerged(root) {
  assert.equal(reviewsOf(root).length, 1);
  const z = zone(scan({ root }), 'api-endpoints');
  assert.deepEqual(z.uncovered.sort(), ['api/b.js', 'api/users.js']);
  assert.equal(z.covered, 1); // api/a.js
}

test('merge normal de dos ramas: lo revisado sale cubierto y lo nuevo de la otra, pendiente', () => {
  const root = repo();
  twoBranches(root);
  git(root, 'merge', '-q', '--no-ff', '-m', 'merge a', 'feat/a');
  git(root, 'merge', '-q', '--no-ff', '-m', 'merge b', 'feat/b');
  assertMerged(root);
});

test('squash merge de dos ramas: las revisiones siguen valiendo en main', () => {
  const root = repo();
  twoBranches(root);
  git(root, 'merge', '-q', '--squash', 'feat/a');
  git(root, 'commit', '-q', '-m', 'squash a');
  git(root, 'merge', '-q', '--squash', 'feat/b');
  git(root, 'commit', '-q', '-m', 'squash b');
  assertMerged(root);
});

test('dos ramas que registran por separado se mergean sin conflicto y suman sus revisiones', () => {
  const root = repo();
  const now = new Date('2026-11-07T10:12:00Z'); // misma hora en las dos: el commit desempata
  for (const b of ['feat/x', 'feat/y']) {
    git(root, 'checkout', '-q', 'main');
    git(root, 'checkout', '-q', '-b', b);
    put(root, `api/${b.slice(5)}.js`, `${b}\n`);
    git(root, 'add', '.');
    git(root, 'commit', '-q', '-m', b);
    record({ root, skill: 'security-scan', now });
    git(root, 'add', '.');
    git(root, 'commit', '-q', '-m', `review ${b}`);
  }
  git(root, 'checkout', '-q', 'main');
  git(root, 'merge', '-q', '--no-ff', '-m', 'x', 'feat/x');
  git(root, 'merge', '-q', '--no-ff', '-m', 'y', 'feat/y');
  assert.equal(reviewsOf(root).length, 2);
  const z = zone(scan({ root }), 'api-endpoints');
  assert.deepEqual(z.uncovered, ['api/users.js']);
});

test('por CLI: record y scan con --root', () => {
  const root = repo();
  const r = spawnSync('node', [ENGINE, 'record', '--skill', 'security-scan', '--scope', 'global', '--root', root], { encoding: 'utf8', windowsHide: true });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(reviewsOf(root).length, 1);
  const s = spawnSync('node', [ENGINE, 'scan', '--fast', '--root', root], { encoding: 'utf8', windowsHide: true });
  assert.equal(s.status, 0, s.stderr);
  assert.equal(zone(JSON.parse(s.stdout), 'api-endpoints').color, 'green');
});

test('por CLI: sin overview.json sale con 0 y en silencio', () => {
  const root = repo({ config: null });
  const r = spawnSync('node', [ENGINE, 'record', '--skill', 'security-scan', '--root', root], { encoding: 'utf8', windowsHide: true });
  assert.equal(r.status, 0);
  assert.equal(r.stdout, '');
});
