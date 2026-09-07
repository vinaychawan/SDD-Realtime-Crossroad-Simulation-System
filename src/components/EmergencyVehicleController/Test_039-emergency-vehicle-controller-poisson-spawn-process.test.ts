// TASK-039 acceptance criteria:
// - Independent Poisson spawn timers for AMBULANCE, POLICE, FIRE_BRIGADE
// - Spawn rate accuracy within ±10% over one simulated minute per type
// - Simultaneous-tick spawns serialized deterministically via Vehicle Manager callback order
import { describe, expect, it } from 'vitest';
import { EmergencyVehicleController } from './EmergencyVehicleController';
import type { EmergencyVehicleSpawnedEvent } from './emergency-vehicle-controller.interface';
import type { Direction, EmergencyVehicleType } from '../../domain/types';
import type { EmergencyConfig } from '../ConfigurationManager/configuration-manager.interface';

const MEAN_INTERVAL_RANDOM = 1 - Math.exp(-1);

function config(rates: Record<EmergencyVehicleType, number>, enabled = true): EmergencyConfig {
  return { enabled, spawnRatePerMinute: rates };
}

function runOneMinute(controller: EmergencyVehicleController): void {
  for (let tick = 0; tick < 6000; tick++) {
    controller.tick(10);
  }
}

describe('TASK-039: Emergency Vehicle Controller per-type Poisson spawn process', () => {
  it('spawns each emergency type at configured rate within ±10% over one simulated minute', () => {
    const events: EmergencyVehicleSpawnedEvent[] = [];
    const controller = new EmergencyVehicleController(
      config({ AMBULANCE: 5, POLICE: 10, FIRE_BRIGADE: 2 }),
      { rng: () => MEAN_INTERVAL_RANDOM }
    );
    controller.onEmergencyVehicleSpawned((event) => events.push(event));

    runOneMinute(controller);

    const counts = {
      AMBULANCE: events.filter((event) => event.emergencyType === 'AMBULANCE').length,
      POLICE: events.filter((event) => event.emergencyType === 'POLICE').length,
      FIRE_BRIGADE: events.filter((event) => event.emergencyType === 'FIRE_BRIGADE').length
    };
    expect(counts.AMBULANCE).toBeGreaterThanOrEqual(4.5);
    expect(counts.AMBULANCE).toBeLessThanOrEqual(5.5);
    expect(counts.POLICE).toBeGreaterThanOrEqual(9);
    expect(counts.POLICE).toBeLessThanOrEqual(11);
    expect(counts.FIRE_BRIGADE).toBeGreaterThanOrEqual(1.8);
    expect(counts.FIRE_BRIGADE).toBeLessThanOrEqual(2.2);
  });

  it('keeps per-type spawn timers independent when some rates are zero', () => {
    const events: EmergencyVehicleSpawnedEvent[] = [];
    const controller = new EmergencyVehicleController(
      config({ AMBULANCE: 5, POLICE: 0, FIRE_BRIGADE: 0 }),
      { rng: () => MEAN_INTERVAL_RANDOM }
    );
    controller.onEmergencyVehicleSpawned((event) => events.push(event));

    runOneMinute(controller);

    expect(events).toHaveLength(5);
    expect(events.every((event) => event.emergencyType === 'AMBULANCE')).toBe(true);
  });

  it('serializes simultaneous-tick spawns by deterministic direction priority', () => {
    const spawnCalls: Array<{ direction: Direction; exitDirection: Direction }> = [];
    const events: EmergencyVehicleSpawnedEvent[] = [];
    const controller = new EmergencyVehicleController(
      config({ AMBULANCE: 20, POLICE: 20, FIRE_BRIGADE: 20 }),
      {
        rng: () => MEAN_INTERVAL_RANDOM,
        spawnVehicle: (direction, exitDirection) => {
          spawnCalls.push({ direction, exitDirection });
          return `vehicle-manager-${spawnCalls.length}`;
        }
      }
    );
    controller.onEmergencyVehicleSpawned((event) => events.push(event));

    controller.tick(3000);

    expect(spawnCalls.map((call) => call.direction)).toEqual(['NORTH', 'SOUTH', 'EAST']);
    expect(spawnCalls.map((call) => call.exitDirection)).toEqual(['SOUTH', 'NORTH', 'WEST']);
    expect(events.map((event) => event.vehicleId)).toEqual(['vehicle-manager-1', 'vehicle-manager-2', 'vehicle-manager-3']);
  });

  it('uses emergency type priority as tie-breaker when simultaneous spawns share a direction', () => {
    const events: EmergencyVehicleSpawnedEvent[] = [];
    const controller = new EmergencyVehicleController(
      config({ AMBULANCE: 20, POLICE: 20, FIRE_BRIGADE: 20 }),
      { rng: () => MEAN_INTERVAL_RANDOM }
    );
    controller.onEmergencyVehicleSpawned((event) => events.push(event));

    controller.tick(15_000);

    const northEvents = events.filter((event) => event.direction === 'NORTH');
    expect(northEvents.map((event) => event.emergencyType)).toEqual(['AMBULANCE', 'AMBULANCE', 'POLICE', 'FIRE_BRIGADE']);
  });

  it('round-robins emergency spawn directions across subsequent spawns', () => {
    const events: EmergencyVehicleSpawnedEvent[] = [];
    const controller = new EmergencyVehicleController(
      config({ AMBULANCE: 20, POLICE: 0, FIRE_BRIGADE: 0 }),
      { rng: () => MEAN_INTERVAL_RANDOM }
    );
    controller.onEmergencyVehicleSpawned((event) => events.push(event));

    for (let i = 0; i < 4; i++) {
      controller.tick(3000);
    }

    expect(events.map((event) => event.direction)).toEqual(['NORTH', 'SOUTH', 'EAST', 'WEST']);
  });

  it('runtime spawn-rate updates take effect on the next spawn interval', () => {
    const events: EmergencyVehicleSpawnedEvent[] = [];
    const controller = new EmergencyVehicleController(
      config({ AMBULANCE: 0, POLICE: 0, FIRE_BRIGADE: 0 }),
      { rng: () => MEAN_INTERVAL_RANDOM }
    );
    controller.onEmergencyVehicleSpawned((event) => events.push(event));

    controller.tick(60_000);
    controller.updateEmergencyConfig(config({ AMBULANCE: 20, POLICE: 0, FIRE_BRIGADE: 0 }));
    controller.tick(3000);

    expect(events).toHaveLength(1);
    expect(events[0].emergencyType).toBe('AMBULANCE');
  });

  it('reset() clears active emergency vehicles and restarts deterministic direction order', () => {
    const events: EmergencyVehicleSpawnedEvent[] = [];
    const controller = new EmergencyVehicleController(
      config({ AMBULANCE: 20, POLICE: 0, FIRE_BRIGADE: 0 }),
      { rng: () => MEAN_INTERVAL_RANDOM }
    );
    controller.onEmergencyVehicleSpawned((event) => events.push(event));
    controller.tick(3000);

    controller.reset();
    controller.tick(3000);

    expect(controller.getActiveEmergencyVehicles()).toHaveLength(1);
    expect(events.map((event) => event.direction)).toEqual(['NORTH', 'NORTH']);
    expect(events.map((event) => event.vehicleId)).toEqual(['emergency-1', 'emergency-1']);
  });

  it('clamps out-of-range spawn rates to the supported 0–20/min range', () => {
    const events: EmergencyVehicleSpawnedEvent[] = [];
    const controller = new EmergencyVehicleController(
      config({ AMBULANCE: 25, POLICE: -5, FIRE_BRIGADE: 0 }),
      { rng: () => MEAN_INTERVAL_RANDOM }
    );
    controller.onEmergencyVehicleSpawned((event) => events.push(event));

    runOneMinute(controller);

    expect(events.filter((event) => event.emergencyType === 'AMBULANCE')).toHaveLength(20);
    expect(events.some((event) => event.emergencyType === 'POLICE')).toBe(false);
  });
});
