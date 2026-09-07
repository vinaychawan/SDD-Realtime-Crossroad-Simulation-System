# UI Controller

Implements TASK-053 through TASK-059: browser DOM scaffolding, scenario preset selection, core radio controls, per-direction traffic sliders, independent emergency vehicle sliders, playback controls, and run-state locking.

## Public API

- `IUIController.bind(configManager, orchestrator)` wires DOM controls to `IConfigurationManager` and `ISimulationOrchestrator`.
- `IUIController.setRunState(state)` applies REQ-027 control availability rules.

## Run-state behavior

- `CONFIGURATION_ACTIVE`: all controls editable.
- `RUNNING`: signal coordination mode and lane strategy radio groups are disabled; play is disabled and pause is enabled.
- `PAUSED`: configuration controls are editable again; play resumes the orchestrator.
