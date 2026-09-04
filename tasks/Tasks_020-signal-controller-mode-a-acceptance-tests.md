---
task_id: TASK-020
title: "Signal Controller — Mode A acceptance tests"
phase: "3: Signal Controller"
status: NOT-STARTED
linked_requirements: [REQ-005]
linked_adr: [ADR-003]
depends_on: [TASK-017]
estimated_effort: "3 hours"
---

# TASK-020: Signal Controller — Mode A acceptance tests

**Phase**: 3 — Signal Controller
**Linked Requirements**: [REQ-005](../specs/requirements/002-REQ-005-signal-coordination.md)
**Linked ADR**: [ADR-003](../docs/ADRs/ADR-003-signal-coordination-strategy.md)
**Depends On**: [TASK-017](Tasks_017-signal-controller-strict-mutual-exclusion-mode-a.md)

## Acceptance Criteria
- [ ] All Mode A acceptance criteria from REQ-005 automated
- [ ] ≥90% statement coverage for `StrictMutualExclusionStrategy`

**Verification**: Automated test suite + coverage report
**Estimated Effort**: 3 hours

---
[← Back to Tasks Index](README.md)
