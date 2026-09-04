---
task_id: TASK-041
title: "Emergency Vehicle Controller — Implement yielding effect computation"
phase: "7: Emergency Vehicle Controller"
status: NOT-STARTED
linked_requirements: [REQ-NEW-E4]
linked_adr: [ADR-006]
depends_on: [TASK-038]
estimated_effort: "4 hours"
---

# TASK-041: Emergency Vehicle Controller — Implement yielding effect computation

**Phase**: 7 — Emergency Vehicle Controller
**Linked Requirements**: [REQ-NEW-E4](../specs/requirements/008-REQ-NEW-E4-yielding-behavior.md)
**Linked ADR**: [ADR-006](../docs/ADRs/ADR-006-emergency-vehicle-subsystem.md)
**Depends On**: [TASK-038](Tasks_038-emergency-vehicle-controller-initialize-module-structure.md)

## Acceptance Criteria
- [ ] `computeYieldingEffects()` returns linear-interpolated target speed factor (100% at 50m → 50% at 0m) for all regular vehicles within range
- [ ] Lane-change direction suggested when safe; `NONE` when unsafe (no forced collision-risk lane changes)
- [ ] Detection works symmetrically in all directions (front/side/rear) in a directional test

**Verification**: Unit tests (gradient measurement, directional test)
**Estimated Effort**: 4 hours

---
[← Back to Tasks Index](README.md)
