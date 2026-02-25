import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  HIGH_RISK_SCENARIOS,
  createHarnessTemplate,
  evaluateHarness,
  formatHarnessReport
} from '../scripts/high-risk-harness.js';

describe('high-risk harness template', () => {
  it('includes all required high-risk scenarios', () => {
    const template = createHarnessTemplate();
    assert.strictEqual(template.storyId, 'US-002');
    assert.strictEqual(template.scenarios.length, HIGH_RISK_SCENARIOS.length);
    for (const scenario of template.scenarios) {
      assert.strictEqual(scenario.status, 'PENDING');
      assert.strictEqual(scenario.evidence, '');
    }
  });
});

describe('high-risk harness evaluation', () => {
  it('passes when all scenarios are PASS with evidence', () => {
    const data = {
      scenarios: HIGH_RISK_SCENARIOS.map((scenario) => ({
        id: scenario.id,
        status: 'PASS',
        evidence: `Validated ${scenario.id}`
      }))
    };
    const evaluation = evaluateHarness(data);
    assert.strictEqual(evaluation.allPass, true);
    assert.strictEqual(evaluation.passCount, HIGH_RISK_SCENARIOS.length);
  });

  it('fails when any scenario lacks evidence', () => {
    const data = {
      scenarios: [
        ...HIGH_RISK_SCENARIOS.slice(0, 4).map((scenario) => ({
          id: scenario.id,
          status: 'PASS',
          evidence: `Validated ${scenario.id}`
        })),
        { id: HIGH_RISK_SCENARIOS[4].id, status: 'PASS', evidence: '' }
      ]
    };
    const evaluation = evaluateHarness(data);
    assert.strictEqual(evaluation.allPass, false);
    assert.strictEqual(evaluation.passCount, HIGH_RISK_SCENARIOS.length - 1);
  });

  it('formats report with per-scenario status and evidence', () => {
    const evaluation = evaluateHarness({
      scenarios: [
        { id: 'projection-switch', status: 'PASS', evidence: '3 cycles completed' },
        { id: 'pan-zoom', status: 'FAIL', evidence: 'HUD drifted at 200% zoom' },
        { id: 'scene-switch', status: 'PENDING', evidence: '' },
        { id: 'token-control-switch', status: 'PASS', evidence: '10 control swaps stable' },
        { id: 'door-state-changes', status: 'PASS', evidence: 'Visibility toggled correctly' }
      ]
    });

    const report = formatHarnessReport(evaluation);
    assert.match(report, /projection-switch: PASS/);
    assert.match(report, /pan-zoom: FAIL/);
    assert.match(report, /scene-switch: PENDING/);
    assert.match(report, /evidence:/);
    assert.match(report, /Overall: FAIL/);
  });
});
