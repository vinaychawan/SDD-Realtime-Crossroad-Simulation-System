# Implementation Tasks Index

This folder contains the atomic implementation tasks for the Traffic Intersection Simulation project, split from the original monolithic `TASKS.md` into one file per task (mirroring the `specs/blocking/`, `specs/major/`, `specs/minor/`, `specs/recommendations/` organization pattern).

**Total Tasks**: 72
**Naming Convention**: `Tasks_NNN-descriptive-slug.md`, numbered incrementally 001–072
**Each task file contains**: Linked Requirements, Linked ADR, Depends On (with links to prerequisite task files), Acceptance Criteria, Verification method, Estimated Effort

## How to Read a Task

Each task file has YAML frontmatter (`task_id`, `title`, `phase`, `status`, `linked_requirements`, `linked_adr`, `depends_on`, `estimated_effort`) followed by the full task body. Update the `status` field (`NOT-STARTED` / `IN-PROGRESS` / `COMPLETED`) as work proceeds.

## Phase Overview

| Phase | Component | Tasks |
| --- | --- | --- |
| 0 | Project Setup | [001](Tasks_001-project-initialize-repository-scaffolding.md)–[003](Tasks_003-project-error-taxonomy-module.md) |
| 1 | Configuration Manager | [004](Tasks_004-config-manager-initialize-module-structure.md)–[009](Tasks_009-config-manager-unit-test-suite.md) |
| 2 | Physics Engine & Simulation Orchestrator | [010](Tasks_010-physics-engine-initialize-module-structure.md)–[015](Tasks_015-simulation-orchestrator-determinism-test-suite.md) |
| 3 | Signal Controller | [016](Tasks_016-signal-controller-initialize-module-and-strategy-interface.md)–[021](Tasks_021-signal-controller-mode-b-acceptance-tests.md) |
| 4 | Conflict Zone Manager | [022](Tasks_022-conflict-zone-manager-initialize-module-structure.md)–[027](Tasks_027-conflict-zone-manager-full-acceptance-tests.md) |
| 5 | Vehicle Manager & Lane Selection | [028](Tasks_028-vehicle-manager-initialize-module-structure.md)–[032](Tasks_032-vehicle-manager-lane-selection-acceptance-tests.md) |
| 6 | Collision Detection System | [033](Tasks_033-collision-detection-initialize-module-structure.md)–[037](Tasks_037-collision-detection-full-test-suite-stress.md) |
| 7 | Emergency Vehicle Controller | [038](Tasks_038-emergency-vehicle-controller-initialize-module-structure.md)–[042](Tasks_042-emergency-vehicle-controller-full-acceptance-tests.md) |
| 8 | Metrics Collector | [043](Tasks_043-metrics-collector-initialize-module-structure.md)–[047](Tasks_047-metrics-collector-full-test-suite-mf001-signoff.md) |
| 9 | Rendering Engine | [048](Tasks_048-rendering-engine-initialize-canvas-module.md)–[052](Tasks_052-rendering-engine-conflict-zone-visualization.md) |
| 10 | UI Controller | [053](Tasks_053-ui-controller-initialize-dom-scaffolding.md)–[059](Tasks_059-ui-controller-run-state-control-locking.md) |
| 11 | State Display Panels | [060](Tasks_060-state-display-configuration-panel.md)–[064](Tasks_064-state-display-performance-metrics-panel.md) |
| 12 | Telemetry / Logging | [065](Tasks_065-telemetry-initialize-logging-module.md)–[066](Tasks_066-telemetry-wire-deadlock-collision-event-logging.md) |
| 13 | Integration & System Tests | [067](Tasks_067-integration-wire-all-components.md)–[072](Tasks_072-system-test-cross-frame-rate-determinism.md) |

## Full Task List

### Phase 0: Project Setup
- [Tasks_001 — Initialize repository scaffolding](Tasks_001-project-initialize-repository-scaffolding.md)
- [Tasks_002 — Shared domain types module](Tasks_002-project-shared-domain-types-module.md)
- [Tasks_003 — Error taxonomy module](Tasks_003-project-error-taxonomy-module.md)

### Phase 1: Configuration Manager
- [Tasks_004 — Initialize module structure](Tasks_004-config-manager-initialize-module-structure.md)
- [Tasks_005 — Field validation](Tasks_005-config-manager-field-validation.md)
- [Tasks_006 — Startup-only field enforcement](Tasks_006-config-manager-startup-only-field-enforcement.md)
- [Tasks_007 — Exhaustive scenario presets](Tasks_007-config-manager-scenario-presets.md)
- [Tasks_008 — Change notification](Tasks_008-config-manager-change-notification.md)
- [Tasks_009 — Unit test suite completion](Tasks_009-config-manager-unit-test-suite.md)

### Phase 2: Physics Engine & Simulation Orchestrator
- [Tasks_010 — Physics Engine: initialize module structure](Tasks_010-physics-engine-initialize-module-structure.md)
- [Tasks_011 — Physics Engine: vehicle kinematics update](Tasks_011-physics-engine-vehicle-kinematics.md)
- [Tasks_012 — Simulation Orchestrator: initialize module structure](Tasks_012-simulation-orchestrator-initialize-module-structure.md)
- [Tasks_013 — Fixed-timestep accumulator loop](Tasks_013-simulation-orchestrator-fixed-timestep-loop.md)
- [Tasks_014 — Render frame-rate limiter](Tasks_014-simulation-orchestrator-render-frame-rate-limiter.md)
- [Tasks_015 — Physics/render determinism test suite](Tasks_015-simulation-orchestrator-determinism-test-suite.md)

### Phase 3: Signal Controller
- [Tasks_016 — Initialize module + strategy interface](Tasks_016-signal-controller-initialize-module-and-strategy-interface.md)
- [Tasks_017 — Strict Mutual Exclusion (Mode A)](Tasks_017-signal-controller-strict-mutual-exclusion-mode-a.md)
- [Tasks_018 — Opposing Simultaneous (Mode B)](Tasks_018-signal-controller-opposing-simultaneous-mode-b.md)
- [Tasks_019 — Fallback/error handling](Tasks_019-signal-controller-fallback-error-handling.md)
- [Tasks_020 — Mode A acceptance tests](Tasks_020-signal-controller-mode-a-acceptance-tests.md)
- [Tasks_021 — Mode B acceptance tests](Tasks_021-signal-controller-mode-b-acceptance-tests.md)

### Phase 4: Conflict Zone Manager
- [Tasks_022 — Initialize module structure](Tasks_022-conflict-zone-manager-initialize-module-structure.md)
- [Tasks_023 — Occupancy tracking](Tasks_023-conflict-zone-manager-occupancy-tracking.md)
- [Tasks_024 — Entry decision logic](Tasks_024-conflict-zone-manager-entry-decision-logic.md)
- [Tasks_025 — Deadlock detection](Tasks_025-conflict-zone-manager-deadlock-detection.md)
- [Tasks_026 — Conservative deadlock recovery](Tasks_026-conflict-zone-manager-conservative-deadlock-recovery.md)
- [Tasks_027 — Full acceptance test suite](Tasks_027-conflict-zone-manager-full-acceptance-tests.md)

### Phase 5: Vehicle Manager & Lane Selection
- [Tasks_028 — Initialize module structure](Tasks_028-vehicle-manager-initialize-module-structure.md)
- [Tasks_029 — Spawn/despawn with serialized ordering](Tasks_029-vehicle-manager-spawn-despawn-serialized-ordering.md)
- [Tasks_030 — Random lane selection strategy](Tasks_030-vehicle-manager-random-lane-selection-strategy.md)
- [Tasks_031 — Intelligent lane selection strategy](Tasks_031-vehicle-manager-intelligent-lane-selection-strategy.md)
- [Tasks_032 — Lane selection acceptance test suite](Tasks_032-vehicle-manager-lane-selection-acceptance-tests.md)

### Phase 6: Collision Detection System
- [Tasks_033 — Initialize module structure](Tasks_033-collision-detection-initialize-module-structure.md)
- [Tasks_034 — Spatial grid broad-phase](Tasks_034-collision-detection-spatial-grid-broad-phase.md)
- [Tasks_035 — AABB narrow-phase check](Tasks_035-collision-detection-aabb-narrow-phase.md)
- [Tasks_036 — Wire collision events to Telemetry and Metrics](Tasks_036-collision-detection-wire-events-to-telemetry-metrics.md)
- [Tasks_037 — Full test suite and stress validation](Tasks_037-collision-detection-full-test-suite-stress.md)

### Phase 7: Emergency Vehicle Controller
- [Tasks_038 — Initialize module structure](Tasks_038-emergency-vehicle-controller-initialize-module-structure.md)
- [Tasks_039 — Per-type Poisson spawn process](Tasks_039-emergency-vehicle-controller-poisson-spawn-process.md)
- [Tasks_040 — Signal override decision](Tasks_040-emergency-vehicle-controller-signal-override-decision.md)
- [Tasks_041 — Yielding effect computation](Tasks_041-emergency-vehicle-controller-yielding-effect-computation.md)
- [Tasks_042 — Full acceptance test suite](Tasks_042-emergency-vehicle-controller-full-acceptance-tests.md)

### Phase 8: Metrics Collector
- [Tasks_043 — Initialize module structure](Tasks_043-metrics-collector-initialize-module-structure.md)
- [Tasks_044 — Average speed formula](Tasks_044-metrics-collector-average-speed-formula.md)
- [Tasks_045 — Rolling 60s throughput window](Tasks_045-metrics-collector-rolling-throughput-window.md)
- [Tasks_046 — Collision-free ratio (time-based)](Tasks_046-metrics-collector-collision-free-ratio.md)
- [Tasks_047 — Full test suite and MF-001 formula sign-off](Tasks_047-metrics-collector-full-test-suite-mf001-signoff.md)

### Phase 9: Rendering Engine
- [Tasks_048 — Initialize Canvas 2D module](Tasks_048-rendering-engine-initialize-canvas-module.md)
- [Tasks_049 — Vehicle rendering with interpolation](Tasks_049-rendering-engine-vehicle-rendering-interpolation.md)
- [Tasks_050 — Signal state rendering](Tasks_050-rendering-engine-signal-state-rendering.md)
- [Tasks_051 — Emergency vehicle visual markers](Tasks_051-rendering-engine-emergency-visual-markers.md)
- [Tasks_052 — Conflict zone visualization](Tasks_052-rendering-engine-conflict-zone-visualization.md)

### Phase 10: UI Controller
- [Tasks_053 — Initialize DOM scaffolding](Tasks_053-ui-controller-initialize-dom-scaffolding.md)
- [Tasks_054 — Scenario preset dropdown](Tasks_054-ui-controller-scenario-preset-dropdown.md)
- [Tasks_055 — Frame rate / signal mode / lane strategy controls](Tasks_055-ui-controller-frame-rate-signal-mode-lane-strategy-controls.md)
- [Tasks_056 — Per-direction traffic sliders](Tasks_056-ui-controller-per-direction-traffic-sliders.md)
- [Tasks_057 — Independent emergency vehicle sliders](Tasks_057-ui-controller-independent-emergency-sliders.md)
- [Tasks_058 — Simulation playback controls](Tasks_058-ui-controller-simulation-playback-controls.md)
- [Tasks_059 — Run-state control locking](Tasks_059-ui-controller-run-state-control-locking.md)

### Phase 11: State Display Panels
- [Tasks_060 — Configuration Panel](Tasks_060-state-display-configuration-panel.md)
- [Tasks_061 — Traffic Metrics Panel](Tasks_061-state-display-traffic-metrics-panel.md)
- [Tasks_062 — Signal Status Panel](Tasks_062-state-display-signal-status-panel.md)
- [Tasks_063 — Collision Statistics Panel](Tasks_063-state-display-collision-statistics-panel.md)
- [Tasks_064 — Performance Metrics Panel](Tasks_064-state-display-performance-metrics-panel.md)

### Phase 12: Telemetry / Logging
- [Tasks_065 — Initialize logging module](Tasks_065-telemetry-initialize-logging-module.md)
- [Tasks_066 — Wire deadlock and collision event logging](Tasks_066-telemetry-wire-deadlock-collision-event-logging.md)

### Phase 13: Integration & System Tests
- [Tasks_067 — Wire all components in Simulation Orchestrator](Tasks_067-integration-wire-all-components.md)
- [Tasks_068 — Mode A full scenario (10-minute run)](Tasks_068-system-test-mode-a-full-scenario.md)
- [Tasks_069 — Mode B full scenario with collision prevention](Tasks_069-system-test-mode-b-full-scenario-collision-prevention.md)
- [Tasks_070 — Emergency vehicle scenario (Priority Operations preset)](Tasks_070-system-test-emergency-vehicle-scenario.md)
- [Tasks_071 — Stress test (150+ vehicles at 60 FPS)](Tasks_071-system-test-stress-test-150-vehicles.md)
- [Tasks_072 — Cross-frame-rate determinism validation](Tasks_072-system-test-cross-frame-rate-determinism.md)

## Traceability Matrix

| Requirement | Tasks |
| --- | --- |
| 001-scope-and-non-scope | 001, 033, 067 |
| REQ-005 (Signal Coordination) | 016, 017, 018, 019, 020, 021, 050, 055, 062, 065, 068, 069 |
| REQ-007 (Lane Selection) | 002, 011, 028, 029, 030, 031, 032, 055 |
| REQ-020 (Configurable Frame Rate) | 002, 010, 011, 012, 013, 014, 015, 048, 049, 055, 071, 072 |
| REQ-NEW-E1 (Emergency Types) | 002, 038, 039, 042, 070 |
| REQ-NEW-E2 (Visual Markers) | 051 |
| REQ-NEW-E3 (Signal Override) | 040, 042, 070 |
| REQ-NEW-E4 (Yielding Behavior) | 041, 042, 070 |
| REQ-NEW-E5 (Emergency Spawn Rate) | 039, 042, 057, 070 |
| REQ-NEW-COLLISION-PREVENTION-1 | 022–027, 034, 035, 037, 052, 065, 066, 069, 071 |
| REQ-027 (UI Controls) | 004–009, 053–059 |
| REQ-028 (State Display) | 008, 043–047, 050, 060–064 |
| BF-002 (Numbering Scheme) | (Documentation-only; no implementation task — see ADR-009) |
| BF-003 (Deadlock Semantics) | 025, 026, 027, 066, 069 |
| MF-001 (Metric Calculations) | 044, 045, 046, 047 |
| MF-002 (Spawn Collision Handling) | 029, 039 |
| MF-005 (Scenario Presets) | 007, 054 |
| MF-006 (Emergency UI Consistency) | 009, 057 |
| NF-001 (Speed Unit Consistency) | 011 |
| NF-003 (Parameter Constraints Documentation) | 005 |

## Sign-Off

| Role | Status |
| --- | --- |
| Requirements Engineer | ⏳ PENDING |
| System Architect | ⏳ PENDING |
| QA Lead | ⏳ PENDING |

**Next Phase**: Step 6 — Implement Task (start with [Tasks_001](Tasks_001-project-initialize-repository-scaffolding.md), the only task with no dependencies)
