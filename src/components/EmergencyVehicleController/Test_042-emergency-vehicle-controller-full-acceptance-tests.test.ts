// TASK-042 acceptance criteria:
// - All REQ-NEW-E1/E3/E4/E5 acceptance criteria automated
// - ≥90% statement coverage for EmergencyVehicleController
import { describe, expect, it } from 'vitest';
import { EmergencyVehicleController } from './EmergencyVehicleController';
import type { EmergencyVehicleSpawnedEvent } from './emergency-vehicle-controller.interface';
import type { EmergencyConfig } from '../ConfigurationManager/configuration-manager.interface';
import type { VehicleState } from '../../domain/types';

const MEAN_INTERVAL_RANDOM = 1 - Math.exp(-1);

function config(ambulance: number, police: number, fire: number, enabled = true): EmergencyConfig {
  return {
    enabled,
    spawnRatePerMinute: { AMBULANCE: ambulance, POLICE: police, FIRE_BRIGADE: fire }
  };
}

function run(controller: EmergencyVehicleController, durationMs: number): void {
  for (let elapsedMs = 0; elapsedMs < durationMs; elapsedMs += 10) {
    controller.tick(10);
  }
}

function vehicle(id: string, x: number, y: number, isEmergency = false): VehicleState {
  return {
    id,
    direction: 'NORTH',
    exitDirection: 'SOUTH',
    lane: 2,
    position: { x, y },
    speedKmh: 50,
    speedMs: 50 / 3.6,
    isEmergency,
    emergencyType: isEmergency ? 'AMBULANCE' : undefined,
    yieldingActive: false
  };
}

describe('TASK-042: Emergency Vehicle Controller full acceptance tests', () => {
  it('REQ-NEW-E1: supports ambulance, police, and fire brigade vehicle types', () => {
    const events: EmergencyVehicleSpawnedEvent[] = [];
    const controller = new EmergencyVehicleController(config(20, 20, 20), { rng: () => MEAN_INTERVAL_RANDOM });
    controller.onEmergencyVehicleSpawned((event) => events.push(event));

    controller.tick(3000);

    expect(events.map((event) => event.emergencyType)).toEqual(['AMBULANCE', 'POLICE', 'FIRE_BRIGADE']);
    expect(events.every((event) => event.vehicle.isEmergency)).toBe(true);
    expect(events.every((event) => event.vehicle.emergencyType === event.emergencyType)).toBe(true);
  });

  it('REQ-NEW-E5: independent rates produce expected one-minute counts', () => {
    const events: EmergencyVehicleSpawnedEvent[] = [];
    const controller = new EmergencyVehicleController(config(5, 10, 2), { rng: () => MEAN_INTERVAL_RANDOM });
    controller.onEmergencyVehicleSpawned((event) => events.push(event));

    run(controller, 60_000);

    expect(events.filter((event) => event.emergencyType === 'AMBULANCE')).toHaveLength(5);
    expect(events.filter((event) => event.emergencyType === 'POLICE')).toHaveLength(10);
    expect(events.filter((event) => event.emergencyType === 'FIRE_BRIGADE')).toHaveLength(2);
  });

  it('REQ-NEW-E5: default disabled means no emergency vehicles spawn', () => {
    const controller = new EmergencyVehicleController(config(20, 20, 20, false), { rng: () => MEAN_INTERVAL_RANDOM });

    run(controller, 60_000);

    expect(controller.getActiveEmergencyVehicles()).toEqual([]);
  });

  it('REQ-NEW-E3: emergency vehicles proceed through red without stopping', () => {
    const controller = new EmergencyVehicleController(config(0, 0, 0));
    const emergency = vehicle('emergency', 0, -10, true);

    const decision = controller.evaluateSignalOverride(emergency, 'RED', true);
    const speedAfterSlowdown = emergency.speedKmh * controller.getSignalOverrideSpeedFactor(emergency, true);

    expect(decision).toBe('PROCEED');
    expect(speedAfterSlowdown).toBeGreaterThan(0);
  });

  it('REQ-NEW-E4: vehicles within 50m yield with speed reduction and lane hint', () => {
    const controller = new EmergencyVehicleController(config(0, 0, 0));
    const effects = controller.computeYieldingEffects([vehicle('regular', 25, 0), vehicle('emergency', 0, 0, true)]);

    expect(effects.get('regular')).toEqual({
      targetSpeedFactor: 0.75,
      laneChangeDirection: 'RIGHT'
    });
  });

  it('REQ-NEW-E4: blocked lane changes never force collision-risk movement', () => {
    const controller = new EmergencyVehicleController(config(0, 0, 0));
    const effects = controller.computeYieldingEffects([
      vehicle('regular', 0, 0),
      vehicle('emergency', 0, 0, true),
      { ...vehicle('left-blocker', 0, -4), lane: 1 },
      { ...vehicle('right-blocker', 0, 4), lane: 3 }
    ]);

    expect(effects.get('regular')?.laneChangeDirection).toBe('NONE');
  });

  it('MF-002/ADR-006: simultaneous emergency spawns are deterministic', () => {
    const events: EmergencyVehicleSpawnedEvent[] = [];
    const controller = new EmergencyVehicleController(config(20, 20, 20), { rng: () => MEAN_INTERVAL_RANDOM });
    controller.onEmergencyVehicleSpawned((event) => events.push(event));

    controller.tick(3000);

    expect(events.map((event) => `${event.direction}:${event.emergencyType}`)).toEqual([
      'NORTH:AMBULANCE',
      'SOUTH:POLICE',
      'EAST:FIRE_BRIGADE'
    ]);
  });

  it('all acceptance behaviors are synchronous and complete within 100ms', () => {
    const controller = new EmergencyVehicleController(config(20, 20, 20), { rng: () => MEAN_INTERVAL_RANDOM });
    const startedAt = performance.now();

    controller.tick(3000);
    controller.evaluateSignalOverride(vehicle('emergency', 0, 0, true), 'RED', true);
    controller.computeYieldingEffects([vehicle('regular', 25, 0), vehicle('emergency', 0, 0, true)]);

    expect(performance.now() - startedAt).toBeLessThanOrEqual(100);
  });
});
