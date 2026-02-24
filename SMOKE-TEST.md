# Smoke Test Checklist — Isometric Perspective (v13)

Run through this checklist after each change to verify core functionality.

## Prerequisites
- Foundry VTT v13 instance running
- A scene with a grid configured

## US-001: Version/Config Consistency

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 1 | Open browser console on Foundry startup | No errors from `isometric-perspective` module | |
| 2 | Run `game.modules.get('isometric-perspective')` in console | Module is active | |
| 3 | Evaluate `isometricModuleConfig.FOUNDRY_VERSION` via a temporary `console.log` or debugger breakpoint in `main.js` after init | Value equals `13` (or current major version) | |
| 4 | Confirm no `isometricModuleConfig.CONST` property exists at runtime | Property is `undefined` | |
| 5 | Enable isometric on a scene, place a token | Token renders with isometric transform (no errors in console) | |
| 6 | Toggle isometric off and back on | Transforms apply/remove without console errors | |
| 7 | Check console output with debug setting **off** | No noisy log output from the module | |
| 8 | Check console output with debug setting **on** | Debug logs appear with recognizable prefix | |

## US-002: Reversible Scene/Background Transforms

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 1 | Enable isometric + "Transform Background" on a scene with a background image | Background rotates/skews into isometric projection | |
| 2 | Disable "Transform Background" (keep isometric enabled) | Background returns to its original position, scale, anchor, rotation, and skew | |
| 3 | Re-enable "Transform Background", then disable isometric entirely | Background fully resets — no residual rotation, skew, scale offset, or position drift | |
| 4 | Toggle isometric on/off 3 times in a row | Background visuals match step 1 each enable and return to exact original on each disable — no accumulated drift | |
| 5 | With isometric + background enabled, switch to a non-isometric scene | New scene background has no stale transforms from the previous scene | |
| 6 | Switch back to the isometric scene | Background transforms re-apply correctly from a fresh state | |
| 7 | With isometric + background on, change projection type (e.g., True Isometric → Dimetric 2:1) | Background updates to new projection without corruption | |
| 8 | After step 7, disable isometric | Background returns to original Foundry defaults | |
| 9 | Open console with debug **off** during all above steps | No noisy log output | |
| 10 | Open console with debug **on** during disable | "applyBackgroundTransformation RESET" log appears | |

## US-003: Token/Tile Transform Reset

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 1 | Enable isometric on a scene with at least one token and one tile | Both render with isometric skew/scale | |
| 2 | Disable isometric on that scene | Token and tile rotation/skew reset to zero; anchors return to their configured values; sizes/positions are recomputed from document dimensions (no lingering iso offsets/scale) | |
| 3 | Toggle isometric on/off three times in a row | Token and tile visuals are identical on each enable and restore to the same baseline on each disable (no drift) | |
| 4 | Set `isoTokenDisabled` on a token and `isoTileDisabled` on a tile, then enable isometric | Flagged token/tile stay in standard projection (no iso offsets, scale, or anchor changes) | |
| 5 | Move a token while isometric is enabled, then disable isometric | Token returns to the correct non-isometric position/size with no lingering offsets | |
| 6 | Open console with debug **off** while toggling | No noisy log output from token/tile transforms | |

## General Startup

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 1 | Load Foundry with module enabled | No script errors in console | |
| 2 | Open Module Settings | All isometric-perspective settings render correctly | |
| 3 | Change projection type in scene config | Projection updates on canvas | |
