/**
 * Tests for utils.js coordinate conversion using shared fixtures and tolerance helper.
 * Consumes tests/fixtures/math-fixtures.js and tests/helpers/tolerance.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { cartesianToIso, isoToCartesian, calculateIsometricVerticalDistance } from '../scripts/utils.js';
import { assertPointAlmostEqual, assertAlmostEqual, DEFAULT_EPSILON } from './helpers/tolerance.js';
import { OFFSETS, TOKEN_DIMENSIONS } from './fixtures/math-fixtures.js';

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
