import { describe, it, expect } from 'vitest';
import { InvalidConfigurationError } from '../../domain/errors';
import { buildPresetConfig } from './scenarioPresets';
import { validateSimulationConfig } from './validation';
import type { SimulationConfig } from './configuration-manager.interface';

function baseConfig(): SimulationConfig {
  return JSON.parse(JSON.stringify(buildPresetConfig('NORMAL_TRAFFIC')));
}

describe('validateSimulationConfig — boundary value analysis', () => {
  describe('perDirection.spawnRatePerMinute (0–60)', () => {
    it.each([0, 60])('accepts boundary value %d', (value) => {
      const config = baseConfig();
      config.perDirection.NORTH.spawnRatePerMinute = value;
      expect(() => validateSimulationConfig(config)).not.toThrow();
    });

    it.each([-1, 61])('rejects out-of-range value %d', (value) => {
      const config = baseConfig();
      config.perDirection.NORTH.spawnRatePerMinute = value;
      expect(() => validateSimulationConfig(config)).toThrow(InvalidConfigurationError);
    });
  });

  describe('perDirection.greenDurationSec / redDurationSec (10–60)', () => {
    it.each([10, 60])('accepts boundary green duration %d', (value) => {
      const config = baseConfig();
      config.perDirection.SOUTH.greenDurationSec = value;
      expect(() => validateSimulationConfig(config)).not.toThrow();
    });

    it.each([9, 61])('rejects out-of-range green duration %d', (value) => {
      const config = baseConfig();
      config.perDirection.SOUTH.greenDurationSec = value;
      expect(() => validateSimulationConfig(config)).toThrow(InvalidConfigurationError);
    });

    it.each([9, 61])('rejects out-of-range red duration %d on a non-first direction (WEST)', (value) => {
      const config = baseConfig();
      config.perDirection.WEST.redDurationSec = value;
      expect(() => validateSimulationConfig(config)).toThrow(InvalidConfigurationError);
    });
  });

  describe('emergency.spawnRatePerMinute (0–20 each, MF-006 independent fields)', () => {
    it.each(['AMBULANCE', 'POLICE', 'FIRE_BRIGADE'] as const)('accepts boundary values for %s', (type) => {
      const config = baseConfig();
      config.emergency.spawnRatePerMinute[type] = 0;
      expect(() => validateSimulationConfig(config)).not.toThrow();
      config.emergency.spawnRatePerMinute[type] = 20;
      expect(() => validateSimulationConfig(config)).not.toThrow();
    });

    it.each(['AMBULANCE', 'POLICE', 'FIRE_BRIGADE'] as const)('rejects out-of-range values for %s', (type) => {
      const config = baseConfig();
      config.emergency.spawnRatePerMinute[type] = -1;
      expect(() => validateSimulationConfig(config)).toThrow(InvalidConfigurationError);
      config.emergency.spawnRatePerMinute[type] = 21;
      expect(() => validateSimulationConfig(config)).toThrow(InvalidConfigurationError);
    });
  });

  describe('conflictZone fields', () => {
    it('accepts sizeMeters boundaries 20 and 50', () => {
      const config = baseConfig();
      config.conflictZone.sizeMeters = 20;
      expect(() => validateSimulationConfig(config)).not.toThrow();
      config.conflictZone.sizeMeters = 50;
      expect(() => validateSimulationConfig(config)).not.toThrow();
    });

    it('rejects sizeMeters out of range (19, 51)', () => {
      const config = baseConfig();
      config.conflictZone.sizeMeters = 19;
      expect(() => validateSimulationConfig(config)).toThrow(InvalidConfigurationError);
      config.conflictZone.sizeMeters = 51;
      expect(() => validateSimulationConfig(config)).toThrow(InvalidConfigurationError);
    });

    it('accepts maxWaitSeconds boundaries 2 and 10', () => {
      const config = baseConfig();
      config.conflictZone.maxWaitSeconds = 2;
      expect(() => validateSimulationConfig(config)).not.toThrow();
      config.conflictZone.maxWaitSeconds = 10;
      expect(() => validateSimulationConfig(config)).not.toThrow();
    });

    it('rejects maxWaitSeconds out of range (1, 11)', () => {
      const config = baseConfig();
      config.conflictZone.maxWaitSeconds = 1;
      expect(() => validateSimulationConfig(config)).toThrow(InvalidConfigurationError);
      config.conflictZone.maxWaitSeconds = 11;
      expect(() => validateSimulationConfig(config)).toThrow(InvalidConfigurationError);
    });

    it('accepts stopLineDistanceMeters boundaries 10 and 50', () => {
      const config = baseConfig();
      config.conflictZone.stopLineDistanceMeters = 10;
      expect(() => validateSimulationConfig(config)).not.toThrow();
      config.conflictZone.stopLineDistanceMeters = 50;
      expect(() => validateSimulationConfig(config)).not.toThrow();
    });

    it('rejects stopLineDistanceMeters out of range (9, 51)', () => {
      const config = baseConfig();
      config.conflictZone.stopLineDistanceMeters = 9;
      expect(() => validateSimulationConfig(config)).toThrow(InvalidConfigurationError);
      config.conflictZone.stopLineDistanceMeters = 51;
      expect(() => validateSimulationConfig(config)).toThrow(InvalidConfigurationError);
    });
  });

  describe('enum-like fields', () => {
    it('accepts both targetFrameRate values (30, 60)', () => {
      const config = baseConfig();
      config.targetFrameRate = 30;
      expect(() => validateSimulationConfig(config)).not.toThrow();
      config.targetFrameRate = 60;
      expect(() => validateSimulationConfig(config)).not.toThrow();
    });

    it('rejects an invalid targetFrameRate', () => {
      const config = baseConfig();
      // @ts-expect-error intentionally invalid for the test
      config.targetFrameRate = 45;
      expect(() => validateSimulationConfig(config)).toThrow(InvalidConfigurationError);
    });

    it('accepts all simulationSpeedMultiplier values (1, 2, 4)', () => {
      const config = baseConfig();
      for (const multiplier of [1, 2, 4] as const) {
        config.simulationSpeedMultiplier = multiplier;
        expect(() => validateSimulationConfig(config)).not.toThrow();
      }
    });

    it('rejects an invalid simulationSpeedMultiplier', () => {
      const config = baseConfig();
      // @ts-expect-error intentionally invalid for the test
      config.simulationSpeedMultiplier = 3;
      expect(() => validateSimulationConfig(config)).toThrow(InvalidConfigurationError);
    });

    it('rejects an invalid signalCoordinationMode', () => {
      const config = baseConfig();
      // @ts-expect-error intentionally invalid for the test
      config.signalCoordinationMode = 'NOT_A_MODE';
      expect(() => validateSimulationConfig(config)).toThrow(InvalidConfigurationError);
    });

    it('rejects an invalid laneSelectionStrategy', () => {
      const config = baseConfig();
      // @ts-expect-error intentionally invalid for the test
      config.laneSelectionStrategy = 'NOT_A_STRATEGY';
      expect(() => validateSimulationConfig(config)).toThrow(InvalidConfigurationError);
    });

    it('rejects an invalid scenarioPreset', () => {
      const config = baseConfig();
      // @ts-expect-error intentionally invalid for the test
      config.scenarioPreset = 'NOT_A_PRESET';
      expect(() => validateSimulationConfig(config)).toThrow(InvalidConfigurationError);
    });

    it('rejects a non-boolean emergency.enabled', () => {
      const config = baseConfig();
      // @ts-expect-error intentionally invalid for the test
      config.emergency.enabled = 'yes';
      expect(() => validateSimulationConfig(config)).toThrow(InvalidConfigurationError);
    });
  });

  it('a fully valid config from every preset passes validation', () => {
    for (const preset of ['NORMAL_TRAFFIC', 'CONGESTION_TEST', 'SPARSE_TRAFFIC', 'PRIORITY_OPERATIONS', 'CUSTOM'] as const) {
      expect(() => validateSimulationConfig(buildPresetConfig(preset))).not.toThrow();
    }
  });
});
