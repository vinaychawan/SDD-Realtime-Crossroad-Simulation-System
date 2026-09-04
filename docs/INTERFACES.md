---
title: Module Interfaces — Realtime Crossroad Simulation System
version: 0.2.0
date: 2026-09-04
status: PROPOSED
---

# Module Interfaces: Realtime Crossroad Simulation System

**Version**: 0.2.0
**Status**: 🟡 PROPOSED
**Companion Documents**: [ARCHITECTURE.md](ARCHITECTURE.md), [ADRs/](ADRs/)

All signatures are presented in TypeScript for precision. **No implementation logic is
included** — only contracts (types, preconditions, postconditions, error conditions).

---

## 1. Shared Domain Types

```typescript
type Direction = "NORTH" | "SOUTH" | "EAST" | "WEST";

type SignalState = "RED" | "GREEN" | "AMBER"; // MF-004: uppercase constants

type SignalCoordinationMode = "STRICT_MUTUAL_EXCLUSION" | "OPPOSING_SIMULTANEOUS"; // REQ-005

type LaneSelectionStrategyKind = "RANDOM" | "INTELLIGENT"; // REQ-007

type EmergencyVehicleType = "AMBULANCE" | "POLICE" | "FIRE_BRIGADE"; // REQ-NEW-E1

type VehicleId = string; // UUID

interface Vector2 { x: number; y: number; } // meters, intersection-center origin

interface VehicleState {
  id: VehicleId;
  direction: Direction;      // origin direction
  exitDirection: Direction;  // desired exit direction
  lane: 1 | 2 | 3;
  position: Vector2;
  speedKmh: number;          // display unit — NF-001
  speedMs: number;           // physics unit — NF-001
  isEmergency: boolean;
  emergencyType?: EmergencyVehicleType;
  yieldingActive: boolean;   // REQ-NEW-E4
}

interface SignalDirectionState {
  direction: Direction;
  state: SignalState;
  secondsRemaining: number;
}
```

---

## 2. Simulation Orchestrator

**Owning component**: Simulation Orchestrator ([ARCHITECTURE.md §3.2](ARCHITECTURE.md#32-component-responsibilities))
**Requirement**: REQ-020

```typescript
interface ISimulationOrchestrator {
  /** Starts the fixed-timestep loop. No-op if already running. */
  start(): void;

  /** Pauses physics ticks; rendering continues showing last state. */
  pause(): void;

  /** Stops and clears all simulation state (vehicles, signals reset). */
  reset(): void;

  /**
   * Changes target render frame rate.
   * @param fps 30 or 60 only.
   * @throws {InvalidConfigurationError} if fps is not 30 or 60.
   * @postcondition Physics tick rate remains 100 Hz ± 2 Hz regardless of fps.
   */
  setTargetFrameRate(fps: 30 | 60): void;

  /** @returns current measured physics tick rate (Hz), for REQ-028 Performance panel. */
  getPhysicsTickRate(): number;

  /** @returns current measured render frame rate (FPS), for REQ-028 Performance panel. */
  getRenderFrameRate(): number;
}
```

**Contract notes**:
- Precondition for `start()`: a valid `SimulationConfig` must already be set via `IConfigurationManager`.
- Postcondition: physics ticks are never skipped; if the orchestrator falls behind, it
  executes catch-up ticks (max 5 per frame) rather than dropping ticks (REQ-020 "no physics skip").

---

## 3. Configuration Manager

**Owning component**: Configuration Manager
**Requirements**: REQ-027, MF-005, MF-006, NF-003

```typescript
interface SimulationConfig {
  scenarioPreset: "NORMAL_TRAFFIC" | "CONGESTION_TEST" | "SPARSE_TRAFFIC" | "PRIORITY_OPERATIONS" | "CUSTOM";
  targetFrameRate: 30 | 60;                              // runtime-modifiable
  signalCoordinationMode: SignalCoordinationMode;         // startup-only
  laneSelectionStrategy: LaneSelectionStrategyKind;       // startup-only
  perDirection: Record<Direction, {
    spawnRatePerMinute: number;   // 0–60
    greenDurationSec: number;     // 10–60
    redDurationSec: number;       // 10–60
  }>;
  emergency: {
    enabled: boolean;
    spawnRatePerMinute: Record<EmergencyVehicleType, number>; // 0–20 each, MF-006 Option A
  };
  conflictZone: {
    sizeMeters: number;      // 20–50, default 25
    maxWaitSeconds: number;  // 2–10, default 5
    stopLineDistanceMeters: number; // 10–50, default 20
  };
  simulationSpeedMultiplier: 1 | 2 | 4;
}

interface IConfigurationManager {
  /**
   * Applies a scenario preset, fully populating SimulationConfig per MF-005's exhaustive table.
   * @postcondition All fields in SimulationConfig are set to defined, non-ambiguous values.
   */
  applyScenarioPreset(preset: SimulationConfig["scenarioPreset"]): void;

  /**
   * Updates one or more configuration fields.
   * @throws {InvalidConfigurationError} if any value is out of range (see field ranges above).
   * @throws {StartupOnlyFieldError} if attempting to change signalCoordinationMode or
   *         laneSelectionStrategy while the orchestrator is RUNNING or PAUSED.
   */
  update(partial: Partial<SimulationConfig>): void;

  /** @returns a read-only snapshot of the current configuration, for REQ-028 Configuration panel. */
  getSnapshot(): Readonly<SimulationConfig>;

  /** Emits on every successful `update()` or `applyScenarioPreset()` call. */
  onChange(listener: (config: Readonly<SimulationConfig>) => void): void;
}
```

**Error conditions**:

| Error | Raised When | Recovery |
| --- | --- | --- |
| `InvalidConfigurationError` | Any numeric field outside documented range | Reject; retain last valid value (per REQ-027 failure table) |
| `StartupOnlyFieldError` | `signalCoordinationMode` or `laneSelectionStrategy` changed after `start()` | Reject; log to Telemetry; UI shows field as locked |

---

## 4. Signal Controller

**Owning component**: Signal Controller
**Requirements**: REQ-005, REQ-NEW-COLLISION-PREVENTION-1 (dependency)

```typescript
/** Strategy interface — one implementation per coordination mode (ADR-003). */
interface ISignalCoordinationStrategy {
  readonly mode: SignalCoordinationMode;

  /** Advances the per-direction state machine by one physics tick (10 ms). */
  tick(deltaMs: number): void;

  /** @returns current state for all four directions. */
  getStates(): Record<Direction, SignalDirectionState>;

  /**
   * Invariant that must hold after every tick():
   * - STRICT_MUTUAL_EXCLUSION: at most one direction is GREEN.
   * - OPPOSING_SIMULTANEOUS: (N=GREEN or S=GREEN) AND (E=GREEN or W=GREEN) is never true.
   */
}

interface ISignalController {
  /** Selects and locks in a coordination strategy. Startup-only (see StartupOnlyFieldError). */
  initialize(mode: SignalCoordinationMode, perDirectionTiming: SimulationConfig["perDirection"]): void;

  tick(deltaMs: number): void;

  getStates(): Record<Direction, SignalDirectionState>;

  /** Emits whenever any direction's SignalState changes, for Telemetry/State Display. */
  onStateChange(listener: (states: Record<Direction, SignalDirectionState>) => void): void;
}
```

---

## 5. Conflict Zone Manager

**Owning component**: Conflict Zone Manager
**Requirements**: REQ-NEW-COLLISION-PREVENTION-1, BF-003

```typescript
type DeadlockRecoveryProcedure = "CONSERVATIVE"; // BF-003 recommended option; see ADR-004

interface EntryDecision {
  vehicleId: VehicleId;
  decision: "PROCEED" | "STOP";
  stopLinePosition?: Vector2;
}

interface IConflictZoneManager {
  /** Called every physics tick for each vehicle within lookahead range (50 m) of the zone. */
  requestEntry(vehicle: VehicleState): EntryDecision;

  /** Called every physics tick to update occupancy as vehicles move through the zone. */
  updateOccupancy(vehicles: VehicleState[]): void;

  /** @returns vehicles currently occupying the conflict zone. */
  getOccupants(): VehicleState[];

  /**
   * @returns vehicles that have been waiting at the stop line longer than
   * `maxWaitSeconds` (default 5s), flagged for deadlock recovery.
   */
  getDeadlockedVehicles(): VehicleState[];

  /**
   * Applies the deadlock recovery procedure to a deadlocked vehicle:
   * CONSERVATIVE = forced exit at 50% speed with collision detection still active;
   * if a collision becomes imminent during recovery, the vehicle re-stops.
   * @postcondition vehicle either exits the zone or re-enters STOP state; never removed silently.
   * @emits DeadlockEvent to Telemetry.
   */
  applyDeadlockRecovery(vehicleId: VehicleId, procedure: DeadlockRecoveryProcedure): void;
}
```

**State machine** (per BF-003 conservative resolution):

```
ZONE_EMPTY → OCCUPIED(direction) → [opposing vehicle requests entry] → OPPOSING_BLOCKED
OPPOSING_BLOCKED → (zone clears within maxWaitSeconds) → OCCUPIED(new direction)
OPPOSING_BLOCKED → (wait > maxWaitSeconds) → DEADLOCK_FLAGGED → CONSERVATIVE_RECOVERY (50% speed, collision-checked) → ZONE_EMPTY | OCCUPIED
```

---

## 6. Vehicle Manager & Lane Selection Strategy

**Owning components**: Vehicle Manager, Lane Selection Strategy
**Requirements**: REQ-007, MF-002

```typescript
interface ILaneSelectionStrategy {
  readonly kind: LaneSelectionStrategyKind;

  /**
   * Called once at spawn time (RANDOM) or continuously until stabilized (INTELLIGENT).
   * @returns target lane (1–3); for INTELLIGENT, may issue lane-change commands over
   * several ticks rather than an instantaneous change.
   */
  selectLane(vehicle: VehicleState, trafficState: VehicleState[]): 1 | 2 | 3;
}

interface IVehicleManager {
  /**
   * Spawns a regular vehicle at the given direction's entry point.
   * @throws {SpawnCapacityExceededError} if the entry queue is full (MF-002 serialized spawning).
   */
  spawnVehicle(direction: Direction, exitDirection: Direction): VehicleId;

  /** Removes a vehicle once it exits the simulation boundary. */
  despawnVehicle(id: VehicleId): void;

  /** @returns all active vehicles (regular + emergency), for Physics Engine and Metrics. */
  getActiveVehicles(): VehicleState[];
}
```

**MF-002 spawn collision handling contract**: when two spawn events are due in the same
physics tick (regular or emergency, same or different entry direction), `spawnVehicle` calls
are serialized in a deterministic queue order (direction priority: N, S, E, W) within that
tick; no two vehicles are ever created at the exact same position.

---

## 7. Emergency Vehicle Controller

**Owning component**: Emergency Vehicle Controller
**Requirements**: REQ-NEW-E1 through REQ-NEW-E5

```typescript
interface IEmergencyVehicleController {
  /**
   * Advances the Poisson spawn process for all three types by one tick.
   * Spawn rate source: `SimulationConfig.emergency.spawnRatePerMinute`.
   * @emits EmergencyVehicleSpawned when a spawn occurs.
   */
  tick(deltaMs: number): void;

  /**
   * Signal-override decision for an emergency vehicle approaching a RED signal.
   * @returns "PROCEED" always, unless the intersection is occupied, in which case
   *          the caller (Physics Engine) applies `emergencySlowdownFactor` (default 0.8).
   */
  evaluateSignalOverride(vehicle: VehicleState, signalState: SignalState, intersectionOccupied: boolean): "PROCEED";

  /**
   * @returns regular vehicles within `emergencyDetectionRange` (default 50 m) of any
   * active emergency vehicle, with computed target speed (linear interpolation,
   * 100% at 50 m to 50% at 0 m) per REQ-NEW-E4.
   */
  computeYieldingEffects(vehicles: VehicleState[]): Map<VehicleId, { targetSpeedFactor: number; laneChangeDirection: "LEFT" | "RIGHT" | "NONE" }>;
}
```

---

## 8. Collision Detection System

**Owning component**: Collision Detection System
**Requirements**: 001-scope (collision detection), REQ-NEW-COLLISION-PREVENTION-1

```typescript
interface CollisionEvent {
  vehicleIds: [VehicleId, VehicleId] | [VehicleId, "INFRASTRUCTURE"];
  position: Vector2;
  timestampMs: number;
}

interface ICollisionDetectionSystem {
  /** Broad-phase (spatial grid) + narrow-phase (AABB) check, run every physics tick. */
  tick(vehicles: VehicleState[]): CollisionEvent[];

  onCollision(listener: (event: CollisionEvent) => void): void;
}
```

---

## 9. Metrics Collector

**Owning component**: Metrics Collector
**Requirements**: REQ-028, MF-001

```typescript
interface MetricsSnapshot {
  vehicleCountRegular: number;
  vehicleCountEmergency: number;
  averageSpeedKmh: number;         // 0 if no vehicles (MF-001)
  throughputPerMinute: number;     // rolling 60s window (MF-001)
  totalCollisions: number;
  activeCollisions: number;
  collisionFreeRatioPercent: number; // time-based ratio (MF-001)
  deadlockCount: number;
  renderFps: number;
  physicsHz: number;
  memoryMb: number;
  cpuPercent: number;
}

interface IMetricsCollector {
  /** Recomputes the snapshot; called at 10 Hz (independent of 100 Hz physics). */
  tick(): void;

  getSnapshot(): Readonly<MetricsSnapshot>;
}
```

**MF-001 formula contracts** (must be implemented exactly as specified in
[MF-001](../specs/major/MF-001-precision-metric-calculations.md)):
- `averageSpeedKmh` = `sum(vehicle.speedKmh) / vehicleCount`, or `0` when `vehicleCount === 0`.
- `throughputPerMinute` = count of despawn (exit) events in the trailing 60 s, extrapolated
  to a per-minute rate.
- `collisionFreeRatioPercent` = `(simulationDurationMs − totalCollisionTimeMs) / simulationDurationMs × 100`.

---

## 10. Rendering Engine & UI Controller

**Owning components**: Rendering Engine, UI Controller
**Requirements**: REQ-020, REQ-027, REQ-NEW-E2, REQ-028

```typescript
interface IRenderer {
  /** Draws one frame from the latest interpolated physics snapshot. Never mutates state. */
  renderFrame(vehicles: VehicleState[], signals: Record<Direction, SignalDirectionState>, conflictZoneOccupants: VehicleId[]): void;
}

interface IUIController {
  /** Wires scenario dropdown, radio buttons, sliders, and playback buttons to IConfigurationManager. */
  bind(configManager: IConfigurationManager, orchestrator: ISimulationOrchestrator): void;

  /**
   * Enables/disables controls based on orchestrator run state, per REQ-027 §"UI State Machine":
   * CONFIGURATION_ACTIVE → all editable; RUNNING → mode/strategy locked; PAUSED → all editable.
   */
  setRunState(state: "CONFIGURATION_ACTIVE" | "RUNNING" | "PAUSED"): void;
}
```

---

## 11. Error Taxonomy (Cross-Cutting)

| Error | Thrown By | Meaning |
| --- | --- | --- |
| `InvalidConfigurationError` | Configuration Manager | Parameter outside documented range |
| `StartupOnlyFieldError` | Configuration Manager | Attempt to change a startup-only field at runtime |
| `SpawnCapacityExceededError` | Vehicle Manager | Entry queue full; caller should retry next tick (per REQ-NEW-E1 failure table) |
| `DeadlockEvent` (not an exception — a telemetry event) | Conflict Zone Manager | Vehicle exceeded `maxWaitSeconds`; recovery procedure applied |

All errors are synchronous exceptions (no promises/async in the 100 Hz physics path) to
keep tick timing deterministic.

---

## 12. Sign-Off

| Role | Status |
| --- | --- |
| Requirements Engineer | ⏳ PENDING |
| System Architect | ⏳ PENDING |
| QA Lead | ⏳ PENDING |
