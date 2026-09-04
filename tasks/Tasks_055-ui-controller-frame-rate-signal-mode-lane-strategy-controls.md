---
task_id: TASK-055
title: "UI Controller — Implement frame rate / signal mode / lane strategy controls"
phase: "10: UI Controller"
status: NOT-STARTED
linked_requirements: [REQ-027]
linked_adr: [ADR-007]
depends_on: [TASK-006, TASK-053]
estimated_effort: "3 hours"
---

# TASK-055: UI Controller — Implement frame rate / signal mode / lane strategy controls

**Phase**: 10 — UI Controller
**Linked Requirements**: [REQ-027](../specs/requirements/011-REQ-027-ui-controls.md)
**Linked ADR**: [ADR-007](../docs/ADRs/ADR-007-configuration-scenario-presets.md)
**Depends On**: [TASK-006](Tasks_006-config-manager-startup-only-field-enforcement.md), [TASK-053](Tasks_053-ui-controller-initialize-dom-scaffolding.md)

## Acceptance Criteria
- [ ] Radio button groups for frame rate (30/60), signal mode (Strict/Opposing), lane strategy (Random/Intelligent)
- [ ] Defaults pre-selected (60 FPS, Strict Mutual Exclusion, Random) on load
- [ ] Signal mode and lane strategy controls visually lock (disabled) once simulation is `RUNNING`, reflecting `StartupOnlyFieldError`

**Verification**: UI integration test across run states
**Estimated Effort**: 3 hours

---
[← Back to Tasks Index](README.md)
