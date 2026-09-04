---
task_id: TASK-039
title: "Emergency Vehicle Controller — Implement per-type Poisson spawn process"
phase: "7: Emergency Vehicle Controller"
status: NOT-STARTED
linked_requirements: [REQ-NEW-E1, REQ-NEW-E5, MF-002]
linked_adr: [ADR-006]
depends_on: [TASK-038, TASK-029]
estimated_effort: "4 hours"
---

# TASK-039: Emergency Vehicle Controller — Implement per-type Poisson spawn process

**Phase**: 7 — Emergency Vehicle Controller
**Linked Requirements**: [REQ-NEW-E1](../specs/requirements/005-REQ-NEW-E1-emergency-vehicle-types.md), [REQ-NEW-E5](../specs/requirements/009-REQ-NEW-E5-emergency-spawn-rate.md), [MF-002](../specs/major/MF-002-emergency-spawn-collision-handling.md)
**Linked ADR**: [ADR-006](../docs/ADRs/ADR-006-emergency-vehicle-subsystem.md)
**Depends On**: [TASK-038](Tasks_038-emergency-vehicle-controller-initialize-module-structure.md), [TASK-029](Tasks_029-vehicle-manager-spawn-despawn-serialized-ordering.md)

## Acceptance Criteria
- [ ] Independent Poisson spawn timers for AMBULANCE, POLICE, FIRE_BRIGADE, each driven by its own configured rate (0–20/min)
- [ ] Spawn rate accuracy within ±10% verified over a 1-minute simulated run per type
- [ ] Simultaneous-tick spawns across types serialized per ADR-006 (reuses Vehicle Manager's deterministic ordering)

**Verification**: Statistical unit test (rate accuracy), determinism test
**Estimated Effort**: 4 hours

---
[← Back to Tasks Index](README.md)
