## TASK-008 Implementation Evidence

**Date**: 2026-09-04
**Developer**: GitHub Copilot (agent)
**Code Review**: pending

### Linked Requirements
- [REQ-027](../specs/requirements/011-REQ-027-ui-controls.md): UI needs to react to configuration changes.
- [REQ-028](../specs/requirements/012-REQ-028-state-display.md): State display panels subscribe to configuration changes.

### Linked ADR
- [ADR-007-configuration-scenario-presets](../docs/ADRs/ADR-007-configuration-scenario-presets.md)

### Acceptance Criteria Status
- ✓ `onChange()` listener registry implemented; fires on every successful `update()`/`applyScenarioPreset()`
- ✓ Listener receives a read-only (frozen) snapshot, not a mutable reference
- ✓ Unit test asserts mutation attempts on the received snapshot throw/are no-ops

### Code Changes
- `src/components/ConfigurationManager/ConfigurationManager.ts` — `onChange(listener)` appends to a private `listeners` array; a private `notify()` (called at the end of `update()` and `applyScenarioPreset()`, only on success) invokes every listener with `this.getSnapshot()`. `frozenClone()` deep-clones the config via `JSON.parse(JSON.stringify(...))` (safe — `SimulationConfig` is plain JSON-serializable data) and recursively `Object.freeze()`s every nested object, so both top-level and nested (`perDirection`, `emergency`, `conflictZone`, and per-direction sub-objects) mutation attempts fail.
- `src/components/ConfigurationManager/ConfigurationManager.test.ts` — tests: listener fires exactly once per successful call and twice for two calls; listener does **not** fire when `update()` throws; received snapshot is frozen at every nesting level (`Object.isFrozen` checked on the root, `perDirection`, and `perDirection.NORTH`); a strict-mode mutation attempt throws `TypeError`; and mutation attempts don't leak into manager-internal state.

### Build Evidence
```
$ npm run build
✓ built in 552ms
```

### Test Results
```
$ npm run test:coverage
 ✓ src/components/ConfigurationManager/ConfigurationManager.test.ts (23)
```
Includes: `fires on every successful update() and applyScenarioPreset()`, `does not fire when update() throws`, `passes a deeply frozen snapshot that cannot be mutated`, `getSnapshot() itself also returns a frozen, independent clone` — all passing.

### Verification
- [x] Builds without warnings
- [x] All tests pass
- [x] Frozen-snapshot mutation attempt verified to throw `TypeError` in strict mode
- [x] Confirmed listeners are not invoked on failed/rejected updates
