import { isometricModuleConfig } from "./consts.js";

const DEBUG_PREFIX = "[Isometric Perspective]";

const noop = () => {};

/** Always-on structured warnings (non-debug). Use for actionable runtime issues. */
export function logWarn(message, ...context) {
  console.warn(DEBUG_PREFIX, message, ...context);
}

/** Always-on structured errors. Use for parsing/validation failures and critical issues. */
export function logError(message, ...context) {
  console.error(DEBUG_PREFIX, message, ...context);
}

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
