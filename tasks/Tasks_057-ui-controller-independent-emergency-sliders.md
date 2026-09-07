---
task_id: TASK-057
title: "UI Controller — Implement independent emergency vehicle sliders"
phase: "10: UI Controller"
status: COMPLETED
linked_requirements: [REQ-NEW-E5, MF-006]
linked_adr: [ADR-007]
depends_on: [TASK-005, TASK-053]
estimated_effort: "3 hours"
---

# TASK-057: UI Controller — Implement independent emergency vehicle sliders

**Phase**: 10 — UI Controller
**Linked Requirements**: [REQ-NEW-E5](../specs/requirements/009-REQ-NEW-E5-emergency-spawn-rate.md), [MF-006](../specs/major/MF-006-emergency-ui-consistency.md)
**Linked ADR**: [ADR-007](../docs/ADRs/ADR-007-configuration-scenario-presets.md)
**Depends On**: [TASK-005](Tasks_005-config-manager-field-validation.md), [TASK-053](Tasks_053-ui-controller-initialize-dom-scaffolding.md)

## Acceptance Criteria
- [ ] Three independent sliders (Ambulance, Police, Fire Brigade), each 0–20 veh/min, per MF-006 Option A
- [ ] Controls only visible when `emergency.enabled` is true
- [ ] Slider values propagate to `SimulationConfig.emergency.spawnRatePerMinute` independently (no shared-rate coupling)

**Verification**: UI integration test verifying independent propagation
**Estimated Effort**: 3 hours

---
[← Back to Tasks Index](README.md)
