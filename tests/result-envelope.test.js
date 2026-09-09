import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseResultEnvelope, validateResultEnvelope } from '../scripts/lib/result-envelope.js';

const validEnvelope = {
  status: 'complete',
  executive_summary: 'Spec and tests are green.',
  artifact: 'docs/wiki/sdd/specs/export-csv.md',
  next_recommended: 'plan',
  risk: 'low',
  skill_resolution: {
    used: ['sdd-init', 'specify'],
    missing: [],
    fallback: [],
    compact_rules: ['Use config.yaml before choosing commands.']
  },
  evidence: ['npm test']
};

test('validateResultEnvelope accepts complete phase envelopes', () => {
  assert.deepEqual(validateResultEnvelope(validEnvelope), []);
});

test('validateResultEnvelope rejects incomplete phase envelopes', () => {
  const errors = validateResultEnvelope({ ...validEnvelope, evidence: undefined });
  assert.ok(errors.includes('missing evidence'));
});

test('parseResultEnvelope extracts fenced json result-envelope blocks', () => {
  const parsed = parseResultEnvelope(`Done.\n\n\`\`\`json result-envelope\n${JSON.stringify(validEnvelope)}\n\`\`\`\n`);
  assert.equal(parsed.status, 'complete');
  assert.deepEqual(parsed.skill_resolution.used, ['sdd-init', 'specify']);
});

// The canonical SDD phase chain (constitution/specify/clarify/plan/tasks/analyze/
// implement/verify/review/ship) was retired along with the rest of Eric's SDD skills
// (see docs/superpowers/specs/2026-09-08-personalizacion-harness-design.md); the
// per-phase result-envelope contract tests that used to live here went with it. The
// validator and parser above remain covered by the synthetic-envelope tests.
