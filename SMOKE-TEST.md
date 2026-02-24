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

## General Startup

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 1 | Load Foundry with module enabled | No script errors in console | |
| 2 | Open Module Settings | All isometric-perspective settings render correctly | |
| 3 | Change projection type in scene config | Projection updates on canvas | |
