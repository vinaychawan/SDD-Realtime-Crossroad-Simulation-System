## TASK-003 Implementation Evidence

**Date**: 2026-09-04
**Developer**: GitHub Copilot (agent)
**Code Review**: pending

### Linked Requirements
- [REQ-005](../specs/requirements/002-REQ-005-signal-coordination.md): signal coordination fallback errors.
- [REQ-007](../specs/requirements/003-REQ-007-vehicle-lane-selection.md): lane/spawn capacity error paths.
- [REQ-027](../specs/requirements/011-REQ-027-ui-controls.md): configuration validation errors surfaced to UI controls.

### Linked ADR
- None (cross-cutting concern, per task spec)

### Acceptance Criteria Status
- ✓ `src/domain/errors.ts` defines `InvalidConfigurationError`, `StartupOnlyFieldError`, `SpawnCapacityExceededError` per INTERFACES.md §11
- ✓ Each error class carries a machine-readable `code` field and human-readable `message`
- ✓ Unit test instantiates and asserts `instanceof Error` for each type

### Code Changes
- `src/domain/errors.ts` (new, ~45 lines) — abstract `DomainError extends Error` base class (fixes `this.name` and the prototype chain via `Object.setPrototypeOf` so `instanceof` works correctly on compiled JS targets), plus 3 concrete subclasses:
  - `InvalidConfigurationError` (`code = 'INVALID_CONFIGURATION'`, carries `field`, `value`)
  - `StartupOnlyFieldError` (`code = 'STARTUP_ONLY_FIELD'`, carries `field`)
  - `SpawnCapacityExceededError` (`code = 'SPAWN_CAPACITY_EXCEEDED'`, carries `direction`)
- `src/domain/errors.test.ts` (new) — 4 test cases: `instanceof Error` + `code` + custom field values for each class, plus cross-type `instanceof` discrimination (an `InvalidConfigurationError` is not an `instanceof StartupOnlyFieldError`, etc.).

### Build Evidence
```
$ npm run build
> tsc --noEmit && vite build
✓ 3 modules transformed.
✓ built in 427ms
```
0 TypeScript errors, 0 warnings.

### Test Results
```
$ npm run test:coverage
 ✓ src/domain/errors.test.ts (4)

 Test Files  5 passed (5)
      Tests  11 passed (11)

File       | % Stmts | % Branch | % Funcs | % Lines
-----------|---------|----------|---------|--------
errors.ts  |     100 |      100 |     100 |     100
```

### Verification
- [x] Builds without warnings
- [x] All tests pass (100% statement/branch/function/line coverage on `errors.ts`)
- [x] Each error's `instanceof Error` and `instanceof DomainError` verified
- [x] Code review against INTERFACES.md §11 — field names and `code` strings verified to match exactly
