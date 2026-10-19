// #293 — on Windows every process a hook starts without `windowsHide: true` opens a console that
// flashes and steals focus, and the hooks run on every turn. Nothing on macOS or Linux shows it, so
// the guarantee is static: every child_process call in the code that runs inside a project (targets/)
// passes windowsHide: true, and none goes through a shell on Windows.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = fileURLToPath(new URL('../targets/', import.meta.url));
const CALL = /(?<![.\w])(execFileSync|execFile|spawnSync|spawn|execSync)\s*\(/g;

/** The full text of the call starting at `open` (the index of its `(`), balancing parentheses. */
function callText(src, open) {
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    const c = src[i];
    if (c === '(') depth++;
    else if (c === ')' && --depth === 0) return src.slice(open, i + 1);
  }
  return src.slice(open);
}

function calls() {
  const out = [];
  for (const name of readdirSync(DIR).filter((f) => /\.(m?js)$/.test(f))) {
    const src = readFileSync(join(DIR, name), 'utf8');
    for (const m of src.matchAll(CALL)) {
      const before = src.slice(Math.max(0, m.index - 40), m.index);
      if (/import\s*\{[^}]*$/.test(before)) continue; // the import list, not a call
      const line = src.slice(0, m.index).split('\n').length;
      if (/^\s*\/\//.test(src.split('\n')[line - 1])) continue; // a comment
      out.push({ where: `targets/${name}:${line}`, text: callText(src, m.index + m[0].length - 1) });
    }
  }
  return out;
}

test('#293 · every process a hook can start is hidden on Windows', () => {
  const found = calls();
  // En el fork hay menos hooks (sin auto-update, knowledge-sync ni team-safe): 8 llamadas.
  assert.ok(found.length >= 8, `the scan sees the call sites (${found.length})`);
  const visible = found.filter((c) => !/windowsHide:\s*true/.test(c.text)).map((c) => c.where);
  assert.deepEqual(visible, [], `these would flash a console on Windows: ${visible.join(', ')}`);
});

test('#293 · no hook process goes through a shell on Windows unless nothing else can start it', () => {
  const shelled = calls().filter((c) => /shell:\s*(true|process\.platform)/.test(c.text)).map((c) => c.where);
  assert.deepEqual(shelled, [], 'an unconditional shell');
});
