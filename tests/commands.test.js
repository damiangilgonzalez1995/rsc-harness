import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { applyInstall, uninstall } from '../scripts/install-apply.js';
import { targetPaths } from '../targets/index.js';

let commands = {};
try { commands = await import('../targets/commands.js'); } catch { /* RED: module absent */ }

const repo = () => {
  const cwd = mkdtempSync(join(tmpdir(), 'rsc-commands-'));
  execFileSync('git', ['init', '-q'], { cwd });
  return cwd;
};

test('the fixed catalog contains exactly the approved 10 thin entries', () => {
  assert.equal(typeof commands.fixedCommandNames, 'function');
  assert.deepEqual(commands.fixedCommandNames().sort(), [
    'build-fix', 'checkpoint', 'harness-audit', 'learn', 'refactor-clean',
    'resume-session', 'save-session', 'security-scan', 'test-coverage', 'update-docs',
  ].sort());
});

test('resolution follows installed backing and Claude does not duplicate skill commands', () => {
  const input = {
    skills: ['go', 'security-scan', 'testing-go'],
    agents: ['go-reviewer', 'go-build-resolver'],
    memoryMode: 'unsupported',
  };
  const cursor = commands.resolveCommands({ target: 'cursor', ...input }).map((c) => c.name);
  assert.ok(cursor.includes('security-scan'));
  assert.ok(cursor.includes('go-review'));
  assert.ok(cursor.includes('go-build'));
  assert.ok(cursor.includes('test-coverage'));
  assert.ok(!cursor.includes('learn'));

  const claude = commands.resolveCommands({ target: 'claude', ...input }).map((c) => c.name);
  assert.ok(!claude.includes('security-scan'), 'the security-scan skill is already native in Claude');
  assert.ok(!claude.includes('test-coverage'), 'all skill-backed commands are native in Claude');
  assert.ok(claude.includes('go-review'));
  assert.ok(claude.includes('go-build'));
});

test('memory commands exist only when the local memory capability is present', () => {
  const none = commands.resolveCommands({ target: 'cursor', skills: [], agents: [], memoryMode: 'unsupported' });
  const full = commands.resolveCommands({ target: 'cursor', skills: [], agents: [], memoryMode: 'full' });
  for (const name of ['learn', 'save-session', 'resume-session']) {
    assert.ok(!none.some((c) => c.name === name));
    assert.ok(full.some((c) => c.name === name));
  }
});

test('command validator enforces backing, size and a failing mutant', () => {
  assert.deepEqual(commands.validateCommandCatalog(commands.fixedCommands()), []);
  const [first, ...rest] = commands.fixedCommands();
  const mutant = [{ ...first, body: 'Do something else.' }, ...rest];
  assert.ok(commands.validateCommandCatalog(mutant).some((error) => error.includes(first.name)));
});

test('native command targets render their real format and Codex stays unsupported', () => {
  const expected = ['claude', 'cursor', 'gemini', 'opencode', 'copilot', 'windsurf', 'cline', 'roo'];
  assert.deepEqual([...commands.COMMAND_TARGET_IDS].sort(), expected.sort());
  assert.equal(commands.targetHasCommands('codex'), false);
  for (const target of expected) {
    const cwd = repo();
    const resolved = commands.resolveCommands({ target, skills: ['security-scan'], agents: [], memoryMode: 'unsupported' });
    const command = resolved.find((candidate) => candidate.name === 'security-scan');
    if (target === 'claude') {
      assert.equal(command, undefined, 'Claude skips skill-backed security-scan');
      continue;
    }
    const result = commands.reconcileCommands(target, cwd, [], [command]);
    assert.equal(result.written.length, 1, target);
    const path = commands.commandPath(target, cwd, command.name);
    assert.ok(existsSync(path), `${target}: ${path}`);
    const body = readFileSync(path, 'utf8');
    assert.match(body, /security-scan/);
    if (target === 'gemini') assert.match(body, /^prompt = /m);
  }
});

test('install/uninstall reconciles stack aliases and leaves a user command untouched', async () => {
  const cwd = repo();
  const mine = join(cwd, '.cursor', 'commands', 'mine.md');
  mkdirSync(dirname(mine), { recursive: true });
  writeFileSync(mine, 'my command');

  await applyInstall({ skillIds: ['go', 'security-scan'], target: 'cursor', home: cwd, cwd });
  const stateFile = targetPaths('cursor', cwd, cwd).stateFile;
  let state = JSON.parse(readFileSync(stateFile, 'utf8'));
  assert.ok(state.commands.includes('go-review'));
  assert.ok(state.commands.includes('go-build'));
  assert.ok(state.commands.includes('security-scan'));

  await uninstall({ skillIds: ['go'], target: 'cursor', home: cwd, cwd });
  state = JSON.parse(readFileSync(stateFile, 'utf8'));
  assert.ok(!state.commands.includes('go-review'));
  assert.ok(!state.commands.includes('go-build'));
  assert.ok(state.commands.includes('security-scan'));
  assert.equal(readFileSync(mine, 'utf8'), 'my command');
});

test('shared skills expose one alias each toward the same agent', () => {
  const resolved = commands.resolveCommands({
    target: 'cursor',
    skills: ['java', 'spring-boot'],
    agents: ['java-reviewer', 'java-build-resolver'],
    memoryMode: 'unsupported',
  });
  const aliases = Object.fromEntries(resolved.filter((c) => /^(java|spring-boot)-(review|build)$/.test(c.name)).map((c) => [c.name, c.backing]));
  assert.deepEqual(aliases, {
    'java-review': 'java-reviewer',
    'spring-boot-review': 'java-reviewer',
    'java-build': 'java-build-resolver',
    'spring-boot-build': 'java-build-resolver',
  });
});
