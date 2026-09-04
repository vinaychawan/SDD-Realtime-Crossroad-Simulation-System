---
task_id: TASK-014
title: "Simulation Orchestrator — Implement render frame-rate limiter"
phase: "2: Physics Engine & Simulation Orchestrator"
status: NOT-STARTED
linked_requirements: [REQ-020]
linked_adr: [ADR-002]
depends_on: [TASK-013]
estimated_effort: "3 hours"
---

# TASK-014: Simulation Orchestrator — Implement render frame-rate limiter

**Phase**: 2 — Physics Engine & Simulation Orchestrator
**Linked Requirements**: [REQ-020](../specs/requirements/004-REQ-020-configurable-frame-rate.md)
**Linked ADR**: [ADR-002](../docs/ADRs/ADR-002-fixed-timestep-loop.md)
**Depends On**: [TASK-013](Tasks_013-simulation-orchestrator-fixed-timestep-loop.md)

## Acceptance Criteria
- [ ] `setTargetFrameRate(30 | 60)` gates the render callback to the target rate ± documented tolerance (30 FPS ±3ms, 60 FPS ±2ms)
- [ ] Runtime frame-rate change transitions within 1 frame, with no black frames or stutter
- [ ] Invalid value (e.g., 45) throws `InvalidConfigurationError`

**Verification**: Timed integration test; manual visual inspection during transition
**Estimated Effort**: 3 hours

---
[← Back to Tasks Index](README.md)
