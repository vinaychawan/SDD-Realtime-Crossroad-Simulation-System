---
task_id: TASK-040
title: "Emergency Vehicle Controller — Implement signal override decision"
phase: "7: Emergency Vehicle Controller"
status: NOT-STARTED
linked_requirements: [REQ-NEW-E3]
linked_adr: [ADR-006]
depends_on: [TASK-038]
estimated_effort: "3 hours"
---

# TASK-040: Emergency Vehicle Controller — Implement signal override decision

**Phase**: 7 — Emergency Vehicle Controller
**Linked Requirements**: [REQ-NEW-E3](../specs/requirements/007-REQ-NEW-E3-signal-override.md)
**Linked ADR**: [ADR-006](../docs/ADRs/ADR-006-emergency-vehicle-subsystem.md)
**Depends On**: [TASK-038](Tasks_038-emergency-vehicle-controller-initialize-module-structure.md)

## Acceptance Criteria
- [ ] `evaluateSignalOverride()` always returns `PROCEED` for emergency vehicles at RED signals
- [ ] When intersection occupied, Physics Engine applies 80% (`emergencySlowdownFactor`) speed via this controller's signal
- [ ] Emergency vehicle never reaches 0 km/h at a RED signal in test scenarios

**Verification**: Unit tests (red-signal override, occupied-intersection slowdown)
**Estimated Effort**: 3 hours

---
[← Back to Tasks Index](README.md)
