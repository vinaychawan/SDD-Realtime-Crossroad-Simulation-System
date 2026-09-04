---
task_id: TASK-011
title: "Physics Engine — Implement vehicle kinematics update"
phase: "2: Physics Engine & Simulation Orchestrator"
status: NOT-STARTED
linked_requirements: [REQ-020, REQ-007]
linked_adr: [ADR-002]
depends_on: [TASK-010]
estimated_effort: "4 hours"
---

# TASK-011: Physics Engine — Implement vehicle kinematics update

**Phase**: 2 — Physics Engine & Simulation Orchestrator
**Linked Requirements**: [REQ-020](../specs/requirements/004-REQ-020-configurable-frame-rate.md), [REQ-007](../specs/requirements/003-REQ-007-vehicle-lane-selection.md)
**Linked ADR**: [ADR-002](../docs/ADRs/ADR-002-fixed-timestep-loop.md)
**Depends On**: [TASK-010](Tasks_010-physics-engine-initialize-module-structure.md)

## Acceptance Criteria
- [ ] Position/speed advanced deterministically per 10ms tick using `speedMs`
- [ ] Speed unit conversions (`speedMs` ↔ `speedKmh`) implemented per [NF-001](../specs/minor/NF-001-speed-unit-consistency.md) (physics in m/s, display in km/h)
- [ ] Unit test: identical input sequence over 1000 ticks produces byte-identical output on repeated runs (determinism)

**Verification**: Unit tests, determinism replay test
**Estimated Effort**: 4 hours

---
[← Back to Tasks Index](README.md)
