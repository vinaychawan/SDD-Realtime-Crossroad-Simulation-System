---
task_id: TASK-003
title: "Project — Error taxonomy module"
phase: "0: Project Setup"
status: NOT-STARTED
linked_requirements: [REQ-005, REQ-007, REQ-027]
linked_adr: []
depends_on: [TASK-001]
estimated_effort: "1 hour"
---

# TASK-003: Project — Error taxonomy module

**Phase**: 0 — Project Setup
**Linked Requirements**: [REQ-005](../specs/requirements/002-REQ-005-signal-coordination.md), [REQ-007](../specs/requirements/003-REQ-007-vehicle-lane-selection.md), [REQ-027](../specs/requirements/011-REQ-027-ui-controls.md)
**Linked ADR**: None (cross-cutting concern)
**Depends On**: [TASK-001](Tasks_001-project-initialize-repository-scaffolding.md)

## Acceptance Criteria
- [ ] `src/domain/errors.ts` defines `InvalidConfigurationError`, `StartupOnlyFieldError`, `SpawnCapacityExceededError` per [INTERFACES.md §11](../docs/INTERFACES.md#11-error-taxonomy-cross-cutting)
- [ ] Each error class carries a machine-readable `code` field and human-readable `message`
- [ ] Unit test instantiates and asserts `instanceof Error` for each type

**Verification**: Unit tests
**Estimated Effort**: 1 hour

---
[← Back to Tasks Index](README.md)
