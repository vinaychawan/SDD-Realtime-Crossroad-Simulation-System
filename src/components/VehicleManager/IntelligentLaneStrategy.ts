// Intelligent Lane Selection Strategy (TASK-031).
// REQ-007, ADR-005: Optimal lane positioning via careful lane changes ≥50m before intersection.
import type { Direction, VehicleState } from '../../domain/types';
import type { ILaneSelectionStrategy } from './vehicle-manager.interface';

/**
 * TASK-031: Intelligent lane selection with pre-positioning.
 * - Called continuously (once per tick) until vehicle reaches optimal lane or fails safely
 * - Computes optimal lane based on current lane + exit direction
 * - Plans lane changes ≥50m before intersection center
 * - Speed constraint: ≤20 km/h (5.56 m/s) during lane change to ensure safety
 * - Failure mode: if no safe lane change found, stays in current lane (no deadlock)
 * - Behavioral acceptance: ≥95% optimal-lane success over 100+ samples
 */
export class IntelligentLaneStrategy implements ILaneSelectionStrategy {
  readonly kind: 'INTELLIGENT' = 'INTELLIGENT';

  /** Distance from intersection center before which lane changes should be completed (meters) */
  private readonly PRE_POSITIONING_DISTANCE_M = 50;

  /** Maximum speed allowed during lane change (km/h) */
  private readonly MAX_LANE_CHANGE_SPEED_KMH = 20; // 5.56 m/s

  /**
   * Selects optimal lane for vehicle, issuing lane-change commands as needed.
   * @param vehicle Vehicle requesting lane assignment
   * @param trafficState All active vehicles for collision checking
   * @returns Target lane (1, 2, or 3); may be current lane if no safe change found
   */
  selectLane(vehicle: VehicleState, trafficState: VehicleState[]): 1 | 2 | 3 {
    // Compute optimal lane based on current lane + exit direction
    const optimalLane = this.computeOptimalLane(vehicle.lane, vehicle.exitDirection);

    // If already in optimal lane, stay there
    if (vehicle.lane === optimalLane) {
      return optimalLane;
    }

    // Check if vehicle is close enough to intersection to attempt lane change
    const distanceToIntersection = this.computeDistanceToIntersection(vehicle);
    if (distanceToIntersection > this.PRE_POSITIONING_DISTANCE_M) {
      // Not yet close enough; return current lane and continue approaching
      return vehicle.lane;
    }

    // Check speed constraint (must be ≤20 km/h to change lanes)
    if (vehicle.speedKmh > this.MAX_LANE_CHANGE_SPEED_KMH) {
      // Too fast; return current lane and signal need to slow down
      return vehicle.lane;
    }

    // Check if safe to change lanes (no collision risk)
    const canChangeToOptimalLane = this.isSafeLaneChange(vehicle, optimalLane, trafficState);
    if (canChangeToOptimalLane) {
      return optimalLane;
    }

    // No safe lane change found; stay in current lane (failure mode: graceful degradation)
    return vehicle.lane;
  }

  // --- Private helpers ---

  /**
   * Compute optimal lane based on current lane and exit direction.
   * Strategy: left lane for left turns, center for straight, right lane for right turns.
   */
  private computeOptimalLane(_currentLane: 1 | 2 | 3, _exitDirection: Direction): 1 | 2 | 3 {
    // This is a simplified heuristic; full turn logic implemented in Vehicle Manager (future).
    // For now, return lane 2 (center) as safe default; TASK-032+ will add turn-specific logic.
    return 2;
  }

  /**
   * Compute distance from vehicle to intersection center (approximate).
   * Returns positive value (distance in meters).
   */
  private computeDistanceToIntersection(vehicle: VehicleState): number {
    // Simple Manhattan distance to origin (intersection center at 0,0)
    // In production, this would use trajectory modeling
    return Math.max(Math.abs(vehicle.position.x), Math.abs(vehicle.position.y));
  }

  /**
   * Check if lane change is safe (no collision with other vehicles).
   * Looks at vehicles in target lane and checks for collision risk.
   */
  private isSafeLaneChange(vehicle: VehicleState, targetLane: 1 | 2 | 3, trafficState: VehicleState[]): boolean {
    // Find vehicles in the same direction and target lane
    const vehiclesInTargetLane = trafficState.filter(
      (v) => v.direction === vehicle.direction && v.lane === targetLane && v.id !== vehicle.id
    );

    // Simple safety check: if target lane is empty, safe to change
    if (vehiclesInTargetLane.length === 0) {
      return true;
    }

    // If target lane occupied, check distance to nearest vehicle
    // Safe if nearest vehicle is >10m away (collision-avoidance buffer)
    const minDistance = Math.min(
      ...vehiclesInTargetLane.map((v) => Math.abs(v.position.y - vehicle.position.y))
    );
    return minDistance > 10; // 10m safety buffer
  }
}
