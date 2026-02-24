/**
 * Shared tolerance helper for floating-point assertions in math tests.
 * Use for coordinate comparisons and numeric equivalence checks.
 */

/** Default epsilon for float comparisons (1e-10) */
export const DEFAULT_EPSILON = 1e-10;

/**
 * Assert that two numbers are equal within tolerance.
 * @param {number} actual - Actual value
 * @param {number} expected - Expected value
 * @param {number} [epsilon=DEFAULT_EPSILON] - Maximum allowed difference
 * @returns {boolean} True if |actual - expected| <= epsilon
 */
export function assertAlmostEqual(actual, expected, epsilon = DEFAULT_EPSILON) {
  if (!Number.isFinite(actual) || !Number.isFinite(expected)) {
    return false;
  }
  return Math.abs(actual - expected) <= epsilon;
}

/**
 * Assert that two points {x, y} are equal within tolerance.
 * @param {{x: number, y: number}} actual - Actual point
 * @param {{x: number, y: number}} expected - Expected point
 * @param {number} [epsilon=DEFAULT_EPSILON] - Maximum allowed difference per axis
 * @returns {boolean} True if both axes are within tolerance
 */
export function assertPointAlmostEqual(actual, expected, epsilon = DEFAULT_EPSILON) {
  return assertAlmostEqual(actual?.x, expected?.x, epsilon) &&
         assertAlmostEqual(actual?.y, expected?.y, epsilon);
}
