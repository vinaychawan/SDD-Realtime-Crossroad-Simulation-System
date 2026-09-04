---
task_id: TASK-063
title: "State Display — Implement Collision Statistics Panel"
phase: "11: State Display Panels"
status: NOT-STARTED
linked_requirements: [REQ-028, MF-001]
linked_adr: [ADR-004, ADR-008]
depends_on: [TASK-047]
estimated_effort: "2 hours"
---

# TASK-063: State Display — Implement Collision Statistics Panel

**Phase**: 11 — State Display Panels
**Linked Requirements**: [REQ-028](../specs/requirements/012-REQ-028-state-display.md), [MF-001](../specs/major/MF-001-precision-metric-calculations.md)
**Linked ADR**: [ADR-004](../docs/ADRs/ADR-004-conflict-zone-deadlock-recovery.md), [ADR-008](../docs/ADRs/ADR-008-metrics-collector.md)
**Depends On**: [TASK-047](Tasks_047-metrics-collector-full-test-suite-mf001-signoff.md)

## Acceptance Criteria
- [ ] Displays total collisions, active collisions, collision-free ratio, deadlock count — all sourced from `MetricsSnapshot`

**Verification**: UI integration test
**Estimated Effort**: 2 hours

---
[← Back to Tasks Index](README.md)
