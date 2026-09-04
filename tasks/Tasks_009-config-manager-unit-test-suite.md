---
task_id: TASK-009
title: "Config Manager — Unit test suite completion"
phase: "1: Configuration Manager"
status: NOT-STARTED
linked_requirements: [REQ-027, MF-005, MF-006]
linked_adr: [ADR-007]
depends_on: [TASK-006, TASK-007, TASK-008]
estimated_effort: "3 hours"
---

# TASK-009: Config Manager — Unit test suite completion

**Phase**: 1 — Configuration Manager
**Linked Requirements**: [REQ-027](../specs/requirements/011-REQ-027-ui-controls.md), [MF-005](../specs/major/MF-005-scenario-preset-completeness.md), [MF-006](../specs/major/MF-006-emergency-ui-consistency.md)
**Linked ADR**: [ADR-007](../docs/ADRs/ADR-007-configuration-scenario-presets.md)
**Depends On**: [TASK-006](Tasks_006-config-manager-startup-only-field-enforcement.md), [TASK-007](Tasks_007-config-manager-scenario-presets.md), [TASK-008](Tasks_008-config-manager-change-notification.md)

## Acceptance Criteria
- [ ] ≥90% statement coverage for `ConfigurationManager`
- [ ] Test matrix covers: valid update, invalid update (per field), startup-only rejection, all 5 presets, change notification
- [ ] Emergency config validated as three independent fields (MF-006 Option A), not a single dropdown+rate model

**Verification**: Coverage report
**Estimated Effort**: 3 hours

---
[← Back to Tasks Index](README.md)
