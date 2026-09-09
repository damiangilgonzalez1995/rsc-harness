import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

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

// Discovered, not hand-maintained: any file under scripts/ or targets/ that references
// `process.argv[1]` is claiming to guard its own entrypoint, so it must survive being
// imported with no argv[1] at all (e.g. `node -e`). A hand-written list silently stops
// covering a file the day someone adds a new guarded script — this sweep cannot.
const ENTRYPOINT_GUARD_MODULES = ['scripts', 'targets']
  .map((d) => join(repoRoot, d))
  .flatMap((dir) => {
    try { return collectFiles(dir); } catch { return []; }
  })
  .filter((file) => readFileSync(file, 'utf8').includes('process.argv[1]'))
  .map((file) => file.slice(repoRoot.length + 1).split(path.sep).join('/'));

for (const rel of ENTRYPOINT_GUARD_MODULES) {
  test(`importing ${rel} does not throw when process.argv[1] is absent`, () => {
    const fileUrl = pathToFileURL(join(repoRoot, rel)).href;
    assert.doesNotThrow(() => {
      execFileSync(
        process.execPath,
        ['--input-type=module', '-e', `import(${JSON.stringify(fileUrl)})`],
        { stdio: 'pipe' },
      );
    });
  });
}

// Strips // line comments and /* */ block comments well enough to avoid false
// positives from a comment that merely discusses the broken pattern (as in
// scripts/drift-check.js, which documents this very failure mode in prose).
function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

// Three shapes of the same Windows-unsafe mistake: a literal `file://` template (produces
// `file://C:\...`, which no URL parser accepts), and `new URL(import.meta.url).pathname`
// (on Windows this is `/C:/Users/...` — a POSIX-shaped string that breaks `resolve()`/`join()`
// comparisons against `process.argv[1]`, so the guard never matches and the entrypoint never runs).
const BROKEN_PATTERN = /file:\/\/\$\{process\.argv\[1\]\}|new URL\(import\.meta\.url\)\.pathname/;

// Any use of pathToFileURL(process.argv[1]) must be preceded on the same line
// by the existence guard `process.argv[1] &&` — otherwise argv[1] being
// undefined (no script path, e.g. `node -e`) throws ERR_INVALID_ARG_TYPE and
// aborts the whole import.
const UNGUARDED_USE_PATTERN = /pathToFileURL\(process\.argv\[1\]\)/;
const GUARD_PREFIX_PATTERN = /process\.argv\[1\]\s*&&[^\n]*pathToFileURL\(process\.argv\[1\]\)/;

test('no script under scripts/ or targets/ uses the broken Windows-unsafe entrypoint guard outside comments', () => {
  const dirs = ['scripts', 'targets'].map((d) => join(repoRoot, d));
  const offenders = [];
  const unguarded = [];
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
      for (const line of stripped.split('\n')) {
        if (UNGUARDED_USE_PATTERN.test(line) && !GUARD_PREFIX_PATTERN.test(line)) {
          unguarded.push(file);
        }
      }
    }
  }
  assert.deepEqual(offenders, [], `broken entrypoint guard found in: ${offenders.join(', ')}`);
  assert.deepEqual(
    unguarded,
    [],
    `pathToFileURL(process.argv[1]) used without the process.argv[1] && guard in: ${unguarded.join(', ')}`,
  );
});
