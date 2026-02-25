# PRD: v13 Production Hardening Release

## 1. Introduction/Overview

This PRD defines a single-release hardening scope for `isometric-perspective` on Foundry v13.
The release goal is to move the module from "stable with beta edges" to "production-ready" by tightening reliability, reducing regressions, and enforcing automated quality gates.

The scope prioritizes existing features already implemented in the repository: scene transforms, token/tile transforms, HUD and ruler alignment, occlusion, dynamic tile linked-wall behavior, and auto-sorting. It does not introduce major new gameplay features.

## 2. Goals

- Promote occlusion, dynamic tile, and auto-sorting from beta-level behavior to production-ready behavior with explicit acceptance criteria.
- Add CI enforcement for lint and unit tests on pull requests.
- Add integration/regression validation for high-risk isometric workflows.
- Reduce maintenance risk by removing or isolating dead/legacy runtime paths that can cause drift.
- Align release documentation with actual behavior and require evidence-based release gates.

## 3. User Stories

### US-001: Enforce CI quality gates
**Description:** As a maintainer, I want automated CI checks for lint and tests so regressions are blocked before merge.

**Acceptance Criteria:**
- [ ] A PR workflow runs `npm run lint` and `npm test` on each pull request and on pushes to the main branch.
- [ ] Workflow fails when lint or tests fail.
- [ ] Branch protection can rely on CI status checks (documented in repo docs).
- [ ] CI setup is documented in release and contributor docs.

### US-002: Add high-risk integration regression harness
**Description:** As a maintainer, I want repeatable regression checks for scene transforms and interaction flows so runtime issues are caught before release.

**Acceptance Criteria:**
- [ ] A scripted or structured harness exists for high-risk flows: projection switching, pan/zoom, scene switch, token control switch, and door state changes.
- [ ] Harness outputs include pass/fail evidence per scenario.
- [ ] Harness is linked from `SMOKE-TEST.md` and required by `RELEASE-PROCESS.md`.
- [ ] `npm run lint` and `npm test` pass after harness integration.
- [ ] Verify in browser using dev-browser skill.

### US-003: Productionize occlusion behavior and defaults
**Description:** As a GM, I want token silhouette occlusion to be predictable and performant so it is safe to use in production sessions.

**Acceptance Criteria:**
- [ ] Occlusion lifecycle is stable across canvas init, scene switch, and canvas teardown (no stale containers or sprite leaks).
- [ ] Mode behavior (`off`, `gpu`, `cpu*`) is documented with production recommendations and default policy.
- [ ] At least one completed profiling baseline run is recorded for the release candidate.
- [ ] Default setting choice is explicitly justified in docs.
- [ ] `npm run lint` and `npm test` pass.
- [ ] Verify in browser using dev-browser skill.

### US-004: Productionize dynamic tile linked-wall behavior
**Description:** As a GM/player, I want dynamic tile linked-wall visibility to be consistent during fast interaction so visibility behavior remains trustworthy.

**Acceptance Criteria:**
- [ ] Overlay rebuild path deterministically destroys/recreates cloned sprites without accumulation.
- [ ] Behavior is defined for no-controlled-token, rapid control switching, and scene transitions.
- [ ] Linked doors and wall state changes produce correct visibility updates.
- [ ] Linked wall ID normalization behavior is documented and stable.
- [ ] `npm run lint` and `npm test` pass.
- [ ] Verify in browser using dev-browser skill.

### US-005: Productionize token auto-sorting behavior
**Description:** As a GM, I want token depth ordering to remain stable and intuitive so token front/back rendering matches visual expectation.

**Acceptance Criteria:**
- [ ] Sorting pipeline ownership is clearly documented (display-only path vs document sort-write path).
- [ ] No sort jitter or conflicting updates during rapid token movement.
- [ ] Controlled-token visibility boost remains intact without breaking relative depth ordering.
- [ ] Sorting behavior is validated across rectangular token sizes and offsets.
- [ ] `npm run lint` and `npm test` pass.
- [ ] Verify in browser using dev-browser skill.

### US-006: Clean v13 runtime boundaries and reduce code debt
**Description:** As a maintainer, I want runtime code aligned to v13 support so future changes are safer and easier to reason about.

**Acceptance Criteria:**
- [ ] Legacy compatibility branches not relevant to v13 runtime are removed, isolated, or clearly marked as non-executed.
- [ ] Runtime entry points no longer contain ambiguous commented experimental paths.
- [ ] Lint warning count is reduced meaningfully from the current baseline and tracked in release notes.
- [ ] `npm run lint` and `npm test` pass.

### US-007: Harden release tooling and release evidence flow
**Description:** As a maintainer, I want a safer release process so packaging and publishing are reproducible and low-risk.

**Acceptance Criteria:**
- [ ] Release flow separates packaging from irreversible git operations (commit/tag/push) or adds explicit guardrails.
- [ ] Release docs define mandatory evidence: smoke suite, high-risk matrix, profiling baseline, and CI pass.
- [ ] Release candidate checklist can be completed without ad-hoc steps.
- [ ] `npm run lint` and `npm test` pass.

### US-008: Align README and operator-facing documentation with shipped behavior
**Description:** As a user and maintainer, I want docs that accurately reflect current feature status so configuration choices are clear.

**Acceptance Criteria:**
- [ ] README feature list, known-bugs section, and compatibility notes match current implementation.
- [ ] Beta/production status labels for occlusion, dynamic tile, and auto-sorting are explicit and consistent.
- [ ] Documentation references current smoke/release/performance artifacts.
- [ ] `npm run lint` and `npm test` pass.

## 4. Functional Requirements

- FR-1: The system must run lint and unit tests automatically in CI for all pull requests.
- FR-2: The system must fail CI when lint or unit tests fail.
- FR-3: The release process must require completed high-risk interaction evidence before shipping.
- FR-4: Occlusion lifecycle must cleanly initialize, update, and teardown without stale display objects.
- FR-5: Dynamic tile overlays must deterministically rebuild and remain correct across control/scene/door changes.
- FR-6: Token auto-sorting must maintain a single documented ownership model for sort writes and display z-order updates.
- FR-7: Runtime code must reflect v13 support boundaries with minimized dead legacy paths.
- FR-8: Release tooling must provide a safe packaging workflow with explicit controls around commit/tag/push operations.
- FR-9: Project documentation must consistently describe feature status, compatibility, and release validation requirements.
- FR-10: Production defaults for high-cost features (especially occlusion modes) must be documented and justified by measured evidence.

## 5. Non-Goals (Out of Scope)

- Adding entirely new gameplay systems unrelated to current isometric rendering features.
- Expanding support to Foundry versions outside v13 in this release cycle.
- Full architectural rewrite of occlusion algorithms from scratch.
- Large UI redesign of configuration tabs beyond bugfix/hardening needs.
- Replacing manual smoke testing entirely; this release adds automation layers, not full end-to-end replacement.

## 6. Design Considerations

- Preserve current user workflows and setting names where possible to avoid migration friction.
- Keep UI text for feature maturity clear: whether a feature is production-ready, optional, or advanced.
- Prefer incremental hardening over broad behavior redesign to reduce risk within a one-release scope.

## 7. Technical Considerations

- Core runtime integration points: `scripts/main.js`, `scripts/scene.js`, `scripts/transform.js`, `scripts/occlusion.js`, `scripts/dynamictile.js`, `scripts/autosorting.js`, `scripts/token.js`, `scripts/hud.js`, `scripts/ruler.js`.
- CI should run in GitHub Actions and be lightweight enough for frequent contributor usage.
- Regression harness should focus on high-risk interactions already captured in `SMOKE-TEST.md`.
- Release hardening should avoid destructive git automation defaults and favor explicit, auditable steps.
- Lint warning reduction should target highest-value maintainability issues first (unused vars/imports, dead paths, ambiguous branches).

## 8. Success Metrics

- 100% of PRs to main pass CI lint+test gates before merge.
- 0 release candidates shipped without completed smoke suite + high-risk matrix evidence.
- 0 known stale-container/leak regressions in occlusion and dynamic tile during release stress scenarios.
- Stable token sort behavior in all defined overlap and rapid-movement smoke scenarios.
- Lint warning count reduced from baseline by at least 40% in this release cycle.
- README and release docs fully aligned with current behavior and defaults.

## 9. Open Questions

- Should any occlusion mode become the default, or should default remain `off` with stronger recommendations?
- Do we want to enforce hard lint warning thresholds in CI now, or phase in warning budgets over successive releases?
- What is the minimum acceptable integration harness depth for this release (fully scripted vs checklist-driven automation)?
- Should release tooling remove automated git push/tag entirely, or keep it with explicit interactive confirmations?
