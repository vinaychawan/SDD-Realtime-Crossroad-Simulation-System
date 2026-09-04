---
task_id: TASK-025
title: "Conflict Zone Manager — Implement deadlock detection"
phase: "4: Conflict Zone Manager"
status: NOT-STARTED
linked_requirements: [REQ-NEW-COLLISION-PREVENTION-1, BF-003]
linked_adr: [ADR-004]
depends_on: [TASK-024]
estimated_effort: "4 hours"
---

# TASK-025: Conflict Zone Manager — Implement deadlock detection

**Phase**: 4 — Conflict Zone Manager
**Linked Requirements**: [REQ-NEW-COLLISION-PREVENTION-1](../specs/requirements/010-REQ-NEW-COLLISION-PREVENTION-1-safe-opposing-green.md), [BF-003](../specs/blocking/BF-003-clarify-deadlock-semantics.md)
**Linked ADR**: [ADR-004](../docs/ADRs/ADR-004-conflict-zone-deadlock-recovery.md)
**Depends On**: [TASK-024](Tasks_024-conflict-zone-manager-entry-decision-logic.md)

## Acceptance Criteria
- [ ] A vehicle blocked from entering/proceeding through the zone for ≥5 continuous seconds is flagged as a `DeadlockEvent`
- [ ] Detection timer resets correctly when the blocking condition clears before the 5s threshold
- [ ] Unit test simulates a sustained block and asserts the event fires at exactly the 5s threshold (±1 tick)

**Verification**: Unit tests (timer-precision test)
**Estimated Effort**: 4 hours

---
[← Back to Tasks Index](README.md)
