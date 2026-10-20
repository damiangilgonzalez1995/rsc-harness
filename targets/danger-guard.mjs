#!/usr/bin/env node
// rsc Danger guard (claude). Wired by targets/claude.js onto PreToolUse (matcher Bash|PowerShell)
// as `node ...` so it runs on every platform including Windows.
//   argv[2] = absolute project root   stdin = PreToolUse hook JSON
//
// It catches irreversible, foot-gun shell commands and puts a HUMAN in front of them. What it does
// depends on docs/wiki/harness/user-profile.md -> technical_level:
//   - technical      -> never guarded.
//   - mixed          -> not blocked: the command goes through the normal permission flow, with a
//                       one-line warning that names the risk.
//   - non-technical  -> `ask`: Claude Code shows the user a confirmation. Their approval IS the
//     or no profile     explicit order that unblocks it (default-safe: no profile = assume
//                       non-technical, so the guard is ON).
//
// It used to `deny` for everyone below `technical`, with a reason that began "BLOCKED for a
// non-technical user". In real sessions that denied ~20 `rm -rf` / `git branch -D` the user had
// just asked for in so many words ("bórrala"): a deny cannot be overridden from the conversation,
// so the order never reached the shell, and the label sent the agent into over-explaining to
// someone it had just been told was not technical. `ask` keeps the stop and lets the person
// decide; the message describes the COMMAND's risk and never the user.
//
// Disable per project with .rsc/.no-danger-guard — only when the USER explicitly asks for it.
// Fail-open on any internal error (never brick a shell).
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.argv[2] || process.cwd();

function allow() { process.exit(0); }
// `ask` is the human gate; `mixed` gets a warning and no decision at all, so whatever permission
// rules the project already has still apply (an explicit `allow` here would bypass them).
function stop(why) {
  const reason = `Este comando ${why}. No se puede deshacer: confirma solo si es lo que quieres.`;
  const out = level === 'mixed'
    ? { systemMessage: `Aviso: este comando ${why}.` }
    : { hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'ask', permissionDecisionReason: reason } };
  process.stdout.write(JSON.stringify(out));
  process.exit(0);
}

if (existsSync(join(root, '.rsc', '.no-danger-guard'))) allow();

function technicalLevel() {
  try {
    const txt = readFileSync(join(root, 'docs', 'wiki', 'harness', 'user-profile.md'), 'utf8');
    const m = txt.match(/technical_level:\s*([a-z-]+)/i);
    return m ? m[1].toLowerCase() : null;
  } catch { return null; }
}
const level = technicalLevel();
if (level === 'technical') allow();

// Only shell commands can be dangerous here.
let input = {};
try { input = JSON.parse(readFileSync(0, 'utf8') || '{}'); } catch { allow(); }
if (!['Bash', 'PowerShell'].includes(input.tool_name || input.toolName)) allow();
const raw = input.tool_input?.command || input.toolInput?.command || '';
if (typeof raw !== 'string' || !raw) allow();

// --- text that is written, not run ------------------------------------------
// A heredoc body or the value of a message flag is DATA: `cat > doc.md <<'EOF' … rm -rf … EOF`,
// `git commit -m "… rm -rf …"`, `gh pr create --body "| rm -rf /agent |"`. The guard matched all of
// them — a markdown table even splits on `|` into a segment that starts with `rm`. They are stripped
// before any rule looks at the command. A heredoc fed to something that EXECUTES it (a shell, a SQL
// client, mongosh) keeps its body: `bash <<EOF rm -rf / EOF` really does delete.
const INTERPRETER = /(^|[\s|;&(])(sudo\s+)?(bash|sh|zsh|dash|ksh|psql|mysql|mariadb|sqlite3|mongosh|mongo|duckdb|clickhouse-client)(?=\s|$)/;
function stripHeredocs(text) {
  const lines = text.split('\n');
  const out = [];
  for (let i = 0; i < lines.length; i += 1) {
    out.push(lines[i]);
    const m = lines[i].match(/(?<!<)<<(?!<)-?\s*(['"]?)([A-Za-z_][\w.-]*)\1/);
    if (!m) continue;
    let end = i + 1;
    while (end < lines.length && lines[end].trim() !== m[2]) end += 1;
    if (end >= lines.length) continue; // unterminated: leave it, judge what is there
    if (INTERPRETER.test(lines[i])) out.push(...lines.slice(i + 1, end));
    out.push(lines[end]);
    i = end;
  }
  return out.join('\n');
}
const MESSAGE_FLAG = /(\s(?:-m|--message|-b|--body|-t|--title|--notes|--description)(?:\s+|=))("(?:[^"\\]|\\[\s\S])*"|'[^']*')/g;
const cmd = stripHeredocs(raw).replace(MESSAGE_FLAG, '$1""');

// --- the dangerous-command list ---------------------------------------------
// High-signal, low-false-positive. Each rule: what it catches and the plain why.
const noWhere = (verbRe) => verbRe.test(cmd) && !/\bwhere\b/i.test(cmd);

// A flag is a whitespace-separated token that BEGINS with a dash. That sounds obvious, and the
// first version of this rule got it wrong in a way that cost real trust: it tested
// /-[a-z]*r[a-z]*\b/ and /-[a-z]*f[a-z]*\b/ against the ENTIRE command string, so any hyphenated
// path segment carrying an "r" and an "f" read as the flags -r and -f. The segment `-fixture` alone
// satisfies both (f-i-x-t-u-r-e), so `rm skills/zz-case-fixture/SKILL.md` and `rm my-draft.md` were
// DENIED with the reason "rm with -r and -f" — a claim that was false about the command in front of
// it. It also denied commands that merely QUOTED a dangerous one, which is the same mistake the
// gitmoji guard had to fix: blocking the conversation about a command, not the command.
//
// That is worse than a nuisance. The deny message ends by telling the user how to switch this guard
// OFF, so crying wolf on a single-file delete is an active instruction to disable the thing that
// stops a real recursive wipe. Friction has to stay proportional to risk or the protection gets
// turned off (P7), and a denial's stated reason has to be true (P6).
//
// Flags are also scoped to the segment that actually runs rm: `rm notes.md && ls -lrtF` carries an
// r and an F, but they belong to ls.
function rmFlagsIn(segment) {
  return segment.split(/\s+/).filter((t) => /^--?[A-Za-z]/.test(t));
}

// Wrappers that stand in front of the real command without being it. A shell with -c is included
// deliberately: `bash -c "rm -rf /"` DOES run the delete, and dropping it would have been the hole
// this rewrite opened while fixing the over-fire.
const WRAPPERS = /^(sudo|doas|env|command|time|nohup|xargs)$/i;
const SHELLS = /^(bash|sh|zsh|dash|ksh)$/i;

// `rm` has to be the command being EXECUTED, not a word inside someone else's argument. Without
// this, `echo "never run rm -rf /"` was denied — the guard blocking the conversation about a
// command instead of the command, exactly the defect the gitmoji guard had to fix with its own
// RUNS_GIT check. A guard that argues with you about a sentence is a guard you turn off.
//
// Split on shell separators that are OUTSIDE quotes. Splitting the raw string cut `echo "a | rm -rf x"`
// into a segment that begins with `rm`.
function splitTopLevel(text) {
  const parts = [];
  let cur = '';
  let quote = null;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (quote) {
      if (c === '\\' && quote === '"') { cur += c + (text[i + 1] ?? ''); i += 1; continue; }
      if (c === quote) quote = null;
      cur += c;
      continue;
    }
    if (c === '"' || c === "'") { quote = c; cur += c; continue; }
    if (c === '\n' || c === ';' || c === '|' || c === '&') { parts.push(cur); cur = ''; continue; }
    cur += c;
  }
  parts.push(cur);
  return parts;
}

// Is this segment a recursive force delete? A shell with -c is walked INTO — `bash -c "cd x && rm -rf y"`
// really deletes — by judging its quoted script the same way, a few levels deep at most.
function segmentIsRmRf(segment, depth) {
  const tokens = segment.trim().split(/\s+/).filter(Boolean);
  let i = 0;
  while (i < tokens.length) {
    const bare = tokens[i].replace(/^['"]/, '');
    if (WRAPPERS.test(bare)) { i += 1; continue; }
    if (SHELLS.test(bare)) {
      i += 1;
      let script = false;
      while (i < tokens.length && /^-/.test(tokens[i])) { if (/c/.test(tokens[i])) script = true; i += 1; }
      if (script && depth < 3) {
        const body = tokens.slice(i).join(' ').replace(/^(['"])([\s\S]*)\1$/, '$2');
        return commandIsRmRf(body, depth + 1);
      }
      continue;
    }
    if (bare !== 'rm' && !bare.endsWith('/rm')) return false;
    const flags = rmFlagsIn(segment);
    const hasR = flags.some((f) => /^--recursive$/i.test(f) || /^-[A-Za-z]*r/i.test(f));
    const hasF = flags.some((f) => /^--force$/i.test(f) || /^-[A-Za-z]*f/i.test(f));
    return hasR && hasF; // -rf / -fr / -Rf / -r -f / --recursive --force
  }
  return false;
}

function commandIsRmRf(text, depth = 0) {
  if (!/\brm\b/.test(text)) return false;
  return splitTopLevel(text).some((segment) => segmentIsRmRf(segment, depth));
}

function isRmRecursiveForce() { return commandIsRmRf(cmd); }

const RULES = [
  { id: 'rm-rf', why: 'borra archivos o carpetas enteras de forma irreversible (rm con -r y -f)', match: isRmRecursiveForce },
  { id: 'find-delete', why: 'borra en masa todos los archivos que encuentra (find … -delete / -exec rm)', match: () => /\bfind\b[^|;&]*(-delete\b|-exec\s+rm\b)/i.test(cmd) },
  { id: 'dd-disk', why: 'sobrescribe un disco entero y puede destruir todo lo que contiene (dd of=/dev/…)', match: () => /\bdd\b[^|;&]*\bof=\/dev\//i.test(cmd) },
  { id: 'mkfs', why: 'formatea un sistema de archivos y borra todo lo que hay en él (mkfs)', match: () => /\bmkfs(\.\w+)?\b/i.test(cmd) },
  { id: 'curl-pipe-shell', why: 'ejecuta un script descargado sin revisarlo (curl | bash): código que no conocemos', match: () => /\b(curl|wget)\b[^|]*\|\s*(sudo\s+)?(sh|bash|zsh)\b/i.test(cmd) },

  { id: 'git-push-force', why: 'reescribe en el remoto el historial compartido, para todos (git push --force)', match: () => /\bgit\s+push\b[^|;&]*(--force(?!-with-lease)\b|\s-f\b)/i.test(cmd) },
  { id: 'git-reset-hard', why: 'descarta todo el trabajo sin commitear y no hay forma de recuperarlo (git reset --hard)', match: () => /\bgit\s+reset\b[^|;&]*--hard\b/i.test(cmd) },
  { id: 'git-clean', why: 'borra para siempre los archivos que git no sigue (git clean -f)', match: () => /\bgit\s+clean\b[^|;&]*-[a-z]*f/i.test(cmd) },
  { id: 'git-branch-D', why: 'borra una rama aunque su trabajo no esté fusionado (git branch -D)', match: () => /\bgit\s+branch\b[^|;&]*\s-D\b/.test(cmd) },

  { id: 'sql-drop', why: 'elimina una base de datos, esquema o tabla entera (DROP …)', match: () => /\bdrop\s+(database|schema|table)\b/i.test(cmd) },
  { id: 'sql-truncate', why: 'vacía una tabla entera (TRUNCATE)', match: () => /\btruncate\s+(table\s+)?\S/i.test(cmd) },
  { id: 'sql-delete-no-where', why: 'borra todas las filas: es un DELETE sin WHERE', match: () => noWhere(/\bdelete\s+from\s+\S/i) },
  { id: 'sql-update-no-where', why: 'reescribe todas las filas: es un UPDATE sin WHERE', match: () => noWhere(/\bupdate\s+\S+\s+set\b/i) },
  { id: 'mongo-wipe', why: 'elimina una colección o base de datos, o todos sus documentos (drop()/dropDatabase/deleteMany({}))', match: () => /\.drop\(\s*\)|dropdatabase\s*\(|deletemany\(\s*\{\s*\}\s*\)|\.remove\(\s*\{\s*\}\s*\)/i.test(cmd) },
];

for (const rule of RULES) {
  try { if (rule.match()) stop(rule.why); } catch { /* a rule erroring must never block */ }
}

allow();
