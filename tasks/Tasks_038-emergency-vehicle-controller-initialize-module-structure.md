---
task_id: TASK-038
title: "Emergency Vehicle Controller — Initialize module structure"
phase: "7: Emergency Vehicle Controller"
status: NOT-STARTED
linked_requirements: [REQ-NEW-E1]
linked_adr: [ADR-006]
depends_on: [TASK-002, TASK-004, TASK-028]
estimated_effort: "2 hours"
---

# TASK-038: Emergency Vehicle Controller — Initialize module structure

**Phase**: 7 — Emergency Vehicle Controller
**Linked Requirements**: [REQ-NEW-E1](../specs/requirements/005-REQ-NEW-E1-emergency-vehicle-types.md)
**Linked ADR**: [ADR-006](../docs/ADRs/ADR-006-emergency-vehicle-subsystem.md)
**Depends On**: [TASK-002](Tasks_002-project-shared-domain-types-module.md), [TASK-004](Tasks_004-config-manager-initialize-module-structure.md), [TASK-028](Tasks_028-vehicle-manager-initialize-module-structure.md)

## Acceptance Criteria
- [ ] Module structure created at `src/components/EmergencyVehicleController/`
- [ ] `IEmergencyVehicleController` interface implemented per [INTERFACES.md §7](../docs/INTERFACES.md#7-emergency-vehicle-controller)
- [ ] Emergency vehicles represented as `VehicleState` + `emergencyType` discriminant (no parallel class hierarchy)

**Verification**: Code review
**Estimated Effort**: 2 hours

---
[← Back to Tasks Index](README.md)
