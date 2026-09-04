---
adr_id: ADR-003
title: Strategy Pattern for Signal Coordination Modes
status: PROPOSED
date: 2026-09-04
---

# ADR-003: Strategy Pattern for Signal Coordination Modes

**Status**: 🟡 PROPOSED
**Date**: 2026-09-04
**Deciders**: System Architect

---

## Context

[REQ-005](../../specs/requirements/002-REQ-005-signal-coordination.md) requires two mutually
exclusive, startup-selected signal coordination modes:
- **Mode A**: Strict Mutual Exclusion (one direction green at a time)
- **Mode B**: Opposing Simultaneous (N+S or E+W green together, cross-pairs exclusive)

Mode B additionally **blocks on** [REQ-NEW-COLLISION-PREVENTION-1](../../specs/requirements/010-REQ-NEW-COLLISION-PREVENTION-1-safe-opposing-green.md)
— it cannot be enabled unless the Conflict Zone Manager is active.

## Decision

Model each mode as an implementation of `ISignalCoordinationStrategy`
([INTERFACES.md §4](../INTERFACES.md#4-signal-controller)), selected once at
`ISignalController.initialize()` and never swapped for the lifetime of a simulation run.

```
ISignalCoordinationStrategy
├── StrictMutualExclusionStrategy   (Mode A)
└── OpposingSimultaneousStrategy    (Mode B, composes ConflictZoneManager)
```

## Options Considered

| Option | Pros | Cons |
| --- | --- | --- |
| **A: Strategy Pattern (separate classes per mode)** ✅ selected | Each mode's state machine and invariants are isolated and independently testable; adding a future Mode C requires no changes to the Signal Controller's public contract | Two classes to maintain instead of one with branching `if` statements |
| **B: Single class with an internal `mode` flag and branching logic** | Fewer files | Invariant-checking logic (e.g., "at most one direction green") becomes intertwined with both modes' transition logic, increasing risk of a Mode-A change accidentally breaking Mode-B's invariant, or vice versa |

## Rationale

The specification defines **different state diagrams and different safety invariants** per
mode (REQ-005 §"Operating States & Transitions"). Encoding these as separate strategy classes
directly mirrors the specification structure, and allows each mode's acceptance criteria
(REQ-005's per-mode acceptance tables) to map to isolated unit tests without shared mutable
state between the two modes' logic paths.

## Consequences

- (+) Adding future coordination modes (not in current scope) requires only a new strategy
  class, no Signal Controller changes.
- (+) Mode B strategy has a compile-time dependency on `IConflictZoneManager`, making the
  REQ-005 "Mode B blocked by collision prevention" relationship structurally enforced rather
  than a runtime check that could be forgotten.
- (-) Startup-only enforcement (`StartupOnlyFieldError`) must be implemented once in
  Configuration Manager, not per-strategy, to avoid duplicated validation logic.

## Traceability

```
REQ-005 (two signal coordination modes, startup-selected)
→ ADR-003: Strategy Pattern for coordination modes
→ Component: Signal Controller (StrictMutualExclusionStrategy, OpposingSimultaneousStrategy)
```
