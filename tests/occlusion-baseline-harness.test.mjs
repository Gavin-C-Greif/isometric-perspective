import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  BASELINE_MODES,
  BASELINE_SCENARIOS,
  createBaselineTemplate,
  evaluateBaselineRun,
  formatBaselineReport
} from '../scripts/occlusion-baseline-harness.js';

describe('occlusion baseline harness template', () => {
  it('creates expected scenario x mode matrix', () => {
    const template = createBaselineTemplate();
    assert.strictEqual(template.storyId, 'US-003');
    assert.strictEqual(template.rows.length, BASELINE_SCENARIOS.length * BASELINE_MODES.length);
  });
});

describe('occlusion baseline harness evaluation', () => {
  it('fails when metadata or row metrics are incomplete', () => {
    const template = createBaselineTemplate();
    const evaluation = evaluateBaselineRun(template);
    assert.strictEqual(evaluation.allPass, false);
    assert.ok(evaluation.missingMetadata.length > 0);
    assert.strictEqual(evaluation.validRows, 0);
  });

  it('passes when metadata and all rows are complete', () => {
    const rows = BASELINE_SCENARIOS.flatMap((scenario) =>
      BASELINE_MODES.map((mode) => ({
        scenario,
        mode,
        avgFrameOrFps: '60 FPS',
        worstFrameOrStutters: '1 stutter',
        visualQuality: 'acceptable',
        pass: true
      }))
    );

    const evaluation = evaluateBaselineRun({
      runMetadata: {
        dateTime: '2026-02-24 20:00 UTC',
        buildCommit: 'abc1234',
        foundryVersion: '13',
        browserOs: 'Chrome/Windows',
        tester: 'CI',
        notes: ''
      },
      rows
    });

    assert.strictEqual(evaluation.allPass, true);
    assert.strictEqual(evaluation.validRows, rows.length);
  });

  it('formats report with summary and overall status', () => {
    const evaluation = evaluateBaselineRun(createBaselineTemplate());
    const report = formatBaselineReport(evaluation);
    assert.match(report, /Occlusion Baseline Harness/);
    assert.match(report, /Summary:/);
    assert.match(report, /Overall: FAIL/);
  });
});

