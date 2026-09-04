---
adr_id: ADR-007
title: Configuration Manager and Scenario Preset Architecture
status: PROPOSED
date: 2026-09-04
---

# ADR-007: Configuration Manager and Scenario Preset Architecture

**Status**: 🟡 PROPOSED
**Date**: 2026-09-04
**Deciders**: System Architect

---

## Context

[REQ-027](../../specs/requirements/011-REQ-027-ui-controls.md) requires a UI exposing 5
scenario presets, frame rate/signal-mode/lane-strategy selection, per-direction sliders, and
emergency controls, with different fields editable depending on run state (configuration vs.
running vs. paused). [MF-005](../../specs/major/MF-005-scenario-preset-completeness.md)
identified that the presets' full parameter sets (signal mode, lane strategy, exact spawn
rate units) were incomplete in the original specification. [MF-006](../../specs/major/MF-006-emergency-ui-consistency.md)
identified ambiguity between a single emergency-type dropdown and independent per-type
controls, given REQ-NEW-E5 requires independent rates per type.

## Decision

1. A single **Configuration Manager** component owns the canonical `SimulationConfig` object
   tree ([INTERFACES.md §3](../INTERFACES.md#3-configuration-manager)) — the UI Controller
   never holds simulation state itself; it only reads/writes through this manager.
2. **MF-005 resolution**: `applyScenarioPreset()` populates **every** field of
   `SimulationConfig` (frame rate, signal mode, lane strategy, per-direction spawn/timing,
   emergency rates) — no field is left "unspecified" by a preset. The exhaustive value table
   lives in Configuration Manager's preset data, not scattered across UI code.
3. **MF-006 resolution**: adopt **Option A — three independent per-type sliders**
   (`emergency.spawnRatePerMinute: Record<EmergencyVehicleType, number>`) rather than a single
   dropdown + shared rate. This directly matches REQ-NEW-E5's requirement for independent
   configuration per type and avoids a UI model that structurally cannot represent, e.g.,
   "5 ambulances/min and 2 fire brigades/min simultaneously."
4. Startup-only fields (`signalCoordinationMode`, `laneSelectionStrategy`) are enforced
   centrally in Configuration Manager via `StartupOnlyFieldError`, not duplicated in the UI
   Controller — the UI merely reflects the manager's rejection by locking the corresponding
   control.

## Options Considered (emergency UI model, from MF-006)

| Option | Pros | Cons |
| --- | --- | --- |
| **A: Three independent sliders** ✅ selected | Structurally matches REQ-NEW-E5; all valid configurations are representable; no hidden state | Slightly more UI surface (3 sliders vs. 1 dropdown + 1 slider) |
| **B: Single dropdown + one shared rate slider** | Simpler UI | Cannot represent independent per-type rates (contradicts REQ-NEW-E5 directly) |
| **C: Hybrid advanced/simple toggle** | Best of both for different user skill levels | Adds a second UI mode to build and test for marginal benefit at v0.2.0 scope |

## Rationale

Option A is the only option that does not contradict an already-approved requirement
(REQ-NEW-E5). Centralizing preset data and startup-only validation in Configuration Manager
(rather than the UI layer) ensures headless/test-driven scenario setup (e.g., for automated
acceptance tests) uses the exact same validated path as interactive UI use — there is no
"UI-only" validation logic that a test harness could bypass or diverge from.

## Consequences

- (+) Scenario presets are single-sourced and exhaustively defined; UI cannot show a
  "partially populated" preset.
- (+) MF-006's three-slider model is directly testable via `IConfigurationManager.update()`
  without any UI involvement.
- (-) UI Controller must render three sliders (and hide/show them based on
  `emergency.enabled`) rather than a simpler single dropdown.

## Traceability

```
REQ-027 (UI controls) + MF-005 (preset completeness) + MF-006 (emergency UI model)
→ ADR-007: Configuration Manager with exhaustive presets, three independent emergency sliders
→ Component: Configuration Manager, UI Controller
```
