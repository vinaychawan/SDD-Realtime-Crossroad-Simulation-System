---
task_id: TASK-007
title: "Config Manager — Implement exhaustive scenario presets"
phase: "1: Configuration Manager"
status: NOT-STARTED
linked_requirements: [REQ-027]
linked_adr: [ADR-007]
depends_on: [TASK-005]
estimated_effort: "3 hours"
---

# TASK-007: Config Manager — Implement exhaustive scenario presets

**Phase**: 1 — Configuration Manager
**Linked Requirements**: [REQ-027](../specs/requirements/011-REQ-027-ui-controls.md) (resolves [MF-005](../specs/major/MF-005-scenario-preset-completeness.md))
**Linked ADR**: [ADR-007](../docs/ADRs/ADR-007-configuration-scenario-presets.md)
**Depends On**: [TASK-005](Tasks_005-config-manager-field-validation.md)

## Acceptance Criteria
- [ ] All 5 presets (Normal Traffic, Congestion Test, Sparse Traffic, Priority Operations, Custom) implemented per MF-005's exhaustive parameter table
- [ ] `applyScenarioPreset()` populates **every** `SimulationConfig` field (no partial/ambiguous fields)
- [ ] Unit test asserts `getSnapshot()` has no `undefined` fields after each of the 5 presets is applied

**Verification**: Unit tests; snapshot diff against MF-005 table
**Estimated Effort**: 3 hours

---
[← Back to Tasks Index](README.md)
