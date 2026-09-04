// TASK-033 acceptance criteria:
// - Module structure created at src/components/CollisionDetectionSystem/
// - ICollisionDetectionSystem interface implemented per INTERFACES.md §8
import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { CollisionEvent, ICollisionDetectionSystem } from './collision-detection-system.interface';
import { CollisionDetectionSystem } from './CollisionDetectionSystem';
import type { VehicleState } from '../../domain/types';

function vehicle(id: string, x: number, y: number): VehicleState {
  return {
    id,
    direction: 'NORTH',
    exitDirection: 'SOUTH',
    lane: 2,
    position: { x, y },
    speedKmh: 30,
    speedMs: 30 / 3.6,
    isEmergency: false,
    yieldingActive: false
  };
}

describe('TASK-033: Collision Detection module structure', () => {
  it('module directory contains the expected files', () => {
    const modulePath = 'src/components/CollisionDetectionSystem';
    expect(existsSync(join(process.cwd(), modulePath, 'CollisionDetectionSystem.ts'))).toBe(true);
    expect(existsSync(join(process.cwd(), modulePath, 'collision-detection-system.interface.ts'))).toBe(true);
  });

  it('CollisionDetectionSystem implements ICollisionDetectionSystem methods', () => {
    const system: ICollisionDetectionSystem = new CollisionDetectionSystem();
    expect(typeof system.tick).toBe('function');
    expect(typeof system.onCollision).toBe('function');
  });

  it('tick() returns CollisionEvent[] matching INTERFACES.md §8', () => {
    const system = new CollisionDetectionSystem();
    const events: CollisionEvent[] = system.tick([vehicle('v1', 0, 0), vehicle('v2', 0, 0)]);

    expect(events).toHaveLength(1);
    expect(events[0].vehicleIds).toEqual(['v1', 'v2']);
    expect(events[0].position).toEqual({ x: 0, y: 0 });
    expect(events[0].timestampMs).toBe(0);
  });

  it('onCollision() registers listeners without returning a promise', () => {
    const system = new CollisionDetectionSystem();
    const observed: CollisionEvent[] = [];

    const result = system.onCollision((event) => observed.push(event));
    system.tick([vehicle('v1', 0, 0), vehicle('v2', 0, 0)]);

    expect(result).toBeUndefined();
    expect(observed).toHaveLength(1);
  });

  it('tick() returns an empty array when no vehicles are present', () => {
    const system = new CollisionDetectionSystem();
    expect(system.tick([])).toEqual([]);
    expect(system.getLastBroadPhaseCandidateCount()).toBe(0);
    expect(system.getLastGridCellCount()).toBe(0);
  });
});
