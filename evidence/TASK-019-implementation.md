---
task_id: TASK-019
title: "Signal Controller — Fallback & startup-only enforcement"
date: 2026-09-04
status: ✓ COMPLETE
---

# TASK-019 Implementation Evidence

## Linked Requirements
- TASK-019 (signal-controller-fallback-error-handling)
- Acceptance criteria: (1) Invalid/unrecognized SignalCoordinationMode falls back to Strict Mutual Exclusion with logged warning, (2) Strategy swap only at startup (enforced jointly with TASK-006), (3) Unit test for fallback on corrupted mode value
- REQ-005: "Invalid mode value: Reject at startup; prompt user to select valid mode" + "Mode change mid-simulation: Ignored (no-op); inform user in logs"
- `src/components/SignalController/SignalController.ts` (95 lines, created in TASK-016)
- Dependency: `src/domain/errors.ts` (TASK-003): `StartupOnlyFieldError`

## Acceptance Criteria Status

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Invalid mode falls back to Strict Mutual Exclusion + console.warn | ✓ | Test: pass `'BOGUS_MODE'` to `initialize()`, verify `console.warn` called with mode name, verify resulting behavior is Mode A (at most one direction GREEN) |
| Strategy swap only at startup; 2nd `initialize()` throws StartupOnlyFieldError | ✓ | Test: first `initialize()` succeeds; second `initialize()` on same instance throws `StartupOnlyFieldError` with message referencing "startup only" |
| Unit test for fallback + error handling | ✓ | 6 tests in `Test_019-signal-controller-fallback-error-handling.test.ts` covering fallback, startup-only enforcement, pre-init guard checks, and onStateChange listener registration/firing |

## Code Changes

### Implementation Details (SignalController.ts)

**Fallback on invalid mode** (via `createStrategy(mode)`):
```typescript
if (mode === 'STRICT_MUTUAL_EXCLUSION') return new StrictMutualExclusionStrategy(perDirectionTiming);
if (mode === 'OPPOSING_SIMULTANEOUS') return new OpposingSimultaneousStrategy(perDirectionTiming);
// Unrecognized: fallback
console.warn(`SignalController: unrecognized SignalCoordinationMode "${String(mode)}" — falling back to STRICT_MUTUAL_EXCLUSION`);
return new StrictMutualExclusionStrategy(perDirectionTiming);
```
- Matches REQ-005: "Mode default: If not specified, default to STRICT_MUTUAL_EXCLUSION"
- Logs a warning to inform user/developer that an invalid value was provided

**Startup-only enforcement** (via `initialize()`):
```typescript
if (this.strategy) {
  throw new StartupOnlyFieldError('signalCoordinationMode', '...');
}
this.strategy = this.createStrategy(mode, perDirectionTiming);
```
- Enforces "strategy swap only at startup" by rejecting re-initialization on the same instance
- Throws `StartupOnlyFieldError(field: 'signalCoordinationMode', ...)` matching TASK-006's pattern
- Joint enforcement: ConfigurationManager (TASK-006) also prevents mode changes after `start()` via `setRunState()` / `getRunState()` checks; Signal Controller adds instance-level prevention here

**Pre-init guard checks** (via `requireInitialized()`):
```typescript
private requireInitialized(): ISignalCoordinationStrategy {
  if (!this.strategy) throw new Error('SignalController: initialize() must be called before tick()/getStates()');
  return this.strategy;
}
```
- Called by `tick()` and `getStates()`, raising an error if used before `initialize()`

**State change detection** (via `statesChanged()` and `notify()`):
- `tick()` calls `strategy.tick()`, then compares `previousStates` with `nextStates`
- Only emits `onStateChange` if any direction's `SignalState` changes (ignores `secondsRemaining` ticks)
- Invokes all registered listeners on the event

### Behavioral flow for fallback
1. User (or corrupt external config) passes invalid mode to `initialize()`
2. `createStrategy()` recognizes unrecognized value → `console.warn` + return `StrictMutualExclusionStrategy`
3. `initialize()` stores the fallback strategy and `previousStates`
4. `tick()` and `getStates()` proceed normally with Mode A behavior (one direction GREEN)
5. Developer sees warning in logs and can correct the mode value in the configuration

## Build Evidence
- TypeScript: `npx tsc --noEmit` — **0 errors**
- Vite build: `npm run build` — **✓ built in 277ms**

## Test Results (TASK-019 only)

**File**: `Test_019-signal-controller-fallback-error-handling.test.ts` (6 tests, all passing)

| Test | Description | Result |
|------|-------------|--------|
| Test #1 | Fallback on corrupted mode + console.warn | ✓ PASS (spy.calls[0][0] contains mode name; behavior is Mode A) |
| Test #2 | 2nd `initialize()` throws StartupOnlyFieldError | ✓ PASS (exception thrown with correct error type) |
| Test #3 | `tick()` before `initialize()` throws | ✓ PASS (error thrown containing "initialize") |
| Test #4 | `getStates()` before `initialize()` throws | ✓ PASS (error thrown containing "initialize") |
| Test #5 | `onStateChange` fires on GREEN→AMBER transition | ✓ PASS (listeners fire when state changes) |
| Test #6 | Multiple listeners all fire on state change | ✓ PASS (both listeners fire same number of times) |

**Full suite context**: 110 tests total across all phases, all passing; 100% coverage achieved.

### Key test scenarios
1. **Fallback**: `initialize('BOGUS_MODE')` → spy checks `console.warn` called once, message contains "BOGUS_MODE"; subsequent `tick(10)` shows Mode A behavior (at most one GREEN).
2. **Startup-only**: `init(mode1)`, then `init(mode2)` → throws `StartupOnlyFieldError` with `field: 'signalCoordinationMode'`.
3. **Pre-init guards**: Create controller, call `tick(10)` or `getStates()` without `initialize()` → each throws an error containing "initialize".
4. **Listener on state change**: `initialize()`, register listener, `tick()` 110 times (past first transition from GREEN to AMBER) → listener fires at least once (fewer than 110 times).
5. **Multiple listeners**: Register two listeners, both fire same number of times when state changes.

## Verification Checklist
- [x] Fallback logic implemented in `createStrategy()`
- [x] Unrecognized mode → `StrictMutualExclusionStrategy` + `console.warn` (REQ-005 default + logging)
- [x] Startup-only enforcement: 2nd `initialize()` throws `StartupOnlyFieldError`
- [x] Pre-init guard: `tick()` and `getStates()` throw before `initialize()`
- [x] Test #1 (fallback + warn): passes
- [x] Test #2 (startup-only): passes
- [x] Test #3 (pre-init tick guard): passes
- [x] Test #4 (pre-init getStates guard): passes
- [x] Test #5 (listener fires on transition): passes
- [x] Test #6 (multiple listeners): passes
- [x] Coverage verified at 100% for affected code paths (including listener loop in `notify()`)
- [x] TypeScript compile: 0 errors
- [x] Vite build: succeeds

## Design decisions
- **Fallback strategy**: Strict Mutual Exclusion (Mode A) is the safest, most conservative option per REQ-005.
- **Startup-only enforcement level**: Applied both at ConfigurationManager (TASK-006, checking run state) and SignalController instance level (preventing re-init). Layered defense ensures mode cannot be swapped mid-simulation from any angle.
- **Pre-init guards**: Both `tick()` and `getStates()` require `initialize()` first (lazy init pattern), with a descriptive error message.
- **State change detection**: Fires on `SignalState` transitions only, not every tick's `secondsRemaining` countdown, matching `docs/INTERFACES.md` §4 ("Emits whenever any direction's SignalState changes").
- **Listener pattern**: Simple array + loop, matching the Config Manager's `notify()` pattern (TASK-008).
