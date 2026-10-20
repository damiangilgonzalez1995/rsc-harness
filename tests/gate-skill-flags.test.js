import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WORKFLOW_GATE_TEXT, renderGate } from '../targets/hook-once.mjs';
import { CODE_FLOW_FLOOR } from '../scripts/lib/default-skill-floor.js';

// El gate le decía al agente "usa `to-spec`" mientras el SKILL.md de `to-spec` lleva
// `disable-model-invocation: true`: la herramienta Skill lo rechaza y el usuario acababa
// escribiendo el comando a mano (visto tres veces en sesiones reales). El gate ahora lee esa
// marca del SKILL.md instalado y pide al usuario el `/comando` en vez de mandar al agente a un
// rechazo. Estos tests fijan ese render y que el flujo escrito a mano no se desvíe del suelo.
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const GATE = join(ROOT, 'targets', 'userprompt-gate.mjs');

function skill(root, id, flagged) {
  mkdirSync(join(root, '.claude', 'skills', id), { recursive: true });
  const flag = flagged ? 'disable-model-invocation: true\n' : '';
  writeFileSync(join(root, '.claude', 'skills', id, 'SKILL.md'), `---\nname: ${id}\n${flag}---\n\n# ${id}\n`);
}

function runGate(root) {
  // HOME aislado: una skill instalada en la máquina que corre los tests no puede colarse.
  const env = { ...process.env, HOME: root, USERPROFILE: root, RSC_HOOK_MARKER_DIR: join(root, '.markers') };
  const r = spawnSync('node', [GATE, root], { encoding: 'utf8', env });
  assert.equal(r.status, 0);
  return r.stdout;
}

test('gate: una skill marcada se pide al usuario como /comando; una sin marcar se queda igual', () => {
  const root = mkdtempSync(join(tmpdir(), 'rsc-gate-flags-'));
  skill(root, 'to-spec', true);
  skill(root, 'code-review', false);
  const out = runGate(root);

  assert.match(out, /`\/to-spec`/, 'la marcada sale como el comando que escribe el usuario');
  assert.doesNotMatch(out, /`to-spec`/, 'y ya no como una skill que el agente pueda lanzar');
  assert.match(out, /Pide al usuario que escriba/);
  assert.match(out, /`code-review`/, 'la que no está marcada se sigue nombrando como skill');
  assert.doesNotMatch(out, /`\/code-review`/);
  // Sin SKILL.md legible no se sabe nada: se conserva el texto de siempre.
  assert.match(out, /`grill-with-docs`/);
});

test('gate: sin ninguna skill instalada el texto sale tal cual (fail-safe)', () => {
  const root = mkdtempSync(join(tmpdir(), 'rsc-gate-flags-'));
  const out = runGate(root);
  assert.doesNotMatch(out, /Pide al usuario que escriba/);
  assert.match(out, /`to-spec`/);
});

test('gate: con las skills reales del repo, ninguna marcada queda como invocable', () => {
  const root = mkdtempSync(join(tmpdir(), 'rsc-gate-real-'));
  for (const id of gateSkillIds()) {
    const src = join(ROOT, 'skills', id, 'SKILL.md');
    if (!existsSync(src)) continue;
    mkdirSync(join(root, '.claude', 'skills', id), { recursive: true });
    copyFileSync(src, join(root, '.claude', 'skills', id, 'SKILL.md'));
  }
  const out = renderGate(WORKFLOW_GATE_TEXT, [root]);
  for (const id of gateSkillIds()) {
    const md = readFileSync(join(ROOT, 'skills', id, 'SKILL.md'), 'utf8');
    const flagged = /^disable-model-invocation:\s*true\s*$/m.test(md.split(/\r?\n---/)[0]);
    if (flagged) assert.ok(!out.includes(`\`${id}\``), `\`${id}\` lleva la marca y el gate lo sigue ofreciendo al agente`);
    else assert.ok(out.includes(`\`${id}\``), `\`${id}\` no lleva la marca y el gate dejó de nombrarlo`);
  }
});

// Las skills propias (sin prefijo `superpowers:`) que nombra el gate. `flujo-interfaz` es opcional
// a propósito: el gate quita su línea si no está instalada, así que no entra en el suelo.
const OPTIONAL = new Set(['flujo-interfaz']);
function gateSkillIds() {
  return [...new Set([...WORKFLOW_GATE_TEXT.matchAll(/`([a-z][a-z0-9-]*)`/g)].map((m) => m[1]))];
}

test('cada skill que nombra el gate existe en skills/', () => {
  const missing = gateSkillIds().filter((id) => !existsSync(join(ROOT, 'skills', id, 'SKILL.md')));
  assert.deepEqual(missing, []);
});

test('CODE_FLOW_FLOOR trae cada skill que nombra el gate', () => {
  // El flujo está escrito a mano en hook-once.mjs, suggest/SKILL.md, _md-block.js y el suelo. Si el
  // gate nombra una skill que el update no instala, el gate apunta a algo que no está.
  const missing = gateSkillIds().filter((id) => !OPTIONAL.has(id) && !CODE_FLOW_FLOOR.includes(id));
  assert.deepEqual(missing, []);
});
