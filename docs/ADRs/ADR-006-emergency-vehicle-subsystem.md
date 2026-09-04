---
adr_id: ADR-006
title: Emergency Vehicle Subsystem Architecture
status: PROPOSED
date: 2026-09-04
---

# ADR-006: Emergency Vehicle Subsystem Architecture

**Status**: 🟡 PROPOSED
**Date**: 2026-09-04
**Deciders**: System Architect

---

## Context

Five requirements govern emergency vehicles:
[REQ-NEW-E1](../../specs/requirements/005-REQ-NEW-E1-emergency-vehicle-types.md) (three
types), [REQ-NEW-E2](../../specs/requirements/006-REQ-NEW-E2-emergency-visual-markers.md)
(visual markers), [REQ-NEW-E3](../../specs/requirements/007-REQ-NEW-E3-signal-override.md)
(signal override), [REQ-NEW-E4](../../specs/requirements/008-REQ-NEW-E4-yielding-behavior.md)
(yielding), and [REQ-NEW-E5](../../specs/requirements/009-REQ-NEW-E5-emergency-spawn-rate.md)
(per-type spawn rate). [MF-002](../../specs/major/MF-002-emergency-spawn-collision-handling.md)
additionally flagged that the spawn algorithm for simultaneous/near-simultaneous emergency
spawns was unspecified.

## Decision

1. Introduce a single **Emergency Vehicle Controller** component
   ([INTERFACES.md §7](../INTERFACES.md#7-emergency-vehicle-controller)) that owns:
   - Independent Poisson spawn processes per type (`AMBULANCE`, `POLICE`, `FIRE_BRIGADE`),
     each governed by its own `spawnRatePerMinute` (REQ-NEW-E5).
   - Signal-override decision logic (REQ-NEW-E3): always returns `PROCEED`, with an 80%
     speed factor applied by the Physics Engine when the intersection is occupied.
   - Yielding-effect computation (REQ-NEW-E4): linear interpolation of nearby regular
     vehicles' target speed factor (100% at 50 m → 50% at 0 m).
2. Represent emergency vehicles as a **regular `VehicleState` plus an optional
   `emergencyType` discriminant** (lightweight entity-component composition, not a parallel
   class hierarchy) — see [ARCHITECTURE.md §4](../ARCHITECTURE.md#4-design-patterns--rationale).
3. Resolve **MF-002** by adopting **serialized, deterministic spawn ordering**: when multiple
   spawn events (regular and/or emergency, any type) are due within the same physics tick,
   `IVehicleManager.spawnVehicle` processes them in a fixed direction priority order
   (NORTH, SOUTH, EAST, WEST), guaranteeing no two vehicles are ever created at an identical
   position in the same tick.
4. Visual markers (REQ-NEW-E2: color, flashing lights at 1 Hz, text label, optional siren)
   are rendering-only data attached to `VehicleState.emergencyType` and consumed exclusively
   by the Rendering Engine — never influencing physics or collision logic.

## Options Considered (spawn collision handling, from MF-002)

| Option | Pros | Cons |
| --- | --- | --- |
| **A: Serialized deterministic spawning** ✅ selected | Simple, reproducible (important for REQ-020's determinism tests); no position collisions by construction | Under extreme simultaneous load, later-priority directions are delayed by a fraction of a tick (negligible at ≤60 veh/min emergency cap) |
| **B: Weighted random distribution across entry points** | Avoids any fixed bias toward NORTH | Non-deterministic given the same seed unless carefully engineered; complicates REQ-020's cross-frame-rate determinism acceptance test |
| **C: Spatial collision detection at spawn time (reject/retry)** | Most "physically realistic" | Adds retry-loop complexity and potential unbounded delay under high spawn rates; unnecessary given Option A's simplicity already satisfies "no two vehicles at the same position" |

## Rationale

Option A directly supports the existing determinism requirement (REQ-020) shared across the
whole simulation core — introducing per-spawn randomness (Option B) or retry loops (Option C)
would only be justified by a requirement demanding unbiased entry-point distribution, which
does not exist in the current specification. Composing emergency behavior onto the base
`VehicleState` (rather than a separate `EmergencyVehicle` subclass) keeps the Physics Engine
and Collision Detection System type-agnostic — they operate on `VehicleState` uniformly,
with the Emergency Vehicle Controller supplying the only type-specific decision logic.

## Consequences

- (+) One controller encapsulates all five emergency requirements; Vehicle Manager and
  Physics Engine remain emergency-agnostic aside from consulting
  `evaluateSignalOverride`/`computeYieldingEffects`.
- (+) Deterministic spawn ordering makes MF-002 test cases ("what happens if two vehicles
  spawn simultaneously") trivially reproducible.
- (-) Fixed direction priority (N, S, E, W) introduces a theoretical, negligible bias under
  pathological simultaneous-spawn scenarios; acceptable since REQ-NEW-E5's acceptance
  criteria only require ±10% rate accuracy per type, not perfect inter-tick fairness.

## Traceability

```
REQ-NEW-E1..E5 (emergency vehicle types, markers, override, yielding, spawn rate)
MF-002 (spawn collision handling → resolved: serialized deterministic order)
→ ADR-006: Emergency Vehicle Controller
→ Component: Emergency Vehicle Controller, Vehicle Manager, Rendering Engine
```
