#!/usr/bin/env node
// rsc Archive guard (claude). Wired by targets/claude.js onto PreToolUse as `node ...`.
//   argv[2] = absolute project root   stdin = PreToolUse hook JSON
//
// docs/archive/ is where the `sweep` skill moves context that git proved stale: TODOs already done,
// tickets that shipped, wiki pages the code contradicts. Archived, not deleted, so a person can still
// open it. An agent that reads it is back to obeying dead instructions, which is the side quest the
// archive exists to stop, so this guard DENIES looking inside it: Read, Grep, Glob, Edit, Write,
// NotebookEdit, and any shell command that names the folder.
//
// The one exception is putting things INTO it (mkdir, mv/git mv with the archive as destination,
// git add/commit): archiving is the only job that has to name the folder. Moving something back OUT
// is reading it. A Grep with no path cannot be filtered here; `sweep` adds `docs/archive/` to the
// root `.ignore`, which ripgrep honours, for that case.
//
// Off per project with .rsc/.no-archive-guard. Fail-open on any internal error.
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve, isAbsolute } from 'node:path';

const root = process.argv[2] || process.cwd();
const allow = () => process.exit(0);

function deny() {
  const reason = 'docs/archive/ guarda contexto que sweep comprobó obsoleto: un agente no lo lee ni lo '
    + 'edita, para no volver a obedecer instrucciones muertas. Si de verdad hace falta, que lo abra una '
    + 'persona, o que la persona cree .rsc/.no-archive-guard.';
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason },
  }));
  process.exit(0);
}

// The archive named in free text: a path, a glob, a git `rev:path`. Same shape everywhere.
const MENTION = /(^|[\s"'=(/\\:])docs[\\/]archive([\\/]|$|[\s"')*])/i;
// A path pattern that walks into some folder called "archive".
const ARCHIVE_SEGMENT = /(^|[\\/])archive([\\/]|$)/i;
// The value of a message flag is text, not a read (same rule as danger-guard).
const MESSAGE_FLAG = /(\s(?:-m|--message|-b|--body|-t|--title)(?:\s+|=))("(?:[^"\\]|\\[\s\S])*"|'[^']*')/g;

try {
  if (existsSync(join(root, '.rsc', '.no-archive-guard'))) allow();

  const input = JSON.parse(readFileSync(0, 'utf8') || '{}');
  const tool = input.tool_name || input.toolName || '';
  const args = input.tool_input || input.toolInput || {};

  const slash = (p) => p.replace(/\\/g, '/');
  const fold = (p) => (process.platform === 'win32' ? p.toLowerCase() : p);
  const absolute = (p) => fold(slash(isAbsolute(p) ? resolve(p) : resolve(root, p)));
  const archive = absolute(join('docs', 'archive'));
  const inArchive = (p) => typeof p === 'string' && p !== ''
    && (absolute(p) === archive || absolute(p).startsWith(`${archive}/`));
  const aboveArchive = (p) => archive.startsWith(`${absolute(typeof p === 'string' && p ? p : '.')}/`);
  const strings = (...v) => v.filter((x) => typeof x === 'string').map(slash);

  if (['Read', 'Edit', 'MultiEdit', 'Write'].includes(tool)) {
    if (inArchive(args.file_path)) deny();
  } else if (tool === 'NotebookEdit') {
    if (inArchive(args.notebook_path)) deny();
  } else if (tool === 'Grep' || tool === 'Glob') {
    if (inArchive(args.path)) deny();
    if (strings(args.pattern, args.glob).some((p) => MENTION.test(` ${p}`))) deny();
    // Glob's pattern and Grep's glob are paths; Grep's pattern is a regex over contents.
    const pathPatterns = tool === 'Glob' ? strings(args.pattern, args.glob) : strings(args.glob);
    if (aboveArchive(args.path) && pathPatterns.some((p) => ARCHIVE_SEGMENT.test(p))) deny();
  } else if (tool === 'Bash' || tool === 'PowerShell') {
    const command = typeof args.command === 'string' ? args.command.replace(MESSAGE_FLAG, '$1""') : '';
    if (MENTION.test(command) && !onlyArchives(command)) deny();
  }
} catch { /* fail open */ }
allow();

// Split on whitespace outside quotes, dropping the quotes: `git mv "a b.md" docs/archive/`.
function tokenize(segment) {
  const out = [];
  let cur = '';
  let quote = null;
  for (const c of segment) {
    if (quote) { if (c === quote) quote = null; else cur += c; continue; }
    if (c === '"' || c === "'") { quote = c; continue; }
    if (/\s/.test(c)) { if (cur) out.push(cur); cur = ''; continue; }
    cur += c;
  }
  if (cur) out.push(cur);
  return out;
}

// Every segment that names the archive only puts things INTO it. A command substitution can hide
// a read inside an otherwise innocent mkdir, so its presence alone disqualifies the command.
function onlyArchives(command) {
  if (/\$\(|`|<\(/.test(command)) return false;
  const named = (t) => MENTION.test(` ${t}`);
  const segments = command.split(/&&|\|\||;|\||\n/).map((s) => s.trim()).filter(Boolean);
  return segments.every((seg) => {
    if (!named(seg)) return true;
    const tokens = tokenize(seg);
    const verb = tokens[0] === 'git' ? `git ${tokens[1]}` : tokens[0];
    const operands = tokens.slice(verb.startsWith('git ') ? 2 : 1).filter((t) => !t.startsWith('-'));
    if (/^mkdir$/i.test(verb) || (/^New-Item$/i.test(verb) && /Directory/i.test(seg))) return true;
    if (/^git (add|commit)$/i.test(verb)) return true;
    if (/^(mv|git mv|Move-Item)$/i.test(verb) && operands.length >= 2) {
      const dest = operands[operands.length - 1];
      return named(dest) && !operands.slice(0, -1).some(named);
    }
    return false;
  });
}
