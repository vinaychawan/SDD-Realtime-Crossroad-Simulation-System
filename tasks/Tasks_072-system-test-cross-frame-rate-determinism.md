---
task_id: TASK-072
title: "System Test — Cross-frame-rate determinism validation"
phase: "13: Integration & System Tests"
status: NOT-STARTED
linked_requirements: [REQ-020]
linked_adr: [ADR-002]
depends_on: [TASK-067]
estimated_effort: "3 hours"
---

# TASK-072: System Test — Cross-frame-rate determinism validation

**Phase**: 13 — Integration & System Tests
**Linked Requirements**: [REQ-020](../specs/requirements/004-REQ-020-configurable-frame-rate.md)
**Linked ADR**: [ADR-002](../docs/ADRs/ADR-002-fixed-timestep-loop.md)
**Depends On**: [TASK-067](Tasks_067-integration-wire-all-components.md)

## Acceptance Criteria
- [ ] Identical scenario (fixed seed) run at 30 FPS and 60 FPS produces identical vehicle trajectories and identical collision/deadlock event sequences

**Verification**: Automated determinism comparison test
**Estimated Effort**: 3 hours

---
[← Back to Tasks Index](README.md)
