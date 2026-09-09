import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Bug: the "Base install" choice in the interactive wizard() wires the full code-hooks gate
// (ship-guard, danger-guard, gitmoji-guard, userprompt-gate, sello) even though the base profile
// installs none of the five skills that gate names (grill-with-docs, to-spec, write-adr,
// to-tickets, implement). wizard() called applyInstall() without a `policy` argument at all, so
// generatedHookFiles()/wireHook() fell through to their "no policy given" default, which wires the
// full gate unconditionally. The `onboard` path is unaffected: it always computes and persists a
// real policy.
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const CLI = join(ROOT, 'scripts/rsc.js');
const fresh = () => mkdtempSync(join(tmpdir(), 'rsc-wizard-base-'));
const run = (cwd, args, input) => spawnSync(process.execPath, [CLI, ...args], { cwd, input, encoding: 'utf8', timeout: 20000 });

// The non-interactive prompt fallback (no TTY) creates a brand-new readline.Interface for
// every single question; feeding all answers as one piped string only ever satisfies the
// FIRST question — the rest of that string is already buffered into the first Interface and
// is lost when it closes, and process.stdin has nothing left for the next Interface to read.
// So answers have to be written progressively, each only after the prompt it answers appears.
function driveWizard(cwd, steps) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [CLI], { cwd });
    let out = '';
    let err = '';
    let next = 0;
    const timer = setTimeout(() => { child.kill(); reject(new Error(`timed out waiting for: ${steps[next]?.expect}\n--- stdout so far ---\n${out}`)); }, 15000);
    const maybeAdvance = () => {
      while (next < steps.length && out.includes(steps[next].expect)) {
        child.stdin.write(steps[next].answer);
        next += 1;
      }
      if (next >= steps.length) { clearTimeout(timer); child.stdin.end(); }
    };
    child.stdout.on('data', (d) => { out += d.toString(); maybeAdvance(); });
    child.stderr.on('data', (d) => { err += d.toString(); });
    child.on('close', (status) => { clearTimeout(timer); resolve({ status, stdout: out, stderr: err }); });
    child.on('error', reject);
  });
}

// The gate names these five skills. None of them ships in the minimal/base profile.
const GATE_NAMED_SKILLS = ['grill-with-docs', 'to-spec', 'write-adr', 'to-tickets', 'implement'];

test('re-running the wizard and choosing "Base install" does not wire the code-hooks gate', async () => {
  const cwd = fresh();

  // Onboard as a growing software project so the gate starts WIRED and its named skills are
  // actually installed — this is the state the wizard is re-entered from in the real bug report.
  const onboard = [
    'onboard', '--technical-level', 'technical', '--accompaniment', 'L0', '--project-kind', 'software',
    '--software-scope', 'growing', '--goal', 'Ship a feature', '--target', 'claude',
  ];
  const preview = run(cwd, onboard);
  assert.equal(preview.status, 0, preview.stderr);
  const id = preview.stdout.match(/Plan id: ([a-f0-9]{64})/)?.[1];
  assert.ok(id, 'onboarding preview did not print a plan id');
  const accepted = run(cwd, [...onboard, '--accept-plan', id]);
  assert.equal(accepted.status, 0, accepted.stderr);

  const manifestBefore = JSON.parse(readFileSync(join(cwd, '.rsc.json'), 'utf8'));
  assert.ok(manifestBefore.onboarding.plan.policy.codeHooks, 'fixture: onboarding must have wired the gate');
  for (const gateSkill of GATE_NAMED_SKILLS) {
    assert.ok(existsSync(join(cwd, '.claude', 'skills', gateSkill)), `fixture: onboarding must have installed ${gateSkill}`);
  }

  // Re-enter the wizard (no subcommand) and choose option 1 ("Base install"), accepting the
  // detected/default assistant and confirming the install — the exact path from the bug report.
  const wizard = await driveWizard(cwd, [
    { expect: 'What do you want to do?', answer: '1\n' },
    { expect: 'Comma-separated numbers', answer: '\n' },
    { expect: 'Install it?', answer: 'yes\n' },
  ]);
  assert.equal(wizard.status, 0, wizard.stderr + wizard.stdout);

  for (const gateSkill of GATE_NAMED_SKILLS) {
    assert.ok(!existsSync(join(cwd, '.claude', 'skills', gateSkill)), `base install must not leave ${gateSkill} installed`);
  }

  const settings = JSON.parse(readFileSync(join(cwd, '.claude', 'settings.json'), 'utf8'));
  const hookJson = JSON.stringify(settings.hooks || {});
  assert.doesNotMatch(hookJson, /ship-guard\.mjs|danger-guard\.mjs|gitmoji-guard\.mjs|userprompt-gate\.mjs|sello\.mjs/,
    'Base install wired the full code-hooks gate even though none of the skills it names were installed');
});
