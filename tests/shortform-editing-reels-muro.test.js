import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(here, '..', 'skills', 'shortform-editing', 'scripts', 'motor', 'recursos', 'reels-muro.js');
const W = 1080;
// Instagram's like/comment/share buttons live in the right 8 % of the frame.
const BORDE = 0.92 * W;
// a card tilts up to a few degrees and has a 3 px ring: keep a small safety margin.
const HOLGURA = 12;

function pintar(opts) {
  const win = { REC: {}, MARCA: () => ({ rgba: () => '', imagen: () => '', fondo: '', trazo: '', acento: '', linea: '', titulos: '' }) };
  const pill = { querySelector: () => ({ textContent: '' }) };
  const capa = { innerHTML: '', querySelectorAll: () => [], querySelector: () => pill };
  const tl = { fromTo() {}, to() {}, set() {} };
  vm.runInNewContext(fs.readFileSync(FILE, 'utf8'), { window: win, document: { getElementById: () => true } });
  win.REC['reels-muro'](tl, capa, 0, 4, opts, {});
  return capa.innerHTML;
}

function cajas(html) {
  return [...html.matchAll(/class="rm-tj" style="left:(-?[\d.]+)px;top:[\d.]+px;width:([\d.]+)px/g)]
    .map((m) => ({ left: +m[1], ancho: +m[2] }));
}

for (const columnas of [1, 2, 3]) {
  test(`right-side wall (${columnas} col) stays clear of the Instagram buttons`, () => {
    const html = pintar({ lado: 'der', columnas });
    const cs = cajas(html);
    assert.ok(cs.length > 0, html);
    for (const c of cs) assert.ok(c.left + c.ancho <= BORDE - HOLGURA, `card ends at ${c.left + c.ancho}`);
    // the views pill has no fixed width: on the right it must be anchored by its right edge
    const m = html.match(/class="rm-cont" style="right:([\d.]+)px/);
    assert.ok(m, 'pill not anchored to the right');
    assert.ok(W - +m[1] <= BORDE - HOLGURA, `pill ends at ${W - +m[1]}`);
  });
}

test('an explicit x never pushes the wall under the buttons', () => {
  for (const c of cajas(pintar({ lado: 'der', x: 900 }))) assert.ok(c.left + c.ancho <= BORDE - HOLGURA);
  for (const c of cajas(pintar({ x: 1000 }))) assert.ok(c.left + c.ancho <= BORDE - HOLGURA);
});

test('left-side wall keeps its default position', () => {
  const cs = cajas(pintar({}));
  assert.strictEqual(cs[0].left, 36);
});
