import { isometricModuleConfig } from './consts.js';
import {
  cartesianToIsoProjection,
  computeTokenPlacementPosition,
  computeTextureFitScale,
  safeDivide,
  computeOffsetComponentsForProjection,
  computeElevationVisualOffset
} from './utils.js';
import { ISOMETRIC_CONST } from './consts.js';
import { debugLog, debugWarn } from './logger.js';

const canvasTile = foundry.canvas.placeables.Tile;
const canvasToken = foundry.canvas.placeables.Token;

// Track baseline token/tile state so we can restore cleanly when disabling isometric transforms.
const _originalTokenState = new WeakMap();
const _originalTileState = new WeakMap();

function degToRadSafe(value = 0) {
  if (!Number.isFinite(value)) return 0;
  return (foundry.utils?.degToRad?.(value)) ?? (value * Math.PI / 180);
}

function ensureBaseState(object) {
  const store = object instanceof canvasToken ? _originalTokenState : _originalTileState;
  if (store.has(object)) return store.get(object);

  const mesh = object.mesh;
  const snapshot = {
    anchorX: mesh?.anchor?.x ?? 0.5,
    anchorY: mesh?.anchor?.y ?? 0.5,
    scaleX: mesh?.scale?.x ?? 1,
    scaleY: mesh?.scale?.y ?? 1
  };

  store.set(object, snapshot);
  return snapshot;
}

function resolveAnchor(object, baseState) {
  const docAnchorX = object.document?.texture?.anchorX;
  const docAnchorY = object.document?.texture?.anchorY;

  return {
    anchorX: docAnchorX ?? baseState.anchorX ?? 0.5,
    anchorY: docAnchorY ?? baseState.anchorY ?? 0.5
  };
}

function resetTokenTransform(token, baseState) {
  const gridSize = canvas.scene.grid.size;
  const doc = token.document;
  const anchor = resolveAnchor(token, baseState);

  // Respect document rotation when returning to non-isometric mode.
  token.mesh.rotation = degToRadSafe(doc?.rotation ?? 0);
  token.mesh.skew.set(0, 0);
  token.mesh.anchor.set(anchor.anchorX, anchor.anchorY);

  // Recompute native token dimensions without any isometric adjustments or iso flags.
  const objTxtRatio_W = safeDivide(token.texture.width, gridSize, 1);
  const objTxtRatio_H = safeDivide(token.texture.height, gridSize, 1);
  const { sx, sy } = computeTextureFitScale(objTxtRatio_W, objTxtRatio_H, doc?.texture?.fit);

  const scaleX = doc?.width ?? 1;
  const scaleY = doc?.height ?? 1;
  const baseWidth = Math.abs(sx * scaleX * gridSize);
  const baseHeight = Math.abs(sy * (doc?.ring?.enabled ? scaleX : scaleY) * gridSize);

  token.mesh.width = baseWidth;
  token.mesh.height = baseHeight;

  const center = doc?.center ?? { x: (doc?.x ?? 0) + (baseWidth / 2), y: (doc?.y ?? 0) + (baseHeight / 2) };
  token.mesh.position.set(center.x, center.y);

  // Clear any elevation visuals when leaving isometric mode.
  removeTokenVisuals(token);
}

function resetTileTransform(tile, baseState) {
  const doc = tile.document;
  const anchor = resolveAnchor(tile, baseState);
  const originalWidth = tile.texture.width;
  const originalHeight = tile.texture.height;
  const docWidth = doc?.width ?? originalWidth;
  const docHeight = doc?.height ?? originalHeight;

  tile.mesh.rotation = degToRadSafe(doc?.rotation ?? 0);
  tile.mesh.skew.set(0, 0);
  tile.mesh.anchor.set(anchor.anchorX, anchor.anchorY);

  // Rebuild scale directly from document dimensions so repeated toggles do not drift.
  const scaleX = safeDivide(docWidth, originalWidth, 1);
  const scaleY = safeDivide(docHeight, originalHeight, 1);
  tile.mesh.scale.set(scaleX, scaleY);

  const posX = (doc?.x ?? 0) + (docWidth / 2);
  const posY = (doc?.y ?? 0) + (docHeight / 2);
  tile.mesh.position.set(posX, posY);
}

function resetObjectTransform(object, baseState) {
  if (object instanceof canvasToken) {
    resetTokenTransform(object, baseState);
  } else if (object instanceof canvasTile) {
    resetTileTransform(object, baseState);
  }
}

// --- Background state tracking for reversible transforms ---
let _originalBgState = null;
let _bgTransformed = false;

export function resetBackgroundTracking() {
  _originalBgState = null;
  _bgTransformed = false;
}

function captureBackgroundDefaults(bg) {
  return {
    rotation: bg.rotation,
    skewX: bg.skew.x,
    skewY: bg.skew.y,
    anchorX: bg.anchor.x,
    anchorY: bg.anchor.y,
    scaleX: bg.transform.scale.x,
    scaleY: bg.transform.scale.y,
    posX: bg.position.x,
    posY: bg.position.y,
  };
}

function restoreBackgroundDefaults(bg) {
  if (!_originalBgState) return;
  bg.rotation = _originalBgState.rotation;
  bg.skew.set(_originalBgState.skewX, _originalBgState.skewY);
  bg.anchor.set(_originalBgState.anchorX, _originalBgState.anchorY);
  bg.transform.scale.set(_originalBgState.scaleX, _originalBgState.scaleY);
  bg.position.set(_originalBgState.posX, _originalBgState.posY);
}


// Função principal que muda o canvas da cena
export function applyIsometricPerspective(scene, isSceneIsometric) {
  const isometricWorldEnabled = game.settings.get(isometricModuleConfig.MODULE_ID, "worldIsometricFlag");
  const shouldIsoTransform = isometricWorldEnabled && isSceneIsometric;

  if (shouldIsoTransform) {
    canvas.app.stage.rotation = ISOMETRIC_CONST.rotation;
    canvas.app.stage.skew.set(
      ISOMETRIC_CONST.skewX,
      ISOMETRIC_CONST.skewY
    );
  } else {
    canvas.app.stage.rotation = 0;
    canvas.app.stage.skew.set(0, 0);
  }

  // Re-apply or reset transforms for every token/tile so toggles are reversible.
  adjustAllTokensAndTilesForIsometric(shouldIsoTransform);
}



// Função auxiliar que chama a função de transformação isométrica em todos os tokens e tiles da cena
/*export function adjustAllTokensAndTilesForIsometric() {
  canvas.tokens.placeables.forEach(token => applyIsometricTransformation(token, true));
  canvas.tiles.placeables.forEach(tile => applyIsometricTransformation(tile, true));
}*/
// Batch process to speed up this function
export function adjustAllTokensAndTilesForIsometric(isSceneIsometric = true) {
  const tokensAndTiles = [...canvas.tokens.placeables, ...canvas.tiles.placeables];
  tokensAndTiles.forEach(obj => applyIsometricTransformation(obj, isSceneIsometric));
}

// Função que aplica a transformação isométrica para um token ou tile -------------------------------------------------
export function applyIsometricTransformation(object, isSceneIsometric) {
  // Don't make any transformation if the isometric module isn't active
  const isometricWorldEnabled = game.settings.get(isometricModuleConfig.MODULE_ID, "worldIsometricFlag");
  if (!object.mesh) {
    debugWarn("Mesh not found:", object);
    return;
  }

  const baseState = ensureBaseState(object);

  if (!isometricWorldEnabled) {
    resetObjectTransform(object, baseState);
    return;
  }

  // Disable isometric token projection, if the flag is active
  let isoTileDisabled = object.document.getFlag(isometricModuleConfig.MODULE_ID, 'isoTileDisabled') ?? 0;
  let isoTokenDisabled = object.document.getFlag(isometricModuleConfig.MODULE_ID, 'isoTokenDisabled') ?? 0;
  if (isoTileDisabled || isoTokenDisabled) {
    resetObjectTransform(object, baseState);
    return;
  }

  
  // Don't make transformation on the token or tile if the scene isn't isometric
  if (!isSceneIsometric) {
    resetObjectTransform(object, baseState);
    return;
  }

  // It undoes rotation and deformation
  object.mesh.rotation = ISOMETRIC_CONST.reverseRotation;
  object.mesh.skew.set(ISOMETRIC_CONST.reverseSkewX, ISOMETRIC_CONST.reverseSkewY);
  //object.mesh.anchor.set(isoAnchorX, isoAnchorY);
    
  // recovers the object characteristics of the object (token/tile)
  let texture = object.texture;
  let originalWidth = texture.width;   // art width
  let originalHeight = texture.height; // art height
  let scaleX = object.document.width;  // scale for 2x2, 3x3 tokens
  let scaleY = object.document.height; // scale for 2x2, 3x3 tokens
  
  // if Disable Auto-Scale checkbox is set, don't auto-scale tokens
  let isoScaleDisabled = object.document.getFlag(isometricModuleConfig.MODULE_ID, "isoScaleDisabled");
  if (isoScaleDisabled) scaleX = scaleY = 1;

  
  // elevation info
  let elevation = object.document.elevation;      // elevation from tokens and tiles
  let gridDistance = canvas.scene.grid.distance;  // size of one unit of the grid
  let gridSize = canvas.scene.grid.size;
  let isoScale = object.document.getFlag(isometricModuleConfig.MODULE_ID, 'scale') ?? 1;  // dynamic scale
  let offsetX = object.document.getFlag(isometricModuleConfig.MODULE_ID, 'offsetX') ?? 0; // art offset of object
  let offsetY = object.document.getFlag(isometricModuleConfig.MODULE_ID, 'offsetY') ?? 0; // art offset of object
  
  // if module settings flag is not set, don't move art token
  let ElevationAdjustment = game.settings.get(isometricModuleConfig.MODULE_ID, "enableHeightAdjustment");
  if (!ElevationAdjustment) elevation = 0;
  
  
  
  
  
  if (object instanceof canvasToken) {
    let sx = 1; // standard x
    let sy = 1; // standard y
    //We should only use the token art ratio if the ring is disabled
    //Otherwise it scales the dynamic ring subject based on the token art dimensions
    if (!object.document.ring?.enabled) {
      const gs = canvas.scene.grid.size;
      const objTxtRatio_W = safeDivide(object.texture.width, gs, 1);
      const objTxtRatio_H = safeDivide(object.texture.height, gs, 1);
      const fitScale = computeTextureFitScale(objTxtRatio_W, objTxtRatio_H, object.document.texture?.fit);
      sx = fitScale.sx;
      sy = fitScale.sy;
      object.mesh.width  = Math.abs(sx * scaleX * gridSize * isoScale * Math.sqrt(2))
      object.mesh.height = Math.abs(sy * scaleY * gridSize * isoScale * Math.sqrt(2) * ISOMETRIC_CONST.ratio)
    } else {
      //Make the token square if using dynamic ring.
      object.mesh.width = Math.abs(sx * scaleX * gridSize * isoScale * Math.sqrt(2))
      object.mesh.height = Math.abs(sy * scaleX * gridSize * isoScale * Math.sqrt(2) * ISOMETRIC_CONST.ratio)
    }
    // Shared offset/elevation projection (unified with ruler)
    const { offsetX: ox, offsetY: oy } = computeOffsetComponentsForProjection(
      offsetX, offsetY, elevation, gridSize, gridDistance, scaleX
    );
    const isoOffsets = cartesianToIsoProjection(ox, oy, ISOMETRIC_CONST);

    // Create shadow and line graphics elements
    updateTokenVisuals(object, elevation, gridSize, gridDistance);

    // Position the token with axis-correct scaling (scaleX for X, scaleY for Y)
    const pos = computeTokenPlacementPosition(
      object.document.x, object.document.y,
      scaleX, scaleY, gridSize, isoOffsets
    );
    object.mesh.position.set(pos.x, pos.y);
  }

  
  
  
  
  
  
  // If the object is a tile
  else if (object instanceof canvasTile) {
    //const sceneScale = canvas.scene.getFlag(isometricModuleConfig.MODULE_ID, "isometricScale") ?? 1;
    
    // Apply the scale by maintaining the proportion of the original art
    let finalMeshScaleX, finalMeshScaleY;
    if (object.document.getFlag(isometricModuleConfig.MODULE_ID, "isoDecoupleArtScale")) {
      finalMeshScaleX = isoScale;
      finalMeshScaleY = isoScale * ISOMETRIC_CONST.ratio;
    } else {
      finalMeshScaleX = safeDivide(scaleX, originalWidth, 1) * isoScale;
      finalMeshScaleY = safeDivide(scaleY, originalHeight, 1) * isoScale * ISOMETRIC_CONST.ratio;
    }
    object.mesh.scale.set(finalMeshScaleX, finalMeshScaleY);
    
    // Flip token horizontally, if the flag is active
    let scaleFlip = object.document.getFlag(isometricModuleConfig.MODULE_ID, 'tokenFlipped') ?? 0;
    if (scaleFlip) {
      let meshScaleX = object.mesh.scale.x;
      let meshScaleY = object.mesh.scale.y;
      object.mesh.scale.set(-meshScaleX, meshScaleY);
    }

    // Defines the manual offset to center the tile
    let isoOffsets = cartesianToIsoProjection(offsetX, offsetY, ISOMETRIC_CONST);
    
    // Set tile's position
    object.mesh.position.set(
      object.document.x + (scaleX / 2) + isoOffsets.x,
      object.document.y + (scaleY / 2) + isoOffsets.y
    );
  }
  
}





export function applyBackgroundTransformation(scene, isSceneIsometric, shouldTransform) {
  if (!canvas?.primary?.background) {
    debugWarn("Background not found.");
    return;
  }

  const background = canvas.environment.primary.background;
  const isometricWorldEnabled = game.settings.get(isometricModuleConfig.MODULE_ID, "worldIsometricFlag");
  const scale = scene.getFlag(isometricModuleConfig.MODULE_ID, "isometricScale") ?? 1;
  
  if (isometricWorldEnabled && isSceneIsometric && shouldTransform) {
    if (!_bgTransformed) {
      _originalBgState = captureBackgroundDefaults(background);
    }

    background.rotation = ISOMETRIC_CONST.reverseRotation;
    background.skew.set(
      ISOMETRIC_CONST.reverseSkewX,
      ISOMETRIC_CONST.reverseSkewY
    );
    background.anchor.set(0.5, 0.5);
    background.transform.scale.set(
      scale,
      scale * ISOMETRIC_CONST.ratio
    );
    
    const isoScene = canvas.scene;
    const padding = isoScene.padding;
    const paddingX = isoScene.width * padding;
    const paddingY = isoScene.height * padding;
    const offsetX = isoScene.background.offsetX || 0;
    const offsetY = isoScene.background.offsetY || 0;
    
    background.position.set(
      (isoScene.width / 2) + paddingX + offsetX,
      (isoScene.height / 2) + paddingY + offsetY
    );

    _bgTransformed = true;
  } else {
    if (_bgTransformed && _originalBgState) {
      restoreBackgroundDefaults(background);
    } else {
      background.rotation = 0;
      background.skew.set(0, 0);
    }
    _bgTransformed = false;
    
    debugLog("applyBackgroundTransformation RESET");
  }
}








// ----------------- Elevation -----------------

// Manter registro de todos os tokens com visuais (para controle se necessário, embora atrelado ao token facilite)
const tokensWithVisuals = new Set();

// Função para limpar todos os visuais
export function clearAllVisuals() {
  // Se estivermos atrelando ao token, basta iterar tokens existentes
  if (canvas.tokens?.placeables) {
    for (const token of canvas.tokens.placeables) {
        removeTokenVisuals(token);
    }
  }
}

// Função para verificar se um token existe na cena atual
function isTokenInCurrentScene(tokenId) {
  return canvas.tokens.placeables.some(t => t.id === tokenId);
}

export function updateTokenVisuals(token, elevacao, gridSize, gridDistance) {
  // Primeiro, remova qualquer representação visual existente
  removeTokenVisuals(token);

  // Se não há elevação ou a variável global está desativada, não cria visuais
  const tokenVisuals = game.settings.get(isometricModuleConfig.MODULE_ID, "enableTokenVisuals");
  if (elevacao <= 0 || !tokenVisuals) return;

  // Cria um novo container
  const container = new PIXI.Container();
  container.name = "isometric-elevation-visuals";
  container.interactive = false;
  container.interactiveChildren = false;
  
  // Registrar o token
  tokensWithVisuals.add(token.id);

  // Center X/Y relativo ao token
  // O código original usava token.h / 2. Vamos manter a lógica ou usar w/2, h/2?
  // Original: token.x + token.h / 2.
  // Vamos usar token.w / 2 e token.h / 2 para ser mais generico, ou manter token.h?
  // Se o token não for quadrado, center seria w/2, h/2.
  const centerX = token.w ? token.w / 2 : token.h / 2;
  const centerY = token.h / 2;

  // Criar uma sombra circular no chão (guarded: gridSize=0 yields radius 0)
  const shadow = new PIXI.Graphics();
  shadow.beginFill(0x000000, 0.3);
  const radius = (safeDivide(gridSize, 2, 1)) * safeDivide(token.h ?? 0, gridSize, 0);
  shadow.drawCircle(0, 0, radius);
  shadow.endFill();
  shadow.position.set(centerX, centerY);
  container.addChild(shadow);

  // Criar uma linha conectando o chão ao token (guarded: gridDistance=0 yields 0)
  const offset = computeElevationVisualOffset(elevacao, gridSize, gridDistance);

  const line = new PIXI.Graphics();
  line.lineStyle(2, 0xff0000, 0.5);
  line.moveTo(centerX, centerY)
      .lineTo(
        centerX + offset,
        centerY - offset
      );
  container.addChild(line);

  // Adicionar o container ao TOKEN, não ao stage.
  // addChildAt(0) tenta colocar atrás do artwork principal se possível.
  token.addChildAt(container, 0);
}

export function removeTokenVisuals(token) {
  const container = token.getChildByName("isometric-elevation-visuals");
  if (container) {
    token.removeChild(container);
    container.destroy({children: true}); // Limpar memoria PIXI
  }
  tokensWithVisuals.delete(token.id);
}

Hooks.on('canvasReady', () => { 
  clearAllVisuals();
});

Hooks.on('deleteToken', (token) => {
  // O child é destruído automaticamente com o token, mas removemos do set por sanidade
  tokensWithVisuals.delete(token.id);
});





