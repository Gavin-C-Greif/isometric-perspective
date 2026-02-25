# Migration Notes

## v13 Runtime Simplification (Lean Repository Hardening)

The module targets Foundry v13 only (`module.json` compatibility: minimum 13, verified 13). The following v11/v12 compatibility branches were removed to simplify the runtime:

### Removed Compatibility Areas

| Area | Rationale |
|------|-----------|
| **autosorting.js** | Removed v11 early return; auto-sorting now always registers on v13. |
| **token.js** | Removed v11 early return from `registerTokenSortingPatch`; patch always applies on v13. |
| **transform.js** | Removed v11-specific default fill-type handling in `resetTokenTransform` and `applyIsometricTransformation`; v13 uses `logWarn` + fallback scale. Removed `setupCompatibilityHooks` and `dropCanvasData` hook (v11-only). |
| **dynamictile.js** | Replaced version-conditional wall API: v11 used `wall.A`/`wall.B` and `canvas.effects.visibility`; v13 uses `wall.edge.a`/`wall.edge.b` and `canvas.visibility`. All wall/visibility logic now uses v13 API. |

### No Migration Required

If you run Foundry v13, no action is needed. The module was already v13-only; this change removes dead code paths that were never executed.
