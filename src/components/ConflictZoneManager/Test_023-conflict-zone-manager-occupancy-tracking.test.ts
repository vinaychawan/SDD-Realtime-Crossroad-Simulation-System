// TASK-023 acceptance criteria:
// - updateOccupancy() filters vehicles to those within zone bounds
// - getOccupants() returns current list
// - Zone bounds: rectangular [-sizeMeters/2, +sizeMeters/2] on X and Y
import { describe, expect, it } from 'vitest';
import type { VehicleState } from '../../domain/types';
import { ConflictZoneManager } from './ConflictZoneManager';

function createVehicle(id: string, x: number, y: number): VehicleState {
  return {
    id,
    direction: 'NORTH',
    exitDirection: 'NORTH',
    lane: 1,
    position: { x, y },
    speedKmh: 50,
    speedMs: 13.89,
    isEmergency: false,
    yieldingActive: false
  };
}

describe('TASK-023: Conflict Zone Manager occupancy tracking', () => {
  it('updateOccupancy() filters vehicles to those within zone bounds', () => {
    const manager = new ConflictZoneManager({ sizeMeters: 20, maxWaitSeconds: 5, stopLineDistanceMeters: 20 });
    // Zone bounds: [-10, +10] on both X and Y (sizeMeters=20 → halfSize=10)

    const vehicles = [
      createVehicle('v1', 0, 0), // center — IN
      createVehicle('v2', 9, 9), // near corner — IN
      createVehicle('v3', 11, 0), // outside X — OUT
      createVehicle('v4', 0, -11), // outside Y — OUT
      createVehicle('v5', -5, 5) // inside — IN
    ];

    manager.updateOccupancy(vehicles);
    const occupants = manager.getOccupants();

    expect(occupants).toHaveLength(3);
    expect(occupants.map((v) => v.id)).toEqual(expect.arrayContaining(['v1', 'v2', 'v5']));
  });

  it('getOccupants() returns current occupancy list', () => {
    const manager = new ConflictZoneManager({ sizeMeters: 30, maxWaitSeconds: 5, stopLineDistanceMeters: 20 });
    const v1 = createVehicle('v1', 0, 0);
    manager.updateOccupancy([v1]);

    const occupants = manager.getOccupants();
    expect(occupants).toHaveLength(1);
    expect(occupants[0].id).toBe('v1');
  });

  it('occupancy updates correctly as vehicles move through the zone', () => {
    const manager = new ConflictZoneManager({ sizeMeters: 20, maxWaitSeconds: 5, stopLineDistanceMeters: 20 });

    // Tick 1: vehicle enters zone
    manager.updateOccupancy([createVehicle('v1', 0, -5)]);
    expect(manager.getOccupants()).toHaveLength(1);

    // Tick 2: vehicle moves through center
    manager.updateOccupancy([createVehicle('v1', 0, 0)]);
    expect(manager.getOccupants()).toHaveLength(1);

    // Tick 3: vehicle exits zone
    manager.updateOccupancy([createVehicle('v1', 0, 15)]);
    expect(manager.getOccupants()).toHaveLength(0);
  });

  it('zone boundary is inclusive at edges', () => {
    const manager = new ConflictZoneManager({ sizeMeters: 20, maxWaitSeconds: 5, stopLineDistanceMeters: 20 });
    // Exactly at boundary: x=10, y=10 (halfSize=10)
    const atBoundary = createVehicle('v1', 10, 10);
    manager.updateOccupancy([atBoundary]);
    expect(manager.getOccupants()).toHaveLength(1);

    // Just outside boundary: x=10.01
    const outsideBoundary = createVehicle('v2', 10.01, 0);
    manager.updateOccupancy([outsideBoundary]);
    expect(manager.getOccupants()).toHaveLength(0);
  });
});
