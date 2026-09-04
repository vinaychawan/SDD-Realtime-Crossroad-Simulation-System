// TASK-017 acceptance criteria:
// - StrictMutualExclusionStrategy: one direction GREEN at a time.
// - Amber transition duration configurable and enforced between GREEN→RED transitions.
// - Unit test: 1000-tick simulated run asserts zero ticks with 2+ non-opposing GREEN directions.
import { describe, expect, it } from 'vitest';
import { ALL_DIRECTIONS } from '../../domain/constants';
import type { Direction } from '../../domain/types';
import type { SimulationConfig } from '../ConfigurationManager/configuration-manager.interface';
import { StrictMutualExclusionStrategy } from './StrictMutualExclusionStrategy';
import { AMBER_DURATION_MS } from './constants';

function uniformTiming(greenDurationSec: number, redDurationSec: number): SimulationConfig['perDirection'] {
  const result = {} as SimulationConfig['perDirection'];
  for (const direction of ALL_DIRECTIONS) {
    result[direction] = { spawnRatePerMinute: 20, greenDurationSec, redDurationSec };
  }
  return result;
}

function countGreen(states: ReturnType<StrictMutualExclusionStrategy['getStates']>): number {
  return ALL_DIRECTIONS.filter((d) => states[d].state === 'GREEN').length;
}

describe('TASK-017: StrictMutualExclusionStrategy (Mode A)', () => {
  it('never has more than one direction GREEN across a 1000-tick run', () => {
    // Short green duration so the 1000-tick / 10 s window exercises multiple direction
    // transitions, not just a single direction's still-active green phase.
    const strategy = new StrictMutualExclusionStrategy(uniformTiming(1, 1));
    for (let i = 0; i < 1000; i++) {
      strategy.tick(10);
      expect(countGreen(strategy.getStates())).toBeLessThanOrEqual(1);
    }
  });

  it('amber phase lasts exactly the fixed 3-second duration', () => {
    const strategy = new StrictMutualExclusionStrategy(uniformTiming(1, 1));
    // Advance through NORTH's 1-second GREEN phase (100 ticks of 10ms).
    for (let i = 0; i < 100; i++) strategy.tick(10);
    expect(strategy.getStates().NORTH.state).toBe('AMBER');

    // Amber should hold for AMBER_DURATION_MS, then leave amber.
    const amberTicks = AMBER_DURATION_MS / 10;
    for (let i = 0; i < amberTicks - 1; i++) {
      strategy.tick(10);
      expect(strategy.getStates().NORTH.state).toBe('AMBER');
    }
    strategy.tick(10);
    expect(strategy.getStates().NORTH.state).not.toBe('AMBER');
  });

  it('directions alternate in NORTH → SOUTH → EAST → WEST → NORTH rotation order', () => {
    const strategy = new StrictMutualExclusionStrategy(uniformTiming(1, 1));
    const observedOrder: Direction[] = [];
    let lastGreen: Direction | undefined;

    // Two full rotations: (green 100 + amber 300 + all-red 100) * 4 directions * 2 = 4000 ticks.
    for (let i = 0; i < 4000; i++) {
      strategy.tick(10);
      const states = strategy.getStates();
      const green = ALL_DIRECTIONS.find((d) => states[d].state === 'GREEN');
      if (green && green !== lastGreen) {
        observedOrder.push(green);
        lastGreen = green;
      }
    }

    expect(observedOrder.slice(0, 8)).toEqual([
      'NORTH', 'SOUTH', 'EAST', 'WEST',
      'NORTH', 'SOUTH', 'EAST', 'WEST'
    ]);
  });
});
