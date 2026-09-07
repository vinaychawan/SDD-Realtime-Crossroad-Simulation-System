---
task_id: TASK-071
title: "System Test — Stress test (150+ vehicles at 60 FPS)"
phase: "13: Integration & System Tests"
status: ✅ COMPLETED
linked_requirements: [REQ-020, REQ-NEW-COLLISION-PREVENTION-1]
linked_adr: [ADR-002]
depends_on: [TASK-067]
estimated_effort: "3 hours"
---

# TASK-071: System Test — Stress test (150+ vehicles at 60 FPS)

**Phase**: 13 — Integration & System Tests
**Linked Requirements**: [REQ-020](../specs/requirements/004-REQ-020-configurable-frame-rate.md), [REQ-NEW-COLLISION-PREVENTION-1](../specs/requirements/010-REQ-NEW-COLLISION-PREVENTION-1-safe-opposing-green.md)
**Linked ADR**: [ADR-002](../docs/ADRs/ADR-002-fixed-timestep-loop.md)
**Depends On**: [TASK-067](Tasks_067-integration-wire-all-components.md)

## Acceptance Criteria
- [x] 150+ concurrent vehicles sustained for 5 minutes at 60 FPS target
- [x] Render FPS ≥55, physics ≥98 Hz, memory <500MB, CPU <80% throughout

**Verification**: Automated stress test with performance assertions
**Estimated Effort**: 3 hours
**Implementation**: See [evidence/TASK-071-implementation.md](../evidence/TASK-071-implementation.md)

---
[← Back to Tasks Index](README.md)
