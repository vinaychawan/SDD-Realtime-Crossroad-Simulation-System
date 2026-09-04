// TASK-040 acceptance criteria:
// - evaluateSignalOverride() always returns PROCEED for emergency vehicles at RED signals
// - Occupied intersections signal an 80% slowdown factor for Physics Engine
// - Emergency vehicle never reaches 0 km/h at a RED signal in test scenarios
import { describe, expect, it } from 'vitest';
import { EmergencyVehicleController } from './EmergencyVehicleController';
import type { SignalState, VehicleState } from '../../domain/types';
import type { EmergencyConfig } from '../ConfigurationManager/configuration-manager.interface';

const disabledEmergencyConfig: EmergencyConfig = {
  enabled: false,
  spawnRatePerMinute: { AMBULANCE: 0, POLICE: 0, FIRE_BRIGADE: 0 }
};

function vehicle(isEmergency: boolean, speedKmh = 50): VehicleState {
  return {
    id: isEmergency ? 'emergency' : 'regular',
    direction: 'NORTH',
    exitDirection: 'SOUTH',
    lane: 2,
    position: { x: 0, y: -10 },
    speedKmh,
    speedMs: speedKmh / 3.6,
    isEmergency,
    emergencyType: isEmergency ? 'AMBULANCE' : undefined,
    yieldingActive: false
  };
}

describe('TASK-040: Emergency Vehicle Controller signal override decision', () => {
  it('emergency vehicle proceeds at RED signal', () => {
    const controller = new EmergencyVehicleController(disabledEmergencyConfig);

    expect(controller.evaluateSignalOverride(vehicle(true), 'RED', false)).toBe('PROCEED');
  });

  it('emergency vehicle proceeds for all signal states', () => {
    const controller = new EmergencyVehicleController(disabledEmergencyConfig);
    const signalStates: SignalState[] = ['RED', 'GREEN', 'AMBER'];

    const decisions = signalStates.map((signalState) => controller.evaluateSignalOverride(vehicle(true), signalState, false));

    expect(decisions).toEqual(['PROCEED', 'PROCEED', 'PROCEED']);
  });

  it('occupied intersection produces default 80% speed factor for emergency vehicles', () => {
    const controller = new EmergencyVehicleController(disabledEmergencyConfig);

    expect(controller.getSignalOverrideSpeedFactor(vehicle(true), true)).toBe(0.8);
  });

  it('clear intersection keeps emergency speed factor at 100%', () => {
    const controller = new EmergencyVehicleController(disabledEmergencyConfig);

    expect(controller.getSignalOverrideSpeedFactor(vehicle(true), false)).toBe(1);
  });

  it('regular vehicles do not receive emergency slowdown factor', () => {
    const controller = new EmergencyVehicleController(disabledEmergencyConfig);

    expect(controller.getSignalOverrideSpeedFactor(vehicle(false), true)).toBe(1);
  });

  it('custom emergency slowdown factor is supported for Physics Engine integration', () => {
    const controller = new EmergencyVehicleController(disabledEmergencyConfig, { emergencySlowdownFactor: 0.6 });

    expect(controller.getSignalOverrideSpeedFactor(vehicle(true), true)).toBe(0.6);
  });

  it('emergency vehicle never reaches 0 km/h at red when slowdown is applied', () => {
    const controller = new EmergencyVehicleController(disabledEmergencyConfig);
    const emergencyVehicle = vehicle(true, 50);
    const decision = controller.evaluateSignalOverride(emergencyVehicle, 'RED', true);
    const slowedSpeedKmh = emergencyVehicle.speedKmh * controller.getSignalOverrideSpeedFactor(emergencyVehicle, true);

    expect(decision).toBe('PROCEED');
    expect(slowedSpeedKmh).toBe(40);
    expect(slowedSpeedKmh).toBeGreaterThan(0);
  });
});
