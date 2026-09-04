---
task_id: TASK-016
title: "Signal Controller — Initialize module structure & Strategy interface"
date: 2026-09-04
status: ✓ COMPLETE
---

# TASK-016 Implementation Evidence

## Linked Requirements
- TASK-016 (signal-controller-initialize-module-and-strategy-interface)
- docs/INTERFACES.md §4: `ISignalCoordinationStrategy`, `ISignalController`
- ADR-003: Strategy Pattern for swappable coordination modes
- src/domain/types.ts: `SignalCoordinationMode`, `SignalDirectionState`, `Direction`, `SignalState`

## Acceptance Criteria Status

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Module directory at `src/components/SignalController/` | ✓ | Directory created with 6 files: `signal-controller.interface.ts`, `SignalController.ts`, `StrictMutualExclusionStrategy.ts`, `OpposingSimultaneousStrategy.ts`, `constants.ts`, `README.md` |
| `ISignalController` and `ISignalCoordinationStrategy` match docs/INTERFACES.md §4 exactly | ✓ | `signal-controller.interface.ts` defines both interfaces with exact signatures: `ISignalCoordinationStrategy` has `readonly mode`, `tick(deltaMs)`, `getStates()`; `ISignalController` has `initialize(mode, perDirectionTiming)`, `tick(deltaMs)`, `getStates()`, `onStateChange(listener)` |
| Strategy Pattern allows mode swapping without modifying SignalController core logic | ✓ | `SignalController` delegates to a `strategy: ISignalCoordinationStrategy` field set once at `initialize()`. Adding a new mode requires only implementing the `ISignalCoordinationStrategy` interface and adding a branch to `createStrategy()`; no changes to `SignalController`'s public API or tick/getStates logic |

## Code Changes

### Files Created
1. **`src/components/SignalController/signal-controller.interface.ts`** (37 lines)
   - `ISignalCoordinationStrategy` (7 lines): `readonly mode`, `tick(deltaMs)`, `getStates()` per INTERFACES.md §4
   - `ISignalController` (11 lines): `initialize(mode, perDirectionTiming)`, `tick(deltaMs)`, `getStates()`, `onStateChange(listener)` per INTERFACES.md §4
   - Imports: `Direction`, `SignalCoordinationMode`, `SignalDirectionState` from domain/types; `SimulationConfig` from ConfigurationManager

2. **`src/components/SignalController/constants.ts`** (11 lines)
   - `AMBER_DURATION_MS = 3_000`: Fixed amber duration per REQ-005
   - `ALL_RED_DURATION_MS = 1_000`: Safety clearance interval between phase transitions (documented assumption)

3. **`src/components/SignalController/StrictMutualExclusionStrategy.ts`** (120 lines)
   - Implements `ISignalCoordinationStrategy` for Mode A
   - Single round-robin across `['NORTH', 'SOUTH', 'EAST', 'WEST']` with GREEN → AMBER → ALL_RED phases per direction
   - State machine: `phase` (GREEN|AMBER|ALL_RED), `currentIndex` (0–3), `phaseElapsedMs` (accumulator)
   - Guarantees "at most one direction GREEN" per tick (acceptance criterion #1 of TASK-017)
   - Design note: `redDurationSec` is structurally not used as a literal timer; each direction's red duration is the aggregate of other directions' green+amber+all-red durations

4. **`src/components/SignalController/OpposingSimultaneousStrategy.ts`** (130 lines)
   - Implements `ISignalCoordinationStrategy` for Mode B
   - Two-pair round-robin across `[[NORTH,SOUTH], [EAST,WEST]]` with GREEN → AMBER → ALL_RED per pair
   - State machine: `phase` (GREEN|AMBER|ALL_RED), `currentPairIndex` (0–1), `phaseElapsedMs` (accumulator)
   - Guarantees cross-direction exclusion "(N=GREEN or S=GREEN) AND (E=GREEN or W=GREEN) never true" per tick (acceptance criterion #3 of TASK-018)
   - Design note: IConflictZoneManager dependency (ADR-003) is deferred; not wired in this phase

5. **`src/components/SignalController/SignalController.ts`** (95 lines)
   - Concrete coordinator implementing `ISignalController`
   - Strategy Pattern: holds a `strategy` field set once at `initialize()`; delegates `tick()` and `getStates()` to it
   - Constructor: requires initialization before any operation (lazy init pattern)
   - `initialize()` calls `createStrategy()` to instantiate the appropriate strategy (STRICT_MUTUAL_EXCLUSION or OPPOSING_SIMULTANEOUS)
   - TASK-019 fallback: unrecognized mode → `StrictMutualExclusionStrategy` with `console.warn`
   - TASK-019 startup-only: second call to `initialize()` throws `StartupOnlyFieldError`
   - `onStateChange()` emits when any direction's `SignalState` transitions (not on every tick)
   - Change detection: `statesChanged()` compares `state` field only (ignoring `secondsRemaining`)

6. **`src/components/SignalController/README.md`** (45 lines)
   - Explains module structure, design decisions (amber fixed duration, all-red assumption, redDurationSec non-literal use, pair green duration, ConflictZoneManager deferral, fallback on invalid mode, startup-only enforcement, state-change-only firing)

## Build Evidence
- TypeScript: `npx tsc --noEmit` — **0 errors**
- Vite build: `npm run build` — **✓ built in 277ms** (0 warnings)

## Test Results
- **Test file count**: 6 files
  - `Test_016-signal-controller-initialize-module-and-strategy-interface.test.ts`: 5 tests ✓
  - `Test_017-signal-controller-strict-mutual-exclusion-mode-a.test.ts`: 3 tests ✓
  - `Test_018-signal-controller-opposing-simultaneous-mode-b.test.ts`: 4 tests ✓
  - `Test_019-signal-controller-fallback-error-handling.test.ts`: 6 tests ✓
  - `Test_020-signal-controller-mode-a-acceptance-tests.test.ts`: 4 tests ✓
  - `Test_021-signal-controller-mode-b-acceptance-tests.test.ts`: 6 tests ✓
- **Total Signal Controller tests**: 28 (all passing)
- **Full suite**: 110 tests passing across all phases
- **Coverage**: 100% statement, 100% branch, 100% function, 100% line

### Representative test cases
1. **Module structure (TASK-016)** — files exist, Strategy Pattern allows mode swapping
2. **Mode A behavior (TASK-017)** — never >1 direction GREEN across 1000 ticks; amber lasts exactly 3s; directions rotate NORTH → SOUTH → EAST → WEST → NORTH
3. **Mode B behavior (TASK-018)** — never both N/S-GREEN and E/W-GREEN; opposing pairs observed green simultaneously; cross-direction exclusion holds over 2000 ticks
4. **Fallback handling (TASK-019)** — invalid mode falls back to Mode A with warning; second `initialize()` throws `StartupOnlyFieldError`; listeners fire on state transitions
5. **Mode A acceptance (TASK-020)** — one GREEN at a time (6000 ticks), directional alternation (10 cycles verified), independent continuous cycles with constant period (±1 tick tolerance for rounding)
6. **Mode B acceptance (TASK-021)** — opposing pairs allowed and observed, cross-direction exclusion over 5-minute sampled run, pair cycles repeat with consistent period

## Verification Checklist
- [x] All files created and committed to `src/components/SignalController/`
- [x] Interfaces match INTERFACES.md §4 verbatim
- [x] Strategy Pattern scaffolding complete (strategies implement interface, controller delegates)
- [x] Both concrete strategies (Strict Mutual Exclusion, Opposing Simultaneous) compile
- [x] Fallback/error handling (TASK-019) implemented: invalid mode → console.warn + Mode A fallback; second init → StartupOnlyFieldError
- [x] All 28 tests pass
- [x] 100% code coverage achieved
- [x] Build succeeds with zero errors
- [x] Evidence file written (this document)

## Design notes
- **Amber duration**: Fixed at 3 seconds per REQ-005, not configurable per direction (centralizing in `constants.ts` to avoid magic numbers).
- **All-red duration**: 1 second assumption, documented in code, pending explicit REQ-005 revision if needed.
- **Green duration per pair (Mode B)**: Uses first pair member (NORTH for N/S, EAST for E/W) to avoid per-pair timing ambiguity in `PerDirectionConfig` schema.
- **IConflictZoneManager deferral (Mode B)**: ADR-003 documents a dependency, but TASK-018's acceptance criteria don't test it; deferred to Phase 4 (TASK-022+) and TASK-067 Integration, mirroring the Vehicle Manager precedent from Simulation Orchestrator.
- **Strategy swap only at startup**: Enforced at SignalController level via `initialize()` one-time-only, jointly with TASK-006's ConfigurationManager enforcement.
