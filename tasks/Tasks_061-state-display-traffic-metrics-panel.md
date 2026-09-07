---
task_id: TASK-061
title: "State Display — Implement Traffic Metrics Panel"
phase: "11: State Display Panels"
status: COMPLETED
linked_requirements: [REQ-028, MF-001]
linked_adr: [ADR-008]
depends_on: [TASK-047]
estimated_effort: "2 hours"
---

# TASK-061: State Display — Implement Traffic Metrics Panel

**Phase**: 11 — State Display Panels
**Linked Requirements**: [REQ-028](../specs/requirements/012-REQ-028-state-display.md), [MF-001](../specs/major/MF-001-precision-metric-calculations.md)
**Linked ADR**: [ADR-008](../docs/ADRs/ADR-008-metrics-collector.md)
**Depends On**: [TASK-047](Tasks_047-metrics-collector-full-test-suite-mf001-signoff.md)

## Acceptance Criteria
- [ ] Displays vehicle count (regular/emergency), average speed, throughput, sourced only from `IMetricsCollector.getSnapshot()`
- [ ] Panel refresh rate matches the 10 Hz metrics cadence (no independent recomputation)

**Verification**: UI integration test
**Estimated Effort**: 2 hours

---
[← Back to Tasks Index](README.md)
