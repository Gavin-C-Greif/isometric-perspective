# Release Process (v13)

This document defines the minimum release gate for `isometric-perspective` v13.

## Pre-Release Gate

Before tagging or publishing any release candidate:

1. Complete the `US-008: v13 Release Smoke Suite + Gate Record` section in `SMOKE-TEST.md`.
2. Complete the **US-008 (PRD): High-Risk Interaction Matrix** in `SMOKE-TEST.md` — all 5 rows (projection switch, pan/zoom, scene switch, token control switch, door state changes) must pass.
3. Run the high-risk harness: `npm run harness:high-risk -- --init --force`, fill `high-risk-harness.json` with scenario status/evidence, then run `npm run harness:high-risk`; command must report `Overall: PASS`.
4. Complete the **Math Hardening Visual Matrix** in `SMOKE-TEST.md` — all four sections (projection mode, rectangular token, offset/elevation, sorting overlap) must pass.
5. Record **Actual** outcomes for each scenario and mark each **Result** as `PASS` or `FAIL`.
6. Refresh `PERFORMANCE-BASELINE.md` with one completed US-010 profiling run and at least one long-session stress scenario (see PERFORMANCE-BASELINE.md) for the candidate build (or explicitly state why profiling could not be executed).
7. Run the profiling evidence harness: `npm run harness:occlusion-baseline -- --init --force`, fill `occlusion-baseline-run.json`, then run `npm run harness:occlusion-baseline`; command must report `Overall: PASS`.
8. Ensure all rows in the Release Smoke Suite, the High-Risk Interaction Matrix, and the Math Hardening Visual Matrix are `PASS`.
9. Run `npm run lint` and record the result in the Release Gate Checklist in `SMOKE-TEST.md`.
10. If a release artifact is being prepared, run `npm run build` and record the result in the same checklist.
11. Do not publish a release if any smoke scenario, high-risk matrix row, math hardening checklist section, or quality check fails.

## Evidence

Treat the completed run metadata + smoke suite + high-risk interaction matrix + `high-risk-harness.json` validation output + math hardening visual matrix + gate checklist in `SMOKE-TEST.md`, plus the current profiling record, `occlusion-baseline-run.json` validation output, and long-session stress scenario in `PERFORMANCE-BASELINE.md`, as the release validation artifact for the version being shipped.
