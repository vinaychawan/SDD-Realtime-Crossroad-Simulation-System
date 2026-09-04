// TASK-038 acceptance criteria:
// - Module structure exists at src/components/EmergencyVehicleController/
// - IEmergencyVehicleController interface implemented per INTERFACES.md §7
// - Emergency vehicles represented as VehicleState + emergencyType discriminant
import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { EmergencyVehicleController } from './EmergencyVehicleController';
import type { IEmergencyVehicleController } from './emergency-vehicle-controller.interface';
import type { EmergencyConfig } from '../ConfigurationManager/configuration-manager.interface';

function emergencyConfig(enabled = true): EmergencyConfig {
  return {
    enabled,
    spawnRatePerMinute: { AMBULANCE: 20, POLICE: 0, FIRE_BRIGADE: 0 }
  };
}

describe('TASK-038: Emergency Vehicle Controller module structure', () => {
  it('module directory contains expected files', () => {
    const modulePath = 'src/components/EmergencyVehicleController';
    expect(existsSync(join(process.cwd(), modulePath, 'EmergencyVehicleController.ts'))).toBe(true);
    expect(existsSync(join(process.cwd(), modulePath, 'emergency-vehicle-controller.interface.ts'))).toBe(true);
  });

  it('EmergencyVehicleController implements IEmergencyVehicleController methods', () => {
    const controller: IEmergencyVehicleController = new EmergencyVehicleController(emergencyConfig());

    expect(typeof controller.tick).toBe('function');
    expect(typeof controller.evaluateSignalOverride).toBe('function');
    expect(typeof controller.computeYieldingEffects).toBe('function');
  });

  it('emergency vehicles are VehicleState objects with emergencyType discriminant', () => {
    const controller = new EmergencyVehicleController(emergencyConfig(), { rng: () => 1 - Math.exp(-1) });

    controller.tick(3000);
    const emergencyVehicles = controller.getActiveEmergencyVehicles();

    expect(emergencyVehicles).toHaveLength(1);
    expect(emergencyVehicles[0].isEmergency).toBe(true);
    expect(emergencyVehicles[0].emergencyType).toBe('AMBULANCE');
    expect(emergencyVehicles[0].speedKmh).toBeGreaterThan(0);
  });

  it('does not create a parallel emergency vehicle class hierarchy', () => {
    const controller = new EmergencyVehicleController(emergencyConfig(), { rng: () => 1 - Math.exp(-1) });

    controller.tick(3000);
    const vehicle = controller.getActiveEmergencyVehicles()[0];

    expect(vehicle).toHaveProperty('id');
    expect(vehicle).toHaveProperty('direction');
    expect(vehicle).toHaveProperty('position');
    expect(vehicle).toHaveProperty('emergencyType');
    expect(Object.getPrototypeOf(vehicle)).toBe(Object.prototype);
  });

  it('default disabled emergency config produces no emergency vehicles', () => {
    const controller = new EmergencyVehicleController(emergencyConfig(false), { rng: () => 1 - Math.exp(-1) });

    controller.tick(60_000);

    expect(controller.getActiveEmergencyVehicles()).toEqual([]);
  });
});
