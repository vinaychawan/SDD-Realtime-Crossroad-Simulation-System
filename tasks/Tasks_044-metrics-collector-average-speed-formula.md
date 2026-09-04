---
task_id: TASK-044
title: "Metrics Collector — Implement average speed formula"
phase: "8: Metrics Collector"
status: NOT-STARTED
linked_requirements: [REQ-028, MF-001]
linked_adr: [ADR-008]
depends_on: [TASK-043]
estimated_effort: "1 hour"
---

# TASK-044: Metrics Collector — Implement average speed formula

**Phase**: 8 — Metrics Collector
**Linked Requirements**: [REQ-028](../specs/requirements/012-REQ-028-state-display.md), [MF-001](../specs/major/MF-001-precision-metric-calculations.md)
**Linked ADR**: [ADR-008](../docs/ADRs/ADR-008-metrics-collector.md)
**Depends On**: [TASK-043](Tasks_043-metrics-collector-initialize-module-structure.md)

## Acceptance Criteria
- [ ] `averageSpeedKmh = sum(speedKmh) / count`, returns `0` when vehicle count is 0 (MF-001 exact formula)
- [ ] Unit test covers zero-vehicle, single-vehicle, and multi-vehicle cases

**Verification**: Unit tests
**Estimated Effort**: 1 hour

---
[← Back to Tasks Index](README.md)
