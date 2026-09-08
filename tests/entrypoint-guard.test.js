import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(here, '..');

function collectFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      out.push(...collectFiles(full));
    } else if (st.isFile() && ['.js', '.mjs'].includes(extname(entry))) {
      out.push(full);
    }
  }
  return out;
}

// Strips // line comments and /* */ block comments well enough to avoid false
// positives from a comment that merely discusses the broken pattern (as in
// scripts/drift-check.js, which documents this very failure mode in prose).
function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

const BROKEN_PATTERN = /file:\/\/\$\{process\.argv\[1\]\}/;

test('no script under scripts/ or targets/ uses the broken Windows-unsafe entrypoint guard outside comments', () => {
  const dirs = ['scripts', 'targets'].map((d) => join(repoRoot, d));
  const offenders = [];
  for (const dir of dirs) {
    let files;
    try {
      files = collectFiles(dir);
    } catch {
      continue;
    }
    for (const file of files) {
      const src = readFileSync(file, 'utf8');
      const stripped = stripComments(src);
      if (BROKEN_PATTERN.test(stripped)) {
        offenders.push(file);
      }
    }
  }
  assert.deepEqual(offenders, [], `broken entrypoint guard found in: ${offenders.join(', ')}`);
});
