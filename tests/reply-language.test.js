import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WORKFLOW_GATE_TEXT } from '../targets/hook-once.mjs';

// Reported 2026-10-10 upstream (#305): the person wrote in Spanish and the agent answered in English,
// because everything injected on every turn is in the harness's own language. In this fork the gate
// is in Spanish, so the same failure runs the other way: a person writing in English got Spanish.
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

test('the per-turn gate tells the agent to reply in the person language, not its own', () => {
  assert.match(WORKFLOW_GATE_TEXT, /Responde en el idioma en que escribe la persona, no en el de este texto/);
});

test('orient puts the person language before the brújula rule', () => {
  const orient = read('skills/orient/SKILL.md');
  const lang = orient.indexOf('## Their language');
  assert.ok(lang > 0 && lang < orient.indexOf('## The one rule'), 'the language rule comes first');
  assert.match(orient, /Reply in the language the person writes in, this turn\. If they switch, you\s+switch/);
});
