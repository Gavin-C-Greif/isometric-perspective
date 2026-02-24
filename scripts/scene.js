import { applyIsometricPerspective, applyBackgroundTransformation, resetBackgroundTracking } from './transform.js';
import { isometricModuleConfig, updateIsometricConstants, parseCustomProjection, updateCustomProjection, PROJECTION_TYPES, DEFAULT_PROJECTION, CUSTOM_PROJECTION } from './consts.js';
import { patchConfig} from './utils.js';
import { debugLog, logError } from './logger.js';

export function createSceneIsometricTab(){
  
  const sceneTabConfig = {
    moduleConfig: isometricModuleConfig,
    label: game.i18n.localize("isometric-perspective.tab_isometric_name"),
    tabGroup : "sheet",
    tabId : "isometric",
    icon: "fas fa-cube",
    templatePath: 'modules/isometric-perspective/templates/scene-config.hbs'
  }

  // Scene config data
  const FoundrySceneConfig = foundry.applications.sheets.SceneConfig;
  const DefaultSceneConfig = Object.values(CONFIG.Scene.sheetClasses.base).find((d) => d.default)?.cls;
  const SceneConfig = DefaultSceneConfig?.prototype instanceof FoundrySceneConfig ? DefaultSceneConfig : FoundrySceneConfig;

  const projectionTypes =  [...Object.keys(PROJECTION_TYPES)];
  const currentProjection = SceneConfig.object?.getFlag(isometricModuleConfig.MODULE_ID, 'projectionType') ?? DEFAULT_PROJECTION;
  
  const extraSceneConfig = {
    projectionTypes: projectionTypes,
    document: currentProjection
  }

  patchConfig(SceneConfig,sceneTabConfig, extraSceneConfig);

}

// disable the custom projection field when custom projection isnt selected.
export function initSceneForm (app, html, context, options){

  const currentScale = app.document.getFlag(isometricModuleConfig.MODULE_ID, 'isometricScale');
  const inputScale = html.querySelector('range-picker[name="flags.isometric-perspective.isometricScale"]');
  inputScale.value = currentScale ?? 1;

  const projectionSelect = html.querySelector('select[name="flags.isometric-perspective.projectionType"]');
  const customProjectionInput = html.querySelector('input[name="flags.isometric-perspective.customProjection"]');
  const customProjectionContainer = html.querySelector('.custom-projection-container');
  
  projectionSelect.addEventListener('change', (event) => {
    if (event.target.value === "Custom Projection"){
      customProjectionInput.disabled = false;
      customProjectionContainer.classList.remove('hidden');
    } else {
      customProjectionInput.disabled = true;
      customProjectionContainer.classList.add('hidden');
    }
  });

}

export function handleUpdateScene(scene, changes) {

  if (scene.id !== canvas.scene?.id) return;

  if (
    changes.img ||
    changes.background?.offsetX !== undefined ||
    changes.background?.offsetY !== undefined ||
    changes.flags?.[isometricModuleConfig.MODULE_ID]?.isometricEnabled !== undefined ||
    changes.flags?.[isometricModuleConfig.MODULE_ID]?.isometricBackground !== undefined ||
    changes.flags?.[isometricModuleConfig.MODULE_ID]?.projectionType !== undefined ||
    changes.grid !== undefined ||
    changes.gridType !== undefined ||
    changes.gridSize !== undefined
  ) {
    const isIsometric = scene.getFlag(isometricModuleConfig.MODULE_ID, "isometricEnabled");
    const shouldTransformBackground = scene.getFlag(isometricModuleConfig.MODULE_ID, "isometricBackground") ?? false;
    const projectionType = scene.getFlag(isometricModuleConfig.MODULE_ID, "projectionType") ?? DEFAULT_PROJECTION;

    // logic for custom projection
    if (projectionType === 'Custom Projection') {
      const customProjectionValue = scene.getFlag(isometricModuleConfig.MODULE_ID, "customProjection");
      if (customProjectionValue) {
        try {
          const parsedCustom = parseCustomProjection(customProjectionValue);
          updateCustomProjection(parsedCustom);
        } catch (error) {
          logError("Custom projection parsing failed", error);
          ui?.notifications?.warn("Isometric: Custom projection invalid. Expected 8 comma-separated numbers. Check Scene Settings > Isometric tab.");
        }
      }
    }

    requestAnimationFrame(() => {
      updateIsometricConstants(projectionType);
      applyIsometricPerspective(scene, isIsometric);
      applyBackgroundTransformation(scene, isIsometric, shouldTransformBackground);
    });
  }
}

export async function handleCanvasReady(canvas) {
  const scene = canvas.scene;
  if (!scene) return;

  const isSceneIsometric = scene.getFlag(isometricModuleConfig.MODULE_ID, "isometricEnabled");
  const shouldTransformBackground = scene.getFlag(isometricModuleConfig.MODULE_ID, "isometricBackground") ?? false;
  let projectionType = scene.getFlag(isometricModuleConfig.MODULE_ID, "projectionType");
  
  if (!projectionType) {
    projectionType = DEFAULT_PROJECTION;
    await scene.setFlag(isometricModuleConfig.MODULE_ID, "projectionType", projectionType);
  }

  if (projectionType === 'Custom Projection') {
    const customProjectionValue = scene.getFlag(isometricModuleConfig.MODULE_ID, "customProjection");
    if (customProjectionValue) {
      try {
        const parsedCustom = parseCustomProjection(customProjectionValue);
        updateCustomProjection(parsedCustom);
      } catch (error) {
        logError("Custom projection parsing failed", error);
        ui?.notifications?.warn("Isometric: Custom projection invalid. Expected 8 comma-separated numbers. Check Scene Settings > Isometric tab.");
      }
    }
  }
  
  updateIsometricConstants(projectionType);

  // Fresh canvas — reset background tracking so the default state is captured
  // before any isometric transforms are applied.
  resetBackgroundTracking();

  applyIsometricPerspective(scene, isSceneIsometric);
  applyBackgroundTransformation(scene, isSceneIsometric, shouldTransformBackground);
  
  // Force a camera update to synchronize the HUD layer transformations with the now-isometrically-transformed stage.
  // This ensures the #hud container correctly aligns with the stage immediately upon scene load.
  if (isSceneIsometric) {
    // We use a small delay to allow the PIXI stage transformations to settle before forcing the HTML sync.
    setTimeout(() => {
        if (!canvas.ready) return;
        
        // Trigger a dummy pan to force Foundry's internal camera-to-interface synchronization.
        // We use the current pivot and scale to ensure the camera does not actually move.
        canvas.pan({
            x: canvas.stage.pivot.x,
            y: canvas.stage.pivot.y,
            scale: canvas.stage.scale.x
        });
        
        debugLog("Forced HUD synchronization completed.");
    }, 250);
  }
  
  // debug print
  debugLog("handleCanvasReady");
}

export function handleCanvasResize(canvas) {
  const scene = canvas.scene;
  if (!scene) return;
  
  const isSceneIsometric = scene.getFlag(isometricModuleConfig.MODULE_ID, "isometricEnabled");
  const shouldTransformBackground = scene.getFlag(isometricModuleConfig.MODULE_ID, "isometricBackground") ?? false;
  const projectionType = scene.getFlag(isometricModuleConfig.MODULE_ID, "projectionType") ?? DEFAULT_PROJECTION;

  updateIsometricConstants(projectionType);
  
  if (isSceneIsometric && shouldTransformBackground) {
    applyBackgroundTransformation(scene, isSceneIsometric, shouldTransformBackground);
  }
  
  // debug print
  debugLog("handleCanvasResize");
}


/**
 * Grid config hooks: Re-apply isometric transforms when Scene Settings > Grid config
 * (including the Ruler Tool) is used. Without these, the canvas does not refresh
 * correctly after grid/ruler edits in isometric scenes (README Known Bugs).
 */
function reapplyTransformsAfterGridConfig() {
  const scene = canvas?.scene;
  if (!scene || !canvas?.ready) return;

  const isIsometric = scene.getFlag(isometricModuleConfig.MODULE_ID, "isometricEnabled");
  const shouldTransformBackground = scene.getFlag(isometricModuleConfig.MODULE_ID, "isometricBackground") ?? false;
  const projectionType = scene.getFlag(isometricModuleConfig.MODULE_ID, "projectionType") ?? DEFAULT_PROJECTION;

  if (isIsometric) {
    requestAnimationFrame(() => {
      if (!canvas?.ready) return;
      updateIsometricConstants(projectionType);
      applyIsometricPerspective(scene, isIsometric);
      applyBackgroundTransformation(scene, isIsometric, shouldTransformBackground);
      canvas.draw();
    });
  }
}

// Track listener cleanup by GridConfig app instance to avoid duplicate handlers across re-renders.
const gridConfigListenerCleanupByApp = new WeakMap();

Hooks.on("renderGridConfig", (app, html, data) => {
  const previousCleanup = gridConfigListenerCleanupByApp.get(app);
  if (previousCleanup) {
    previousCleanup();
    gridConfigListenerCleanupByApp.delete(app);
  }

  const scene = app.object;
  if (!scene) return;

  const isIsometric = scene.getFlag(isometricModuleConfig.MODULE_ID, "isometricEnabled");
  const shouldTransformBackground = scene.getFlag(isometricModuleConfig.MODULE_ID, "isometricBackground") ?? false;

  if (isIsometric) {
    requestAnimationFrame(() => {
      applyIsometricPerspective(scene, isIsometric);
      applyBackgroundTransformation(scene, isIsometric, shouldTransformBackground);
    });
  }

  const gridConfigEl = html.querySelector?.(".grid-config");
  if (gridConfigEl) {
    const onGridConfigChange = () => {
      const currentScene = app.object;
      if (!currentScene) return;
      const currentIsometric = currentScene.getFlag(isometricModuleConfig.MODULE_ID, "isometricEnabled");
      const currentTransformBackground = currentScene.getFlag(isometricModuleConfig.MODULE_ID, "isometricBackground") ?? false;

      if (currentIsometric) {
        requestAnimationFrame(() => {
          applyIsometricPerspective(currentScene, currentIsometric);
          applyBackgroundTransformation(currentScene, currentIsometric, currentTransformBackground);
        });
      }
    };

    gridConfigEl.addEventListener("change", onGridConfigChange);
    gridConfigListenerCleanupByApp.set(app, () => {
      gridConfigEl.removeEventListener("change", onGridConfigChange);
    });
  }
});

Hooks.on("gridConfigUpdate", () => {
  reapplyTransformsAfterGridConfig();
});

Hooks.on("closeGridConfig", (app) => {
  const cleanup = gridConfigListenerCleanupByApp.get(app);
  if (cleanup) {
    cleanup();
    gridConfigListenerCleanupByApp.delete(app);
  }

  const scene = app.object;
  if (!scene) return;

  const isometricWorldEnabled = game.settings.get(isometricModuleConfig.MODULE_ID, "worldIsometricFlag");
  const isIsometric = scene.getFlag(isometricModuleConfig.MODULE_ID, "isometricEnabled");

  if (isometricWorldEnabled && isIsometric) {
    reapplyTransformsAfterGridConfig();
  }
});
