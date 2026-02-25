/**
 * Shared tolerance helper for floating-point assertions in math tests.
 * Use for coordinate comparisons and numeric equivalence checks.
 */
import assert from 'node:assert';

/** Default epsilon for float comparisons (1e-10) */
export const DEFAULT_EPSILON = 1e-10;

/**
 * Assert that two numbers are equal within tolerance.
 * @param {number} actual - Actual value
 * @param {number} expected - Expected value
 * @param {number} [epsilon=DEFAULT_EPSILON] - Maximum allowed difference
 * @returns {boolean} Always true when assertion passes
 */
export function assertAlmostEqual(actual, expected, epsilon = DEFAULT_EPSILON) {
  assert(
    Number.isFinite(actual) && Number.isFinite(expected),
    `Expected finite values, got actual=${actual}, expected=${expected}`
  );
  const delta = Math.abs(actual - expected);
  assert(
    delta <= epsilon,
    `Expected ${actual} to be within ${epsilon} of ${expected} (|delta|=${delta})`
  );
  return true;
}

/**
 * Assert that two points {x, y} are equal within tolerance.
 * @param {{x: number, y: number}} actual - Actual point
 * @param {{x: number, y: number}} expected - Expected point
 * @param {number} [epsilon=DEFAULT_EPSILON] - Maximum allowed difference per axis
 * @returns {boolean} Always true when assertion passes
 */
export function assertPointAlmostEqual(actual, expected, epsilon = DEFAULT_EPSILON) {
  assertAlmostEqual(actual?.x, expected?.x, epsilon);
  assertAlmostEqual(actual?.y, expected?.y, epsilon);
  return true;
}
