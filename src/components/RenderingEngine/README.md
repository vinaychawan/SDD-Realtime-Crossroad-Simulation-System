# Rendering Engine

Canvas 2D rendering module for TASK-048–052.

## Responsibilities

- Initialize and own a Canvas 2D rendering context.
- Render simulation snapshots without mutating physics state.
- Draw intersection lanes, vehicles, signal indicators, emergency markers, and Mode B conflict zone.
- Use display-only interpolation between physics snapshots per ADR-002.

## Public API

```ts
interface IRenderer {
  renderFrame(
    vehicles: VehicleState[],
    signals: Record<Direction, SignalDirectionState>,
    conflictZoneOccupants: VehicleId[]
  ): void;
}
```

Additional implementation helpers support testing and orchestration:

- `setInterpolationSnapshots(previous, current, fraction)`
- `setSignalMode(mode)`
- `setConflictZoneSizeMeters(sizeMeters)`
- `interpolateVehicle(previous, current, fraction)`
- `getSignalColor(state)`
- `getEmergencyVehicleStyle(type)`
- `getEmergencyLightColor(type, simulationTimeMs)`
- `worldToCanvas(position)`

## Rendering Model

- World origin is the intersection center.
- Default canvas size: 1000×800 px.
- Default scale: 4 px/m.
- Canvas origin is top-left; world Y is inverted for top-down display.

## Interpolation

The renderer stores previous and current physics snapshots and an accumulator fraction. Interpolated positions are used only for drawing and never feed back into physics.

## Signal Rendering

Signal colors:

- RED: `#dc3545`
- GREEN: `#28a745`
- AMBER: `#ffc107`

## Emergency Vehicle Markers

- Ambulance: white body, red trim, red/blue lights, `AMBULANCE` label.
- Police: blue body, white trim, red/blue lights, `POLICE` label.
- Fire Brigade: red body, yellow trim, red/yellow lights, `FIRE` label.

Lights alternate every 500ms, producing a 1.0 Hz full flash cycle.

## Conflict Zone

The conflict zone rectangle is rendered only when signal mode is `OPPOSING_SIMULTANEOUS`. Default size is 25m and can be updated for configured conflict-zone dimensions.
