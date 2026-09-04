---
task_id: TASK-006
title: "Config Manager — Implement startup-only field enforcement"
phase: "1: Configuration Manager"
status: NOT-STARTED
linked_requirements: [REQ-005, REQ-007]
linked_adr: [ADR-003, ADR-005, ADR-007]
depends_on: [TASK-005]
estimated_effort: "2 hours"
---

# TASK-006: Config Manager — Implement startup-only field enforcement

**Phase**: 1 — Configuration Manager
**Linked Requirements**: [REQ-005](../specs/requirements/002-REQ-005-signal-coordination.md), [REQ-007](../specs/requirements/003-REQ-007-vehicle-lane-selection.md)
**Linked ADR**: [ADR-003](../docs/ADRs/ADR-003-signal-coordination-strategy.md), [ADR-005](../docs/ADRs/ADR-005-lane-selection-strategy.md), [ADR-007](../docs/ADRs/ADR-007-configuration-scenario-presets.md)
**Depends On**: [TASK-005](Tasks_005-config-manager-field-validation.md)

## Acceptance Criteria
- [ ] `signalCoordinationMode` and `laneSelectionStrategy` are rejected with `StartupOnlyFieldError` when orchestrator run state is `RUNNING` or `PAUSED`
- [ ] Both fields remain editable when run state is `CONFIGURATION_ACTIVE`
- [ ] Unit test simulates a run-state transition and asserts rejection/acceptance in each state

**Verification**: Unit tests
**Estimated Effort**: 2 hours

---
[← Back to Tasks Index](README.md)
