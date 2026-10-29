import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const read = (path) => readFileSync(join(ROOT, path), 'utf8');

const surfaces = {
  readme: read('README.md'),
  package: read('package.json'),
};

test('public surfaces define rsc-harness as the guided harness builder', () => {
  assert.match(surfaces.readme.slice(0, 2400), /Tú decides qué construir[\s\S]*construye el arnés de tu agente/i);
  assert.match(JSON.parse(surfaces.package).description, /guided harness builder/i);
});

test('the public story names the Frankenstein risk and concrete best practices', () => {
  for (const [name, body] of Object.entries({ readme: surfaces.readme })) {
    assert.match(body, /Frankenstein/i, `${name} must name the improvised-harness failure`);
    assert.match(body, /progressive|bajo demanda/i, `${name} must explain progressive loading`);
    assert.match(body, /project root|raíz del proyecto/i, `${name} must explain project boundaries`);
    assert.match(body, /accept|acept/i, `${name} must explain plan acceptance`);
    assert.match(body, /evidence|evidencia/i, `${name} must explain evidence-led growth`);
  }
});
