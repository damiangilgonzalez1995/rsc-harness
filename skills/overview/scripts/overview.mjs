#!/usr/bin/env node
// Motor de `overview`: registra revisiones y calcula la cobertura por zona.
//
// Un solo módulo autocontenido que solo importa builtins de `node:`. Los hooks lo cargan con
// import() desde `.rsc/`, así que no puede depender de nada que no esté a su lado.
//
//   node overview.mjs record --skill <id> [--scope pr|global] [--pr N] [--root <dir>]
//   node overview.mjs scan [--fast] [--root <dir>]
//
// Regla central: un archivo está revisado por la skill S si alguna revisión de S lo registra con el
// MISMO blob sha que tiene hoy (el de HEAD, o el del árbol de trabajo si tiene cambios). La fecha no
// cubre nada; solo el contenido. Por eso sobrevive al squash merge y no da falsa cobertura.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, realpathSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const SKILL_ID_RE = /^[a-z0-9:_-]+$/;
const CONFIG_REL = ['docs', 'overview', 'overview.json'];
const REVIEWS_REL = ['docs', 'overview', 'reviews'];
const STATE_REL = ['.rsc', 'overview', 'state.json'];
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

function colorOf({ reviewed, total, coverage, ageDays, cadenceDays }) {
  if (!reviewed) return 'never';
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
export function scan({ root = process.cwd(), fast = false, now = new Date() } = {}) {
  root = resolve(root);
  const cfg = readConfig(root);
  if (!cfg) return null;
  const reviews = readReviews(root);
  const blobs = currentFiles(root);

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
    const total = paths.length;
    const coverage = total ? covered / total : 1;
    const ageDays = last ? Math.floor((now.getTime() - Date.parse(last)) / DAY_MS) : null;
    const cadenceDays = Number(z.cadenceDays) || null;
    return {
      id: z.id,
      label: z.label ?? z.id,
      reviewSkills: skills,
      cadenceDays,
      files: total,
      covered,
      coverage,
      uncovered,
      lastReviewAt: last,
      ageDays,
      reviews: mine.length,
      color: colorOf({ reviewed: mine.length > 0, total, coverage, ageDays, cadenceDays }),
    };
  });

  const state = {
    version: 1,
    generatedAt: now.toISOString(),
    fast: Boolean(fast),
    branch: (git(root, ['rev-parse', '--abbrev-ref', 'HEAD']) || '').trim() || null,
    commit: (git(root, ['rev-parse', 'HEAD']) || '').trim() || null,
    reviews: reviews.length,
    zones,
  };
  const out = join(root, ...STATE_REL);
  mkdirSync(join(out, '..'), { recursive: true });
  writeFileSync(out, JSON.stringify(state, null, 2) + '\n');
  return state;
}

function parseArgs(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--fast') opts.fast = true;
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
    const s = scan({ root, fast: o.fast });
    if (s) process.stdout.write(JSON.stringify(s, null, 2) + '\n');
    return 0;
  }
  process.stderr.write('uso: overview.mjs record --skill <id> [--scope pr|global] [--pr N] [--root <dir>]\n'
    + '     overview.mjs scan [--fast] [--root <dir>]\n');
  return 2;
}

function sameFile(a, b) {
  try { return realpathSync(a) === realpathSync(b); } catch { return false; }
}

// Solo corre como CLI si este fichero es el punto de entrada; importado por un hook, no hace nada.
if (process.argv[1] && sameFile(process.argv[1], fileURLToPath(import.meta.url))) {
  process.exitCode = main();
}
