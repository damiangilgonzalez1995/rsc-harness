// hook-once.mjs — cross-scope single-shot guard for rsc hooks.
//
// rsc can be wired in more than one scope at once (user-level ~/.claude/settings.json AND
// project-level .claude/settings.json). Each scope runs its OWN copy of the hook scripts, so
// the same always-on body and the same SDD gate get injected twice — once per scope. wireHook()
// is idempotent within a settings file but blind to the other one, so the duplication cannot be
// solved at install time; it has to be solved at injection time.
//
// The marker therefore CANNOT live in `.rsc/` — each scope has its own root, which is the whole
// problem. It lives in a per-user directory under the OS temp dir, which both scopes can see.
//
// Claude Code gives every hook the same `session_id` for both scopes, and the same `prompt_id`
// within one turn (docs: code.claude.com/docs/en/hooks). That is the dedup key.
//
// Fail-open is the rule throughout: if anything about this mechanism misbehaves, the hook prints.
// A duplicated block costs context; a swallowed always-on layer costs the session its behaviour.
import { mkdirSync, writeFileSync, statSync, readdirSync, unlinkSync, utimesSync, readFileSync } from 'node:fs';
import { tmpdir, userInfo } from 'node:os';
import { join } from 'node:path';

const PRUNE_AFTER_MS = 24 * 3600 * 1000;

// Per-user so two accounts on one machine never share (or suppress) each other's markers.
// RSC_HOOK_MARKER_DIR overrides it so tests get an isolated directory per case.
export function markerDir() {
  if (process.env.RSC_HOOK_MARKER_DIR) {
    const dir = process.env.RSC_HOOK_MARKER_DIR;
    mkdirSync(dir, { recursive: true, mode: 0o700 });
    return dir;
  }
  let uid = 'anon';
  try { uid = String(userInfo().uid ?? userInfo().username ?? 'anon'); } catch { /* keep anon */ }
  const dir = join(tmpdir(), `rsc-hooks-${uid}`);
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  return dir;
}

// Keys are built from hook payload values, so they can contain anything. Flatten to a safe
// filename — a key must never be able to point outside the marker directory.
function safeName(key) {
  return String(key).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 200);
}

// Drop markers from previous days so the directory cannot grow without bound. Best-effort.
function prune(dir, now) {
  try {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      try {
        if (now - statSync(p).mtimeMs > PRUNE_AFTER_MS) unlinkSync(p);
      } catch { /* raced with another hook — fine */ }
    }
  } catch { /* unreadable dir — fine */ }
}

/**
 * Claim the right to emit `key` once.
 *
 * @returns true if this process should print, false if another scope already did.
 *
 * `windowMs` bounds how long a claim lasts. Two scopes fire within milliseconds of each other,
 * while two genuine repeats of the same event (two compactions in one session, which reuse
 * session_id AND source) are minutes apart — so an expired marker means "new event", not
 * "duplicate". This window is the one heuristic in the design, and only SessionStart needs it:
 * UserPromptSubmit keys on prompt_id, which is already unique per turn.
 */
export function claimOnce(key, { dir = markerDir(), windowMs = 30_000, now = Date.now() } = {}) {
  try {
    const file = join(dir, safeName(key));
    try {
      // Atomic create: whichever scope gets here first is the one that prints.
      writeFileSync(file, String(now), { flag: 'wx' });
      prune(dir, now);
      return true;
    } catch {
      // Marker exists. Fresh → someone else already emitted this exact event.
      const age = now - statSync(file).mtimeMs;
      if (age <= windowMs) return false;
      // Stale → this is a new occurrence of the same key. Re-arm and print.
      const stamp = new Date(now);
      utimesSync(file, stamp, stamp);
      return true;
    }
  } catch {
    return true; // fail-open
  }
}

// The workflow gate text lives here, not inline in userprompt-gate.mjs, so it has exactly one
// definition: the hook emits it and `rsc doctor` measures it from the same constant. Anything
// that reports a byte count for text it does not own drifts the moment the text changes.
export const WORKFLOW_GATE_TEXT = `===== workflow gate · metodologia (maxima prioridad) =====
Responde en el idioma en que escribe la persona, no en el de este texto.
Si el usuario pide construir, anadir o cambiar algo (en cualquier idioma, se juzga la intencion),
sigue esta cadena ANTES de escribir codigo. Ninguna skill escribe codigo de una feature hasta que
el que esta claro y el usuario ha dado el visto bueno.
1. Aclarar el que:
   - Peticion concreta y acotada -> \`grill-with-docs\`.
   - Tema amplio, o el usuario no sabe como abordarlo -> recomiendale \`wayfinder\`.
   - \`superpowers:brainstorming\` vale para lo mismo si el usuario lo prefiere.
   Cada decision dificil de revertir se registra con \`write-adr\`, en docs/adr/.
2. Escribir la spec: \`to-spec\`, o \`superpowers:brainstorming\` para cerrarla por secciones.
   Sin spec escrita no se programa.
3. Construir: \`superpowers:writing-plans\` -> \`superpowers:executing-plans\`. Spec grande o que
   salio de \`wayfinder\` -> \`to-tickets\` -> \`implement-spec\` (subagentes en paralelo sobre el
   grafo de tickets); un solo ticket suelto -> \`implement\`.
   Si la tarea toca pantalla, invoca ademas \`flujo-interfaz\`: dice que skill de diseno manda.
4. Antes de fusionar: \`code-review\` (estandares del repo + lo que pedia la spec), y el cuerpo
   de la PR con \`pr\` (resumen visual, evidencia antes/despues, peligro de fusion).
Siempre: \`superpowers:test-driven-development\` y \`superpowers:verification-before-completion\`
antes de dar nada por terminado. Los bugs entran por \`superpowers:systematic-debugging\`.
Cambio de una linea, typo o ajuste de configuracion -> hazlo y di que te saltas la cadena.
==========================================================
`;

// Some skills the gate names carry `disable-model-invocation: true`: the Skill tool refuses them,
// so telling the agent to "use `to-spec`" sends it into a refusal and the user ends up typing the
// command anyway. The flag lives in each SKILL.md, so the gate reads it from there at emit time
// instead of keeping a second, hand-written list that drifts. Each flagged id is rendered as the
// slash command the user has to type, plus one line saying so. `roots` are searched in order
// (project, then user scope); the first SKILL.md found decides. Fail-safe: a skill whose file
// cannot be read keeps the current wording — this runs every turn and must never break the gate.
const GATE_ID = /`([a-z][a-z0-9-]*)`/g;
export function renderGate(text, roots = []) {
  const manual = [];
  for (const id of new Set([...text.matchAll(GATE_ID)].map((m) => m[1]))) {
    for (const r of roots) {
      let md;
      try { md = readFileSync(join(r, '.claude', 'skills', id, 'SKILL.md'), 'utf8'); } catch { continue; }
      const fm = md.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      if (fm && /^disable-model-invocation:\s*true\s*$/m.test(fm[1])) manual.push(id);
      break;
    }
  }
  if (!manual.length) return text;
  const flagged = new Set(manual);
  const lines = text.replace(GATE_ID, (m, id) => (flagged.has(id) ? `\`/${id}\`` : m)).split('\n');
  const note = `Las que van con / (${manual.map((id) => `\`/${id}\``).join(', ')}) no las lances tu: la\n` +
    `herramienta Skill las rechaza. Pide al usuario que escriba \`/<skill>\` (p. ej. \`/${manual[0]}\`).`;
  let close = lines.length - 1;
  while (close > 0 && !lines[close].startsWith('=====')) close -= 1;
  if (close <= 0) return `${lines.join('\n')}\n${note}\n`;
  lines.splice(close, 0, note);
  return lines.join('\n');
}

/**
 * Parse the hook payload Claude Code writes to stdin.
 * Pass `raw` explicitly in tests; in a hook, call with no argument to read fd 0.
 * Any problem (no stdin, closed fd, malformed JSON) degrades to {} — callers then fail open.
 */
export function readHookInput(raw) {
  try {
    const text = raw === undefined ? readFileSync(0, 'utf8') : raw;
    if (!text || !text.trim()) return {};
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}
