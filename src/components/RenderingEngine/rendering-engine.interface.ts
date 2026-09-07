// Rendering Engine public contract (TASK-048).
// Mirrors docs/INTERFACES.md §10.
import type { Direction, SignalDirectionState, VehicleId, VehicleState } from '../../domain/types';

export interface IRenderer {
  /** Draws one frame from the latest interpolated physics snapshot. Never mutates state. */
  renderFrame(
    vehicles: VehicleState[],
    signals: Record<Direction, SignalDirectionState>,
    conflictZoneOccupants: VehicleId[]
  ): void;
}
