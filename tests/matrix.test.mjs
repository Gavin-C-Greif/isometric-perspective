/**
 * Math matrix core combinations test - US-007.
 * Covers projection × token shape × grid config × offsets × elevation.
 * Assertions: finite outputs, transform/ruler equivalence, sorting stability, custom projection effect.
 * Failure messages identify the exact failing dimension combination.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  cartesianToIsoProjection,
  computeOffsetComponentsForProjection,
  computeTokenPlacementPosition,
  computeVisualYForSort
} from '../scripts/utils.js';
import { assertPointAlmostEqual } from './helpers/tolerance.js';
import {
  TOKEN_DIMENSIONS,
  GRID_SIZES,
  GRID_DISTANCES,
  OFFSETS,
  ELEVATIONS,
  TRUE_ISOMETRIC_RAD,
  PROJECTION_PRESETS_RAD
} from './fixtures/math-fixtures.js';

const docX = 0;
const docY = 0;

/** Build label for failing dimension combination */
function label(proj, token, gridSize, gridDist, offset, elev) {
  const projName = proj?.name ?? 'custom';
  return `proj=${projName} token=${token.width}x${token.height} gs=${gridSize} gd=${gridDist} off=(${offset.x},${offset.y}) elev=${elev}`;
}

describe('matrix: finite outputs', () => {
  it('all projection × token × grid × offset × elevation combinations produce finite placement', () => {
    for (const proj of PROJECTION_PRESETS_RAD) {
      for (const token of TOKEN_DIMENSIONS) {
        for (const gridSize of GRID_SIZES) {
          for (const gridDist of GRID_DISTANCES) {
            for (const offset of OFFSETS) {
              for (const elev of ELEVATIONS) {
                const { offsetX, offsetY } = computeOffsetComponentsForProjection(
                  offset.x, offset.y, elev, gridSize, gridDist, token.width
                );
                const isoOffsets = cartesianToIsoProjection(offsetX, offsetY, proj);
                const pos = computeTokenPlacementPosition(
                  docX, docY, token.width, token.height, gridSize, isoOffsets
                );
                assert(
                  Number.isFinite(pos.x) && Number.isFinite(pos.y),
                  label(proj, token, gridSize, gridDist, offset, elev)
                );
              }
            }
          }
        }
      }
    }
  });
});

describe('matrix: transform/ruler equivalence', () => {
  it('equivalent inputs produce matching projected coordinates across projection × token × offset', () => {
    const gridSize = 100;
    const gridDist = 10;
    const elev = 5;

    for (const proj of PROJECTION_PRESETS_RAD) {
      for (const token of TOKEN_DIMENSIONS) {
        for (const offset of OFFSETS) {
          const { offsetX, offsetY } = computeOffsetComponentsForProjection(
            offset.x, offset.y, elev, gridSize, gridDist, token.width
          );
          const isoOffsets = cartesianToIsoProjection(offsetX, offsetY, proj);

          const transformPos = computeTokenPlacementPosition(
            docX, docY, token.width, token.height, gridSize, isoOffsets
          );
          const centerX = docX + (token.width * gridSize) / 2;
          const centerY = docY + (token.height * gridSize) / 2;
          const rulerPos = {
            x: centerX + token.width * isoOffsets.x,
            y: centerY + token.height * isoOffsets.y
          };

          assert(
            assertPointAlmostEqual(transformPos, rulerPos, 1e-9),
            label(proj, token, gridSize, gridDist, offset, elev)
          );
        }
      }
    }
  });
});

describe('matrix: sorting stability', () => {
  const r = TRUE_ISOMETRIC_RAD.rotation;
  const sx = TRUE_ISOMETRIC_RAD.skewX;
  const sy = TRUE_ISOMETRIC_RAD.skewY ?? 0;

  it('finite visual Y for all token × offset combinations', () => {
    const gridSize = 100;
    for (const token of TOKEN_DIMENSIONS) {
      for (const offset of OFFSETS) {
        const baseX = (token.width * gridSize) / 2;
        const baseY = (token.height * gridSize) / 2;
        const offsetScale = gridSize / 100;
        const x = baseX + offset.x * offsetScale;
        const y = baseY + offset.y * offsetScale;
        const visY = computeVisualYForSort(x, y, r, sx, sy);
        assert(
          Number.isFinite(visY),
          `token=${token.width}x${token.height} off=(${offset.x},${offset.y})`
        );
      }
    }
  });

  it('deterministic sort order for overlap positions', () => {
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

describe('matrix: custom projection effect', () => {
  it('custom projection (reverseRotation 0) produces different conversion output than standard for non-zero offsets', () => {
    const custom = { name: 'Custom', reverseRotation: 0 };
    const standard = { name: 'Standard', reverseRotation: Math.PI / 4 };
    const nonZeroOffsets = OFFSETS.filter(o => o.x !== 0 || o.y !== 0);
    for (const { x, y } of nonZeroOffsets) {
      const p = cartesianToIsoProjection(x, y, custom);
      const q = cartesianToIsoProjection(x, y, standard);
      assert(
        p.x !== q.x || p.y !== q.y,
        `custom vs standard should differ for offset (${x},${y})`
      );
    }
  });

  it('custom projection preset outputs differ from True Isometric preset for non-zero offsets', () => {
    const customProj = PROJECTION_PRESETS_RAD.find(p => p.name === 'Custom Projection');
    const isoProj = PROJECTION_PRESETS_RAD.find(p => p.name === 'True Isometric');
    assert(customProj && isoProj, 'presets must exist');
    const nonZeroOffsets = OFFSETS.filter(o => o.x !== 0 || o.y !== 0);
    for (const { x, y } of nonZeroOffsets) {
      const p = cartesianToIsoProjection(x, y, customProj);
      const q = cartesianToIsoProjection(x, y, isoProj);
      assert(
        p.x !== q.x || p.y !== q.y,
        `Custom Projection vs True Isometric should differ for offset (${x},${y})`
      );
    }
  });
});
