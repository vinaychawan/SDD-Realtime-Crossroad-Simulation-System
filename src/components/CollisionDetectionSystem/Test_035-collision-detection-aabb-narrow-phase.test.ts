// TASK-035 acceptance criteria:
// - AABB overlap checks for vehicle-vehicle and vehicle-infrastructure pairs
// - tick() returns all CollisionEvents detected within the current physics tick
// - Detection latency ≤100ms end-to-end
import { describe, expect, it } from 'vitest';
import { CollisionDetectionSystem } from './CollisionDetectionSystem';
import type { Direction, VehicleState } from '../../domain/types';

function vehicle(id: string, x: number, y: number, direction: Direction = 'NORTH'): VehicleState {
  return {
    id,
    direction,
    exitDirection: direction === 'NORTH' ? 'SOUTH' : 'NORTH',
    lane: 2,
    position: { x, y },
    speedKmh: 30,
    speedMs: 30 / 3.6,
    isEmergency: false,
    yieldingActive: false
  };
}

describe('TASK-035: Collision Detection AABB narrow phase', () => {
  it('detects overlapping vehicle-vehicle AABBs', () => {
    const system = new CollisionDetectionSystem({ infrastructureBoundaryMeters: 10_000 });

    const events = system.tick([vehicle('v1', 0, 0), vehicle('v2', 0.5, 0.5)]);

    expect(events).toHaveLength(1);
    expect(events[0].vehicleIds).toEqual(['v1', 'v2']);
    expect(events[0].position).toEqual({ x: 0.25, y: 0.25 });
  });

  it('does not detect collision for separated AABBs on the x axis', () => {
    const system = new CollisionDetectionSystem({ infrastructureBoundaryMeters: 10_000 });

    const events = system.tick([vehicle('v1', 0, 0), vehicle('v2', 10, 0)]);

    expect(events).toEqual([]);
    expect(system.getLastBroadPhaseCandidateCount()).toBe(1);
  });

  it('does not detect collision for separated AABBs on the y axis', () => {
    const system = new CollisionDetectionSystem({ infrastructureBoundaryMeters: 10_000 });

    const events = system.tick([vehicle('v1', 0, 0), vehicle('v2', 0, 10)]);

    expect(events).toEqual([]);
    expect(system.getLastBroadPhaseCandidateCount()).toBe(1);
  });

  it('treats edge-touching AABBs as contact collision', () => {
    const system = new CollisionDetectionSystem({ infrastructureBoundaryMeters: 10_000 });

    // NORTH/SOUTH vehicles are 4.5m long, so centers 4.5m apart touch at one edge.
    const events = system.tick([vehicle('v1', 0, 0), vehicle('v2', 0, 4.5)]);

    expect(events).toHaveLength(1);
    expect(events[0].position).toEqual({ x: 0, y: 2.25 });
  });

  it('accounts for vehicle orientation when computing AABBs', () => {
    const system = new CollisionDetectionSystem({ infrastructureBoundaryMeters: 10_000 });

    // EAST/WEST vehicles are long on x axis and should collide at x separation 4m.
    const eastWestEvents = system.tick([vehicle('east-a', 0, 0, 'EAST'), vehicle('east-b', 4, 0, 'WEST')]);
    // NORTH/SOUTH vehicles are narrow on x axis and should not collide at x separation 4m.
    const northSouthEvents = system.tick([vehicle('north-a', 0, 0, 'NORTH'), vehicle('north-b', 4, 0, 'SOUTH')]);

    expect(eastWestEvents).toHaveLength(1);
    expect(northSouthEvents).toEqual([]);
  });

  it('returns all collisions detected within the same physics tick', () => {
    const system = new CollisionDetectionSystem({ infrastructureBoundaryMeters: 10_000 });

    const events = system.tick([
      vehicle('a1', 0, 0),
      vehicle('a2', 0, 0),
      vehicle('b1', 40, 40),
      vehicle('b2', 40.5, 40.5)
    ]);

    expect(events.map((event) => event.vehicleIds)).toEqual([
      ['a1', 'a2'],
      ['b1', 'b2']
    ]);
    expect(events.every((event) => event.timestampMs === 0)).toBe(true);
  });

  it('detects vehicle-infrastructure collisions on every boundary side', () => {
    const system = new CollisionDetectionSystem({ infrastructureBoundaryMeters: 75 });

    const events = system.tick([
      vehicle('left', -80, 0),
      vehicle('right', 80, 0),
      vehicle('bottom', 0, -80),
      vehicle('top', 0, 80),
      vehicle('inside', 0, 0)
    ]);

    expect(events.map((event) => event.vehicleIds)).toEqual([
      ['left', 'INFRASTRUCTURE'],
      ['right', 'INFRASTRUCTURE'],
      ['bottom', 'INFRASTRUCTURE'],
      ['top', 'INFRASTRUCTURE']
    ]);
  });

  it('advances event timestamps by one physics tick per call', () => {
    const system = new CollisionDetectionSystem({ infrastructureBoundaryMeters: 10_000, tickDurationMs: 10 });

    const first = system.tick([vehicle('v1', 0, 0), vehicle('v2', 0, 0)]);
    const second = system.tick([vehicle('v1', 0, 0), vehicle('v2', 0, 0)]);

    expect(first[0].timestampMs).toBe(0);
    expect(second[0].timestampMs).toBe(10);
  });

  it('detects a collision with latency ≤100ms', () => {
    const system = new CollisionDetectionSystem({ infrastructureBoundaryMeters: 10_000 });
    const startedAt = performance.now();

    const events = system.tick([vehicle('v1', 0, 0), vehicle('v2', 0.1, 0.1)]);
    const elapsedMs = performance.now() - startedAt;

    expect(events).toHaveLength(1);
    expect(elapsedMs).toBeLessThanOrEqual(100);
  });
});
