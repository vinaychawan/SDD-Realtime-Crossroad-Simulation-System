// Mode B: Opposing Simultaneous (TASK-018).
// Two-pair round-robin: [N+S GREEN, E+W RED] → [N+S AMBER, E+W RED] → [ALL RED] →
// [E+W GREEN, N+S RED] → [E+W AMBER, N+S RED] → [ALL RED] → back to [N+S GREEN...], per
// specs/requirements/002-REQ-005-signal-coordination.md. Guarantees the cross-direction
// exclusion invariant "(N=GREEN or S=GREEN) AND (E=GREEN or W=GREEN) is never true" by
// construction: only one pair is ever in an active (non-RED) phase at a time.
//
// Design note on per-pair green duration: PerDirectionConfig has an independent
// `greenDurationSec` per direction, but a pair transitions together as a single unit — this
// strategy uses the FIRST member of each pair (NORTH for the N/S pair, EAST for the E/W pair)
// as the pair's authoritative green duration, since the schema has no dedicated per-pair field.
//
// Design note on IConflictZoneManager (ADR-003): ADR-003 documents a compile-time dependency
// from this strategy on IConflictZoneManager ("Mode B blocked unless Conflict Zone Manager is
// active", REQ-NEW-COLLISION-PREVENTION-1). Conflict Zone Manager does not exist yet (Phase 4,
// TASK-022+) and neither TASK-018's nor TASK-019's acceptance criteria require wiring it in this
// phase — that gating is deferred to TASK-022+ and TASK-067 (Integration), and is not
// implemented here.
import type { Direction, SignalDirectionState, SignalState } from '../../domain/types';
import { ALL_DIRECTIONS } from '../../domain/constants';
import type { SimulationConfig } from '../ConfigurationManager/configuration-manager.interface';
import type { ISignalCoordinationStrategy } from './signal-controller.interface';
import { AMBER_DURATION_MS, ALL_RED_DURATION_MS } from './constants';

const PAIR_ORDER: readonly (readonly [Direction, Direction])[] = [
  ['NORTH', 'SOUTH'],
  ['EAST', 'WEST']
];
type Phase = 'GREEN' | 'AMBER' | 'ALL_RED';

export class OpposingSimultaneousStrategy implements ISignalCoordinationStrategy {
  readonly mode = 'OPPOSING_SIMULTANEOUS' as const;

  private readonly perDirectionTiming: SimulationConfig['perDirection'];
  private currentPairIndex = 0;
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
      return this.greenDurationMs(PAIR_ORDER[this.currentPairIndex][0]);
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
      this.currentPairIndex = (this.currentPairIndex + 1) % PAIR_ORDER.length;
    }
  }

  private stateFor(direction: Direction): SignalDirectionState {
    const activePair = PAIR_ORDER[this.currentPairIndex];
    const isActivePairMember = activePair[0] === direction || activePair[1] === direction;
    if (isActivePairMember && this.phase !== 'ALL_RED') {
      const state: SignalState = this.phase;
      const remainingMs = this.currentPhaseDurationMs() - this.phaseElapsedMs;
      return { direction, state, secondsRemaining: Math.ceil(remainingMs / 1000) };
    }
    return { direction, state: 'RED', secondsRemaining: Math.ceil(this.msUntilNextGreen(direction) / 1000) };
  }

  /** Walks the fixed pair rotation to compute total ms until `direction`'s pair next turns GREEN. */
  private msUntilNextGreen(direction: Direction): number {
    let remaining = this.currentPhaseDurationMs() - this.phaseElapsedMs;
    let phase = this.phase;
    let index = this.currentPairIndex;

    const pairContains = (pairIndex: number): boolean =>
      PAIR_ORDER[pairIndex][0] === direction || PAIR_ORDER[pairIndex][1] === direction;

    while (!(phase === 'GREEN' && pairContains(index))) {
      if (phase === 'GREEN') {
        phase = 'AMBER';
        remaining += AMBER_DURATION_MS;
      } else if (phase === 'AMBER') {
        phase = 'ALL_RED';
        remaining += ALL_RED_DURATION_MS;
      } else {
        phase = 'GREEN';
        index = (index + 1) % PAIR_ORDER.length;
        remaining += this.greenDurationMs(PAIR_ORDER[index][0]);
      }
    }
    return remaining;
  }
}
