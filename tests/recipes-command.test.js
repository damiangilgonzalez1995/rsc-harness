import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// `harness recipes …` is the CopyPasta-Kitchen recipe book, served from the npm package this repo
// depends on. These tests run the real CLI as a user would: the point is that the dependency is
// wired, not that a mock of it answers.
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const RSC = join(ROOT, 'scripts', 'rsc.js');
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));

// An empty folder with no harness in it: `recipes` must not need one, nor an assistant.
const elsewhere = () => mkdtempSync(join(tmpdir(), 'rsc-recipes-'));
const harness = (cwd, ...args) => spawnSync(process.execPath, [RSC, ...args], { cwd, encoding: 'utf8' });

test('the recipe book is an exact-version dependency, not a moving range', () => {
  const version = pkg.dependencies['@damiangilgonzalez/copypasta'];
  assert.ok(version, 'the harness depends on @damiangilgonzalez/copypasta');
  // A range would let a new release of the recipe book reach users without a harness release.
  assert.match(version, /^\d+\.\d+\.\d+$/, `not an exact version: ${version}`);
});

test('recipes list answers from the packaged recipe book, anywhere', () => {
  const r = harness(elsewhere(), 'recipes', 'list', '--json');
  assert.equal(r.status, 0, r.stderr);
  const recipes = JSON.parse(r.stdout);
  assert.ok(recipes.length >= 18, `only ${recipes.length} recipes`);
  assert.ok(recipes.some((recipe) => recipe.id === 'fastapi-base'));

  const filtered = harness(elsewhere(), 'recipes', 'list', '--category', 'frontend');
  assert.equal(filtered.status, 0, filtered.stderr);
  assert.match(filtered.stdout, /vite-react-base/);
  assert.doesNotMatch(filtered.stdout, /fastapi-base/);
});

test('recipes show and get serve one recipe and never overwrite', () => {
  const cwd = elsewhere();
  const shown = harness(cwd, 'recipes', 'show', 'project-settings');
  assert.equal(shown.status, 0, shown.stderr);
  assert.match(shown.stdout, /^# project-settings/);

  const got = harness(cwd, 'recipes', 'get', 'project-settings', '--to', 'backend');
  assert.equal(got.status, 0, got.stderr);
  assert.match(got.stdout, /project-settings: \d+ archivos copiados/);
  // Dotfiles are part of the recipe too.
  assert.ok(existsSync(join(cwd, 'backend', '.env.example')), 'the recipe arrived whole');
  // Hints name the command the user actually typed.
  assert.match(got.stdout, /harness recipes show project-settings/);
  assert.doesNotMatch(got.stdout, /copypasta show/);

  const again = harness(cwd, 'recipes', 'get', 'project-settings', '--to', 'backend');
  assert.equal(again.status, 0, again.stderr);
  assert.match(again.stdout, /ya existía, no se toca/);
});

test('recipes fails loudly on an unknown recipe or a bad command line', () => {
  const unknown = harness(elsewhere(), 'recipes', 'show', 'no-such-recipe');
  assert.equal(unknown.status, 2);
  assert.match(unknown.stderr, /receta desconocida 'no-such-recipe'/);

  const bare = harness(elsewhere(), 'recipes');
  assert.equal(bare.status, 2);
  assert.match(bare.stderr, /harness recipes list/);
});

test('global harness flags are the harness\'s, not the recipe book\'s', () => {
  // `Any command takes --target`: it must not reach the recipe CLI as an unknown flag.
  const before = harness(elsewhere(), '--target', 'claude', 'recipes', 'list', '--category', 'frontend');
  assert.equal(before.status, 0, before.stderr);
  assert.match(before.stdout, /vite-react-base/);
  const after = harness(elsewhere(), 'recipes', 'list', '--target=claude');
  assert.equal(after.status, 0, after.stderr);
});
