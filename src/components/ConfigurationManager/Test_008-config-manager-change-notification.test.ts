// Covers TASK-008 acceptance criteria only. See tasks/Tasks_008-config-manager-change-notification.md
import { describe, it, expect, vi } from 'vitest';
import { ConfigurationManager } from './ConfigurationManager';

describe('TASK-008: Config Manager — change notification', () => {
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
