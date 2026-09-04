---
task_id: TASK-017
title: "Signal Controller — Implement Strict Mutual Exclusion (Mode A)"
phase: "3: Signal Controller"
status: NOT-STARTED
linked_requirements: [REQ-005]
linked_adr: [ADR-003]
depends_on: [TASK-016]
estimated_effort: "4 hours"
---

# TASK-017: Signal Controller — Implement Strict Mutual Exclusion (Mode A)

**Phase**: 3 — Signal Controller
**Linked Requirements**: [REQ-005](../specs/requirements/002-REQ-005-signal-coordination.md)
**Linked ADR**: [ADR-003](../docs/ADRs/ADR-003-signal-coordination-strategy.md)
**Depends On**: [TASK-016](Tasks_016-signal-controller-initialize-module-and-strategy-interface.md)

## Acceptance Criteria
- [ ] `StrictMutualExclusionStrategy` guarantees only one direction pair is GREEN at any time
- [ ] Amber transition duration configurable and enforced between GREEN→RED transitions
- [ ] Unit test: 1000-tick simulated run asserts zero ticks with 2+ non-opposing GREEN directions

**Verification**: Unit tests (invariant assertion over simulated run)
**Estimated Effort**: 4 hours

---
[← Back to Tasks Index](README.md)
