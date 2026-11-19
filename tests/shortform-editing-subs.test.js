import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(here, '..', 'skills', 'shortform-editing', 'scripts', 'motor', 'subs.js');
// subs.js is a plain browser script (the package is ESM): load it as a script with a CJS-style `module`.
const sandbox = { module: { exports: {} } };
vm.runInNewContext(fs.readFileSync(FILE, 'utf8'), sandbox);
const { SUBS_POS, SUBS_TRAMOS } = sandbox.module.exports;
const H = 1920, ALTO = 140;

test('default captions sit in the lower third', () => {
  const p = SUBS_POS(H, ALTO, null);
  assert.ok(p.top >= 0.70 * H, `top ${p.top} too high`);
  assert.ok(p.top + ALTO <= 0.87 * H, 'bottom edge past 0.87H');
});

test('a bottom resource hides captions instead of lifting them to the chin', () => {
  assert.strictEqual(SUBS_POS(H, ALTO, 'abajo'), null);
});

test('no zone ever puts captions above 0.70H', () => {
  for (const z of [null, 'abajo', 'arriba', 'izquierda', 'derecha', 'pantalla', 'esquina', 'lado']) {
    for (const alto of [ALTO, 300, 1000]) {
      const p = SUBS_POS(H, alto, z);
      assert.ok(p === null || p.top >= 0.70 * H, `${z}/${alto}: top ${p && p.top}`);
    }
  }
});

const PAL = [{ p: 'hola', ini: 0.0, fin: 0.4 }, { p: 'mundo', ini: 0.4, fin: 1.0 }];

test('a full-screen resource starting in the tail does not swallow words already spoken', () => {
  const tr = SUBS_TRAMOS(PAL, { apartar: [{ ini: 1.2, fin: 3, zona: 'pantalla' }] });
  assert.strictEqual(tr.length, 1, JSON.stringify(tr));
  assert.strictEqual(tr[0].ini, 0);
  assert.ok(Math.abs(tr[0].fin - 1.2) < 1e-9, `hidden at ${tr[0].fin}, resource starts at 1.2`);
  assert.strictEqual(tr[0].g.map((w) => w.p).join(' '), 'hola mundo');
});

test('captions are hidden only while the resource is on screen', () => {
  const tr = SUBS_TRAMOS(PAL, { apartar: [{ ini: 0.3, fin: 0.6, zona: 'abajo' }] });
  assert.strictEqual(JSON.stringify(tr.map((t) => [t.ini, +t.fin.toFixed(3)])), '[[0,0.3],[0.6,1.5]]');
  for (const t of tr) assert.ok(t.top >= 0.70 * H);
});

test('a side resource leaves captions untouched', () => {
  const tr = SUBS_TRAMOS(PAL, { apartar: [{ ini: 0, fin: 3, zona: 'lado' }] });
  assert.strictEqual(tr.length, 1);
  assert.ok(tr[0].fin > 1.0);
});

test('full-screen resource hides captions', () => {
  assert.strictEqual(SUBS_POS(H, ALTO, 'pantalla'), null);
});

test('corner, top, side resources do not move captions', () => {
  const def = SUBS_POS(H, ALTO, null);
  for (const z of ['esquina', 'arriba', 'izquierda', 'derecha']) {
    assert.deepStrictEqual(SUBS_POS(H, ALTO, z), def, z);
  }
});

test('a tall box is clamped above the bottom reserve', () => {
  const p = SUBS_POS(H, 300, null);
  assert.ok(p.top + 300 <= 0.87 * H);
});

test('the engine only carries neutral fallback colours; brand colours come from estilo.json', () => {
  const src = fs.readFileSync(FILE, 'utf8').toUpperCase();
  const neutros = new Set(['#FFFFFF', '#000000', '#FFC83D']);
  for (const hex of src.match(/#[0-9A-F]{6}/g) || []) assert.ok(neutros.has(hex), hex);
});

test('a very tall box never lifts captions above the floors', () => {
  assert.ok(SUBS_POS(H, 1000, null).top >= 0.70 * H);
});
