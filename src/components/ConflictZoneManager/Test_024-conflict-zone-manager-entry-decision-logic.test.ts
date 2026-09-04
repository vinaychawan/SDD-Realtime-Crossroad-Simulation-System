// TASK-024 acceptance criteria:
// - requestEntry() returns STOP if opposing-direction vehicle occupies zone
// - requestEntry() returns PROCEED if zone empty or only same/perpendicular vehicles present
// - Stop line position computed correctly (stopLineDistanceMeters before zone boundary)
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

describe('TASK-024: Conflict Zone Manager entry decision logic', () => {
  it('requestEntry() returns STOP if opposing-direction vehicle occupies zone', () => {
    const manager = new ConflictZoneManager({ sizeMeters: 20, maxWaitSeconds: 5, stopLineDistanceMeters: 15 });

    // NORTH vehicle in zone
    const northVehicle = createVehicle('v1', 'NORTH', 0, 0);
    manager.updateOccupancy([northVehicle]);

    // SOUTH vehicle requests entry — should STOP (NORTH opposes SOUTH)
    const southVehicle = createVehicle('v2', 'SOUTH', 0, -25);
    const decision = manager.requestEntry(southVehicle);

    expect(decision.decision).toBe('STOP');
    expect(decision.vehicleId).toBe('v2');
    expect(decision.stopLinePosition).toBeDefined();
  });

  it('requestEntry() returns PROCEED if zone empty', () => {
    const manager = new ConflictZoneManager({ sizeMeters: 20, maxWaitSeconds: 5, stopLineDistanceMeters: 15 });
    manager.updateOccupancy([]); // zone empty

    const vehicle = createVehicle('v1', 'NORTH', 0, -25);
    const decision = manager.requestEntry(vehicle);

    expect(decision.decision).toBe('PROCEED');
    expect(decision.stopLinePosition).toBeUndefined();
  });

  it('requestEntry() returns PROCEED if only same-direction vehicle in zone', () => {
    const manager = new ConflictZoneManager({ sizeMeters: 20, maxWaitSeconds: 5, stopLineDistanceMeters: 15 });

    // NORTH vehicle in zone
    const northVehicle1 = createVehicle('v1', 'NORTH', 0, 0);
    manager.updateOccupancy([northVehicle1]);

    // Another NORTH vehicle requests entry — should PROCEED (same direction)
    const northVehicle2 = createVehicle('v2', 'NORTH', 0, -25);
    const decision = manager.requestEntry(northVehicle2);

    expect(decision.decision).toBe('PROCEED');
  });

  it('requestEntry() returns PROCEED if only perpendicular-direction vehicle in zone', () => {
    const manager = new ConflictZoneManager({ sizeMeters: 20, maxWaitSeconds: 5, stopLineDistanceMeters: 15 });

    // NORTH vehicle in zone
    const northVehicle = createVehicle('v1', 'NORTH', 0, 0);
    manager.updateOccupancy([northVehicle]);

    // EAST vehicle requests entry — should PROCEED (perpendicular, not opposing)
    const eastVehicle = createVehicle('v2', 'EAST', -25, 0);
    const decision = manager.requestEntry(eastVehicle);

    expect(decision.decision).toBe('PROCEED');
  });

  it('stop line position is computed correctly for each direction', () => {
    const manager = new ConflictZoneManager({ sizeMeters: 20, maxWaitSeconds: 5, stopLineDistanceMeters: 15 });
    // Zone halfSize = 10m, stopLineDistance = 15m → stop at ±(10+15) = ±25m

    // Occupy zone to force STOP decisions
    manager.updateOccupancy([createVehicle('occupant', 'NORTH', 0, 0)]);

    // SOUTH vehicle requests entry (NORTH opposes SOUTH)
    const southDecision = manager.requestEntry(createVehicle('v-south', 'SOUTH', 0, -30));
    expect(southDecision.stopLinePosition).toEqual({ x: 0, y: 25 }); // North of zone

    manager.updateOccupancy([createVehicle('occupant', 'EAST', 0, 0)]);

    // WEST vehicle requests entry (EAST opposes WEST)
    const westDecision = manager.requestEntry(createVehicle('v-west', 'WEST', 30, 0));
    expect(westDecision.stopLinePosition).toEqual({ x: 25, y: 0 }); // East of zone (WEST travels toward -X)
  });

  it('opposing directions are correctly identified', () => {
    const manager = new ConflictZoneManager({ sizeMeters: 20, maxWaitSeconds: 5, stopLineDistanceMeters: 15 });

    // Test NORTH vs SOUTH (opposing)
    manager.updateOccupancy([createVehicle('v1', 'NORTH', 0, 0)]);
    expect(manager.requestEntry(createVehicle('v2', 'SOUTH', 0, -25)).decision).toBe('STOP');

    // Test SOUTH vs NORTH (opposing)
    manager.updateOccupancy([createVehicle('v1', 'SOUTH', 0, 0)]);
    expect(manager.requestEntry(createVehicle('v2', 'NORTH', 0, 25)).decision).toBe('STOP');

    // Test EAST vs WEST (opposing)
    manager.updateOccupancy([createVehicle('v1', 'EAST', 0, 0)]);
    expect(manager.requestEntry(createVehicle('v2', 'WEST', 25, 0)).decision).toBe('STOP');

    // Test WEST vs EAST (opposing)
    manager.updateOccupancy([createVehicle('v1', 'WEST', 0, 0)]);
    expect(manager.requestEntry(createVehicle('v2', 'EAST', -25, 0)).decision).toBe('STOP');
  });
});
