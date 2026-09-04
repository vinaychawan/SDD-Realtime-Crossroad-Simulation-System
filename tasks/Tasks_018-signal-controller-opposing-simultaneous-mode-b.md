---
task_id: TASK-018
title: "Signal Controller — Implement Opposing Simultaneous (Mode B)"
phase: "3: Signal Controller"
status: NOT-STARTED
linked_requirements: [REQ-005]
linked_adr: [ADR-003]
depends_on: [TASK-016]
estimated_effort: "4 hours"
---

# TASK-018: Signal Controller — Implement Opposing Simultaneous (Mode B)

**Phase**: 3 — Signal Controller
**Linked Requirements**: [REQ-005](../specs/requirements/002-REQ-005-signal-coordination.md)
**Linked ADR**: [ADR-003](../docs/ADRs/ADR-003-signal-coordination-strategy.md)
**Depends On**: [TASK-016](Tasks_016-signal-controller-initialize-module-and-strategy-interface.md)

## Acceptance Criteria
- [ ] `OpposingSimultaneousStrategy` allows N/S or E/W opposing pairs to both be GREEN simultaneously
- [ ] Perpendicular pairs are never GREEN while the opposing pair is GREEN
- [ ] Unit test: 1000-tick simulated run asserts zero ticks with perpendicular-pair GREEN overlap

**Verification**: Unit tests (invariant assertion over simulated run)
**Estimated Effort**: 4 hours

---
[← Back to Tasks Index](README.md)
