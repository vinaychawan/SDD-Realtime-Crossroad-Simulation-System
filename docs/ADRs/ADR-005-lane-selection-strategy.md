---
adr_id: ADR-005
title: Strategy Pattern for Vehicle Lane Selection
status: PROPOSED
date: 2026-09-04
---

# ADR-005: Strategy Pattern for Vehicle Lane Selection

**Status**: 🟡 PROPOSED
**Date**: 2026-09-04
**Deciders**: System Architect

---

## Context

[REQ-007](../../specs/requirements/003-REQ-007-vehicle-lane-selection.md) requires two
mutually exclusive, startup-selected lane selection strategies:
- **Strategy A (RANDOM)**: uniform random lane choice at spawn, no lane changes.
- **Strategy B (INTELLIGENT)**: pre-positioning into an optimal lane via one or more lane
  changes, completed ≥50 m before the intersection, at ≤20 km/h.

The two strategies have entirely different behavior, inputs consulted, and failure modes
(REQ-007's failure table: "cannot find safe lane change → stay in current lane" applies only
to INTELLIGENT).

## Decision

Model each strategy as an implementation of `ILaneSelectionStrategy`
([INTERFACES.md §6](../INTERFACES.md#6-vehicle-manager--lane-selection-strategy)), selected
once at startup and applied to all subsequent vehicle spawns (existing vehicles unaffected by
a hypothetical runtime change, per REQ-007's clarified "no retroactive change" answer).

```
ILaneSelectionStrategy
├── RandomLaneStrategy        (Strategy A)
└── IntelligentLaneStrategy   (Strategy B)
```

## Options Considered

| Option | Pros | Cons |
| --- | --- | --- |
| **A: Strategy Pattern** ✅ selected | Mirrors REQ-005's precedent (ADR-003); RANDOM's statistical acceptance criteria (27–37% per lane) and INTELLIGENT's behavioral criteria (≥95% optimal-lane success) can be tested against each strategy in isolation | Two classes instead of one |
| **B: Single `VehicleManager` method with a mode branch** | Fewer files | Couples the simple RANDOM path's testing to the more complex INTELLIGENT path's lane-change planning logic, increasing the surface area of any RANDOM-strategy unit test |

## Rationale

Consistency with [ADR-003](ADR-003-signal-coordination-strategy.md): the specification
already establishes a pattern of "two mutually-exclusive, startup-selected algorithms" for
both signal coordination and lane selection. Using the same architectural pattern for both
reduces the number of distinct design idioms a developer must learn, and each strategy's
acceptance criteria (statistical vs. behavioral) are cleanly separable only if the
implementations are separate.

## Consequences

- (+) `RandomLaneStrategy` has no dependency on other vehicles' positions; trivially fast.
- (+) `IntelligentLaneStrategy` encapsulates all lane-change planning (safety checks, ≤20 km/h
  speed constraint, 50 m pre-positioning distance) without leaking into Vehicle Manager.
- (-) `IntelligentLaneStrategy` needs read access to nearby `VehicleState[]` for safe lane-change
  planning, a slightly richer dependency than `RandomLaneStrategy`.

## Traceability

```
REQ-007 (two lane selection strategies, startup-selected)
→ ADR-005: Strategy Pattern for lane selection
→ Component: Vehicle Manager (RandomLaneStrategy, IntelligentLaneStrategy)
```
