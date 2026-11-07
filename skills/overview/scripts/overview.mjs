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
// state.json = {
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
// merges ni `gh` para la PR (solo el campo `pr` de las revisiones) y sin escribir history.json.
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

// Umbrales de color. Por debajo de RED_BELOW la zona tiene demasiado código nuevo o cambiado sin
// cubrir; entre RED_BELOW y GREEN_FROM pide revisión pero no es urgente. La edad sola, con todo
// cubierto, nunca pasa de ámbar: no se pide revisar código intacto.
export const GREEN_FROM = 0.9;
export const RED_BELOW = 0.8;

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
  if (toHash.length) {
    const r = spawnSync('git', ['hash-object', '--stdin-paths'], {
      cwd: root, input: toHash.join('\n') + '\n', encoding: 'utf8', windowsHide: true, maxBuffer: 64 * 1024 * 1024,
    });
    if (r.status === 0) {
      const shas = r.stdout.split('\n').filter(Boolean);
      toHash.forEach((p, i) => { if (shas[i]) blobs.set(p, shas[i]); });
    }
  }
  return blobs;
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

// Semana ISO 8601 en UTC: la semana es del año al que pertenece su jueves.
export function isoWeek(date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dow = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dow);
  const jan1 = Date.UTC(d.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - jan1) / DAY_MS + 1) / 7);
  return { label: `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`, monday: new Date(d.getTime() - 3 * DAY_MS) };
}

// Salud de una zona: la cobertura, con techo de 80 si la revisión ha caducado y de 40 si entran
// endpoints sin cubrir. Una zona nunca revisada vale 0.
function zoneHealth({ reviewed, coverage, stale, newEndpoints }) {
  if (!reviewed) return 0;
  let h = Math.round(coverage * 100);
  if (stale) h = Math.min(h, 80);
  if (newEndpoints) h = Math.min(h, 40);
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

function colorOf({ reviewed, total, coverage, ageDays, cadenceDays, newEndpoints }) {
  if (!reviewed) return 'never';
  if (newEndpoints) return 'red';
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

    const total = paths.length;
    const coverage = total ? covered / total : 1;
    const ageDays = last ? Math.floor((now.getTime() - Date.parse(last)) / DAY_MS) : null;
    const cadenceDays = Number(z.cadenceDays) || null;
    const reviewed = mine.length > 0;
    const newEndpoints = uncoveredEndpoints.length > 0;
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
      lastReviewAt: last,
      ageDays,
      reviews: mine.length,
      reviewHistory,
      recommendedSkill,
      health: zoneHealth({ reviewed, coverage, stale: reviewed && stale, newEndpoints }),
      color: colorOf({ reviewed, total, coverage, ageDays, cadenceDays, newEndpoints }),
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
  const out = join(root, ...STATE_REL);
  mkdirSync(join(out, '..'), { recursive: true });
  writeFileSync(out, JSON.stringify(state, null, 2) + '\n');
  if (full) writeHistory(root, now, health);
  return state;
}

function parseArgs(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--fast') opts.fast = true;
    else if (a === '--no-gh') opts.noGh = true;
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
  if (cmd === 'scan') {
    const s = scan({ root, fast: o.fast, gh: !o.noGh });
    if (s) process.stdout.write(JSON.stringify(s, null, 2) + '\n');
    return 0;
  }
  process.stderr.write('uso: overview.mjs record --skill <id> [--scope pr|global] [--pr N] [--root <dir>]\n'
    + '     overview.mjs scan [--fast] [--no-gh] [--root <dir>]\n');
  return 2;
}

function sameFile(a, b) {
  try { return realpathSync(a) === realpathSync(b); } catch { return false; }
}

// Solo corre como CLI si este fichero es el punto de entrada; importado por un hook, no hace nada.
if (process.argv[1] && sameFile(process.argv[1], fileURLToPath(import.meta.url))) {
  process.exitCode = main();
}
