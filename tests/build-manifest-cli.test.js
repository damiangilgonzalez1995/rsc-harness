import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync, symlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..');

// Regression test for the Windows entrypoint-guard bug: `import.meta.url ===
// \`file://${process.argv[1]}\`` never matches on Windows (argv[1] is a drive path,
// not a file:// URL), so `main()` never ran and `node scripts/build-manifest.js`
// silently did nothing while exiting 0. This test proves the script actually rewrites
// manifest.json when invoked as the main program — using a throwaway copy of the repo
// so it never touches the real, shared manifest.json (which other tests read
// concurrently under node --test's parallel test-file execution).
test('running build-manifest.js as the main program actually rewrites manifest.json', () => {
  const tmpRoot = mkdtempSync(join(tmpdir(), 'rsc-manifest-cli-'));
  try {
    const files = execFileSync('git', ['ls-files'], { cwd: repoRoot, encoding: 'utf8' })
      .split('\n')
      .filter(Boolean);
    for (const rel of files) {
      const src = join(repoRoot, rel);
      const dest = join(tmpRoot, rel);
      mkdirSync(dirname(dest), { recursive: true });
      writeFileSync(dest, readFileSync(src));
    }
    // Bare-specifier imports (e.g. 'ajv') resolve via node_modules lookup walking up
    // from the script's directory — link it in rather than copying it.
    symlinkSync(join(repoRoot, 'node_modules'), join(tmpRoot, 'node_modules'), 'junction');

    const manifestPath = join(tmpRoot, 'manifest.json');
    const original = readFileSync(manifestPath, 'utf8');
    const corrupted = JSON.stringify(
      { ...JSON.parse(original), counts: { ...JSON.parse(original).counts, skills: 999 } },
      null,
      2,
    ) + '\n';
    writeFileSync(manifestPath, corrupted);
    assert.match(readFileSync(manifestPath, 'utf8'), /"skills": 999/);

    const scriptPath = join(tmpRoot, 'scripts', 'build-manifest.js');
    const stdout = execFileSync(process.execPath, [scriptPath], { cwd: tmpRoot, encoding: 'utf8' });

    assert.match(stdout, /wrote manifest\.json/, 'script should print confirmation of the write');
    const rewritten = readFileSync(manifestPath, 'utf8');
    assert.doesNotMatch(rewritten, /"skills": 999/, 'the corrupted sentinel value must be overwritten by a real run');
    assert.equal(rewritten, original, 'regenerated manifest.json should match the committed, up-to-date manifest');
  } finally {
    rmSync(tmpRoot, { recursive: true, force: true });
  }
});
