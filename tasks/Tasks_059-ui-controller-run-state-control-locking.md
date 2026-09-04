---
task_id: TASK-059
title: "UI Controller — Implement run-state control locking"
phase: "10: UI Controller"
status: NOT-STARTED
linked_requirements: [REQ-027]
linked_adr: [ADR-007]
depends_on: [TASK-055, TASK-058]
estimated_effort: "3 hours"
---

# TASK-059: UI Controller — Implement run-state control locking

**Phase**: 10 — UI Controller
**Linked Requirements**: [REQ-027](../specs/requirements/011-REQ-027-ui-controls.md)
**Linked ADR**: [ADR-007](../docs/ADRs/ADR-007-configuration-scenario-presets.md)
**Depends On**: [TASK-055](Tasks_055-ui-controller-frame-rate-signal-mode-lane-strategy-controls.md), [TASK-058](Tasks_058-ui-controller-simulation-playback-controls.md)

## Acceptance Criteria
- [ ] `setRunState()` correctly enables/disables the right control set for `CONFIGURATION_ACTIVE`, `RUNNING`, `PAUSED` per REQ-027's UI state machine
- [ ] Full UI integration test cycles through Configure → Run → Pause → Run → Reset, asserting control availability at each step

**Verification**: End-to-end UI test
**Estimated Effort**: 3 hours

---
[← Back to Tasks Index](README.md)
