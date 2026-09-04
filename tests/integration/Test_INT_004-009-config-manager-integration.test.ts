// Integration tests covering TASK-004..009 (Configuration Manager) cross-function scenarios.
// Unlike the per-task Test_00x unit tests, these exercise validation + startup-only enforcement +
// scenario presets + change notification together in realistic multi-step sequences.
import { describe, it, expect, vi } from 'vitest';
import { ConfigurationManager } from '../../src/components/ConfigurationManager/ConfigurationManager';
import { StartupOnlyFieldError, InvalidConfigurationError } from '../../src/domain/errors';

describe('Integration: Configuration Manager (TASK-004..009)', () => {
  it('an invalid update after applying a preset leaves the preset config intact and does not notify', () => {
    // Crosses TASK-007 (presets) + TASK-005 (validation) + TASK-008 (notification).
    const manager = new ConfigurationManager();
    const listener = vi.fn();
    manager.applyScenarioPreset('CONGESTION_TEST');
    manager.onChange(listener);

    expect(() => manager.update({ targetFrameRate: 45 as unknown as 30 | 60 })).toThrow(InvalidConfigurationError);

    const snapshot = manager.getSnapshot();
    expect(snapshot.scenarioPreset).toBe('CONGESTION_TEST');
    expect(snapshot.targetFrameRate).toBe(30);
    expect(listener).not.toHaveBeenCalled();
  });

  it('full run-state lifecycle: configure, run, attempt startup-only change, return to configure, retry', () => {
    // Crosses TASK-004 (construction) + TASK-006 (startup-only) + TASK-005 (validation) + TASK-008 (notification).
    const manager = new ConfigurationManager();
    const listener = vi.fn();
    manager.onChange(listener);

    manager.applyScenarioPreset('PRIORITY_OPERATIONS');
    manager.update({ laneSelectionStrategy: 'RANDOM' });

    manager.setRunState('RUNNING');
    expect(() => manager.update({ laneSelectionStrategy: 'INTELLIGENT' })).toThrow(StartupOnlyFieldError);
    // Non-startup-only fields remain editable while RUNNING.
    expect(() => manager.update({ simulationSpeedMultiplier: 2 })).not.toThrow();

    manager.setRunState('PAUSED');
    expect(() => manager.update({ signalCoordinationMode: 'STRICT_MUTUAL_EXCLUSION' })).toThrow(StartupOnlyFieldError);

    manager.setRunState('CONFIGURATION_ACTIVE');
    expect(() => manager.update({ laneSelectionStrategy: 'INTELLIGENT' })).not.toThrow();

    const finalSnapshot = manager.getSnapshot();
    expect(finalSnapshot.laneSelectionStrategy).toBe('INTELLIGENT');
    expect(finalSnapshot.simulationSpeedMultiplier).toBe(2);
    // preset(1) + laneSelectionStrategy(1) + speedMultiplier(1) + laneSelectionStrategy retry(1) = 4 successful notifications.
    expect(listener).toHaveBeenCalledTimes(4);
  });

  it('cycling through all 5 presets notifies once per switch with a fully-populated frozen snapshot each time', () => {
    // Crosses TASK-007 (presets) + TASK-008 (notification) + TASK-004 (full field population).
    const manager = new ConfigurationManager();
    const received: string[] = [];
    manager.onChange((config) => {
      received.push(config.scenarioPreset);
      expect(Object.isFrozen(config)).toBe(true);
      expect(config.perDirection.NORTH.spawnRatePerMinute).toBeGreaterThanOrEqual(0);
    });

    const presets = ['NORMAL_TRAFFIC', 'CONGESTION_TEST', 'SPARSE_TRAFFIC', 'PRIORITY_OPERATIONS', 'CUSTOM'] as const;
    for (const preset of presets) {
      manager.applyScenarioPreset(preset);
    }

    expect(received).toEqual(presets);
  });
});
