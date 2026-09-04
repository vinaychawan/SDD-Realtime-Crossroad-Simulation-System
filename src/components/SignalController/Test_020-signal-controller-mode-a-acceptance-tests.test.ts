// TASK-020: Mode A acceptance test suite.
// Automates specs/requirements/002-REQ-005-signal-coordination.md's Mode A acceptance criteria:
//   - One direction green at a time (sampled continuously; never >1 direction GREEN).
//   - Directional alternation: NORTH/SOUTH alternate in cycle; EAST/WEST alternate in cycle.
//   - Independent cycles: N/S and E/W cycle continuously with consistent (non-drifting) period.
// Target: >=90% statement coverage for StrictMutualExclusionStrategy.
import { describe, expect, it } from 'vitest';
import { ALL_DIRECTIONS } from '../../domain/constants';
import type { Direction } from '../../domain/types';
import type { SimulationConfig } from '../ConfigurationManager/configuration-manager.interface';
import { StrictMutualExclusionStrategy } from './StrictMutualExclusionStrategy';

function uniformTiming(greenDurationSec: number, redDurationSec: number): SimulationConfig['perDirection'] {
  const result = {} as SimulationConfig['perDirection'];
  for (const direction of ALL_DIRECTIONS) {
    result[direction] = { spawnRatePerMinute: 20, greenDurationSec, redDurationSec };
  }
  return result;
}

describe('TASK-020: Mode A (Strict Mutual Exclusion) acceptance criteria', () => {
  it('one direction green at a time: never >1 direction GREEN, sampled every tick over a long run', () => {
    const strategy = new StrictMutualExclusionStrategy(uniformTiming(2, 2));
    for (let i = 0; i < 6000; i++) {
      strategy.tick(10);
      const greenCount = ALL_DIRECTIONS.filter((d) => strategy.getStates()[d].state === 'GREEN').length;
      expect(greenCount).toBeLessThanOrEqual(1);
    }
  });

  it('directional alternation: NORTH/SOUTH and EAST/WEST alternate in cycle, verified over 10 cycles', () => {
    const strategy = new StrictMutualExclusionStrategy(uniformTiming(1, 1));
    const order: Direction[] = [];
    let lastGreen: Direction | undefined;
    // One full rotation = (100 + 300 + 100) * 4 = 2000 ticks; 10 cycles = 20000 ticks.
    for (let i = 0; i < 20000; i++) {
      strategy.tick(10);
      const green = ALL_DIRECTIONS.find((d) => strategy.getStates()[d].state === 'GREEN');
      if (green && green !== lastGreen) {
        order.push(green);
        lastGreen = green;
      }
    }
    expect(order.length).toBeGreaterThanOrEqual(40); // 10 cycles * 4 directions
    for (let cycle = 0; cycle < 10; cycle++) {
      expect(order.slice(cycle * 4, cycle * 4 + 4)).toEqual(['NORTH', 'SOUTH', 'EAST', 'WEST']);
    }
  });

  it('independent, continuous cycles: each direction repeats with a constant, non-drifting period', () => {
    const strategy = new StrictMutualExclusionStrategy(uniformTiming(1, 1));
    const greenStartTickByDirection: Record<Direction, number[]> = { NORTH: [], SOUTH: [], EAST: [], WEST: [] };
    let lastGreen: Direction | undefined;

    for (let tickIndex = 0; tickIndex < 20000; tickIndex++) {
      strategy.tick(10);
      const green = ALL_DIRECTIONS.find((d) => strategy.getStates()[d].state === 'GREEN');
      if (green && green !== lastGreen) {
        greenStartTickByDirection[green].push(tickIndex);
        lastGreen = green;
      }
    }

    // Full-rotation period, in ticks: (green 100 + amber 300 + all-red 100) * 4 directions = 2000.
    // Allow ±1 tick tolerance for rounding at phase boundaries.
    const FULL_ROTATION_TICKS = 2000;
    for (const direction of ALL_DIRECTIONS) {
      const starts = greenStartTickByDirection[direction];
      expect(starts.length).toBeGreaterThanOrEqual(9);
      for (let i = 1; i < starts.length; i++) {
        const delta = starts[i] - starts[i - 1];
        expect(delta).toBeGreaterThanOrEqual(FULL_ROTATION_TICKS - 1);
        expect(delta).toBeLessThanOrEqual(FULL_ROTATION_TICKS + 1);
      }
    }
  });

  it('RED directions report a positive countdown to their next GREEN phase', () => {
    const strategy = new StrictMutualExclusionStrategy(uniformTiming(2, 2));
    strategy.tick(10);
    const states = strategy.getStates();
    for (const direction of ALL_DIRECTIONS) {
      if (states[direction].state === 'RED') {
        expect(states[direction].secondsRemaining).toBeGreaterThan(0);
      }
    }
  });
});
