// Configuration Manager module public contract (TASK-004).
// Mirrors docs/INTERFACES.md §3 exactly for SimulationConfig / IConfigurationManager.
import type { Direction, EmergencyVehicleType, LaneSelectionStrategyKind, SignalCoordinationMode } from '../../domain/types';

export type ScenarioPreset =
  | 'NORMAL_TRAFFIC'
  | 'CONGESTION_TEST'
  | 'SPARSE_TRAFFIC'
  | 'PRIORITY_OPERATIONS'
  | 'CUSTOM';

export interface PerDirectionConfig {
  /** Vehicles spawned per minute for this direction. Range: 0–60. */
  spawnRatePerMinute: number;
  /** Seconds this direction's signal stays GREEN. Range: 10–60. */
  greenDurationSec: number;
  /** Seconds this direction's signal stays RED. Range: 10–60. */
  redDurationSec: number;
}

export interface EmergencyConfig {
  enabled: boolean;
  /** Per-type spawn rate, vehicles/minute. Range: 0–20 each (MF-006 Option A: independent fields). */
  spawnRatePerMinute: Record<EmergencyVehicleType, number>;
}

export interface ConflictZoneConfig {
  /** Meters. Range: 20–50, default 25. */
  sizeMeters: number;
  /** Seconds. Range: 2–10, default 5. */
  maxWaitSeconds: number;
  /** Meters. Range: 10–50, default 20. */
  stopLineDistanceMeters: number;
}

export interface SimulationConfig {
  scenarioPreset: ScenarioPreset;
  targetFrameRate: 30 | 60; // runtime-modifiable
  signalCoordinationMode: SignalCoordinationMode; // startup-only
  laneSelectionStrategy: LaneSelectionStrategyKind; // startup-only
  perDirection: Record<Direction, PerDirectionConfig>;
  emergency: EmergencyConfig;
  conflictZone: ConflictZoneConfig;
  simulationSpeedMultiplier: 1 | 2 | 4;
}

/** Orchestrator run state, as observed by the Configuration Manager for startup-only enforcement. */
export type ConfigRunState = 'CONFIGURATION_ACTIVE' | 'RUNNING' | 'PAUSED';

export interface IConfigurationManager {
  /**
   * Applies a scenario preset, fully populating SimulationConfig per MF-005's exhaustive table.
   * @postcondition All fields in SimulationConfig are set to defined, non-ambiguous values.
   */
  applyScenarioPreset(preset: SimulationConfig['scenarioPreset']): void;

  /**
   * Updates one or more configuration fields.
   * @throws {InvalidConfigurationError} if any value is out of range (see field ranges above).
   * @throws {StartupOnlyFieldError} if attempting to change signalCoordinationMode or
   *         laneSelectionStrategy while the orchestrator is RUNNING or PAUSED.
   */
  update(partial: Partial<SimulationConfig>): void;

  /** @returns a read-only snapshot of the current configuration, for REQ-028 Configuration panel. */
  getSnapshot(): Readonly<SimulationConfig>;

  /** Emits on every successful `update()` or `applyScenarioPreset()` call. */
  onChange(listener: (config: Readonly<SimulationConfig>) => void): void;
}
