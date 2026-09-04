// TASK-034 acceptance criteria:
// - Spatial grid partitioning with cell size ≈ conflict-zone size (25m)
// - Broad phase reduces narrow-phase candidates to spatially-adjacent vehicles
// - 150+ vehicles processed without O(n²) full-pair scan
import { describe, expect, it } from 'vitest';
import { CollisionDetectionSystem } from './CollisionDetectionSystem';
import type { Direction, VehicleState } from '../../domain/types';

function vehicle(id: string, x: number, y: number, direction: Direction = 'NORTH'): VehicleState {
  return {
    id,
    direction,
    exitDirection: 'SOUTH',
    lane: 2,
    position: { x, y },
    speedKmh: 25,
    speedMs: 25 / 3.6,
    isEmergency: false,
    yieldingActive: false
  };
}

describe('TASK-034: Collision Detection spatial grid broad phase', () => {
  it('uses a default 25m spatial grid and separates distant vehicles into different cells', () => {
    const system = new CollisionDetectionSystem({ infrastructureBoundaryMeters: 10_000 });
    const vehicles = [vehicle('v1', 0, 0), vehicle('v2', 50, 0), vehicle('v3', 100, 0)];

    const events = system.tick(vehicles);

    expect(events).toEqual([]);
    expect(system.getLastGridCellCount()).toBeGreaterThanOrEqual(3);
    expect(system.getLastBroadPhaseCandidateCount()).toBe(0);
  });

  it('includes vehicles that share a spatial cell as candidate pairs', () => {
    const system = new CollisionDetectionSystem({ infrastructureBoundaryMeters: 10_000 });

    system.tick([vehicle('v1', 0, 0), vehicle('v2', 1, 1), vehicle('v3', 60, 60)]);

    expect(system.getLastBroadPhaseCandidateCount()).toBe(1);
  });

  it('deduplicates candidate pairs when large AABBs span multiple grid cells', () => {
    const system = new CollisionDetectionSystem({ vehicleLengthMeters: 60, vehicleWidthMeters: 60, infrastructureBoundaryMeters: 10_000 });

    const events = system.tick([vehicle('v1', 0, 0), vehicle('v2', 10, 10)]);

    expect(system.getLastGridCellCount()).toBeGreaterThan(1);
    expect(system.getLastBroadPhaseCandidateCount()).toBe(1);
    expect(events).toHaveLength(1);
  });

  it('processes 150+ vehicles without O(n²) full-pair scan', () => {
    const system = new CollisionDetectionSystem({ infrastructureBoundaryMeters: 10_000 });
    const vehicles = Array.from({ length: 150 }, (_, index) => {
      const x = (index % 15) * 40;
      const y = Math.floor(index / 15) * 40;
      return vehicle(`v${index}`, x, y);
    });
    const fullPairCount = (vehicles.length * (vehicles.length - 1)) / 2;

    const events = system.tick(vehicles);

    expect(events).toEqual([]);
    expect(system.getLastBroadPhaseCandidateCount()).toBeLessThan(fullPairCount / 20);
    expect(system.getLastGridCellCount()).toBeGreaterThan(100);
  });

  it('candidate pairs are based on spatial adjacency rather than insertion order', () => {
    const system = new CollisionDetectionSystem({ infrastructureBoundaryMeters: 10_000 });
    const vehicles = [vehicle('far-a', 500, 500), vehicle('near-a', 0, 0), vehicle('far-b', -500, -500), vehicle('near-b', 0.5, 0.5)];

    const events = system.tick(vehicles);

    expect(system.getLastBroadPhaseCandidateCount()).toBe(1);
    expect(events).toHaveLength(1);
    expect(events[0].vehicleIds).toEqual(['near-a', 'near-b']);
  });
});
