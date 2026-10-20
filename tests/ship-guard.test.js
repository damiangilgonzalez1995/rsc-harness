import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// En sesiones reales el ship-guard negó cinco cambios de rama porque el checkout principal tenía
// cambios sin commitear del propio usuario, no del agente, y el mensaje ("commitéalos primero")
// empujaba al agente a commitear algo que no era suyo. Ahora un árbol sucio no se deniega: git ya
// rechaza el cambio si fuera a pisar algo, y el agente recibe la pista de usar un worktree. Lo que
// sigue denegando es el propósito del guard: commits de una rama de feature sin empujar.
const GUARD = join(dirname(fileURLToPath(import.meta.url)), '..', 'targets', 'ship-guard.mjs');

function git(root, ...args) {
  const r = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  assert.equal(r.status, 0, `git ${args.join(' ')}: ${r.stderr}`);
  return r.stdout.trim();
}

// Repo con main y una rama de feature con upstream al día (un remoto bare local).
function repo() {
  const remote = mkdtempSync(join(tmpdir(), 'rsc-ship-remote-'));
  git(remote, 'init', '--bare', '-b', 'main');
  const root = mkdtempSync(join(tmpdir(), 'rsc-ship-'));
  git(root, 'init', '-b', 'main');
  git(root, 'config', 'user.email', 'test@example.com');
  git(root, 'config', 'user.name', 'Test');
  git(root, 'config', 'commit.gpgsign', 'false');
  writeFileSync(join(root, 'app.js'), 'export const x = 1;\n');
  git(root, 'add', '.');
  git(root, 'commit', '-m', 'init');
  git(root, 'remote', 'add', 'origin', remote);
  git(root, 'push', '-q', '-u', 'origin', 'main');
  git(root, 'checkout', '-q', '-b', 'feature');
  git(root, 'push', '-q', '-u', 'origin', 'feature');
  return root;
}

function run(root, command) {
  const r = spawnSync('node', [GUARD, root], {
    encoding: 'utf8',
    input: JSON.stringify({ tool_name: 'Bash', tool_input: { command } }),
  });
  assert.equal(r.status, 0, `el guard falló: ${r.stderr}`);
  return r.stdout.trim() ? JSON.parse(r.stdout) : null;
}
const decision = (out) => out?.hookSpecificOutput?.permissionDecision ?? 'allow';

test('árbol sucio en una rama empujada: no se deniega, se sugiere un worktree', () => {
  const root = repo();
  writeFileSync(join(root, 'app.js'), 'export const x = 2; // cambio del usuario\n');
  const out = run(root, 'git checkout main');
  assert.equal(decision(out), 'allow', 'un árbol sucio ya no es motivo para denegar');
  const ctx = out.hookSpecificOutput.additionalContext;
  assert.match(ctx, /git worktree add \.claude\/worktrees\/<name> -b <branch> origin\/main/);
  assert.match(ctx, /npx @damiangilgonzalez\/harness worktrees new <name>/);
  assert.match(ctx, /do not commit, stash or discard them/);
});

test('árbol limpio y rama empujada: silencio total', () => {
  assert.equal(run(repo(), 'git switch main'), null);
});

test('commits sin empujar en la rama de feature: se sigue denegando', () => {
  const root = repo();
  writeFileSync(join(root, 'nuevo.js'), 'export const y = 1;\n');
  git(root, 'add', '.');
  git(root, 'commit', '-q', '-m', 'feat: algo');
  const out = run(root, 'git checkout main');
  assert.equal(decision(out), 'deny');
  assert.match(out.hookSpecificOutput.permissionDecisionReason, /not pushed/);
  assert.doesNotMatch(out.hookSpecificOutput.permissionDecisionReason, /worktree/, 'sin árbol sucio no hay pista de worktree');
});

test('commits sin empujar y además árbol sucio: deniega y añade la pista del worktree', () => {
  const root = repo();
  writeFileSync(join(root, 'nuevo.js'), 'export const y = 1;\n');
  git(root, 'add', '.');
  git(root, 'commit', '-q', '-m', 'feat: algo');
  writeFileSync(join(root, 'app.js'), 'export const x = 3;\n');
  const out = run(root, 'git merge feature');
  assert.equal(decision(out), 'deny');
  assert.match(out.hookSpecificOutput.permissionDecisionReason, /git worktree add/);
});
