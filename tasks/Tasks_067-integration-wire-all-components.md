---
task_id: TASK-067
title: "Integration — Wire all components in Simulation Orchestrator"
phase: "13: Integration & System Tests"
status: ✅ COMPLETED
linked_requirements: [001-scope-and-non-scope, REQ-020]
linked_adr: [ADR-002]
depends_on: [TASK-013, TASK-021, TASK-027, TASK-032, TASK-037, TASK-042, TASK-047, TASK-052, TASK-059, TASK-066]
estimated_effort: "6 hours"
---

# TASK-067: Integration — Wire all components in Simulation Orchestrator

**Phase**: 13 — Integration & System Tests
**Linked Requirements**: [001-scope-and-non-scope](../specs/requirements/001-scope-and-non-scope.md), [REQ-020](../specs/requirements/004-REQ-020-configurable-frame-rate.md)
**Linked ADR**: [ADR-002](../docs/ADRs/ADR-002-fixed-timestep-loop.md)
**Depends On**: [TASK-013](Tasks_013-simulation-orchestrator-fixed-timestep-loop.md), [TASK-021](Tasks_021-signal-controller-mode-b-acceptance-tests.md), [TASK-027](Tasks_027-conflict-zone-manager-full-acceptance-tests.md), [TASK-032](Tasks_032-vehicle-manager-lane-selection-acceptance-tests.md), [TASK-037](Tasks_037-collision-detection-full-test-suite-stress.md), [TASK-042](Tasks_042-emergency-vehicle-controller-full-acceptance-tests.md), [TASK-047](Tasks_047-metrics-collector-full-test-suite-mf001-signoff.md), [TASK-052](Tasks_052-rendering-engine-conflict-zone-visualization.md), [TASK-059](Tasks_059-ui-controller-run-state-control-locking.md), [TASK-066](Tasks_066-telemetry-wire-deadlock-collision-event-logging.md)

## Acceptance Criteria
- [x] Simulation Orchestrator composes Physics Engine, Signal Controller, Conflict Zone Manager, Vehicle Manager, Collision Detection, Emergency Vehicle Controller, Metrics Collector, Telemetry, Renderer, and UI Controller per the [ARCHITECTURE.md](../docs/ARCHITECTURE.md) component map
- [x] `npm run dev` launches a working end-to-end simulation in-browser with all UI controls functional

**Verification**: Manual end-to-end smoke test
**Estimated Effort**: 6 hours
**Implementation**: See [evidence/TASK-067-implementation.md](../evidence/TASK-067-implementation.md)
**Commit**: f6bbcd7

---
[← Back to Tasks Index](README.md)
