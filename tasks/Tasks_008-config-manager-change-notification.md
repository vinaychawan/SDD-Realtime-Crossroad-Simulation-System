---
task_id: TASK-008
title: "Config Manager — Implement change notification"
phase: "1: Configuration Manager"
status: NOT-STARTED
linked_requirements: [REQ-027, REQ-028]
linked_adr: [ADR-007]
depends_on: [TASK-005]
estimated_effort: "2 hours"
---

# TASK-008: Config Manager — Implement change notification

**Phase**: 1 — Configuration Manager
**Linked Requirements**: [REQ-027](../specs/requirements/011-REQ-027-ui-controls.md), [REQ-028](../specs/requirements/012-REQ-028-state-display.md)
**Linked ADR**: [ADR-007](../docs/ADRs/ADR-007-configuration-scenario-presets.md)
**Depends On**: [TASK-005](Tasks_005-config-manager-field-validation.md)

## Acceptance Criteria
- [ ] `onChange()` listener registry implemented; fires on every successful `update()`/`applyScenarioPreset()`
- [ ] Listener receives a read-only (frozen) snapshot, not a mutable reference
- [ ] Unit test asserts mutation attempts on the received snapshot throw/are no-ops

**Verification**: Unit tests
**Estimated Effort**: 2 hours

---
[← Back to Tasks Index](README.md)
