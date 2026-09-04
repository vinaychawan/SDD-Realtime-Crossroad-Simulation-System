---
task_id: TASK-005
title: "Config Manager — Implement field validation"
phase: "1: Configuration Manager"
status: NOT-STARTED
linked_requirements: [REQ-027, NF-003]
linked_adr: [ADR-007]
depends_on: [TASK-004]
estimated_effort: "3 hours"
---

# TASK-005: Config Manager — Implement field validation

**Phase**: 1 — Configuration Manager
**Linked Requirements**: [REQ-027](../specs/requirements/011-REQ-027-ui-controls.md), [NF-003](../specs/minor/NF-003-parameter-constraints-documentation.md)
**Linked ADR**: [ADR-007](../docs/ADRs/ADR-007-configuration-scenario-presets.md)
**Depends On**: [TASK-004](Tasks_004-config-manager-initialize-module-structure.md)

## Acceptance Criteria
- [ ] `update()` validates every numeric field against its documented range (spawn rates 0–60, durations 10–60s, emergency rates 0–20 each, conflict zone 20–50m, etc.)
- [ ] Out-of-range values throw `InvalidConfigurationError`; last valid value is retained
- [ ] Unit tests cover boundary values (min, max, min−1, max+1) for every field

**Verification**: Unit tests (boundary value analysis)
**Estimated Effort**: 3 hours

---
[← Back to Tasks Index](README.md)
