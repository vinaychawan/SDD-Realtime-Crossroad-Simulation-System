---
task_id: TASK-002
title: "Project — Shared domain types module"
phase: "0: Project Setup"
status: NOT-STARTED
linked_requirements: [REQ-005, REQ-007, REQ-020, REQ-NEW-E1]
linked_adr: [ADR-001]
depends_on: [TASK-001]
estimated_effort: "1 hour"
---

# TASK-002: Project — Shared domain types module

**Phase**: 0 — Project Setup
**Linked Requirements**: [REQ-005](../specs/requirements/002-REQ-005-signal-coordination.md), [REQ-007](../specs/requirements/003-REQ-007-vehicle-lane-selection.md), [REQ-020](../specs/requirements/004-REQ-020-configurable-frame-rate.md), [REQ-NEW-E1](../specs/requirements/005-REQ-NEW-E1-emergency-vehicle-types.md)
**Linked ADR**: [ADR-001](../docs/ADRs/ADR-001-technology-stack.md)
**Depends On**: [TASK-001](Tasks_001-project-initialize-repository-scaffolding.md)

## Acceptance Criteria
- [ ] `src/domain/types.ts` created with all types from [INTERFACES.md §1](../docs/INTERFACES.md#1-shared-domain-types) (`Direction`, `SignalState`, `SignalCoordinationMode`, `LaneSelectionStrategyKind`, `EmergencyVehicleType`, `VehicleState`, `SignalDirectionState`, `Vector2`)
- [ ] All enums use uppercase string literal unions per MF-004 naming convention
- [ ] Module has zero runtime logic (types only)

**Verification**: TypeScript compiler passes with `strict: true`; code review against INTERFACES.md §1
**Estimated Effort**: 1 hour

---
[← Back to Tasks Index](README.md)
