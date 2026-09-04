---
task_id: TASK-046
title: "Metrics Collector — Implement collision-free ratio (time-based)"
phase: "8: Metrics Collector"
status: NOT-STARTED
linked_requirements: [REQ-028, MF-001]
linked_adr: [ADR-008]
depends_on: [TASK-036, TASK-043]
estimated_effort: "3 hours"
---

# TASK-046: Metrics Collector — Implement collision-free ratio (time-based)

**Phase**: 8 — Metrics Collector
**Linked Requirements**: [REQ-028](../specs/requirements/012-REQ-028-state-display.md), [MF-001](../specs/major/MF-001-precision-metric-calculations.md)
**Linked ADR**: [ADR-008](../docs/ADRs/ADR-008-metrics-collector.md)
**Depends On**: [TASK-036](Tasks_036-collision-detection-wire-events-to-telemetry-metrics.md), [TASK-043](Tasks_043-metrics-collector-initialize-module-structure.md)

## Acceptance Criteria
- [ ] `collisionFreeRatioPercent = (simulationDurationMs − totalCollisionTimeMs) / simulationDurationMs × 100` implemented exactly per MF-001
- [ ] `totalCollisionTimeMs` accumulated from Collision Detection events (active collision duration, not just event count)
- [ ] Unit test verifies ratio against a synthetic timeline of collision start/end events

**Verification**: Unit tests
**Estimated Effort**: 3 hours

---
[← Back to Tasks Index](README.md)
