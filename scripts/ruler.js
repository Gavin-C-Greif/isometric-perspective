import { isometricModuleConfig, ISOMETRIC_CONST } from './consts.js';
import { cartesianToIsoProjection, safeDivide, computeOffsetComponentsForProjection } from './utils.js';
import { debugLog } from './logger.js';

/**
 * Helper to apply isometric adjustments to label context.
 * extracted from TokenRulerIsometric for reuse.
 * @param {Object} ctx      The label context to adjust
 * @param {Token} [token]   The token to anchor visual offsets to (optional)
 * @returns {Object}        The adjusted context
 */
function applyIsometricLabelAdjustments(ctx, token) {
  if (!ctx?.position || !canvas.scene) return ctx;

  const isIsometric = canvas.scene.getFlag(isometricModuleConfig.MODULE_ID, "isometricEnabled");
  const worldIsoEnabled = game.settings.get(isometricModuleConfig.MODULE_ID, "worldIsometricFlag");
  if (!worldIsoEnabled || !isIsometric) return ctx;

  // 1. Start with the logical grid position
  let x = ctx.position.x;
  let y = ctx.position.y;

  // 2. Apply Token Offsets (Elevation/Art Offset) - shared helper with transform.js
  if (token?.document) {
      const doc = token.document;
      const elevationAdjustment = game.settings.get(isometricModuleConfig.MODULE_ID, "enableHeightAdjustment");
      const elev = elevationAdjustment ? (doc.elevation || 0) : 0;
      const gridSize = canvas.scene.grid.size;
      const gridDist = canvas.scene.grid.distance;
      const scaleX = doc.width || 1;
      const scaleY = doc.height || 1;

      const { offsetX: ox, offsetY: oy } = computeOffsetComponentsForProjection(
        doc.getFlag(isometricModuleConfig.MODULE_ID, "offsetX") || 0,
        doc.getFlag(isometricModuleConfig.MODULE_ID, "offsetY") || 0,
        elev, gridSize, gridDist, scaleX
      );

      if (ox !== 0 || oy !== 0) {
          const isoOffsets = cartesianToIsoProjection(ox, oy, ISOMETRIC_CONST);
          x += isoOffsets.x * scaleX;
          y += isoOffsets.y * scaleY;
      }
  }

  // 3. Project to Screen Space using the Stage's exact transform
  // This automatically accounts for rotation, skew, and zoom.
  const projected = canvas.stage.toGlobal({x, y});
  
  // 4. Map screen coordinates back to HUD relative coordinates (accounting for zoom scale)
  const hud = document.getElementById("hud");
  if (hud) {
      const hudRect = hud.getBoundingClientRect();
      const zoom = canvas.stage.scale.x;
      const dx = projected.x - hudRect.left;
      const dy = projected.y - hudRect.top;
      ctx.position.x = safeDivide(dx, zoom, dx);
      ctx.position.y = safeDivide(dy, zoom, dy);
  }
  
  if ( !ctx.cssClass ) ctx.cssClass = "";
  const classes = new Set(ctx.cssClass.split(" ").filter(Boolean));
  classes.add("iso-ruler-label");
  ctx.cssClass = Array.from(classes).join(" ");

  return ctx;
}

/**
 * Patch the TokenRuler to correctly position labels in isometric scenes.
 */
function extendTokenRuler() {
  const ParentRuler = CONFIG.Token.rulerClass;
  if (!ParentRuler) return;
  
  // Apply the TokenRuler override if not already applied
  if (!ParentRuler.prototype.hasOwnProperty("_isIsometricRuler")) {
      /**
       * Subclass the currently active TokenRuler to add isometric label positioning.
       */
      class TokenRulerIsometric extends ParentRuler {
        get _isIsometricRuler() { return true; }

        _getWaypointLabelContext(waypoint, state) {
          const ctx = super._getWaypointLabelContext(waypoint, state);
          return applyIsometricLabelAdjustments(ctx, this.sourceToken);
        }
      }

      CONFIG.Token.rulerClass = TokenRulerIsometric;
      debugLog("Extended TokenRuler via subclassing.");
  }
}

/**
 * Patch the CanvasRuler (Measure tool) to correctly position labels in isometric scenes.
 */
function extendCanvasRuler() {
  const ParentRuler = CONFIG.Canvas.rulerClass;
  if (!ParentRuler) return;

  // Apply the CanvasRuler override if not already applied
  if (!ParentRuler.prototype.hasOwnProperty("_isIsometricCanvasRuler")) {
      /**
       * Subclass the currently active CanvasRuler to add isometric label positioning.
       */
      class CanvasRulerIsometric extends ParentRuler {
        get _isIsometricCanvasRuler() { return true; }

        _getWaypointLabelContext(waypoint, state) {
          const ctx = super._getWaypointLabelContext(waypoint, state);
          // For standard Measure Tool, we usually do not anchor to tokens.
          return applyIsometricLabelAdjustments(ctx, null);
        }
      }

      CONFIG.Canvas.rulerClass = CanvasRulerIsometric;
      debugLog("Extended CanvasRuler via subclassing.");
  }
}

/**
 * Register all Ruler patches
 */
export function registerRuler() {
  extendTokenRuler();
  extendCanvasRuler();
}
