# PRD: Lean Repository Hardening (v13)

## Introduction/Overview

This effort makes the repository as lean as possible by aggressively removing unused code, dead branches, commented-out legacy blocks, duplicated logic, and unnecessary tooling complexity. The target runtime is Foundry v13 only, so historical compatibility code for older versions should be removed when validated as non-essential. The goal is to reduce maintenance cost and improve code clarity without introducing behavior regressions.

## Goals

- Reduce maintenance burden by removing dead and low-value code paths.
- Simplify complex functions and modules while preserving current behavior.
- Eliminate obsolete compatibility branches not required for Foundry v13 runtime.
- Consolidate tooling/docs/config so routine development and release work requires fewer steps.
- Keep quality gates green (`npm run lint`, `npm test`, typecheck).

## User Stories

### US-001: Remove dead and unreachable runtime code
**Description:** As a maintainer, I want dead code removed so the active runtime path is easier to reason about and safer to modify.

**Acceptance Criteria:**
- [ ] Remove clearly unused functions, unused exports, and unreachable branches in tracked runtime files.
- [ ] Remove stale commented-out code blocks that are not intentional documentation.
- [ ] For each removal, confirm there are no remaining references (`rg`-based validation).
- [ ] Typecheck passes.
- [ ] Lint passes.
- [ ] Tests pass.

### US-002: Collapse v13 runtime to a single canonical path
**Description:** As a maintainer, I want v13-only execution paths so runtime logic is simpler and avoids compatibility branching debt.

**Acceptance Criteria:**
- [ ] Identify and remove v11/v12 compatibility branches that are not needed for v13 operation.
- [ ] Replace version-conditional logic with v13 canonical logic where behavior is equivalent.
- [ ] Document each removed compatibility area and rationale in release notes or migration notes.
- [ ] Typecheck passes.
- [ ] Lint passes.
- [ ] Tests pass.

### US-003: Simplify high-complexity functions
**Description:** As a maintainer, I want complex functions simplified so debugging and future changes are faster and lower risk.

**Acceptance Criteria:**
- [ ] Identify top high-complexity functions (branch-heavy or long functions) and simplify them into smaller, named helpers.
- [ ] Preserve inputs/outputs and user-facing behavior for each simplified function.
- [ ] Remove duplicated calculations and normalize repeated logic into shared utilities where appropriate.
- [ ] Typecheck passes.
- [ ] Lint passes.
- [ ] Tests pass.

### US-004: Lean up tests and validation structure
**Description:** As a maintainer, I want a minimal but effective test suite so quality checks stay fast and trustworthy.

**Acceptance Criteria:**
- [ ] Remove duplicate or obsolete tests that no longer validate meaningful behavior.
- [ ] Keep or add focused regression tests for any area affected by removals/simplifications.
- [ ] Ensure test commands remain deterministic and executable from a clean clone.
- [ ] Typecheck passes.
- [ ] Lint passes.
- [ ] Tests pass.

### US-005: Simplify tooling, scripts, and repository metadata
**Description:** As a maintainer, I want supporting tooling simplified so release and maintenance workflows have fewer fragile steps.

**Acceptance Criteria:**
- [ ] Simplify release/build/dev scripts by removing redundant steps and legacy fallbacks.
- [ ] Remove or merge redundant documentation pages and outdated instructions.
- [ ] Clean config/package metadata (scripts, ignores, fields) to reflect current workflow only.
- [ ] Typecheck passes.
- [ ] Lint passes.
- [ ] Tests pass.

## Functional Requirements

- FR-1: The system must remove runtime code that has no active references in the v13 code path.
- FR-2: The system must eliminate legacy compatibility branches for unsupported Foundry versions where no v13 behavior depends on them.
- FR-3: The system must preserve current external behavior for supported v13 features after simplification.
- FR-4: The system must decompose branch-heavy functions into smaller helpers with clear names and responsibilities.
- FR-5: The system must consolidate duplicated logic and constants into shared utilities where it reduces complexity.
- FR-6: The system must remove commented-out code blocks that are not intentionally retained as explanatory documentation.
- FR-7: The system must keep test coverage for high-risk flows touched by refactors/removals.
- FR-8: The system must simplify release/build scripts to the minimum required reproducible process.
- FR-9: The system must remove outdated or redundant docs and align remaining docs with current behavior and workflow.
- FR-10: The system must pass typecheck, lint, and test gates after all cleanup.

## Non-Goals (Out of Scope)

- Adding new gameplay features or UI capabilities unrelated to cleanup.
- Introducing multi-version runtime compatibility beyond Foundry v13.
- Rewriting stable modules purely for stylistic preference.
- Large architectural redesign not required to remove debt or simplify behavior.
- Performance micro-optimizations that do not materially reduce complexity or maintenance cost.

## Design Considerations

- Favor readability and explicit naming over clever condensed logic.
- Preserve existing public-facing strings and settings unless a removal requires migration notes.
- Keep module behavior discoverable for GMs by ensuring docs map to shipped behavior.

## Technical Considerations

- Use repeatable search evidence (`rg`) to validate dead-code removals and reference cleanup.
- Prefer incremental refactors by subsystem (for example: sorting, dynamic tile, occlusion, transform) to limit risk.
- For removed compatibility code, verify no remaining constants/settings imply support for older versions.
- Keep commits scoped to one subsystem where practical to simplify review and rollback.

## Success Metrics

- All quality gates pass: typecheck, `npm run lint`, and `npm test`.
- Measurable reduction in maintenance surface (for example: fewer branches, fewer long functions, reduced duplicated blocks).
- Number of removed dead/commented legacy blocks is documented in release notes or progress tracking.
- Documentation and scripts reflect only current v13-supported workflows.

## Open Questions

- Should this effort be shipped as one large release or split into phased cleanup releases by subsystem?
- Is there a minimum regression test matrix required beyond existing automated tests (for example, scene switch, token control switch, wall/door linked updates)?
- Are there any compatibility promises to community forks that could constrain aggressive removals?
