---
task_id: TASK-036
title: "Collision Detection — Wire collision events to Telemetry and Metrics"
phase: "6: Collision Detection System"
status: NOT-STARTED
linked_requirements: [REQ-028]
linked_adr: [ADR-008]
depends_on: [TASK-035]
estimated_effort: "2 hours"
---

# TASK-036: Collision Detection — Wire collision events to Telemetry and Metrics

**Phase**: 6 — Collision Detection System
**Linked Requirements**: [REQ-028](../specs/requirements/012-REQ-028-state-display.md)
**Linked ADR**: [ADR-008](../docs/ADRs/ADR-008-metrics-collector.md)
**Depends On**: [TASK-035](Tasks_035-collision-detection-aabb-narrow-phase.md)

## Acceptance Criteria
- [ ] `onCollision()` listeners registered by Telemetry (Phase 12) and Metrics Collector (Phase 8)
- [ ] Collision events include timestamp and position for downstream collision-free-ratio calculation

**Verification**: Integration test asserting listener invocation
**Estimated Effort**: 2 hours

---
[← Back to Tasks Index](README.md)
