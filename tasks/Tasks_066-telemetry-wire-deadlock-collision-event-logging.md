---
task_id: TASK-066
title: "Telemetry — Wire deadlock and collision event logging"
phase: "12: Telemetry / Logging"
status: NOT-STARTED
linked_requirements: [REQ-NEW-COLLISION-PREVENTION-1, BF-003]
linked_adr: [ADR-004]
depends_on: [TASK-026, TASK-036, TASK-065]
estimated_effort: "2 hours"
---

# TASK-066: Telemetry — Wire deadlock and collision event logging

**Phase**: 12 — Telemetry / Logging
**Linked Requirements**: [REQ-NEW-COLLISION-PREVENTION-1](../specs/requirements/010-REQ-NEW-COLLISION-PREVENTION-1-safe-opposing-green.md), [BF-003](../specs/blocking/BF-003-clarify-deadlock-semantics.md)
**Linked ADR**: [ADR-004](../docs/ADRs/ADR-004-conflict-zone-deadlock-recovery.md)
**Depends On**: [TASK-026](Tasks_026-conflict-zone-manager-conservative-deadlock-recovery.md), [TASK-036](Tasks_036-collision-detection-wire-events-to-telemetry-metrics.md), [TASK-065](Tasks_065-telemetry-initialize-logging-module.md)

## Acceptance Criteria
- [ ] Every `DeadlockEvent` and `CollisionEvent` recorded with timestamp and vehicle IDs
- [ ] Log volume capped/rotated to avoid unbounded memory growth in long-running sessions

**Verification**: Integration test asserting log entries after synthetic deadlock/collision injection
**Estimated Effort**: 2 hours

---
[← Back to Tasks Index](README.md)
