import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync, readdirSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { wireHook, hookWiringOf } from '../targets/claude.js';
import { generatedHookFiles } from '../scripts/install-apply.js';

// El registro de `overview` solo vale si es automático: una revisión que hay que apuntar a mano no se
// apunta. Pero el hook vive en el camino de CADA llamada a una skill y de CADA prompt, así que lo que
// estos tests sujetan es sobre todo lo que no debe hacer: hablar, fallar o escribir ruido.
//
// Se prueban los scripts ya materializados en `.rsc/` por wireHook, no los de targets/: el hook
// importa el motor como hermano, y un test contra la copia del repo no vería un import roto.

function git(root, ...args) {
  const r = spawnSync('git', args, { cwd: root, encoding: 'utf8', windowsHide: true });
  assert.equal(r.status, 0, `git ${args.join(' ')}: ${r.stderr}`);
  return r.stdout.trim();
}

function put(root, rel, body) {
  mkdirSync(dirname(join(root, rel)), { recursive: true });
  writeFileSync(join(root, rel), body);
}

const CONFIG = {
  version: 1,
  project: 'fixture',
  zones: [
    { id: 'api-endpoints', label: 'Endpoints API', paths: ['api/**'], reviewSkills: ['security-scan'], cadenceDays: 30, checks: [] },
  ],
  questions: [],
};

// Un proyecto con git y el harness cableado. `config: null` es un proyecto sin overview.
function project({ config = CONFIG, gitRepo = true } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'rsc-ovhook-'));
  if (gitRepo) {
    git(root, 'init', '-q', '-b', 'main');
    git(root, 'config', 'user.email', 'test@example.com');
    git(root, 'config', 'user.name', 'Test');
    git(root, 'config', 'commit.gpgsign', 'false');
    git(root, 'config', 'core.autocrlf', 'false');
  }
  put(root, 'api/users.js', 'export const users = 1;\n');
  put(root, 'README.md', 'hola\n');
  if (config) put(root, 'docs/overview/overview.json', JSON.stringify(config, null, 2));
  if (gitRepo) {
    git(root, 'add', '.');
    git(root, 'commit', '-q', '-m', 'init');
  }
  mkdirSync(join(root, '.claude'), { recursive: true });
  const hookTarget = join(root, '.claude', 'settings.json');
  wireHook({ projectRoot: root, hookTarget, skillDir: (id) => join(root, '.claude', 'skills', id) });
  return root;
}

const reviewsOf = (root) => {
  const dir = join(root, 'docs', 'overview', 'reviews');
  return existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.json')) : [];
};
const readReview = (root, f) => JSON.parse(readFileSync(join(root, 'docs', 'overview', 'reviews', f), 'utf8'));

// Cada llamada con su propio directorio de marcas: si no, la deduplicación entre scopes de un test
// silenciaría al siguiente.
const env = () => ({ ...process.env, RSC_HOOK_MARKER_DIR: mkdtempSync(join(tmpdir(), 'rsc-ovmark-')) });

// Igual que lo lanza Claude Code: a través del bootstrap comprometido, en modo `quiet`.
function runHook(root, script, input) {
  return spawnSync('node', [join(root, '.claude', 'rsc-bootstrap.mjs'), 'quiet', root, join(root, '.rsc', script), root], {
    cwd: root, encoding: 'utf8', windowsHide: true, env: env(),
    input: typeof input === 'string' ? input : JSON.stringify(input),
  });
}
const skillCall = (skill, args) => ({ session_id: 's1', tool_use_id: `t-${Math.random()}`, tool_name: 'Skill', tool_input: { skill, ...(args ? { args } : {}) } });
const prompt = (text) => ({ session_id: 's1', prompt_id: `p-${Math.random()}`, prompt: text });

function assertSilent(r) {
  assert.equal(r.status, 0, `el hook salió con ${r.status}: ${r.stderr}`);
  assert.equal(r.stdout, '', `el hook habló por stdout: ${r.stdout}`);
  assert.equal(r.stderr, '', `el hook habló por stderr: ${r.stderr}`);
}

// ── la herramienta Skill ──────────────────────────────────────────────────────────────────

test('lanzar una skill de revisión con la herramienta Skill deja una revisión escrita', () => {
  const root = project();
  const r = runHook(root, 'overview-skill-hook.mjs', skillCall('security-scan'));
  assertSilent(r);
  const files = reviewsOf(root);
  assert.equal(files.length, 1, `esperaba una revisión: ${files}`);
  const review = readReview(root, files[0]);
  assert.equal(review.skill, 'security-scan');
  assert.equal(review.scope, 'global', 'en la rama principal la revisión es global');
  assert.deepEqual(Object.keys(review.files), ['api/users.js']);
});

test('una skill que no revisa ninguna zona no escribe nada', () => {
  const root = project();
  assertSilent(runHook(root, 'overview-skill-hook.mjs', skillCall('brainstorming')));
  assert.deepEqual(reviewsOf(root), []);
});

test('fuera de la rama principal la revisión es de PR', () => {
  const root = project();
  git(root, 'checkout', '-q', '-b', 'feat/x');
  put(root, 'api/users.js', 'export const users = 2;\n');
  git(root, 'commit', '-q', '-am', 'cambio');
  assertSilent(runHook(root, 'overview-skill-hook.mjs', skillCall('security-scan')));
  const [f] = reviewsOf(root);
  assert.equal(readReview(root, f).scope, 'pr');
});

test('los argumentos de la skill deciden el scope: "global" lo fuerza y una PR lo hace pr', () => {
  const root = project();
  git(root, 'checkout', '-q', '-b', 'feat/x');
  assertSilent(runHook(root, 'overview-skill-hook.mjs', skillCall('security-scan', 'auditoría global')));
  const root2 = project();
  assertSilent(runHook(root2, 'overview-skill-hook.mjs', skillCall('security-scan', 'revisa la PR #41')));
  assert.equal(readReview(root, reviewsOf(root)[0]).scope, 'global');
  const review = readReview(root2, reviewsOf(root2)[0]);
  assert.equal(review.scope, 'pr');
  assert.equal(review.pr, 41);
});

// ── el prompt con /skill ──────────────────────────────────────────────────────────────────

test('escribir /security-scan en el prompt registra igual que la herramienta Skill', () => {
  const root = project();
  assertSilent(runHook(root, 'overview-prompt-hook.mjs', prompt('/security-scan algo')));
  const files = reviewsOf(root);
  assert.equal(files.length, 1);
  assert.equal(readReview(root, files[0]).skill, 'security-scan');
});

test('una /skill a mitad del prompt, o una que no revisa, no registra', () => {
  const root = project();
  assertSilent(runHook(root, 'overview-prompt-hook.mjs', prompt('luego pasa /security-scan')));
  assertSilent(runHook(root, 'overview-prompt-hook.mjs', prompt('/brainstorming una idea')));
  assertSilent(runHook(root, 'overview-prompt-hook.mjs', prompt('hola')));
  assert.deepEqual(reviewsOf(root), []);
});

// ── lo que no debe hacer nunca ────────────────────────────────────────────────────────────

test('ante JSON roto, sin git o sin overview.json sale con 0 y en silencio', () => {
  const broken = project();
  assertSilent(runHook(broken, 'overview-skill-hook.mjs', '{no es json'));
  assertSilent(runHook(broken, 'overview-prompt-hook.mjs', '{no es json'));
  assertSilent(runHook(broken, 'overview-skill-hook.mjs', ''));

  const noGit = project({ gitRepo: false });
  assertSilent(runHook(noGit, 'overview-skill-hook.mjs', skillCall('security-scan')));
  assertSilent(runHook(noGit, 'overview-prompt-hook.mjs', prompt('/security-scan')));
  assert.deepEqual(reviewsOf(noGit), [], 'sin git no hay blob sha que registrar');

  const noOverview = project({ config: null });
  assertSilent(runHook(noOverview, 'overview-skill-hook.mjs', skillCall('security-scan')));
  assert.deepEqual(reviewsOf(noOverview), []);
});

test('un nombre de skill que no es un id no llega a un nombre de fichero', () => {
  // El nombre llega por stdin: es un dato. Una zona que lo listara no lo hace válido.
  const config = { ...CONFIG, zones: [{ ...CONFIG.zones[0], reviewSkills: ['../../x', 'security-scan'] }] };
  const root = project({ config });
  assertSilent(runHook(root, 'overview-skill-hook.mjs', skillCall('../../x')));
  assertSilent(runHook(root, 'overview-prompt-hook.mjs', prompt('/../../x')));
  assert.deepEqual(reviewsOf(root), []);
});

test('la misma llamada vista desde dos scopes registra una sola revisión', () => {
  // Con rsc en el scope de usuario y en el de proyecto, cada hook se dispara dos veces por llamada.
  const root = project();
  const input = skillCall('security-scan');
  const markers = env();
  for (let i = 0; i < 2; i += 1) {
    spawnSync('node', [join(root, '.rsc', 'overview-skill-hook.mjs'), root], {
      cwd: root, encoding: 'utf8', windowsHide: true, env: markers, input: JSON.stringify(input),
    });
  }
  assert.equal(reviewsOf(root).length, 1);
});

test('el mismo prompt sin prompt_id, visto desde dos scopes, registra una sola revisión', () => {
  // Claude Code antiguo no manda prompt_id: la clave sale del texto del prompt y de la sesión.
  const root = project();
  const input = { session_id: 's-sin-id', prompt: '/security-scan global' };
  const markers = env();
  for (let i = 0; i < 2; i += 1) {
    spawnSync('node', [join(root, '.rsc', 'overview-prompt-hook.mjs'), root], {
      cwd: root, encoding: 'utf8', windowsHide: true, env: markers, input: JSON.stringify(input),
    });
  }
  assert.equal(reviewsOf(root).length, 1);
});

// ── el cableado ───────────────────────────────────────────────────────────────────────────

test('wireHook deja el motor y los dos hooks como hermanos en .rsc/', () => {
  const root = project();
  for (const f of ['overview.mjs', 'overview-skill-hook.mjs', 'overview-prompt-hook.mjs']) {
    assert.ok(existsSync(join(root, '.rsc', f)), `${f} no está en .rsc/`);
  }
  const hooks = JSON.parse(readFileSync(join(root, '.claude', 'settings.json'), 'utf8')).hooks;
  const post = hooks.PostToolUse.filter((e) => hookWiringOf(e).includes('.rsc/overview-skill-hook.'));
  assert.equal(post.length, 1);
  assert.equal(post[0].matcher, 'Skill');
  assert.match(post[0].hooks[0].command, /rsc-bootstrap\.mjs" "quiet"/, 'debe pasar por el bootstrap y callado');
  assert.equal(hooks.UserPromptSubmit.filter((e) => hookWiringOf(e).includes('.rsc/overview-prompt-hook.')).length, 1);
});

test('los hooks de overview se cablean aunque no haya hooks de código', () => {
  // La skill es de suelo: también en un proyecto de operaciones.
  const root = mkdtempSync(join(tmpdir(), 'rsc-ovhook-ops-'));
  const hookTarget = join(root, '.claude', 'settings.json');
  wireHook({ projectRoot: root, hookTarget, skillDir: (id) => join(root, '.claude', 'skills', id) }, undefined, { codeHooks: false });
  const hooks = JSON.parse(readFileSync(hookTarget, 'utf8')).hooks;
  assert.ok(hooks.PostToolUse.some((e) => hookWiringOf(e).includes('.rsc/overview-skill-hook.')));
  assert.ok(hooks.UserPromptSubmit.some((e) => hookWiringOf(e).includes('.rsc/overview-prompt-hook.')));
  for (const policy of [{}, { codeHooks: false }]) {
    const files = generatedHookFiles({ target: 'claude', cwd: root, policy });
    for (const f of ['overview.mjs', 'overview-skill-hook.mjs', 'overview-prompt-hook.mjs']) {
      assert.ok(files.includes(join(root, '.rsc', f)), `${f} falta en generatedHookFiles(${JSON.stringify(policy)})`);
    }
  }
});

test('un PostToolUse ajeno sobrevive al cableado', () => {
  const root = mkdtempSync(join(tmpdir(), 'rsc-ovhook-mine-'));
  const hookTarget = join(root, '.claude', 'settings.json');
  const mine = { matcher: 'Edit', hooks: [{ type: 'command', command: 'node "/p/scripts/my-own.mjs"' }] };
  put(root, '.claude/settings.json', JSON.stringify({ hooks: { PostToolUse: [mine] } }));
  wireHook({ projectRoot: root, hookTarget, skillDir: (id) => join(root, '.claude', 'skills', id) });
  const post = JSON.parse(readFileSync(hookTarget, 'utf8')).hooks.PostToolUse;
  assert.ok(post.some((e) => JSON.stringify(e).includes('my-own.mjs')));
  assert.equal(post.length, 2);
});
