import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { pendingPlugins, pluginCommands, pluginNotice } from '../targets/plugin-check.mjs';

// El harness escribe `enabledPlugins` y `extraKnownMarketplaces` en .claude/settings.json, pero
// eso no instala nada: Claude Code solo carga un plugin que esté en installed_plugins.json. Sin
// aviso, la persona cree que tiene skins, context-bar… y no tiene ninguno.
const HERE = dirname(fileURLToPath(import.meta.url));

function project(enabled, markets = {}) {
  const root = mkdtempSync(join(tmpdir(), 'rsc-plug-proj-'));
  mkdirSync(join(root, '.claude'), { recursive: true });
  mkdirSync(join(root, '.rsc'), { recursive: true });
  writeFileSync(join(root, '.claude', 'settings.json'),
    JSON.stringify({ enabledPlugins: enabled, extraKnownMarketplaces: markets }));
  return root;
}

function claudeDir({ installed = {}, known = {} } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'rsc-plug-home-'));
  mkdirSync(join(dir, 'plugins'), { recursive: true });
  writeFileSync(join(dir, 'plugins', 'installed_plugins.json'), JSON.stringify({ version: 2, plugins: installed }));
  writeFileSync(join(dir, 'plugins', 'known_marketplaces.json'), JSON.stringify(known));
  return dir;
}

const MARKETS = {
  'hellosverre-mods': { source: { source: 'github', repo: 'hellosverre/claude-skins' } },
  'harness-mods': { source: { source: 'github', repo: 'damiangilgonzalez1995/rsc-harness' } },
};

test('un plugin activado que no está en installed_plugins.json queda pendiente', () => {
  const root = project({ 'skins@hellosverre-mods': true, 'context-bar@harness-mods': true }, MARKETS);
  const dir = claudeDir({ installed: { 'skins@hellosverre-mods': [{ scope: 'user' }] }, known: { 'hellosverre-mods': {} } });
  const p = pendingPlugins(root, dir);
  assert.deepEqual(p.plugins, ['context-bar@harness-mods']);
  assert.deepEqual(p.marketplaces, [{ name: 'harness-mods', repo: 'damiangilgonzalez1995/rsc-harness' }]);
});

test('un plugin retirado no se pide instalar aunque un settings.json viejo lo active', () => {
  const root = project({ 'modelo-justo@harness-mods': true }, MARKETS);
  assert.deepEqual(pendingPlugins(root, claudeDir()).plugins, []);
});

test('un `false` puesto a mano no cuenta como pendiente', () => {
  const root = project({ 'skins@hellosverre-mods': false }, MARKETS);
  assert.deepEqual(pendingPlugins(root, claudeDir()).plugins, []);
});

test('instalado con scope project solo cuenta para ese mismo proyecto', () => {
  const root = project({ 'skins@hellosverre-mods': true }, MARKETS);
  const otro = claudeDir({ installed: { 'skins@hellosverre-mods': [{ scope: 'project', projectPath: '/otro/sitio' }] } });
  assert.deepEqual(pendingPlugins(root, otro).plugins, ['skins@hellosverre-mods']);
  const este = claudeDir({ installed: { 'skins@hellosverre-mods': [{ scope: 'local', projectPath: root[0].toLowerCase() + root.slice(1) }] } });
  assert.deepEqual(pendingPlugins(root, este).plugins, []);
});

test('un marketplace ya conocido no se vuelve a añadir', () => {
  const root = project({ 'context-bar@harness-mods': true }, MARKETS);
  const dir = claudeDir({ known: { 'harness-mods': {} } });
  assert.deepEqual(pendingPlugins(root, dir).marketplaces, []);
});

test('sin Claude Code instalado todavía (no hay installed_plugins.json), todo queda pendiente', () => {
  const root = project({ 'skins@hellosverre-mods': true }, MARKETS);
  const empty = mkdtempSync(join(tmpdir(), 'rsc-plug-empty-'));
  assert.deepEqual(pendingPlugins(root, empty).plugins, ['skins@hellosverre-mods']);
});

test('sin settings.json no hay nada pendiente y no rompe', () => {
  const root = mkdtempSync(join(tmpdir(), 'rsc-plug-none-'));
  assert.deepEqual(pendingPlugins(root, claudeDir()), { plugins: [], marketplaces: [] });
});

test('los comandos añaden primero el marketplace y luego instalan con scope user', () => {
  const cmds = pluginCommands({ plugins: ['context-bar@harness-mods'], marketplaces: [{ name: 'harness-mods', repo: 'damiangilgonzalez1995/rsc-harness' }] });
  assert.deepEqual(cmds, [
    'claude plugin marketplace add damiangilgonzalez1995/rsc-harness',
    'claude plugin install context-bar@harness-mods --scope user',
  ]);
  assert.equal(pluginNotice({ plugins: [], marketplaces: [] }), '');
  assert.match(pluginNotice({ plugins: ['context-bar@harness-mods'], marketplaces: [] }), /context-bar@harness-mods --scope user/);
});

test('el hook de inicio de sesión avisa mientras falten plugins y calla con .rsc/.no-plugin-check', () => {
  const root = project({ 'skins@hellosverre-mods': true }, MARKETS);
  const home = mkdtempSync(join(tmpdir(), 'rsc-plug-hh-'));
  const run = () => {
    const env = { ...process.env, HOME: home, USERPROFILE: home, CLAUDE_CONFIG_DIR: claudeDir() };
    const r = spawnSync('node', [join(HERE, '..', 'targets', 'session-start.mjs'),
      join(HERE, '..', 'skills', 'suggest', 'SKILL.md'), root], { encoding: 'utf8', env, input: '' });
    return r.stdout;
  };
  assert.match(run(), /rsc plugins sin instalar[\s\S]*claude plugin install skins@hellosverre-mods --scope user/);
  writeFileSync(join(root, '.rsc', '.no-plugin-check'), '');
  assert.doesNotMatch(run(), /rsc plugins sin instalar/);
});
