// TASK-026 acceptance criteria:
// - applyDeadlockRecovery() removes vehicle from waiting queue
// - Method logs recovery action (for now; will emit DeadlockEvent in TASK-067)
// - Method doesn't throw on invalid vehicleId or unsupported procedure
import { describe, expect, it, vi } from 'vitest';
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

describe('TASK-026: Conflict Zone Manager conservative deadlock recovery', () => {
  it('applyDeadlockRecovery() removes vehicle from waiting queue', () => {
    const manager = new ConflictZoneManager({ sizeMeters: 20, maxWaitSeconds: 2, stopLineDistanceMeters: 15 });

    const northVehicle = createVehicle('v1', 'NORTH', 0, 0);
    const southVehicle = createVehicle('v2', 'SOUTH', 0, -25);

    // Put v2 in waiting state
    manager.updateOccupancy([northVehicle]);
    manager.requestEntry(southVehicle); // STOP

    // Wait until deadlocked
    for (let i = 0; i < 210; i++) {
      manager.updateOccupancy([northVehicle, southVehicle]);
    }
    expect(manager.getDeadlockedVehicles()).toHaveLength(1);

    // Apply recovery
    manager.applyDeadlockRecovery('v2', 'CONSERVATIVE');

    // No longer deadlocked (removed from queue)
    expect(manager.getDeadlockedVehicles()).toEqual([]);
  });

  it('applyDeadlockRecovery() logs recovery action', () => {
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const manager = new ConflictZoneManager({ sizeMeters: 20, maxWaitSeconds: 2, stopLineDistanceMeters: 15 });

    const northVehicle = createVehicle('v1', 'NORTH', 0, 0);
    const southVehicle = createVehicle('v2', 'SOUTH', 0, -25);

    manager.updateOccupancy([northVehicle]);
    manager.requestEntry(southVehicle);

    for (let i = 0; i < 210; i++) {
      manager.updateOccupancy([northVehicle, southVehicle]);
    }

    manager.applyDeadlockRecovery('v2', 'CONSERVATIVE');

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('ConflictZoneManager: Applying CONSERVATIVE deadlock recovery to vehicle v2')
    );

    consoleLogSpy.mockRestore();
  });

  it('applyDeadlockRecovery() does not throw on invalid vehicleId', () => {
    const manager = new ConflictZoneManager({ sizeMeters: 20, maxWaitSeconds: 5, stopLineDistanceMeters: 15 });

    expect(() => {
      manager.applyDeadlockRecovery('nonexistent-vehicle', 'CONSERVATIVE');
    }).not.toThrow();
  });

  it('applyDeadlockRecovery() warns and falls back to CONSERVATIVE on unsupported procedure', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const manager = new ConflictZoneManager({ sizeMeters: 20, maxWaitSeconds: 5, stopLineDistanceMeters: 15 });

    // @ts-expect-error — testing unsupported procedure
    manager.applyDeadlockRecovery('v1', 'UNSUPPORTED');

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('unsupported recovery procedure "UNSUPPORTED" — using CONSERVATIVE')
    );

    consoleWarnSpy.mockRestore();
  });

  it('vehicle can re-request entry after deadlock recovery', () => {
    const manager = new ConflictZoneManager({ sizeMeters: 20, maxWaitSeconds: 2, stopLineDistanceMeters: 15 });

    const northVehicle = createVehicle('v1', 'NORTH', 0, 0);
    const southVehicle = createVehicle('v2', 'SOUTH', 0, -25);

    manager.updateOccupancy([northVehicle]);
    manager.requestEntry(southVehicle); // STOP

    for (let i = 0; i < 210; i++) {
      manager.updateOccupancy([northVehicle, southVehicle]);
    }

    manager.applyDeadlockRecovery('v2', 'CONSERVATIVE');

    // Zone still occupied, so new request should still get STOP
    const newDecision = manager.requestEntry(southVehicle);
    expect(newDecision.decision).toBe('STOP');

    // But wait timer was reset (new wait record created)
    for (let i = 0; i < 190; i++) {
      manager.updateOccupancy([northVehicle, southVehicle]);
    }
    // Only 1.9s since new STOP, not yet deadlocked
    expect(manager.getDeadlockedVehicles()).toEqual([]);
  });
});
