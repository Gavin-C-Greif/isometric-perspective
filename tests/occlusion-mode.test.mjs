import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getOcclusionProductionPolicy, normalizeOcclusionMode } from '../scripts/occlusion-mode.js';

describe('normalizeOcclusionMode', () => {
  it('returns disabled mode for off and unknown values', () => {
    assert.deepStrictEqual(normalizeOcclusionMode('off'), {
      enabled: false,
      type: 'off',
      rawMode: 'off',
      chunkSize: null
    });
    assert.deepStrictEqual(normalizeOcclusionMode('unknown'), {
      enabled: false,
      type: 'off',
      rawMode: 'unknown',
      chunkSize: null
    });
  });

  it('normalizes gpu mode', () => {
    assert.deepStrictEqual(normalizeOcclusionMode('gpu'), {
      enabled: true,
      type: 'gpu',
      rawMode: 'gpu',
      chunkSize: null
    });
  });

  it('normalizes cpu chunk sizes and falls back for invalid values', () => {
    const cpu4 = normalizeOcclusionMode('cpu4');
    assert.strictEqual(cpu4.enabled, true);
    assert.strictEqual(cpu4.type, 'cpu');
    assert.strictEqual(cpu4.chunkSize, 4);

    const invalid = normalizeOcclusionMode('cpu5');
    assert.strictEqual(invalid.enabled, true);
    assert.strictEqual(invalid.type, 'cpu');
    assert.strictEqual(invalid.chunkSize, 6);
  });
});

describe('getOcclusionProductionPolicy', () => {
  it('documents default mode and recommended cpu fallback', () => {
    const policy = getOcclusionProductionPolicy();
    assert.strictEqual(policy.defaultMode, 'off');
    assert.strictEqual(policy.recommendedCpuFallback, 'cpu6');
    assert.ok(policy.notes.off.length > 0);
    assert.ok(policy.notes.gpu.length > 0);
    assert.ok(policy.notes.cpu.length > 0);
  });
});

