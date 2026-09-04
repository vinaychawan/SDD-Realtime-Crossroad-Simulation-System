## TASK-006 Implementation Evidence

**Date**: 2026-09-04
**Developer**: GitHub Copilot (agent)
**Code Review**: pending

### Linked Requirements
- [REQ-005](../specs/requirements/002-REQ-005-signal-coordination.md): signal coordination mode must not change mid-run.
- [REQ-007](../specs/requirements/003-REQ-007-vehicle-lane-selection.md): lane selection strategy must not change mid-run.

### Linked ADR
- [ADR-003-signal-coordination-strategy](../docs/ADRs/ADR-003-signal-coordination-strategy.md)
- [ADR-005-lane-selection-strategy](../docs/ADRs/ADR-005-lane-selection-strategy.md)
- [ADR-007-configuration-scenario-presets](../docs/ADRs/ADR-007-configuration-scenario-presets.md)

### Acceptance Criteria Status
- ✓ `signalCoordinationMode` and `laneSelectionStrategy` are rejected with `StartupOnlyFieldError` when orchestrator run state is `RUNNING` or `PAUSED`
- ✓ Both fields remain editable when run state is `CONFIGURATION_ACTIVE`
- ✓ Unit test simulates a run-state transition and asserts rejection/acceptance in each state

### Code Changes
- `src/components/ConfigurationManager/configuration-manager.interface.ts` — added `ConfigRunState = 'CONFIGURATION_ACTIVE' | 'RUNNING' | 'PAUSED'`.
- `src/components/ConfigurationManager/ConfigurationManager.ts` — `setRunState()`/`getRunState()` (concrete-class-only methods, to be wired from the Simulation Orchestrator in TASK-067); `update()` checks a `STARTUP_ONLY_FIELDS` list (`signalCoordinationMode`, `laneSelectionStrategy`) and throws `StartupOnlyFieldError(field)` if the partial touches either field while `runState !== 'CONFIGURATION_ACTIVE'`, checked before range validation.
- `src/components/ConfigurationManager/ConfigurationManager.test.ts` — parameterized tests for `RUNNING`/`PAUSED` rejection of both fields, acceptance while `CONFIGURATION_ACTIVE`, a test proving other (non-startup-only) fields remain editable while `RUNNING`, and a transition test (`RUNNING` → rejected → back to `CONFIGURATION_ACTIVE` → accepted).

### Build Evidence
```
$ npm run build
✓ built in 552ms
```

### Test Results
```
$ npm run test:coverage
 ✓ src/components/ConfigurationManager/ConfigurationManager.test.ts (23)
```
Includes: `rejects signalCoordinationMode changes while RUNNING`, `...while PAUSED`, `rejects laneSelectionStrategy changes while RUNNING`, `...while PAUSED`, `still allows non-startup-only fields to change while RUNNING`, `re-allows startup-only field changes after returning to CONFIGURATION_ACTIVE` — all passing.

### Verification
- [x] Builds without warnings
- [x] All tests pass
- [x] Run-state transition test explicitly covers reject → allow after returning to `CONFIGURATION_ACTIVE`
