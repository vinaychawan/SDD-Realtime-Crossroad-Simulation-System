---
task_id: TASK-021
title: "Signal Controller — Mode B acceptance test suite"
date: 2026-09-04
status: ✓ COMPLETE
---

# TASK-021 Implementation Evidence

## Linked Requirements
- TASK-021 (signal-controller-mode-b-acceptance-tests)
- specs/requirements/002-REQ-005-signal-coordination.md §Mode B acceptance criteria:
  - Opposing pairs allowed: N GREEN + S GREEN (simultaneously); E GREEN + W GREEN (simultaneously) allowed
  - Cross-direction exclusion: (N=GREEN or S=GREEN) AND (E=GREEN or W=GREEN) = FALSE always
  - Collision prevention active (REQ-NEW-COLLISION-PREVENTION-1): Deferred to TASK-067 Integration
  - Sampling: state snapshot over 1000 times (5-minute sampling with Mode B active); never both pairs TRUE
- Target: >=90% statement coverage for `OpposingSimultaneousStrategy`

## Acceptance Criteria Status

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Opposing pairs allowed: observe N+S both GREEN simultaneously | ✓ | Test: tick once (enter N/S GREEN phase), verify NORTH.state='GREEN' AND SOUTH.state='GREEN' AND EAST.state='RED' AND WEST.state='RED' |
| Opposing pairs allowed: observe E+W both GREEN simultaneously | ✓ | Test: advance 600 ticks (past N/S phases), verify EAST.state='GREEN' AND WEST.state='GREEN' AND NORTH.state='RED' AND SOUTH.state='RED' |
| Cross-direction exclusion: never (N GREEN or S GREEN) AND (E GREEN or W GREEN) true, sampled 1000 times | ✓ | Test: 1000 ticks, every tick checks `(nsGreen && ewGreen) === false`, 0 violations |
| Cross-direction exclusion: extended 5-minute sampling (3000 × 100ms samples) | ✓ | Test: 30000 ticks (300 seconds, ~25 full pair cycles), sampled every 100ms (10 ticks), 0 violations recorded |
| Coverage: >=90% statement coverage for OpposingSimultaneousStrategy | ✓ | Achieved **100%** statement, branch, function, and line coverage |

## Code Changes

### Test File: `Test_021-signal-controller-mode-b-acceptance-tests.test.ts` (105 lines, 6 tests)

**Test #1: Opposing pairs allowed — N+S GREEN**
```typescript
Strategy with 3-second green per pair, Mode B (OPPOSING_SIMULTANEOUS)
Tick once (enter first GREEN phase, which is N/S pair)
Expected: NORTH.state='GREEN', SOUTH.state='GREEN', EAST.state='RED', WEST.state='RED'
```

**Test #2: Opposing pairs allowed — E+W GREEN**
```typescript
Strategy with 2-second green per pair
Advance 600 ticks to reach E/W active phase (green 200 + amber 300 + all-red 100)
Expected: EAST.state='GREEN', WEST.state='GREEN', NORTH.state='RED', SOUTH.state='RED'
```

**Test #3: Cross-direction exclusion — 1000-tick invariant**
```typescript
Strategy with 2-second green per pair
For i in 0..999: tick(10 ms)
  nsGreen = (NORTH='GREEN' or SOUTH='GREEN')
  ewGreen = (EAST='GREEN' or WEST='GREEN')
  verify (nsGreen && ewGreen) === false
Expected: violations array empty (0 violations)
```

**Test #4: Cross-direction exclusion — 5-minute extended sampling**
```typescript
Strategy with 2-second green per pair
For i in 0..2999:  // 3000 iterations × 100ms = 300 seconds
  Tick 10 times (100ms advance)
  Sample the cross-exclusion invariant
  violations++ if both pairs GREEN
Expected: violations == 0 over 300 seconds
```
- Represents REQ-005's "sample state 1000 times over 5 min" by using finer sampling (3000 samples over 5 min ≈ every 100 ms)

**Test #5: RED directions report positive countdown**
```typescript
Strategy with 2-second green per pair
Tick once, verify all RED directions have secondsRemaining > 0
```

**Test #6: Pair cycle period — N/S and E/W repeat consistently**
```typescript
Strategy with 1-second green per pair
Run 8000 ticks (80 seconds, ~8 pair cycles)
Capture tick numbers when N/S pair and E/W pair enter GREEN state
Full cycle period = (green 100 + amber 300 + all-red 100) × 2 = 1000 ticks
Expected: 
  - nsGreenStartTicks[i] - nsGreenStartTicks[i-1] = 1000 ± 1 tick
  - ewGreenStartTicks[i] - ewGreenStartTicks[i-1] = 1000 ± 1 tick
  - Both patterns stable over 4+ cycles
```

## Build Evidence
- TypeScript: `npx tsc --noEmit` — **0 errors**
- Vite build: `npm run build` — **✓ built in 277ms**

## Test Results (TASK-021 only)

**File**: `Test_021-signal-controller-mode-b-acceptance-tests.test.ts` (6 tests, all passing)

| Test | Description | Duration | Result |
|------|-------------|----------|--------|
| Test #1 | N+S both GREEN observed | <1ms | ✓ PASS |
| Test #2 | E+W both GREEN observed | <1ms | ✓ PASS |
| Test #3 | Cross-exclusion invariant (1000 ticks) | ~68ms | ✓ PASS (0 violations) |
| Test #4 | Cross-exclusion over 5min sampling | ~84ms | ✓ PASS (0 violations over 3000 samples) |
| Test #5 | RED countdown positive | <1ms | ✓ PASS |
| Test #6 | Pair cycle period consistency | ~32ms | ✓ PASS (±1 tick tolerance) |

**Full suite context**: 110 tests total across all phases, all passing; 100% coverage achieved.

### Coverage verification
After completing all Signal Controller tests (TASK-016-021), coverage on `OpposingSimultaneousStrategy.ts`:
- Statement: **100%** (all lines executed)
- Branch: **100%** (all conditionals taken both ways)
- Function: **100%** (all methods called)
- Line: **100%** (all executable lines)

Target of >=90% achieved (100% exceeded).

## Verification Checklist
- [x] Test #1 (N+S GREEN): passes, both observed in same tick
- [x] Test #2 (E+W GREEN): passes, both observed in same tick (600 ticks later)
- [x] Test #3 (cross-exclusion 1000-tick): passes, 0 violations
- [x] Test #4 (cross-exclusion 5-min sampling): passes, 0 violations over 3000 samples
- [x] Test #5 (RED countdown): passes
- [x] Test #6 (pair cycle period): passes, ±1 tick tolerance for both pairs
- [x] >=90% coverage target met (100% achieved)
- [x] Build succeeds
- [x] All 6 tests passing

## Design notes
- **5-minute sampling interpretation**: REQ-005 states "sample state 1000 times over 5 min". Implemented as 3000 samples over 300 seconds (100 ms interval), providing finer-grained invariant verification than the minimum 1000 samples.
- **Period tolerance ±1**: Same rationale as TASK-020 — tick boundaries may not align perfectly with 1000-tick pair cycle boundaries.
- **Green duration choice**: Tests use 1–3 second durations. With 2-second green (200 ticks), full pair cycle = 1000 ticks = 10 seconds per cycle, so 80 seconds covers ~8 cycles (enough to measure period stability).
- **Pair cycle detection**: Transitions are detected via edge detection (`lastNsGreen`, `lastEwGreen` flags), only recording tick numbers when transitioning *into* GREEN, avoiding double-counts.
- **ConflictZoneManager integration**: Intentionally not tested here; deferred to TASK-022+ and TASK-067 Integration per TASK-018's design note.
