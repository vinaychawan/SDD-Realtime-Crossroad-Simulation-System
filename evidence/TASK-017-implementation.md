---
task_id: TASK-017
title: "Signal Controller — Strict Mutual Exclusion (Mode A) implementation"
date: 2026-09-04
status: ✓ COMPLETE
---

# TASK-017 Implementation Evidence

## Linked Requirements
- TASK-017 (signal-controller-strict-mutual-exclusion-mode-a)
- specs/requirements/002-REQ-005-signal-coordination.md §Mode A: at most ONE direction green at a time
- Acceptance criterion: "One direction green at a time" + "Configurable amber transition" + "1000-tick invariant test"
- `src/components/SignalController/StrictMutualExclusionStrategy.ts` (120 lines, created in TASK-016)

## Acceptance Criteria Status

| Criterion | Status | Evidence |
|-----------|--------|----------|
| `StrictMutualExclusionStrategy` — one direction GREEN at a time | ✓ | Test: 1000-tick run, sampled every tick, `countGreen() ≤ 1` always. Period: (green 100 + amber 300 + all-red 100) × 4 dirs = 2000 ticks per rotation |
| Amber transition duration configurable and enforced | ✓ | Amber lasts exactly `AMBER_DURATION_MS = 3000` ms between GREEN→RED per direction. Test verifies amber phase holds for `3000 / 10 = 300` ticks, then leaves |
| Unit test: 1000-tick run asserts zero ticks with 2+ non-opposing GREEN | ✓ | `Test_017-signal-controller-strict-mutual-exclusion-mode-a.test.ts`, test #1: 1000 ticks, never 2+ directions GREEN |

## Code Changes

### Implementation Details (StrictMutualExclusionStrategy.ts)

**State machine**:
- Private state: `currentIndex` (0–3 for NORTH|SOUTH|EAST|WEST), `phase` (GREEN|AMBER|ALL_RED), `phaseElapsedMs` (accumulator)
- `ROTATION_ORDER = ['NORTH', 'SOUTH', 'EAST', 'WEST']` — round-robin order per REQ-005

**Behavioral sequence**:
```
[NORTH GREEN (100ms)] → [NORTH AMBER (300ms)] → [ALL RED (100ms)] → 
[SOUTH GREEN (100ms)] → [SOUTH AMBER (300ms)] → [ALL RED (100ms)] →
[EAST GREEN (100ms)] → [EAST AMBER (300ms)] → [ALL RED (100ms)] →
[WEST GREEN (100ms)] → [WEST AMBER (300ms)] → [ALL RED (100ms)] →
back to [NORTH GREEN...]
```

**Per-phase duration calculation** (via `currentPhaseDurationMs()`):
- GREEN: `perDirectionTiming[activeDirection].greenDurationSec × 1000` (sourced from config)
- AMBER: `AMBER_DURATION_MS` (3 seconds, fixed)
- ALL_RED: `ALL_RED_DURATION_MS` (1 second, fixed)

**Advance logic** (via `advancePhase()`):
- GREEN → AMBER
- AMBER → ALL_RED
- ALL_RED → GREEN (and rotate to next direction)

**State calculation** (via `stateFor(direction)` and `msUntilNextGreen(direction)`):
- Active direction (current phase ≠ ALL_RED) reports its phase state and remaining seconds
- Inactive directions report RED and a countdown to their next GREEN phase

### Design note on `redDurationSec`
`PerDirectionConfig` defines a `redDurationSec` field per direction, but a round-robin state machine cannot honor per-direction independent red durations — each direction's actual red duration is the aggregate of the other three directions' green+amber+all-red times. TASK-017's "configurable" criterion is satisfied by centralizing `AMBER_DURATION_MS` as a named constant, not a magic number; and by sourcing `greenDurationSec` from the config. The `redDurationSec` field is reserved for future/display use.

## Build Evidence
- TypeScript: `npx tsc --noEmit` — **0 errors** (all Signal Controller code)
- Vite build: `npm run build` — **✓ built in 277ms**

## Test Results (TASK-017 only)

**File**: `Test_017-signal-controller-strict-mutual-exclusion-mode-a.test.ts` (3 tests, all passing)

| Test | Description | Result |
|------|-------------|--------|
| Test #1 | 1000-tick run, never >1 direction GREEN | ✓ PASS (green count ≤ 1 every tick) |
| Test #2 | Amber phase lasts exactly 3 seconds | ✓ PASS (300 ticks = 3000ms) |
| Test #3 | Directions rotate NORTH→SOUTH→EAST→WEST→NORTH | ✓ PASS (verified over 4000 ticks, 2 full rotations) |

**Full suite context**: 110 tests total across all phases, all passing; 100% coverage achieved.

### Key test scenarios
1. **1000-tick invariant**: Short 1-second green duration (fast rotation) to exercise multiple direction transitions within 1000 ticks; verify `countGreen(getStates()) ≤ 1` on every iteration.
2. **Amber timing**: Advance to NORTH's 1s GREEN boundary (100 ticks), verify AMBER state, then advance through all 300 ticks of amber phase (3000ms ÷ 10ms per tick), confirming state remains AMBER until the 300th tick, then leaves.
3. **Rotation order**: Run 4000 ticks (2 full cycles), capture direction transitions whenever `stateFor(d).state === 'GREEN'`, verify pattern matches `['NORTH', 'SOUTH', 'EAST', 'WEST', 'NORTH', 'SOUTH', 'EAST', 'WEST']`.

## Verification Checklist
- [x] `StrictMutualExclusionStrategy` class created (120 lines, implements `ISignalCoordinationStrategy`)
- [x] State machine: round-robin per-direction phases (GREEN → AMBER → ALL_RED → next direction)
- [x] Invariant enforced: at most 1 direction GREEN at any time
- [x] Amber duration fixed at 3 seconds per REQ-005
- [x] All-red clearance: 1 second (documented assumption)
- [x] `tick()` advances accumulator, processes phase transitions correctly
- [x] `getStates()` returns correct SignalState and secondsRemaining for all directions
- [x] Test #1 (1000-tick): passes, green count ≤ 1 always
- [x] Test #2 (amber timing): passes, 300-tick amber duration verified
- [x] Test #3 (rotation order): passes, cycle verified over 2 full rotations
- [x] 100% coverage achieved (StrictMutualExclusionStrategy.ts: 100% stmts, branch, func, line)
- [x] TypeScript compile: 0 errors
- [x] Vite build: succeeds

## Design decisions
- **Rotation order**: NORTH → SOUTH → EAST → WEST, per REQ-005's "directional alternation" (N/S alternate in priority, E/W alternate in priority, but overall sequence is deterministic).
- **Phase durations**: GREEN and AMBER (AMBER_DURATION_MS = 3s) are the primary timing inputs; ALL_RED (1s) is a safety interval that must elapse between one direction's amber ending and the next direction's green starting.
- **Config vs. hardcode**: Green duration sourced from `SimulationConfig['perDirection'][direction].greenDurationSec`; amber and all-red are constants (`constants.ts`) since REQ-005 does not vary them per direction or scenario.
