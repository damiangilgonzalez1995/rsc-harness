import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DOMAINS, allDomainIds } from '../scripts/lib/domains.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SKILLS = join(ROOT, 'skills');

function skillDirs() {
  return readdirSync(SKILLS).filter((d) => {
    try {
      return statSync(join(SKILLS, d)).isDirectory() && statSync(join(SKILLS, d, 'SKILL.md')).isFile();
    } catch {
      return false;
    }
  });
}

test('every skill on disk belongs to exactly one catalog domain', () => {
  const onDisk = new Set(skillDirs());
  const inDomains = allDomainIds();
  const seen = new Set();
  const dupes = [];
  for (const id of inDomains) {
    if (seen.has(id)) dupes.push(id);
    seen.add(id);
  }
  const missing = [...onDisk].filter((id) => !seen.has(id));
  const dead = inDomains.filter((id) => !onDisk.has(id));

  assert.deepEqual(dupes, [], `skills listed in more than one domain: ${dupes.join(', ')}`);
  assert.deepEqual(missing, [], `skills on disk missing from scripts/lib/domains.js (add them so the catalog grows): ${missing.join(', ')}`);
  assert.deepEqual(dead, [], `domain ids that no longer exist on disk: ${dead.join(', ')}`);
});

test('every domain has a title and at least one skill', () => {
  for (const d of DOMAINS) {
    assert.ok(d.title && typeof d.title === 'string', 'domain missing title');
    assert.ok(Array.isArray(d.ids) && d.ids.length > 0, `domain "${d.title}" has no skills`);
  }
});

// The full catalog moved out of the README into docs/catalogo.md (the README links to it), so the
// "every skill has a link to its folder" guarantee follows the catalog to its new home.
test('the catalog doc links a folder for every skill in the manifest', () => {
  const catalog = readFileSync(join(ROOT, 'docs', 'catalogo.md'), 'utf8');
  const missing = skillDirs().filter((id) => !catalog.includes(`(../skills/${id}/)`));
  assert.deepEqual(missing, [], `skills missing a docs/catalogo.md link: ${missing.join(', ')}`);
});

test('the README links the full catalog', () => {
  const readme = readFileSync(join(ROOT, 'README.md'), 'utf8');
  assert.match(readme, /\(docs\/catalogo\.md\)/, 'the README must point readers at docs/catalogo.md');
});
