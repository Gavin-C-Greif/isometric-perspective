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
