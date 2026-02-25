const CPU_CHUNK_FALLBACK = 6;
const CPU_CHUNK_VALUES = new Set([1, 2, 3, 4, 6, 8, 10]);

/**
 * Normalize occlusion setting values from Foundry settings.
 * Returns a stable shape used by runtime occlusion logic and docs/tests.
 */
export function normalizeOcclusionMode(rawMode) {
  const mode = String(rawMode ?? 'off').toLowerCase().trim();
  if (mode === 'off') {
    return { enabled: false, type: 'off', rawMode: mode, chunkSize: null };
  }

  if (mode === 'gpu') {
    return { enabled: true, type: 'gpu', rawMode: mode, chunkSize: null };
  }

  if (mode.startsWith('cpu')) {
    const parsed = Number.parseInt(mode.slice(3), 10);
    const chunkSize = CPU_CHUNK_VALUES.has(parsed) ? parsed : CPU_CHUNK_FALLBACK;
    return { enabled: true, type: 'cpu', rawMode: mode, chunkSize };
  }

  return { enabled: false, type: 'off', rawMode: mode, chunkSize: null };
}

export function getOcclusionProductionPolicy() {
  return {
    defaultMode: 'off',
    recommendedCpuFallback: `cpu${CPU_CHUNK_FALLBACK}`,
    notes: {
      off: 'Safest default for compatibility and baseline performance.',
      gpu: 'Usually faster than CPU chunking but must be verified per scene.',
      cpu: 'Chunked silhouette tradeoff; lower chunk size is higher fidelity and higher CPU cost.'
    }
  };
}

