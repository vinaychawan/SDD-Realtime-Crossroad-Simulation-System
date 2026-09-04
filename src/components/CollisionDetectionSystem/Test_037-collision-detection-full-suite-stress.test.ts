// TASK-037 acceptance criteria:
// - Stress test with 150+ vehicles maintains ≤100ms latency and no missed collisions
// - ≥90% statement coverage for CollisionDetectionSystem
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
    speedKmh: 40,
    speedMs: 40 / 3.6,
    isEmergency: false,
    yieldingActive: false
  };
}

function collisionPairs(pairCount: number): VehicleState[] {
  const vehicles: VehicleState[] = [];
  for (let pairIndex = 0; pairIndex < pairCount; pairIndex++) {
    const x = (pairIndex % 20) * 35;
    const y = Math.floor(pairIndex / 20) * 35;
    vehicles.push(vehicle(`pair-${pairIndex}-a`, x, y));
    vehicles.push(vehicle(`pair-${pairIndex}-b`, x + 0.25, y + 0.25));
  }
  return vehicles;
}

describe('TASK-037: Collision Detection full test suite and stress validation', () => {
  it('stress test: 160 vehicles maintain ≤100ms detection latency with no missed synthetic collisions', () => {
    const system = new CollisionDetectionSystem({ infrastructureBoundaryMeters: 10_000 });
    const vehicles = collisionPairs(80);
    const startedAt = performance.now();

    const events = system.tick(vehicles);
    const elapsedMs = performance.now() - startedAt;

    expect(vehicles).toHaveLength(160);
    expect(events).toHaveLength(80);
    expect(elapsedMs).toBeLessThanOrEqual(100);
  });

  it('stress test: broad phase candidate count remains far below full-pair scan', () => {
    const system = new CollisionDetectionSystem({ infrastructureBoundaryMeters: 10_000 });
    const vehicles = collisionPairs(80);
    const fullPairCount = (vehicles.length * (vehicles.length - 1)) / 2;

    system.tick(vehicles);

    expect(system.getLastBroadPhaseCandidateCount()).toBeLessThan(fullPairCount / 10);
    expect(system.getLastBroadPhaseCandidateCount()).toBeGreaterThanOrEqual(80);
  });

  it('repeated 100Hz ticks maintain event sequence determinism', () => {
    const system = new CollisionDetectionSystem({ infrastructureBoundaryMeters: 10_000 });
    const timestamps: number[] = [];

    for (let tick = 0; tick < 10; tick++) {
      const events = system.tick([vehicle('v1', 0, 0), vehicle('v2', 0, 0)]);
      timestamps.push(events[0].timestampMs);
    }

    expect(timestamps).toEqual([0, 10, 20, 30, 40, 50, 60, 70, 80, 90]);
  });

  it('handles a mixed synthetic scenario with vehicle and infrastructure events', () => {
    const system = new CollisionDetectionSystem({ infrastructureBoundaryMeters: 75 });

    const events = system.tick([
      vehicle('collision-a', 0, 0),
      vehicle('collision-b', 0.1, 0.1),
      vehicle('clear', 30, 30),
      vehicle('infra', 80, 0)
    ]);

    expect(events.map((event) => event.vehicleIds)).toEqual([
      ['collision-a', 'collision-b'],
      ['infra', 'INFRASTRUCTURE']
    ]);
  });

  it('returns no false positives for 150 non-overlapping vehicles in adjacent traffic corridors', () => {
    const system = new CollisionDetectionSystem({ infrastructureBoundaryMeters: 10_000 });
    const vehicles = Array.from({ length: 150 }, (_, index) => {
      const x = (index % 10) * 12;
      const y = Math.floor(index / 10) * 12;
      return vehicle(`clear-${index}`, x, y, index % 2 === 0 ? 'NORTH' : 'EAST');
    });

    const events = system.tick(vehicles);

    expect(events).toEqual([]);
    expect(system.getLastBroadPhaseCandidateCount()).toBeGreaterThan(0);
  });
});
