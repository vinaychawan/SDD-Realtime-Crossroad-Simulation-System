# Physics Engine

**Requirements**: REQ-020 (configurable frame rate / physics rate invariant), REQ-007 (vehicle
lane selection — kinematics input).
**ADR**: [ADR-002](../../../docs/ADRs/ADR-002-fixed-timestep-loop.md)

## Responsibility

Advances vehicle kinematics (position, given current speed) by one fixed-timestep tick.
Deterministic given identical inputs, regardless of render rate (30/60 FPS) — this is the
component that makes the ADR-002 fixed-timestep-loop determinism guarantee possible.

Does **not** own the vehicle list, decide target speeds, or run the tick loop itself — that is
the Simulation Orchestrator's job (`ISimulationOrchestrator`, TASK-012–015), which calls
`IPhysicsEngine.tick()` once per accumulated 10ms of elapsed time.

## The 100 Hz invariant ("never skip a tick")

- Physics **always** ticks at exactly 100 Hz (`PHYSICS_TICK_MS = 10`), independent of the
  selected render rate (REQ-020).
- `tick()` throws `RangeError` if called with any `deltaMs` other than `PHYSICS_TICK_MS` — the
  engine has no concept of a variable or "catch-up" timestep; it only ever advances by exactly
  10ms per call.
- **Never skip a tick**: if real time outpaces the physics rate, the caller (Simulation
  Orchestrator's accumulator loop, ADR-002) must call `tick()` multiple times in the same frame
  (up to a capped number of catch-up ticks) rather than skipping ticks or widening `deltaMs`.
  This module has no awareness of wall-clock time, frame rate, or catch-up counts — that
  bookkeeping lives entirely in the Simulation Orchestrator.

## Files

| File | Purpose |
| --- | --- |
| `physics-engine.interface.ts` | `IPhysicsEngine`, `PHYSICS_TICK_MS` — the internal contract. |
| `PhysicsEngine.ts` | Concrete `IPhysicsEngine` implementation (vehicle kinematics update). |

## Key behaviors

- **Kinematics update** (TASK-011): position is advanced by `speedMs * (deltaMs / 1000)` along
  the vehicle's direction of travel; `speedKmh` is re-derived from `speedMs` on every tick
  (NF-001 unit-consistency invariant — physics is always in m/s, display is always in km/h).
- **Determinism**: `tick()` is a pure function of its arguments (no internal mutable state, no
  wall-clock or RNG dependence) — identical input sequences always produce byte-identical output.

## Non-goals

- Does not decide *what* speed a vehicle should target (signal state, conflict zone, emergency
  yielding — later tasks — set `speedMs` on the `VehicleState` the caller passes in).
- Does not detect collisions (Collision Detection System, TASK-033+, is a separate component
  invoked by the Simulation Orchestrator alongside this one).
- Does not model acceleration/deceleration curves — no requirement currently specifies one; this
  module applies whatever `speedMs` it is given as the constant speed for that tick.
