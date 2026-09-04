// Collision Detection System public contract (TASK-033).
// Mirrors docs/INTERFACES.md §8.
import type { VehicleId, VehicleState, Vector2 } from '../../domain/types';

export interface CollisionEvent {
  readonly vehicleIds: [VehicleId, VehicleId] | [VehicleId, 'INFRASTRUCTURE'];
  readonly position: Vector2;
  readonly timestampMs: number;
}

export interface ICollisionDetectionSystem {
  /** Broad-phase (spatial grid) + narrow-phase (AABB) check, run every physics tick. */
  tick(vehicles: VehicleState[]): CollisionEvent[];

  onCollision(listener: (event: CollisionEvent) => void): void;
}
