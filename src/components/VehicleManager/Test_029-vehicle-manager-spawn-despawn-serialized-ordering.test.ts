// TASK-029 acceptance criteria:
// - Vehicles spawn per-direction at configured rate; despawn cleanly when exiting bounds
// - Simultaneous spawn requests serialized in N→S→E→W priority order (MF-002)
// - Unit test: 4 simultaneous spawn requests never produce overlapping initial positions
import { describe, expect, it } from 'vitest';
import { VehicleManager } from './VehicleManager';
import { RandomLaneStrategy } from './RandomLaneStrategy';
import type { SimulationConfig } from '../ConfigurationManager/configuration-manager.interface';

function createMockConfig(): SimulationConfig {
  return {
    scenarioPreset: 'NORMAL_TRAFFIC',
    targetFrameRate: 30,
    signalCoordinationMode: 'STRICT_MUTUAL_EXCLUSION',
    laneSelectionStrategy: 'RANDOM',
    perDirection: {
      NORTH: { spawnRatePerMinute: 30, greenDurationSec: 30, redDurationSec: 30 },
      SOUTH: { spawnRatePerMinute: 30, greenDurationSec: 30, redDurationSec: 30 },
      EAST: { spawnRatePerMinute: 30, greenDurationSec: 30, redDurationSec: 30 },
      WEST: { spawnRatePerMinute: 30, greenDurationSec: 30, redDurationSec: 30 }
    },
    emergency: {
      enabled: false,
      spawnRatePerMinute: { AMBULANCE: 0, POLICE: 0, FIRE_BRIGADE: 0 }
    },
    conflictZone: { sizeMeters: 25, maxWaitSeconds: 5, stopLineDistanceMeters: 20 },
    simulationSpeedMultiplier: 1
  };
}

describe('TASK-029: Vehicle Manager spawn/despawn with serialized ordering', () => {
  it('spawnVehicle() returns a unique VehicleId', () => {
    const manager = new VehicleManager(createMockConfig(), new RandomLaneStrategy());
    const id1 = manager.spawnVehicle('NORTH', 'SOUTH');
    const id2 = manager.spawnVehicle('NORTH', 'SOUTH');
    expect(id1).not.toBe(id2);
  });

  it('spawnVehicle() queues vehicle for processing on next tick', () => {
    const manager = new VehicleManager(createMockConfig(), new RandomLaneStrategy());
    const id = manager.spawnVehicle('NORTH', 'SOUTH');
    // Vehicle queued but not yet active
    expect(manager.getActiveVehicles()).toHaveLength(0);
    // After tick, vehicle should be active
    manager.tick(10);
    expect(manager.getActiveVehicles()).toHaveLength(1);
    expect(manager.getActiveVehicles()[0].id).toBe(id);
  });

  it('despawnVehicle() removes a vehicle', () => {
    const manager = new VehicleManager(createMockConfig(), new RandomLaneStrategy());
    const id = manager.spawnVehicle('NORTH', 'SOUTH');
    manager.tick(10);
    expect(manager.getActiveVehicles()).toHaveLength(1);
    manager.despawnVehicle(id);
    expect(manager.getActiveVehicles()).toHaveLength(0);
  });

  it('multiple spawn requests on same tick are serialized in N→S→E→W order (MF-002)', () => {
    const manager = new VehicleManager(createMockConfig(), new RandomLaneStrategy());

    // Queue spawns in reverse order: WEST, EAST, SOUTH, NORTH
    const westId = manager.spawnVehicle('WEST', 'EAST');
    const eastId = manager.spawnVehicle('EAST', 'WEST');
    const southId = manager.spawnVehicle('SOUTH', 'NORTH');
    const northId = manager.spawnVehicle('NORTH', 'SOUTH');

    manager.tick(10);
    const vehicles = manager.getActiveVehicles();

    // Should be processed in priority order: N, S, E, W
    expect(vehicles).toHaveLength(4);
    expect(vehicles[0].id).toBe(northId);
    expect(vehicles[1].id).toBe(southId);
    expect(vehicles[2].id).toBe(eastId);
    expect(vehicles[3].id).toBe(westId);
  });

  it('4 simultaneous spawn requests never produce overlapping initial positions', () => {
    const manager = new VehicleManager(createMockConfig(), new RandomLaneStrategy());

    // Spawn one vehicle in each direction
    manager.spawnVehicle('NORTH', 'SOUTH');
    manager.spawnVehicle('SOUTH', 'NORTH');
    manager.spawnVehicle('EAST', 'WEST');
    manager.spawnVehicle('WEST', 'EAST');

    manager.tick(10);
    const vehicles = manager.getActiveVehicles();

    // Collect all positions
    const positions = vehicles.map((v) => ({ x: v.position.x, y: v.position.y }));

    // No two positions should be identical
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const { x: x1, y: y1 } = positions[i];
        const { x: x2, y: y2 } = positions[j];
        expect(x1 === x2 && y1 === y2).toBe(false); // Not equal
      }
    }
  });

  it('spawn queue respects per-direction capacity limit (MF-002)', () => {
    const manager = new VehicleManager(createMockConfig(), new RandomLaneStrategy());

    // Try to spawn 11 vehicles in NORTH (capacity limit is 10)
    for (let i = 0; i < 10; i++) {
      manager.spawnVehicle('NORTH', 'SOUTH');
    }

    // 11th spawn should throw SpawnCapacityExceededError
    expect(() => {
      manager.spawnVehicle('NORTH', 'SOUTH');
    }).toThrow();
  });

  it('vehicles in different directions can exceed per-direction limit across all directions', () => {
    const manager = new VehicleManager(createMockConfig(), new RandomLaneStrategy());

    // Spawn 9 vehicles in each direction (36 total, all within per-direction limit of 10)
    for (let i = 0; i < 9; i++) {
      manager.spawnVehicle('NORTH', 'SOUTH');
      manager.spawnVehicle('SOUTH', 'NORTH');
      manager.spawnVehicle('EAST', 'WEST');
      manager.spawnVehicle('WEST', 'EAST');
    }

    manager.tick(10);
    expect(manager.getActiveVehicles()).toHaveLength(36);
  });

  it('vehicles have correct spawn positions per direction', () => {
    const manager = new VehicleManager(createMockConfig(), new RandomLaneStrategy());

    manager.spawnVehicle('NORTH', 'SOUTH');
    manager.spawnVehicle('SOUTH', 'NORTH');
    manager.spawnVehicle('EAST', 'WEST');
    manager.spawnVehicle('WEST', 'EAST');

    manager.tick(10);
    const vehicles = manager.getActiveVehicles();

    const northVehicle = vehicles.find((v) => v.direction === 'NORTH')!;
    const southVehicle = vehicles.find((v) => v.direction === 'SOUTH')!;
    const eastVehicle = vehicles.find((v) => v.direction === 'EAST')!;
    const westVehicle = vehicles.find((v) => v.direction === 'WEST')!;

    // NORTH spawns south of intersection (y=-60)
    expect(northVehicle.position.y).toBe(-60);
    // SOUTH spawns north of intersection (y=60)
    expect(southVehicle.position.y).toBe(60);
    // EAST spawns west of intersection (x=-60)
    expect(eastVehicle.position.x).toBe(-60);
    // WEST spawns east of intersection (x=60)
    expect(westVehicle.position.x).toBe(60);
  });
});
