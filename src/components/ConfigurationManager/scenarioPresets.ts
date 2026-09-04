// Exhaustive scenario preset table (TASK-007), resolving MF-005.
// Source of truth: specs/major/MF-005-scenario-preset-completeness.md.
import { ALL_DIRECTIONS } from '../../domain/constants';
import type { Direction } from '../../domain/types';
import type { PerDirectionConfig, ScenarioPreset, SimulationConfig } from './configuration-manager.interface';

function uniformPerDirection(config: PerDirectionConfig): Record<Direction, PerDirectionConfig> {
  const result = {} as Record<Direction, PerDirectionConfig>;
  for (const direction of ALL_DIRECTIONS) {
    result[direction] = { ...config };
  }
  return result;
}

// Conflict zone defaults are uniform across every preset (MF-005 does not vary them per scenario).
const DEFAULT_CONFLICT_ZONE = { sizeMeters: 25, maxWaitSeconds: 5, stopLineDistanceMeters: 20 } as const;
const NO_EMERGENCY = { enabled: false, spawnRatePerMinute: { AMBULANCE: 0, POLICE: 0, FIRE_BRIGADE: 0 } } as const;

/** Preset table excluding `scenarioPreset` itself (added by {@link buildPresetConfig}). */
const PRESET_TABLE: Record<Exclude<ScenarioPreset, 'CUSTOM'>, Omit<SimulationConfig, 'scenarioPreset'>> = {
  NORMAL_TRAFFIC: {
    targetFrameRate: 60,
    signalCoordinationMode: 'STRICT_MUTUAL_EXCLUSION',
    laneSelectionStrategy: 'RANDOM',
    perDirection: uniformPerDirection({ spawnRatePerMinute: 20, greenDurationSec: 30, redDurationSec: 30 }),
    emergency: NO_EMERGENCY,
    conflictZone: DEFAULT_CONFLICT_ZONE,
    simulationSpeedMultiplier: 1
  },
  CONGESTION_TEST: {
    targetFrameRate: 30,
    signalCoordinationMode: 'OPPOSING_SIMULTANEOUS',
    laneSelectionStrategy: 'INTELLIGENT',
    perDirection: uniformPerDirection({ spawnRatePerMinute: 60, greenDurationSec: 30, redDurationSec: 30 }),
    emergency: NO_EMERGENCY,
    conflictZone: DEFAULT_CONFLICT_ZONE,
    simulationSpeedMultiplier: 1
  },
  SPARSE_TRAFFIC: {
    targetFrameRate: 60,
    signalCoordinationMode: 'STRICT_MUTUAL_EXCLUSION',
    laneSelectionStrategy: 'RANDOM',
    perDirection: uniformPerDirection({ spawnRatePerMinute: 5, greenDurationSec: 40, redDurationSec: 40 }),
    emergency: NO_EMERGENCY,
    conflictZone: DEFAULT_CONFLICT_ZONE,
    simulationSpeedMultiplier: 1
  },
  PRIORITY_OPERATIONS: {
    targetFrameRate: 60,
    signalCoordinationMode: 'OPPOSING_SIMULTANEOUS',
    laneSelectionStrategy: 'INTELLIGENT',
    perDirection: uniformPerDirection({ spawnRatePerMinute: 20, greenDurationSec: 30, redDurationSec: 30 }),
    emergency: { enabled: true, spawnRatePerMinute: { AMBULANCE: 2, POLICE: 2, FIRE_BRIGADE: 1 } },
    conflictZone: DEFAULT_CONFLICT_ZONE,
    simulationSpeedMultiplier: 1
  }
};

/**
 * Builds a fully-populated SimulationConfig for the given preset.
 * CUSTOM has no fixed table (fully user-manual per MF-005); it starts from the
 * NORMAL_TRAFFIC baseline so every field stays defined, then the caller may edit freely.
 */
export function buildPresetConfig(preset: ScenarioPreset): SimulationConfig {
  const base = preset === 'CUSTOM' ? PRESET_TABLE.NORMAL_TRAFFIC : PRESET_TABLE[preset];
  return { scenarioPreset: preset, ...base };
}
