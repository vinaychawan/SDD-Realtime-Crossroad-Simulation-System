// TASK-041 acceptance criteria:
// - Linear target speed factor: 100% at 50m → 50% at 0m
// - Lane-change direction suggested when safe; NONE when unsafe
// - Detection works symmetrically in all directions
import { describe, expect, it } from 'vitest';
import { EmergencyVehicleController } from './EmergencyVehicleController';
import type { Direction, VehicleState } from '../../domain/types';
import type { EmergencyConfig } from '../ConfigurationManager/configuration-manager.interface';

const disabledEmergencyConfig: EmergencyConfig = {
  enabled: false,
  spawnRatePerMinute: { AMBULANCE: 0, POLICE: 0, FIRE_BRIGADE: 0 }
};

function vehicle(
  id: string,
  x: number,
  y: number,
  lane: 1 | 2 | 3,
  isEmergency = false,
  direction: Direction = 'NORTH'
): VehicleState {
  return {
    id,
    direction,
    exitDirection: 'SOUTH',
    lane,
    position: { x, y },
    speedKmh: 50,
    speedMs: 50 / 3.6,
    isEmergency,
    emergencyType: isEmergency ? 'POLICE' : undefined,
    yieldingActive: false
  };
}

describe('TASK-041: Emergency Vehicle Controller yielding effect computation', () => {
  it('returns 100% target speed factor at 50m detection boundary', () => {
    const controller = new EmergencyVehicleController(disabledEmergencyConfig);
    const effects = controller.computeYieldingEffects([vehicle('regular', 50, 0, 2), vehicle('emergency', 0, 0, 2, true)]);

    expect(effects.get('regular')?.targetSpeedFactor).toBe(1);
  });

  it('returns 75% target speed factor at 25m', () => {
    const controller = new EmergencyVehicleController(disabledEmergencyConfig);
    const effects = controller.computeYieldingEffects([vehicle('regular', 25, 0, 2), vehicle('emergency', 0, 0, 2, true)]);

    expect(effects.get('regular')?.targetSpeedFactor).toBe(0.75);
  });

  it('returns 50% target speed factor when adjacent to emergency vehicle', () => {
    const controller = new EmergencyVehicleController(disabledEmergencyConfig);
    const effects = controller.computeYieldingEffects([vehicle('regular', 0, 0, 2), vehicle('emergency', 0, 0, 2, true)]);

    expect(effects.get('regular')?.targetSpeedFactor).toBe(0.5);
  });

  it('does not return yielding effects outside 50m detection range', () => {
    const controller = new EmergencyVehicleController(disabledEmergencyConfig);
    const effects = controller.computeYieldingEffects([vehicle('regular', 51, 0, 2), vehicle('emergency', 0, 0, 2, true)]);

    expect(effects.has('regular')).toBe(false);
  });

  it('suggests a safe lane change direction when adjacent lane is clear', () => {
    const controller = new EmergencyVehicleController(disabledEmergencyConfig);
    const effects = controller.computeYieldingEffects([vehicle('regular', 0, 0, 2), vehicle('emergency', 0, 0, 2, true)]);

    expect(effects.get('regular')?.laneChangeDirection).toBe('RIGHT');
  });

  it('suggests LEFT when vehicle and emergency share lane 3', () => {
    const controller = new EmergencyVehicleController(disabledEmergencyConfig);
    const effects = controller.computeYieldingEffects([vehicle('regular', 0, 0, 3), vehicle('emergency', 0, 0, 3, true)]);

    expect(effects.get('regular')?.laneChangeDirection).toBe('LEFT');
  });

  it('falls back to the opposite lane-change direction when preferred lane is blocked', () => {
    const controller = new EmergencyVehicleController(disabledEmergencyConfig);
    const effects = controller.computeYieldingEffects([
      vehicle('regular', 0, 0, 2),
      vehicle('emergency', 0, 0, 2, true),
      vehicle('right-blocker', 0, 5, 3)
    ]);

    expect(effects.get('regular')?.laneChangeDirection).toBe('LEFT');
  });

  it('returns NONE when all adjacent lane changes are unsafe', () => {
    const controller = new EmergencyVehicleController(disabledEmergencyConfig);
    const effects = controller.computeYieldingEffects([
      vehicle('regular', 0, 0, 2),
      vehicle('emergency', 0, 0, 2, true),
      vehicle('right-blocker', 0, 5, 3),
      vehicle('left-blocker', 0, -5, 1)
    ]);

    expect(effects.get('regular')?.laneChangeDirection).toBe('NONE');
  });

  it('detects emergency vehicles symmetrically from front, rear, left, and right', () => {
    const controller = new EmergencyVehicleController(disabledEmergencyConfig);
    const emergency = vehicle('emergency', 0, 0, 2, true);
    const regularVehicles = [
      vehicle('front', 0, 25, 2),
      vehicle('rear', 0, -25, 2),
      vehicle('left', -25, 0, 2),
      vehicle('right', 25, 0, 2)
    ];

    const effects = controller.computeYieldingEffects([...regularVehicles, emergency]);

    expect(Array.from(effects.keys()).sort()).toEqual(['front', 'left', 'rear', 'right']);
    expect(Array.from(effects.values()).every((effect) => effect.targetSpeedFactor === 0.75)).toBe(true);
  });

  it('regular vehicles do not yield to other regular vehicles', () => {
    const controller = new EmergencyVehicleController(disabledEmergencyConfig);
    const effects = controller.computeYieldingEffects([vehicle('regular-a', 0, 0, 2), vehicle('regular-b', 1, 1, 2)]);

    expect(effects).toEqual(new Map());
  });

  it('uses the nearest emergency vehicle when multiple emergencies are in range', () => {
    const controller = new EmergencyVehicleController(disabledEmergencyConfig);
    const effects = controller.computeYieldingEffects([
      vehicle('regular', 0, 0, 2),
      vehicle('far-emergency', 50, 0, 2, true),
      vehicle('near-emergency', 10, 0, 2, true)
    ]);

    expect(effects.get('regular')?.targetSpeedFactor).toBe(0.6);
  });
});
