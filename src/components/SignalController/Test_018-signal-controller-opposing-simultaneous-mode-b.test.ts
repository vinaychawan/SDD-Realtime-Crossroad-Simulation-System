// TASK-018 acceptance criteria:
// - OpposingSimultaneousStrategy: N/S or E/W opposing pairs both GREEN simultaneously.
// - Perpendicular pairs never GREEN while the opposing pair is GREEN.
// - Unit test: 1000-tick simulated run asserts zero ticks with perpendicular-pair GREEN overlap.
import { describe, expect, it } from 'vitest';
import { ALL_DIRECTIONS } from '../../domain/constants';
import type { SimulationConfig } from '../ConfigurationManager/configuration-manager.interface';
import { OpposingSimultaneousStrategy } from './OpposingSimultaneousStrategy';

function uniformTiming(greenDurationSec: number, redDurationSec: number): SimulationConfig['perDirection'] {
  const result = {} as SimulationConfig['perDirection'];
  for (const direction of ALL_DIRECTIONS) {
    result[direction] = { spawnRatePerMinute: 20, greenDurationSec, redDurationSec };
  }
  return result;
}

function crossExclusionViolated(states: ReturnType<OpposingSimultaneousStrategy['getStates']>): boolean {
  const nsGreen = states.NORTH.state === 'GREEN' || states.SOUTH.state === 'GREEN';
  const ewGreen = states.EAST.state === 'GREEN' || states.WEST.state === 'GREEN';
  return nsGreen && ewGreen;
}

describe('TASK-018: OpposingSimultaneousStrategy (Mode B)', () => {
  it('never has both N/S-green and E/W-green true across a 1000-tick run', () => {
    const strategy = new OpposingSimultaneousStrategy(uniformTiming(1, 1));
    for (let i = 0; i < 1000; i++) {
      strategy.tick(10);
      expect(crossExclusionViolated(strategy.getStates())).toBe(false);
    }
  });

  it('NORTH and SOUTH are both GREEN simultaneously during the N/S pair phase', () => {
    const strategy = new OpposingSimultaneousStrategy(uniformTiming(2, 2));
    strategy.tick(10); // enter the first GREEN phase (N/S pair goes first)
    const states = strategy.getStates();
    expect(states.NORTH.state).toBe('GREEN');
    expect(states.SOUTH.state).toBe('GREEN');
    expect(states.EAST.state).toBe('RED');
    expect(states.WEST.state).toBe('RED');
  });

  it('EAST and WEST are both GREEN simultaneously during the E/W pair phase', () => {
    const strategy = new OpposingSimultaneousStrategy(uniformTiming(1, 1));
    // Advance past N/S's GREEN(100) + AMBER(300) + ALL_RED(100) = 500 ticks to reach E/W GREEN.
    for (let i = 0; i < 500; i++) strategy.tick(10);
    const states = strategy.getStates();
    expect(states.EAST.state).toBe('GREEN');
    expect(states.WEST.state).toBe('GREEN');
    expect(states.NORTH.state).toBe('RED');
    expect(states.SOUTH.state).toBe('RED');
  });

  it('cross-direction exclusion holds across a full pair rotation (sampled every tick)', () => {
    const strategy = new OpposingSimultaneousStrategy(uniformTiming(1, 1));
    let violations = 0;
    for (let i = 0; i < 2000; i++) {
      strategy.tick(10);
      if (crossExclusionViolated(strategy.getStates())) violations++;
    }
    expect(violations).toBe(0);
  });
});
