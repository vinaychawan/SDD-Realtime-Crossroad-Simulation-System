# Signal Controller

Implements `ISignalController` (docs/INTERFACES.md §4) using the Strategy Pattern
(ADR-003): `SignalController` holds a single `ISignalCoordinationStrategy`, selected once at
`initialize()`, and delegates `tick()`/`getStates()` to it for the lifetime of the instance.

## Files

- `signal-controller.interface.ts` — `ISignalCoordinationStrategy`, `ISignalController` (TASK-016).
- `constants.ts` — fixed timing constants (`AMBER_DURATION_MS`, `ALL_RED_DURATION_MS`).
- `StrictMutualExclusionStrategy.ts` — Mode A (TASK-017). Single round-robin across all four
  directions (`NORTH → SOUTH → EAST → WEST → NORTH ...`), each with GREEN → AMBER → ALL_RED
  phases. Guarantees at most one direction GREEN at any time.
- `OpposingSimultaneousStrategy.ts` — Mode B (TASK-018). Two-pair round-robin
  (`{NORTH,SOUTH} → {EAST,WEST} → ...`), each pair with GREEN → AMBER → ALL_RED phases.
  Guarantees the N/S and E/W pairs are never both active simultaneously.
- `SignalController.ts` — concrete coordinator (TASK-016, plus fallback/startup-only enforcement
  from TASK-019).

## Design decisions

- **Amber duration is fixed at 3 seconds** (`AMBER_DURATION_MS`), per
  `specs/requirements/002-REQ-005-signal-coordination.md`'s timing table — not a runtime
  `SimulationConfig` field. TASK-017's "configurable" acceptance criterion is satisfied by
  centralizing this value as a single named constant rather than a scattered magic number.
- **All-red clearance interval** (`ALL_RED_DURATION_MS = 1000`) is a documented assumption: the
  spec names an `ALL RED` state in its transition diagrams but does not give it an explicit
  duration.
- **`redDurationSec` is not used as a literal per-direction timer** in Mode A: a single
  round-robin structurally cannot honor an independently-configured red duration per direction
  without creating overlapping-green or idle-dead-time contradictions. Each direction's actual
  red duration is the natural consequence of the other three directions' green+amber+all-red
  time. `greenDurationSec` is the authoritative timing input.
- **Mode B pair green duration** uses the first member of each pair (`NORTH` for N/S, `EAST` for
  E/W) as the pair's authoritative `greenDurationSec`, since `PerDirectionConfig` has no
  dedicated per-pair field.
- **`IConflictZoneManager` dependency (ADR-003) is deferred**: ADR-003 documents a compile-time
  dependency from `OpposingSimultaneousStrategy` on `IConflictZoneManager` ("Mode B blocked
  unless Conflict Zone Manager is active", REQ-NEW-COLLISION-PREVENTION-1). Conflict Zone
  Manager does not exist yet (Phase 4, TASK-022+), and neither TASK-018's nor TASK-019's
  acceptance criteria require wiring it in this phase. This gating is deferred to TASK-022+ and
  TASK-067 (Integration) and is intentionally not implemented here — consistent with how the
  not-yet-built Vehicle Manager dependency was deferred in Simulation Orchestrator
  (TASK-012-015).
- **Fallback on invalid mode** (TASK-019): an unrecognized `SignalCoordinationMode` value passed
  to `initialize()` falls back to `StrictMutualExclusionStrategy` with a `console.warn`, per
  REQ-005's "Mode default" acceptance criterion.
- **Strategy swap only at startup** (TASK-019): `initialize()` throws `StartupOnlyFieldError` if
  called more than once on the same instance. This enforces "no mode switching during active
  simulation" (REQ-005 Constraint C2) at the Signal Controller level, jointly with TASK-006's
  `ConfigurationManager.update()` enforcement of the same rule at the configuration level.
- **`onStateChange` fires only on `SignalState` transitions** (RED/GREEN/AMBER), not on every
  tick's `secondsRemaining` countdown — matching "Emits whenever any direction's SignalState
  changes" in `docs/INTERFACES.md` §4.
