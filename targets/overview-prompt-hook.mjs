#!/usr/bin/env node
// rsc UserPromptSubmit hook (claude): las skills que el usuario lanza escribiendo `/security-scan` no
// pasan por la herramienta Skill, así que este hook mira si el prompt EMPIEZA por `/<id>` y registra
// igual que overview-skill-hook. El resto del prompt puede pedir el scope ("global", "la PR #41").
//
// Invocado como `node overview-prompt-hook.mjs <projectRoot>` a través del bootstrap, en modo quiet.
// Su stdout entraría en el contexto de cada turno, así que no escribe nada nunca, y sale con 0 pase
// lo que pase. Importa el motor y hook-once como hermanos en .rsc/.
const root = process.argv[2] || process.cwd();

try {
  const { readHookInput, claimOnce } = await import('./hook-once.mjs');
  const hook = readHookInput();
  const m = typeof hook.prompt === 'string' ? hook.prompt.match(/^\s*\/([^\s]+)(?:\s+([\s\S]*))?$/) : null;
  // El id se valida en el motor contra ^[a-z0-9:_-]+$ antes de tocar un nombre de fichero.
  if (m) {
    // rsc cableado en dos scopes dispara esto dos veces por prompt. prompt_id es único por turno e
    // igual en los dos; Claude Code antiguo no lo manda, y entonces la clave sale del texto (como en
    // userprompt-gate.mjs).
    const turnKey = hook.prompt_id || `p${hook.prompt.length}:${hook.prompt.slice(0, 64)}`;
    const once = !hook.session_id || claimOnce(`overview-prompt:${hook.session_id}:${turnKey}`);
    if (once) {
      const { hookRecord } = await import('./overview.mjs');
      hookRecord({ root, skill: m[1], text: m[2] || '' });
    }
  }
} catch {
  // fail-open: el registro nunca frena un turno
}
process.exitCode = 0;
