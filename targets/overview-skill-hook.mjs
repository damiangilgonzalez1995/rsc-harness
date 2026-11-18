#!/usr/bin/env node
// rsc PostToolUse(Skill) hook (claude): apunta en docs/overview/reviews/ cada skill de revisión que
// se lanza con la herramienta Skill. Qué skills revisan qué lo dice el overview.json del proyecto, no
// una lista fija; sin overview.json no hace nada.
//
// Invocado como `node overview-skill-hook.mjs <projectRoot>` a través del bootstrap, en modo quiet.
// Corre en el camino de cada llamada a una skill, así que nunca habla, nunca falla y siempre sale con
// 0. Importa el motor y hook-once como HERMANOS en .rsc/: wireHook los copia a su lado. Si falta
// alguno, se calla.
const root = process.argv[2] || process.cwd();

try {
  const { readHookInput, claimOnce } = await import('./hook-once.mjs');
  const hook = readHookInput();
  const input = hook.tool_input && typeof hook.tool_input === 'object' ? hook.tool_input : {};
  // rsc cableado en el scope de usuario y en el de proyecto dispara esto dos veces por llamada.
  // tool_use_id es único por llamada e igual en los dos scopes.
  const once = !hook.session_id || !hook.tool_use_id || claimOnce(`overview-skill:${hook.session_id}:${hook.tool_use_id}`);
  if (once && typeof input.skill === 'string') {
    const { hookRecord } = await import('./overview.mjs');
    hookRecord({ root, skill: input.skill, text: typeof input.args === 'string' ? input.args : '' });
  }
} catch {
  // fail-open: el registro nunca estorba a la skill
}
process.exitCode = 0;
