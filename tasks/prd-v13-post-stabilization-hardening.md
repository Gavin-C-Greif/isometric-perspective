# PRD: v13 Post-Stabilization Hardening and Feature Completion

## 1. Introduction / Overview

The repository now implements a broad, working v13 isometric stack: scene projection transforms, token/tile transform controls, HUD/ruler alignment patches, dynamic linked-wall tiles, token depth auto-sorting, and configurable occlusion modes.  
The previous stabilization PRD is complete, but the current code and docs still show partial/beta areas, known bugs, and technical debt that can cause regressions, performance degradation, or maintenance friction.  

This PRD defines the next release scope to move from "stabilized" to "production-hardened": close known defects, reduce resource churn, tighten behavior of partial systems, and improve testability for future releases.

## 2. Goals

- Eliminate known high-friction user-facing defects documented in README and runtime behavior.
- Harden partially implemented systems (occlusion and dynamic tile) to predictable, supportable behavior.
- Reduce memory/performance overhead from frequent canvas updates and cloned sprite lifecycle.
- Improve maintainability by reducing dead/legacy code and standardizing error/reporting behavior.
- Add repeatable verification steps for functional correctness and perf/compatibility regressions.

## 3. Current Feature Inventory (Repository Analysis)

### Implemented Features

- Scene-level isometric enable/disable with multiple projection presets and custom projection input.
- Reversible stage and background transforms, including tracked background reset behavior.
- Token and tile isometric transforms with configurable offset/scale and token elevation visuals.
- Token and tile config tabs injected into Foundry sheets.
- Token depth ordering support (patch + update hooks) for isometric front/back draw order.
- Dynamic tile linked-wall visibility overlays with tile-wall selection tools.
- Occlusion silhouette modes (`off`, `gpu`, `cpu*`) with throttled update scheduling.
- HUD and ruler label adjustment logic for transformed stage coordinates.
- Release docs: smoke checklist and release gating docs.

### Partially Implemented / Beta Features

- Occlusion quality/performance modes are available but still described as tradeoff-heavy and mode-sensitive.
- Dynamic tile and auto-sorting remain effectively beta behavior in settings language and edge handling.
- Alternate occlusion approaches exist in repo but are not integrated, indicating unresolved architecture decisions.
- Compatibility logic for v11 remains in runtime code even though module compatibility targets v13.

### Known and Likely Defect Areas

- Scene grid/ruler configuration interaction remains documented as broken.
- TokenHUD/TileHUD positioning remains inconsistent in some scenarios.
- Config/UI listeners and transform pathways include fragile branches and duplicated event wiring.
- Some error logging paths bypass shared debug logging conventions.
- Frequent overlay sprite regeneration may cause unnecessary memory churn without explicit destruction in update loops.

## 4. User Stories

### US-001: Fix scene grid/ruler configuration incompatibility
**Description:** As a GM, I want scene grid and ruler tooling to behave correctly in isometric scenes so I can configure maps without fallback hacks.

**Acceptance Criteria:**
- [ ] Reproduce and document the current failure mode from README "Known Bugs".
- [ ] Scene grid/ruler tool interactions work in isometric scenes without requiring manual `canvas.draw()` workaround.
- [ ] No regression in scene background transforms after grid/ruler edits.
- [ ] `npm run lint` passes.
- [ ] Smoke checklist is updated with explicit grid/ruler config steps.
- [ ] Verify in browser using dev-browser skill.

### US-002: Stabilize HUD positioning for token/tile interactions
**Description:** As a user, I want token and tile HUD controls to appear reliably near the selected object so editing is usable in isometric mode.

**Acceptance Criteria:**
- [ ] TokenHUD and TileHUD placement is stable across pan/zoom and repeated selection changes.
- [ ] HUD placement remains correct after scene switch and projection changes.
- [ ] No overlap regressions on non-isometric scenes.
- [ ] `npm run lint` passes.
- [ ] Smoke checklist captures PASS/FAIL evidence for HUD placement scenarios.
- [ ] Verify in browser using dev-browser skill.

### US-003: Harden occlusion overlay lifecycle and memory behavior
**Description:** As a maintainer, I want occlusion updates to avoid stale objects and memory churn so long sessions stay performant.

**Acceptance Criteria:**
- [ ] Occlusion update loop explicitly handles cleanup/destruction of replaced sprites/masks where needed.
- [ ] Scene change/canvas teardown guarantees no stale occlusion containers or orphaned display objects.
- [ ] Repeated token movement and pan cycles do not continuously grow memory footprint in profiling spot checks.
- [ ] `npm run lint` passes.
- [ ] Performance notes are appended to `PERFORMANCE-BASELINE.md`.
- [ ] Verify in browser using dev-browser skill.

### US-004: Harden dynamic tile overlay lifecycle and multi-token behavior
**Description:** As a player/GM, I want dynamic tile visibility to remain correct during fast interaction, scene transitions, and changing controlled tokens.

**Acceptance Criteria:**
- [ ] Dynamic overlay rebuild path cleans up prior cloned sprites deterministically.
- [ ] Behavior with no controlled token and with rapid control switching is defined and consistent.
- [ ] Linked-wall visibility behavior remains correct for doors and wall state changes.
- [ ] `npm run lint` passes.
- [ ] Smoke checklist includes multi-token control switching and door toggling cases.
- [ ] Verify in browser using dev-browser skill.

### US-005: Rationalize sorting pipeline to a single authoritative path
**Description:** As a maintainer, I want one clear sorting strategy so depth ordering is correct without duplicated or conflicting sort writes.

**Acceptance Criteria:**
- [ ] Sorting responsibilities between `_refreshSort` wrapper and `updateToken`/`canvasReady` document updates are clarified and de-duplicated.
- [ ] Controlled-token visibility boost remains intact.
- [ ] No sort jitter or update loops during token movement.
- [ ] `npm run lint` passes.
- [ ] Smoke checklist verifies stable ordering across movement and selection scenarios.
- [ ] Verify in browser using dev-browser skill.

### US-006: Remove dead/legacy compatibility paths not aligned with v13 support
**Description:** As a maintainer, I want unsupported-version branches and dormant experimental code paths reduced so future changes are safer.

**Acceptance Criteria:**
- [ ] v11-only runtime paths are either removed, isolated, or clearly marked as non-executed legacy code.
- [ ] Alternative occlusion experiment files are either archived from runtime scope or documented as non-production artifacts.
- [ ] Runtime entry path (`scripts/main.js`) is free of ambiguous or misleading commented import options.
- [ ] `npm run lint` passes.
- [ ] README compatibility and limitations text remains accurate after cleanup.

### US-007: Standardize error/log handling and operator diagnostics
**Description:** As a maintainer, I want runtime diagnostics to be consistent and actionable so debugging production issues is faster.

**Acceptance Criteria:**
- [ ] Non-critical runtime errors use structured, prefixed logging paths with context.
- [ ] Avoid unconditional noisy logs in normal operation.
- [ ] Parsing/validation errors (e.g., custom projection input) are surfaced to users in a clear, non-silent way.
- [ ] `npm run lint` passes.
- [ ] Smoke checklist includes debug off/on verification for changed areas.

### US-008: Add targeted regression harness for high-risk interactions
**Description:** As a maintainer, I want focused regression coverage around transforms/overlays/sorting so future releases detect breakage early.

**Acceptance Criteria:**
- [ ] `SMOKE-TEST.md` is extended with high-risk interaction matrix (projection switch, pan/zoom, scene switch, token control switch, door state changes).
- [ ] Release process references these new checks as required evidence.
- [ ] Baseline performance capture includes at least one long-session stress scenario.
- [ ] `npm run lint` passes.
- [ ] Verify in browser using dev-browser skill.

## 5. Functional Requirements

- FR-1: Scene grid/ruler configuration operations must function correctly in isometric mode without manual redraw macros.
- FR-2: TokenHUD and TileHUD must maintain usable screen placement in isometric mode across pan, zoom, and scene changes.
- FR-3: Occlusion layer updates must not leak stale sprites, masks, or containers during repeated update cycles.
- FR-4: Dynamic tile overlay updates must deterministically recreate and clean transient display objects.
- FR-5: Token depth ordering must use a documented single source of truth to avoid conflicting sort writes.
- FR-6: Module runtime code must align with declared v13 support and minimize dead compatibility branches.
- FR-7: Runtime diagnostics must be prefixed, gateable, and include actionable context for failures.
- FR-8: Release validation artifacts must include expanded regression smoke checks and updated performance evidence.

## 6. Non-Goals (Out of Scope)

- Adding brand-new gameplay features unrelated to current isometric systems.
- Full CI-driven browser automation in this cycle.
- Comprehensive rewrite of occlusion algorithms from scratch.
- Multi-version support expansion beyond current v13 target.
- UI redesign of module configuration tabs beyond bug-fix level adjustments.

## 7. Design Considerations

- Preserve existing module setting names and user workflows where possible.
- Prefer incremental hardening over broad behavioral redesign to reduce migration risk.
- Keep overlay visuals readable in both high-density and low-density scenes.
- Ensure any user-facing warnings are concise and localized where feasible.

## 8. Technical Considerations

- Overlay systems are hook-heavy and should maintain centralized scheduling to avoid refresh storms.
- PIXI object lifecycle must be explicit when replacing transient overlays (add/remove/destroy behavior).
- Sorting behavior currently spans both render-time and document-update paths and needs clear ownership boundaries.
- Coordinate math for HUD/ruler must remain robust under transformed stage and varying zoom levels.
- Legacy compatibility code paths should be isolated to avoid accidental drift in v13 behavior.

## 9. Success Metrics

- Reduce reproducible HUD misplacement incidents in smoke scenarios from intermittent to zero.
- Zero known "manual redraw required" incidents for grid/ruler configuration in v13 smoke testing.
- No observed overlay container/sprite accumulation after 10 minutes of movement/pan stress testing.
- Stable token depth ordering across repeated movement/selection tests without jitter.
- 100% completion of expanded smoke and release-gate checklist before release.

## 10. Open Questions

- Should occlusion mode defaults change once lifecycle hardening and stress runs are complete?
- Should multi-controlled-token behavior in dynamic tile be explicitly supported or constrained to one source token?
- Do we want to retain v11 compatibility code as dormant reference, or fully remove it from runtime files?
- Is lightweight automated harnessing (headless or scripted Foundry macros) feasible for the highest-risk smoke cases?
