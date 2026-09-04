// Conflict Zone Manager public contract (TASK-022).
// Mirrors docs/INTERFACES.md §5 exactly.
import type { VehicleId, VehicleState, Vector2 } from '../../domain/types';

/** BF-003 recommended option; see ADR-004. */
export type DeadlockRecoveryProcedure = 'CONSERVATIVE';

export interface EntryDecision {
  readonly vehicleId: VehicleId;
  readonly decision: 'PROCEED' | 'STOP';
  readonly stopLinePosition?: Vector2;
}

/** REQ-NEW-COLLISION-PREVENTION-1, BF-003. */
export interface IConflictZoneManager {
  /** Called every physics tick for each vehicle within lookahead range (50 m) of the zone. */
  requestEntry(vehicle: VehicleState): EntryDecision;

  /** Called every physics tick to update occupancy as vehicles move through the zone. */
  updateOccupancy(vehicles: VehicleState[]): void;

  /** @returns vehicles currently occupying the conflict zone. */
  getOccupants(): VehicleState[];

  /**
   * @returns vehicles that have been waiting at the stop line longer than
   * `maxWaitSeconds` (default 5s), flagged for deadlock recovery.
   */
  getDeadlockedVehicles(): VehicleState[];

  /**
   * Applies the deadlock recovery procedure to a deadlocked vehicle:
   * CONSERVATIVE = forced exit at 50% speed with collision detection still active;
   * if a collision becomes imminent during recovery, the vehicle re-stops.
   * @postcondition vehicle either exits the zone or re-enters STOP state; never removed silently.
   * @emits DeadlockEvent to Telemetry.
   */
  applyDeadlockRecovery(vehicleId: VehicleId, procedure: DeadlockRecoveryProcedure): void;
}
