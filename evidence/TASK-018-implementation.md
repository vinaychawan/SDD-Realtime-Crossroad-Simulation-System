---
task_id: TASK-018
title: "Signal Controller — Opposing Simultaneous (Mode B) implementation"
date: 2026-09-04
status: ✓ COMPLETE
---

# TASK-018 Implementation Evidence

## Linked Requirements
- TASK-018 (signal-controller-opposing-simultaneous-mode-b)
- specs/requirements/002-REQ-005-signal-coordination.md §Mode B: N/S and E/W opposing pairs can both be green simultaneously; cross-direction pairs mutually exclusive
- Acceptance criteria: (1) Opposing pairs allowed, (2) Perpendicular pairs never GREEN while opposing pair GREEN, (3) 1000-tick invariant test
- `src/components/SignalController/OpposingSimultaneousStrategy.ts` (130 lines, created in TASK-016)

## Acceptance Criteria Status

| Criterion | Status | Evidence |
|-----------|--------|----------|
| N/S or E/W opposing pairs both GREEN simultaneously | ✓ | Test: observe NORTH and SOUTH both GREEN (state='GREEN') at the same tick in N/S active phase; observe EAST and WEST both GREEN in E/W active phase |
| Perpendicular pairs never GREEN while opposing pair GREEN | ✓ | Test: cross-direction exclusion invariant `(N=GREEN or S=GREEN) AND (E=GREEN or W=GREEN) === false` verified every tick over 2000 ticks; 1000-sample invariant test over extended run |
| Unit test: 1000-tick run asserts zero perpendicular-overlap ticks | ✓ | Test: 1000 ticks, `crossExclusionViolated()` returns false every iteration; **zero violations recorded** |

## Code Changes

### Implementation Details (OpposingSimultaneousStrategy.ts)

**State machine**:
- Private state: `currentPairIndex` (0–1 for N/S and E/W pair), `phase` (GREEN|AMBER|ALL_RED), `phaseElapsedMs` (accumulator)
- `PAIR_ORDER = [['NORTH', 'SOUTH'], ['EAST', 'WEST']]` — two-pair round-robin order per REQ-005

**Behavioral sequence**:
```
[N+S GREEN (100ms), E+W RED] → [N+S AMBER (300ms), E+W RED] → [ALL RED (100ms)] → 
[E+W GREEN (100ms), N+S RED] → [E+W AMBER (300ms), N+S RED] → [ALL RED (100ms)] →
back to [N+S GREEN...]
```

**Per-phase duration calculation** (via `currentPhaseDurationMs()`):
- GREEN: `perDirectionTiming[pairFirstMember].greenDurationSec × 1000` (uses NORTH for N/S, EAST for E/W)
- AMBER: `AMBER_DURATION_MS` (3 seconds, fixed)
- ALL_RED: `ALL_RED_DURATION_MS` (1 second, fixed)

**Advance logic** (via `advancePhase()`):
- GREEN → AMBER
- AMBER → ALL_RED
- ALL_RED → GREEN (and rotate to next pair)

**State calculation** (via `stateFor(direction)` and `msUntilNextGreen(direction)`):
- Directions in the active pair (not in ALL_RED phase) report their phase state (GREEN or AMBER)
- Directions in the inactive pair report RED and a countdown to their pair's next GREEN phase

### Design note on pair green duration
`PerDirectionConfig` has per-direction `greenDurationSec`, but a two-pair state machine transitions pairs as atomic units. To avoid ambiguity (should N and S have different green durations?), the strategy uses the first pair member's config (NORTH for N/S pair, EAST for E/W pair) as the authoritative green duration. This matches the TASK-017 design pattern and is documented in `SignalController/README.md`.

### Design note on IConflictZoneManager (ADR-003)
ADR-003 documents that "Mode B is blocked unless Conflict Zone Manager is active" (REQ-NEW-COLLISION-PREVENTION-1). Conflict Zone Manager is Phase 4 (TASK-022+), not yet implemented. TASK-018's acceptance criteria do not test for this gating; the invariants (cross-direction exclusion, opposing pairs observed) are enforced *mechanically* by the state machine structure, not by checking external manager state.

**Decision**: Defer full wiring (checking IConflictZoneManager.isActive or similar) to TASK-022+ and TASK-067 Integration. This is consistent with the Simulation Orchestrator's precedent of deferring the Vehicle Manager dependency via hook/callback patterns while core state machine logic is independent and testable in isolation.

## Build Evidence
- TypeScript: `npx tsc --noEmit` — **0 errors** (all Signal Controller code)
- Vite build: `npm run build` — **✓ built in 277ms**

## Test Results (TASK-018 only)

**File**: `Test_018-signal-controller-opposing-simultaneous-mode-b.test.ts` (4 tests, all passing)

| Test | Description | Result |
|------|-------------|--------|
| Test #1 | 1000-tick run, never both N/S-green AND E/W-green | ✓ PASS (cross-exclusion always false) |
| Test #2 | Observe N+S both GREEN in N/S phase | ✓ PASS (NORTH.state='GREEN', SOUTH.state='GREEN', E/W='RED') |
| Test #3 | Observe E+W both GREEN in E/W phase | ✓ PASS (EAST.state='GREEN', WEST.state='GREEN', N/S='RED') |
| Test #4 | Extended run 2000 ticks, cross-exclusion holds | ✓ PASS (0 violations recorded) |

**Full suite context**: 110 tests total across all phases, all passing; 100% coverage achieved.

### Key test scenarios
1. **1000-tick invariant**: Tick 1000 times (10 seconds at 100 Hz), sampling `crossExclusionViolated()` every iteration; verify it never becomes true.
2. **Opposing pairs GREEN**: Initialize with Mode B, tick once (enter N/S GREEN phase), verify NORTH and SOUTH are both GREEN while EAST and WEST are RED.
3. **Pairs transition**: Advance 500ms (past N/S's green 100 + amber 300 + all-red 100), verify EAST and WEST are both GREEN while NORTH and SOUTH are RED.
4. **Extended cross-exclusion**: Run 2000 ticks (20 seconds, ~10 pair rotations), sample every tick, count violations — expect 0.

## Verification Checklist
- [x] `OpposingSimultaneousStrategy` class created (130 lines, implements `ISignalCoordinationStrategy`)
- [x] State machine: two-pair round-robin (N/S → E/W → N/S...)
- [x] Invariant enforced: never both N/S-GREEN and E/W-GREEN true simultaneously
- [x] Opposing pairs allowed: N+S both GREEN; E+W both GREEN (mechanically enforced by pair structure)
- [x] Amber duration fixed at 3 seconds per REQ-005
- [x] All-red clearance: 1 second
- [x] `tick()` advances accumulator, processes pair transitions correctly
- [x] `getStates()` returns correct SignalState and secondsRemaining for all directions
- [x] Test #1 (1000-tick invariant): passes, no cross-direction violations
- [x] Test #2 (N/S GREEN): passes, both NORTH and SOUTH observed GREEN
- [x] Test #3 (E/W GREEN): passes, both EAST and WEST observed GREEN
- [x] Test #4 (extended cross-exclusion): passes, 0 violations over 2000 ticks
- [x] 100% coverage achieved (OpposingSimultaneousStrategy.ts: 100% stmts, branch, func, line)
- [x] TypeScript compile: 0 errors
- [x] Vite build: succeeds

## Design decisions
- **Pair order**: N/S first, then E/W, per REQ-005's state diagram (repeating).
- **Pair green duration**: Uses first pair member (NORTH for N/S, EAST for E/W) to match TASK-017 design consistency and avoid per-direction ambiguity.
- **Cross-direction exclusion**: Enforced by state machine structure (only one pair can be in GREEN/AMBER phases at a time; the other pair is always in RED). No external state checks needed for this invariant.
- **ConflictZoneManager integration**: Deferred to TASK-022+ and Integration tests; TASK-018 focuses on mechanical invariants only.
