import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';

const MOD = join(dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..', 'skills', 'shortform-editing', 'scripts', 'inventario.mjs');
const { inventario, escribirSeccionReels } = await import(pathToFileURL(MOD).href);

const tmp = (p = 'sfe-') => mkdtempSync(join(tmpdir(), p));
const put = (root, rel, data = 'x') => {
  const f = join(root, rel);
  mkdirSync(dirname(f), { recursive: true });
  writeFileSync(f, data);
};
const A = '<!-- reels:inicio -->';
const B = '<!-- reels:fin -->';

test('inventario of an empty project lists everything as missing', () => {
  const root = tmp(), home = tmp();
  const r = inventario(root, { home });
  assert.deepEqual(r.falta, ['herramientas', 'marca', 'estilo', 'receta', 'referencias']);
  assert.equal(r.herramientas, false);
});

test('inventario detects tools, brand, templates and pending raw videos', () => {
  const root = tmp(), home = tmp();
  put(home, '.editor-video/rutas.json', '{}');
  put(root, 'docs/wiki/reels/marca.md');
  put(root, 'reels/marca/estilo.json', '{}');
  for (const n of ['1', '2', '3']) put(root, `reels/marca/miniaturas/${n}.png`);
  put(root, 'reels/brutos/a.mp4');
  put(root, 'reels/brutos/B.MOV'.replace('B.MOV', 'b.mp4'));
  put(root, 'reels/brutos/notas.txt');
  put(root, 'reels/exportados/a_v1.mp4');
  const r = inventario(root, { home });
  assert.equal(r.herramientas, true);
  assert.equal(r.marca, true);
  assert.equal(r.estilo, true);
  assert.equal(r.miniaturas, 3);
  assert.deepEqual(r.brutosPendientes, ['b.mp4']);
  assert.deepEqual(r.exportados, ['a_v1.mp4']);
});

test('partial handoff package only reports what is missing', () => {
  const root = tmp(), home = tmp();
  put(root, 'docs/wiki/reels/marca.md');
  const r = inventario(root, { home });
  assert.ok(!r.falta.includes('marca'));
  assert.ok(r.falta.includes('estilo'));
});

test('section is created when CLAUDE.md does not exist', () => {
  const root = tmp(), home = tmp();
  const f = join(root, 'CLAUDE.md');
  escribirSeccionReels(f, inventario(root, { home }));
  const t = readFileSync(f, 'utf8');
  assert.ok(t.indexOf(A) < t.indexOf('## Reels') && t.indexOf('## Reels') < t.indexOf(B));
});

test('section is appended without touching user content', () => {
  const root = tmp(), home = tmp();
  const f = join(root, 'CLAUDE.md');
  const orig = '# Mi proyecto\r\nTexto mío ñ.\r\n';
  writeFileSync(f, orig);
  escribirSeccionReels(f, inventario(root, { home }));
  assert.ok(readFileSync(f).toString('utf8').startsWith(orig));
});

test('section is replaced only between markers', () => {
  const root = tmp(), home = tmp();
  const f = join(root, 'CLAUDE.md');
  writeFileSync(f, '# Arriba\n');
  escribirSeccionReels(f, inventario(root, { home }));
  const mid = readFileSync(f, 'utf8');
  writeFileSync(f, mid + '\n## Abajo\nfin\n');
  put(home, '.editor-video/rutas.json', '{}');
  escribirSeccionReels(f, inventario(root, { home }));
  const t = readFileSync(f, 'utf8');
  assert.equal(t.split(A).length - 1, 1);
  assert.equal(t.split(B).length - 1, 1);
  assert.ok(t.startsWith('# Arriba\n'));
  assert.ok(t.endsWith('\n## Abajo\nfin\n'));
});

test('paths with spaces and accents work', () => {
  const root = tmp('Mi proyecto ñá-'), home = tmp();
  put(root, 'reels/brutos/x.mp4');
  const r = inventario(root, { home });
  assert.deepEqual(r.brutosPendientes, ['x.mp4']);
  escribirSeccionReels(join(root, 'CLAUDE.md'), r);
  assert.ok(existsSync(join(root, 'CLAUDE.md')));
});

test('an approved plan without an export is resumable; exported or unapproved ones are not', () => {
  const root = tmp(), home = tmp();
  put(home, '.editor-video/rutas.json', '{}');
  put(root, 'docs/wiki/reels/marca.md');
  put(root, 'docs/wiki/reels/receta.md');
  put(root, 'reels/marca/estilo.json', '{}');
  put(root, 'reels/brutos/listo.mp4');
  put(root, 'reels/trabajo/listo/plan.json', '﻿' + JSON.stringify({ clip: 'x', aprobado: true }));
  put(root, 'reels/trabajo/hecho/plan.json', JSON.stringify({ aprobado: true }));
  put(root, 'reels/exportados/hecho_v1.mp4');
  put(root, 'reels/trabajo/borrador/plan.json', JSON.stringify({ aprobado: false }));
  put(root, 'reels/trabajo/sinplan/cortado.mp4');
  put(root, 'reels/trabajo/roto/plan.json', '{no es json');
  const r = inventario(root, { home });
  assert.deepEqual(r.planesAprobados, ['listo']);
  assert.match(r.siguiente, /^4 · Montar/);
  const f = join(root, 'CLAUDE.md');
  escribirSeccionReels(f, r);
  assert.match(readFileSync(f, 'utf8'), /Planes aprobados sin montar[^\n]*listo/);
  assert.match(readFileSync(f, 'utf8'), /Siguiente paso: 4 · Montar/);
});

test('next step follows the guided order', () => {
  const root = tmp(), home = tmp();
  assert.match(inventario(root, { home }).siguiente, /^1 · Preparar/);
  put(home, '.editor-video/rutas.json', '{}');
  assert.match(inventario(root, { home }).siguiente, /^2 · Marca/);
  put(root, 'docs/wiki/reels/marca.md');
  assert.match(inventario(root, { home }).siguiente, /^2 · Marca/, 'estilo and receta still missing');
  put(root, 'docs/wiki/reels/receta.md');
  put(root, 'reels/marca/estilo.json', '{}');
  assert.deepEqual(inventario(root, { home }).planesAprobados, []);
  assert.match(inventario(root, { home }).siguiente, /nada pendiente/);
  put(root, 'reels/brutos/nuevo.mp4');
  assert.match(inventario(root, { home }).siguiente, /^3 · Editar/);
});
