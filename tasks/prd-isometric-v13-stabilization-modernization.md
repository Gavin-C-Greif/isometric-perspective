# PRD: Isometric Perspective v13 Stabilization, Modernization, and Performance

**Suggested filename:** `tasks/prd-isometric-v13-stabilization-modernization.md`  
**Target platform:** Foundry VTT v13 only  
**Delivery model:** 3 releases (Hotfix -> Stabilization -> Optimization/Refactor)  
**Risk tolerance:** High (deep architecture cleanup allowed)  
**Quality gate:** Code + smoke test scripts + manual validation

## 1. Introduction / Overview

This PRD defines a phased modernization effort for the `isometric-perspective` module to improve reliability, maintainability, and performance on Foundry VTT v13.  
The current module has strong feature breadth, but key issues exist in transformation reset behavior, version/config handling, heavy hook activity, and production logging/debug pathways. The plan prioritizes correctness first, then compatibility hardening and architecture cleanup, then performance refinement.

## 2. Goals

- Eliminate high-impact runtime bugs affecting transform toggling and version-dependent behavior.
- Make scene/token/tile transforms fully reversible and deterministic.
- Reduce render/update overhead from occlusion and dynamic tile systems under typical play conditions.
- Standardize module architecture for v13 best practices and safer interop patterns.
- Add repeatable smoke-validation scripts/checklists so releases are less regression-prone.

## 3. User Stories

### US-001: Fix runtime version/config mismatch
**Description:** As a maintainer, I want version/config constants to be internally consistent so compatibility checks execute as intended.

**Acceptance Criteria:**
- [ ] All code paths read and write the same version field name (single source of truth).
- [ ] v13 execution path is validated via smoke scenario startup.
- [ ] No dead compatibility logic remains due to wrong config key names.
- [ ] Lint/type checks pass (where configured).
- [ ] Smoke test script/checklist updated and executed.

---

### US-002: Implement fully reversible scene/background transforms
**Description:** As a GM, I want toggling isometric mode on/off to always restore scene visuals correctly so I don't get lingering distortions.

**Acceptance Criteria:**
- [ ] Enabling/disabling isometric resets/sets all required transform properties (rotation, skew, scale, anchor, position) deterministically.
- [ ] Switching scenes does not leave stale transform state.
- [ ] Background transform behavior is consistent with `isometricBackground` flag.
- [ ] Lint/type checks pass.
- [ ] Smoke test script/checklist updated and executed.
- [ ] Verify in browser using dev-browser skill.

---

### US-003: Implement full token/tile transform reset path
**Description:** As a user, I want token and tile meshes to return to correct non-isometric state when isometric is disabled.

**Acceptance Criteria:**
- [ ] Token and tile non-isometric branch applies explicit reset, not partial early return.
- [ ] Repeated toggling does not accumulate visual drift.
- [ ] Token flags (`isoScaleDisabled`, offsets, anchors) do not corrupt non-isometric rendering.
- [ ] Lint/type checks pass.
- [ ] Smoke test script/checklist updated and executed.
- [ ] Verify in browser using dev-browser skill.

---

### US-004: Add structured debug logging and remove production noise
**Description:** As a maintainer, I want debug output to be consistently gated so normal users do not get console spam.

**Acceptance Criteria:**
- [ ] Unconditional `console.log` in runtime rendering/config pathways removed or gated behind debug setting.
- [ ] Debug logs use a common helper/prefix for easier filtering.
- [ ] Default module startup in non-debug mode emits no noisy logs.
- [ ] Lint/type checks pass.
- [ ] Smoke test script/checklist updated and executed.

---

### US-005: Consolidate and throttle expensive hook-driven updates
**Description:** As a player, I want smooth movement and interaction so occlusion and dynamic tile features do not degrade FPS significantly.

**Acceptance Criteria:**
- [ ] Occlusion and dynamic tile update triggers are consolidated with throttling/debouncing.
- [ ] Redundant multi-hook refresh storms are reduced.
- [ ] Behavior remains functionally equivalent in standard scenarios.
- [ ] Lint/type checks pass.
- [ ] Smoke test script/checklist updated and executed.
- [ ] Verify in browser using dev-browser skill.

---

### US-006: Harden dynamic tile linked-wall lifecycle
**Description:** As a GM, I want linked wall behavior to be stable so tile visibility logic remains correct across updates and scene changes.

**Acceptance Criteria:**
- [ ] Linked wall flag normalization is centralized and avoids unnecessary writes.
- [ ] Tile-wall selection and clear actions remain reliable after repeated edits.
- [ ] Scene changes cleanly reinitialize dynamic containers without leaks/stale refs.
- [ ] Lint/type checks pass.
- [ ] Smoke test script/checklist updated and executed.
- [ ] Verify in browser using dev-browser skill.

---

### US-007: Refactor sorting/patch strategy for safer interop
**Description:** As a module maintainer, I want safer extension points for token sorting so other modules are less likely to conflict.

**Acceptance Criteria:**
- [ ] Current token sorting override approach is refactored to safer extension/patch pattern for v13.
- [ ] Sorting still respects isometric depth and selection visibility.
- [ ] No regressions in auto-sorting when enabled.
- [ ] Lint/type checks pass.
- [ ] Smoke test script/checklist updated and executed.
- [ ] Verify in browser using dev-browser skill.

---

### US-008: Define v13 smoke test suite and release gate checklist
**Description:** As a maintainer, I want repeatable smoke tests so each release has minimum validation coverage.

**Acceptance Criteria:**
- [ ] Smoke checklist covers: scene toggle, projection change, token/tile offsets, HUD/ruler alignment, auto-sort, dynamic tile, occlusion modes.
- [ ] Checklist includes expected/actual outcomes and pass/fail markers.
- [ ] Checklist is referenced in release process docs.
- [ ] Lint/type checks pass.
- [ ] Smoke test script/checklist updated and executed.

---

### US-009: Align docs/manifest/release process with actual v13 support
**Description:** As an installer/user, I want metadata and docs to match reality so setup and expectations are clear.

**Acceptance Criteria:**
- [ ] README compatibility statements are updated to v13 reality.
- [ ] Manifest fields and badges align with supported versions.
- [ ] Release script/docs remove stale repository/action references.
- [ ] Lint/type checks pass.
- [ ] Smoke test script/checklist updated and executed.

---

### US-010: Performance profiling baseline for occlusion modes
**Description:** As a maintainer, I want measurable occlusion performance baselines so optimization decisions are evidence-based.

**Acceptance Criteria:**
- [ ] Baseline scenarios defined (token counts, tile counts, zoom ranges).
- [ ] CPU-mode chunk configurations compared and documented.
- [ ] Recommended defaults selected based on measured tradeoffs.
- [ ] Lint/type checks pass.
- [ ] Smoke test script/checklist updated and executed.
- [ ] Verify in browser using dev-browser skill.

## 4. Functional Requirements

- **FR-1:** The module must treat Foundry major version as a single canonical config value.
- **FR-2:** Scene isometric toggle must apply and reset all stage/background transforms without persistent side effects.
- **FR-3:** Token/tile transform logic must explicitly support both isometric and non-isometric render states.
- **FR-4:** Debug output must be disabled by default and centralized behind module debug setting.
- **FR-5:** Occlusion and dynamic tile systems must use throttled refresh scheduling under frequent hook events.
- **FR-6:** Dynamic tile linked-wall IDs must be normalized with minimal unnecessary writes.
- **FR-7:** Token auto-sorting must preserve isometric depth ordering and controlled-token visibility.
- **FR-8:** A v13 smoke-validation checklist/script set must be maintained and required before release.
- **FR-9:** Documentation and manifest metadata must reflect actual support and known limitations.
- **FR-10:** Occlusion mode defaults must be selected from measured performance baselines.

## 5. Non-Goals (Out of Scope)

- Supporting Foundry v12 or earlier as a first-class compatibility target.
- Building a fully automated end-to-end CI browser suite in this initiative.
- Replacing all rendering approaches with a new engine/shader architecture from scratch.
- Introducing major new gameplay features beyond stabilization/modernization of existing capabilities.
- Multi-language documentation overhaul beyond required accuracy fixes.

## 6. Design Considerations

- Keep existing config-tab UX concepts (Scene/Token/Tile) to avoid user retraining.
- Preserve current feature toggles and semantics where possible.
- For behaviors that change, provide concise migration notes in release notes.
- Visual validation must include high-zoom and low-zoom checks due to transform sensitivity.

## 7. Technical Considerations

- Module operates on transformed `canvas.stage`; coordinate conversions must remain mathematically consistent across HUD, ruler, and sorting logic.
- Hook density is high; central scheduler/queue may be needed to avoid refresh storms.
- Any prototype/class patching should be reviewed for safer interop strategy on v13.
- Occlusion CPU modes are quality/performance tradeoffs; defaults should be data-driven.
- Scene/token/tile flags must remain backward-safe for existing worlds where practical.

## 8. Success Metrics

- **Correctness:** 0 known high-severity transform reset bugs after release 1.
- **Stability:** No reproducible visual-state drift after 20 repeated isometric on/off toggles in smoke test.
- **Performance:** Reduced average frame stutter/FPS drops during token movement with occlusion/dynamic features enabled (measured baseline vs post-change).
- **Maintainability:** Reduced ad-hoc logging and clearer module diagnostics in debug mode only.
- **Release quality:** 100% completion of smoke checklist before each release tag.

## 9. Open Questions

- Should GPU occlusion mode remain exposed if quality is still known-bad after profiling?
- Should auto-sorting remain opt-in beta or become default-on for isometric scenes once stabilized?
- Is a migration pass needed for any legacy flag names/semantics already saved in world data?
- What minimum performance target (FPS or frame-time budget) should be required for acceptance?
- Should release process continue script-driven tagging/push from repo, or move to CI-only release orchestration?
