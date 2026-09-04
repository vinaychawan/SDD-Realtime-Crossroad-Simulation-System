// Signal Controller (TASK-016). Strategy Pattern coordinator: holds a single
// ISignalCoordinationStrategy selected once at initialize() and delegates tick()/getStates() to
// it, per ADR-003. Swapping the coordination mode never requires modifying this class's core
// logic — only adding a new ISignalCoordinationStrategy implementation and a branch in
// createStrategy().
import type { Direction, SignalCoordinationMode, SignalDirectionState } from '../../domain/types';
import { ALL_DIRECTIONS } from '../../domain/constants';
import { StartupOnlyFieldError } from '../../domain/errors';
import type { SimulationConfig } from '../ConfigurationManager/configuration-manager.interface';
import type { ISignalController, ISignalCoordinationStrategy } from './signal-controller.interface';
import { StrictMutualExclusionStrategy } from './StrictMutualExclusionStrategy';
import { OpposingSimultaneousStrategy } from './OpposingSimultaneousStrategy';

type StateChangeListener = (states: Record<Direction, SignalDirectionState>) => void;

export class SignalController implements ISignalController {
  private strategy: ISignalCoordinationStrategy | undefined;
  private previousStates: Record<Direction, SignalDirectionState> | undefined;
  private readonly listeners: StateChangeListener[] = [];

  initialize(mode: SignalCoordinationMode, perDirectionTiming: SimulationConfig['perDirection']): void {
    // TASK-019: strategy swap only permitted at startup — refuse re-initialization for the
    // lifetime of this instance (enforced jointly with TASK-006's runtime-side
    // StartupOnlyFieldError on ConfigurationManager.update()).
    if (this.strategy) {
      throw new StartupOnlyFieldError(
        'signalCoordinationMode',
        'SignalController.initialize() can only be called once; strategy swap is only permitted at startup'
      );
    }
    this.strategy = this.createStrategy(mode, perDirectionTiming);
    this.previousStates = this.strategy.getStates();
  }

  private createStrategy(
    mode: SignalCoordinationMode,
    perDirectionTiming: SimulationConfig['perDirection']
  ): ISignalCoordinationStrategy {
    if (mode === 'STRICT_MUTUAL_EXCLUSION') {
      return new StrictMutualExclusionStrategy(perDirectionTiming);
    }
    if (mode === 'OPPOSING_SIMULTANEOUS') {
      return new OpposingSimultaneousStrategy(perDirectionTiming);
    }
    // TASK-019: unrecognized/invalid mode value (e.g. corrupted external config) falls back to
    // the conservative default, per REQ-005's "Mode default" acceptance criterion, with a logged
    // warning instead of a silently-ignored error path.
    console.warn(
      `SignalController: unrecognized SignalCoordinationMode "${String(mode)}" — falling back to STRICT_MUTUAL_EXCLUSION`
    );
    return new StrictMutualExclusionStrategy(perDirectionTiming);
  }

  tick(deltaMs: number): void {
    const strategy = this.requireInitialized();
    strategy.tick(deltaMs);
    const nextStates = strategy.getStates();
    if (this.statesChanged(this.previousStates!, nextStates)) {
      this.previousStates = nextStates;
      this.notify(nextStates);
    } else {
      this.previousStates = nextStates;
    }
  }

  getStates(): Record<Direction, SignalDirectionState> {
    return this.requireInitialized().getStates();
  }

  onStateChange(listener: StateChangeListener): void {
    this.listeners.push(listener);
  }

  private notify(states: Record<Direction, SignalDirectionState>): void {
    for (const listener of this.listeners) {
      listener(states);
    }
  }

  private requireInitialized(): ISignalCoordinationStrategy {
    if (!this.strategy) {
      throw new Error('SignalController: initialize() must be called before tick()/getStates()');
    }
    return this.strategy;
  }

  private statesChanged(
    prev: Record<Direction, SignalDirectionState>,
    next: Record<Direction, SignalDirectionState>
  ): boolean {
    return ALL_DIRECTIONS.some((direction) => prev[direction].state !== next[direction].state);
  }
}
