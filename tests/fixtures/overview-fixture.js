// Fixture reutilizable para los tests de `overview`: un repo git temporal de verdad, con
// `docs/overview/overview.json`, y atajos para escribir archivos, commitear y registrar revisiones.
// Lo usan los tests del motor y lo puede usar el dashboard (ticket 05) para tener un estado con
// zonas de todos los colores sin montar nada a mano: `dashboardRepo()`.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { record } from '../../skills/overview/scripts/overview.mjs';

export const ENGINE = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'skills', 'overview', 'scripts', 'overview.mjs');
export const DAY = 24 * 60 * 60 * 1000;

export function git(root, ...args) {
  const r = spawnSync('git', args, { cwd: root, encoding: 'utf8', windowsHide: true });
  assert.equal(r.status, 0, `git ${args.join(' ')}: ${r.stderr}`);
  return r.stdout.trim();
}

export function put(root, rel, body) {
  mkdirSync(dirname(join(root, rel)), { recursive: true });
  writeFileSync(join(root, rel), body);
}

export function commit(root, msg = 'wip') {
  git(root, 'add', '-A');
  git(root, 'commit', '-q', '-m', msg);
}

export const CONFIG = {
  version: 1,
  project: 'fixture',
  zones: [
    { id: 'api-endpoints', label: 'Endpoints API', paths: ['api/**'], reviewSkills: ['security-scan'], cadenceDays: 30, checks: [] },
    { id: 'docs', label: 'Docs', paths: ['guide/**/*.md'], reviewSkills: ['docs-review'], cadenceDays: 30, checks: [] },
  ],
  questions: [],
};

export function repo({ config = CONFIG, files = { 'api/users.js': 'export const users = 1;\n', 'guide/intro.md': '# intro\n', 'README.md': 'hola\n' } } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'rsc-overview-'));
  git(root, 'init', '-q', '-b', 'main');
  git(root, 'config', 'user.email', 'test@example.com');
  git(root, 'config', 'user.name', 'Test');
  git(root, 'config', 'commit.gpgsign', 'false');
  git(root, 'config', 'core.autocrlf', 'false');
  for (const [rel, body] of Object.entries(files)) put(root, rel, body);
  if (config) put(root, 'docs/overview/overview.json', JSON.stringify(config, null, 2));
  commit(root, 'init');
  return root;
}

export const reviewsOf = (root) => {
  const dir = join(root, 'docs', 'overview', 'reviews');
  return existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.json')) : [];
};
export const zone = (state, id) => state.zones.find((z) => z.id === id);

// Repo con una zona de cada color tras `scan()` (sin --fast):
//   api-endpoints → red    (revisada, y luego entra una ruta FastAPI nueva sin cubrir)
//   frontend      → green  (revisada hace poco, intacta)
//   database      → amber  (revisada hace 60 días con cadencia 30, intacta)
//   docs          → never  (nunca revisada)
// Incluye una revisión con `pr` para que el KPI de última PR cubierta tenga valor, una pregunta
// abierta y una comprobación en `checks`.
export const DASHBOARD_CONFIG = {
  version: 1,
  project: 'dashboard-fixture',
  zones: [
    { id: 'api-endpoints', label: 'Endpoints API', paths: ['app/routers/**'], reviewSkills: ['security-scan', 'secure-coding'], cadenceDays: 30,
      checks: [{ id: 'server-validation', label: 'Validación en el servidor', skill: 'secure-coding', status: 'fail', note: '1 ruta' }] },
    { id: 'frontend', label: 'Frontend', paths: ['web/**'], reviewSkills: ['code-review'], cadenceDays: 30, checks: [] },
    { id: 'database', label: 'Base de datos', paths: ['db/**'], reviewSkills: ['rls-review'], cadenceDays: 30, checks: [] },
    { id: 'docs', label: 'Documentación', paths: ['guide/**'], reviewSkills: ['docs-review'], cadenceDays: 30, checks: [] },
  ],
  questions: [
    { id: 'multitenant', zone: 'database', text: '¿Multitenant?', state: 'open' },
    { id: 'sessions', zone: 'security', text: '¿Sesiones que caducan?', state: 'decided', answer: 'sí, 24 h', who: 'user' },
  ],
};

export function dashboardRepo({ now = new Date() } = {}) {
  const root = repo({
    config: DASHBOARD_CONFIG,
    files: {
      'app/routers/users.py': 'from fastapi import APIRouter\nrouter = APIRouter()\n\n@router.get("/users")\ndef list_users():\n    return []\n',
      'web/App.tsx': 'export const App = () => null;\n',
      'db/001_init.sql': 'create table users (id int);\n',
      'guide/intro.md': '# intro\n',
    },
  });
  const t = now.getTime();
  record({ root, skill: 'security-scan', scope: 'global', pr: 7, now: new Date(t - 2 * DAY) });
  record({ root, skill: 'code-review', scope: 'global', now: new Date(t - 1 * DAY) });
  record({ root, skill: 'rls-review', scope: 'global', now: new Date(t - 60 * DAY) });
  commit(root, 'reviews');
  put(root, 'app/routers/orders.py', 'from fastapi import APIRouter\nrouter = APIRouter()\n\n@router.post("/orders")\ndef create_order():\n    return {}\n');
  commit(root, 'orders');
  return root;
}
