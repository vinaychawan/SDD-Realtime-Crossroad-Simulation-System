---
task_id: TASK-042
title: "Emergency Vehicle Controller — Full acceptance test suite"
phase: "7: Emergency Vehicle Controller"
status: NOT-STARTED
linked_requirements: [REQ-NEW-E1, REQ-NEW-E3, REQ-NEW-E4, REQ-NEW-E5]
linked_adr: [ADR-006]
depends_on: [TASK-039, TASK-040, TASK-041]
estimated_effort: "3 hours"
---

# TASK-042: Emergency Vehicle Controller — Full acceptance test suite

**Phase**: 7 — Emergency Vehicle Controller
**Linked Requirements**: [REQ-NEW-E1](../specs/requirements/005-REQ-NEW-E1-emergency-vehicle-types.md), [REQ-NEW-E3](../specs/requirements/007-REQ-NEW-E3-signal-override.md), [REQ-NEW-E4](../specs/requirements/008-REQ-NEW-E4-yielding-behavior.md), [REQ-NEW-E5](../specs/requirements/009-REQ-NEW-E5-emergency-spawn-rate.md)
**Linked ADR**: [ADR-006](../docs/ADRs/ADR-006-emergency-vehicle-subsystem.md)
**Depends On**: [TASK-039](Tasks_039-emergency-vehicle-controller-poisson-spawn-process.md), [TASK-040](Tasks_040-emergency-vehicle-controller-signal-override-decision.md), [TASK-041](Tasks_041-emergency-vehicle-controller-yielding-effect-computation.md)

## Acceptance Criteria
- [ ] All acceptance criteria from REQ-NEW-E1/E3/E4/E5 automated
- [ ] ≥90% statement coverage for `EmergencyVehicleController`

**Verification**: Automated test suite + coverage report
**Estimated Effort**: 3 hours

---
[← Back to Tasks Index](README.md)
