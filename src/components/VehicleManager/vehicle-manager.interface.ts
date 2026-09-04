// Vehicle Manager public contract (TASK-028).
// Mirrors docs/INTERFACES.md §6 exactly.
import type { Direction, VehicleId, VehicleState } from '../../domain/types';

/** Strategy Kind enum for lane selection. */
export type LaneSelectionStrategyKind = 'RANDOM' | 'INTELLIGENT';

/**
 * Lane selection strategy interface.
 * Implementations: RandomLaneStrategy, IntelligentLaneStrategy (ADR-005).
 */
export interface ILaneSelectionStrategy {
  readonly kind: LaneSelectionStrategyKind;

  /**
   * Called once at spawn time (RANDOM) or continuously until stabilized (INTELLIGENT).
   * @param vehicle Vehicle spawning or requesting lane assignment
   * @param trafficState All active vehicles for lane-change planning
   * @returns Target lane (1–3); for INTELLIGENT, may issue lane-change commands over
   *          several ticks rather than instantaneous change.
   */
  selectLane(vehicle: VehicleState, trafficState: VehicleState[]): 1 | 2 | 3;
}

/**
 * Vehicle Manager public contract.
 * Manages spawn/despawn with serialized ordering (MF-002), delegates lane selection to strategy.
 */
export interface IVehicleManager {
  /**
   * Spawns a regular vehicle at the given direction's entry point with specified exit direction.
   * @param direction Entry direction (NORTH, SOUTH, EAST, WEST)
   * @param exitDirection Vehicle's destination (one of NORTH, SOUTH, EAST, WEST)
   * @returns VehicleId of spawned vehicle
   * @throws {SpawnCapacityExceededError} if the entry queue is full (MF-002 serialized spawning)
   */
  spawnVehicle(direction: Direction, exitDirection: Direction): VehicleId;

  /**
   * Removes a vehicle once it exits the simulation boundary.
   * @param id VehicleId to despawn
   */
  despawnVehicle(id: VehicleId): void;

  /**
   * Returns all active vehicles (regular + emergency).
   * Used by Physics Engine, Metrics Collector, and lane-change planning.
   */
  getActiveVehicles(): VehicleState[];
}
