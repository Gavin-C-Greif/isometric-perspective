/**
 * Tests for utils.js coordinate conversion using shared fixtures and tolerance helper.
 * Consumes tests/fixtures/math-fixtures.js and tests/helpers/tolerance.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  cartesianToIso,
  isoToCartesian,
  cartesianToIsoProjection,
  isoToCartesianProjection,
  calculateIsometricVerticalDistance,
  computeTokenPlacementPosition,
  computeTextureFitScale,
  safeDivide,
  computeElevationOffsetDelta,
  computeElevationVisualOffset,
  computeOffsetComponentsForProjection,
  computeVisualYForSort
} from '../scripts/utils.js';
import { assertPointAlmostEqual, assertAlmostEqual, DEFAULT_EPSILON } from './helpers/tolerance.js';
import {
  OFFSETS,
  TOKEN_DIMENSIONS,
  GRID_SIZES,
  GRID_DISTANCES,
  ELEVATIONS,
  TRUE_ISOMETRIC_RAD,
  PROJECTION_PRESETS_RAD
} from './fixtures/math-fixtures.js';

describe('cartesianToIso', () => {
  it('converts (0,0) to (0,0)', () => {
    const result = cartesianToIso(0, 0);
    assertPointAlmostEqual(result, { x: 0, y: 0 });
  });

  it('converts offset fixtures to finite values', () => {
    for (const { x, y } of OFFSETS) {
      const result = cartesianToIso(x, y);
      assert(Number.isFinite(result.x) && Number.isFinite(result.y), `offset (${x},${y})`);
    }
  });

  it('round-trips with isoToCartesian within tolerance', () => {
    for (const { x, y } of OFFSETS) {
      const iso = cartesianToIso(x, y);
      const back = isoToCartesian(iso.x, iso.y);
      assertPointAlmostEqual(back, { x, y }, 1e-9);
    }
  });
});

describe('cartesianToIsoProjection / isoToCartesianProjection', () => {
  it('forward/inverse round-trip for all projection presets', () => {
    for (const proj of PROJECTION_PRESETS_RAD) {
      for (const { x, y } of OFFSETS) {
        const iso = cartesianToIsoProjection(x, y, proj);
        const back = isoToCartesianProjection(iso.x, iso.y, proj);
        assertPointAlmostEqual(back, { x, y }, 1e-9);
      }
    }
  });

  it('custom projection (reverseRotation 0) produces different output than default', () => {
    const custom = { reverseRotation: 0 };
    const standard = { reverseRotation: Math.PI / 4 };
    const p = cartesianToIsoProjection(10, 10, custom);
    const q = cartesianToIsoProjection(10, 10, standard);
    assert(p.x !== q.x || p.y !== q.y, 'custom and standard should differ');
  });

  it('custom projection values reflected in conversion outputs', () => {
    const custom = { reverseRotation: 0 };
    const result = cartesianToIsoProjection(5, 5, custom);
    assertPointAlmostEqual(result, { x: 5, y: 5 }, 1e-9);
  });
});

describe('isoToCartesian', () => {
  it('converts (0,0) to (0,0)', () => {
    const result = isoToCartesian(0, 0);
    assertPointAlmostEqual(result, { x: 0, y: 0 });
  });

  it('round-trips with cartesianToIso within tolerance', () => {
    const inputs = [1, 10, 100, -5];
    for (const v of inputs) {
      const cart = isoToCartesian(v, v);
      const iso = cartesianToIso(cart.x, cart.y);
      assertPointAlmostEqual(iso, { x: v, y: v }, 1e-9);
    }
  });
});

describe('calculateIsometricVerticalDistance', () => {
  it('returns finite values for token dimension fixtures', () => {
    for (const { width, height } of TOKEN_DIMENSIONS) {
      const dist = calculateIsometricVerticalDistance(width, height);
      assert(Number.isFinite(dist), `(${width}x${height})`);
    }
  });

  it('matches sqrt(2) * min(w,h) for square', () => {
    const d = calculateIsometricVerticalDistance(1, 1);
    assertAlmostEqual(d, Math.sqrt(2), DEFAULT_EPSILON);
  });
});

describe('computeTokenPlacementPosition', () => {
  const gridSize = 100;

  it('square 1x1 baseline: center matches doc + half grid', () => {
    const docX = 0;
    const docY = 0;
    const pos = computeTokenPlacementPosition(docX, docY, 1, 1, gridSize, { x: 0, y: 0 });
    assertAlmostEqual(pos.x, docX + gridSize / 2, DEFAULT_EPSILON);
    assertAlmostEqual(pos.y, docY + gridSize / 2, DEFAULT_EPSILON);
  });

  it('rectangular 2x1: X center uses scaleX, Y center uses scaleY', () => {
    const docX = 0;
    const docY = 0;
    const pos = computeTokenPlacementPosition(docX, docY, 2, 1, gridSize, { x: 0, y: 0 });
    assertAlmostEqual(pos.x, docX + (2 * gridSize) / 2, DEFAULT_EPSILON);
    assertAlmostEqual(pos.y, docY + (1 * gridSize) / 2, DEFAULT_EPSILON);
  });

  it('rectangular 1x2: X center uses scaleX, Y center uses scaleY', () => {
    const docX = 0;
    const docY = 0;
    const pos = computeTokenPlacementPosition(docX, docY, 1, 2, gridSize, { x: 0, y: 0 });
    assertAlmostEqual(pos.x, docX + (1 * gridSize) / 2, DEFAULT_EPSILON);
    assertAlmostEqual(pos.y, docY + (2 * gridSize) / 2, DEFAULT_EPSILON);
  });

  it('rectangular 3x2: axis-correct center', () => {
    const docX = 50;
    const docY = 100;
    const pos = computeTokenPlacementPosition(docX, docY, 3, 2, gridSize, { x: 0, y: 0 });
    assertAlmostEqual(pos.x, docX + (3 * gridSize) / 2, DEFAULT_EPSILON);
    assertAlmostEqual(pos.y, docY + (2 * gridSize) / 2, DEFAULT_EPSILON);
  });

  it('projected offsets scale with correct axis (scaleX for x, scaleY for y)', () => {
    const isoOffsets = cartesianToIso(10, 20);
    const pos = computeTokenPlacementPosition(0, 0, 2, 3, gridSize, isoOffsets);
    const expectedX = (2 * gridSize) / 2 + 2 * isoOffsets.x;
    const expectedY = (3 * gridSize) / 2 + 3 * isoOffsets.y;
    assertAlmostEqual(pos.x, expectedX, DEFAULT_EPSILON);
    assertAlmostEqual(pos.y, expectedY, DEFAULT_EPSILON);
  });
});

describe('computeTextureFitScale', () => {
  it('returns (1,1) for fill', () => {
    const { sx, sy } = computeTextureFitScale(1, 1, 'fill');
    assert.strictEqual(sx, 1);
    assert.strictEqual(sy, 1);
  });

  it('returns finite values for contain/cover/width/height', () => {
    const ratios = [[1, 1], [2, 1], [1, 2]];
    for (const [w, h] of ratios) {
      for (const fit of ['contain', 'cover', 'width', 'height']) {
        const { sx, sy } = computeTextureFitScale(w, h, fit);
        assert(Number.isFinite(sx) && Number.isFinite(sy), `fit=${fit} (${w},${h})`);
      }
    }
  });

  it('default/unknown fit returns (1,1)', () => {
    const { sx, sy } = computeTextureFitScale(1, 1, 'unknown');
    assert.strictEqual(sx, 1);
    assert.strictEqual(sy, 1);
  });
});

describe('safeDivide', () => {
  it('returns fallback when denominator is 0', () => {
    assert.strictEqual(safeDivide(10, 0), 0);
    assert.strictEqual(safeDivide(10, 0, 99), 99);
  });

  it('returns fallback when denominator is NaN', () => {
    assert.strictEqual(safeDivide(10, NaN), 0);
    assert.strictEqual(safeDivide(10, NaN, -1), -1);
  });

  it('returns fallback when numerator is non-finite', () => {
    assert.strictEqual(safeDivide(Infinity, 5), 0);
    assert.strictEqual(safeDivide(NaN, 5), 0);
  });

  it('returns normal quotient when inputs are valid', () => {
    assert.strictEqual(safeDivide(10, 2), 5);
    assert.strictEqual(safeDivide(100, 10, 0), 10);
  });
});

describe('computeElevationOffsetDelta', () => {
  it('returns 0 when gridDistance is 0', () => {
    const r = computeElevationOffsetDelta(10, 0, 1);
    assert(Number.isFinite(r) && r === 0);
  });

  it('returns 0 when scaleX is 0', () => {
    const r = computeElevationOffsetDelta(10, 5, 0);
    assert(Number.isFinite(r) && r === 0);
  });

  it('returns finite value for valid inputs', () => {
    const r = computeElevationOffsetDelta(5, 10, 1);
    assert(Number.isFinite(r));
  });

  it('returns 0 for non-finite elevation', () => {
    assert.strictEqual(computeElevationOffsetDelta(NaN, 10, 1), 0);
    assert.strictEqual(computeElevationOffsetDelta(Infinity, 10, 1), 0);
  });
});

describe('computeElevationVisualOffset', () => {
  it('returns 0 when gridDistance is 0', () => {
    const r = computeElevationVisualOffset(10, 100, 0);
    assert(Number.isFinite(r) && r === 0);
  });

  it('returns finite value for valid inputs', () => {
    const r = computeElevationVisualOffset(5, 100, 10);
    assert(Number.isFinite(r));
    assert.strictEqual(r, 5 * (100 / 10));
  });
});

describe('transform/ruler equivalence (computeOffsetComponentsForProjection)', () => {
  const docX = 0;
  const docY = 0;

  it('equivalent inputs produce matching projected coordinates', () => {
    for (const { width: scaleX, height: scaleY } of TOKEN_DIMENSIONS) {
      for (const { x: artOffsetX, y: artOffsetY } of OFFSETS) {
        const gridSize = 100;
        const gridDistance = 10;
        const elevation = 5;

        const { offsetX, offsetY } = computeOffsetComponentsForProjection(
          artOffsetX, artOffsetY, elevation, gridSize, gridDistance, scaleX
        );
        const isoOffsets = cartesianToIso(offsetX, offsetY);

        const transformPos = computeTokenPlacementPosition(
          docX, docY, scaleX, scaleY, gridSize, isoOffsets
        );
        const centerX = docX + (scaleX * gridSize) / 2;
        const centerY = docY + (scaleY * gridSize) / 2;
        const rulerPos = {
          x: centerX + scaleX * isoOffsets.x,
          y: centerY + scaleY * isoOffsets.y
        };

        assertPointAlmostEqual(transformPos, rulerPos, 1e-9);
        assert(Number.isFinite(transformPos.x) && Number.isFinite(transformPos.y));
      }
    }
  });

  it('finite outputs for matrix combinations (token shape, offset, elevation, grid)', () => {
    for (const { width: scaleX, height: scaleY } of TOKEN_DIMENSIONS) {
      for (const { x: artOffsetX, y: artOffsetY } of OFFSETS) {
        for (const gridSize of GRID_SIZES) {
          for (const gridDistance of GRID_DISTANCES) {
            for (const elevation of ELEVATIONS) {
              const { offsetX, offsetY } = computeOffsetComponentsForProjection(
                artOffsetX, artOffsetY, elevation, gridSize, gridDistance, scaleX
              );
              const isoOffsets = cartesianToIso(offsetX, offsetY);
              const pos = computeTokenPlacementPosition(
                docX, docY, scaleX, scaleY, gridSize, isoOffsets
              );
              assert(Number.isFinite(pos.x) && Number.isFinite(pos.y),
                `${scaleX}x${scaleY} off=(${artOffsetX},${artOffsetY}) gs=${gridSize} gd=${gridDistance} elev=${elevation}`);
            }
          }
        }
      }
    }
  });
});

describe('computeVisualYForSort (depth sorting)', () => {
  const r = TRUE_ISOMETRIC_RAD.rotation;
  const sx = TRUE_ISOMETRIC_RAD.skewX;
  const sy = TRUE_ISOMETRIC_RAD.skewY ?? 0;

  it('returns finite values for token positions', () => {
    for (const { width, height } of TOKEN_DIMENSIONS) {
      const gridSize = 100;
      const x = (width * gridSize) / 2;
      const y = (height * gridSize) / 2;
      const visY = computeVisualYForSort(x, y, r, sx, sy);
      assert(Number.isFinite(visY), `${width}x${height}`);
    }
  });

  it('south (higher Y) has higher visual Y than north (lower Y)', () => {
    const x = 50;
    const visYNorth = computeVisualYForSort(x, 10, r, sx, sy);
    const visYSouth = computeVisualYForSort(x, 90, r, sx, sy);
    assert(visYSouth > visYNorth, 'south should sort in front of north');
  });

  it('sort order is deterministic for overlap scenarios', () => {
    const positions = [
      { x: 0, y: 0 },
      { x: 50, y: 50 },
      { x: 100, y: 100 },
      { x: 25, y: 75 }
    ];
    const visYs = positions.map(p => computeVisualYForSort(p.x, p.y, r, sx, sy));
    assert(visYs.every(Number.isFinite), 'all visual Y values finite');
    const sorted = [...visYs].sort((a, b) => a - b);
    assert.ok(sorted.every((v, i) => i === 0 || v >= sorted[i - 1]), 'sorted ascending');
  });
});
