import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// Skills retiradas porque duplican el flujo propio o el plugin superpowers.
// Ver docs/superpowers/specs/2026-09-08-personalizacion-harness-design.md
//
// 'implement' y 'code-review' se retiraron de este catalogo pero la Tarea 6
// trae de vuelta esos mismos ids como skills propias del usuario (el
// catalogo personal de damiangilgonzalez1995/claude-skills): la regla de la
// Tarea 6 es que el id propio siempre gana, asi que salen de esta lista.
const RETIRED = [
  'sdd', 'sdd-init', 'specify', 'clarify', 'plan', 'tasks', 'analyze',
  'verify', 'review', 'ship', 'constitution', 'idea-refinement',
  'decision-challenge', 'debug', 'parallel', 'worktrees',
  'decision-records',
];

test('las skills retiradas no vuelven al catalogo', () => {
  const back = RETIRED.filter((id) => existsSync(join(ROOT, 'skills', id, 'SKILL.md')));
  assert.deepEqual(back, [], `siguen en el catalogo: ${back.join(', ')}`);
});
