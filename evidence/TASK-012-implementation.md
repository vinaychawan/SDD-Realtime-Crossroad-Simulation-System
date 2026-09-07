## TASK-012 Implementation Evidence

**Date**: 2026-09-04
**Developer**: GitHub Copilot (agent)
**Code Review**: pending

### Linked Requirements
- [REQ-020](../specs/requirements/004-REQ-020-configurable-frame-rate.md)

### Linked ADR
- [ADR-002-fixed-timestep-loop](../docs/ADRs/ADR-002-fixed-timestep-loop.md)

### Acceptance Criteria Status
- ✓ Module structure created at `src/components/SimulationOrchestrator/`
- ✓ `ISimulationOrchestrator` interface implemented matching [INTERFACES.md §2](../docs/INTERFACES.md#2-simulation-orchestrator) (`start`, `pause`, `reset`, `setTargetFrameRate`, `getPhysicsTickRate`, `getRenderFrameRate`)
- ✓ Precondition check: `start()` throws if no valid `SimulationConfig` is set

### Code Changes
- `src/components/SimulationOrchestrator/simulation-orchestrator.interface.ts` (new) — `ISimulationOrchestrator`, mirroring INTERFACES.md §2 verbatim (6 methods, no additions).
- `src/components/SimulationOrchestrator/SimulationOrchestrator.ts` (new) — concrete class. Beyond the public interface (documented as intentional extensions, same pattern as `ConfigurationManager.setRunState()`/`getRunState()` in TASK-006): `setConfigurationManager()`, `getPhysicsEngine()`, `onPhysicsTick()`, `onRenderFrame()`, `isRunning()`, `getTargetFrameRate()`. `IConfigurationManager` is optional at construction (attachable later via `setConfigurationManager()`); `start()` throws `InvalidConfigurationError` if no config manager has been attached by the time it is called — this is TASK-012's precondition check. (The full accumulator loop, catch-up cap, and frame-rate limiter bodies are also present in this file since the class is built once and tested incrementally per task, matching the Configuration Manager precedent from TASK-004–009; their behavior is verified by TASK-013/014's evidence, not this one.)
- `src/components/SimulationOrchestrator/README.md` (new) — responsibility, 100 Hz / never-skip-a-tick contract, file map, precondition contract, non-goals.
- `src/components/SimulationOrchestrator/Test_012-simulation-orchestrator-initialize-module-structure.test.ts` (new, 10 tests) — `ISimulationOrchestrator` shape check, `start()` precondition (throws without a config manager, succeeds via constructor injection, succeeds via `setConfigurationManager()`), no-op-if-already-running, zero-rate defaults before any ticks, `getPhysicsEngine()`/`getTargetFrameRate()` extension getters, README content assertions, no-`any` static check.

### Design Note: why `IPhysicsEngine`/`IConfigurationManager` are constructor dependencies but not owned
Per `docs/ARCHITECTURE.md` §3.2, the orchestrator "ticks Physics Engine... schedules render callbacks" but does not own the vehicle list (a later Vehicle Manager component does, not yet implemented in this phase). Rather than couple the orchestrator to a concrete vehicle collection that doesn't exist yet, it exposes `onPhysicsTick()`/`onRenderFrame()` hooks so any collaborator (a test, or the future Vehicle Manager) can drive the shared, injected `IPhysicsEngine` instance (`getPhysicsEngine()`) on every fixed 10ms step.

### Build Evidence
```
$ npm run build
✓ built in 292ms
```
0 TypeScript errors.

### Test Results
```
$ npm run test:coverage
 ✓ src/components/SimulationOrchestrator/Test_012-simulation-orchestrator-initialize-module-structure.test.ts (10 tests)

 Test Files  18 passed (18)
      Tests  117 passed (117)
```
`SimulationOrchestrator.ts`: 100% statement/branch/function/line coverage (whole-module figure, combining TASK-012–015 test files).

### Verification
- [x] Builds without warnings
- [x] All tests pass
- [x] `ISimulationOrchestrator` matches INTERFACES.md §2 exactly (method names/signatures reviewed side by side)
- [x] Precondition check verified for both attachment paths (constructor dep, `setConfigurationManager()`) and the unattached-throws case
