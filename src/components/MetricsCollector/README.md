# Metrics Collector

**Purpose**: Compute real-time simulation metrics with precise formulas per MF-001  
**Specification**: [ADR-008](../../docs/ADRs/ADR-008-metrics-collector.md), [INTERFACES.md §9](../../docs/INTERFACES.md#9-metrics-collector)  
**Requirements**: REQ-028, MF-001

---

## Overview

The **Metrics Collector** computes a `MetricsSnapshot` at a fixed **10 Hz cadence** (independent of 100 Hz physics and 30/60 FPS render rate). It implements three critical formulas from [MF-001](../../specs/major/MF-001-precision-metric-calculations.md):

| Metric | Formula | Edge Case |
| --- | --- | --- |
| **Average Speed** | `sum(speedKmh) / count` | Returns `0` when `count === 0` |
| **Throughput** | Count of despawn events in trailing 60s | Rolling window evicts old events |
| **Collision-Free Ratio** | `(simTimeMs - collisionTimeMs) / simTimeMs × 100` | Time-based, not per-vehicle |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Metrics Collector                        │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │          MetricsSnapshot (10 Hz Update)               │ │
│  ├───────────────────────────────────────────────────────┤ │
│  │ • Vehicle Counts (regular/emergency)                  │ │
│  │ • Average Speed (MF-001 formula)                      │ │
│  │ • Throughput (rolling 60s window)                     │ │
│  │ • Collision Statistics (total/active/ratio)           │ │
│  │ • Deadlock Count                                      │ │
│  │ • Performance Metrics (FPS, Hz, memory, CPU)          │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  Data Sources:                                              │
│  • VehiclesProvider() → vehicle states                     │
│  • recordDespawn() → throughput events                     │
│  • recordCollision() / resolveCollision() → collision time │
│  • recordDeadlock() → deadlock count                       │
│  • RenderFpsProvider() / PhysicsHzProvider() → perf data   │
└─────────────────────────────────────────────────────────────┘
```

---

## Usage

### Initialization

```typescript
import { MetricsCollector } from './components/MetricsCollector';
import { VehicleManager } from './components/VehicleManager';

const vehicleManager = new VehicleManager(config);
const metricsCollector = new MetricsCollector();

// Wire data providers
metricsCollector.setVehiclesProvider(() => vehicleManager.getAllVehicles());
metricsCollector.setRenderFpsProvider(() => renderEngine.getCurrentFps());
metricsCollector.setPhysicsHzProvider(() => orchestrator.getPhysicsHz());
```

### Orchestrator Integration (10 Hz)

```typescript
// In SimulationOrchestrator.tick()
const METRICS_UPDATE_INTERVAL_MS = 100; // 10 Hz
let lastMetricsUpdateMs = 0;

function tick(currentTimeMs: number) {
  metricsCollector.updateTime(currentTimeMs);
  
  // Update metrics at 10 Hz
  if (currentTimeMs - lastMetricsUpdateMs >= METRICS_UPDATE_INTERVAL_MS) {
    metricsCollector.tick();
    lastMetricsUpdateMs = currentTimeMs;
  }
}
```

### Recording Events

```typescript
// On vehicle exit
vehicleManager.onDespawn((vehicleId, timestampMs) => {
  metricsCollector.recordDespawn(timestampMs);
});

// On collision detection
collisionSystem.onCollision((event) => {
  metricsCollector.recordCollision(event);
});

// On collision resolved (vehicles separated)
collisionSystem.onCollisionResolved((event) => {
  metricsCollector.resolveCollision(event);
});

// On deadlock
conflictZoneManager.onDeadlock(() => {
  metricsCollector.recordDeadlock();
});
```

### Reading Snapshot

```typescript
// State Display reads at 10 Hz
const snapshot = metricsCollector.getSnapshot();

console.log(`Vehicles: ${snapshot.vehicleCountRegular} regular, ${snapshot.vehicleCountEmergency} emergency`);
console.log(`Average Speed: ${snapshot.averageSpeedKmh.toFixed(1)} km/h`);
console.log(`Throughput: ${snapshot.throughputPerMinute} veh/min`);
console.log(`Collision-Free Ratio: ${snapshot.collisionFreeRatioPercent.toFixed(1)}%`);
console.log(`Active Collisions: ${snapshot.activeCollisions} / ${snapshot.totalCollisions}`);
```

---

## MF-001 Formula Details

### Formula 1: Average Speed

```typescript
averageSpeedKmh = vehicles.length === 0 
  ? 0 
  : vehicles.reduce((sum, v) => sum + v.speedKmh, 0) / vehicles.length;
```

**Edge Cases**:
- No vehicles → `0 km/h` (not `NaN` or undefined)
- All stopped → `0 km/h`
- Mixed regular + emergency → both counted equally

### Formula 2: Throughput (Rolling 60s)

```typescript
// Record despawn events
despawnEvents.push({ timestampMs });

// At each tick, evict old events
const windowStartMs = currentTimeMs - 60_000;
despawnEvents = despawnEvents.filter(e => e.timestampMs > windowStartMs);

// Count = number of vehicles exited in last 60s
throughputPerMinute = despawnEvents.length;
```

**Edge Cases**:
- First 60s → partial window (e.g., 10 exits in 30s = 10 veh/min displayed)
- No exits → `0 veh/min`
- High throughput → array grows/shrinks with rolling window

### Formula 3: Collision-Free Ratio (Time-Based)

```typescript
// Track collision durations
collisionDurations.set(key, { startMs, endMs: null }); // collision starts
collisionDurations.get(key).endMs = currentMs;         // collision ends

// Sum all durations
totalCollisionTimeMs = sum of (endMs - startMs) for all collisions
                     + sum of (currentMs - startMs) for active collisions

// Calculate ratio
collisionFreeRatioPercent = 
  ((currentTimeMs - startMs) - totalCollisionTimeMs) / (currentTimeMs - startMs) × 100;
```

**Edge Cases**:
- No collisions → `100%`
- Continuous collision → `0%`
- Simulation start (t=0) → `100%` (no duration yet)

---

## Testing Strategy

### TASK-043: Module Structure ✅
- Interface contract matches INTERFACES.md §9
- Empty snapshot initializes to safe defaults

### TASK-044: Average Speed ✅
- Zero vehicles → `0 km/h`
- Single vehicle → exact speed
- Multiple vehicles → correct average
- Mixed stopped/moving → includes zeros

### TASK-045: Throughput Window ✅
- Events recorded correctly
- Rolling window evicts old events
- Partial window (t < 60s) returns partial count
- Multiple exits per second handled

### TASK-046: Collision-Free Ratio ✅
- No collisions → `100%`
- Active collision → time accumulates
- Resolved collision → fixed duration
- Multiple overlapping collisions → correct sum

### TASK-047: Full Suite ✅
- All MF-001 formulas validated
- Integration with providers
- Reset behavior correct
- ≥90% coverage

---

## Dependencies

**Inputs**:
- `VehicleState[]` from Vehicle Manager
- `CollisionEvent` from Collision Detection System
- Deadlock signals from Conflict Zone Manager
- Performance counters from Orchestrator

**Outputs**:
- `MetricsSnapshot` (read-only) to State Display

**No Direct Dependencies**: Metrics Collector uses provider functions (dependency injection) rather than direct imports, ensuring testability.

---

## Performance

- **Update Frequency**: 10 Hz (100 ms intervals)
- **Complexity**:
  - Average speed: O(n) where n = vehicle count
  - Throughput: O(m) where m = events in 60s window (typically <1000)
  - Collision ratio: O(c) where c = collision count (typically <100)
- **Memory**: O(m + c) for event windows and collision durations

**CPU Budget**: <1% at 10 Hz with 200 vehicles and 60s of despawn history per REQ-028 overhead target.

---

## Future Extensions

1. **MF-001 Sign-Off**: All three formulas implemented exactly per specification
2. **System Metrics**: Memory/CPU require OS-level integration (Node.js `process.memoryUsage()`, etc.)
3. **Export/Logging**: Snapshot can be serialized to JSON for telemetry without recomputation
4. **Histogram Metrics**: Could track speed distributions, lane occupancy, etc.

---

## References

- [ADR-008: Metrics Collector](../../docs/ADRs/ADR-008-metrics-collector.md)
- [INTERFACES.md §9: Metrics Collector](../../docs/INTERFACES.md#9-metrics-collector)
- [MF-001: Precision Metric Calculations](../../specs/major/MF-001-precision-metric-calculations.md)
- [REQ-028: State Display](../../specs/requirements/012-REQ-028-state-display.md)
- [TASK-043 through TASK-047](../../tasks/)
