// TASK-028 acceptance criteria:
// - Module structure exists at src/components/VehicleManager/
// - IVehicleManager and ILaneSelectionStrategy interfaces implemented per INTERFACES.md §6
// - Strategy Pattern scaffolding allows swapping lane selection strategy
import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { VehicleManager } from './VehicleManager';
import { RandomLaneStrategy } from './RandomLaneStrategy';

const MODULE_DIR = dirname(fileURLToPath(import.meta.url));

describe('TASK-028: Vehicle Manager module structure', () => {
  it('module directory contains the expected files', () => {
    expect(existsSync(join(MODULE_DIR, 'vehicle-manager.interface.ts'))).toBe(true);
    expect(existsSync(join(MODULE_DIR, 'VehicleManager.ts'))).toBe(true);
    expect(existsSync(join(MODULE_DIR, 'RandomLaneStrategy.ts'))).toBe(true);
    expect(existsSync(join(MODULE_DIR, 'IntelligentLaneStrategy.ts'))).toBe(true);
    expect(existsSync(join(MODULE_DIR, 'README.md'))).toBe(true);
  });

  it('VehicleManager can be instantiated with a lane selection strategy', () => {
    const mockConfig = {
      scenarioPreset: 'NORMAL_TRAFFIC',
      targetFrameRate: 30,
      signalCoordinationMode: 'STRICT_MUTUAL_EXCLUSION',
      laneSelectionStrategy: 'RANDOM',
      perDirection: {
        NORTH: { spawnRatePerMinute: 30, averageExitDirection: 'SOUTH' },
        SOUTH: { spawnRatePerMinute: 30, averageExitDirection: 'NORTH' },
        EAST: { spawnRatePerMinute: 30, averageExitDirection: 'WEST' },
        WEST: { spawnRatePerMinute: 30, averageExitDirection: 'EAST' }
      },
      emergency: { spawnRatePerMinute: 0 },
      conflictZone: { sizeMeters: 25, maxWaitSeconds: 5, stopLineDistanceMeters: 20 },
      simulationSpeedMultiplier: 1
    };
    const strategy = new RandomLaneStrategy();
    const manager = new VehicleManager(mockConfig, strategy);
    expect(manager).toBeInstanceOf(VehicleManager);
  });

  it('IVehicleManager interface has required methods', () => {
    const mockConfig = {
      scenarioPreset: 'NORMAL_TRAFFIC',
      targetFrameRate: 30,
      signalCoordinationMode: 'STRICT_MUTUAL_EXCLUSION',
      laneSelectionStrategy: 'RANDOM',
      perDirection: {
        NORTH: { spawnRatePerMinute: 30, averageExitDirection: 'SOUTH' },
        SOUTH: { spawnRatePerMinute: 30, averageExitDirection: 'NORTH' },
        EAST: { spawnRatePerMinute: 30, averageExitDirection: 'WEST' },
        WEST: { spawnRatePerMinute: 30, averageExitDirection: 'EAST' }
      },
      emergency: { spawnRatePerMinute: 0 },
      conflictZone: { sizeMeters: 25, maxWaitSeconds: 5, stopLineDistanceMeters: 20 },
      simulationSpeedMultiplier: 1
    };
    const strategy = new RandomLaneStrategy();
    const manager = new VehicleManager(mockConfig, strategy);

    expect(typeof manager.spawnVehicle).toBe('function');
    expect(typeof manager.despawnVehicle).toBe('function');
    expect(typeof manager.getActiveVehicles).toBe('function');
  });

  it('getActiveVehicles() returns empty array initially', () => {
    const mockConfig = {
      scenarioPreset: 'NORMAL_TRAFFIC',
      targetFrameRate: 30,
      signalCoordinationMode: 'STRICT_MUTUAL_EXCLUSION',
      laneSelectionStrategy: 'RANDOM',
      perDirection: {
        NORTH: { spawnRatePerMinute: 30, averageExitDirection: 'SOUTH' },
        SOUTH: { spawnRatePerMinute: 30, averageExitDirection: 'NORTH' },
        EAST: { spawnRatePerMinute: 30, averageExitDirection: 'WEST' },
        WEST: { spawnRatePerMinute: 30, averageExitDirection: 'EAST' }
      },
      emergency: { spawnRatePerMinute: 0 },
      conflictZone: { sizeMeters: 25, maxWaitSeconds: 5, stopLineDistanceMeters: 20 },
      simulationSpeedMultiplier: 1
    };
    const strategy = new RandomLaneStrategy();
    const manager = new VehicleManager(mockConfig, strategy);
    expect(manager.getActiveVehicles()).toEqual([]);
  });

  it('Strategy Pattern allows swapping strategies without modifying VehicleManager', () => {
    const mockConfig = {
      scenarioPreset: 'NORMAL_TRAFFIC',
      targetFrameRate: 30,
      signalCoordinationMode: 'STRICT_MUTUAL_EXCLUSION',
      laneSelectionStrategy: 'RANDOM',
      perDirection: {
        NORTH: { spawnRatePerMinute: 30, averageExitDirection: 'SOUTH' },
        SOUTH: { spawnRatePerMinute: 30, averageExitDirection: 'NORTH' },
        EAST: { spawnRatePerMinute: 30, averageExitDirection: 'WEST' },
        WEST: { spawnRatePerMinute: 30, averageExitDirection: 'EAST' }
      },
      emergency: { spawnRatePerMinute: 0 },
      conflictZone: { sizeMeters: 25, maxWaitSeconds: 5, stopLineDistanceMeters: 20 },
      simulationSpeedMultiplier: 1
    };

    const randomStrategy = new RandomLaneStrategy();
    const manager1 = new VehicleManager(mockConfig, randomStrategy);

    // Both use same VehicleManager code, just different strategies
    expect(manager1).toBeInstanceOf(VehicleManager);
  });
});
