// TASK-027 acceptance criteria:
// - Integration tests covering all TASK-022-026 features
// - Verify mode-B collision prevention scenario (opposing vehicles GREEN simultaneously)
// - 10ms time step simulation over 30+ seconds
// - ≥90% code coverage on ConflictZoneManager.ts
import { describe, expect, it } from 'vitest';
import type { VehicleState } from '../../domain/types';
import { ConflictZoneManager } from './ConflictZoneManager';

function createVehicle(
  id: string,
  direction: VehicleState['direction'],
  x: number,
  y: number,
  speedKmh: number = 50
): VehicleState {
  return {
    id,
    direction,
    exitDirection: direction,
    lane: 1,
    position: { x, y },
    speedKmh,
    speedMs: speedKmh / 3.6,
    isEmergency: false,
    yieldingActive: false
  };
}

describe('TASK-027: Conflict Zone Manager full acceptance tests', () => {
  it('prevents collision when opposing vehicles have GREEN signals simultaneously (Mode B scenario)', () => {
    const manager = new ConflictZoneManager({ sizeMeters: 25, maxWaitSeconds: 5, stopLineDistanceMeters: 20 });

    // Simulate Mode B: NORTH and SOUTH both GREEN, both vehicles approach zone
    const northVehicle = createVehicle('v-north', 'NORTH', 0, -30); // South of zone
    const southVehicle = createVehicle('v-south', 'SOUTH', 0, 30); // North of zone

    // Initially, zone is empty — both should get PROCEED
    manager.updateOccupancy([]);
    expect(manager.requestEntry(northVehicle).decision).toBe('PROCEED');
    expect(manager.requestEntry(southVehicle).decision).toBe('PROCEED');

    // NORTH vehicle enters zone first (moves to y=-10)
    manager.updateOccupancy([createVehicle('v-north', 'NORTH', 0, -10)]);

    // SOUTH vehicle requests entry — should now STOP (opposing vehicle in zone)
    const southDecision = manager.requestEntry(southVehicle);
    expect(southDecision.decision).toBe('STOP');
    expect(southDecision.stopLinePosition).toEqual({ x: 0, y: 32.5 }); // 25/2 + 20 = 32.5

    // NORTH vehicle exits zone (y=15)
    manager.updateOccupancy([createVehicle('v-north', 'NORTH', 0, 15)]);

    // SOUTH vehicle can now proceed
    expect(manager.requestEntry(southVehicle).decision).toBe('PROCEED');
  });

  it('tracks multiple vehicles over 30+ second simulation with 10ms timesteps', () => {
    const manager = new ConflictZoneManager({ sizeMeters: 20, maxWaitSeconds: 5, stopLineDistanceMeters: 15 });

    const ticksPerSecond = 100; // 10ms per tick
    const simulationDurationSeconds = 30;
    const totalTicks = ticksPerSecond * simulationDurationSeconds;

    let occupancyCount = 0;

    for (let tick = 0; tick < totalTicks; tick++) {
      // Simulate vehicles entering/exiting periodically
      const vehicles: VehicleState[] = [];

      // NORTH vehicle enters every 5 seconds for 2 seconds
      const cycleTime = tick % 500; // 5-second cycle
      if (cycleTime < 200) {
        // First 2 seconds of each cycle
        vehicles.push(createVehicle('v-north', 'NORTH', 0, 0));
      }

      // EAST vehicle enters at offset (to avoid collision)
      if (cycleTime >= 250 && cycleTime < 450) {
        vehicles.push(createVehicle('v-east', 'EAST', 0, 0));
      }

      manager.updateOccupancy(vehicles);
      if (manager.getOccupants().length > 0) {
        occupancyCount++;
      }
    }

    // Verify the manager was actively tracking occupancy throughout simulation
    expect(occupancyCount).toBeGreaterThan(0);
    expect(occupancyCount).toBeLessThan(totalTicks); // Not constantly occupied
  });

  it('handles complex 4-way scenario with waiting and deadlock detection', () => {
    const manager = new ConflictZoneManager({ sizeMeters: 20, maxWaitSeconds: 3, stopLineDistanceMeters: 15 });

    // NORTH vehicle occupies zone
    const northVehicle = createVehicle('v-north', 'NORTH', 0, 0);
    manager.updateOccupancy([northVehicle]);

    // SOUTH, EAST, WEST all request entry
    const southVehicle = createVehicle('v-south', 'SOUTH', 0, 30);
    const eastVehicle = createVehicle('v-east', 'EAST', -30, 0);
    const westVehicle = createVehicle('v-west', 'WEST', 30, 0);

    const southDecision = manager.requestEntry(southVehicle);
    const eastDecision = manager.requestEntry(eastVehicle);
    const westDecision = manager.requestEntry(westVehicle);

    // SOUTH should STOP (opposing NORTH), EAST/WEST should PROCEED (perpendicular)
    expect(southDecision.decision).toBe('STOP');
    expect(eastDecision.decision).toBe('PROCEED');
    expect(westDecision.decision).toBe('PROCEED');

    // Wait 3.1 seconds while NORTH remains in zone
    for (let i = 0; i < 310; i++) {
      manager.updateOccupancy([northVehicle, southVehicle]);
    }

    // SOUTH vehicle is now deadlocked
    const deadlocked = manager.getDeadlockedVehicles();
    expect(deadlocked).toHaveLength(1);
    expect(deadlocked[0].id).toBe('v-south');

    // Apply recovery
    manager.applyDeadlockRecovery('v-south', 'CONSERVATIVE');
    expect(manager.getDeadlockedVehicles()).toEqual([]);
  });

  it('zone configuration affects stop line positions correctly', () => {
    const smallZone = new ConflictZoneManager({ sizeMeters: 20, maxWaitSeconds: 5, stopLineDistanceMeters: 10 });
    const largeZone = new ConflictZoneManager({ sizeMeters: 40, maxWaitSeconds: 5, stopLineDistanceMeters: 25 });

    const northVehicle = createVehicle('v1', 'NORTH', 0, 0);
    const southVehicle = createVehicle('v2', 'SOUTH', 0, -50);

    // Small zone: halfSize=10, stopLine=10 → stop at -(10+10) = -20
    smallZone.updateOccupancy([northVehicle]);
    const smallDecision = smallZone.requestEntry(southVehicle);
    expect(smallDecision.stopLinePosition).toEqual({ x: 0, y: 20 });

    // Large zone: halfSize=20, stopLine=25 → stop at -(20+25) = -45
    largeZone.updateOccupancy([northVehicle]);
    const largeDecision = largeZone.requestEntry(southVehicle);
    expect(largeDecision.stopLinePosition).toEqual({ x: 0, y: 45 });
  });

  it('repeated STOP/PROCEED cycles maintain correct wait state', () => {
    const manager = new ConflictZoneManager({ sizeMeters: 20, maxWaitSeconds: 5, stopLineDistanceMeters: 15 });

    const northVehicle = createVehicle('v1', 'NORTH', 0, 0);
    const southVehicle = createVehicle('v2', 'SOUTH', 0, -25);

    // Cycle 1: STOP for 2s, then PROCEED
    manager.updateOccupancy([northVehicle]);
    manager.requestEntry(southVehicle); // STOP
    for (let i = 0; i < 200; i++) {
      manager.updateOccupancy([northVehicle]);
    }
    manager.updateOccupancy([]);
    manager.requestEntry(southVehicle); // PROCEED

    // Cycle 2: STOP for 2s again
    manager.updateOccupancy([northVehicle]);
    manager.requestEntry(southVehicle); // STOP (new wait record)
    for (let i = 0; i < 200; i++) {
      manager.updateOccupancy([northVehicle, southVehicle]);
    }

    // Not deadlocked (only 2s since last STOP, not 4s cumulative)
    expect(manager.getDeadlockedVehicles()).toEqual([]);

    // Wait another 3.1s → total 5.1s in this cycle → deadlocked
    for (let i = 0; i < 310; i++) {
      manager.updateOccupancy([northVehicle, southVehicle]);
    }
    expect(manager.getDeadlockedVehicles()).toHaveLength(1);
  });

  it('emergency vehicles follow same rules (no special priority in Conflict Zone Manager)', () => {
    // Note: Emergency vehicle priority is handled by Signal Controller (TASK-037-038).
    // Conflict Zone Manager treats all vehicles equally for collision prevention.
    const manager = new ConflictZoneManager({ sizeMeters: 20, maxWaitSeconds: 5, stopLineDistanceMeters: 15 });

    const northEmergency: VehicleState = {
      ...createVehicle('v-emergency', 'NORTH', 0, 0),
      isEmergency: true
    };
    const southRegular = createVehicle('v-regular', 'SOUTH', 0, -25);

    manager.updateOccupancy([northEmergency]);
    const decision = manager.requestEntry(southRegular);

    // Even though NORTH is emergency, SOUTH still gets STOP (collision prevention)
    expect(decision.decision).toBe('STOP');
  });
});
