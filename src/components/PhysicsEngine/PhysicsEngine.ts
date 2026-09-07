// Concrete IPhysicsEngine implementation (TASK-010/011).
import type { Direction, Vector2, VehicleState } from '../../domain/types';
import { speedMsToKmh } from '../../domain/unitConversion';
import { PHYSICS_TICK_MS, type IPhysicsEngine } from './physics-engine.interface';

// A vehicle's `direction` field is the approach it entered from; it travels from that approach
// toward and through the intersection center. No ADR/spec formalizes intersection geometry yet
// (Vehicle Manager / Conflict Zone Manager, TASK-022+/028+, own lane geometry in detail) — this is
// the minimal, explicit, documented assumption needed for deterministic straight-line kinematics
// at this stage. Revisit here if a future task formalizes turning/curved paths.
const TRAVEL_UNIT_VECTOR: Record<Direction, Vector2> = {
  NORTH: { x: 0, y: 1 },
  SOUTH: { x: 0, y: -1 },
  EAST: { x: 1, y: 0 },
  WEST: { x: -1, y: 0 }
};

export class PhysicsEngine implements IPhysicsEngine {
  tick(vehicle: VehicleState, deltaMs: number): VehicleState {
    if (deltaMs !== PHYSICS_TICK_MS) {
      throw new RangeError(
        `PhysicsEngine.tick() must be called with a fixed ${PHYSICS_TICK_MS}ms timestep, got ${deltaMs}ms`
      );
    }

    const dtSeconds = deltaMs / 1000;
    const unit = TRAVEL_UNIT_VECTOR[vehicle.direction];
    const position: Vector2 = {
      x: vehicle.position.x + unit.x * vehicle.speedMs * dtSeconds,
      y: vehicle.position.y + unit.y * vehicle.speedMs * dtSeconds
    };

    return {
      ...vehicle,
      position,
      speedKmh: speedMsToKmh(vehicle.speedMs)
    };
  }
}
