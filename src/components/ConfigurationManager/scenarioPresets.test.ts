import { describe, it, expect } from 'vitest';
import { buildPresetConfig } from './scenarioPresets';

const ALL_PRESETS = ['NORMAL_TRAFFIC', 'CONGESTION_TEST', 'SPARSE_TRAFFIC', 'PRIORITY_OPERATIONS', 'CUSTOM'] as const;

function assertNoUndefinedFields(value: unknown, path = 'root'): void {
  if (value === undefined) {
    throw new Error(`Undefined field at ${path}`);
  }
  if (value !== null && typeof value === 'object') {
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      assertNoUndefinedFields(nested, `${path}.${key}`);
    }
  }
}

describe('scenario presets (MF-005)', () => {
  it.each(ALL_PRESETS)('%s has no undefined fields after being applied', (preset) => {
    const config = buildPresetConfig(preset);
    assertNoUndefinedFields(config);
    expect(config.scenarioPreset).toBe(preset);
  });

  it('Normal Traffic matches MF-005 exact parameter table', () => {
    const config = buildPresetConfig('NORMAL_TRAFFIC');
    expect(config.targetFrameRate).toBe(60);
    expect(config.signalCoordinationMode).toBe('STRICT_MUTUAL_EXCLUSION');
    expect(config.laneSelectionStrategy).toBe('RANDOM');
    for (const direction of ['NORTH', 'SOUTH', 'EAST', 'WEST'] as const) {
      expect(config.perDirection[direction]).toEqual({ spawnRatePerMinute: 20, greenDurationSec: 30, redDurationSec: 30 });
    }
    expect(config.emergency).toEqual({ enabled: false, spawnRatePerMinute: { AMBULANCE: 0, POLICE: 0, FIRE_BRIGADE: 0 } });
  });

  it('Congestion Test matches MF-005 exact parameter table', () => {
    const config = buildPresetConfig('CONGESTION_TEST');
    expect(config.targetFrameRate).toBe(30);
    expect(config.signalCoordinationMode).toBe('OPPOSING_SIMULTANEOUS');
    expect(config.laneSelectionStrategy).toBe('INTELLIGENT');
    expect(config.perDirection.NORTH.spawnRatePerMinute).toBe(60);
  });

  it('Sparse Traffic matches MF-005 exact parameter table', () => {
    const config = buildPresetConfig('SPARSE_TRAFFIC');
    expect(config.perDirection.EAST).toEqual({ spawnRatePerMinute: 5, greenDurationSec: 40, redDurationSec: 40 });
    expect(config.signalCoordinationMode).toBe('STRICT_MUTUAL_EXCLUSION');
    expect(config.laneSelectionStrategy).toBe('RANDOM');
  });

  it('Priority Operations matches MF-005 exact parameter table, including emergency mix', () => {
    const config = buildPresetConfig('PRIORITY_OPERATIONS');
    expect(config.signalCoordinationMode).toBe('OPPOSING_SIMULTANEOUS');
    expect(config.laneSelectionStrategy).toBe('INTELLIGENT');
    expect(config.emergency).toEqual({
      enabled: true,
      spawnRatePerMinute: { AMBULANCE: 2, POLICE: 2, FIRE_BRIGADE: 1 }
    });
  });

  it('Custom starts from a fully-populated baseline (no ambiguous fields) editable afterward', () => {
    const config = buildPresetConfig('CUSTOM');
    expect(config.scenarioPreset).toBe('CUSTOM');
    expect(config.perDirection.NORTH.spawnRatePerMinute).toBe(20); // NORMAL_TRAFFIC baseline
  });

  it('every preset applies uniform conflict zone defaults', () => {
    for (const preset of ALL_PRESETS) {
      const config = buildPresetConfig(preset);
      expect(config.conflictZone).toEqual({ sizeMeters: 25, maxWaitSeconds: 5, stopLineDistanceMeters: 20 });
    }
  });
});
