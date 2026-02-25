import { isometricModuleConfig } from './consts.js';

import { 
  createTokenIsometricTab,
  addPrecisionTokenArtListener,
  initTokenForm,
  handleCreateToken,
  handleUpdateToken,
  handleRefreshToken,
  registerTokenSortingPatch,

 } from './token.js';
 
import { 
  createTileIsometricTab,
  initTileForm,
  handleCreateTile,
  handleUpdateTile,
  handleRefreshTile
 } from './tile.js';

import { 
  handleRenderTokenHUD,
  handleRenderTileHUD,
  handleRenderDrawingHUD,
  registerHUDConfig
} from './hud.js';

import { registerSortingConfig } from './autosorting.js';
import { registerDynamicTileConfig, increaseTilesOpacity, decreaseTilesOpacity } from './dynamictile.js';


import { registerOcclusionConfig } from './occlusion.js';
import { addWelcomeScreen } from './welcome.js';
// Occlusion: production uses occlusion.js. Non-production experiments are in archive/legacy-occlusion-experiments/.

import { 
  createSceneIsometricTab,
  initSceneForm,
  handleUpdateScene,
  handleCanvasReady,
  handleCanvasResize, 
} from './scene.js'

import { registerRuler } from './ruler.js';

// Hook to register module configuration in Foundry VTT
Hooks.once("init", function() {

  // ------------- Registra as configurações do módulo ------------- 
  // Checkbox configuration to enable or disable isometric mode globally
  game.settings.register(isometricModuleConfig.MODULE_ID, "worldIsometricFlag", {
    name: game.i18n.localize('isometric-perspective.settings_main_name'), //name: "Enable Isometric Perspective",
    hint: game.i18n.localize('isometric-perspective.settings_main_hint'), //hint: "Toggle whether the isometric perspective is applied to the canvas.",
    scope: "world",  // "world" = sync to db, "client" = local storage
    config: true,    // false if you dont want it to show in module config
    type: Boolean,   // You want the primitive class, e.g. Number, not the name of the class as a string
    default: true, 
    requiresReload: true // true if you want to prompt the user to reload
    //onChange: settings => window.location.reload() // recarrega automaticamente
  });

  game.settings.register(isometricModuleConfig.MODULE_ID, 'enableHeightAdjustment', {
    name: game.i18n.localize('isometric-perspective.settings_height_name'), //name: 'Enable Height Adjustment',
    hint: game.i18n.localize('isometric-perspective.settings_height_hint'), //hint: 'Toggle whether token sprites adjust their position to reflect their elevation',
    scope: 'client',
    config: true,
    default: false,
    type: Boolean,
    requiresReload: true
  });

  game.settings.register(isometricModuleConfig.MODULE_ID, 'enableTokenVisuals', {
    name: game.i18n.localize('isometric-perspective.settings_visuals_name'), //name: 'Enable Token Visuals',
    hint: game.i18n.localize('isometric-perspective.settings_visuals_hint'), //hint: 'Displays a circular shadow and a vertical red line to indicate token elevation. Requires "Enable Height Adjustment" to be active.',
    scope: 'client',
    config: true,
    default: false,
    type: Boolean,
    requiresReload: true
  });

  game.settings.register(isometricModuleConfig.MODULE_ID, 'enableOcclusionDynamicTile', {
    name: game.i18n.localize('isometric-perspective.settings_dynamic_tile_name'), //name: 'Enable Occlusion: Dynamic Tile',
    hint: game.i18n.localize('isometric-perspective.settings_dynamic_tile_hint'), //hint: '(BETA FEATURE. USE WITH CAUTION) Adjusts the visibility of tiles dynamically with the positioning of tokens. See how this feature works here.',
    scope: 'world',
    config: true,
    default: false,
    type: Boolean,
    requiresReload: true
  });

  game.settings.register(isometricModuleConfig.MODULE_ID, 'enableAutoSorting', {
    name: game.i18n.localize('isometric-perspective.settings_token_sort_name'), //name: 'Enable Automatic Token Sorting',
    hint: game.i18n.localize('isometric-perspective.settings_token_sort_hint'), //hint: '(BETA FEATURE. USE WITH CAUTION) Automatically adjusts the token\'s sort property value when moving it around the canvas.',
    scope: 'world',
    config: true,
    default: false,
    type: Boolean,
    requiresReload: true
  });

  /*
  game.settings.register(isometricModuleConfig.MODULE_ID, 'enableOcclusionTokenSilhouette', {
    name: game.i18n.localize('isometric-perspective.settings_token_silhouette_name'), //name: 'Enable Occlusion: Token Silhouette',
    hint: game.i18n.localize('isometric-perspective.settings_token_silhouette_hint'), //hint: 'Adjusts the visibility of tiles dynamically with the positioning of tokens. See how this feature works here.',
    scope: 'client',
    config: true,
    default: false,
    type: Boolean,
    requiresReload: true
  });
  */
  
  game.settings.register(isometricModuleConfig.MODULE_ID, 'enableOcclusionTokenSilhouette', {
    name: game.i18n.localize('isometric-perspective.settings_token_silhouette_name'), //'Enable Occlusion: Token Silhouette',
    hint: game.i18n.localize('isometric-perspective.settings_token_silhouette_hint'), //'Adjusts the visibility of tiles dynamically with the positioning of tokens.',
    scope: 'client',
    config: true,
    type: String,
    choices: {
      "off": "Off",
      "gpu": "GPU Mode",
      "cpu1": "CPU Mode (Chunk Size 1)",
      "cpu2": "CPU Mode (Chunk Size 2)",
      "cpu3": "CPU Mode (Chunk Size 3)", 
      "cpu4": "CPU Mode (Chunk Size 4)",
      "cpu6": "CPU Mode (Chunk Size 6)",
      "cpu8": "CPU Mode (Chunk Size 8)",
      "cpu10": "CPU Mode (Chunk Size 10)"
    },
    default: "off",
    requiresReload: true
  });

  game.settings.register(isometricModuleConfig.MODULE_ID, "showWelcome", {
    name: game.i18n.localize('isometric-perspective.settings_welcome_name'),
    hint: game.i18n.localize('isometric-perspective.settings_welcome_hint'),
    scope: "client",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register(isometricModuleConfig.MODULE_ID, 'debug', {
    name: game.i18n.localize('isometric-perspective.settings_debug_name'), //name: 'Enable Debug Mode',
    hint: game.i18n.localize('isometric-perspective.settings_debug_hint'), //hint: 'Enables debug prints.',
    scope: 'client',
    config: true,
    default: false,
    type: Boolean,
    requiresReload: true
    //onChange: settings => window.location.reload()
  });

  // ------------- Registra os atalhos do módulo ------------- 
  
  game.keybindings.register(isometricModuleConfig.MODULE_ID, 'increaseTilesOpacity', {
    name: game.i18n.localize('isometric-perspective.keybindings_increase_tile_opacity'), //name: 'Increase Tile Opacity',
    hint: game.i18n.localize('isometric-perspective.keybindings_increase_tile_opacity_hint'), //hint: 'Increases the opacity of always visible tiles.',
    editable: [
        { key: 'NumpadAdd', modifiers: ['Control'] }
    ],
    onDown: () => {
        increaseTilesOpacity();
    },
    restricted: false,
    reservedModifiers: [],
    precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL
  });

  game.keybindings.register(isometricModuleConfig.MODULE_ID, 'decreaseTilesOpacity', {
    name: game.i18n.localize('isometric-perspective.keybindings_decrease_tile_opacity'), //name: 'Decrease Tile Opacity',
    hint: game.i18n.localize('isometric-perspective.keybindings_decrease_tile_opacity_hint'), //hint: 'Decreases the opacity of always visible tiles.',
    editable: [
        { key: 'NumpadSubtract', modifiers: ['Control'] }
    ],
    onDown: () => {
        decreaseTilesOpacity();
    },
    restricted: false,
    reservedModifiers: [],
    precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL
  });


  // Resolve global config values before any feature registration
  isometricModuleConfig.FOUNDRY_VERSION = parseInt(game.version.split(".")[0]);
  isometricModuleConfig.DEBUG_PRINT = !!game.settings.get(isometricModuleConfig.MODULE_ID, "debug");
  isometricModuleConfig.WORLD_ISO_FLAG = !!game.settings.get(isometricModuleConfig.MODULE_ID, "worldIsometricFlag");

  // ------------- Executa os hooks de funcionalidades adicionais do módulo -------------
  registerTokenSortingPatch();
  registerDynamicTileConfig();
  registerSortingConfig();
  registerOcclusionConfig();
  registerRuler();
  registerHUDConfig();
});


// Verifica se deve mostrar a tela de boas-vindas
// Checks whether to show the welcome screen

//HOOKS REGISTRATION 

// WelcomeScreen
Hooks.once('ready', addWelcomeScreen);
//scene configuration
Hooks.on('ready', createSceneIsometricTab);
//scene management
Hooks.on('renderSceneConfig', initSceneForm);
Hooks.on("updateScene", handleUpdateScene);
Hooks.on("canvasReady", handleCanvasReady);
Hooks.on("canvasResize", handleCanvasResize);

//token config
Hooks.on("ready", createTokenIsometricTab);
// disabled until a better implementation is decided
Hooks.on('renderTokenConfig', addPrecisionTokenArtListener);
Hooks.on('renderTokenConfig', initTokenForm);
Hooks.on('renderPrototypeTokenConfig', initTokenForm);

//token management
Hooks.on("createToken", handleCreateToken);
Hooks.on("updateToken", handleUpdateToken);
Hooks.on("refreshToken", handleRefreshToken);


// hud management
Hooks.on("renderTokenHUD", handleRenderTokenHUD);
Hooks.on("renderTileHUD", handleRenderTileHUD);
Hooks.on("renderDrawingHUD", handleRenderDrawingHUD);

//tile config
Hooks.on("ready", createTileIsometricTab);
Hooks.on("renderTileConfig", initTileForm);
// Hooks.on("renderTileConfig", handleRenderTileConfig);
//tile management
Hooks.on("createTile", handleCreateTile);
Hooks.on("updateTile", handleUpdateTile);
Hooks.on("refreshTile", handleRefreshTile);