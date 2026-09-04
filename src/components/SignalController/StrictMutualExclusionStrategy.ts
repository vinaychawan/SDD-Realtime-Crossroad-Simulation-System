// Mode A: Strict Mutual Exclusion (TASK-017).
// Single round-robin across all four directions — the diagram in
// specs/requirements/002-REQ-005-signal-coordination.md is the authoritative behavioral
// contract: [NORTH GREEN]→[NORTH AMBER]→[ALL RED]→[SOUTH GREEN]→...→[WEST AMBER]→[ALL RED]→
// back to [NORTH GREEN]. This trivially guarantees "at most one direction GREEN at any time"
// (TASK-017's #1, safety-critical acceptance criterion) since only one direction is ever in an
// active (non-RED) phase.
//
// Design note on `redDurationSec`: PerDirectionConfig has an independent `redDurationSec` per
// direction, but a single shared round-robin structurally cannot honor an independently-set red
// duration per direction without creating overlapping-green or idle-dead-time contradictions —
// each direction's actual red duration is the sum of the other three directions' green+amber
// durations plus the all-red clearance intervals between them. This strategy uses
// `greenDurationSec` as the authoritative per-direction timing input and treats
// `redDurationSec` as reserved for future/display use, not a literal timer here.
import type { Direction, SignalDirectionState, SignalState } from '../../domain/types';
import { ALL_DIRECTIONS } from '../../domain/constants';
import type { SimulationConfig } from '../ConfigurationManager/configuration-manager.interface';
import type { ISignalCoordinationStrategy } from './signal-controller.interface';
import { AMBER_DURATION_MS, ALL_RED_DURATION_MS } from './constants';

const ROTATION_ORDER: readonly Direction[] = ['NORTH', 'SOUTH', 'EAST', 'WEST'];
type Phase = 'GREEN' | 'AMBER' | 'ALL_RED';

export class StrictMutualExclusionStrategy implements ISignalCoordinationStrategy {
  readonly mode = 'STRICT_MUTUAL_EXCLUSION' as const;

  private readonly perDirectionTiming: SimulationConfig['perDirection'];
  private currentIndex = 0;
  private phase: Phase = 'GREEN';
  private phaseElapsedMs = 0;

  constructor(perDirectionTiming: SimulationConfig['perDirection']) {
    this.perDirectionTiming = perDirectionTiming;
  }

  tick(deltaMs: number): void {
    this.phaseElapsedMs += deltaMs;
    let phaseDuration = this.currentPhaseDurationMs();
    while (this.phaseElapsedMs >= phaseDuration) {
      this.phaseElapsedMs -= phaseDuration;
      this.advancePhase();
      phaseDuration = this.currentPhaseDurationMs();
    }
  }

  getStates(): Record<Direction, SignalDirectionState> {
    const states = {} as Record<Direction, SignalDirectionState>;
    for (const direction of ALL_DIRECTIONS) {
      states[direction] = this.stateFor(direction);
    }
    return states;
  }

  private currentPhaseDurationMs(): number {
    if (this.phase === 'GREEN') {
      return this.greenDurationMs(ROTATION_ORDER[this.currentIndex]);
    }
    if (this.phase === 'AMBER') {
      return AMBER_DURATION_MS;
    }
    return ALL_RED_DURATION_MS;
  }

  private greenDurationMs(direction: Direction): number {
    return this.perDirectionTiming[direction].greenDurationSec * 1000;
  }

  private advancePhase(): void {
    if (this.phase === 'GREEN') {
      this.phase = 'AMBER';
    } else if (this.phase === 'AMBER') {
      this.phase = 'ALL_RED';
    } else {
      this.phase = 'GREEN';
      this.currentIndex = (this.currentIndex + 1) % ROTATION_ORDER.length;
    }
  }

  private stateFor(direction: Direction): SignalDirectionState {
    const activeDirection = ROTATION_ORDER[this.currentIndex];
    if (direction === activeDirection && this.phase !== 'ALL_RED') {
      const state: SignalState = this.phase;
      const remainingMs = this.currentPhaseDurationMs() - this.phaseElapsedMs;
      return { direction, state, secondsRemaining: Math.ceil(remainingMs / 1000) };
    }
    return { direction, state: 'RED', secondsRemaining: Math.ceil(this.msUntilNextGreen(direction) / 1000) };
  }

  /** Walks the fixed rotation to compute total ms until `direction`'s next GREEN phase starts. */
  private msUntilNextGreen(direction: Direction): number {
    let remaining = this.currentPhaseDurationMs() - this.phaseElapsedMs;
    let phase = this.phase;
    let index = this.currentIndex;

    while (!(phase === 'GREEN' && ROTATION_ORDER[index] === direction)) {
      if (phase === 'GREEN') {
        phase = 'AMBER';
        remaining += AMBER_DURATION_MS;
      } else if (phase === 'AMBER') {
        phase = 'ALL_RED';
        remaining += ALL_RED_DURATION_MS;
      } else {
        phase = 'GREEN';
        index = (index + 1) % ROTATION_ORDER.length;
        remaining += this.greenDurationMs(ROTATION_ORDER[index]);
      }
    }
    return remaining;
  }
}
