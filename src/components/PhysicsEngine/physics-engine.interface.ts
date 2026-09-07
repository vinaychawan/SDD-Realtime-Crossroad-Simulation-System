// Internal contract for the Physics Engine (TASK-010).
// Physics Engine has no dedicated numbered section in docs/INTERFACES.md (it is not a public,
// cross-component contract like Configuration Manager) — see docs/ARCHITECTURE.md §3.2 for its
// documented responsibility: "Advances vehicle kinematics ... deterministic given identical
// inputs regardless of render rate." This file is the internal contract referenced by TASK-010's
// acceptance criterion ("IPhysicsEngine-equivalent internal interface defined").
import type { VehicleState } from '../../domain/types';

/** Fixed physics tick period in milliseconds — the 100 Hz invariant (REQ-020, ADR-002). */
export const PHYSICS_TICK_MS = 10;

export interface IPhysicsEngine {
  /**
   * Advances one vehicle's position by its current `speedMs` over exactly one fixed-timestep
   * tick, and re-derives `speedKmh` from `speedMs` (NF-001 unit-consistency invariant).
   * Pure and deterministic: identical (vehicle, deltaMs) input always yields identical output —
   * no hidden/mutable engine state, no wall-clock or RNG dependence.
   * @param deltaMs must be exactly {@link PHYSICS_TICK_MS} (10ms). The engine never operates on
   *   a variable timestep; the fixed-100Hz-tick / never-skip invariant is enforced by the caller
   *   (Simulation Orchestrator's accumulator loop, TASK-013) invoking `tick()` once per accumulated
   *   10ms of elapsed time, independent of render frame rate (30/60 FPS).
   * @throws {RangeError} if deltaMs !== PHYSICS_TICK_MS.
   */
  tick(vehicle: VehicleState, deltaMs: number): VehicleState;
}
