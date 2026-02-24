# Release Process (v13)

This document defines the minimum release gate for `isometric-perspective` v13.

## Pre-Release Gate

Before tagging or publishing any release candidate:

1. Complete the `US-008: v13 Release Smoke Suite + Gate Record` section in `SMOKE-TEST.md`.
2. Complete the **US-008 (PRD): High-Risk Interaction Matrix** in `SMOKE-TEST.md` — all 5 rows (projection switch, pan/zoom, scene switch, token control switch, door state changes) must pass.
3. Record **Actual** outcomes for each scenario and mark each **Result** as `PASS` or `FAIL`.
4. Refresh `PERFORMANCE-BASELINE.md` with one completed US-010 profiling run and at least one long-session stress scenario (see PERFORMANCE-BASELINE.md) for the candidate build (or explicitly state why profiling could not be executed).
5. Ensure all rows in the Release Smoke Suite and the High-Risk Interaction Matrix are `PASS`.
6. Run `npm run lint` and record the result in the Release Gate Checklist in `SMOKE-TEST.md`.
7. If a release artifact is being prepared, run `npm run build` and record the result in the same checklist.
8. Do not publish a release if any smoke scenario, high-risk matrix row, or quality check fails.

## Evidence

Treat the completed run metadata + smoke suite + high-risk interaction matrix + gate checklist in `SMOKE-TEST.md`, plus the current profiling record and long-session stress scenario in `PERFORMANCE-BASELINE.md`, as the release validation artifact for the version being shipped.
