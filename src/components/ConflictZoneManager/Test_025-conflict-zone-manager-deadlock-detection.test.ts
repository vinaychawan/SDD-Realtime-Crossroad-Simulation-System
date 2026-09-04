// TASK-025 acceptance criteria:
// - getDeadlockedVehicles() returns vehicles waiting ≥ maxWaitSeconds at stop line
// - Wait timer starts on first STOP decision
// - Wait timer resets when vehicle receives PROCEED
// - Time precision: ±1 tick (10ms) tolerance
import { describe, expect, it } from 'vitest';
import type { VehicleState } from '../../domain/types';
import { ConflictZoneManager } from './ConflictZoneManager';

function createVehicle(id: string, direction: VehicleState['direction'], x: number, y: number): VehicleState {
  return {
    id,
    direction,
    exitDirection: direction,
    lane: 1,
    position: { x, y },
    speedKmh: 50,
    speedMs: 13.89,
    isEmergency: false,
    yieldingActive: false
  };
}

describe('TASK-025: Conflict Zone Manager deadlock detection', () => {
  it('getDeadlockedVehicles() returns empty array when no vehicles are waiting', () => {
    const manager = new ConflictZoneManager({ sizeMeters: 20, maxWaitSeconds: 5, stopLineDistanceMeters: 15 });
    manager.updateOccupancy([]);
    expect(manager.getDeadlockedVehicles()).toEqual([]);
  });

  it('wait timer starts on first STOP decision', () => {
    const manager = new ConflictZoneManager({ sizeMeters: 20, maxWaitSeconds: 5, stopLineDistanceMeters: 15 });

    // Occupy zone with NORTH vehicle
    const northVehicle = createVehicle('v1', 'NORTH', 0, 0);
    manager.updateOccupancy([northVehicle]);

    // SOUTH vehicle requests entry — gets STOP
    const southVehicle = createVehicle('v2', 'SOUTH', 0, -25);
    manager.requestEntry(southVehicle);

    // Wait 4.9 seconds (490 ticks) — not yet deadlocked
    for (let i = 0; i < 490; i++) {
      manager.updateOccupancy([northVehicle]);
    }
    expect(manager.getDeadlockedVehicles()).toEqual([]);

    // Wait another 0.2 seconds (20 ticks) → 5.1s total → deadlocked (±1 tick tolerance)
    for (let i = 0; i < 20; i++) {
      manager.updateOccupancy([northVehicle, southVehicle]); // Add southVehicle to occupants for detection
    }
    const deadlocked = manager.getDeadlockedVehicles();
    expect(deadlocked).toHaveLength(1);
    expect(deadlocked[0].id).toBe('v2');
  });

  it('wait timer resets when vehicle receives PROCEED', () => {
    const manager = new ConflictZoneManager({ sizeMeters: 20, maxWaitSeconds: 5, stopLineDistanceMeters: 15 });

    // SOUTH vehicle waiting at stop line
    const northVehicle = createVehicle('v1', 'NORTH', 0, 0);
    const southVehicle = createVehicle('v2', 'SOUTH', 0, -25);

    manager.updateOccupancy([northVehicle]);
    manager.requestEntry(southVehicle); // STOP

    // Wait 3 seconds
    for (let i = 0; i < 300; i++) {
      manager.updateOccupancy([northVehicle]);
    }

    // NORTH vehicle exits, SOUTH gets PROCEED
    manager.updateOccupancy([]);
    manager.requestEntry(southVehicle); // PROCEED

    // Wait another 3 seconds (total 6s, but timer reset at PROCEED)
    for (let i = 0; i < 300; i++) {
      manager.updateOccupancy([]);
    }

    // Not deadlocked (timer was reset)
    expect(manager.getDeadlockedVehicles()).toEqual([]);
  });

  it('multiple vehicles can be deadlocked simultaneously', () => {
    const manager = new ConflictZoneManager({ sizeMeters: 20, maxWaitSeconds: 2, stopLineDistanceMeters: 15 });

    // NORTH vehicle occupies zone
    const northVehicle = createVehicle('v1', 'NORTH', 0, 0);
    manager.updateOccupancy([northVehicle]);

    // Two SOUTH vehicles (in different lanes) both request entry — both get STOP
    const southVehicle1 = createVehicle('v2', 'SOUTH', 0, -25);
    const southVehicle2 = createVehicle('v3', 'SOUTH', 2, -25);
    manager.requestEntry(southVehicle1);
    manager.requestEntry(southVehicle2);

    // Wait 2.1 seconds
    for (let i = 0; i < 210; i++) {
      manager.updateOccupancy([northVehicle, southVehicle1, southVehicle2]);
    }

    const deadlocked = manager.getDeadlockedVehicles();
    expect(deadlocked).toHaveLength(2);
    expect(deadlocked.map((v) => v.id)).toEqual(expect.arrayContaining(['v2', 'v3']));
  });

  it('deadlock detection has ±1 tick (10ms) precision tolerance', () => {
    const manager = new ConflictZoneManager({ sizeMeters: 20, maxWaitSeconds: 1, stopLineDistanceMeters: 15 });

    const northVehicle = createVehicle('v1', 'NORTH', 0, 0);
    const southVehicle = createVehicle('v2', 'SOUTH', 0, -25);
    manager.updateOccupancy([northVehicle]);
    manager.requestEntry(southVehicle); // STOP

    // Exactly 100 ticks (1.0s)
    for (let i = 0; i < 100; i++) {
      manager.updateOccupancy([northVehicle, southVehicle]);
    }
    // At exactly maxWaitSeconds, should be deadlocked (>=)
    expect(manager.getDeadlockedVehicles()).toHaveLength(1);
  });
});
