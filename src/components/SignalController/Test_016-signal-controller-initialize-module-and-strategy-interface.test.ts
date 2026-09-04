// TASK-016 acceptance criteria:
// - Module structure exists at src/components/SignalController/ (this file, alongside it).
// - ISignalController / ISignalCoordinationStrategy match docs/INTERFACES.md §4.
// - Strategy Pattern scaffolding allows swapping coordination mode without modifying
//   SignalController's core logic.
import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ALL_DIRECTIONS } from '../../domain/constants';
import type { SimulationConfig } from '../ConfigurationManager/configuration-manager.interface';
import { SignalController } from './SignalController';
import { StrictMutualExclusionStrategy } from './StrictMutualExclusionStrategy';
import { OpposingSimultaneousStrategy } from './OpposingSimultaneousStrategy';

const MODULE_DIR = dirname(fileURLToPath(import.meta.url));

function uniformTiming(greenDurationSec: number, redDurationSec: number): SimulationConfig['perDirection'] {
  const result = {} as SimulationConfig['perDirection'];
  for (const direction of ALL_DIRECTIONS) {
    result[direction] = { spawnRatePerMinute: 20, greenDurationSec, redDurationSec };
  }
  return result;
}

describe('TASK-016: Signal Controller module structure and strategy interface', () => {
  it('module directory contains the expected files', () => {
    expect(existsSync(join(MODULE_DIR, 'signal-controller.interface.ts'))).toBe(true);
    expect(existsSync(join(MODULE_DIR, 'SignalController.ts'))).toBe(true);
    expect(existsSync(join(MODULE_DIR, 'StrictMutualExclusionStrategy.ts'))).toBe(true);
    expect(existsSync(join(MODULE_DIR, 'OpposingSimultaneousStrategy.ts'))).toBe(true);
    expect(existsSync(join(MODULE_DIR, 'README.md'))).toBe(true);
  });

  it('each strategy exposes the correct readonly `mode` matching its SignalCoordinationMode', () => {
    const timing = uniformTiming(30, 30);
    expect(new StrictMutualExclusionStrategy(timing).mode).toBe('STRICT_MUTUAL_EXCLUSION');
    expect(new OpposingSimultaneousStrategy(timing).mode).toBe('OPPOSING_SIMULTANEOUS');
  });

  it('getStates() returns a SignalDirectionState for all four directions after initialize()', () => {
    const controller = new SignalController();
    controller.initialize('STRICT_MUTUAL_EXCLUSION', uniformTiming(30, 30));
    const states = controller.getStates();
    for (const direction of ALL_DIRECTIONS) {
      expect(states[direction].direction).toBe(direction);
      expect(['RED', 'GREEN', 'AMBER']).toContain(states[direction].state);
      expect(states[direction].secondsRemaining).toBeGreaterThanOrEqual(0);
    }
  });

  it('Strategy Pattern: identical SignalController call sequence works polymorphically for both modes', () => {
    const modes: Array<'STRICT_MUTUAL_EXCLUSION' | 'OPPOSING_SIMULTANEOUS'> = [
      'STRICT_MUTUAL_EXCLUSION',
      'OPPOSING_SIMULTANEOUS'
    ];
    for (const mode of modes) {
      // Identical driving code for both modes — SignalController's core tick()/getStates() logic
      // never branches on `mode`; only createStrategy() selects the implementation.
      const controller = new SignalController();
      controller.initialize(mode, uniformTiming(30, 30));
      for (let i = 0; i < 50; i++) {
        controller.tick(10);
      }
      const states = controller.getStates();
      expect(Object.keys(states)).toHaveLength(4);
    }
  });

  it('onStateChange listeners can be registered without throwing', () => {
    const controller = new SignalController();
    expect(() => controller.onStateChange(() => undefined)).not.toThrow();
  });
});
