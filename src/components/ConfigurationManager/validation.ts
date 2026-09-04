// Field validation for Configuration Manager (TASK-005). Ranges per docs/INTERFACES.md §3
// and specs/minor/NF-003-parameter-constraints-documentation.md.
import { ALL_DIRECTIONS, ALL_EMERGENCY_TYPES } from '../../domain/constants';
import { InvalidConfigurationError } from '../../domain/errors';
import type { SimulationConfig } from './configuration-manager.interface';

export const SPAWN_RATE_RANGE = { min: 0, max: 60 } as const;
export const SIGNAL_DURATION_RANGE = { min: 10, max: 60 } as const;
export const EMERGENCY_SPAWN_RATE_RANGE = { min: 0, max: 20 } as const;
export const CONFLICT_ZONE_SIZE_RANGE = { min: 20, max: 50 } as const;
export const CONFLICT_ZONE_WAIT_RANGE = { min: 2, max: 10 } as const;
export const CONFLICT_ZONE_STOP_LINE_RANGE = { min: 10, max: 50 } as const;

const VALID_FRAME_RATES = [30, 60] as const;
const VALID_SPEED_MULTIPLIERS = [1, 2, 4] as const;
const VALID_SCENARIO_PRESETS = ['NORMAL_TRAFFIC', 'CONGESTION_TEST', 'SPARSE_TRAFFIC', 'PRIORITY_OPERATIONS', 'CUSTOM'] as const;
const VALID_SIGNAL_MODES = ['STRICT_MUTUAL_EXCLUSION', 'OPPOSING_SIMULTANEOUS'] as const;
const VALID_LANE_STRATEGIES = ['RANDOM', 'INTELLIGENT'] as const;

function assertInRange(field: string, value: number, range: { min: number; max: number }): void {
  if (typeof value !== 'number' || Number.isNaN(value) || value < range.min || value > range.max) {
    throw new InvalidConfigurationError(field, value);
  }
}

function assertOneOf<T>(field: string, value: T, allowed: readonly T[]): void {
  if (!allowed.includes(value)) {
    throw new InvalidConfigurationError(field, value);
  }
}

/**
 * Validates a fully-populated SimulationConfig candidate. Throws {@link InvalidConfigurationError}
 * on the first out-of-range/invalid field encountered.
 */
export function validateSimulationConfig(config: SimulationConfig): void {
  assertOneOf('scenarioPreset', config.scenarioPreset, VALID_SCENARIO_PRESETS);
  assertOneOf('targetFrameRate', config.targetFrameRate, VALID_FRAME_RATES);
  assertOneOf('signalCoordinationMode', config.signalCoordinationMode, VALID_SIGNAL_MODES);
  assertOneOf('laneSelectionStrategy', config.laneSelectionStrategy, VALID_LANE_STRATEGIES);
  assertOneOf('simulationSpeedMultiplier', config.simulationSpeedMultiplier, VALID_SPEED_MULTIPLIERS);

  for (const direction of ALL_DIRECTIONS) {
    const perDirection = config.perDirection[direction];
    assertInRange(`perDirection.${direction}.spawnRatePerMinute`, perDirection.spawnRatePerMinute, SPAWN_RATE_RANGE);
    assertInRange(`perDirection.${direction}.greenDurationSec`, perDirection.greenDurationSec, SIGNAL_DURATION_RANGE);
    assertInRange(`perDirection.${direction}.redDurationSec`, perDirection.redDurationSec, SIGNAL_DURATION_RANGE);
  }

  if (typeof config.emergency.enabled !== 'boolean') {
    throw new InvalidConfigurationError('emergency.enabled', config.emergency.enabled);
  }
  for (const type of ALL_EMERGENCY_TYPES) {
    assertInRange(`emergency.spawnRatePerMinute.${type}`, config.emergency.spawnRatePerMinute[type], EMERGENCY_SPAWN_RATE_RANGE);
  }

  assertInRange('conflictZone.sizeMeters', config.conflictZone.sizeMeters, CONFLICT_ZONE_SIZE_RANGE);
  assertInRange('conflictZone.maxWaitSeconds', config.conflictZone.maxWaitSeconds, CONFLICT_ZONE_WAIT_RANGE);
  assertInRange('conflictZone.stopLineDistanceMeters', config.conflictZone.stopLineDistanceMeters, CONFLICT_ZONE_STOP_LINE_RANGE);
}
