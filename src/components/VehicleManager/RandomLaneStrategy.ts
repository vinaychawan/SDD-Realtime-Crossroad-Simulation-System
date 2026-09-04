// Random Lane Selection Strategy (TASK-030).
// REQ-007, ADR-005: Assigns uniformly random lane at spawn, no lane changes.
import type { VehicleState } from '../../domain/types';
import type { ILaneSelectionStrategy } from './vehicle-manager.interface';

/**
 * TASK-030: Uniform random lane selection.
 * - Called once per vehicle at spawn time
 * - Returns random lane (1-3) with equal probability
 * - No lane changes after initial assignment
 * - Statistical acceptance: 27-37% distribution per lane over 300+ samples
 */
export class RandomLaneStrategy implements ILaneSelectionStrategy {
  readonly kind: 'RANDOM' = 'RANDOM';

  /**
   * Selects a uniformly random lane.
   * @param _vehicle Vehicle requesting lane assignment (unused for RANDOM strategy)
   * @param _trafficState All active vehicles (unused for RANDOM strategy)
   * @returns Random lane (1, 2, or 3)
   */
  selectLane(_vehicle: VehicleState, _trafficState: VehicleState[]): 1 | 2 | 3 {
    // Ignore both parameters; pure random selection
    const lanes: (1 | 2 | 3)[] = [1, 2, 3];
    const randomIndex = Math.floor(Math.random() * lanes.length);
    return lanes[randomIndex];
  }
}
