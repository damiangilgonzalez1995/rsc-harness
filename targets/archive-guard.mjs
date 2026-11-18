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
// The one exception is moving things INTO it (mkdir, mv, git mv with the archive as destination):
// archiving is the only job that has to name the folder. Moving something back OUT is reading it.
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

try {
  if (existsSync(join(root, '.rsc', '.no-archive-guard'))) allow();

  const input = JSON.parse(readFileSync(0, 'utf8') || '{}');
  const tool = input.tool_name || input.toolName || '';
  const args = input.tool_input || input.toolInput || {};

  const slash = (p) => p.replace(/\\/g, '/');
  const fold = (p) => (process.platform === 'win32' ? p.toLowerCase() : p);
  const archive = fold(slash(resolve(root, 'docs', 'archive')));
  const inArchive = (p) => {
    if (typeof p !== 'string' || !p) return false;
    const abs = fold(slash(isAbsolute(p) ? resolve(p) : resolve(root, p)));
    return abs === archive || abs.startsWith(`${archive}/`);
  };
  // A path written inside a command or a glob, absolute or relative to the root.
  const MENTION = /(^|[\s"'=(/\\])docs[\\/]archive([\\/]|$|[\s"')*])/i;

  if (['Read', 'Edit', 'MultiEdit', 'Write'].includes(tool)) {
    if (inArchive(args.file_path)) deny();
  } else if (tool === 'NotebookEdit') {
    if (inArchive(args.notebook_path)) deny();
  } else if (tool === 'Grep' || tool === 'Glob') {
    if (inArchive(args.path) || MENTION.test(` ${slash(args.pattern || '')}`) || MENTION.test(` ${slash(args.glob || '')}`)) deny();
  } else if (tool === 'Bash' || tool === 'PowerShell') {
    const command = typeof args.command === 'string' ? args.command : '';
    if (MENTION.test(command) && !onlyArchives(command)) deny();
  }
} catch { /* fail open */ }
allow();

// Every segment that names the archive is a mkdir of it or a move whose LAST argument is in it.
function onlyArchives(command) {
  const segments = command.split(/&&|\|\||;|\||\n/).map((s) => s.trim()).filter(Boolean);
  return segments.every((seg) => {
    if (!/docs[\\/]archive/i.test(seg)) return true;
    const tokens = seg.split(/\s+/).map((t) => t.replace(/^['"]|['"]$/g, ''));
    const verb = tokens[0] === 'git' ? `git ${tokens[1]}` : tokens[0];
    const operands = tokens.slice(verb.startsWith('git ') ? 2 : 1).filter((t) => !t.startsWith('-'));
    const named = (t) => /(^|[\\/])docs[\\/]archive([\\/]|$)/i.test(t);
    if (/^mkdir$/i.test(verb) || (/^New-Item$/i.test(verb) && /Directory/i.test(seg))) return true;
    if (/^(mv|git mv|Move-Item)$/i.test(verb) && operands.length >= 2) {
      const dest = operands[operands.length - 1];
      return named(dest) && !operands.slice(0, -1).some(named);
    }
    return false;
  });
}
