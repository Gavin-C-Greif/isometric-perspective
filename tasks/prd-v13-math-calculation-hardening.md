# PRD: v13 Math and Projection Hardening

## 1. Introduction/Overview

This PRD defines a focused hardening effort for math and projection logic in the `isometric-perspective` module for Foundry v13.  
The goal is to eliminate calculation inconsistencies across transform, sorting, ruler labels, and projection conversion code so visual output is deterministic and testable.

The effort addresses confirmed risks from repository analysis, including axis-scale mismatches, inconsistent offset formulas between modules, and incomplete custom-projection conversion behavior.

## 2. Goals

- Remove known incorrect or inconsistent math paths affecting token/tile placement and depth sorting.
- Unify projection and offset formulas so all dependent systems (transform, ruler labels, HUD/sorting helpers) agree.
- Add automated tests for formula correctness and integration consistency.
- Add a repeatable scenario matrix to validate behavior across projection modes and token shapes.
- Deliver all work in v13-compatible form with clear rollback boundaries by phase.

## 3. User Stories

### US-001: Fix axis-scale placement correctness
**Description:** As a GM using non-square tokens, I want token placement math to use the correct axis scales so artwork does not drift vertically or horizontally.

**Acceptance Criteria:**
- [ ] Token placement formulas use axis-consistent scaling for both center offsets and projected offsets.
- [ ] Rectangular token cases (`width != height`) are covered by automated tests.
- [ ] Existing square-token behavior remains unchanged in baseline projections.
- [ ] Lint/tests pass.
- [ ] Verify in browser using dev-browser skill.

### US-002: Unify offset/elevation math between transform and ruler label systems
**Description:** As a player measuring movement, I want ruler labels to align with transformed token visuals so distance labels appear in the expected location.

**Acceptance Criteria:**
- [ ] A shared helper/function path is used for offset and elevation projection inputs.
- [ ] `transform` and `ruler` produce equivalent projected coordinates for the same token document inputs.
- [ ] Integration tests verify coordinate equivalence within a defined tolerance.
- [ ] Lint/tests pass.
- [ ] Verify in browser using dev-browser skill.

### US-003: Improve sorting depth correctness
**Description:** As a GM, I want visual depth sorting to match what is rendered on screen for scaled/offset tokens so front/back order is consistent.

**Acceptance Criteria:**
- [ ] Sorting math uses a documented visual reference point (not an implicit top-left assumption unless intentionally retained and documented).
- [ ] Sorting behavior is deterministic for scaled and offset tokens.
- [ ] Integration tests cover overlap scenarios where prior behavior could invert front/back order.
- [ ] Lint/tests pass.
- [ ] Verify in browser using dev-browser skill.

### US-004: Complete custom-projection conversion semantics
**Description:** As a world builder using custom projection values, I want coordinate conversion helpers to reflect configured projection parameters so custom scenes are mathematically coherent.

**Acceptance Criteria:**
- [ ] Conversion helpers are projection-aware and use active constants where appropriate.
- [ ] Custom projection values influence conversion behavior consistently across dependent features.
- [ ] Unit tests verify round-trip expectations (forward + inverse) under multiple projection presets.
- [ ] Lint/tests pass.

### US-005: Add numeric guards and error-safe math behavior
**Description:** As a GM, I want invalid numeric inputs (e.g., zero grid distance) handled safely so the module never emits `NaN`/`Infinity` positions.

**Acceptance Criteria:**
- [ ] Division-sensitive formulas include finite/zero guards.
- [ ] Guard behavior is defined (fallback values or early exits) and documented.
- [ ] Unit tests explicitly validate guard paths.
- [ ] Lint/tests pass.

### US-006: Build and automate the math validation matrix
**Description:** As a maintainer, I want a clear test matrix for projection and transform behavior so regressions are caught early.

**Acceptance Criteria:**
- [ ] Matrix is documented in-repo and mapped to test cases.
- [ ] Automated tests exist for all matrix core combinations (projection x token shape x grid config x offsets/elevation).
- [ ] Manual visual checklist exists for high-risk UI scenarios.
- [ ] Lint/tests pass.

## 4. Functional Requirements

- FR-1: The system must centralize projection conversion and offset math used by transform and ruler flows.
- FR-2: Token placement formulas must apply axis-correct scale factors for X and Y calculations.
- FR-3: Elevation and art-offset calculations must use shared normalization constants and guardrails.
- FR-4: Sorting calculations must use a documented visual anchor strategy and remain stable for scaled/offset tokens.
- FR-5: Custom projection settings must be consumed by conversion helpers used in active rendering logic.
- FR-6: All division operations in transform-related math paths must protect against zero/invalid denominators.
- FR-7: Automated unit tests must cover individual formulas, guards, and projection parameterization.
- FR-8: Automated integration tests must validate cross-module consistency between transform, ruler labels, and sorting.
- FR-9: A scenario matrix must define required combinations and expected outcomes for regression validation.
- FR-10: Phase boundaries must include explicit rollback checkpoints and validation gates.

## 5. Non-Goals (Out of Scope)

- Rewriting occlusion shader pipelines beyond changes strictly needed for shared math utilities.
- Adding new projection presets unrelated to math-correctness goals.
- Supporting Foundry v11/v12 behavior parity in this effort.
- Broad UI redesign of configuration sheets.
- Performance optimization work not tied to correctness regressions.

## 6. Design Considerations

- Preserve current UX for existing flags/settings where possible; prioritize backward-compatible behavior for v13 scenes.
- Any visible behavior changes must be intentional, documented, and validated via the manual matrix checks.
- Keep formulas explicit and comment only where derivation is non-obvious.

## 7. Technical Considerations

- Relevant modules include `scripts/transform.js`, `scripts/utils.js`, `scripts/ruler.js`, and sorting integration in `scripts/autosorting.js` / `scripts/token.js`.
- Prefer extracting shared math helpers to reduce duplicated formulas and drift.
- Use epsilon/tolerance comparisons for floating-point assertions in tests.
- Define a small set of canonical numeric fixtures (token dimensions, grid sizes, offsets, elevations, projections) reused across tests.

### 3-Phase Delivery Plan

**Phase 1 — Hotfix (Correctness blockers)**
- Axis-scale placement correction.
- Guardrails for zero/invalid divisors.
- Immediate regression tests for high-severity issues.

**Phase 2 — Hardening (Cross-module consistency)**
- Shared offset/elevation projection helpers.
- Ruler/transform equivalence tests.
- Sorting reference-point stabilization and tests.

**Phase 3 — Modernization (Projection coherence)**
- Projection-aware conversion helpers with custom projection support.
- Full scenario matrix automation.
- Final manual visual validation sweep.

## 8. Success Metrics

- 0 known high-severity math inconsistencies remain from this audit.
- 100% pass rate for required matrix scenarios in automated test suite.
- 0 `NaN`/`Infinity` transform outputs in guarded formula tests.
- Deterministic sort order in all defined overlap scenarios.
- All PRD acceptance criteria completed with tests passing.

## 9. Open Questions

- Should sorting anchor prioritize token visual center, footpoint, or configurable anchor semantics?
- What numeric tolerance should be considered acceptable for cross-module float equivalence assertions?
- Should custom projection round-trip tests enforce strict inverse behavior for all preset combinations or only supported transform subsets?
- Should the matrix include optional stress/performance subsets now or defer to a separate performance PRD?

## Math Test Matrix (Required)

| Dimension | Cases |
|---|---|
| Projection Type | True Isometric, Dimetric (2:1), Overhead (sqrt2:1), Projection (3:2), Custom Projection |
| Token Shape | 1x1, 2x1, 1x2, 3x2 |
| Grid Config | grid size 100/128/256; grid distance 5/10; invalid edge case distance=0 |
| Offsets | (0,0), (+10,+10), (-10,+20), (+25,-15) |
| Elevation | 0, 5, 20, high-value stress case |
| Fit/Scale Modes | fill, contain, cover, width, height; ring enabled/disabled |

### Matrix Assertions

- A1: Placement formulas produce finite values and expected axis behavior.
- A2: Transform and ruler label projected coordinates remain equivalent within tolerance.
- A3: Sort ordering is stable across movement paths and scale/offset combinations.
- A4: Custom projection changes are reflected in conversion outputs.
- A5: Guard logic handles invalid denominators without runtime corruption.
