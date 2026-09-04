---
task_id: TASK-035
title: "Collision Detection — Implement AABB narrow-phase check"
phase: "6: Collision Detection System"
status: NOT-STARTED
linked_requirements: [001-scope-and-non-scope]
linked_adr: []
depends_on: [TASK-034]
estimated_effort: "3 hours"
---

# TASK-035: Collision Detection — Implement AABB narrow-phase check

**Phase**: 6 — Collision Detection System
**Linked Requirements**: [001-scope-and-non-scope](../specs/requirements/001-scope-and-non-scope.md)
**Linked ADR**: None
**Depends On**: [TASK-034](Tasks_034-collision-detection-spatial-grid-broad-phase.md)

## Acceptance Criteria
- [ ] AABB overlap check implemented for vehicle-vehicle and vehicle-infrastructure pairs
- [ ] `tick()` returns all `CollisionEvent`s detected within the current physics tick
- [ ] Detection latency ≤100ms end-to-end, verified via timing test

**Verification**: Unit + timing tests
**Estimated Effort**: 3 hours

---
[← Back to Tasks Index](README.md)
