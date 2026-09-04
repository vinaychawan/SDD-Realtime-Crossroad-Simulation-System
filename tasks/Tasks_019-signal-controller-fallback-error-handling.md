---
task_id: TASK-019
title: "Signal Controller — Implement fallback/error handling"
phase: "3: Signal Controller"
status: NOT-STARTED
linked_requirements: [REQ-005]
linked_adr: [ADR-003]
depends_on: [TASK-017, TASK-018]
estimated_effort: "2 hours"
---

# TASK-019: Signal Controller — Implement fallback/error handling

**Phase**: 3 — Signal Controller
**Linked Requirements**: [REQ-005](../specs/requirements/002-REQ-005-signal-coordination.md)
**Linked ADR**: [ADR-003](../docs/ADRs/ADR-003-signal-coordination-strategy.md)
**Depends On**: [TASK-017](Tasks_017-signal-controller-strict-mutual-exclusion-mode-a.md), [TASK-018](Tasks_018-signal-controller-opposing-simultaneous-mode-b.md)

## Acceptance Criteria
- [ ] Unrecognized/invalid `SignalCoordinationMode` falls back to Strict Mutual Exclusion with a logged warning (fail-safe default)
- [ ] Strategy swap only permitted at startup, enforced jointly with TASK-006
- [ ] Unit test asserts fallback behavior for a corrupted/invalid mode value

**Verification**: Unit tests
**Estimated Effort**: 2 hours

---
[← Back to Tasks Index](README.md)
