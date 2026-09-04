---
adr_id: ADR-002
title: Fixed-Timestep Simulation Loop with Decoupled Rendering
status: PROPOSED
date: 2026-09-04
---

# ADR-002: Fixed-Timestep Simulation Loop with Decoupled Rendering

**Status**: 🟡 PROPOSED
**Date**: 2026-09-04
**Deciders**: System Architect

---

## Context

[REQ-020](../../specs/requirements/004-REQ-020-configurable-frame-rate.md) mandates:
- Physics simulation **always** ticks at 100 Hz, regardless of the selected render rate.
- Render rate is user-selectable (30 or 60 FPS), changeable at runtime, transitioning within 1 frame.
- Physics results must be **deterministic** and **identical** whether rendering at 30 or 60 FPS.
- No physics tick may ever be skipped.

## Decision

Implement a **fixed-timestep loop with a time accumulator**, decoupled from the render
callback:

```
accumulator += elapsedRealTime
while (accumulator >= PHYSICS_TICK_MS /* 10 ms */ && catchUpTicks < MAX_CATCHUP /* 5 */):
    physicsEngine.tick(PHYSICS_TICK_MS)
    accumulator -= PHYSICS_TICK_MS
    catchUpTicks++
renderer.renderFrame(interpolate(physicsState, accumulator / PHYSICS_TICK_MS))
```

The render callback (browser `requestAnimationFrame`, gated to 30 or 60 FPS by a frame-rate
limiter) reads only the **latest interpolated physics snapshot**; it never drives physics ticks.

## Options Considered

| Option | Pros | Cons |
| --- | --- | --- |
| **A: Fixed-timestep + accumulator (decoupled)** ✅ selected | Physics rate is invariant to render rate by construction; satisfies determinism acceptance criteria directly | Slightly more complex loop code; requires interpolation for smooth rendering between physics ticks |
| **B: Variable-timestep (physics tied to render callback)** | Simple to implement | Violates REQ-020 directly — physics rate would vary with render rate (30 vs 60 FPS would produce different trajectories) |
| **C: Physics on a separate OS thread/worker** | True parallelism | Introduces cross-thread synchronization complexity and non-determinism risk (race conditions) for negligible benefit at 100 Hz / low vehicle counts targeted here |

## Rationale

Option A is the only option that satisfies the specification's explicit determinism
acceptance criterion: *"Run scenario A at 30 FPS; record vehicle trajectories. Run scenario A
at 60 FPS; record vehicle trajectories. Verify trajectories identical."* Option B fails this
test by definition. Option C adds concurrency risk without a corresponding requirement for
multi-core scaling in this spec's scope (single 4-way intersection, moderate vehicle counts).

## Consequences

- (+) Physics determinism guaranteed independent of render rate.
- (+) Catch-up cap (5 ticks/frame) prevents the "spiral of death" under heavy load, trading
  momentary slow-motion for stability rather than crashing.
- (-) Rendering must interpolate between the last two physics states for visual smoothness;
  this interpolation is display-only and must never feed back into physics state (enforced by
  `IRenderer.renderFrame` being read-only in [INTERFACES.md §10](../INTERFACES.md#10-rendering-engine--ui-controller)).

## Traceability

```
REQ-020 (physics always 100 Hz, decoupled from 30/60 FPS render)
→ ADR-002: Fixed-timestep loop with accumulator
→ Component: Simulation Orchestrator, Rendering Engine
```
