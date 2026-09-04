import { describe, it, expect, vi } from 'vitest';
import { InvalidConfigurationError, StartupOnlyFieldError } from '../../domain/errors';
import { ConfigurationManager } from './ConfigurationManager';

describe('ConfigurationManager', () => {
  it('constructs with a fully-populated NORMAL_TRAFFIC config by default', () => {
    const manager = new ConfigurationManager();
    const snapshot = manager.getSnapshot();
    expect(snapshot.scenarioPreset).toBe('NORMAL_TRAFFIC');
    expect(snapshot.perDirection.NORTH.spawnRatePerMinute).toBe(20);
  });

  it('tracks run state via setRunState()/getRunState()', () => {
    const manager = new ConfigurationManager();
    expect(manager.getRunState()).toBe('CONFIGURATION_ACTIVE');
    manager.setRunState('RUNNING');
    expect(manager.getRunState()).toBe('RUNNING');
  });

  describe('update() — valid changes', () => {
    it('applies a valid partial update and reflects it in the snapshot', () => {
      const manager = new ConfigurationManager();
      manager.update({ targetFrameRate: 30 });
      expect(manager.getSnapshot().targetFrameRate).toBe(30);
    });

    it('merges nested perDirection updates without discarding other directions', () => {
      const manager = new ConfigurationManager();
      const before = manager.getSnapshot();
      manager.update({
        perDirection: { ...before.perDirection, NORTH: { spawnRatePerMinute: 45, greenDurationSec: 30, redDurationSec: 30 } }
      });
      const after = manager.getSnapshot();
      expect(after.perDirection.NORTH.spawnRatePerMinute).toBe(45);
      expect(after.perDirection.SOUTH).toEqual(before.perDirection.SOUTH);
    });

    it('supports independent emergency spawn rate fields (MF-006 Option A)', () => {
      const manager = new ConfigurationManager();
      manager.update({
        emergency: { enabled: true, spawnRatePerMinute: { AMBULANCE: 7, POLICE: 0, FIRE_BRIGADE: 0 } }
      });
      manager.update({
        emergency: { enabled: true, spawnRatePerMinute: { AMBULANCE: 7, POLICE: 3, FIRE_BRIGADE: 0 } }
      });
      const snapshot = manager.getSnapshot();
      // Setting POLICE independently must not reset the previously-set AMBULANCE rate.
      expect(snapshot.emergency.spawnRatePerMinute).toEqual({ AMBULANCE: 7, POLICE: 3, FIRE_BRIGADE: 0 });
    });
  });

  describe('update() — invalid changes retain last valid value', () => {
    it('throws InvalidConfigurationError and leaves the config unchanged', () => {
      const manager = new ConfigurationManager();
      const before = manager.getSnapshot();
      expect(() => manager.update({ targetFrameRate: 45 as unknown as 30 | 60 })).toThrow(InvalidConfigurationError);
      expect(manager.getSnapshot()).toEqual(before);
    });

    it('rejects out-of-range conflict zone values atomically (no partial application)', () => {
      const manager = new ConfigurationManager();
      const before = manager.getSnapshot();
      expect(() =>
        manager.update({ conflictZone: { sizeMeters: 999, maxWaitSeconds: 5, stopLineDistanceMeters: 20 } })
      ).toThrow(InvalidConfigurationError);
      expect(manager.getSnapshot().conflictZone).toEqual(before.conflictZone);
    });
  });

  describe('startup-only field enforcement (TASK-006)', () => {
    it('allows changing signalCoordinationMode and laneSelectionStrategy while CONFIGURATION_ACTIVE', () => {
      const manager = new ConfigurationManager();
      expect(() => manager.update({ signalCoordinationMode: 'OPPOSING_SIMULTANEOUS' })).not.toThrow();
      expect(() => manager.update({ laneSelectionStrategy: 'INTELLIGENT' })).not.toThrow();
    });

    it.each(['RUNNING', 'PAUSED'] as const)('rejects signalCoordinationMode changes while %s', (state) => {
      const manager = new ConfigurationManager();
      manager.setRunState(state);
      expect(() => manager.update({ signalCoordinationMode: 'OPPOSING_SIMULTANEOUS' })).toThrow(StartupOnlyFieldError);
    });

    it.each(['RUNNING', 'PAUSED'] as const)('rejects laneSelectionStrategy changes while %s', (state) => {
      const manager = new ConfigurationManager();
      manager.setRunState(state);
      expect(() => manager.update({ laneSelectionStrategy: 'INTELLIGENT' })).toThrow(StartupOnlyFieldError);
    });

    it('still allows non-startup-only fields to change while RUNNING', () => {
      const manager = new ConfigurationManager();
      manager.setRunState('RUNNING');
      expect(() => manager.update({ targetFrameRate: 30 })).not.toThrow();
    });

    it('re-allows startup-only field changes after returning to CONFIGURATION_ACTIVE', () => {
      const manager = new ConfigurationManager();
      manager.setRunState('RUNNING');
      expect(() => manager.update({ laneSelectionStrategy: 'INTELLIGENT' })).toThrow(StartupOnlyFieldError);
      manager.setRunState('CONFIGURATION_ACTIVE');
      expect(() => manager.update({ laneSelectionStrategy: 'INTELLIGENT' })).not.toThrow();
    });
  });

  describe('applyScenarioPreset() (TASK-007)', () => {
    it.each(['NORMAL_TRAFFIC', 'CONGESTION_TEST', 'SPARSE_TRAFFIC', 'PRIORITY_OPERATIONS', 'CUSTOM'] as const)(
      'applies %s and fully populates the snapshot',
      (preset) => {
        const manager = new ConfigurationManager();
        manager.applyScenarioPreset(preset);
        expect(manager.getSnapshot().scenarioPreset).toBe(preset);
      }
    );
  });

  describe('onChange() notification (TASK-008)', () => {
    it('fires on every successful update() and applyScenarioPreset()', () => {
      const manager = new ConfigurationManager();
      const listener = vi.fn();
      manager.onChange(listener);

      manager.update({ targetFrameRate: 30 });
      manager.applyScenarioPreset('SPARSE_TRAFFIC');

      expect(listener).toHaveBeenCalledTimes(2);
    });

    it('does not fire when update() throws', () => {
      const manager = new ConfigurationManager();
      const listener = vi.fn();
      manager.onChange(listener);

      expect(() => manager.update({ targetFrameRate: 45 as unknown as 30 | 60 })).toThrow();
      expect(listener).not.toHaveBeenCalled();
    });

    it('passes a deeply frozen snapshot that cannot be mutated', () => {
      const manager = new ConfigurationManager();
      let received: ReturnType<ConfigurationManager['getSnapshot']> | undefined;
      manager.onChange((config) => {
        received = config;
      });

      manager.update({ targetFrameRate: 30 });

      expect(received).toBeDefined();
      expect(Object.isFrozen(received)).toBe(true);
      expect(Object.isFrozen(received!.perDirection)).toBe(true);
      expect(Object.isFrozen(received!.perDirection.NORTH)).toBe(true);
      expect(() => {
        'use strict';
        (received as { targetFrameRate: number }).targetFrameRate = 60;
      }).toThrow(TypeError);
      // Mutation must not have leaked into manager state either way.
      expect(manager.getSnapshot().targetFrameRate).toBe(30);
    });

    it('getSnapshot() itself also returns a frozen, independent clone', () => {
      const manager = new ConfigurationManager();
      const snapshot = manager.getSnapshot();
      expect(Object.isFrozen(snapshot)).toBe(true);
      manager.update({ targetFrameRate: 30 });
      // Earlier snapshot must not reflect subsequent mutations (it's a clone).
      expect(snapshot.targetFrameRate).toBe(60);
    });
  });
});
