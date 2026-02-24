# Smoke Test Checklist — Isometric Perspective (v13)

Run through this checklist after each change to verify core functionality.

## Prerequisites
- Foundry VTT v13 instance running
- A scene with a grid configured

## US-008: v13 Release Smoke Suite + Gate Record

Use this section for every release candidate. Fill **Actual** with observed behavior and set **Result** to `PASS` or `FAIL`.

### Run Metadata

| Field | Value |
|---|---|
| Date/Time | |
| Build/Commit | |
| Foundry Version | |
| Browser/OS | |
| Tester | |

### Release Smoke Suite

| # | Scenario | Expected | Actual | Result (PASS/FAIL) |
|---|----------|----------|--------|--------------------|
| 1 | Scene toggle (enable/disable isometric) | Scene enters/exits isometric mode cleanly; no lingering transform artifacts | | |
| 2 | Projection change (True Iso -> Dimetric -> Overhead) | Active scene updates projection immediately and remains stable across changes | | |
| 3 | Token/tile offsets and scale controls | Token/tile offset, anchor, and scaling settings apply correctly without drift after toggles | | |
| 4 | HUD alignment (token + tile HUD actions) | HUD controls remain positioned and usable on selected token/tile in isometric scenes | | |
| 4a | **HUD placement stability (US-002)** | TokenHUD/TileHUD stay aligned with object across pan, zoom, and selection changes; no manual `canvas.draw()` needed | | |
| 5 | Ruler alignment and distance interaction | Ruler tool tracks pointer and reports usable measurements without visual desync | | |
| 5a | **Grid/Ruler config (US-001)** | Scene Settings > Grid > Ruler Tool: measure on canvas updates grid; canvas refreshes without manual `canvas.draw()` | | |
| 6 | Auto-sort depth ordering | Moving tokens updates depth order by isometric position; controlled token remains visible | | |
| 7 | Dynamic tile linked-wall behavior | Linked tiles hide/show correctly when crossing linked walls and after scene switch | | |
| 8 | Occlusion mode validation (CPU/GPU/Off as configured) | Occlusion behavior matches mode expectations without refresh storms or runtime errors | | |
| 9 | Console noise gate with debug OFF/ON | Debug OFF: no noisy logs. Debug ON: prefixed `[Isometric Perspective]` diagnostics appear | | |

### Release Gate Checklist

| Gate Item | Status (PASS/FAIL) | Evidence/Notes |
|-----------|--------------------|----------------|
| All Release Smoke Suite rows passed | | |
| Lint passed (`npm run lint`) | | |
| Package build/archive step passed (`npm run build`, if release candidate) | | |
| Any failures captured with follow-up issue/task ID | | |

## US-001: Grid/Ruler Configuration (Scene Settings)

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 1 | Enable isometric on a scene with a background image | Scene displays in isometric projection | | |
| 2 | Open Scene Config > Grid tab, click Ruler Tool (ruler icon) | Grid config ruler tool activates; canvas remains visible | | |
| 3 | Measure between two grid points on the canvas | Ruler shows distance; grid size/distance updates when applied | | |
| 4 | Apply/close grid config after ruler measurement | Canvas refreshes immediately; no manual `canvas.draw()` needed; background transforms remain correct | | |
| 5 | Change grid size or offset via Grid tab inputs (no ruler) | Changes apply; canvas updates; no regression in isometric background | | |
| 6 | Toggle isometric off and back on after grid edits | Transforms apply/remove cleanly; no drift or stale state | | |

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
| 8 | Check console output with debug setting **on** | Debug logs appear with `[Isometric Perspective]` prefix | |

## US-002: HUD Placement (Token/Tile)

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 1 | Enable isometric, select a token | TokenHUD appears near the token (centered on it) | | |
| 2 | Pan the canvas while TokenHUD is visible | HUD moves with the token; remains aligned | | |
| 3 | Zoom in/out while TokenHUD is visible | HUD stays aligned with the token | | |
| 4 | Right-click a tile | TileHUD appears near the tile | | |
| 5 | Pan/zoom while TileHUD is visible | TileHUD stays aligned with the tile | | |
| 6 | Switch selection between multiple tokens/tiles | Each HUD repositions correctly for the newly selected object | | |
| 7 | Switch to non-isometric scene, select token | HUD appears normally; no overlap regressions | | |
| 8 | Switch back to isometric scene | HUD placement remains correct | | |

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
| 10 | Open console with debug **on** during disable | `[Isometric Perspective] applyBackgroundTransformation RESET` log appears | |

## US-003: Token/Tile Transform Reset

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 1 | Enable isometric on a scene with at least one token and one tile | Both render with isometric skew/scale | |
| 2 | Disable isometric on that scene | Token and tile rotation/skew reset to zero; anchors return to their configured values; sizes/positions are recomputed from document dimensions (no lingering iso offsets/scale) | |
| 3 | Toggle isometric on/off three times in a row | Token and tile visuals are identical on each enable and restore to the same baseline on each disable (no drift) | |
| 4 | Set `isoTokenDisabled` on a token and `isoTileDisabled` on a tile, then enable isometric | Flagged token/tile stay in standard projection (no iso offsets, scale, or anchor changes) | |
| 5 | Move a token while isometric is enabled, then disable isometric | Token returns to the correct non-isometric position/size with no lingering offsets | |
| 6 | Open console with debug **off** while toggling | No noisy log output from token/tile transforms | |

## US-004: Structured Debug Logging / No Production Noise

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 1 | Load Foundry with debug setting **off** | No `isometric-perspective` console output during startup, canvas ready, or HUD sync | |
| 2 | Toggle isometric on/off with debug **off** | No console output from background/token/tile transforms | |
| 3 | Enable module debug setting and reload | All module logs use `[Isometric Perspective]` prefix | |
| 4 | With debug **on**, disable isometric on a scene with background transforms | Background reset log appears with prefix; no unrelated noise | |
| 5 | With debug **on** and auto-sort enabled, move a token | Autosorting debug block logs with prefix/grouping only | |
| 6 | Open token/tile config with debug **on** | Context debug log uses prefix; does not appear when debug **off** | |

## US-005: Throttled Occlusion/Dynamic Tile Updates

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 1 | Enable Dynamic Tile + Token Silhouette features; open a scene with linked-wall tiles | Always-visible/occlusion layers render once on load; no console spam | |
| 2 | Drag a token rapidly across the scene | Occlusion/dynamic layers track the token without refresh storms or visible lag | |
| 3 | Open/close a linked door or toggle a tile’s linked walls flag | Visibility updates once per change; tiles behind closed doors hide and reappear correctly | |
| 4 | Pan/zoom the canvas repeatedly | Containers stay in sync without stacking duplicates | |
| 5 | Switch control between multiple tokens quickly | Always-visible layer follows the latest controlled token only | |

## US-006: Dynamic Tile Linked-Wall Lifecycle Hardening

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 1 | Open a tile config that has legacy `linkedWallIds` data (comma-separated string or mixed values), then save | Flag is normalized to a clean string array without duplicates; no repeated update loop | |
| 2 | Click "Select Wall" repeatedly on the same wall | Wall ID is added once only; no duplicate IDs in tile flag | |
| 3 | Click "Clear Wall" when links exist | `linkedWallIds` is cleared to `[]` and the UI input is emptied | |
| 4 | Click "Clear Wall" again when already empty | No extra tile update is fired for unchanged data; UI remains empty | |
| 5 | Switch scenes back and forth with dynamic tile enabled | Always-visible containers are destroyed/recreated cleanly; no stale references or duplicated overlays | |
| 6 | Toggle doors linked to normalized walls after scene switch | Linked-wall visibility behavior remains correct after scene transitions | |

## US-007: Safer Token Sorting Interop Patch

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 1 | Enable scene isometric + module `Enable Automatic Token Sorting` setting | Token movement updates depth order by isometric Y-sort without regressions | |
| 2 | Select a moved token while auto-sort is enabled | Controlled token remains visible (slight zIndex boost) while preserving relative depth behavior | |
| 3 | Disable `Enable Automatic Token Sorting`, then move tokens | Token sorting falls back to Foundry/other-module default behavior | |
| 4 | Reload with `libWrapper` active (if installed) and move/select tokens | No patch conflict warnings; sorting behavior remains correct | |
| 5 | Reload without `libWrapper` and move/select tokens | Fallback path keeps sorting functional; no runtime errors | |

## US-010: Occlusion Performance Profiling Baseline

Record one completed run in `PERFORMANCE-BASELINE.md` while executing these checks.

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 1 | Build baseline scene set for low/medium/high density (`10/40/80` tokens, `10/40/80` occluding tiles) | Scenario matrix is fully populated with token count, tile count, and zoom ranges (`50%`, `100%`, `200%`) | |
| 2 | For each scenario, run `enableOcclusionTokenSilhouette` in `off`, `gpu`, `cpu2`, `cpu4`, `cpu6`, `cpu8`, `cpu10` | Capture avg frame time/FPS and worst-frame (or stutter count) consistently across all modes | |
| 3 | Compare CPU chunk modes across quality/perf tradeoffs | Document where silhouette quality becomes visibly blocky and where CPU cost becomes unacceptable | |
| 4 | Select recommended defaults for release | Default policy is written and justified using measured data (global default + recommended CPU fallback) | |
| 5 | Cross-check release docs | `RELEASE-PROCESS.md` references the baseline artifact as part of release evidence | |

## General Startup

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 1 | Load Foundry with module enabled | No script errors in console | |
| 2 | Open Module Settings | All isometric-perspective settings render correctly | |
| 3 | Change projection type in scene config | Projection updates on canvas | |
