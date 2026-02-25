import { isometricModuleConfig } from './consts.js';
import { ISOMETRIC_CONST } from './consts.js';
import { debugLog } from './logger.js';

export function registerHUDConfig() {
  Hooks.on("canvasPan", syncActiveHUDPositions);
}

/**
 * Re-adjust HUD positions for any active Token/Tile/Drawing HUDs when the canvas pans or zooms.
 * Keeps HUD controls aligned with their placeables in isometric scenes (US-002).
 */
function syncActiveHUDPositions() {
  if (!canvas?.ready || !game.scenes?.current) return;
  const scene = game.scenes.current;
  const isSceneIsometric = scene.getFlag(isometricModuleConfig.MODULE_ID, "isometricEnabled");
  const isometricWorldEnabled = game.settings.get(isometricModuleConfig.MODULE_ID, "worldIsometricFlag");
  if (!isometricWorldEnabled || !isSceneIsometric) return;

  requestAnimationFrame(() => {
    const hud = canvas.hud;
    if (!hud) return;
    for (const key of ["token", "tile", "drawing"]) {
      const layer = hud[key];
      if (layer?.object && layer?.element) {
        adjustHUDPosition(layer, layer.element);
      }
    }
  });
}

export function handleRenderTokenHUD(hud, html, _data) {
  const scene = game.scenes?.current;
  if (!scene) return;
  const isSceneIsometric = scene.getFlag(isometricModuleConfig.MODULE_ID, "isometricEnabled");
  const isometricWorldEnabled = game.settings.get(isometricModuleConfig.MODULE_ID, "worldIsometricFlag");

  if (isometricWorldEnabled && isSceneIsometric) {
    requestAnimationFrame(() => adjustHUDPosition(hud, html));
  }
}

export function handleRenderTileHUD(hud, html, _data) {
  const scene = game.scenes?.current;
  if (!scene) return;
  const isSceneIsometric = scene.getFlag(isometricModuleConfig.MODULE_ID, "isometricEnabled");
  const isometricWorldEnabled = game.settings.get(isometricModuleConfig.MODULE_ID, "worldIsometricFlag");

  if (isometricWorldEnabled && isSceneIsometric) {
    requestAnimationFrame(() => adjustHUDPosition(hud, html));
  }
}

export function handleRenderDrawingHUD(hud, html, _data) {
  const scene = game.scenes?.current;
  if (!scene) return;
  const isSceneIsometric = scene.getFlag(isometricModuleConfig.MODULE_ID, "isometricEnabled");
  const isometricWorldEnabled = game.settings.get(isometricModuleConfig.MODULE_ID, "worldIsometricFlag");

  if (isometricWorldEnabled && isSceneIsometric) {
    requestAnimationFrame(() => adjustHUDPosition(hud, html));
  }
}

// Function to calculate the isometric position relative to the grid
// Best for Tokens which should stay anchored to their grid location despite art offsets.
export function calculateIsometricPosition(x, y) {
  const rotation = ISOMETRIC_CONST.HudAngle;
  const isoX =        (x + y) * Math.cos(rotation);
  const isoY = (-1) * (x - y) * Math.sin(rotation);
  return { x: isoX, y: isoY };
}

// Final HUD adjustment logic using a unified approach
export function adjustHUDPosition(hud, html) {
  const object = hud.object;
  if (!object) return;

  // 1. Get the center of the placeable in World Coordinates (Grid/Map space)
  const center = object.center;
  
  // 2. Project world coordinates to Global Screen Coordinates
  // We use canvas.app.stage because it holds the Isometric Transform (Rotation/Skew) + Pan/Zoom
  const globalPos = canvas.app.stage.toGlobal(center);

  // 3. Convert Global Screen Coordinates to HUD-Parent Local Coordinates
  // This accounts for any scaling/positioning of the HUD layer itself
  const parent = html.parentElement || document.body;
  const parentRect = parent.getBoundingClientRect();
  const zoom = canvas.stage.scale.x; // Assumes HUD parent scales with stage zoom (standard Foundry behavior)

  const targetPos = {
    x: (globalPos.x - parentRect.left) / zoom,
    y: (globalPos.y - parentRect.top) / zoom
  };

  // 4. Apply position and scale to HUD element
  // Scale HUD based on grid size to match isometric asset growth
  // Default grid size is 100, if scene grid is larger (e.g. 256), HUD should scale up
  const gridSize = canvas.scene.grid.size;
  const hudScale = gridSize / 100;

  Object.assign(html.style, {
    left: `${targetPos.x}px`,
    top: `${targetPos.y}px`,
    transform: `translate(-50%, -50%) scale(${hudScale})`,
    transformOrigin: "center"
  });

  debugLog(`HUD Adjustment [${object.document.documentName}]:`, {
    worldCenter: center,
    globalPos,
    targetPos
  });
}








/*
// Function to calculate the isometric position
export function calculateIsometricPosition_not(x, y) {
  // Get rotation and skew values
  const rotation = ISOMETRIC_CONST.HudAngle; //ISOMETRIC_CONST.rotation;  // in degrees
  const skewX = 0;//ISOMETRIC_CONST.skewX;       // in degrees
  const skewY = 0;//ISOMETRIC_CONST.skewY;       // in degrees

  // Convert angles from degrees to radians
  const rotationRad = rotation * (Math.PI / 180);
  const skewXRad = skewX * (Math.PI / 180);
  const skewYRad = skewY * (Math.PI / 180);

  // 1. Apply skew distortions
  const skewedX = x + y * Math.tan(skewXRad);  // Distortion on X axis due to skewX
  const skewedY = y + x * Math.tan(skewYRad);  // Distortion on Y axis due to skewY

  // 2. Apply rotation to the distorted coordinates
  const isoX =        (skewedX + skewedY) * Math.cos(rotationRad);   // Apply rotation to X axis
  const isoY = (-1) * (skewedX - skewedY) * Math.sin(rotationRad); // Apply rotation to Y axis

  // Return the calculated isometric position
  return { x: isoX, y: isoY };
}

function isometricToCartesianGPT(x_iso, y_iso) {
  // Extract the transformation parameters
  const rotation = Math.abs(ISOMETRIC_CONST.rotation);
  const skewX = Math.abs(ISOMETRIC_CONST.skewX);
  const skewY = Math.abs(ISOMETRIC_CONST.skewY);
  
  // Create a transformation matrix based on the provided rotations and distortions
  // Create a "dummy" object to apply the transformation
  const obj = new PIXI.Graphics();

  // Apply the transformation with setTransform
  obj.setTransform(x_iso, y_iso, 0, 0, 1, 1, -rotation, skewX, skewY);

  // The object's transformation matrix now contains rotation and skew
  const matrix = obj.transform.worldTransform;

  // Invert the matrix to reverse the transformation
  const invertedMatrix = matrix.invert();
  debugLog("cartesianToIso matrix", { matrix, invertedMatrix });

  // Apply the inverse matrix to the isometric coordinates
  const cartesian = invertedMatrix.apply({ x: x_iso, y: y_iso });

  return { x: cartesian.x, y: cartesian.y };
}

function isometricToCartesian(isoX, isoY) {
  // Define transformation parameters
  const rotation = ISOMETRIC_CONST.rotation;
  const skewX = -ISOMETRIC_CONST.skewX;
  const skewY = -ISOMETRIC_CONST.skewY;
  
  // Step 1: Reverse the rotation
  const unrotatedX = isoX * Math.cos(rotation) - isoY * Math.sin(rotation);
  const unrotatedY = isoX * Math.sin(rotation) + isoY * Math.cos(rotation);

  // Step 2: Reverse the skew in X
  const unskewedX = unrotatedX - unrotatedY * Math.tan(skewX);

  // Step 3: Reverse the skew in Y
  const cartesianY = unrotatedY - unskewedX * Math.tan(skewY);
  const cartesianX = unskewedX;

  return { x: cartesianX, y: cartesianY };
}

function isometricToCartesianGPT4o(x, y) {
  const angle = 30; //ISOMETRIC_CONST.rotation;
  const skewX = ISOMETRIC_CONST.skewX;
  const skewY = ISOMETRIC_CONST.skewY;
  const scale = 1; //-ISOMETRIC_CONST.ratio;
  
  // Ajuste de escala
  let adjustedX = x * scale;
  let adjustedY = y * scale;

  // Calculation of the composite matrix T values (with rotation + skewX + skewY)
  const cosTheta = Math.cos(angle);
  const sinTheta = Math.sin(angle);

  // Components of the composite matrix T
  const a = cosTheta + sinTheta * skewY;
  const b = cosTheta * skewX + sinTheta;
  const c = -sinTheta + cosTheta * skewY;
  const d = -sinTheta * skewX + cosTheta;

  // Determinant of T
  const detT = a * d - b * c;

  if (detT === 0) {
      throw new Error("The transformation matrix is not invertible");
  }

  // Inversion of matrix T^-1
  const invDetT = 1 / detT;

  // Matrizes inversas
  const a_inv = d * invDetT;
  const b_inv = -b * invDetT;
  const c_inv = -c * invDetT;
  const d_inv = a * invDetT;

  // Apply the inverse matrix to find the cartesian coordinates
  let cartesianX = a_inv * adjustedX + b_inv * adjustedY;
  let cartesianY = c_inv * adjustedX + d_inv * adjustedY;

  // Return the cartesian coordinates
  return { x: cartesianX, y: cartesianY };
}
*/