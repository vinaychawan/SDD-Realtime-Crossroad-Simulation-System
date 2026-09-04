import { describe, it, expect } from 'vitest';
import type {
  Direction,
  EmergencyVehicleType,
  SignalCoordinationMode,
  SignalState,
  LaneSelectionStrategyKind,
  VehicleState
} from './types';

describe('shared domain types', () => {
  it('constructs a valid VehicleState literal matching the interface shape', () => {
    const direction: Direction = 'NORTH';
    const signalState: SignalState = 'GREEN';
    const mode: SignalCoordinationMode = 'STRICT_MUTUAL_EXCLUSION';
    const strategy: LaneSelectionStrategyKind = 'RANDOM';
    const emergencyType: EmergencyVehicleType = 'AMBULANCE';

    const vehicle: VehicleState = {
      id: 'veh-1',
      direction,
      exitDirection: 'SOUTH',
      lane: 1,
      position: { x: 0, y: 0 },
      speedKmh: 0,
      speedMs: 0,
      isEmergency: true,
      emergencyType,
      yieldingActive: false
    };

    expect(vehicle.direction).toBe('NORTH');
    expect(signalState).toBe('GREEN');
    expect(mode).toBe('STRICT_MUTUAL_EXCLUSION');
    expect(strategy).toBe('RANDOM');
  });
});
