#!/usr/bin/env node
// Motor de `overview`: registra revisiones y calcula la cobertura por zona.
//
// Un solo módulo autocontenido que solo importa builtins de `node:`. Los hooks lo cargan con
// import() desde `.rsc/`, así que no puede depender de nada que no esté a su lado.
//
//   node overview.mjs record --skill <id> [--scope pr|global] [--pr N] [--root <dir>]
//   node overview.mjs scan [--fast] [--no-gh] [--root <dir>]
//
// Regla central: un archivo está revisado por la skill S si alguna revisión de S lo registra con el
// MISMO blob sha que tiene hoy (el de HEAD, o el del árbol de trabajo si tiene cambios). La fecha no
// cubre nada; solo el contenido. Por eso sobrevive al squash merge y no da falsa cobertura.
//
// Estado calculado (contrato estable para el dashboard; todo va en .rsc/overview/, fuera de git):
//
// state.json (solo el scan completo lo escribe) = {
//   version: 1, generatedAt: ISO, fast: bool, branch, commit, reviews: <nº de revisiones>,
//   kpis: {
//     health: 0-100,                       // media de zones[].health ponderada por nº de archivos
//     zonesNeedingReview: [zoneId],        // zonas cuyo color no es green
//     uncoveredFiles: n,                   // archivos distintos sin cubrir en alguna zona
//     uncoveredEndpoints: n,               // endpoints nuevos sin cubrir (0 en --fast)
//     openQuestions: n,                    // questions[] con state 'open' en overview.json
//     lastCoveredPr: { number, source: 'review'|'merge'|'gh' } | null,
//   },
//   zones: [{
//     id, label, reviewSkills: [id], cadenceDays: n|null, checks: [...],   // checks tal cual del config
//     files: n, covered: n, coverage: 0..1, uncovered: [path],
//     uncoveredEndpoints: [{ method, route, file, line, stack: 'fastapi'|'express'|'next' }],
//     uncoveredWeighty: [{ kind: 'table'|'auth', file }],   // de peso sin cubrir (también en --fast)
//     lastReviewAt: ISO|null, ageDays: n|null, reviews: n,
//     reviewHistory: [{ skill, at, branch, scope, pr: n|null, file, coveredNow: n }],  // más reciente primero
//     recommendedSkill: id|null,           // la reviewSkill nunca lanzada o la de revisión más antigua
//     health: 0-100,
//     color: 'green'|'amber'|'red'|'never',
//   }],
// }
//
// history.json = [{ week: 'YYYY-Www' (semana ISO, UTC), health: 0-100, commits: n }]  // por semana,
//   ordenado; un scan completo sustituye la entrada de su semana. --fast no la toca.
//
// --fast (aviso de sesión): mismos colores por cobertura y edad, pero sin detectar endpoints, sin
// merges ni `gh` para la PR (solo el campo `pr` de las revisiones) y sin escribir nada: ni
// state.json ni history.json. Solo devuelve el estado.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, realpathSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const SKILL_ID_RE = /^[a-z0-9:_-]+$/;
const CONFIG_REL = ['docs', 'overview', 'overview.json'];
const REVIEWS_REL = ['docs', 'overview', 'reviews'];
const STATE_REL = ['.rsc', 'overview', 'state.json'];
const HISTORY_REL = ['.rsc', 'overview', 'history.json'];
const DAY_MS = 24 * 60 * 60 * 1000;

// Umbrales de color. Por debajo de RED_BELOW falta más de la mitad: rojo aunque nada pese. Entre
// RED_BELOW y GREEN_FROM pide revisión pero no es urgente. El rojo es sobre todo para lo que pesa
// (endpoints, tablas, auth sin cubrir; ver WEIGHTY_DETECTORS). La edad sola, con todo cubierto,
// nunca pasa de ámbar: no se pide revisar código intacto.
export const GREEN_FROM = 0.9;
export const RED_BELOW = 0.5;

// git siempre sin shell y con argumentos en array: el nombre de skill y el prompt son datos.
function git(root, args) {
  const r = spawnSync('git', args, { cwd: root, encoding: 'utf8', windowsHide: true, maxBuffer: 64 * 1024 * 1024 });
  return r.status === 0 ? r.stdout : null;
}
const zlist = (out) => (out ? out.split('\0').filter(Boolean) : []);

function readConfig(root) {
  const p = join(root, ...CONFIG_REL);
  if (!existsSync(p)) return null;
  try {
    const cfg = JSON.parse(readFileSync(p, 'utf8'));
    return { ...cfg, zones: Array.isArray(cfg.zones) ? cfg.zones : [] };
  } catch {
    return null;
  }
}

// Glob a regex: `**/` es cero o más carpetas, `**` cualquier cosa, `*` y `?` no cruzan `/`.
function globToRegExp(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i += 1) {
    const c = glob[i];
    if (c === '*' && glob[i + 1] === '*') {
      if (glob[i + 2] === '/') { re += '(?:.*/)?'; i += 2; } else { re += '.*'; i += 1; }
    } else if (c === '*') re += '[^/]*';
    else if (c === '?') re += '[^/]';
    else re += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`^${re}$`);
}
const zoneMatcher = (zone) => {
  const res = (zone.paths || []).map(globToRegExp);
  return (path) => res.some((r) => r.test(path));
};

// Nunca entran en `files`: secretos `.env*` ni los propios datos de overview.
const excluded = (path) => /(^|\/)\.env[^/]*$/.test(path) || path.startsWith('docs/overview/');

// Archivos del proyecto con su blob sha actual. Los limpios salen del índice (barato); los que
// difieren de HEAD o no están seguidos se hashean del árbol de trabajo. Lo ignorado por git no entra.
function currentFiles(root) {
  const tracked = zlist(git(root, ['ls-files', '-z', '-s']));
  const ignoredTracked = new Set(zlist(git(root, ['ls-files', '-z', '-c', '-i', '--exclude-standard'])));
  const untracked = zlist(git(root, ['ls-files', '-z', '-o', '--exclude-standard']));
  const hasHead = git(root, ['rev-parse', '--verify', '--quiet', 'HEAD']) !== null;
  const dirty = new Set(hasHead ? zlist(git(root, ['diff', '-z', '--name-only', 'HEAD'])) : []);
  const blobs = new Map();
  const toHash = [];
  for (const line of tracked) {
    const tab = line.indexOf('\t');
    const path = line.slice(tab + 1);
    const sha = line.slice(0, tab).split(' ')[1];
    if (excluded(path) || ignoredTracked.has(path) || !existsSync(join(root, path))) continue;
    if (!hasHead || dirty.has(path)) toHash.push(path); else blobs.set(path, sha);
  }
  for (const path of untracked) if (!excluded(path)) toHash.push(path);
  hashWorkingFiles(root, toHash, blobs);
  return blobs;
}

// Hashea del árbol de trabajo en una sola llamada. `--stdin-paths` separa por líneas, así que una
// ruta con salto de línea se ignora. Si git falla (un repo anidado sale como `dir/` y lo tumba
// entero) o el número de shas no cuadra, se hashea archivo por archivo y se salta lo que falle.
function hashWorkingFiles(root, paths, blobs) {
  const toHash = paths.filter((p) => !/[\r\n]/.test(p));
  if (!toHash.length) return;
  const r = spawnSync('git', ['hash-object', '--stdin-paths'], {
    cwd: root, input: toHash.join('\n') + '\n', encoding: 'utf8', windowsHide: true, maxBuffer: 64 * 1024 * 1024,
  });
  const shas = r.status === 0 ? r.stdout.split('\n').filter(Boolean) : [];
  if (shas.length === toHash.length) {
    toHash.forEach((p, i) => blobs.set(p, shas[i]));
    return;
  }
  for (const p of toHash) {
    const sha = (git(root, ['hash-object', '--', p]) || '').trim();
    if (sha) blobs.set(p, sha);
  }
}

// Rama principal: origin/HEAD, y si no, main o master.
function mainBranch(root) {
  const sym = git(root, ['symbolic-ref', '--quiet', 'refs/remotes/origin/HEAD']);
  if (sym) return { ref: sym.trim(), name: sym.trim().replace(/^refs\/remotes\/origin\//, '') };
  for (const name of ['main', 'master']) {
    if (git(root, ['rev-parse', '--verify', '--quiet', `refs/heads/${name}`]) !== null) return { ref: name, name };
  }
  return null;
}

// Archivos de una revisión de PR: el diff contra el merge-base más lo que no está commiteado.
function prPaths(root, main) {
  const paths = new Set();
  const base = main && git(root, ['merge-base', 'HEAD', main.ref]);
  if (base) for (const p of zlist(git(root, ['diff', '-z', '--name-only', base.trim(), 'HEAD']))) paths.add(p);
  for (const p of zlist(git(root, ['diff', '-z', '--name-only', 'HEAD']))) paths.add(p);
  for (const p of zlist(git(root, ['ls-files', '-z', '-o', '--exclude-standard']))) paths.add(p);
  return paths;
}

const stamp = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z').replace(/^(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');

/**
 * Escribe una revisión nueva en docs/overview/reviews/. Devuelve { path, file, review } o null si
 * no hay nada que registrar (sin overview.json, skill inválida o que no revisa ninguna zona).
 */
export function record({ root = process.cwd(), skill, scope, pr, now = new Date() } = {}) {
  root = resolve(root);
  if (typeof skill !== 'string' || !SKILL_ID_RE.test(skill)) return null;
  const cfg = readConfig(root);
  if (!cfg) return null;
  const zones = cfg.zones.filter((z) => Array.isArray(z.reviewSkills) && z.reviewSkills.includes(skill));
  if (!zones.length) return null;
  // Sin git no hay blob sha: una revisión vacía solo sería ruido.
  if (git(root, ['rev-parse', '--is-inside-work-tree']) === null) return null;

  const branch = (git(root, ['rev-parse', '--abbrev-ref', 'HEAD']) || '').trim();
  const commit = (git(root, ['rev-parse', 'HEAD']) || '').trim();
  const main = mainBranch(root);
  const prNum = pr === undefined || pr === null || pr === '' ? undefined : Number(pr);
  if (scope !== 'pr' && scope !== 'global') scope = prNum || (main && branch !== main.name) ? 'pr' : 'global';

  const matchers = zones.map(zoneMatcher);
  const inZones = (p) => matchers.some((m) => m(p));
  const blobs = currentFiles(root);
  const wanted = scope === 'pr' ? prPaths(root, main) : null;
  const files = {};
  for (const [path, sha] of [...blobs].sort(([a], [b]) => a.localeCompare(b))) {
    if (inZones(path) && (!wanted || wanted.has(path))) files[path] = sha;
  }

  const review = { skill, at: now.toISOString(), branch, commit, scope };
  if (Number.isInteger(prNum) && prNum > 0) review.pr = prNum;
  review.zones = zones.map((z) => z.id);
  review.files = files;

  // Un archivo por revisión: dos ramas nunca escriben el mismo, así que mergear no da conflictos.
  // Los `:` del id no valen en un nombre de fichero de Windows.
  const dir = join(root, ...REVIEWS_REL);
  mkdirSync(dir, { recursive: true });
  const base = `${stamp(now)}-${skill.replace(/:/g, '_')}-${commit.slice(0, 7) || 'nocommit'}`;
  let file = `${base}.json`;
  for (let n = 2; existsSync(join(dir, file)); n += 1) file = `${base}-${n}.json`;
  const path = join(dir, file);
  writeFileSync(path, JSON.stringify(review, null, 2) + '\n');
  return { path, file, review };
}

// El texto que acompaña a la skill (los args de la herramienta Skill o el resto del prompt) puede
// pedir el scope. "global" explícito manda; si menciona una PR, es `pr` y se apunta su número.
export function scopeFromText(text) {
  if (typeof text !== 'string' || !text) return {};
  const num = text.match(/\b(?:PR|pull request)\s*#?\s*(\d+)\b/i);
  const pr = num ? Number(num[1]) : undefined;
  if (/\bglobal\b/i.test(text)) return { scope: 'global', pr };
  if (num || /\b(?:PR|pull request)\b/i.test(text)) return { scope: 'pr', pr };
  return {};
}

/**
 * Lo que llaman los hooks: registra si la skill revisa alguna zona y nunca lanza. El scope sale del
 * texto que la acompaña y, si no dice nada, de la rama.
 */
export function hookRecord({ root, skill, text } = {}) {
  try {
    if (typeof skill !== 'string' || !SKILL_ID_RE.test(skill)) return null;
    return record({ root, skill, ...scopeFromText(text) });
  } catch {
    return null;
  }
}

function readReviews(root) {
  const dir = join(root, ...REVIEWS_REL);
  if (!existsSync(dir)) return [];
  const out = [];
  for (const f of readdirSync(dir).sort()) {
    if (!f.endsWith('.json')) continue;
    try {
      const r = JSON.parse(readFileSync(join(dir, f), 'utf8'));
      if (r && typeof r.skill === 'string' && r.files && typeof r.files === 'object') out.push({ ...r, file: f });
    } catch { /* una revisión rota no tumba el cálculo */ }
  }
  return out;
}

// Detección de endpoints por patrones sencillos. Para otro stack basta con añadir un detector:
// `files` dice a qué rutas se aplica y `detect` devuelve [{ method, route, line }] de un fuente.
const lineAt = (src, index) => src.slice(0, index).split('\n').length;
function matchAll(re, src, fn) {
  const out = [];
  for (const m of src.matchAll(re)) { const e = fn(m); if (e) out.push({ ...e, line: lineAt(src, m.index) }); }
  return out;
}
function nextRoute(path) {
  const m = /(?:^|\/)app\//.exec(path);
  const start = m.index + m[0].length;
  const dir = path.lastIndexOf('/') >= start ? path.slice(start, path.lastIndexOf('/')) : '';
  const segs = dir.split('/').filter((s) => s && !/^\(.*\)$/.test(s) && !s.startsWith('@'));
  return `/${segs.join('/')}`;
}
export const ENDPOINT_DETECTORS = [
  {
    stack: 'fastapi', // @router.get("/x"), @app.post("/x"), @users_router.delete(...)
    files: /\.py$/,
    detect: (src) => matchAll(/^[ \t]*@(\w+)\.(get|post|put|patch|delete|options|head|websocket)\(\s*[rbuf]?(['"])(.*?)\3/gm, src,
      (m) => (/^(app|\w*router)$/i.test(m[1]) ? { method: m[2].toUpperCase(), route: m[4] } : null)),
  },
  {
    stack: 'express', // app.get('/x', ...), router.post("/x", ...); el `app.get('env')` de un argumento no cuenta
    files: /\.[cm]?[jt]sx?$/,
    detect: (src) => matchAll(/\b(app|\w*[rR]outer)\.(get|post|put|patch|delete|all|options|head)\(\s*(['"`])([^'"`]+)\3\s*,/g, src,
      (m) => ({ method: m[2].toUpperCase(), route: m[4] })),
  },
  {
    stack: 'next', // app/**/route.ts con export function GET / export const POST
    files: /(?:^|\/)app\/(?:.*\/)?route\.[cm]?[jt]sx?$/,
    detect: (src, path) => matchAll(/^[ \t]*export\s+(?:async\s+)?(?:function\s+|(?:const|let|var)\s+)(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\b/gm, src,
      (m) => ({ method: m[1], route: nextRoute(path) })),
  },
];
function detectEndpoints(path, src) {
  const out = [];
  for (const d of ENDPOINT_DETECTORS) {
    if (!d.files.test(path)) continue;
    for (const e of d.detect(src, path)) out.push({ method: e.method, route: e.route, file: path, line: e.line, stack: d.stack });
  }
  return out;
}
const endpointKey = (e) => `${e.method} ${e.route}`;
const mayHaveEndpoints = (path) => ENDPOINT_DETECTORS.some((d) => d.files.test(path));

// Archivos de peso además de los endpoints: tablas y migraciones, y auth. Sin cubrir ponen la zona
// en rojo. Igual que los endpoints, se amplía con un detector más: `kind` y `test(path, src)`, donde
// `src()` lee el fuente solo si hace falta. El primero que acierta da el tipo.
const TABLE_PATH = /(?:^|\/)(?:migrations|alembic\/versions)\/|(?:^|\/)prisma\/schema\.prisma$/;
// Auth por nombre de archivo o carpeta. La palabra tiene que empezar en un borde (inicio, signo o
// camelCase) para que `urls.py` no cuente como `rls`; estilos, docs e imágenes nunca son auth.
const AUTH_WORD = /(?:^|[^a-z])(?:o?auth|login|session|jwt|token|permission|rls|polic(?:y|ies))/;
const NOT_CODE = /\.(?:css|scss|sass|less|md|mdx|txt|rst|svg|png|jpe?g|gif|webp|ico)$/i;
export const WEIGHTY_DETECTORS = [
  {
    kind: 'table', // CREATE/ALTER TABLE en .sql, carpetas de migraciones, prisma y op.create_table de alembic
    test: (path, src) => TABLE_PATH.test(path)
      || (/\.sql$/i.test(path) && /\b(?:create|alter)\s+table\b/i.test(src()))
      || (/\.py$/.test(path) && /\bop\.create_table\s*\(/.test(src())),
  },
  {
    kind: 'auth',
    test: (path) => !NOT_CODE.test(path) && AUTH_WORD.test(path.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()),
  },
];
/** Tipo de peso de un archivo ('table' | 'auth') o null. `src` es una función que devuelve el fuente. */
export function weightyKind(path, src = () => '') {
  let cached;
  const read = () => (cached ??= String(src() ?? ''));
  return WEIGHTY_DETECTORS.find((d) => d.test(path, read))?.kind ?? null;
}

// Semana ISO 8601 en UTC: la semana es del año al que pertenece su jueves.
export function isoWeek(date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dow = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dow);
  const jan1 = Date.UTC(d.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - jan1) / DAY_MS + 1) / 7);
  return { label: `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`, monday: new Date(d.getTime() - 3 * DAY_MS) };
}

// Salud de una zona: la cobertura, con techo de 80 si la revisión ha caducado y de 40 si hay algo de
// peso sin cubrir (endpoint nuevo, tabla o auth). Una zona nunca revisada vale 0.
function zoneHealth({ reviewed, coverage, stale, weighty }) {
  if (!reviewed) return 0;
  let h = Math.round(coverage * 100);
  if (stale) h = Math.min(h, 80);
  if (weighty) h = Math.min(h, 40);
  return h;
}

// Última PR cubierta: el campo `pr` de las revisiones, los merge commits "Merge pull request #N from
// owner/rama" de una rama con revisiones y, si `gh` está disponible, las PR mergeadas desde esas ramas
// (cubre el squash merge, cuyo commit no dice la rama). Gana el número más alto.
function lastCoveredPr(root, reviews, { full, gh }) {
  const best = { number: 0, source: null };
  const offer = (n, source) => { if (Number.isInteger(n) && n > best.number) { best.number = n; best.source = source; } };
  for (const r of reviews) offer(r.pr, 'review');
  if (full) {
    const branches = new Set(reviews.map((r) => r.branch).filter(Boolean));
    for (const s of (git(root, ['log', '--merges', '-z', '--format=%s', 'HEAD']) || '').split('\0')) {
      const m = /^Merge pull request #(\d+) from [^/\s]+\/(\S+)/.exec(s);
      if (m && branches.has(m[2])) offer(Number(m[1]), 'merge');
    }
    if (gh && branches.size) {
      const r = spawnSync('gh', ['pr', 'list', '--state', 'merged', '--limit', '200', '--json', 'number,headRefName'], {
        cwd: root, encoding: 'utf8', windowsHide: true, timeout: 5000,
      });
      if (r.status === 0) {
        try { for (const p of JSON.parse(r.stdout)) if (branches.has(p.headRefName)) offer(p.number, 'gh'); } catch { /* gh raro: se ignora */ }
      }
    }
  }
  return best.source ? { number: best.number, source: best.source } : null;
}

function writeHistory(root, now, health) {
  const file = join(root, ...HISTORY_REL);
  let weeks = [];
  try { const old = JSON.parse(readFileSync(file, 'utf8')); if (Array.isArray(old)) weeks = old; } catch { /* sin historia aún */ }
  const { label, monday } = isoWeek(now);
  const until = new Date(monday.getTime() + 7 * DAY_MS);
  const count = git(root, ['rev-list', '--count', `--since=${monday.toISOString()}`, `--until=${until.toISOString()}`, 'HEAD']);
  const entry = { week: label, health, commits: Number(count) || 0 };
  weeks = weeks.filter((w) => w && w.week !== label).concat(entry).sort((a, b) => (a.week < b.week ? -1 : 1));
  writeFileSync(file, JSON.stringify(weeks, null, 2) + '\n');
}

// Rojo = lo que pesa: algo de peso sin cubrir o menos de la mitad cubierta. Ámbar = cobertura
// incompleta o fuera de cadencia. Un CSS cambiado nunca pasa de ámbar por sí solo.
function colorOf({ reviewed, total, coverage, ageDays, cadenceDays, weighty }) {
  if (!reviewed) return 'never';
  if (weighty) return 'red';
  if (total === 0) return 'green';
  if (coverage < RED_BELOW) return 'red';
  if (coverage < GREEN_FROM) return 'amber';
  if (ageDays === null || (cadenceDays && ageDays > cadenceDays)) return 'amber';
  return 'green';
}

/**
 * Calcula el estado de cada zona y lo escribe en .rsc/overview/state.json. Devuelve el estado o
 * null si el proyecto no tiene overview.json. `fast` es el modo para el aviso de sesión.
 */
export function scan({ root = process.cwd(), fast = false, gh = true, now = new Date() } = {}) {
  root = resolve(root);
  const cfg = readConfig(root);
  if (!cfg) return null;
  const reviews = readReviews(root);
  const blobs = currentFiles(root);
  const full = !fast;

  // Endpoints de un archivo hoy (árbol de trabajo) y en una versión revisada (por blob sha). Caché
  // porque un archivo puede caer en varias zonas.
  const nowCache = new Map();
  const blobCache = new Map();
  const endpointsNow = (p) => {
    if (!nowCache.has(p)) {
      let src = '';
      try { src = readFileSync(join(root, p), 'utf8'); } catch { /* ilegible: sin endpoints */ }
      nowCache.set(p, detectEndpoints(p, src));
    }
    return nowCache.get(p);
  };
  const keysInBlob = (p, sha) => {
    const k = `${p}\0${sha}`;
    if (!blobCache.has(k)) blobCache.set(k, new Set(detectEndpoints(p, git(root, ['cat-file', 'blob', sha]) || '').map(endpointKey)));
    return blobCache.get(k);
  };

  const zones = cfg.zones.map((z) => {
    const skills = Array.isArray(z.reviewSkills) ? z.reviewSkills : [];
    const match = zoneMatcher(z);
    const mine = reviews.filter((r) => skills.includes(r.skill) && (!Array.isArray(r.zones) || r.zones.includes(z.id)));
    const paths = [...blobs.keys()].filter(match).sort();
    const uncovered = [];
    let covered = 0;
    let last = null;
    for (const p of paths) {
      const hits = mine.filter((r) => r.files[p] === blobs.get(p));
      if (!hits.length) { uncovered.push(p); continue; }
      covered += 1;
      for (const r of hits) if (!last || r.at > last) last = r.at;
    }

    // Endpoint nuevo sin cubrir: está en un archivo sin cubrir y no estaba en ninguna versión de ese
    // archivo que se revisara. Cambiar el cuerpo de una ruta ya revisada no la hace "nueva".
    const uncoveredEndpoints = [];
    if (full && mine.length) {
      for (const p of uncovered) {
        if (!mayHaveEndpoints(p)) continue;
        const seen = new Set();
        for (const r of mine) if (typeof r.files[p] === 'string') for (const k of keysInBlob(p, r.files[p])) seen.add(k);
        for (const e of endpointsNow(p)) if (!seen.has(endpointKey(e))) uncoveredEndpoints.push(e);
      }
    }

    // Tablas, migraciones y auth sin cubrir: por la ruta y, para .sql y alembic, por el contenido de
    // hoy. Barato (solo archivos sin cubrir), así que también corre en --fast.
    const uncoveredWeighty = [];
    for (const p of uncovered) {
      const kind = weightyKind(p, () => { try { return readFileSync(join(root, p), 'utf8'); } catch { return ''; } });
      if (kind) uncoveredWeighty.push({ kind, file: p });
    }

    const total = paths.length;
    const coverage = total ? covered / total : 1;
    const ageDays = last ? Math.floor((now.getTime() - Date.parse(last)) / DAY_MS) : null;
    const cadenceDays = Number(z.cadenceDays) || null;
    const reviewed = mine.length > 0;
    const weighty = uncoveredEndpoints.length > 0 || uncoveredWeighty.length > 0;
    const stale = ageDays === null || Boolean(cadenceDays && ageDays > cadenceDays);

    const lastBySkill = new Map(skills.map((s) => [s, null]));
    for (const r of mine) if (!lastBySkill.get(r.skill) || r.at > lastBySkill.get(r.skill)) lastBySkill.set(r.skill, r.at);
    // Skill recomendada: la primera que nunca se lanzó en esta zona y, si todas se lanzaron, la de
    // revisión más antigua.
    const order = [...lastBySkill];
    const neverRun = order.find(([, at]) => at === null);
    const oldest = order.reduce((best, cur) => (!best || cur[1] < best[1] ? cur : best), null);
    const recommendedSkill = (neverRun || oldest || [null])[0];

    const reviewHistory = [...mine].sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0)).map((r) => ({
      skill: r.skill,
      at: r.at,
      branch: r.branch ?? null,
      scope: r.scope ?? null,
      pr: Number.isInteger(r.pr) ? r.pr : null,
      file: r.file,
      coveredNow: paths.filter((p) => r.files[p] === blobs.get(p)).length,
    }));

    return {
      id: z.id,
      label: z.label ?? z.id,
      reviewSkills: skills,
      cadenceDays,
      checks: Array.isArray(z.checks) ? z.checks : [],
      files: total,
      covered,
      coverage,
      uncovered,
      uncoveredEndpoints,
      uncoveredWeighty,
      lastReviewAt: last,
      ageDays,
      reviews: mine.length,
      reviewHistory,
      recommendedSkill,
      health: zoneHealth({ reviewed, coverage, stale: reviewed && stale, weighty }),
      color: colorOf({ reviewed, total, coverage, ageDays, cadenceDays, weighty }),
    };
  });

  const weight = (z) => Math.max(z.files, 1);
  const weightSum = zones.reduce((n, z) => n + weight(z), 0);
  const health = weightSum ? Math.round(zones.reduce((n, z) => n + z.health * weight(z), 0) / weightSum) : 100;
  const questions = Array.isArray(cfg.questions) ? cfg.questions : [];
  const kpis = {
    health,
    zonesNeedingReview: zones.filter((z) => z.color !== 'green').map((z) => z.id),
    uncoveredFiles: new Set(zones.flatMap((z) => z.uncovered)).size,
    uncoveredEndpoints: new Set(zones.flatMap((z) => z.uncoveredEndpoints.map((e) => `${e.file}\0${endpointKey(e)}`))).size,
    openQuestions: questions.filter((q) => q && q.state === 'open').length,
    lastCoveredPr: lastCoveredPr(root, reviews, { full, gh }),
  };

  const state = {
    version: 1,
    generatedAt: now.toISOString(),
    fast: Boolean(fast),
    branch: (git(root, ['rev-parse', '--abbrev-ref', 'HEAD']) || '').trim() || null,
    commit: (git(root, ['rev-parse', 'HEAD']) || '').trim() || null,
    reviews: reviews.length,
    kpis,
    zones,
  };
  // El rápido no escribe nada: corre en el Worker del arranque, que puede cortarlo a medias, y su
  // estado (sin endpoints) no debe acabar en el dashboard.
  if (full) {
    const out = join(root, ...STATE_REL);
    mkdirSync(join(out, '..'), { recursive: true });
    writeFileSync(out, JSON.stringify(state, null, 2) + '\n');
    writeHistory(root, now, health);
  }
  return state;
}

// ─── Dashboard: render / show ─────────────────────────────────────────────────────────────────────
//
//   node overview.mjs render [--no-gh] [--root <dir>]              // usa state.json; si falta, hace scan
//   node overview.mjs show   [--no-gh] [--no-open] [--root <dir>]  // scan completo + render + abrir
//
// Escribe .rsc/overview/overview.html: un único HTML estático (abre con file://), con el estado
// incrustado en <script type="application/json" id="overview-state">, CSS y SVG en línea y sin
// librerías. Todo texto que viene del JSON pasa por esc() en el HTML y por scriptJson() dentro del
// <script>, así que un path con `</script>` no puede cerrar la etiqueta. El detalle de cada zona es
// un <aside id="zone=<id>"> que se abre con :target (funciona sin JS); el JS solo añade Escape y
// el foco.
const HTML_REL = ['.rsc', 'overview', 'overview.html'];

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const scriptJson = (v) => JSON.stringify(v)
  .replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026')
  .replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
const readJson = (p) => { try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return null; } };

const TONE = { red: 'bad', amber: 'mid', green: 'ok', never: 'never' };
const TONE_LABEL = { red: 'pide revisión', amber: 'se va alejando', green: 'al día', never: 'nunca revisado' };
const URGENCY = { red: 4, never: 3, amber: 2, green: 1 };
const BAR_FILL = { ok: '#8fd1a8', mid: '#efc27c', bad: '#f0a49b', never: '#d8d5ce' };
const TONE_COLOR = { ok: 'green', mid: 'amber', bad: 'red', never: 'never' };
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

const tone = (z) => TONE[z.color] || 'never';
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const agoLong = (d) => (d === null || d === undefined ? '—' : d <= 0 ? 'hoy' : d === 1 ? 'ayer' : `hace ${d} días`);
const agoShort = (d) => (d === null || d === undefined ? '—' : d <= 0 ? 'hoy' : d === 1 ? 'ayer' : `${d} d`);
function fmtDate(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? String(iso ?? '') : `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

// Lo que dice cada cuadrado: el dato que más pesa en su color, corto en 1×1 y con contexto en 2×2.
function squareText(z, big) {
  const files = z.files || 0;
  const unc = (z.uncovered || []).length;
  const eps = (z.uncoveredEndpoints || []).length;
  const heavy = (z.uncoveredWeighty || []).length;
  const pct = Math.round((z.coverage ?? 0) * 100);
  const lastSkill = z.reviewHistory?.[0]?.skill || null;
  const skAge = `${z.recommendedSkill || lastSkill} · ${agoLong(z.ageDays)}`;
  if (z.color === 'never') {
    return { when: 'nunca', meta: files ? `${plural(files, 'archivo', 'archivos')} sin revisar` : 'sin archivos todavía', sk: z.recommendedSkill };
  }
  if (eps) {
    return big
      ? { when: `${eps} sin revisar`, meta: `${eps === 1 ? 'endpoint nuevo' : 'endpoints nuevos'} · ${plural(files, 'archivo', 'archivos')} en la zona`, sk: skAge }
      : { when: plural(eps, 'ruta', 'rutas'), meta: eps === 1 ? 'nueva sin revisar' : 'nuevas sin revisar', sk: z.recommendedSkill };
  }
  if (heavy) {
    const kinds = [...new Set(z.uncoveredWeighty.map((w) => WEIGHTY_LABEL[w.kind] || w.kind))].join(', ');
    return big
      ? { when: `${heavy} sin revisar`, meta: `de peso (${kinds}) · ${plural(files, 'archivo', 'archivos')} en la zona`, sk: skAge }
      : { when: plural(heavy, 'archivo', 'archivos'), meta: `de peso sin revisar`, sk: z.recommendedSkill };
  }
  if (unc && z.color !== 'green') {
    return big
      ? { when: `${unc} sin cubrir`, meta: `de ${plural(files, 'archivo', 'archivos')} · ${pct} % cubierto`, sk: skAge }
      : { when: `${z.covered}/${files}`, meta: 'archivos cubiertos', sk: z.recommendedSkill };
  }
  if (z.color === 'amber') {
    return { when: big ? agoLong(z.ageDays) : agoShort(z.ageDays), meta: z.cadenceDays ? `toca cada ${z.cadenceDays} d` : 'sin revisión vigente', sk: z.recommendedSkill };
  }
  return {
    when: big ? agoLong(z.ageDays) : agoShort(z.ageDays),
    meta: files ? `${plural(files, 'archivo', 'archivos')} al día` : 'sin archivos',
    sk: lastSkill,
  };
}

// 2×2 por peso (urgencia × archivos): uno por cada 5 zonas, entre 1 y 3. El resto, por urgencia.
function layoutZones(zones) {
  const weight = (z) => (URGENCY[z.color] || 1) * Math.max(z.files || 0, 1);
  const nBig = zones.length ? Math.min(3, Math.max(1, Math.floor(zones.length / 5))) : 0;
  const ranked = zones.map((z, i) => ({ z, i })).sort((a, b) => weight(b.z) - weight(a.z) || a.i - b.i);
  const big = new Set(ranked.slice(0, nBig).map((r) => r.z.id));
  const rest = zones.map((z, i) => ({ z, i })).filter((r) => !big.has(r.z.id))
    .sort((a, b) => (URGENCY[b.z.color] || 0) - (URGENCY[a.z.color] || 0) || a.i - b.i);
  return [...ranked.slice(0, nBig).map((r) => ({ z: r.z, big: true })), ...rest.map((r) => ({ z: r.z, big: false }))];
}

function squareHtml({ z, big }) {
  const t = squareText(z, big);
  const label = `${z.label}: ${TONE_LABEL[z.color] || ''}. ${t.when}, ${t.meta}. Abrir detalle`;
  return `<a class="sq${big ? ' x2' : ''} ${tone(z)}" href="#zone=${esc(z.id)}" data-zone="${esc(z.id)}" aria-label="${esc(label)}">`
    + `<span class="n">${esc(z.label)}</span><span class="b"><span class="when">${esc(t.when)}</span>`
    + `<span class="meta">${esc(t.meta)}</span>${big && t.sk ? `<span class="sk">${esc(t.sk)}</span>` : ''}</span></a>`;
}

function kpisHtml(state, history) {
  const k = state.kpis || {};
  const weeks = Array.isArray(history) ? history : [];
  const prev = weeks.length > 1 ? weeks[weeks.length - 2] : null;
  let trend = '';
  if (prev && Number.isFinite(prev.health) && prev.health !== k.health) {
    const up = k.health > prev.health;
    trend = ` <span class="tr ${up ? 'up' : 'down'}" title="${esc(`semana anterior: ${prev.health}`)}">${up ? '↑' : '↓'}</span>`;
  }
  const need = (k.zonesNeedingReview || []).length;
  const eps = k.uncoveredEndpoints || 0;
  const pr = k.lastCoveredPr && Number.isInteger(k.lastCoveredPr.number) ? `PR #${k.lastCoveredPr.number}` : '—';
  const card = (id, title, value, extra = '', cls = '') => `<div class="kpi" data-kpi="${id}"><small>${title}</small><b${cls ? ` class="${cls}"` : ''}>${esc(value)}${extra}</b></div>`;
  return '<section class="top" aria-label="Indicadores">'
    + card('health', 'Salud global', k.health ?? '—', `${trend}<span class="of">/100</span>`)
    + card('zones', 'Zonas que piden revisión', need, '', need ? 'warn' : '')
    + card('uncovered', 'Archivos sin cubrir', k.uncoveredFiles ?? 0, eps ? `<span class="of">· ${esc(plural(eps, 'endpoint', 'endpoints'))}</span>` : '')
    + card('questions', 'Preguntas abiertas', k.openQuestions ?? 0)
    + card('pr', 'Revisado hasta', pr, '', 'mono')
    + '</section>';
}

// Salud y commits por semana. Son dos medidas con escalas distintas: van en dos bandas con el mismo
// eje de semanas (línea arriba, barras abajo), nunca con dos ejes sobre la misma área. El SVG no
// lleva viewBox: cada semana es una columna en % y sus marcas van en px dentro de un <svg> centrado,
// así el texto mide lo mismo a cualquier ancho.
function healthChart(history) {
  const weeks = (Array.isArray(history) ? history : []).filter((w) => w && w.week).slice(-8);
  if (!weeks.length) return '<p class="empty">Aún no hay historia: cada scan completo guarda una foto por semana.</p>';
  const H = 140; const top = 14; const mid = 66; const base = 118; const band = 32; const bw = 22; const r = 3;
  const off = 8 - weeks.length; const slot = 12.5;
  const hy = (h) => mid - (Math.max(0, Math.min(100, Number(h) || 0)) / 100) * (mid - top);
  const maxC = Math.max(1, ...weeks.map((w) => Number(w.commits) || 0));
  const bar = (c) => {
    const h = (c / maxC) * band; const x0 = -bw / 2;
    if (h < r + 0.5) return `<rect x="${x0}" y="${base - Math.max(h, 1.5)}" width="${bw}" height="${Math.max(h, 1.5)}" fill="#dedad1"/>`;
    const y = (base - h).toFixed(1); const yr = (base - h + r).toFixed(1);
    return `<path d="M${x0} ${base}V${yr}Q${x0} ${y} ${x0 + r} ${y}H${-x0 - r}Q${-x0} ${y} ${-x0} ${yr}V${base}Z" fill="#dedad1"/>`;
  };
  const last = weeks.length - 1;
  const wk = (w) => String(w.week).replace(/^\d{4}-/, '');
  const col = (w, i) => {
    const y = hy(w.health);
    const next = weeks[i + 1];
    const c = Number(w.commits) || 0;
    return `<svg x="${(off + i) * slot}%" width="${slot}%" height="${H}" overflow="visible">`
      + (next ? `<line x1="50%" x2="150%" y1="${y.toFixed(1)}" y2="${hy(next.health).toFixed(1)}" stroke="#1f7a45" stroke-width="2" stroke-linecap="round"/>` : '')
      + `<svg x="50%" width="1" height="${H}" overflow="visible">${bar(c)}`
      + `<circle cx="0" cy="${y.toFixed(1)}" r="${i === last ? 4 : 2.5}" fill="#1f7a45" stroke="#fff" stroke-width="${i === last ? 2 : 1}"/>`
      + (i === last ? `<text class="val" x="-9" y="${(y - 8).toFixed(1)}" text-anchor="end">${esc(w.health)}</text>` : '')
      + `<text class="wk" x="0" y="${H - 3}" text-anchor="middle">${esc(wk(w))}</text></svg>`
      + `<rect class="hit" width="100%" height="${H}"><title>${esc(`${w.week} · salud ${w.health} · ${plural(c, 'commit', 'commits')}`)}</title></rect></svg>`;
  };
  return `<svg class="chart" width="100%" height="${H}" role="img" aria-label="${esc(`Salud global y commits de las últimas ${plural(weeks.length, 'semana', 'semanas')}`)}">`
    + `<g class="axis"><line x1="0" x2="100%" y1="${top}" y2="${top}"/><line x1="0" x2="100%" y1="${mid}" y2="${mid}"/><line x1="0" x2="100%" y1="${base}" y2="${base}"/></g>`
    + `<g class="tick"><text x="0" y="${top - 4}">100</text><text x="0" y="${mid - 4}">0</text><text x="0" y="${base - band - 4}">${esc(maxC)}</text></g>`
    + weeks.map(col).join('')
    + '</svg>'
    + '<p class="key"><span><i class="ln"></i>salud (0–100)</span><span><i class="br"></i>commits por semana</span></p>';
}

// Revisiones lanzadas este mes por skill. Sale cada skill lanzada este mes y las recomendadas de
// zonas que piden revisión (aunque vayan a 0). El color es el peor estado de las zonas que revisa.
function reviewsChart(state) {
  const month = String(state.generatedAt || new Date().toISOString()).slice(0, 7);
  const zones = state.zones || [];
  const seen = new Set(); const count = new Map();
  for (const z of zones) {
    for (const r of z.reviewHistory || []) {
      const key = r.file || `${r.skill}\0${r.at}`;
      if (seen.has(key)) continue;
      seen.add(key);
      if (String(r.at || '').slice(0, 7) === month) count.set(r.skill, (count.get(r.skill) || 0) + 1);
    }
  }
  for (const z of zones) if (z.color !== 'green' && z.recommendedSkill && !count.has(z.recommendedSkill)) count.set(z.recommendedSkill, 0);
  const worst = (skill) => {
    const zs = zones.filter((z) => (z.reviewSkills || []).includes(skill));
    const z = zs.sort((a, b) => (URGENCY[b.color] || 0) - (URGENCY[a.color] || 0))[0];
    return z ? tone(z) : 'never';
  };
  const rows = [...count].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
  if (!rows.length) return '<p class="empty">Ninguna revisión este mes.</p>';
  const shown = rows.slice(0, 7); const more = rows.length - shown.length;
  const x0 = 116; const rh = 24;
  const max = Math.max(1, ...shown.map(([, n]) => n));
  const H = shown.length * rh;
  const label = (s) => (s.length > 18 ? `${s.slice(0, 17)}…` : s);
  // Sin viewBox: etiquetas en px fijos y la barra en % del ancho (como mucho la mitad del total).
  return `<svg class="chart" width="100%" height="${H}" role="img" aria-label="Revisiones lanzadas este mes por skill">`
    + shown.map(([skill, n], i) => {
      const y = i * rh; const pct = ((n / max) * 50).toFixed(1); const t = worst(skill);
      return `<g><text x="0" y="${y + 16}">${esc(label(skill))}</text>`
        + `<svg x="${x0}" y="${y}" width="100%" height="${rh}" overflow="visible">`
        + (n ? `<rect y="6" width="${pct}%" height="12" rx="3" fill="${BAR_FILL[t]}"/>` : '')
        + `<text class="num" x="${pct}%" y="16" transform="translate(${n ? 6 : 0} 0)">${n}</text></svg>`
        + `<rect class="hit" y="${y}" width="100%" height="${rh}"><title>${esc(`${skill}: ${plural(n, 'revisión', 'revisiones')} este mes · zonas: ${TONE_LABEL[TONE_COLOR[t]]}`)}</title></rect></g>`;
    }).join('')
    + `</svg>${more > 0 ? `<p class="key">y ${plural(more, 'skill más', 'skills más')}</p>` : ''}`
    + '<p class="key">color: el peor estado de las zonas que revisa</p>';
}

const CHECK_STATUS = {
  pass: ['ok', 'bien'], ok: ['ok', 'bien'], done: ['ok', 'bien'], fail: ['bad', 'falla'],
  warn: ['mid', 'a medias'], partial: ['mid', 'a medias'], na: ['never', 'no aplica'],
};
const LIST_CAP = 40;
const WEIGHTY_LABEL = { table: 'tabla o migración', auth: 'auth' };

function detailHtml(z) {
  const t = tone(z);
  const files = z.files || 0;
  const unc = z.uncovered || [];
  const eps = z.uncoveredEndpoints || [];
  const heavy = z.uncoveredWeighty || [];
  const checks = z.checks || [];
  const hist = z.reviewHistory || [];
  const others = (z.reviewSkills || []).filter((s) => s !== z.recommendedSkill);
  const capped = (items, fn) => items.slice(0, LIST_CAP).map(fn).join('')
    + (items.length > LIST_CAP ? `<li class="more">y ${items.length - LIST_CAP} más</li>` : '');
  const section = (title, n, body) => `<section><h3>${title}${n ? ` <span class="c">${n}</span>` : ''}</h3>${body}</section>`;
  const rec = z.recommendedSkill
    ? `<section class="rec"><h3>Skill recomendada</h3><p><code>/${esc(z.recommendedSkill)}</code>${others.length ? `<span class="also">también la revisa${others.length > 1 ? 'n' : ''}: ${others.map((s) => `<code>${esc(s)}</code>`).join(' ')}</span>` : ''}</p></section>`
    : '';
  const age = z.lastReviewAt ? `${agoLong(z.ageDays)}${z.cadenceDays ? ` · cada ${z.cadenceDays} d` : ''}` : 'nunca';
  const zid = esc(z.id);
  return `<aside class="detail" id="zone=${zid}" data-zone="${zid}" role="dialog" aria-labelledby="t-${zid}" tabindex="-1">`
    + `<header><div><span class="pill ${t}">${esc(TONE_LABEL[z.color] || z.color)}</span><h2 id="t-${zid}">${esc(z.label)}</h2></div>`
    + '<a class="close" href="#" aria-label="Cerrar detalle">×</a></header>'
    + `<dl class="facts"><div><dt>Cubiertos hoy</dt><dd>${esc(`${z.covered ?? 0} de ${files}`)}</dd></div>`
    + `<div><dt>Última revisión</dt><dd>${esc(age)}</dd></div><div><dt>Salud</dt><dd>${esc(z.health ?? '—')}</dd></div></dl>`
    + rec
    + (eps.length ? section('Endpoints nuevos sin cubrir', eps.length, `<ul class="list">${capped(eps, (e) => `<li><b class="m">${esc(e.method)}</b> <code>${esc(e.route)}</code><span class="p">${esc(`${e.file}:${e.line}`)}</span></li>`)}</ul>`) : '')
    + (heavy.length ? section('De peso sin cubrir', heavy.length, `<ul class="list">${capped(heavy, (w) => `<li><b class="m">${esc(WEIGHTY_LABEL[w.kind] || w.kind)}</b> <span class="p">${esc(w.file)}</span></li>`)}</ul>`) : '')
    + section('Archivos sin cubrir', unc.length, unc.length
      ? `<ul class="list">${capped(unc, (p) => `<li><span class="p">${esc(p)}</span></li>`)}</ul>`
      : `<p class="empty">${files ? 'Todos revisados con el contenido que tienen hoy.' : 'La zona no tiene archivos todavía.'}</p>`)
    + section('Comprobaciones', checks.length, checks.length
      ? `<ul class="checks">${checks.map((c) => {
        const [ct, cl] = CHECK_STATUS[c.status] || ['never', c.status ? String(c.status) : 'sin comprobar'];
        const sub = [c.skill, c.note].filter(Boolean).join(' · ');
        return `<li><i class="dot ${ct}"></i><span>${esc(c.label || c.id)}${sub ? `<small>${esc(sub)}</small>` : ''}</span><em class="${ct}">${esc(cl)}</em></li>`;
      }).join('')}</ul>`
      : '<p class="empty">Sin comprobaciones registradas: las rellena <code>overview scan</code>.</p>')
    + section('Historial de revisiones', hist.length, hist.length
      ? `<ol class="hist">${capped(hist, (r) => {
        const bits = [fmtDate(r.at), r.scope === 'global' ? 'global' : 'de rama', r.pr ? `PR #${r.pr}` : null, r.branch ? `rama ${r.branch}` : null].filter(Boolean);
        return `<li><code>${esc(r.skill)}</code><span>${esc(bits.join(' · '))}</span><small>${esc(`cubre hoy ${plural(r.coveredNow ?? 0, 'archivo', 'archivos')}`)}</small></li>`;
      })}</ol>`
      : '<p class="empty">Nadie ha revisado esta zona todavía.</p>')
    + '</aside>';
}

const DASHBOARD_CSS = `
:root{--bg:#f6f5f2;--card:#fff;--line:#e6e3dc;--ink:#1d1d1f;--ink2:#6b6a66;--ink3:#8a8780;
--ok:#dff3e6;--ok-ink:#1f7a45;--mid:#fdf0d5;--mid-ink:#a5670a;--bad:#fbe0dc;--bad-ink:#b3372c;--never-line:#c9c6be}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--ink);font:13px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;-webkit-font-smoothing:antialiased}
code,.mono,.p{font-family:ui-monospace,"Cascadia Mono",Menlo,Consolas,monospace}
.page{max-width:1120px;margin:0 auto;padding:24px 16px 40px}
.head{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:4px 16px;margin-bottom:16px}
.head h1{margin:0;font-size:17px;font-weight:650;letter-spacing:-.01em}
.head h1 span{color:var(--ink3);font-weight:500}
.head p{margin:0;color:var(--ink2);font-size:12px}
.top{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px}
.kpi{flex:1 1 140px;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:10px 12px;min-width:0}
.kpi small{color:var(--ink2);font-size:11.5px}
.kpi b{display:block;font-size:22px;font-weight:650;margin-top:2px;font-variant-numeric:tabular-nums;white-space:nowrap}
.kpi b.warn{color:var(--bad-ink)}
.kpi b.mono{font-size:18px;line-height:30px}
.kpi .of{font-size:12px;font-weight:500;color:var(--ink3);margin-left:4px}
.tr{font-size:13px;margin-left:4px}.tr.up{color:var(--ok-ink)}.tr.down{color:var(--bad-ink)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(104px,1fr));grid-auto-flow:dense;gap:8px}
.sq{aspect-ratio:1/1;min-width:0;border-radius:12px;padding:10px;display:flex;flex-direction:column;justify-content:space-between;
border:1px solid #0000000d;color:inherit;text-decoration:none;overflow:hidden;
transition-property:box-shadow,scale;transition-duration:150ms;transition-timing-function:cubic-bezier(0.2,0,0,1)}
.sq:hover{box-shadow:0 1px 2px #0000000d,0 4px 14px #00000012}
.sq:active{scale:.96}
.sq:focus-visible,.sq[aria-current]{outline:2px solid var(--ink);outline-offset:2px}
.sq.x2{grid-column:span 2;grid-row:span 2;padding:14px}
.sq .n{font-weight:650;font-size:12px;line-height:1.2;hyphens:auto;overflow-wrap:break-word;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.sq.x2 .n{font-size:17px}
.sq .b{display:flex;flex-direction:column;gap:2px;min-width:0}
.sq .when{font-size:18px;font-weight:700;line-height:1.15;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
.sq.x2 .when{font-size:28px;letter-spacing:-.01em}
.sq .meta{font-size:11px;color:#00000099;line-height:1.3}
.sq.x2 .meta{font-size:12px}
.sq .sk{font-family:ui-monospace,"Cascadia Mono",Menlo,Consolas,monospace;font-size:10.5px;color:#00000080;margin-top:2px;overflow-wrap:anywhere}
.ok{background:var(--ok)}.ok .when{color:var(--ok-ink)}
.mid{background:var(--mid)}.mid .when{color:var(--mid-ink)}
.bad{background:var(--bad)}.bad .when{color:var(--bad-ink)}
.sq.never{background:var(--card);border:1.5px dashed var(--never-line)}.never .when{color:var(--ink3)}
.legend{display:flex;gap:6px 14px;margin-top:10px;font-size:11.5px;color:var(--ink2);flex-wrap:wrap}
.legend i{display:inline-block;width:11px;height:11px;border-radius:3px;margin-right:5px;vertical-align:-1px}
.legend .never{background:var(--card);border:1.5px dashed var(--never-line)}
.charts{display:grid;grid-template-columns:2fr 1fr;gap:10px;margin-top:16px}
.panel{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px 14px;min-width:0}
.panel h4{margin:0 0 8px;font-size:12px;color:var(--ink2);font-weight:600}
.chart{display:block;width:100%;overflow:visible}
.chart text{font-size:11.5px;fill:#55544f}
.chart .tick text,.chart .wk{fill:var(--ink3);font-size:10.5px;font-variant-numeric:tabular-nums}
.chart .axis line{stroke:#eeebe5;stroke-width:1}
.chart .val{font-weight:650;fill:var(--ink);font-size:12px;font-variant-numeric:tabular-nums}
.chart .num{fill:var(--ink2);font-variant-numeric:tabular-nums}
.chart .hit{fill:transparent}.chart .hit:hover{fill:#0000000a}
.key{display:flex;gap:4px 14px;flex-wrap:wrap;margin:6px 0 0;font-size:11px;color:var(--ink3)}
.key i{display:inline-block;vertical-align:middle;margin-right:5px}
.key .ln{width:14px;height:2px;border-radius:1px;background:var(--ok-ink)}
.key .br{width:9px;height:10px;border-radius:2px 2px 0 0;background:#dedad1}
.empty{color:var(--ink3);margin:6px 0}
.foot{margin-top:18px;color:var(--ink3);font-size:11.5px}
.detail{display:none;position:fixed;top:0;right:0;bottom:0;z-index:2;width:min(460px,100%);overflow:auto;overscroll-behavior:contain;
background:var(--card);padding:18px 20px 28px;box-shadow:0 0 0 1px #0000000f,0 12px 40px #00000024;outline:none}
.detail:target{display:block;animation:slide-in 220ms cubic-bezier(0.2,0,0,1)}
@keyframes slide-in{from{opacity:0;transform:translateX(16px)}}
.scrim{display:none;position:fixed;inset:0;z-index:1;background:#1d1d1f29}
.detail:target ~ .scrim{display:block}
.detail header{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:14px}
.detail h2{margin:6px 0 0;font-size:20px;font-weight:650;letter-spacing:-.01em;line-height:1.2}
.close{flex:none;display:grid;place-items:center;width:36px;height:36px;margin:-6px -8px 0 0;border-radius:10px;color:var(--ink2);font-size:22px;line-height:1;text-decoration:none}
.close:hover{background:#0000000a;color:var(--ink)}.close:focus-visible{outline:2px solid var(--ink)}
.pill{display:inline-block;font-size:11px;font-weight:600;padding:2px 8px;border-radius:999px}
.pill.ok{color:var(--ok-ink)}.pill.mid{color:var(--mid-ink)}.pill.bad{color:var(--bad-ink)}
.pill.never{color:var(--ink2);background:var(--card);border:1.5px dashed var(--never-line)}
.facts{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:0 0 16px}
.facts div{background:var(--bg);border-radius:10px;padding:8px 10px;min-width:0}
.facts dt{font-size:11px;color:var(--ink2)}.facts dd{margin:2px 0 0;font-weight:600;font-variant-numeric:tabular-nums}
.detail section{margin-top:16px}
.detail h3{margin:0 0 6px;font-size:12px;font-weight:600;color:var(--ink2)}
.detail h3 .c{display:inline-block;min-width:18px;padding:0 5px;border-radius:999px;background:var(--bg);color:var(--ink);text-align:center;font-variant-numeric:tabular-nums}
.rec{background:var(--bg);border-radius:12px;padding:10px 12px}
.rec p{margin:0;display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 10px}
.rec p>code{font-size:14px;font-weight:600}
.also{color:var(--ink2);font-size:12px}
.list,.checks,.hist{list-style:none;margin:0;padding:0}
.list li{padding:5px 0;border-top:1px solid #f0eee9;overflow-wrap:anywhere}
.list li:first-child,.checks li:first-child,.hist li:first-child{border-top:0}
.list .m{font-size:11px;margin-right:2px}
.list li code+.p{display:block;color:var(--ink2);font-size:11.5px}
.list .p{font-size:12px}
.more{color:var(--ink3)}
.checks li{display:grid;grid-template-columns:auto 1fr auto;gap:8px;align-items:baseline;padding:6px 0;border-top:1px solid #f0eee9}
.checks small{display:block;color:var(--ink2);font-size:11.5px}
.checks em{font-style:normal;font-size:11.5px;font-weight:600;background:none}
em.ok{color:var(--ok-ink)}em.mid{color:var(--mid-ink)}em.bad{color:var(--bad-ink)}em.never{color:var(--ink3)}
.dot{width:8px;height:8px;border-radius:50%;display:inline-block}
.dot.ok{background:var(--ok-ink)}.dot.mid{background:var(--mid-ink)}.dot.bad{background:var(--bad-ink)}.dot.never{background:var(--never-line)}
.hist li{display:grid;grid-template-columns:auto 1fr;gap:0 10px;padding:6px 0;border-top:1px solid #f0eee9}
.hist span{color:var(--ink2);font-size:12px}
.hist small{grid-column:2;color:var(--ink3);font-size:11.5px}
@media (max-width:720px){.charts{grid-template-columns:1fr}}
@media (max-width:560px){
.page{padding:16px 16px 32px}
.kpi{flex-basis:calc(50% - 5px)}
.detail{top:auto;width:100%;max-height:86vh;border-radius:16px 16px 0 0;padding:16px 16px 28px}
@keyframes slide-in{from{opacity:0;transform:translateY(24px)}}
}
@media (prefers-reduced-motion:reduce){.detail:target{animation:none}.sq{transition:none}}
@media (forced-colors:active){.sq{border:1px solid CanvasText}}
`;

// Cerrar con Escape, devolver el foco al cuadrado y marcarlo. Sin JS, :target ya abre y cierra.
const DASHBOARD_JS = `(()=>{
const byId=(id)=>{try{return document.getElementById(decodeURIComponent(id))}catch{return null}};
let opener=null;
const sync=()=>{
  const el=byId(location.hash.slice(1));
  const open=el&&el.classList.contains('detail')?el:null;
  document.querySelectorAll('.sq[aria-current]').forEach((a)=>a.removeAttribute('aria-current'));
  if(open){
    const sq=[...document.querySelectorAll('.sq')].find((a)=>a.dataset.zone===open.dataset.zone);
    if(sq){sq.setAttribute('aria-current','true');opener=sq}
    open.focus({preventScroll:true});
  }else if(opener){opener.focus({preventScroll:true});opener=null}
};
addEventListener('hashchange',sync);
addEventListener('keydown',(e)=>{if(e.key==='Escape'&&document.querySelector('.detail:target'))location.hash=''});
try{window.overview=JSON.parse(document.getElementById('overview-state').textContent)}catch{}
sync();
})();`;

function dashboardHtml({ project, state, history }) {
  const zones = Array.isArray(state.zones) ? state.zones : [];
  const counts = { red: 0, amber: 0, green: 0, never: 0 };
  for (const z of zones) if (z.color in counts) counts[z.color] += 1;
  const meta = [state.branch && `rama ${state.branch}`, state.commit && String(state.commit).slice(0, 7),
    state.generatedAt && `generado ${fmtDate(state.generatedAt)}`, Number.isInteger(state.reviews) && plural(state.reviews, 'revisión', 'revisiones'),
    state.fast && 'cálculo rápido, sin endpoints'].filter(Boolean).join(' · ');
  const legend = [['ok', 'al día', 'green'], ['mid', 'se va alejando', 'amber'], ['bad', 'pide revisión', 'red'], ['never', 'nunca revisado', 'never']]
    .map(([cls, txt, c]) => `<span><i class="${cls}"></i>${txt} · ${counts[c]}</span>`).join('');
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${esc(`overview · ${project || 'proyecto'}`)}</title>
<style>${DASHBOARD_CSS}</style>
</head>
<body>
<main class="page">
<header class="head"><h1>overview <span>· ${esc(project || 'proyecto')}</span></h1><p>${esc(meta)}</p></header>
${kpisHtml(state, history)}
<section aria-label="Zonas">
<div class="grid">${layoutZones(zones).map(squareHtml).join('')}</div>
<div class="legend">${legend}</div>
</section>
<section class="charts" aria-label="Tendencias">
<div class="panel"><h4>Salud global y commits · últimas semanas</h4>${healthChart(history)}</div>
<div class="panel"><h4>Revisiones este mes</h4>${reviewsChart(state)}</div>
</section>
<p class="foot">Un archivo cuenta como cubierto solo si se revisó con el contenido que tiene hoy. Regenera con <code>overview show</code>.</p>
</main>
${zones.map(detailHtml).join('\n')}
<a class="scrim" href="#" tabindex="-1" aria-hidden="true"></a>
<script type="application/json" id="overview-state">${scriptJson({ project: project ?? null, state, history })}</script>
<script>${DASHBOARD_JS}</script>
</body>
</html>
`;
}

/**
 * Genera .rsc/overview/overview.html. Usa `state` y `history` si se pasan; si no, los lee de
 * .rsc/overview/ y, si falta el estado, hace un scan completo. Devuelve { path } o null si el
 * proyecto no tiene overview.json.
 */
export function render({ root = process.cwd(), state, history, gh = true } = {}) {
  root = resolve(root);
  const cfg = readConfig(root);
  if (!cfg) return null;
  if (!state) {
    // Un estado rápido (de una versión anterior) o ilegible no vale: se rehace el scan completo.
    const saved = readJson(join(root, ...STATE_REL));
    state = saved && !saved.fast && Array.isArray(saved.zones) ? saved : scan({ root, gh });
  }
  if (!state) return null;
  if (!Array.isArray(history)) history = readJson(join(root, ...HISTORY_REL));
  if (!Array.isArray(history)) history = [];
  const path = join(root, ...HTML_REL);
  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(path, dashboardHtml({ project: cfg.project, state, history }));
  return { path };
}

// Abre el HTML con el programa por defecto, sin shell. Si falla no pasa nada: la ruta ya salió.
function openInBrowser(path) {
  const [cmd, args] = process.platform === 'win32' ? ['explorer.exe', [path]]
    : process.platform === 'darwin' ? ['open', [path]] : ['xdg-open', [path]];
  try { spawnSync(cmd, args, { stdio: 'ignore', timeout: 10000 }); } catch { /* sin navegador */ }
}

function renderCli(cmd, o, root) {
  const gh = !o.noGh;
  const state = cmd === 'show' ? scan({ root, gh }) : undefined;
  if (cmd === 'show' && !state) return 0;
  const r = render({ root, state, gh });
  if (!r) return 0;
  process.stdout.write(`${r.path}\n`);
  if (cmd === 'show' && !o.noOpen && !process.env.OVERVIEW_NO_OPEN) openInBrowser(r.path);
  return 0;
}

function parseArgs(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--fast') opts.fast = true;
    else if (a === '--no-gh') opts.noGh = true;
    else if (a === '--no-open') opts.noOpen = true;
    else if (a.startsWith('--')) { opts[a.slice(2)] = argv[i + 1]; i += 1; }
  }
  return opts;
}

export function main(argv = process.argv.slice(2)) {
  const [cmd, ...rest] = argv;
  const o = parseArgs(rest);
  const root = o.root || process.cwd();
  if (cmd === 'record') {
    const r = record({ root, skill: o.skill, scope: o.scope, pr: o.pr });
    if (r) process.stdout.write(`${r.path}\n`);
    return 0;
  }
  if (cmd === 'render' || cmd === 'show') return renderCli(cmd, o, root);
  if (cmd === 'scan') {
    const s = scan({ root, fast: o.fast, gh: !o.noGh });
    if (s) process.stdout.write(JSON.stringify(s, null, 2) + '\n');
    return 0;
  }
  process.stderr.write('uso: overview.mjs record --skill <id> [--scope pr|global] [--pr N] [--root <dir>]\n'
    + '     overview.mjs scan [--fast] [--no-gh] [--root <dir>]\n'
    + '     overview.mjs render|show [--no-gh] [--no-open] [--root <dir>]\n');
  return 2;
}

function sameFile(a, b) {
  try { return realpathSync(a) === realpathSync(b); } catch { return false; }
}

// Solo corre como CLI si este fichero es el punto de entrada; importado por un hook, no hace nada.
if (process.argv[1] && sameFile(process.argv[1], fileURLToPath(import.meta.url))) {
  process.exitCode = main();
}
