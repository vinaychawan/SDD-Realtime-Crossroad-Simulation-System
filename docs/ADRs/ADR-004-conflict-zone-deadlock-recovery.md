---
adr_id: ADR-004
title: Conflict Zone Manager and Conservative Deadlock Recovery
status: PROPOSED
date: 2026-09-04
---

# ADR-004: Conflict Zone Manager and Conservative Deadlock Recovery

**Status**: 🟡 PROPOSED
**Date**: 2026-09-04
**Deciders**: System Architect

---

## Context

[REQ-NEW-COLLISION-PREVENTION-1](../../specs/requirements/010-REQ-NEW-COLLISION-PREVENTION-1-safe-opposing-green.md)
requires a conflict-zone occupancy tracker that prevents opposing-direction vehicles from
entering simultaneously when Mode B is active, with a 5-second max wait before a deadlock is
flagged. [BF-003](../../specs/blocking/BF-003-clarify-deadlock-semantics.md) identified that
the *recovery* behavior after a deadlock is flagged was left ambiguous in the original
specification (per-vehicle vs. system-wide scope; forced-exit speed; whether collision
detection stays active during recovery).

## Decision

1. Implement a single **Conflict Zone Manager** component owning zone occupancy, entry
   decisions, and deadlock detection/recovery ([INTERFACES.md §5](../INTERFACES.md#5-conflict-zone-manager)).
2. Adopt **BF-003 Option A (Conservative Recovery)** as the deadlock recovery procedure:
   - Deadlock is scoped **per-vehicle** (each vehicle independently tracks its own wait time).
   - On exceeding `maxWaitSeconds` (default 5 s), the vehicle is forced to exit the queue at
     **50% of its normal speed**.
   - Collision detection **remains active** throughout the forced exit; if a collision becomes
     imminent, the vehicle re-enters the STOP state rather than colliding.

## Options Considered (for recovery procedure, from BF-003)

| Option | Pros | Cons |
| --- | --- | --- |
| **A: Conservative** (50% speed, collision-checked) ✅ selected | Safety-first; never trades a deadlock for a collision; predictable worst-case behavior | Slower recovery; zone may remain congested slightly longer |
| **B: Aggressive** (100% speed, collision detection suspended during recovery) | Fast recovery | Directly contradicts the specification's safety-first framing of collision prevention; risks the exact vehicle-vehicle collision this requirement exists to prevent |
| **C: Hybrid** (adaptive speed based on zone congestion) | Potentially optimal throughput | Introduces additional untested state (congestion-based speed function) not justified by current scope; adds complexity disproportionate to a v0.2.0 feature |

## Rationale

The specification frames REQ-NEW-COLLISION-PREVENTION-1 as **safety-critical** ("MUST",
blocks Mode B). Option A is the only choice that cannot regress the primary safety property
(zero collisions) while resolving the secondary liveness property (no permanent deadlock).
Per-vehicle scoping (rather than system-wide) is simpler to reason about, matches the
specification's existing per-vehicle wait-time language ("Vehicle waiting > 5 seconds"), and
avoids introducing global synchronization across all queued vehicles.

## Consequences

- (+) Deadlock can never resolve into a collision — the same Collision Detection System used
  during normal operation is reused during recovery, not a separate "unsafe" mode.
- (+) Recovery behavior is unit-testable in isolation: force a deadlock, assert the vehicle
  proceeds at 50% speed and that a collision during recovery re-triggers STOP.
- (-) Under sustained heavy opposing traffic, per-vehicle conservative recovery may cause a
  visible "slow trickle" of vehicles through the zone rather than a fast flush; acceptable
  per the specification's safety priority.

## Traceability

```
REQ-NEW-COLLISION-PREVENTION-1 (conflict zone, deadlock ≤5s)
BF-003 (deadlock recovery ambiguity → resolved: Conservative)
→ ADR-004: Conflict Zone Manager, per-vehicle conservative recovery
→ Component: Conflict Zone Manager, Collision Detection System
```
