// TASK-019 acceptance criteria:
// - Invalid/unrecognized SignalCoordinationMode falls back to Strict Mutual Exclusion with a
//   logged warning.
// - Strategy swap only permitted at startup (enforced jointly with TASK-006's
//   StartupOnlyFieldError).
// - Unit test for fallback behavior given a corrupted/invalid mode value.
import { describe, expect, it, vi } from 'vitest';
import { ALL_DIRECTIONS } from '../../domain/constants';
import { StartupOnlyFieldError } from '../../domain/errors';
import type { SignalCoordinationMode } from '../../domain/types';
import type { SimulationConfig } from '../ConfigurationManager/configuration-manager.interface';
import { SignalController } from './SignalController';

function uniformTiming(greenDurationSec: number, redDurationSec: number): SimulationConfig['perDirection'] {
  const result = {} as SimulationConfig['perDirection'];
  for (const direction of ALL_DIRECTIONS) {
    result[direction] = { spawnRatePerMinute: 20, greenDurationSec, redDurationSec };
  }
  return result;
}

describe('TASK-019: Signal Controller fallback & error handling', () => {
  it('falls back to STRICT_MUTUAL_EXCLUSION and logs a warning for a corrupted mode value', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const controller = new SignalController();
    controller.initialize('BOGUS_MODE' as SignalCoordinationMode, uniformTiming(30, 30));

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toContain('BOGUS_MODE');

    // Fell back to Mode A behavior: at most one direction GREEN.
    controller.tick(10);
    const states = controller.getStates();
    const greenCount = ALL_DIRECTIONS.filter((d) => states[d].state === 'GREEN').length;
    expect(greenCount).toBeLessThanOrEqual(1);

    warnSpy.mockRestore();
  });

  it('throws StartupOnlyFieldError if initialize() is called a second time', () => {
    const controller = new SignalController();
    controller.initialize('STRICT_MUTUAL_EXCLUSION', uniformTiming(30, 30));
    expect(() => controller.initialize('OPPOSING_SIMULTANEOUS', uniformTiming(30, 30))).toThrow(
      StartupOnlyFieldError
    );
  });

  it('throws if tick() is called before initialize()', () => {
    const controller = new SignalController();
    expect(() => controller.tick(10)).toThrow(/initialize/);
  });

  it('throws if getStates() is called before initialize()', () => {
    const controller = new SignalController();
    expect(() => controller.getStates()).toThrow(/initialize/);
  });

  it('onStateChange fires when a direction transitions from GREEN to AMBER or RED', () => {
    const controller = new SignalController();
    controller.initialize('STRICT_MUTUAL_EXCLUSION', uniformTiming(1, 1)); // 1s green per direction
    const fireCount = { count: 0 };
    controller.onStateChange(() => fireCount.count++);
    // Tick past the first GREEN phase (100 ticks to 1000ms), triggering AMBER.
    for (let i = 0; i < 110; i++) controller.tick(10);
    expect(fireCount.count).toBeGreaterThan(0);
  });

  it('multiple onStateChange listeners all fire when state changes', () => {
    const controller = new SignalController();
    controller.initialize('STRICT_MUTUAL_EXCLUSION', uniformTiming(1, 1));
    const calls1 = { count: 0 };
    const calls2 = { count: 0 };
    controller.onStateChange(() => calls1.count++);
    controller.onStateChange(() => calls2.count++);
    // Tick past a few state transitions.
    for (let i = 0; i < 300; i++) controller.tick(10);
    expect(calls1.count).toBeGreaterThan(0);
    expect(calls2.count).toBeGreaterThan(0);
    expect(calls1.count).toBe(calls2.count);
  });
});
