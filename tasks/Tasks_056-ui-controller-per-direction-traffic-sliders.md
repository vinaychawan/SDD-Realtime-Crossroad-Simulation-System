---
task_id: TASK-056
title: "UI Controller — Implement per-direction traffic sliders"
phase: "10: UI Controller"
status: NOT-STARTED
linked_requirements: [REQ-027]
linked_adr: [ADR-007]
depends_on: [TASK-005, TASK-053]
estimated_effort: "3 hours"
---

# TASK-056: UI Controller — Implement per-direction traffic sliders

**Phase**: 10 — UI Controller
**Linked Requirements**: [REQ-027](../specs/requirements/011-REQ-027-ui-controls.md)
**Linked ADR**: [ADR-007](../docs/ADRs/ADR-007-configuration-scenario-presets.md)
**Depends On**: [TASK-005](Tasks_005-config-manager-field-validation.md), [TASK-053](Tasks_053-ui-controller-initialize-dom-scaffolding.md)

## Acceptance Criteria
- [ ] Spawn rate (0–60), green duration (10–60s), red duration (10–60s) sliders for all 4 directions
- [ ] Slider drag updates propagate to Configuration Manager within 100ms with visual smoothness at 30 FPS refresh

**Verification**: UI integration test
**Estimated Effort**: 3 hours

---
[← Back to Tasks Index](README.md)
