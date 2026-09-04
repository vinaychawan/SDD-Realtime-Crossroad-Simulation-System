# Vehicle Manager Module

## Purpose

Manages the lifecycle of vehicles in the simulation:
- **Spawn/Despawn**: Create regular vehicles at entry points, remove them when exiting
- **Serialized Ordering**: Ensure deterministic spawn behavior (MF-002) — simultaneous spawn requests across directions ordered N→S→E→W
- **Lane Selection**: Delegate to pluggable strategies (RANDOM or INTELLIGENT)
- **Vehicle Tracking**: Maintain active vehicle list for Physics Engine, Collision Detection, and Metrics

## Architecture

### Strategy Pattern (ADR-005)

Two mutually exclusive, startup-selected lane selection strategies:

```
ILaneSelectionStrategy
├── RandomLaneStrategy
│   ├── Assigns uniformly random lane (1-3) at spawn time
│   ├── No lane changes after initial assignment
│   └── Statistical acceptance: 27-37% distribution per lane
│
└── IntelligentLaneStrategy
    ├── Computes optimal lane from current lane + exit direction
    ├── Plans lane changes ≥50m before intersection
    ├── Speed constraint: ≤20 km/h during lane change
    └── Behavioral acceptance: ≥95% optimal-lane success
```

### Data Flow

```
Simulation Tick
    ↓
Vehicle Manager.tick()
    ├─→ Lane Selection Strategy.selectLane()
    │   └─→ Updates vehicle lane assignments
    ├─→ Physics Engine.tick()
    │   └─→ Moves vehicles based on lane assignments
    ├─→ Conflict Zone Manager.updateOccupancy()
    │   └─→ Checks entry decisions
    └─→ Active vehicles list updated
```

## Configuration

Via `SimulationConfig.vehicle`:
- `spawnRatePerMinute`: Per-direction spawn rate (default 30/min)
- `laneSelectionStrategy`: 'RANDOM' or 'INTELLIGENT' (startup-only field, ADR-005)

## Requirements Traceability

- **REQ-007**: Vehicle lane selection (strategy pattern, 3 lanes, turn support)
- **MF-002**: Spawn collision handling (serialized N→S→E→W priority)

## Integration Points

- **Physics Engine** (TASK-010-011): Receives `getActiveVehicles()` for kinematics
- **Conflict Zone Manager** (TASK-022-027): Uses `spawnVehicle()` entry decisions
- **Collision Detection** (TASK-033-037): Checks `getActiveVehicles()` for collision tests
- **Metrics Collector** (TASK-043-047): Counts and analyzes `getActiveVehicles()`
- **Emergency Vehicle Controller** (TASK-038-042): Adds emergency vehicles via custom spawn

## Files

- `vehicle-manager.interface.ts` — Public contracts
- `VehicleManager.ts` — Core implementation
- `RandomLaneStrategy.ts` — Strategy A (uniform random)
- `IntelligentLaneStrategy.ts` — Strategy B (optimal pre-positioning)
- `Test_028-*.test.ts` through `Test_032-*.test.ts` — Full test suite

## Known Limitations (By Design)

1. **No active lane changes mid-simulation**: Strategies are selected at startup and applied to all spawns. Existing vehicles are not affected by strategy changes.
2. **No multi-lane coordination**: Each vehicle independently optimizes its lane. Coordination (merging etiquette, etc.) handled in Collision Detection and Physics Engine.
3. **No history-based learning**: Lane selection decisions do not adapt based on past performance. Metrics are logged but not fed back to strategy.

## Future Enhancements

- Adaptive lane selection based on real-time congestion (TASK-048+)
- Multi-vehicle platooning support (out of 72-task scope)
- Dynamic strategy switching based on incident detection (out of scope)
