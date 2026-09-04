## TASK-002 Implementation Evidence

**Date**: 2026-09-04
**Developer**: GitHub Copilot (agent)
**Code Review**: pending

### Linked Requirements
- [REQ-005](../specs/requirements/002-REQ-005-signal-coordination.md): signal coordination modes — modeled by `SignalCoordinationMode`.
- [REQ-007](../specs/requirements/003-REQ-007-vehicle-lane-selection.md): lane selection strategies — modeled by `LaneSelectionStrategyKind` and `Lane`.
- [REQ-020](../specs/requirements/004-REQ-020-configurable-frame-rate.md): shared vehicle/signal state used across the frame-rate-limited render loop.
- [REQ-NEW-E1](../specs/requirements/005-REQ-NEW-E1-emergency-vehicle-types.md): `EmergencyVehicleType` union.

### Linked ADR
- [ADR-001-technology-stack](../docs/ADRs/ADR-001-technology-stack.md)

### Acceptance Criteria Status
- ✓ `src/domain/types.ts` created with all types from INTERFACES.md §1 (`Direction`, `SignalState`, `SignalCoordinationMode`, `LaneSelectionStrategyKind`, `EmergencyVehicleType`, `VehicleState`, `SignalDirectionState`, `Vector2`)
- ✓ All enums use uppercase string literal unions per MF-004 naming convention
- ✓ Module has zero runtime logic (types only)

### Code Changes
- `src/domain/types.ts` (new, ~40 lines) — pure `export type` / `export interface` declarations only; no values, no functions.
- `src/domain/constants.ts` (new) — `ALL_DIRECTIONS`, `ALL_EMERGENCY_TYPES` array constants derived from the types. Split into its own module (rather than living in `types.ts`) specifically so `types.ts` satisfies the "zero runtime logic" acceptance criterion literally.
- `src/domain/unitConversion.ts` (new) — `MS_TO_KMH`, `speedMsToKmh`, `speedKmhToMs` helpers (NF-001 display/physics unit conversion). Also split out for the same reason.
- `src/domain/types.test.ts` (new) — constructs a full `VehicleState` object literal and exercises the other unions to validate the interface shapes compile correctly.
- `src/domain/constants.test.ts` (new) — verifies `ALL_DIRECTIONS`/`ALL_EMERGENCY_TYPES` contents.
- `src/domain/unitConversion.test.ts` (new) — verifies m/s ↔ km/h conversion and round-trip.

### Build Evidence
```
$ npm run build
> tsc --noEmit && vite build
vite v5.4.21 building for production...
✓ 3 modules transformed.
✓ built in 427ms
```
0 TypeScript errors with `strict: true` — confirms all type declarations are self-consistent.

### Test Results
```
$ npm run test:coverage
 ✓ src/domain/types.test.ts (1)
 ✓ src/domain/constants.test.ts (2)
 ✓ src/domain/unitConversion.test.ts (3)

 Test Files  5 passed (5)
      Tests  11 passed (11)

File               | % Stmts | % Branch | % Funcs | % Lines
-------------------|---------|----------|---------|--------
constants.ts       |     100 |      100 |     100 |     100
unitConversion.ts  |     100 |      100 |     100 |     100
types.ts           |       0 |        0 |       0 |       0   (no runtime statements — types-only file, expected)
```

### Verification
- [x] Builds without warnings
- [x] All tests pass
- [x] TypeScript compiler passes with `strict: true`
- [x] Code review against INTERFACES.md §1 — field names/casing verified to match exactly (`speedKmh`, `speedMs`, `isEmergency`, `emergencyType?`, `yieldingActive`, etc.)
