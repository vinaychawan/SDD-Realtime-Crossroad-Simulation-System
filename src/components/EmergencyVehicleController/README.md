# Emergency Vehicle Controller

Implements `IEmergencyVehicleController` from `docs/INTERFACES.md` §7 for TASK-038–042.

## Responsibilities

- Own independent emergency spawn processes for `AMBULANCE`, `POLICE`, and `FIRE_BRIGADE`.
- Represent emergency vehicles as normal `VehicleState` objects with `isEmergency: true` and `emergencyType`.
- Provide signal override decisions for emergency vehicles.
- Provide occupied-intersection slowdown factors for Physics Engine integration.
- Compute yielding effects for regular vehicles near emergency vehicles.

## Spawn Process

Each emergency type has an independent exponential-interval spawn timer derived from its configured vehicles/minute rate:

```text
intervalMs = -ln(1 - rng()) / (ratePerMinute / 60000)
```

The controller accepts an injectable RNG for deterministic tests. The default RNG is `Math.random`.

### Direction assignment

Emergency spawn directions cycle deterministically:

```text
NORTH → SOUTH → EAST → WEST → NORTH → ...
```

When multiple emergency spawns are due in the same tick, they are sorted by:

1. Direction priority: `NORTH`, `SOUTH`, `EAST`, `WEST`
2. Type priority: `AMBULANCE`, `POLICE`, `FIRE_BRIGADE`

This preserves ADR-006/MF-002 deterministic spawn behavior.

## Signal Override

`evaluateSignalOverride()` returns `PROCEED` for emergency vehicles at all signal states.

`getSignalOverrideSpeedFactor()` returns:

- `0.8` by default for emergency vehicles when the intersection is occupied.
- `1.0` otherwise.

The Physics Engine applies the returned factor to avoid complete stops at red signals while still slowing through occupied intersections.

## Yielding Effects

`computeYieldingEffects()` finds regular vehicles within 50m of any emergency vehicle and returns:

- `targetSpeedFactor`: linear interpolation from 1.0 at 50m to 0.5 at 0m.
- `laneChangeDirection`: `LEFT`, `RIGHT`, or `NONE`.

Lane changes are suggested only when the adjacent target lane is valid and no same-direction vehicle is within the safe gap threshold (default 10m).

## Integration Points

- Vehicle Manager can be injected through the `spawnVehicle` callback.
- Physics Engine can use signal override and yielding outputs to adjust vehicle speeds.
- Rendering Engine consumes `VehicleState.emergencyType` for visual markers in later tasks.
- Metrics/Telemetry can subscribe to `onEmergencyVehicleSpawned()`.
