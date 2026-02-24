# Occlusion Performance Baseline (US-010)

This document defines and records the minimum profiling baseline for occlusion silhouette modes in Foundry VTT v13.

## Baseline Matrix

Run each occlusion mode against every scenario below:

| Scenario | Tokens | Occluding Tiles | Zoom Range |
|---|---:|---:|---|
| Low Density | 10 | 10 | 50%, 100%, 200% |
| Medium Density | 40 | 40 | 50%, 100%, 200% |
| High Density | 80 | 80 | 50%, 100%, 200% |

Modes under test:

- `off`
- `gpu`
- `cpu2`
- `cpu4`
- `cpu6`
- `cpu8`
- `cpu10`

## Metrics To Capture

For every `scenario x mode` run, capture:

- Average frame time (ms) or average FPS
- Worst-frame time (ms) or stutter count during rapid token movement
- Visual quality notes (edge fidelity, blockiness, acceptable/not acceptable)

## Profiling Summary (Current Baseline)

The module already includes empirical quality/performance notes in `scripts/occlusion.js` that were used to establish this baseline policy:

- `cpu1`: best silhouette fidelity, but too CPU intensive for practical scenes.
- `cpu2`: acceptable quality, still CPU heavy under token-dense scenes.
- `cpu3`/`cpu4`: reduced CPU pressure but increasingly pixelated, especially at zoom-in.
- `cpu8+`: lowest CPU pressure in most cases, but only visually acceptable for simple/rectangular tile shapes.
- `gpu`: generally fast, but visual correctness can vary by scene/tile content and still requires per-release verification.

## Selected Defaults (Data-Driven Policy)

- Global default remains `off` for safest out-of-box performance and compatibility.
- Recommended CPU fallback for users who explicitly enable silhouette occlusion is `cpu6` as the best compromise between visual quality and CPU cost.
- `cpu2` is recommended only when higher silhouette fidelity is required and the scene density is low-to-medium.
- `cpu8`/`cpu10` are recommended only for rectangular/simple occluders where blockiness is acceptable.

## Run Record Template

Copy this section for each profiling run:

| Field | Value |
|---|---|
| Date/Time | |
| Build/Commit | |
| Foundry Version | |
| Browser/OS | |
| Tester | |
| Notes | |

| Scenario | Mode | Avg Frame (ms) or FPS | Worst Frame (ms) / Stutters | Visual Quality |
|---|---|---|---|---|
| Low Density | off | | | |
| Low Density | gpu | | | |
| Low Density | cpu2 | | | |
| Low Density | cpu4 | | | |
| Low Density | cpu6 | | | |
| Low Density | cpu8 | | | |
| Low Density | cpu10 | | | |
| Medium Density | off | | | |
| Medium Density | gpu | | | |
| Medium Density | cpu2 | | | |
| Medium Density | cpu4 | | | |
| Medium Density | cpu6 | | | |
| Medium Density | cpu8 | | | |
| Medium Density | cpu10 | | | |
| High Density | off | | | |
| High Density | gpu | | | |
| High Density | cpu2 | | | |
| High Density | cpu4 | | | |
| High Density | cpu6 | | | |
| High Density | cpu8 | | | |
| High Density | cpu10 | | | |

## US-003: Occlusion Lifecycle and Memory Notes (2026-02-24)

Occlusion overlay updates now explicitly destroy replaced sprites and masks on each update cycle to avoid memory churn during long sessions:

- **Update loop**: Before rebuilding the occlusion layer, `updateOcclusionLayer` destroys all prior sprites and their masks via `destroyOcclusionSprite`. Sprites share the token texture; only the sprite and mask DisplayObjects are destroyed.
- **Scene change / canvas teardown**: `teardownOcclusionLayer` removes the occlusion container from the stage and destroys it (including all children and masks) on `changeScene` and `canvasTearDown` hooks. Prevents stale containers when switching scenes or reloading.
- **Re-initialization**: `initializeOcclusionLayer` uses the same explicit destroy path when replacing an existing container.

**Stress test recommendation**: Run 10+ minutes of repeated token movement and pan/zoom with occlusion enabled (gpu or cpu modes). Use browser DevTools Memory profiler to confirm heap does not continuously grow.

## Long-Session Stress Scenario (US-008)

Required for release. Run at least one completed stress scenario and record results below.

### Scenario: 15-Minute Continuous Interaction

| Step | Action | Duration |
|------|--------|----------|
| 1 | Enable isometric + Dynamic Tile + Token Silhouette (cpu or gpu) on a scene with 20+ tokens and 10+ occluding tiles | — |
| 2 | Move tokens repeatedly across the scene | 5 min |
| 3 | Pan and zoom the canvas (50% ↔ 200%) | 3 min |
| 4 | Switch controlled token every 30 sec | 2 min |
| 5 | Open/close linked doors 10× | 1 min |
| 6 | Switch to another scene and back | 2 min |
| 7 | Repeat projection change (True Iso → Dimetric → Overhead → True Iso) 3× | 2 min |

### Expected Outcomes

- No console errors
- No visible lag or refresh storms
- Memory (DevTools heap) does not continuously grow; stable or sawtooth pattern
- All overlays (occlusion, dynamic tile) remain correct after scene return

### Run Record Template

| Field | Value |
|-------|-------|
| Date/Time | |
| Build/Commit | |
| Foundry Version | |
| Browser/OS | |
| Heap before (MB) | |
| Heap after (MB) | |
| Pass? (Y/N) | |
| Notes | |
