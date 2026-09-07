---
task_id: TASK-069
title: "System Test — Mode B full scenario with collision prevention"
phase: "13: Integration & System Tests"
status: ✅ COMPLETED
linked_requirements: [REQ-005, REQ-NEW-COLLISION-PREVENTION-1, BF-003]
linked_adr: [ADR-003, ADR-004]
depends_on: [TASK-067]
estimated_effort: "4 hours"
---

# TASK-069: System Test — Mode B full scenario with collision prevention

**Phase**: 13 — Integration & System Tests
**Linked Requirements**: [REQ-005](../specs/requirements/002-REQ-005-signal-coordination.md), [REQ-NEW-COLLISION-PREVENTION-1](../specs/requirements/010-REQ-NEW-COLLISION-PREVENTION-1-safe-opposing-green.md), [BF-003](../specs/blocking/BF-003-clarify-deadlock-semantics.md)
**Linked ADR**: [ADR-003](../docs/ADRs/ADR-003-signal-coordination-strategy.md), [ADR-004](../docs/ADRs/ADR-004-conflict-zone-deadlock-recovery.md)
**Depends On**: [TASK-067](Tasks_067-integration-wire-all-components.md)

## Acceptance Criteria
- [x] Congestion Test preset run for 10 simulated minutes in Mode B with zero collisions
- [x] At least one deadlock scenario induced (synthetic heavy opposing traffic) and confirmed resolved via conservative recovery without collision

**Verification**: Automated long-running system test
**Estimated Effort**: 4 hours
**Implementation**: See [evidence/TASK-069-implementation.md](../evidence/TASK-069-implementation.md)

---
[← Back to Tasks Index](README.md)
