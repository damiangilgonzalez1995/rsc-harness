import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, scan } from '../skills/overview/scripts/overview.mjs';
import { ENGINE, repo, dashboardRepo } from './fixtures/overview-fixture.js';

// Dashboard (ticket 05): `render` escribe .rsc/overview/overview.html, un HTML único con el estado
// incrustado en <script type="application/json">. Se prueba por fuera: el HTML y el estado que lleva.
const embedded = (html) => {
  const m = /<script type="application\/json" id="overview-state">([\s\S]*?)<\/script>/.exec(html);
  assert.ok(m, 'el HTML lleva el estado incrustado');
  return JSON.parse(m[1]);
};
const squareClass = (html, id) => {
  const m = new RegExp(`<a class="sq([^"]*)"[^>]*data-zone="${id}"`).exec(html);
  assert.ok(m, `hay un cuadrado para ${id}`);
  return m[1].trim().split(/\s+/);
};

test('con el fixture, el HTML lleva las zonas con su color y los KPIs correctos', () => {
  const root = dashboardRepo();
  scan({ root, gh: false });
  const out = render({ root });
  assert.equal(out.path, join(root, '.rsc', 'overview', 'overview.html'));
  const html = readFileSync(out.path, 'utf8');

  const state = embedded(html).state;
  const colors = Object.fromEntries(state.zones.map((z) => [z.id, z.color]));
  assert.deepEqual(colors, { 'api-endpoints': 'red', frontend: 'green', database: 'amber', docs: 'never' });
  assert.ok(squareClass(html, 'api-endpoints').includes('bad'));
  assert.ok(squareClass(html, 'frontend').includes('ok'));
  assert.ok(squareClass(html, 'database').includes('mid'));
  assert.ok(squareClass(html, 'docs').includes('never'));
  // Como mucho 3 cuadrados de 2×2, y el primero es la zona de más peso (urgencia × archivos).
  const big = [...html.matchAll(/<a class="sq x2[^"]*"[^>]*data-zone="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(big.length >= 1 && big.length <= 3);
  assert.equal(big[0], 'api-endpoints');

  const kpi = (name) => new RegExp(`data-kpi="${name}"[^>]*>[\\s\\S]*?<b[^>]*>([^<]*)`).exec(html)?.[1].trim();
  assert.equal(kpi('health'), String(state.kpis.health));
  assert.equal(kpi('zones'), '3');
  assert.equal(kpi('uncovered'), String(state.kpis.uncoveredFiles));
  assert.equal(kpi('questions'), '1');
  assert.equal(kpi('pr'), 'PR #7');

  // Detalle de la zona: endpoint nuevo, archivo sin cubrir, comprobación, historial y skill recomendada.
  const detail = /<aside[^>]*id="zone=api-endpoints"[\s\S]*?<\/aside>/.exec(html)?.[0];
  assert.ok(detail, 'hay panel de detalle para la zona');
  assert.match(detail, /POST/);
  assert.match(detail, /\/orders/);
  assert.match(detail, /app\/routers\/orders\.py/);
  assert.match(detail, /Validación en el servidor/);
  assert.match(detail, /security-scan/);
  assert.match(detail, /secure-coding/);
  // Las dos gráficas van en SVG en línea.
  assert.equal((html.match(/<svg/g) || []).length >= 2, true);
  assert.doesNotMatch(html, /<script[^>]+src=|<link[^>]+stylesheet/);
});

test('un path con <script> sale escapado en el HTML y en el JSON incrustado', () => {
  const evil = 'app/</script><script>alert(1)</script>.py';
  const state = {
    version: 1, generatedAt: new Date().toISOString(), branch: 'main', commit: 'abc', reviews: 1,
    kpis: { health: 50, zonesNeedingReview: ['z'], uncoveredFiles: 1, uncoveredEndpoints: 1, openQuestions: 0, lastCoveredPr: null },
    zones: [{
      id: 'z', label: '<img src=x onerror=alert(1)>', reviewSkills: ['security-scan'], cadenceDays: 30,
      checks: [{ id: 'c', label: '"><b>x</b>', status: 'fail', note: '<i>n</i>' }],
      files: 1, covered: 0, coverage: 0, uncovered: [evil],
      uncoveredEndpoints: [{ method: 'GET', route: '/<script>', file: evil, line: 1, stack: 'fastapi' }],
      lastReviewAt: null, ageDays: null, reviews: 1,
      reviewHistory: [{ skill: 'security-scan', at: new Date().toISOString(), branch: '<b>rama</b>', scope: 'pr', pr: null, file: 'r.json', coveredNow: 0 }],
      recommendedSkill: 'security-scan', health: 0, color: 'red',
    }],
  };
  const root = repo();
  const html = readFileSync(render({ root, state, history: [] }).path, 'utf8');
  assert.equal((html.match(/<script/gi) || []).length, 2, 'solo los dos <script> propios de la página');
  assert.doesNotMatch(html, /<img src=x/);
  assert.doesNotMatch(html, /<b>x<\/b>|<i>n<\/i>|<b>rama<\/b>/);
  assert.match(html, /&lt;\/script&gt;&lt;script&gt;alert\(1\)/);
  assert.equal(embedded(html).state.zones[0].uncovered[0], evil, 'el JSON incrustado conserva el texto original');
});

test('sin overview.json no genera nada', () => {
  const root = repo({ config: null });
  assert.equal(render({ root }), null);
  assert.equal(existsSync(join(root, '.rsc', 'overview', 'overview.html')), false);
});

test('por CLI, render calcula el estado si falta y escribe el HTML; show no abre nada con --no-open', () => {
  const root = dashboardRepo();
  const r = spawnSync(process.execPath, [ENGINE, 'render', '--no-gh', '--root', root], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  const file = join(root, '.rsc', 'overview', 'overview.html');
  assert.equal(r.stdout.trim(), file);
  assert.equal(embedded(readFileSync(file, 'utf8')).state.zones.length, 4);
  const s = spawnSync(process.execPath, [ENGINE, 'show', '--no-gh', '--no-open', '--root', root], { encoding: 'utf8' });
  assert.equal(s.status, 0, s.stderr);
  assert.equal(s.stdout.trim(), file);
});
