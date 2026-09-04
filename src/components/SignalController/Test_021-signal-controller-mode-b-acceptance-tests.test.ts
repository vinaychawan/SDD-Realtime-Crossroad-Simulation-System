// TASK-021: Mode B acceptance test suite.
// Automates specs/requirements/002-REQ-005-signal-coordination.md's Mode B acceptance criteria:
//   - Opposing pairs allowed: N GREEN + S GREEN (simultaneously), E GREEN + W GREEN (simultaneously).
//   - Cross-direction exclusion: (N=GREEN or S=GREEN) AND (E=GREEN or W=GREEN) is never true.
//   - Collision prevention active: When Mode B active, REQ-NEW-COLLISION-PREVENTION-1 must also
//     be active. (Deferred to TASK-067 Integration; not tested in this unit phase.)
// Target: >=90% statement coverage for OpposingSimultaneousStrategy.
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

describe('TASK-021: Mode B (Opposing Simultaneous) acceptance criteria', () => {
  it('opposing pairs allowed: observe NORTH and SOUTH both GREEN simultaneously', () => {
    const strategy = new OpposingSimultaneousStrategy(uniformTiming(3, 3));
    strategy.tick(10); // Enter N/S GREEN phase
    const states = strategy.getStates();
    expect(states.NORTH.state).toBe('GREEN');
    expect(states.SOUTH.state).toBe('GREEN');
    expect(states.EAST.state).toBe('RED');
    expect(states.WEST.state).toBe('RED');
  });

  it('opposing pairs allowed: observe EAST and WEST both GREEN simultaneously', () => {
    const strategy = new OpposingSimultaneousStrategy(uniformTiming(2, 2));
    // Advance past N/S's GREEN(200) + AMBER(300) + ALL_RED(100) = 600 ticks to reach E/W GREEN.
    for (let i = 0; i < 600; i++) strategy.tick(10);
    const states = strategy.getStates();
    expect(states.EAST.state).toBe('GREEN');
    expect(states.WEST.state).toBe('GREEN');
    expect(states.NORTH.state).toBe('RED');
    expect(states.SOUTH.state).toBe('RED');
  });

  it('cross-direction exclusion invariant: never both N/S-green AND E/W-green, sampled 1000 times', () => {
    const strategy = new OpposingSimultaneousStrategy(uniformTiming(2, 2));
    const violations: number[] = [];
    for (let i = 0; i < 1000; i++) {
      strategy.tick(10);
      const states = strategy.getStates();
      const nsGreen = states.NORTH.state === 'GREEN' || states.SOUTH.state === 'GREEN';
      const ewGreen = states.EAST.state === 'GREEN' || states.WEST.state === 'GREEN';
      if (nsGreen && ewGreen) violations.push(i);
    }
    expect(violations).toHaveLength(0);
  });

  it('cross-direction exclusion invariant: extended 5-minute (sampled every 100ms)', () => {
    // 5 minutes = 300 seconds = 300000 ms; sample every 100 ms = 3000 samples.
    const strategy = new OpposingSimultaneousStrategy(uniformTiming(2, 2));
    let violations = 0;
    for (let i = 0; i < 3000; i++) {
      for (let j = 0; j < 10; j++) strategy.tick(10);
      const states = strategy.getStates();
      const nsGreen = states.NORTH.state === 'GREEN' || states.SOUTH.state === 'GREEN';
      const ewGreen = states.EAST.state === 'GREEN' || states.WEST.state === 'GREEN';
      if (nsGreen && ewGreen) violations++;
    }
    expect(violations).toBe(0);
  });

  it('RED directions report a positive countdown to their next GREEN phase', () => {
    const strategy = new OpposingSimultaneousStrategy(uniformTiming(2, 2));
    strategy.tick(10);
    const states = strategy.getStates();
    for (const direction of ALL_DIRECTIONS) {
      if (states[direction].state === 'RED') {
        expect(states[direction].secondsRemaining).toBeGreaterThan(0);
      }
    }
  });

  it('pair cycle period: N/S and E/W cycles repeat with consistent period', () => {
    const strategy = new OpposingSimultaneousStrategy(uniformTiming(1, 1));
    let nsGreenStartTicks: number[] = [];
    let ewGreenStartTicks: number[] = [];
    let lastNsGreen = false;
    let lastEwGreen = false;

    for (let tickIndex = 0; tickIndex < 8000; tickIndex++) {
      strategy.tick(10);
      const states = strategy.getStates();
      const nsGreen = states.NORTH.state === 'GREEN' || states.SOUTH.state === 'GREEN';
      const ewGreen = states.EAST.state === 'GREEN' || states.WEST.state === 'GREEN';
      if (nsGreen && !lastNsGreen) nsGreenStartTicks.push(tickIndex);
      if (ewGreen && !lastEwGreen) ewGreenStartTicks.push(tickIndex);
      lastNsGreen = nsGreen;
      lastEwGreen = ewGreen;
    }

    // Full cycle period: (green 100 + amber 300 + all-red 100) * 2 pairs = 1000 ticks.
    // Allow ±1 tick tolerance for rounding at phase boundaries.
    const FULL_CYCLE_TICKS = 1000;
    expect(nsGreenStartTicks.length).toBeGreaterThanOrEqual(4);
    expect(ewGreenStartTicks.length).toBeGreaterThanOrEqual(4);
    for (let i = 1; i < nsGreenStartTicks.length; i++) {
      const delta = nsGreenStartTicks[i] - nsGreenStartTicks[i - 1];
      expect(delta).toBeGreaterThanOrEqual(FULL_CYCLE_TICKS - 1);
      expect(delta).toBeLessThanOrEqual(FULL_CYCLE_TICKS + 1);
    }
    for (let i = 1; i < ewGreenStartTicks.length; i++) {
      const delta = ewGreenStartTicks[i] - ewGreenStartTicks[i - 1];
      expect(delta).toBeGreaterThanOrEqual(FULL_CYCLE_TICKS - 1);
      expect(delta).toBeLessThanOrEqual(FULL_CYCLE_TICKS + 1);
    }
  });
});
