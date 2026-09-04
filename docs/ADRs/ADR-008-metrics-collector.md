---
adr_id: ADR-008
title: Metrics Collector with Precise Formula Contracts
status: PROPOSED
date: 2026-09-04
---

# ADR-008: Metrics Collector with Precise Formula Contracts

**Status**: 🟡 PROPOSED
**Date**: 2026-09-04
**Deciders**: System Architect

---

## Context

[REQ-028](../../specs/requirements/012-REQ-028-state-display.md) requires 5 real-time display
panels including Traffic Metrics (throughput, average speed) and Collision Statistics
(collision-free ratio). [MF-001](../../specs/major/MF-001-precision-metric-calculations.md)
identified that these three metrics lacked precise calculation formulas (e.g., "throughput"
did not specify its time window; "average speed" did not specify zero-vehicle behavior;
"collision-free ratio" did not specify whether it was time-based or vehicle-count-based).

## Decision

Introduce a single **Metrics Collector** component
([INTERFACES.md §9](../INTERFACES.md#9-metrics-collector)) that computes a `MetricsSnapshot`
at a fixed 10 Hz cadence (independent of the 100 Hz physics tick and the 30/60 FPS render
rate), using the exact formulas resolved in MF-001:

| Metric | Formula |
| --- | --- |
| `averageSpeedKmh` | `sum(vehicle.speedKmh) / vehicleCount`, or `0` when `vehicleCount === 0` |
| `throughputPerMinute` | Count of vehicle-exit (despawn) events in the trailing rolling 60-second window |
| `collisionFreeRatioPercent` | `(simulationDurationMs − totalCollisionTimeMs) / simulationDurationMs × 100` (time-based, not per-vehicle) |

The State Display panels read only `IMetricsCollector.getSnapshot()` — they never compute
metrics themselves, ensuring a single formula implementation across the whole system (no
divergent calculations between, e.g., an in-UI recomputation and a logged value).

## Options Considered

| Option | Pros | Cons |
| --- | --- | --- |
| **A: Dedicated Metrics Collector, 10 Hz, formulas per MF-001** ✅ selected | Single source of truth; testable in isolation with synthetic `VehicleState[]`/`CollisionEvent[]` inputs; decoupled from render rate | Introduces one more component |
| **B: Compute metrics inline within State Display render code** | Fewer components | Ties metric correctness to render-rate timing (30 vs 60 FPS could subtly change sampling), and duplicates formulas if more than one display surface is ever added |
| **C: Compute metrics per physics tick (100 Hz)** | Maximum freshness | Unnecessary cost — REQ-028 only requires the display to refresh at 10 Hz; recomputing 10x more often than displayed wastes CPU budget against REQ-028's <5% CPU overhead target |

## Rationale

MF-001 exists specifically because ambiguous formulas make the specification untestable;
Option A resolves this by making the formulas a documented, versioned interface contract
(this ADR + [INTERFACES.md §9](../INTERFACES.md#9-metrics-collector)) rather than an
implementation detail that could silently drift between the UI and any future export/logging
feature. A fixed 10 Hz cadence, decoupled from both the 100 Hz physics tick and the 30/60 FPS
render rate, satisfies REQ-028's explicit "Update Frequency" table without coupling metric
correctness to whichever render rate the user has selected.

## Consequences

- (+) Formula correctness can be unit-tested against MF-001's acceptance criteria without a
  running renderer.
- (+) Adding a future export/telemetry sink reuses the same `MetricsSnapshot` without
  recomputation.
- (-) A dedicated 10 Hz timer is one more scheduled task for the Simulation Orchestrator to
  manage, alongside the 100 Hz physics tick and the render callback.

## Traceability

```
REQ-028 (state display, 5 panels) + MF-001 (precise metric formulas)
→ ADR-008: Metrics Collector, 10 Hz, MF-001 formulas
→ Component: Metrics Collector, State Display
```
