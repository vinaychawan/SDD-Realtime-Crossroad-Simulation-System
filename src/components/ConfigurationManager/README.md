# Configuration Manager

**Requirements**: REQ-027 (UI Controls / configuration surface), NF-003 (parameter constraint
documentation), MF-005 (exhaustive scenario presets), MF-006 (independent emergency spawn fields).
**ADR**: [ADR-007](../../../docs/ADRs/ADR-007-configuration-scenario-presets.md)
**Contract**: [docs/INTERFACES.md §3](../../../docs/INTERFACES.md#3-configuration-manager)

## Responsibility

Owns the single source of truth for `SimulationConfig` — the complete set of tunable
simulation parameters (scenario preset, frame rate, signal coordination mode, lane
selection strategy, per-direction spawn/signal timing, emergency vehicle spawn rates,
conflict zone geometry, simulation speed multiplier).

It is the only component allowed to mutate configuration state. All other components
(UI Controller, Simulation Orchestrator, Vehicle Manager, Signal Controller, etc.) read
configuration via `getSnapshot()` or react to changes via `onChange()`.

## Files

| File | Purpose |
| --- | --- |
| `configuration-manager.interface.ts` | `SimulationConfig`, `IConfigurationManager`, `ConfigRunState` — the public contract. |
| `validation.ts` | Field range/enum validation (TASK-005). Throws `InvalidConfigurationError`. |
| `scenarioPresets.ts` | Exhaustive parameter table for the 5 scenario presets (TASK-007, resolves MF-005). |
| `ConfigurationManager.ts` | Concrete `IConfigurationManager` implementation. |

## Key behaviors

- **Validation** (TASK-005): every `update()` call is validated against documented ranges
  before being applied; an invalid field throws `InvalidConfigurationError` and the
  previous configuration is retained unchanged (atomic update — no partial application).
- **Startup-only fields** (TASK-006): `signalCoordinationMode` and `laneSelectionStrategy`
  can only be changed while `ConfigRunState` is `CONFIGURATION_ACTIVE`. Attempting to
  change them while `RUNNING` or `PAUSED` throws `StartupOnlyFieldError`. The orchestrator
  informs this component of run-state transitions via `setRunState()` (wired in TASK-067).
- **Scenario presets** (TASK-007): `applyScenarioPreset()` fully populates every field —
  no partial or ambiguous state — per MF-005's parameter table. `CUSTOM` starts from the
  `NORMAL_TRAFFIC` baseline (all fields still defined) and is expected to be edited via
  subsequent `update()` calls.
- **Change notification** (TASK-008): `onChange()` listeners are invoked with a deeply
  frozen clone after every successful `update()`/`applyScenarioPreset()` — listeners can
  never mutate manager-internal state through the callback argument.

## Non-goals

- Does not know about vehicles, signals, or physics — pure configuration state.
- Does not persist configuration across page reloads (out of scope per specification).
