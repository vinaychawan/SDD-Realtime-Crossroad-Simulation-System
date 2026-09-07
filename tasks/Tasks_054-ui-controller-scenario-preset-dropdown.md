---
task_id: TASK-054
title: "UI Controller — Implement scenario preset dropdown"
phase: "10: UI Controller"
status: COMPLETED
linked_requirements: [REQ-027, MF-005]
linked_adr: [ADR-007]
depends_on: [TASK-007, TASK-053]
estimated_effort: "2 hours"
---

# TASK-054: UI Controller — Implement scenario preset dropdown

**Phase**: 10 — UI Controller
**Linked Requirements**: [REQ-027](../specs/requirements/011-REQ-027-ui-controls.md), [MF-005](../specs/major/MF-005-scenario-preset-completeness.md)
**Linked ADR**: [ADR-007](../docs/ADRs/ADR-007-configuration-scenario-presets.md)
**Depends On**: [TASK-007](Tasks_007-config-manager-scenario-presets.md), [TASK-053](Tasks_053-ui-controller-initialize-dom-scaffolding.md)

## Acceptance Criteria
- [ ] Dropdown lists all 5 presets; selecting one calls `IConfigurationManager.applyScenarioPreset()`
- [ ] All dependent controls visually update to reflect the applied preset within 500ms

**Verification**: UI integration test
**Estimated Effort**: 2 hours

---
[← Back to Tasks Index](README.md)
