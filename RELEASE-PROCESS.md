# Release Process (v13)

This document defines the minimum release gate for `isometric-perspective` v13.

## Pre-Release Gate

Before tagging or publishing any release candidate:

1. Complete the `US-008: v13 Release Smoke Suite + Gate Record` section in `SMOKE-TEST.md`.
2. Record **Actual** outcomes for each scenario and mark each **Result** as `PASS` or `FAIL`.
3. Ensure all rows in the Release Smoke Suite are `PASS`.
4. Run `npm run lint` and record the result in the Release Gate Checklist in `SMOKE-TEST.md`.
5. If a release artifact is being prepared, run `npm run build` and record the result in the same checklist.
6. Do not publish a release if any smoke scenario or quality check fails.

## Evidence

Treat the completed run metadata + smoke suite + gate checklist in `SMOKE-TEST.md` as the release validation artifact for the version being shipped.
