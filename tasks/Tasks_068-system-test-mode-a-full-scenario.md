---
task_id: TASK-068
title: "System Test — Mode A full scenario (10-minute run)"
phase: "13: Integration & System Tests"
status: ✅ COMPLETED
linked_requirements: [REQ-005]
linked_adr: [ADR-003]
depends_on: [TASK-067]
estimated_effort: "3 hours"
---

# TASK-068: System Test — Mode A full scenario (10-minute run)

**Phase**: 13 — Integration & System Tests
**Linked Requirements**: [REQ-005](../specs/requirements/002-REQ-005-signal-coordination.md)
**Linked ADR**: [ADR-003](../docs/ADRs/ADR-003-signal-coordination-strategy.md)
**Depends On**: [TASK-067](Tasks_067-integration-wire-all-components.md)

## Acceptance Criteria
- [x] Normal Traffic preset run for 10 simulated minutes in Mode A with zero signal-invariant violations
- [x] Zero unexpected collisions logged

**Verification**: Automated long-running system test
**Estimated Effort**: 3 hours
**Implementation**: See [evidence/TASK-068-implementation.md](../evidence/TASK-068-implementation.md)

---
[← Back to Tasks Index](README.md)
