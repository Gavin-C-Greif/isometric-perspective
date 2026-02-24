import { isometricModuleConfig } from "./consts.js";

const DEBUG_PREFIX = "[Isometric Perspective]";

const noop = () => {};

export function isDebugEnabled() {
  return !!isometricModuleConfig.DEBUG_PRINT;
}

export function debugLog(...args) {
  if (!isDebugEnabled()) return;
  console.log(DEBUG_PREFIX, ...args);
}

export function debugWarn(...args) {
  if (!isDebugEnabled()) return;
  console.warn(DEBUG_PREFIX, ...args);
}

export function debugGroup(label, ...args) {
  if (!isDebugEnabled()) return noop;
  console.group(`${DEBUG_PREFIX} ${label}`, ...args);
  return () => console.groupEnd();
}

export function debugTable(data) {
  if (!isDebugEnabled()) return;
  console.table(data);
}
