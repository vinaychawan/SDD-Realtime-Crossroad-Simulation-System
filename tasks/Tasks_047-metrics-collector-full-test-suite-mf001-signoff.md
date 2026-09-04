---
task_id: TASK-047
title: "Metrics Collector — Full test suite and MF-001 formula sign-off"
phase: "8: Metrics Collector"
status: COMPLETED
linked_requirements: [REQ-028, MF-001]
linked_adr: [ADR-008]
depends_on: [TASK-044, TASK-045, TASK-046]
estimated_effort: "3 hours"
---

# TASK-047: Metrics Collector — Full test suite and MF-001 formula sign-off

**Phase**: 8 — Metrics Collector
**Linked Requirements**: [REQ-028](../specs/requirements/012-REQ-028-state-display.md), [MF-001](../specs/major/MF-001-precision-metric-calculations.md)
**Linked ADR**: [ADR-008](../docs/ADRs/ADR-008-metrics-collector.md)
**Depends On**: [TASK-044](Tasks_044-metrics-collector-average-speed-formula.md), [TASK-045](Tasks_045-metrics-collector-rolling-throughput-window.md), [TASK-046](Tasks_046-metrics-collector-collision-free-ratio.md)

## Acceptance Criteria
- [ ] All three MF-001 formulas verified against documented examples in [MF-001](../specs/major/MF-001-precision-metric-calculations.md)
- [ ] ≥90% statement coverage for `MetricsCollector`
- [ ] Remaining `MetricsSnapshot` fields (vehicle counts, deadlock count, FPS, physics Hz, memory, CPU) wired from their source components

**Verification**: Automated test suite + coverage report
**Estimated Effort**: 3 hours

---
[← Back to Tasks Index](README.md)
