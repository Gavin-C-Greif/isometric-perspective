/**
 * Shared numeric fixtures for isometric math tests.
 * Reusable across projection, token, grid, offset, and elevation test cases.
 */

/** Projection type names used in consts.js */
export const PROJECTION_NAMES = [
  'True Isometric',
  'Dimetric (2:1)',
  'Overhead (√2:1)',
  'Projection (3:2)',
  'Custom Projection'
];

/** Token dimensions (width x height in grid units) for matrix coverage */
export const TOKEN_DIMENSIONS = [
  { width: 1, height: 1 },
  { width: 2, height: 1 },
  { width: 1, height: 2 },
  { width: 3, height: 2 }
];

/** Grid size values (pixels per grid cell) */
export const GRID_SIZES = [100, 128, 256];

/** Grid distance values (units per cell) */
export const GRID_DISTANCES = [5, 10];

/** Art offsets (offsetX, offsetY) in percentage-like units */
export const OFFSETS = [
  { x: 0, y: 0 },
  { x: 10, y: 10 },
  { x: -10, y: 20 },
  { x: 25, y: -15 }
];

/** Elevation values for testing */
export const ELEVATIONS = [0, 5, 20, 100];

/** Default projection constants (radians) for True Isometric - matches consts.js */
export const TRUE_ISOMETRIC_RAD = {
  rotation: -30 * Math.PI / 180,
  skewX: 30 * Math.PI / 180,
  skewY: 0,
  ratio: Math.sqrt(3)
};

/** 45° angle in radians (used by cartesianToIso/isoToCartesian) */
export const ANGLE_45_RAD = Math.PI / 4;

/** Projection presets with reverseRotation in radians for conversion tests - matches consts.js */
export const PROJECTION_PRESETS_RAD = [
  { name: 'True Isometric', reverseRotation: 45 * Math.PI / 180 },
  { name: 'Dimetric (2:1)', reverseRotation: 45 * Math.PI / 180 },
  { name: 'Overhead (√2:1)', reverseRotation: 45 * Math.PI / 180 },
  { name: 'Projection (3:2)', reverseRotation: 45 * Math.PI / 180 },
  { name: 'Custom Projection', reverseRotation: 0 }
];
