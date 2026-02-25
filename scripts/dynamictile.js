import { isometricModuleConfig } from './consts.js';
import { calculateTokenSortValue, throttle } from './utils.js';
import { debugWarn } from './logger.js';

const scheduleDynamicTileUpdate = throttle(updateAlwaysVisibleElements, 50);

export function registerDynamicTileConfig() {
  const enableOcclusionDynamicTile = game.settings.get(isometricModuleConfig.MODULE_ID, "enableOcclusionDynamicTile");
  const worldIsometricFlag = game.settings.get(isometricModuleConfig.MODULE_ID, "worldIsometricFlag");
  
  if (!worldIsometricFlag || !enableOcclusionDynamicTile) return;
  
  // ---------------------- CANVAS ----------------------
  Hooks.on('canvasInit', () => {
    destroyAlwaysVisibleContainer();
    
    // Cria o container principal
    alwaysVisibleContainer = new PIXI.Container();
    alwaysVisibleContainer.name = "AlwaysVisibleContainer";
    alwaysVisibleContainer.eventMode = 'passive';
    
    // Create separate sublayers for tiles and tokens
    tilesLayer = new PIXI.Container();
    tokensLayer = new PIXI.Container();
    
    tilesLayer.name = "AlwaysVisibleTiles";
    tokensLayer.name = "AlwaysVisibleTokens";
    
    // Add the layers in the correct order
    alwaysVisibleContainer.addChild(tilesLayer);
    alwaysVisibleContainer.addChild(tokensLayer);
    
    canvas.stage.addChild(alwaysVisibleContainer);
    canvas.stage.sortChildren();
  });
  // Add a hook to reset the container when scene changes
  Hooks.on('changeScene', () => {
    destroyAlwaysVisibleContainer();
    lastControlledToken = null;
  });
  Hooks.on('canvasTearDown', () => {
    destroyAlwaysVisibleContainer();
    lastControlledToken = null;
  });
  Hooks.on('canvasReady', () => {
    normalizeAllTileLinkedWallFlags();
    scheduleDynamicTileUpdate();
  });
  Hooks.on('canvasTokensRefresh', () => {
    scheduleDynamicTileUpdate();
  });
  Hooks.on('updateUser', (user, changes) => {
    if (user.id === game.user.id && 'character' in changes) {
      scheduleDynamicTileUpdate();
    }
  });



  // ---------------------- TILE ----------------------
  Hooks.on('createTile', (tileDocument) => {
    syncTileLinkedWallFlag(tileDocument);
    scheduleDynamicTileUpdate();
  });
  Hooks.on('updateTile', async (tileDocument, change, options, userId) => {
    if ('flags' in change && isometricModuleConfig.MODULE_ID in change.flags) {
      const currentFlags = change.flags[isometricModuleConfig.MODULE_ID];
      if ('linkedWallIds' in currentFlags) {
        await syncTileLinkedWallFlag(tileDocument, currentFlags.linkedWallIds);
      }
    }
    scheduleDynamicTileUpdate();
  });
  Hooks.on('refreshTile', (tile) => {
    scheduleDynamicTileUpdate();
  });
  Hooks.on('deleteTile', (tile, options, userId) => {
    scheduleDynamicTileUpdate();
  });



  // ---------------------- TOKEN ----------------------
  Hooks.on('createToken', (token, options, userId) => {
    // Add a small delay to ensure the token is fully initialized
    setTimeout(() => {
      scheduleDynamicTileUpdate();
    }, 100);
  });
  Hooks.on('controlToken', (token, controlled) => {
    if (controlled) {
      lastControlledToken = token; // Store the last controlled token
    }
    scheduleDynamicTileUpdate();
  });
  Hooks.on('updateToken', (tokenDocument, change, options, userId) => {
    // If the updated token is the last controlled one, update the reference
    if (lastControlledToken && tokenDocument.id === lastControlledToken.id) {
      lastControlledToken = canvas.tokens.get(tokenDocument.id);
    }
    scheduleDynamicTileUpdate();
  });
  Hooks.on('deleteToken', (token, options, userId) => {
    if (lastControlledToken && token.id === lastControlledToken.id) {
      lastControlledToken = null;
    }
    scheduleDynamicTileUpdate();
  });
  Hooks.on("refreshToken", (token) => {
    scheduleDynamicTileUpdate();
  });
  /*
  Hooks.on('renderTokenConfig', (app, html, data) => {
    // hide all tokens
    updateTokensOpacity(0);

    // Handler for the submit form
    html.querySelector('form').on('submit', async (event) => {
      updateTokensOpacity(1);
    });
  });
  */



  // ---------------------- OTHERS ----------------------
  Hooks.on('sightRefresh', () => {
    if (canvas.ready && alwaysVisibleContainer) {
      scheduleDynamicTileUpdate();
    }
  });

  Hooks.on('updateWall', (wallDocument, change, options, userId) => {
    // Check if the change is related to the door state
    if ('ds' in change) {
      // Find tiles that have this wall linked
      const linkedTiles = canvas.tiles.placeables.filter(tile => {
        const walls = getLinkedWalls(tile);
        return walls.some(wall => wall && wall.id === wallDocument.id);
      });
      
      // If any linked tile was found, update the visible elements
      if (linkedTiles.length > 0) {
        scheduleDynamicTileUpdate();
      }
    }
  });

  // Additional buttons for the tile layer
  /*Hooks.on("getSceneControlButtons", (controls) => {

    // console.log("controls", controls)

    // const newButtons = controls.find(b => b.name === "tiles"); // "token, measure, tiles, drawings, walls, lightning"
    const dynamicTileTool = controls["tiles"].tools; // "token, measure, tiles, drawings, walls, lightning"

    console.log("dynamicTileTool", dynamicTileTool.tools); 
  
    dynamicTileTool.opacityIncrease = {
      name: 'dynamic-tile-increase',
      title: 'Increase Dynamic Tile Opacity',
      icon: 'fa-solid fa-layer-group',
      active: true,
      onClick: () => increaseTilesOpacity(),
      button: true
    };
    
    dynamicTileTool.opacityDecrease = {
      name: 'dynamic-tile-decrease',
      title: 'Decrease Dynamic Tile Opacity',
      icon: 'fa-duotone fa-solid fa-layer-group',
      active: true,
      onClick: () => decreaseTilesOpacity(),
      button: true
    };
  });*/
}



// PIXI container for always-visible elements
let alwaysVisibleContainer;
let tilesLayer;
let tokensLayer;
let tilesOpacity = 1.0;
let tokensOpacity = 1.0;
let lastControlledToken = null;

/**
 * Destroy a cloned sprite without destroying its shared texture (US-004).
 */
function destroyDynamicTileSprite(sprite) {
  if (!sprite) return;
  sprite.destroy({ texture: false, textureSource: false });
}

/**
 * Destroy all sprites in a layer. Preserves shared tile/token textures.
 */
function destroyLayerSprites(layer) {
  if (!layer) return;
  const children = layer.removeChildren();
  for (const sprite of children) {
    destroyDynamicTileSprite(sprite);
  }
}

function destroyAlwaysVisibleContainer() {
  if (alwaysVisibleContainer && alwaysVisibleContainer.parent) {
    alwaysVisibleContainer.parent.removeChild(alwaysVisibleContainer);
  }
  if (alwaysVisibleContainer) {
    // Destroy cloned sprites explicitly (texture: false) before destroying container
    const children = alwaysVisibleContainer.removeChildren();
    for (const layer of children) {
      if (layer?.children?.length) {
        destroyLayerSprites(layer);
      }
      layer?.destroy({ children: false });
    }
    alwaysVisibleContainer.destroy({ children: false });
  }
  alwaysVisibleContainer = null;
  tilesLayer = null;
  tokensLayer = null;
  lastControlledToken = null;
}


function updateLayerOpacity(layer, opacity) {
  if (!layer) return;
  layer.children.forEach(sprite => {
      sprite.alpha = opacity;
  });
}

export function updateTilesOpacity(value) {
  tilesOpacity = Math.max(0, Math.min(1, value));
  if (tilesLayer) {
    updateLayerOpacity(tilesLayer, tilesOpacity);
  }
}

export function increaseTilesOpacity() {
  updateTilesOpacity(tilesOpacity + 0.5);
}

export function decreaseTilesOpacity() {
  updateTilesOpacity(tilesOpacity - 0.5);
}

export function resetOpacity() {
  tilesOpacity = 1.0;
  updateTilesOpacity(tilesOpacity);

  //tokensOpacity = 1.0;
  //updateTokensOpacity(tokensOpacity);
}


export function updateTokensOpacity(value) {
  tokensOpacity = Math.max(0, Math.min(1, value));
  if (tokensLayer) {
      updateLayerOpacity(tokensLayer, tokensOpacity);
  }
}

export function increaseTokensOpacity() {
  updateTokensOpacity(tokensOpacity + 0.1);
}

export function decreaseTokensOpacity() {
  updateTokensOpacity(tokensOpacity - 0.1);
}













function cloneTileSprite(tile, walls) {
  const sprite = new PIXI.Sprite(tile.texture);
  sprite.position.set(tile.position.x, tile.position.y);
  sprite.anchor.set(tile.anchor.x, tile.anchor.y);
  sprite.angle = tile.angle;
  sprite.scale.set(tile.scale.x, tile.scale.y);
  
  // Check if any linked wall is a closed door
  const hasClosedDoor = walls.some(wall => 
    wall && (wall.document.door === 1 || wall.document.door === 2) && wall.document.ds === 1
  );
  
  if (hasClosedDoor) {
    return null; // Doesn't create the sprite if the door is open
  }
  
  let alpha = tile.alpha * tilesOpacity;
  sprite.alpha = alpha;
  sprite.eventMode = 'passive';
  sprite.originalTile = tile;
  return sprite;
}

function cloneTokenSprite(token) {
  if (!token || !token.texture) {
    debugWarn("Dynamic Tile cloneTokenSprite() common error.");
    return null;
  }
  try {
    const sprite = new PIXI.Sprite(token.texture);
    sprite.position.set(token.position.x, token.position.y);
    sprite.anchor.set(token.anchor.x, token.anchor.y);
    sprite.angle = token.angle;
    sprite.scale.set(token.scale.x, token.scale.y);
    sprite.alpha = token.alpha * tokensOpacity;
    sprite.eventMode = 'passive';
    sprite.originalToken = token;

    // // Clone filters if they exist
    // if (token.filters && token.filters.length > 0) {
    //   sprite.filters = token.filters.map(filter => {
    //     const newFilter = new filter.constructor(filter.uniforms);
    //     Object.assign(newFilter, filter);
    //     return newFilter;
    //   });
    // }

    return sprite;
  } catch (error) {
    debugWarn("Dynamic Tile cloneTokenSprite() failed.", error);
    return null;
  }
}

// Function to find the initial token during initialization
function getInitialToken() {
  // First, try to get the controlled token
  const controlled = canvas.tokens.controlled[0];
  if (controlled) return controlled;

  // If there is no controlled token, try to use the last known token
  if (lastControlledToken) return lastControlledToken;

  // If there is no last known token, try to get the user's character token
  const actor = game.user.character;
  if (actor) {
      const userToken = canvas.tokens.placeables.find(t => t.actor?.id === actor.id);
      if (userToken) return userToken;
  }

  // If still not found, get the first token the user has permission for
  const availableToken = canvas.tokens.placeables.find(t => t.observer);
  if (availableToken) return availableToken;

  // If all fails, return null
  return null;
}

function updateAlwaysVisibleElements() {
  if (!canvas.ready || !alwaysVisibleContainer) return;

  // Destroy prior cloned sprites deterministically to avoid memory churn (US-004)
  destroyLayerSprites(tilesLayer);
  destroyLayerSprites(tokensLayer);

  // Get the selected token; if none, layers stay empty (defined behavior)
  const controlled = getInitialToken();
  if (!controlled) return;

  // Collect Tiles with linked walls
  const tilesWithLinkedWalls = canvas.tiles.placeables.filter(tile => {
    // Use the helper function to ensure we have an array
    const walls = getLinkedWalls(tile);
    return walls.length > 0;
  });

  // Update tiles
  tilesWithLinkedWalls.forEach(tile => {
    const walls = getLinkedWalls(tile);
    
    // Check if token can see any of the linked walls
    const canSeeAnyWall = walls.some(wall => canTokenSeeWall(controlled, wall));

    if (canSeeAnyWall) {
      const clonedSprite = cloneTileSprite(tile.mesh, walls);
      if (clonedSprite) {
        tilesLayer.addChild(clonedSprite);
      }
    }
  });

  
  
  // Always add the controlled token
  const controlledTokenSprite = cloneTokenSprite(controlled.mesh);
  if (controlledTokenSprite) {  // Check if Sprite was created successfully
    controlledTokenSprite.zIndex = calculateTokenSortValue(controlled);
    tokensLayer.addChild(controlledTokenSprite);
  }

  // Add tokens that the controlled token can see
  canvas.tokens.placeables.forEach(token => {
    if (!token.mesh) return;  // Skip if the mesh does not exist
    if (token.id === controlled.id) return; // Skip the controlled token

    // Check if the token can be seen
    if (canTokenSeeToken(controlled, token)) {
      // Check if the token is behind some tile linked to a wall
      const behindTiles = tilesWithLinkedWalls.filter(tile => {
        const walls = getLinkedWalls(tile);

        // Check if token is behind any of the linked walls
        return walls.some(wall => {
          if (!wall) return false;

          // If the wall is a door and is open, do not consider token as "behind"
          if ((wall.document.door === 1 || wall.document.door === 2) && wall.document.ds === 1) {
            return false;
          }

          // Check if the token is above the wall
          return isTokenInFrontOfWall(token, wall);
        });
      });

      const tokenSprite = cloneTokenSprite(token.mesh);
      if (tokenSprite) {
        // Use isometric sorting for zIndex
        tokenSprite.zIndex = calculateTokenSortValue(token);
        
        if (behindTiles.length > 0) {
          // If behind a tile, move it to the back layer, but keep isometric relative order
          tokenSprite.zIndex -= 20000; 
        }
        tokensLayer.addChild(tokenSprite);
      }
    }
  });

  updateLayerOpacity(tilesLayer, tilesOpacity);
  //updateLayerOpacity(tokensLayer, tokensOpacity);

  // Enable zIndex for the token layer
  tokensLayer.sortableChildren = true;
}

export function normalizeLinkedWallIds(linkedWallIds) {
  if (!linkedWallIds) return [];

  let parsedIds = [];

  // If it is a string
  if (typeof linkedWallIds === 'string') {
    if (!linkedWallIds.trim()) return [];
    parsedIds = linkedWallIds.split(',');
  } else if (Array.isArray(linkedWallIds)) {
    parsedIds = linkedWallIds;
  } else if (typeof linkedWallIds === 'object') {
    // Se for um objeto
    try {
      parsedIds = JSON.stringify(linkedWallIds)
        .replace(/[{}\[\]"]/g, '')
        .split(',');
    } catch {
      return [];
    }
  } else {
    return [];
  }

  const normalized = [];
  const seen = new Set();
  for (const id of parsedIds) {
    const normalizedId = `${id ?? ''}`.trim();
    if (!normalizedId || seen.has(normalizedId)) continue;
    seen.add(normalizedId);
    normalized.push(normalizedId);
  }
  return normalized;
}

function areStringArraysEqual(left, right) {
  if (left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
}

async function syncTileLinkedWallFlag(tileDocument, rawLinkedWallIds) {
  if (!tileDocument) return [];
  const currentValue = rawLinkedWallIds ?? tileDocument.getFlag(isometricModuleConfig.MODULE_ID, 'linkedWallIds');
  const normalized = normalizeLinkedWallIds(currentValue);
  const currentNormalized = normalizeLinkedWallIds(tileDocument.getFlag(isometricModuleConfig.MODULE_ID, 'linkedWallIds'));

  if (!areStringArraysEqual(currentNormalized, normalized)) {
    await tileDocument.setFlag(isometricModuleConfig.MODULE_ID, 'linkedWallIds', normalized);
  }
  return normalized;
}

async function normalizeAllTileLinkedWallFlags() {
  const tileDocuments = canvas.scene?.tiles?.contents ?? [];
  for (const tileDocument of tileDocuments) {
    await syncTileLinkedWallFlag(tileDocument);
  }
}

// Function to safely get walls linked to a tile
function getLinkedWalls(tile) {
  if (!tile || !tile.document) return [];
  const linkedWallIds = normalizeLinkedWallIds(tile.document.getFlag(isometricModuleConfig.MODULE_ID, 'linkedWallIds'));
  return linkedWallIds.map(id => canvas.walls.get(id)).filter(Boolean);
}

// Helper function to verify and fix existing flags
async function validateAndFixTileFlags(tile) {
  const currentLinkedWalls = tile.getFlag(isometricModuleConfig.MODULE_ID, 'linkedWallIds');
  const validArray = normalizeLinkedWallIds(currentLinkedWalls);
  
  // If the current value differs from the valid array, update it
  if (JSON.stringify(currentLinkedWalls) !== JSON.stringify(validArray)) {
    await tile.setFlag(isometricModuleConfig.MODULE_ID, 'linkedWallIds', validArray);
  }
  return validArray;
}











// Helper functions for position calculations


/**
 * --- Rules for determining visibility from a 2D (top-down) viewpoint ---
 *
 * - If the wall is horizontal: Any point where the token is below the horizontal line is
 *   considered in front of the wall. Otherwise it is behind the wall.
 *
 * - If the wall is vertical: Any point where the token is to the left of the vertical line
 *   the wall makes is considered in front of the wall. Otherwise it is behind the wall.
 *
 * - If the wall is sloped in the / direction and its angle with a horizontal line is less than 45°:
 *   Draw an infinite line between the two points that form the wall. Compute the difference between
 *   the token's Y and the line's Y at the same X. If positive, the token is in front; otherwise behind.
 *
 * - If the wall is sloped in the \ direction and its angle with a horizontal line is less than 45°:
 *   Same as above. If the difference is positive, the token is in front; otherwise behind.
 *
 * - If the wall is sloped in the / direction and its angle with a horizontal line is greater than 45°:
 *   Same line/difference. If positive, the token is behind the wall; otherwise in front.
 *
 * - If the wall is sloped in the \ direction and its angle with a horizontal line is greater than 45°:
 *   Same line/difference. If positive, the token is in front; otherwise behind.
 */

/**
 * Calculate the angle in degrees between a line and the horizontal
 * @param {number} x1 - X coordinate of the first point
 * @param {number} y1 - Y coordinate of the first point
 * @param {number} x2 - X coordinate of the second point
 * @param {number} y2 - Y coordinate of the second point
 * @returns {number} - Angle in degrees (0-360)
 */
function calculateAngle(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let angle = Math.atan2(Math.abs(dy), Math.abs(dx)) * (180 / Math.PI);
  return angle;
}



/**
* Determine if the wall is sloped in the / or \ direction
* @param {number} x1 - X coordinate of the first point
* @param {number} y1 - Y coordinate of the first point
* @param {number} x2 - X coordinate of the second point
* @param {number} y2 - Y coordinate of the second point
* @returns {string} - 'forward' for / or 'backward' for \
*/
function getWallDirection(x1, y1, x2, y2) {
  // If y2 is less than y1 when x2 is greater than x1, it is a '/' wall
  // Otherwise, it is a '\' wall
  if (x2 > x1) {
    return y2 < y1 ? 'forward' : 'backward';
  } else {
    return y2 > y1 ? 'forward' : 'backward';
  }
}



/**
* Check if a token is in front of a wall based on the specified rules
* @param {Object} token - Token object with center property {x, y}
* @param {Object} wall - Wall object with edge.a {x, y} and edge.b {x, y}
* @returns {boolean} - true if the token is in front of the wall, false otherwise
*/
function isTokenInFrontOfWall(token, wall) {
  // LEGACY: v11 uses wall.A/B; v13 uses wall.edge.a/b (module targets v13)
  if (isometricModuleConfig.FOUNDRY_VERSION === 11) {
    if (!wall?.A || !wall?.B || !token?.center) return false;
  } else {
    if (!wall?.edge?.a || !wall?.edge?.b || !token?.center) return false;
  }

  const { x: x1, y: y1 } = isometricModuleConfig.FOUNDRY_VERSION === 11 ? wall.A : wall.edge.a; // v11: wall.A
  const { x: x2, y: y2 } = isometricModuleConfig.FOUNDRY_VERSION === 11 ? wall.B : wall.edge.b; // v11: wall.B
  const { x: tokenX, y: tokenY } = token.center;

  // Check if the wall is horizontal (angle close to 0°)
  // Token is in front if it is below the horizontal line
  if (Math.abs(y1 - y2) < 0.001) {
    return tokenY > y1;
  }

  // Check if the wall is vertical (angle close to 90°)
  // Token is in front if it is to the left of the vertical line
  if (Math.abs(x1 - x2) < 0.001) {
    return tokenX < x1;
  }

  // Calculate the angle of the wall with the horizontal
  const angle = calculateAngle(x1, y1, x2, y2);
  
  // Determine the direction of the wall slope (/ or \)
  const wallDirection = getWallDirection(x1, y1, x2, y2);

  // Calculate the Y position on the wall line for the token's X
  const slope = (y2 - y1) / (x2 - x1);
  const wallYAtTokenX = slope * (tokenX - x1) + y1;
  const difference = tokenY - wallYAtTokenX;

  if (wallDirection === 'forward') { // Parede tipo /
    if (angle < 45) {
      return difference > 0; // Token is in front if above the line
    } else {
      return difference < 0; // Token is in front if below the line
    }
  } else { // Wall type \
    if (angle < 45) {
      return difference > 0; // Token is in front if above the line
    } else {
      return difference > 0; // Token is in front if above the line
    }
  }
}



/**
* Check if a token can see a wall
* @param {Object} token - Token object
* @param {Object} wall - Wall object
* @returns {boolean} - true if the token can see the wall, false otherwise
*/
function canTokenSeeWall(token, wall) {
  if (!wall || !token) return false;

  // Check if the token is in front of the wall
  const isInFront = isTokenInFrontOfWall(token, wall);
  if (!isInFront) return false;

  // Check collision with other objects between the token and the wall points
  // LEGACY: v11 uses wall.A/B and canvas.effects.visibility; v13 uses wall.edge.a/b and canvas.visibility
  const wallPoints = isometricModuleConfig.FOUNDRY_VERSION === 11 ? [wall.A, wall.center, wall.B] : [wall.edge.a, wall.center, wall.edge.b];
  const tokenPosition = token.center;

  for (const point of wallPoints) {
    const visibilityTest = isometricModuleConfig.FOUNDRY_VERSION === 11 ? canvas.effects.visibility.testVisibility(point, { tolerance: 2 }) : canvas.visibility?.testVisibility(point, { tolerance: 2 });
    // Use the token's testVisibility to verify it can see the point
    if (visibilityTest) {
      const ray = new Ray(tokenPosition, point);
      const collision = CONFIG.Canvas.polygonBackends.sight.testCollision(ray.B, ray.A, { 
        mode: "any", 
        type: "sight" 
      });
      
      // If there is no collision with any point within range, the token can see the wall
      if (!collision) {
        return true
      }
    }
  }

  return false;
}

function canTokenSeeToken(sourceToken, targetToken) {
  if (!sourceToken || !targetToken) return false;
  
  // Use the canvas testVisibility on the target token as verification
  return canvas.visibility?.testVisibility(targetToken.center, { tolerance: 2 });
}