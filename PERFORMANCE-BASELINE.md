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
