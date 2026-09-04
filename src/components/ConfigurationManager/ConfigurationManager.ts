// Configuration Manager concrete implementation (TASK-004 through TASK-008).
import { StartupOnlyFieldError } from '../../domain/errors';
import type {
  ConfigRunState,
  IConfigurationManager,
  SimulationConfig
} from './configuration-manager.interface';
import { buildPresetConfig } from './scenarioPresets';
import { validateSimulationConfig } from './validation';

/** Fields that can only change while the orchestrator run state is CONFIGURATION_ACTIVE. */
const STARTUP_ONLY_FIELDS = ['signalCoordinationMode', 'laneSelectionStrategy'] as const;

/** Deep-clones a plain-data config and freezes every nested object so snapshots are immutable. */
function frozenClone(config: SimulationConfig): Readonly<SimulationConfig> {
  const clone = JSON.parse(JSON.stringify(config)) as SimulationConfig;
  const deepFreeze = (value: unknown): void => {
    if (value === null || typeof value !== 'object' || Object.isFrozen(value)) {
      return;
    }
    Object.freeze(value);
    for (const key of Object.keys(value as Record<string, unknown>)) {
      deepFreeze((value as Record<string, unknown>)[key]);
    }
  };
  deepFreeze(clone);
  return clone;
}

/** Merges a partial update onto the current config, one level deep for object-valued fields. */
function mergeConfig(current: SimulationConfig, partial: Partial<SimulationConfig>): SimulationConfig {
  const merged: SimulationConfig = { ...current, ...partial };
  if (partial.perDirection) {
    merged.perDirection = { ...current.perDirection, ...partial.perDirection };
  }
  if (partial.emergency) {
    merged.emergency = {
      ...current.emergency,
      ...partial.emergency,
      spawnRatePerMinute: {
        ...current.emergency.spawnRatePerMinute,
        ...partial.emergency.spawnRatePerMinute
      }
    };
  }
  if (partial.conflictZone) {
    merged.conflictZone = { ...current.conflictZone, ...partial.conflictZone };
  }
  return merged;
}

export class ConfigurationManager implements IConfigurationManager {
  private config: SimulationConfig;
  private runState: ConfigRunState = 'CONFIGURATION_ACTIVE';
  private readonly listeners: Array<(config: Readonly<SimulationConfig>) => void> = [];

  constructor(initialPreset: SimulationConfig['scenarioPreset'] = 'NORMAL_TRAFFIC') {
    this.config = buildPresetConfig(initialPreset);
  }

  /** Informs the Configuration Manager of the orchestrator's current run state (wired in TASK-067). */
  setRunState(state: ConfigRunState): void {
    this.runState = state;
  }

  getRunState(): ConfigRunState {
    return this.runState;
  }

  applyScenarioPreset(preset: SimulationConfig['scenarioPreset']): void {
    const next = buildPresetConfig(preset);
    validateSimulationConfig(next);
    this.config = next;
    this.notify();
  }

  update(partial: Partial<SimulationConfig>): void {
    for (const field of STARTUP_ONLY_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(partial, field) && this.runState !== 'CONFIGURATION_ACTIVE') {
        throw new StartupOnlyFieldError(field);
      }
    }

    const candidate = mergeConfig(this.config, partial);
    validateSimulationConfig(candidate);

    this.config = candidate;
    this.notify();
  }

  getSnapshot(): Readonly<SimulationConfig> {
    return frozenClone(this.config);
  }

  onChange(listener: (config: Readonly<SimulationConfig>) => void): void {
    this.listeners.push(listener);
  }

  private notify(): void {
    const snapshot = this.getSnapshot();
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }
}
