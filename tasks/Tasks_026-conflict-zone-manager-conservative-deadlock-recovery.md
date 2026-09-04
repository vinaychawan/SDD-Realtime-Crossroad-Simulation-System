---
task_id: TASK-026
title: "Conflict Zone Manager — Implement conservative deadlock recovery"
phase: "4: Conflict Zone Manager"
status: NOT-STARTED
linked_requirements: [REQ-NEW-COLLISION-PREVENTION-1, BF-003]
linked_adr: [ADR-004]
depends_on: [TASK-025]
estimated_effort: "5 hours"
---

# TASK-026: Conflict Zone Manager — Implement conservative deadlock recovery

**Phase**: 4 — Conflict Zone Manager
**Linked Requirements**: [REQ-NEW-COLLISION-PREVENTION-1](../specs/requirements/010-REQ-NEW-COLLISION-PREVENTION-1-safe-opposing-green.md), [BF-003](../specs/blocking/BF-003-clarify-deadlock-semantics.md)
**Linked ADR**: [ADR-004](../docs/ADRs/ADR-004-conflict-zone-deadlock-recovery.md)
**Depends On**: [TASK-025](Tasks_025-conflict-zone-manager-deadlock-detection.md)

## Acceptance Criteria
- [ ] Deadlocked vehicle's speed reduced to 50% and collision-checked before being permitted to proceed (Conservative recovery per ADR-004)
- [ ] Recovery is scoped per-vehicle, not a global/intersection-wide override
- [ ] Unit test: synthetic 4-way deadlock resolves without any collision, with each vehicle recovering independently

**Verification**: Unit tests (synthetic deadlock scenario)
**Estimated Effort**: 5 hours

---
[← Back to Tasks Index](README.md)
