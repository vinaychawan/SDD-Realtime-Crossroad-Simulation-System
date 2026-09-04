# Simulation Orchestrator

**Requirement**: [REQ-020](../../../specs/requirements/004-REQ-020-configurable-frame-rate.md)
**ADR**: [ADR-002](../../../docs/ADRs/ADR-002-fixed-timestep-loop.md)
**Public contract**: [docs/INTERFACES.md §2](../../../docs/INTERFACES.md#2-simulation-orchestrator)

## Responsibility

Owns the fixed-timestep loop: ticks Physics Engine at exactly 100 Hz (`PHYSICS_TICK_MS = 10`),
schedules render callbacks at 30/60 FPS independently, and accumulates leftover time
(accumulator pattern, ADR-002). Physics and rendering are fully decoupled — the physics rate
never varies with the selected render rate.

Does **not** own the vehicle list (Vehicle Manager, a later task, does) or decide vehicle
behavior — external collaborators subscribe to `onPhysicsTick()` / `onRenderFrame()` to react to
each fixed step / render frame using the shared `IPhysicsEngine` instance injected at
construction.

## Files

| File | Purpose |
| --- | --- |
| `simulation-orchestrator.interface.ts` | `ISimulationOrchestrator` — the public contract, matching INTERFACES.md §2 exactly. |
| `SimulationOrchestrator.ts` | Concrete implementation: accumulator loop, catch-up cap, frame-rate limiter, tick/frame-rate measurement. |

## The 100 Hz invariant ("never skip a tick")

- The accumulator loop ticks physics at exactly 10ms per step regardless of wall-clock frame
  timing — `deltaMs` passed to physics is always exactly `PHYSICS_TICK_MS`, never the raw,
  jittery frame time.
- **Catch-up cap**: up to `MAX_CATCHUP_TICKS_PER_FRAME` (5) ticks may run in a single frame to
  make up for lost time. No tick is ever silently dropped: any surplus beyond the cap remains in
  the accumulator and is processed on subsequent frames (a `console.warn` is emitted when the
  cap is hit, for observability under sustained overload — see ADR-002's "spiral of death"
  discussion).
- `getPhysicsTickRate()` reports the lifetime-average measured tick rate in Hz.

## Render frame-rate limiter

- `setTargetFrameRate(30 | 60)` gates the render callback to the requested rate (± the
  documented tolerance: 30 FPS ±3ms, 60 FPS ±2ms, per the rounded millisecond frame interval).
  Any other value throws `InvalidConfigurationError`.
- Changing the target frame rate while running restarts the frame timer immediately at the new
  interval — the transition takes effect within one frame, with no gap in rendering.
- `getRenderFrameRate()` reports the lifetime-average measured render rate in FPS.

## Precondition: `start()` requires a `SimulationConfig`

`start()` throws `InvalidConfigurationError` unless an `IConfigurationManager` has been attached
— either via the constructor's `configManager` dependency or `setConfigurationManager()`. This
guards against starting the simulation loop before any configuration (including scenario preset
defaults) has been established.

## Non-goals

- Does not run collision detection, signal logic, or vehicle spawning itself — those are
  separate components (Collision Detection, Signal Controller, Vehicle Manager) invoked by
  whatever wires itself into `onPhysicsTick()` (Simulation Orchestrator integration, TASK-067).
- Does not perform rendering — `onRenderFrame()` only supplies the interpolation fraction; the
  Rendering Engine (TASK-054+) owns the actual draw calls.
