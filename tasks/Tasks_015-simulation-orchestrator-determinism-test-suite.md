---
task_id: TASK-015
title: "Simulation Orchestrator — Physics/render determinism test suite"
phase: "2: Physics Engine & Simulation Orchestrator"
status: NOT-STARTED
linked_requirements: [REQ-020]
linked_adr: [ADR-002]
depends_on: [TASK-014]
estimated_effort: "4 hours"
---

# TASK-015: Simulation Orchestrator — Physics/render determinism test suite

**Phase**: 2 — Physics Engine & Simulation Orchestrator
**Linked Requirements**: [REQ-020](../specs/requirements/004-REQ-020-configurable-frame-rate.md)
**Linked ADR**: [ADR-002](../docs/ADRs/ADR-002-fixed-timestep-loop.md)
**Depends On**: [TASK-014](Tasks_014-simulation-orchestrator-render-frame-rate-limiter.md)

## Acceptance Criteria
- [ ] Test runs an identical scenario at 30 FPS and 60 FPS and asserts identical final vehicle trajectories
- [ ] Test asserts physics tick count over 60 seconds is 6000 ± 120 (98–102 Hz) in both render modes
- [ ] Stress variant: 150+ vehicles at 60 FPS maintains ≥55 FPS render and 98+ Hz physics

**Verification**: Automated determinism + stress test suite
**Estimated Effort**: 4 hours

---
[← Back to Tasks Index](README.md)
