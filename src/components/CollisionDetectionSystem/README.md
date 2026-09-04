# Collision Detection System

Implements `ICollisionDetectionSystem` from `docs/INTERFACES.md` §8 for TASK-033–037.

## Responsibilities

- Detect vehicle-to-vehicle collisions every physics tick.
- Detect vehicle-to-infrastructure collisions against configured simulation bounds.
- Use a spatial-grid broad phase to avoid full O(n²) scans for sparse traffic.
- Use AABB narrow-phase checks for precise contact detection.
- Emit `CollisionEvent` objects to downstream Telemetry and Metrics listeners.

## Public API

```typescript
interface ICollisionDetectionSystem {
  tick(vehicles: VehicleState[]): CollisionEvent[];
  onCollision(listener: (event: CollisionEvent) => void): void;
}
```

## Algorithm

### 1. AABB construction

Each vehicle is represented as an axis-aligned bounding box:

- NORTH/SOUTH vehicles: 2m wide × 4.5m long on the Y axis.
- EAST/WEST vehicles: 4.5m long on the X axis × 2m wide.

### 2. Spatial-grid broad phase

- Default cell size: 25m, matching the approximate conflict-zone size.
- Each vehicle AABB is inserted into all grid cells it overlaps.
- Candidate pairs are generated only from vehicles sharing a grid cell.
- Pairs are deduplicated when large AABBs span multiple cells.

### 3. AABB narrow phase

Candidate pairs are checked with inclusive AABB overlap. Edge-touching boxes count as contact.

### 4. Infrastructure checks

Each vehicle AABB is checked against the configured square infrastructure boundary.
Default boundary: ±75m from the intersection center.

## Event Semantics

Each detected collision returns and emits:

- `vehicleIds`: `[VehicleId, VehicleId]` or `[VehicleId, 'INFRASTRUCTURE']`
- `position`: midpoint for vehicle collisions, vehicle position for infrastructure collisions
- `timestampMs`: current simulation timestamp before the tick advances

`tick()` is synchronous and deterministic. Listeners are called synchronously in registration order.

## Diagnostics

The implementation exposes test/diagnostic accessors:

- `getLastBroadPhaseCandidateCount()`
- `getLastGridCellCount()`

These are used to prove that broad-phase filtering avoids full-pair scans in 150+ vehicle stress cases.

## Integration Points

- Physics Engine will call `tick(vehicles)` every 10ms physics tick.
- Metrics Collector will register with `onCollision()` for collision-free ratio calculations.
- Telemetry will register with `onCollision()` for event logging.
- Conflict Zone Manager relies on this system during deadlock recovery and Mode B validation.
