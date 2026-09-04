// Signal Controller public contract (TASK-016).
// Mirrors docs/INTERFACES.md §4 exactly.
import type { Direction, SignalCoordinationMode, SignalDirectionState } from '../../domain/types';
import type { SimulationConfig } from '../ConfigurationManager/configuration-manager.interface';

/** Strategy interface — one implementation per coordination mode (ADR-003). */
export interface ISignalCoordinationStrategy {
  readonly mode: SignalCoordinationMode;

  /** Advances the per-direction state machine by one physics tick (10 ms). */
  tick(deltaMs: number): void;

  /** @returns current state for all four directions. */
  getStates(): Record<Direction, SignalDirectionState>;

  /**
   * Invariant that must hold after every tick():
   * - STRICT_MUTUAL_EXCLUSION: at most one direction is GREEN.
   * - OPPOSING_SIMULTANEOUS: (N=GREEN or S=GREEN) AND (E=GREEN or W=GREEN) is never true.
   */
}

export interface ISignalController {
  /** Selects and locks in a coordination strategy. Startup-only (see StartupOnlyFieldError). */
  initialize(mode: SignalCoordinationMode, perDirectionTiming: SimulationConfig['perDirection']): void;

  tick(deltaMs: number): void;

  getStates(): Record<Direction, SignalDirectionState>;

  /** Emits whenever any direction's SignalState changes, for Telemetry/State Display. */
  onStateChange(listener: (states: Record<Direction, SignalDirectionState>) => void): void;
}
