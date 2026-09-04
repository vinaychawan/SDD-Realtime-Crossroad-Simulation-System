# Conflict Zone Manager

Implements `IConflictZoneManager` (docs/INTERFACES.md §5) per REQ-NEW-COLLISION-PREVENTION-1 and ADR-004. Manages the intersection's conflict zone (default 25m × 25m centered at origin), preventing simultaneous occupancy by opposing-direction vehicles when Mode B (Opposing Simultaneous) signals are active.

## Purpose

When Signal Controller's Mode B allows NORTH+SOUTH or EAST+WEST to both be GREEN simultaneously, vehicles from opposite directions could collide in the intersection center. The Conflict Zone Manager:

1. **Tracks occupancy**: Which vehicles are currently in the 25m × 25m conflict zone
2. **Controls entry**: Decides PROCEED or STOP for each approaching vehicle (50m lookahead)
3. **Detects deadlock**: Flags vehicles waiting >5 seconds at the stop line
4. **Applies recovery**: Conservative 50% speed forced exit with collision detection active (ADR-004 Option A)

## Files

- `conflict-zone-manager.interface.ts` — `IConflictZoneManager`, `EntryDecision`, `DeadlockRecoveryProcedure` (TASK-022)
- `ConflictZoneManager.ts` — concrete implementation (TASK-022-026)
- `README.md` — this file

## Configuration

Zone dimensions are configurable via `SimulationConfig.conflictZone`:
- `sizeMeters`: 20–50m (default 25m)
- `maxWaitSeconds`: 2–10s (default 5s)
- `stopLineDistanceMeters`: 10–50m (default 20m before intersection center)

## Design Decisions

### Conflict Zone Geometry (TASK-022)
- **Shape**: Rectangle (not circle) for simpler ray-casting and boundary checks
- **Center**: Intersection origin (0, 0)
- **Bounds**: `[-sizeMeters/2, +sizeMeters/2]` on both X and Y axes

### Entry Decision Logic (TASK-024)
- **Lookahead**: 50m from zone boundary
- **Opposing-direction check**: NORTH opposes SOUTH; EAST opposes WEST
- **STOP condition**: Opposing vehicle currently occupies zone
- **PROCEED condition**: Zone empty OR only same/perpendicular-direction vehicles present

### Deadlock Detection (TASK-025)
- **Per-vehicle timer**: Each vehicle independently tracks its own wait time (not system-wide)
- **5-second threshold**: Per REQ-NEW-COLLISION-PREVENTION-1
- **Reset on clear**: Timer resets if blocking condition clears before 5s

### Recovery Procedure (TASK-026, ADR-004)
- **Conservative approach**: 50% speed forced exit (Option A, safety-first)
- **Collision detection active**: Vehicle re-stops if collision becomes imminent during recovery
- **Never silent removal**: Vehicle either exits successfully or re-enters STOP state; never deleted from simulation
- **Telemetry event**: Emits `DeadlockEvent` for metrics tracking

## State Machine (per BF-003)

```
ZONE_EMPTY
  ↓ (vehicle enters)
OCCUPIED(direction)
  ↓ (opposing vehicle requests entry)
OPPOSING_BLOCKED
  ├─ (zone clears within 5s) → OCCUPIED(new direction)
  └─ (wait > 5s) → DEADLOCK_FLAGGED
       ↓
     CONSERVATIVE_RECOVERY (50% speed, collision-checked)
       ├─ (exits successfully) → ZONE_EMPTY
       └─ (collision imminent) → OPPOSING_BLOCKED (re-stop)
```

## Integration Points

- **Signal Controller (Mode B)**: Opposing Simultaneous signals create the need for this component
- **Vehicle Manager**: Calls `requestEntry()` for each vehicle within 50m of zone, respects STOP decisions
- **Collision Detection**: Reused during recovery to detect imminent collisions
- **Telemetry/Metrics**: Receives `DeadlockEvent` when recovery is triggered

## Not Yet Implemented (deferred to later tasks)

- Full Vehicle Manager integration (Vehicle Manager is TASK-028-036, not yet built)
- Telemetry event emission (Metrics Collector is TASK-057-061)
- UI visualization of conflict zone boundaries (Rendering Engine is TASK-044-047)
