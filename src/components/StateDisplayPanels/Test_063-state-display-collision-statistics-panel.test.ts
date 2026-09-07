import { beforeEach, describe, expect, it } from 'vitest';
import type { MetricsSnapshot } from '../MetricsCollector/metrics-collector.interface';
import { StateDisplayPanels } from './StateDisplayPanels';

function snapshot(overrides: Partial<MetricsSnapshot> = {}): MetricsSnapshot {
  return {
    vehicleCountRegular: 0,
    vehicleCountEmergency: 0,
    averageSpeedKmh: 0,
    throughputPerMinute: 0,
    totalCollisions: 0,
    activeCollisions: 0,
    collisionFreeRatioPercent: 100,
    deadlockCount: 0,
    renderFps: 0,
    physicsHz: 0,
    memoryMb: 0,
    cpuPercent: 0,
    ...overrides
  };
}

function text(key: string): string {
  const element = document.querySelector(`[data-state-value="${key}"]`);
  if (!element) throw new Error(`missing ${key}`);
  return element.textContent ?? '';
}

describe('TASK-063 State Display collision statistics panel', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="state"></div>';
  });

  it('displays all collision and deadlock statistics from MetricsSnapshot', () => {
    const panels = new StateDisplayPanels('state');
    panels.updateCollisionStatistics(snapshot({
      totalCollisions: 3,
      activeCollisions: 1,
      collisionFreeRatioPercent: 96.44,
      deadlockCount: 2
    }));

    expect(text('collision-total')).toBe('3');
    expect(text('collision-active')).toBe('1');
    expect(text('collision-free-ratio')).toBe('96.4%');
    expect(text('collision-deadlocks')).toBe('2');
  });
});
