import { isometricModuleConfig } from './consts.js';
import { debugLog, logWarn } from './logger.js';

/**
 * Safe division: returns fallback when denominator is 0, NaN, or non-finite.
 * Prevents NaN/Infinity in transform formulas.
 * @param {number} num - Numerator
 * @param {number} denom - Denominator
 * @param {number} [fallback=0] - Value when division is invalid
 * @returns {number}
 */
export function safeDivide(num, denom, fallback = 0) {
  if (!Number.isFinite(num) || !Number.isFinite(denom) || denom === 0) return fallback;
  return num / denom;
}

/**
 * Computes scale factors (sx, sy) for texture fit modes (fill, contain, cover, width, height).
 * Shared by resetTokenTransform and applyIsometricTransformation to avoid duplicated logic.
 * @param {number} objTxtRatio_W - Texture width / gridSize
 * @param {number} objTxtRatio_H - Texture height / gridSize
 * @param {string} [fit] - Texture fit mode from document.texture.fit
 * @returns {{sx: number, sy: number}}
 */
export function computeTextureFitScale(objTxtRatio_W, objTxtRatio_H, fit) {
  let sx = 1;
  let sy = 1;
  switch (fit) {
    case "fill":
      break;
    case "contain":
      if (Math.max(objTxtRatio_W, objTxtRatio_H) === objTxtRatio_W) {
        sy = safeDivide(objTxtRatio_H, objTxtRatio_W, 1);
      } else {
        sx = safeDivide(objTxtRatio_W, objTxtRatio_H, 1);
        sy = 1;
      }
      break;
    case "cover":
      if (Math.min(objTxtRatio_W, objTxtRatio_H) === objTxtRatio_W) {
        sy = safeDivide(objTxtRatio_H, objTxtRatio_W, 1);
      } else {
        sx = safeDivide(objTxtRatio_W, objTxtRatio_H, 1);
        sy = 1;
      }
      break;
    case "width":
      sy = safeDivide(objTxtRatio_H, objTxtRatio_W, 1);
      break;
    case "height":
      sx = safeDivide(objTxtRatio_W, objTxtRatio_H, 1);
      sy = 1;
      break;
    default:
      if (fit !== undefined && fit !== null) logWarn("Invalid texture fit", { fit });
      break;
  }
  return { sx, sy };
}

/**
 * Elevation contribution to art offset (before gridSize/100 scaling).
 * Returns 0 when gridDistance or scaleX is invalid to avoid NaN/Infinity.
 * @param {number} elevation - Token elevation
 * @param {number} gridDistance - Grid distance (units per cell)
 * @param {number} scaleX - Token width in grid cells
 * @returns {number}
 */
export function computeElevationOffsetDelta(elevation, gridDistance, scaleX) {
  if (!Number.isFinite(elevation)) return 0;
  const invDist = safeDivide(1, gridDistance, 0);
  const invScale = safeDivide(1, scaleX, 0);
  return elevation * invDist * 100 * Math.sqrt(2) * invScale;
}

/**
 * Elevation visual offset (gridSize/gridDistance) for elevation line. Returns 0 when invalid.
 * @param {number} elevation - Token elevation
 * @param {number} gridSize - Pixels per grid cell
 * @param {number} gridDistance - Grid distance (units per cell)
 * @returns {number}
 */
export function computeElevationVisualOffset(elevation, gridSize, gridDistance) {
  if (!Number.isFinite(elevation)) return 0;
  return elevation * safeDivide(gridSize, gridDistance, 0);
}

/**
 * Shared offset/elevation projection: computes (offsetX, offsetY) in grid space for transform and ruler.
 * Both modules use this so projected coordinates match within tolerance.
 * @param {number} artOffsetX - Art offset X from flags
 * @param {number} artOffsetY - Art offset Y from flags
 * @param {number} elevation - Token elevation
 * @param {number} gridSize - Pixels per grid cell
 * @param {number} gridDistance - Grid distance (units per cell)
 * @param {number} scaleX - Token width in grid cells
 * @returns {{offsetX: number, offsetY: number}}
 */
export function computeOffsetComponentsForProjection(artOffsetX, artOffsetY, elevation, gridSize, gridDistance, scaleX) {
  const elevationDelta = computeElevationOffsetDelta(elevation, gridDistance, scaleX);
  const gridScale = safeDivide(gridSize, 100, 1);
  return {
    offsetX: (artOffsetX + elevationDelta) * gridScale,
    offsetY: (artOffsetY ?? 0) * gridScale
  };
}

/** Default conversion angle (45°) when no projection is provided. */
const DEFAULT_CONVERSION_ANGLE = Math.PI / 4;

// Função auxiliar para converter coordenadas isométricas para cartesianas
export function isoToCartesian(isoX, isoY) {
  return isoToCartesianProjection(isoX, isoY, { reverseRotation: DEFAULT_CONVERSION_ANGLE });
}

// Função auxiliar para converter coordenadas cartesianas para isométricas
export function cartesianToIso(x, y) {
  return cartesianToIsoProjection(x, y, { reverseRotation: DEFAULT_CONVERSION_ANGLE });
}

/**
 * Projection-aware: cartesian to iso conversion using projection constants.
 * @param {number} x - Cartesian X
 * @param {number} y - Cartesian Y
 * @param {{reverseRotation?: number}} projection - Projection with reverseRotation in radians
 * @returns {{x: number, y: number}}
 */
export function cartesianToIsoProjection(x, y, projection) {
  const angle = -(projection?.reverseRotation ?? DEFAULT_CONVERSION_ANGLE);
  return {
    x: x * Math.cos(angle) - y * Math.sin(angle),
    y: x * Math.sin(angle) + y * Math.cos(angle)
  };
}

/**
 * Projection-aware: iso to cartesian conversion (inverse of cartesianToIsoProjection).
 * @param {number} isoX - Iso X
 * @param {number} isoY - Iso Y
 * @param {{reverseRotation?: number}} projection - Projection with reverseRotation in radians
 * @returns {{x: number, y: number}}
 */
export function isoToCartesianProjection(isoX, isoY, projection) {
  const angle = projection?.reverseRotation ?? DEFAULT_CONVERSION_ANGLE;
  return {
    x: isoX * Math.cos(angle) - isoY * Math.sin(angle),
    y: isoX * Math.sin(angle) + isoY * Math.cos(angle)
  };
}

/**
 * Computes isometric token placement position with axis-correct scaling.
 * X uses scaleX (width); Y uses scaleY (height) so rectangular tokens don't drift.
 * @param {number} docX - Document top-left X (scene coords)
 * @param {number} docY - Document top-left Y (scene coords)
 * @param {number} scaleX - Token width in grid cells
 * @param {number} scaleY - Token height in grid cells
 * @param {number} gridSize - Pixels per grid cell
 * @param {{x: number, y: number}} isoOffsets - Projected offset from cartesianToIso
 * @returns {{x: number, y: number}} Mesh position
 */
export function computeTokenPlacementPosition(docX, docY, scaleX, scaleY, gridSize, isoOffsets) {
  return {
    x: docX + (scaleX * gridSize / 2) + (scaleX * (isoOffsets?.x ?? 0)),
    y: docY + (scaleY * gridSize / 2) + (scaleY * (isoOffsets?.y ?? 0))
  };
}

// Função auxiliar para calcular a menor diagonal do losango (distância vertical entre vértices)
export function calculateIsometricVerticalDistance(width, height) {
  // Em uma projeção isométrica com rotação de 45°, a distância vertical
  // entre os vértices é a altura do losango formado
  return Math.sqrt(2) * Math.min(width, height);
}

// a simple utility function that can pop the last part of a "." separated string and retrieve the last part of it
// used to get "offsetX" from "flags.isometric-perspective.offsetX"
export function getFlagName(str) {
  const parts = str.split('.');
  return parts.pop();
}

// adjust the input values in real time when the mosue is moving
export function adjustInputWithMouseDrag(event,config){
  if(config.isDragging){
    event.preventDefault();
    const deltaX = event.clientX - config.dragStartX;
    const deltaY = event.clientY - config.dragStartY;
    const finalValueX = roundToPrecision((config.originalX - (deltaY * config.adjustmentX) ) , getDecimalPrecision(config.adjustmentX));
    const finalValueY = roundToPrecision((config.originalY +  (deltaX * config.adjustmentY) ) , getDecimalPrecision(config.adjustmentY));
    config.inputX.value = finalValueX;
    config.inputY.value = finalValueY;
    config.inputX.dispatchEvent(new Event('change', { bubbles: true }));
    config.inputY.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

export function parseNum (input) { 
  return parseFloat(input.value) || 0;
} 

export function roundToPrecision(num,precision){
  if (precision <= 0) {
        return Math.round(num);
    }
    const factor = Math.pow(10, precision);
    return Math.round(num * factor) / factor;
}

function getDecimalPrecision(step) {
    if (step === 0 || step === 1) return 0;
    const stepStr = step.toString();
    if (stepStr.includes('.')) {
        return stepStr.split('.')[1].length;
    }
    return 0;
}

export function patchConfig(documentSheet, config, args) {
  if (!documentSheet) return;
  
  // Check if already patched
  if (documentSheet.TABS?.sheet?.tabs?.some(tab => tab.id === config.tabId)) return;
  
  // Adding the isometric tab data to the config parts
  if (documentSheet.TABS?.sheet?.tabs) {
    documentSheet.TABS.sheet.tabs.push({ id: config.tabId, group: config.tabGroup, label:config.label, icon: config.icon });
  }
  
  // Adding the part template
  if (documentSheet.PARTS) {
    documentSheet.PARTS.isometric = {template: config.templatePath};

    // Re-order footer to be last
    if (documentSheet.PARTS.footer) {
      const footerPart = documentSheet.PARTS.footer;
      delete documentSheet.PARTS.footer;
      documentSheet.PARTS.footer = footerPart;
    }
  }

  // Override part context to include the isometric-perspective config data
  const defaultRenderPartContext = documentSheet.prototype._preparePartContext;
  documentSheet.prototype._preparePartContext = async function(partId, context, options) {
    if (partId === "isometric") {
      // Handle both 'document' and 'token' properties for compatibility
      const doc = this.document || this.token;
      if (!doc) {
        logWarn("Unable to access token document");
        return { tab: context.tabs?.[partId] };
      }
      
      const flags = doc.flags?.[config.moduleConfig.MODULE_ID] ?? {};

      debugLog("Token/Tile config context", {
        ...flags,
        ...args,
        document: doc,
        tab: context.tabs?.[partId],
      });

      return {
        ...flags,
        ...args,
        document: doc,
        tab: context.tabs?.[partId],
      }
    }
    return defaultRenderPartContext?.call(this, partId, context, options) || {};
  }
}

/**
 * Projects a grid-space point (x, y) to Visual Y for depth sorting.
 * Uses stage rotation and skew; higher Visual Y = "in front" (drawn last).
 * Pure function for testing.
 * @param {number} x - X in scene coords
 * @param {number} y - Y in scene coords
 * @param {number} rotation - Stage rotation (radians)
 * @param {number} skewX - Stage skew X (radians)
 * @param {number} skewY - Stage skew Y (radians)
 * @returns {number} Visual Y for sort comparison
 */
export function computeVisualYForSort(x, y, rotation, skewX, skewY) {
  const tanSx = Math.tan(skewX);
  const tanSy = Math.tan(skewY);
  const xSkewed = x + y * tanSx;
  const ySkewed = y + x * tanSy;
  return xSkewed * Math.sin(rotation) + ySkewed * Math.cos(rotation);
}

/**
 * Calculates the sort value for a token based on isometric depth.
 * Visual reference: token visual center (mesh position when available).
 * Objects lower on screen (higher Visual Y) are "in front" and get higher sort.
 * @param {Token|TokenDocument} token - The token or token document to calculate for.
 * @returns {number} The calculated sort value.
 */
export function calculateTokenSortValue(token) {
  const scene = canvas?.scene;
  if (!scene) return 0;

  const doc = token.document || token;
  let x, y;

  if (token.mesh?.position) {
    x = token.mesh.position.x;
    y = token.mesh.position.y;
  } else {
    const gridSize = scene.grid?.size ?? 100;
    const scaleX = doc.width ?? 1;
    const scaleY = doc.height ?? 1;
    x = (doc.x ?? 0) + (scaleX * gridSize) / 2;
    y = (doc.y ?? 0) + (scaleY * gridSize) / 2;
  }

  const r = canvas.app.stage.rotation;
  const sx = canvas.app.stage.skew.x;
  const sy = canvas.app.stage.skew.y;
  const visualY = computeVisualYForSort(x, y, r, sx, sy);

  debugLog(`[SortCalc] ${token.name || token.id} | (${x.toFixed(0)},${y.toFixed(0)}) -> VisY: ${visualY.toFixed(2)} | Sort: ${Math.round(visualY * 10)}`);

  return Math.round(visualY * 10);
}

/**
 * Lightweight leading+trailing throttle to coalesce noisy hook updates.
 * First call runs immediately; subsequent calls within the wait window
 * collapse into a single trailing execution with the latest arguments.
 */
export function throttle(fn, wait = 50) {
  let timeoutId = null;
  let trailing = false;
  let lastArgs;

  return (...args) => {
    lastArgs = args;

    if (timeoutId) {
      trailing = true;
      return;
    }

    fn(...lastArgs);

    timeoutId = setTimeout(() => {
      timeoutId = null;
      if (trailing) {
        trailing = false;
        fn(...lastArgs);
      }
    }, wait);
  };
}

// Generic function to create adjustable buttons with drag functionality
export function createAdjustableButton(options) {
  // Destructure configuration options with default values
  const {
      buttonElement,            // Button element to attach listener to
      inputs,                   // Array of input elements to update [InputX, InputY]
      adjustmentScale = 0.1,    // Scale factor or Function returning [scaleX, scaleY]
      valueConstraints = null,  // Optional min/max constraints {min, max}
      roundingPrecision = 0,     // Number of decimal places
      onInputCallback = null,    // Optional callback after input update
      onDragStart = null,        // Optional callback on drag start
      onDragEnd = null           // Optional callback on drag end
  } = options;

  if (!buttonElement) return;

  // Apply basic styling if needed
  buttonElement.style.cursor = 'pointer';

  // Apply derived step attribute
  const step = Math.pow(10, -roundingPrecision);
  inputs.forEach(input => {
      if (input) input.step = step;
  });

  // State variables
  let isAdjusting = false;
  let startX = 0;
  let startY = 0;
  let originalValues = [0, 0];

  const applyAdjustment = (e) => {
      if (!isAdjusting) return;

      // Isometric Logic:
      // Mouse Vertical (DeltaY) affects Input X (index 0)
      // Mouse Horizontal (DeltaX) affects Input Y (index 1)
      const moveY = e.clientY; 
      const moveX = e.clientX;
      
      const deltaScreenX = moveX - startX;
      const deltaScreenY = moveY - startY;

      // Determine current scales
      let scales = [0.1, 0.1];
      if (typeof adjustmentScale === 'function') {
          scales = adjustmentScale(); // Expects [scaleX, scaleY]
      } else if (Array.isArray(adjustmentScale)) {
          scales = adjustmentScale;
      } else {
          scales = [adjustmentScale, adjustmentScale];
      }

      // Axis Swap for Isometric:
      // Input 0 (X) <--- Screen Y (Inverted: Up adds, Down subtracts for originalX logic? No, check original logic)
      // Original logic: finalValueX = originalX - (deltaY * adj). DeltaY = clientY - startY. (Drag Down = Pos Delta).
      // So Drag Down (Pos Delta) -> Subtracts X. Drag UP (Neg Delta) -> Adds X.
      // My code below use -deltaScreenY. If Drag Down (Pos), -Pos is Neg. Adds negative -> Subtracts. Correct.
      
      const adjustments = [
          -(deltaScreenY) * scales[0], 
          deltaScreenX * scales[1]     
      ];

      // Update inputs
      inputs.forEach((input, index) => {
          if (!input) return;
          
          let newValue = originalValues[index] + adjustments[index];

          // Constraints
          if (valueConstraints) {
              newValue = Math.max(valueConstraints.min, Math.min(valueConstraints.max, newValue));
          }

          // Rounding
          const factor = Math.pow(10, roundingPrecision);
          newValue = Math.round(newValue * factor) / factor;

          input.value = newValue; 
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
      });
      
      if (onInputCallback) onInputCallback();
  };

  const onMouseDown = (e) => {
      e.preventDefault();
      isAdjusting = true;
      startX = e.clientX;
      startY = e.clientY;

      // Capture original values
      originalValues = inputs.map(input => input ? (parseFloat(input.value) || 0) : 0);

      if (onDragStart) onDragStart();

      window.addEventListener('mousemove', applyAdjustment);
      window.addEventListener('mouseup', onMouseUp);
  };

  const onMouseUp = (e) => {
      isAdjusting = false;
      window.removeEventListener('mousemove', applyAdjustment);
      window.removeEventListener('mouseup', onMouseUp);
      
      if (onDragEnd) onDragEnd();
  };

  buttonElement.addEventListener('mousedown', onMouseDown);
  
  // Prevent form submission on click
  buttonElement.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
  });
}