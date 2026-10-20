import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// `rsc worktrees new` and `rsc worktrees reap --merged`, from the evidence of nine real sessions in
// one project: worktrees piled up (the person asked four times to delete them; up to fourteen were
// open), each one was born without `.env` or dependencies, and the local `main` they were cut from
// was 400 commits behind origin. Same rule as the reaper's own suite: REAL repositories, here with a
// bare `origin`, because a stubbed remote is exactly where "starts from origin" would lie.
const HERE = dirname(fileURLToPath(import.meta.url));
const MOD = join(HERE, '..', 'targets', 'worktree-reaper.mjs');
const CLI = join(HERE, '..', 'scripts', 'rsc.js');

const { classifyWorktrees, provenanceOf, listWorktrees, resolveTrunk, invalidWorktreeName } = await import(pathToFileURL(MOD).href);

const TMP = [];
function git(cwd, ...args) {
  const r = spawnSync('git', ['-C', cwd, ...args], { encoding: 'utf8', windowsHide: true });
  if (r.status !== 0) throw new Error(`git ${args.join(' ')} → ${r.stderr || r.stdout}`);
  return r.stdout.trim();
}
function write(root, rel, body) {
  mkdirSync(dirname(join(root, rel)), { recursive: true });
  writeFileSync(join(root, rel), body);
}
function tmp(prefix) {
  const d = mkdtempSync(join(tmpdir(), prefix));
  TMP.push(d);
  return d;
}
function identity(dir) {
  git(dir, 'config', 'user.email', 'eric@example.com');
  git(dir, 'config', 'user.name', 'Eric');
}
function rsc(cwd, ...args) {
  return spawnSync('node', [CLI, 'worktrees', ...args], { cwd, encoding: 'utf8', windowsHide: true });
}

// A checkout with a bare `origin` and a SECOND clone standing in for everybody else: what that clone
// pushes is on origin and not in the local `main` until something fetches it.
function project() {
  const remote = tmp('rsc-origin-');
  git(remote, 'init', '--bare', '-q', '-b', 'main');
  const root = tmp('rsc-wtn-');
  git(root, 'init', '-b', 'main', '-q');
  identity(root);
  write(root, 'README.md', '# repo\n');
  write(root, '.gitignore', 'node_modules/\n.env\n.claude/worktrees/\n');
  git(root, 'add', '-A');
  git(root, 'commit', '-qm', 'init');
  git(root, 'remote', 'add', 'origin', remote);
  git(root, 'push', '-q', 'origin', 'main');
  const other = join(tmp('rsc-other-'), 'clone');
  git(dirname(other), 'clone', '-q', remote, other);
  identity(other);
  return { root: realpathSync.native(root), remote, other };
}
function pushFromOther(other, file, body = 'x\n') {
  git(other, 'pull', '-q', '--ff-only');
  write(other, file, body);
  git(other, 'add', '-A');
  git(other, 'commit', '-qm', `other: ${file}`);
  git(other, 'push', '-q', 'origin', 'main');
}

test.after(() => {
  for (const d of TMP) { try { rmSync(d, { recursive: true, force: true }); } catch { /* best effort */ } }
});

// ── new ─────────────────────────────────────────────────────────────────────────────────────

test('N1 · new starts from origin/main after a fetch, not from a local main left behind', () => {
  const { root, other } = project();
  pushFromOther(other, 'ahead.txt');
  const before = git(root, 'rev-parse', 'main');

  const r = rsc(root, 'new', 'login');
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const path = join(root, '.claude', 'worktrees', 'login');
  assert.ok(existsSync(join(path, 'ahead.txt')), 'the worktree must contain what only origin had');
  assert.equal(git(path, 'rev-parse', 'HEAD'), git(root, 'rev-parse', 'origin/main'));
  assert.equal(git(root, 'rev-parse', 'main'), before, 'the local main is left exactly where it was');
  assert.equal(git(path, 'rev-parse', '--abbrev-ref', 'HEAD'), 'login', 'the branch defaults to the name');
  const upstream = spawnSync('git', ['-C', path, 'rev-parse', '--abbrev-ref', '@{u}'], { encoding: 'utf8', windowsHide: true });
  assert.notEqual(upstream.status, 0, 'the new branch must not track origin/main');
  assert.match(r.stdout, /cd "/, 'it prints the next step');
});

test('N2 · --branch names the branch; the directory keeps the name', () => {
  const { root } = project();
  const r = rsc(root, 'new', 'pagos', '--branch', 'feat/pagos');
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.equal(git(join(root, '.claude', 'worktrees', 'pagos'), 'rev-parse', '--abbrev-ref', 'HEAD'), 'feat/pagos');
});

test('N3 · a name that would leave .claude/worktrees is refused and nothing is created', () => {
  const { root } = project();
  for (const bad of ['../../fuera', 'a/b', '..', '-x', 'C:\\x']) {
    assert.ok(invalidWorktreeName(bad), `${bad} must be rejected`);
    const r = rsc(root, 'new', bad);
    assert.notEqual(r.status, 0, `${bad} must fail`);
  }
  assert.equal(listWorktrees(root).length, 1, 'no worktree was added');
  assert.equal(existsSync(join(root, '..', 'fuera')), false);
});

test('N4 · without a preparation hook it says .env is not copied, and how to fix that', () => {
  const { root } = project();
  write(root, '.env', 'SECRET=1\n');
  const r = rsc(root, 'new', 'sinhook');
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /preparar-worktree\.sh/);
  assert.match(r.stdout, /\.env/);
  assert.equal(existsSync(join(root, '.claude', 'worktrees', 'sinhook', '.env')), false);
});

test('N5 · the project hook runs inside the new worktree and knows where the main checkout is', () => {
  const { root } = project();
  write(root, '.env', 'SECRET=1\n');
  write(root, 'scripts/dev/preparar-worktree.mjs', [
    "import { copyFileSync, writeFileSync } from 'node:fs';",
    "import { join } from 'node:path';",
    "copyFileSync(join(process.env.RSC_MAIN_WORKTREE, '.env'), '.env');",
    "writeFileSync('cwd.txt', process.cwd());",
  ].join('\n'));
  // Committed and pushed, the way a project ships its hook: the new worktree's copy is the one run.
  git(root, 'add', '-A'); git(root, 'commit', '-qm', 'hook'); git(root, 'push', '-q', 'origin', 'main');

  const r = rsc(root, 'new', 'conhook');
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const path = join(root, '.claude', 'worktrees', 'conhook');
  assert.equal(readFileSync(join(path, '.env'), 'utf8'), 'SECRET=1\n', 'the hook copied the .env');
  assert.equal(realpathSync.native(readFileSync(join(path, 'cwd.txt'), 'utf8')), realpathSync.native(path));
});

test('N6 · a failing hook is reported, and the worktree it ran in is kept', () => {
  const { root } = project();
  write(root, 'scripts/dev/preparar-worktree.mjs', 'process.exit(3);\n');
  const r = rsc(root, 'new', 'falla');
  assert.equal(r.status, 1);
  assert.match(r.stdout, /code 3/);
  assert.ok(existsSync(join(root, '.claude', 'worktrees', 'falla')));
});

test('N7 · origin/HEAD decides the default branch, whatever it is called', () => {
  const { root, remote } = project();
  git(root, 'push', '-q', 'origin', 'main:develop');
  git(remote, 'symbolic-ref', 'HEAD', 'refs/heads/develop');
  git(root, 'remote', 'set-head', 'origin', '--auto');
  assert.equal(resolveTrunk(root), 'origin/develop');
  const r = rsc(root, 'new', 'dev');
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /from origin\/develop/);
});

// ── reap --merged ───────────────────────────────────────────────────────────────────────────

// A worktree the way Claude Code opens one: under .claude/worktrees/, on a branch of its own naming.
function claudeWorktree(root, name) {
  const path = join(root, '.claude', 'worktrees', name);
  git(root, 'worktree', 'add', '-q', '-b', `worktree-${name}`, path, 'origin/main');
  write(path, `${name}.txt`, 'work\n');
  git(path, 'add', '-A');
  git(path, 'commit', '-qm', `feat: ${name}`);
  return { path: realpathSync.native(path), branch: `worktree-${name}` };
}
// Merged in the forge: pushed, merged on origin by somebody else, never fetched here.
function mergeOnOrigin(root, other, branch) {
  git(root, 'push', '-q', 'origin', branch);
  git(other, 'fetch', '-q', 'origin');
  git(other, 'pull', '-q', '--ff-only');
  git(other, 'merge', '--no-ff', '-q', `origin/${branch}`, '-m', `merge ${branch}`);
  git(other, 'push', '-q', 'origin', 'main');
}

test('M1 · .claude/worktrees is a location the cleanup knows: half a signal, never foreign', () => {
  const { root } = project();
  const wt = claudeWorktree(root, 'agent-1');
  assert.equal(provenanceOf(root, { path: wt.path, branch: wt.branch }), 'ambiguous');
});

test('M2 · reap --merged lists first and removes nothing without --confirm', () => {
  const { root, other } = project();
  const a = claudeWorktree(root, 'agent-a');
  mergeOnOrigin(root, other, a.branch);
  const r = rsc(root, 'reap', '--merged');
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.ok(r.stdout.includes(a.branch), `the merged one is listed: ${r.stdout}`);
  assert.match(r.stdout, /--merged --confirm/);
  assert.ok(existsSync(a.path), 'nothing removed without --confirm');
});

test('M3 · reap --merged --confirm removes every merged one in one go and keeps the rest', () => {
  const { root, other } = project();
  const a = claudeWorktree(root, 'agent-a');
  const b = claudeWorktree(root, 'agent-b');
  const live = claudeWorktree(root, 'agent-live');
  const dirty = claudeWorktree(root, 'agent-dirty');
  for (const w of [a, b, dirty]) mergeOnOrigin(root, other, w.branch);
  write(dirty.path, 'agent-dirty.txt', 'edited, never committed\n');

  // The merges happened on origin; only the fetch inside the command can know about them.
  const r = rsc(root, 'reap', '--merged', '--confirm');
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.equal(existsSync(a.path), false);
  assert.equal(existsSync(b.path), false);
  // Whether the branch goes is git's call (`branch -d`, never -D); whichever it made, it is said.
  if (git(root, 'branch', '--list', a.branch)) assert.match(r.stdout, new RegExp(`branch ${a.branch} kept`));
  assert.ok(existsSync(live.path), 'unmerged work is never part of the bulk');
  assert.ok(existsSync(dirty.path), 'a dirty worktree is never part of the bulk');
  assert.match(r.stdout, /kept .*agent-dirty/, 'and it says why it was kept');
});

test('M3b · with the local main up to date, the merged branch goes too, with -d', () => {
  const { root, other } = project();
  const a = claudeWorktree(root, 'agent-a');
  mergeOnOrigin(root, other, a.branch);
  git(root, 'pull', '-q', '--ff-only', 'origin', 'main');
  const r = rsc(root, 'reap', '--merged', '--confirm');
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.equal(existsSync(a.path), false);
  assert.ok(!git(root, 'branch', '--list', a.branch), 'a merged branch goes with -d');
});

test('M4 · an .env identical to the main one is a copy, not content to lose — an edited one is', () => {
  const { root, other } = project();
  write(root, '.env', 'SECRET=1\n');
  const same = claudeWorktree(root, 'agent-same');
  const edited = claudeWorktree(root, 'agent-edited');
  for (const w of [same, edited]) mergeOnOrigin(root, other, w.branch);
  git(root, 'fetch', '-q', 'origin');
  write(same.path, '.env', 'SECRET=1\n');
  write(edited.path, '.env', 'SECRET=2\n');

  const byPath = Object.fromEntries(classifyWorktrees(root).map((c) => [c.path, c]));
  assert.deepEqual(byPath[same.path].details.outside, [], 'a byte-identical copy blocks nothing');
  assert.deepEqual(byPath[edited.path].details.outside, ['.env'], 'a changed .env is the only copy of something');
});
