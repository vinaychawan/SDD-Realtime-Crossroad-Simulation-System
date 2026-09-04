---
adr_id: ADR-001
title: Technology Stack Selection
status: PROPOSED
date: 2026-09-04
---

# ADR-001: Technology Stack Selection

**Status**: 🟡 PROPOSED
**Date**: 2026-09-04
**Deciders**: System Architect

---

## Context

The specification ([001-scope-and-non-scope](../../specs/requirements/001-scope-and-non-scope.md))
requires a real-time, top-down 2D traffic simulation with:
- A fixed-rate physics core (100 Hz) decoupled from a configurable render rate (30/60 FPS) — [REQ-020](../../specs/requirements/004-REQ-020-configurable-frame-rate.md)
- Interactive UI controls (dropdowns, radio buttons, sliders, playback buttons) — [REQ-027](../../specs/requirements/011-REQ-027-ui-controls.md)
- Real-time metrics/state display panels — [REQ-028](../../specs/requirements/012-REQ-028-state-display.md)

No existing codebase or technology commitment exists in this repository. The repository's
`README.md` lists "Node.js 18+ (or your project's runtime)" as the only generic prerequisite.

## Decision

Adopt **TypeScript** as the implementation language, targeting a **browser runtime** for the
interactive application and **Node.js** for headless/deterministic test execution, rendering
via **HTML5 Canvas 2D**.

## Options Considered

| Option | Pros | Cons |
| --- | --- | --- |
| **A: TypeScript + Canvas 2D (browser)** ✅ selected | Native UI controls via DOM/HTML; no engine dependency; Canvas 2D is more than sufficient for a top-down 2D view; TypeScript's static typing suits the many enums/state machines in this domain (signal states, vehicle types, strategies); easy to headless-test with Node.js + jsdom or a Canvas shim | Manual rendering code (no engine conveniences) |
| **B: Game engine (Unity/Godot)** | Built-in rendering, physics, editor tooling | Massive overkill for a 2D top-down simulation with simple kinematics; introduces engine-specific build/test pipeline that conflicts with the repo's plain Node.js prerequisite; harder to unit-test business logic in isolation from the engine |
| **C: Python + Pygame** | Simple scripting, common in simulation prototypes | Weaker static typing for a spec with many enumerated states/strategies; UI controls (sliders, dropdowns) require a separate GUI toolkit (Pygame has no native widgets); repository already anchors tooling on Node.js |

## Rationale

- TypeScript's discriminated unions map directly onto the specification's finite enumerations
  (`SignalState`, `EmergencyVehicleType`, `LaneSelectionStrategyKind`), giving compile-time
  exhaustiveness checks — directly supporting the specification's "no inferred behavior" quality bar.
- Canvas 2D avoids introducing a 3D/game-engine dependency for what is explicitly a 2D,
  non-photorealistic simulation (001-scope-and-non-scope explicitly excludes advanced visual
  fidelity concerns like weather/night-driving).
- A single-language stack (TypeScript for simulation core, UI, and tests) minimizes
  cross-language marshaling overhead in the 100 Hz physics path.

## Consequences

- (+) One language across simulation core, UI, and test suite.
- (+) Runs identically in Node.js (deterministic headless tests, per REQ-020's determinism
  acceptance criteria) and in-browser (interactive use).
- (-) Rendering code (Canvas drawing) must be hand-written; no built-in scene graph.
- (-) Requires a bundler (e.g., esbuild/Vite) for browser delivery — to be finalized in the
  task-breakdown phase, not this ADR.

## Traceability

```
REQ-020 (configurable frame rate, decoupled physics)
→ ADR-001: TypeScript + Canvas 2D
→ Component: Rendering Engine, Simulation Orchestrator
```
