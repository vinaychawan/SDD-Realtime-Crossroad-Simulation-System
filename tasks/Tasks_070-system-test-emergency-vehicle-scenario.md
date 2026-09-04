---
task_id: TASK-070
title: "System Test — Emergency vehicle scenario (Priority Operations preset)"
phase: "13: Integration & System Tests"
status: NOT-STARTED
linked_requirements: [REQ-NEW-E1, REQ-NEW-E3, REQ-NEW-E4, REQ-NEW-E5]
linked_adr: [ADR-006]
depends_on: [TASK-067]
estimated_effort: "4 hours"
---

# TASK-070: System Test — Emergency vehicle scenario (Priority Operations preset)

**Phase**: 13 — Integration & System Tests
**Linked Requirements**: [REQ-NEW-E1](../specs/requirements/005-REQ-NEW-E1-emergency-vehicle-types.md), [REQ-NEW-E3](../specs/requirements/007-REQ-NEW-E3-signal-override.md), [REQ-NEW-E4](../specs/requirements/008-REQ-NEW-E4-yielding-behavior.md), [REQ-NEW-E5](../specs/requirements/009-REQ-NEW-E5-emergency-spawn-rate.md)
**Linked ADR**: [ADR-006](../docs/ADRs/ADR-006-emergency-vehicle-subsystem.md)
**Depends On**: [TASK-067](Tasks_067-integration-wire-all-components.md)

## Acceptance Criteria
- [ ] Priority Operations preset run for 5 simulated minutes; all 3 emergency types spawn at configured rates ±10%
- [ ] Emergency vehicles observed overriding RED signals; nearby regular vehicles observed yielding (speed reduction/lane change)

**Verification**: Automated system test with telemetry assertions
**Estimated Effort**: 4 hours

---
[← Back to Tasks Index](README.md)
