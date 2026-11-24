// ¿Qué plugins deja activados el harness que Claude Code no tiene instalados?
//
// `wireHook` escribe `enabledPlugins` y `extraKnownMarketplaces` en .claude/settings.json, pero eso
// solo declara: Claude Code carga un plugin cuando figura en ~/.claude/plugins/installed_plugins.json.
// Sin este aviso la persona cree que tiene skins, context-bar… y no tiene ninguno, sin pista de por qué.
//
// Viaja como hermano en .rsc/plugin-check.mjs (lo importa session-start.mjs) y lo usa también el
// instalador. Sin dependencias y fail-open: cualquier error devuelve "nada pendiente".
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { homedir } from 'node:os';

// Mods que el harness activaba y ya no existen. Al reinstalar, claude.js los quita de `enabledPlugins`;
// hasta entonces este aviso no debe pedir instalar algo que el marketplace ya no tiene.
// `modelo-justo` (selección dinámica de Haiku/Sonnet/Opus) se retiró del harness.
export const RETIRED_PLUGINS = Object.freeze(['modelo-justo@harness-mods']);

const readJson = (file) => { try { return JSON.parse(readFileSync(file, 'utf8')); } catch { return null; } };

// Windows guarda la misma ruta como `D:\…` y `d:\…` según quién la escribió.
const samePath = (a, b) => {
  const norm = (p) => resolve(String(p)).replace(/[\\/]+$/, '');
  return process.platform === 'win32' ? norm(a).toLowerCase() === norm(b).toLowerCase() : norm(a) === norm(b);
};

export function claudeConfigDir() {
  return process.env.CLAUDE_CONFIG_DIR || join(homedir(), '.claude');
}

// → { plugins: ['id@marketplace', …], marketplaces: [{ name, repo }, …] }
export function pendingPlugins(projectRoot, configDir = claudeConfigDir()) {
  try {
    const settings = readJson(join(projectRoot, '.claude', 'settings.json')) || {};
    const enabled = Object.entries(settings.enabledPlugins || {}).filter(([id, on]) => on === true && !RETIRED_PLUGINS.includes(id)).map(([id]) => id);
    if (!enabled.length) return { plugins: [], marketplaces: [] };

    const installed = readJson(join(configDir, 'plugins', 'installed_plugins.json'))?.plugins || {};
    const isInstalled = (id) => (installed[id] || []).some((e) =>
      e.scope === 'user' || (e.projectPath && samePath(e.projectPath, projectRoot)));
    const plugins = enabled.filter((id) => !isInstalled(id)).sort();

    const known = readJson(join(configDir, 'plugins', 'known_marketplaces.json')) || {};
    const declared = settings.extraKnownMarketplaces || {};
    const names = [...new Set(plugins.map((id) => id.split('@')[1]).filter(Boolean))].sort();
    const marketplaces = names
      .filter((name) => !known[name] && declared[name]?.source?.repo)
      .map((name) => ({ name, repo: declared[name].source.repo }));
    return { plugins, marketplaces };
  } catch {
    return { plugins: [], marketplaces: [] };
  }
}

export function pluginCommands({ plugins, marketplaces }) {
  return [
    ...marketplaces.map((m) => `claude plugin marketplace add ${m.repo}`),
    ...plugins.map((id) => `claude plugin install ${id} --scope user`),
  ];
}

// Bloque para el SessionStart (lo lee el agente, que debe decírselo a la persona).
export function pluginNotice(pending) {
  if (!pending.plugins.length) return '';
  return `
===== rsc plugins sin instalar =====
This project enables ${pending.plugins.length} Claude Code plugin(s) that are NOT installed on this
machine, so they are not running: ${pending.plugins.join(', ')}.
Enabling a plugin in .claude/settings.json does not install it.
ACTION: tell the user in one line, in their language, and offer to run (one per line):
${pluginCommands(pending).map((c) => `  ${c}`).join('\n')}
Then they must restart Claude Code. Opt out: create .rsc/.no-plugin-check.
====================================
`;
}
