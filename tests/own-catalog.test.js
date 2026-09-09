import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter } from '../scripts/lib/frontmatter.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// Catalogo propio del usuario: 36 skills de github.com/damiangilgonzalez1995/claude-skills
// mas `write-adr` (traida de ~/.claude/skills/escribir-adr, renombrada a peticion expresa).
// Los identificadores se quedan tal cual estan en el repo de origen (en espanol salvo
// los que ya eran ingleses alli), unica excepcion `write-adr`. El cuerpo de cada skill
// se queda en espanol sin tocar; solo el campo `description` del frontmatter se traduce
// al ingles, porque es lo que Claude lee para decidir si la dispara.
const OWN = [
  'claude-project-setup', 'domain-modeling', 'grill-me', 'grill-with-docs', 'grilling',
  'prototype', 'research', 'to-questionnaire', 'to-spec', 'to-tickets', 'wayfinder',
  'implement', 'animar', 'diseno-apple', 'diseno-landing', 'ingeniero-diseno-web',
  'leyes-de-percepcion', 'leyes-de-retencion', 'mejor-accesibilidad', 'mejor-colores',
  'mejor-layout', 'mejor-redaccion', 'mejor-tipografia', 'mejor-ui',
  'sitios-calidad-premio', 'tastemaker', 'video-a-superprompt', 'vocabulario-animacion',
  'code-review', 'handoff', 'revision-de-cambios', 'revision-interfaz', 'muscle-memory',
  'teach', 'wait-what', 'writing-for-agents', 'write-adr',
];

test('el catalogo propio esta completo', () => {
  const missing = OWN.filter((id) => !existsSync(join(ROOT, 'skills', id, 'SKILL.md')));
  assert.deepEqual(missing, [], `faltan: ${missing.join(', ')}`);
});

test('la descripcion del catalogo propio esta en ingles', () => {
  // Palabras funcionales del castellano que no aparecen en prosa inglesa.
  const spanish = /\b(cuando|usar|para|desde|entonces|porque|sobre|tambien|hacia|entre)\b/i;
  const offenders = [];
  for (const id of OWN) {
    const fm = parseFrontmatter(readFileSync(join(ROOT, 'skills', id, 'SKILL.md'), 'utf8'));
    if (spanish.test(fm.description)) offenders.push(id);
  }
  assert.deepEqual(offenders, [], `descripcion en castellano: ${offenders.join(', ')}`);
});

test('el frontmatter propio declara nombre, descripcion y tags', () => {
  for (const id of OWN) {
    const fm = parseFrontmatter(readFileSync(join(ROOT, 'skills', id, 'SKILL.md'), 'utf8'));
    assert.equal(fm.name, id, `${id}: el campo name debe coincidir con el directorio`);
    assert.ok(fm.description.length >= 10, `${id}: descripcion demasiado corta`);
    assert.ok((fm.tags || []).length >= 1, `${id}: sin tags`);
  }
});
