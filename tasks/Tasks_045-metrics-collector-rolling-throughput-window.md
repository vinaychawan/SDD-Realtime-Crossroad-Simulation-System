---
task_id: TASK-045
title: "Metrics Collector — Implement rolling 60s throughput window"
phase: "8: Metrics Collector"
status: NOT-STARTED
linked_requirements: [REQ-028, MF-001]
linked_adr: [ADR-008]
depends_on: [TASK-043]
estimated_effort: "3 hours"
---

# TASK-045: Metrics Collector — Implement rolling 60s throughput window

**Phase**: 8 — Metrics Collector
**Linked Requirements**: [REQ-028](../specs/requirements/012-REQ-028-state-display.md), [MF-001](../specs/major/MF-001-precision-metric-calculations.md)
**Linked ADR**: [ADR-008](../docs/ADRs/ADR-008-metrics-collector.md)
**Depends On**: [TASK-043](Tasks_043-metrics-collector-initialize-module-structure.md)

## Acceptance Criteria
- [ ] `throughputPerMinute` counts despawn (exit) events in a trailing rolling 60-second window
- [ ] Window correctly evicts events older than 60s each tick
- [ ] Unit test: inject exit events at known times; assert throughput matches expected count at multiple time offsets

**Verification**: Unit tests (time-injected scenario)
**Estimated Effort**: 3 hours

---
[← Back to Tasks Index](README.md)
