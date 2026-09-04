---
task_id: TASK-013
title: "Simulation Orchestrator — Implement fixed-timestep accumulator loop"
phase: "2: Physics Engine & Simulation Orchestrator"
status: NOT-STARTED
linked_requirements: [REQ-020]
linked_adr: [ADR-002]
depends_on: [TASK-011, TASK-012]
estimated_effort: "5 hours"
---

# TASK-013: Simulation Orchestrator — Implement fixed-timestep accumulator loop

**Phase**: 2 — Physics Engine & Simulation Orchestrator
**Linked Requirements**: [REQ-020](../specs/requirements/004-REQ-020-configurable-frame-rate.md)
**Linked ADR**: [ADR-002](../docs/ADRs/ADR-002-fixed-timestep-loop.md)
**Depends On**: [TASK-011](Tasks_011-physics-engine-vehicle-kinematics.md), [TASK-012](Tasks_012-simulation-orchestrator-initialize-module-structure.md)

## Acceptance Criteria
- [ ] Accumulator loop ticks Physics Engine at exactly 10ms per step regardless of wall-clock frame timing
- [ ] Catch-up cap of 5 ticks/frame implemented; no tick is ever silently dropped (logged if cap reached)
- [ ] `getPhysicsTickRate()` reports 98–102 Hz under normal load in a 30-second measurement test

**Verification**: Timed integration test measuring tick rate over 30s
**Estimated Effort**: 5 hours

---
[← Back to Tasks Index](README.md)
