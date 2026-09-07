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

function value(key: string): HTMLElement {
  const element = document.querySelector<HTMLElement>(`[data-state-value="${key}"]`);
  if (!element) throw new Error(`missing ${key}`);
  return element;
}

describe('TASK-064 State Display performance metrics panel', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="state"></div>';
  });

  it('displays FPS, physics Hz, memory, and CPU from MetricsSnapshot', () => {
    const panels = new StateDisplayPanels('state', { warningThresholds: { memoryMb: 80, cpuPercent: 80 } });
    panels.updatePerformanceMetrics(snapshot({
      renderFps: 59.7,
      physicsHz: 100,
      memoryMb: 64.2,
      cpuPercent: 35.25
    }));

    expect(value('performance-render-fps').textContent).toBe('59.7 FPS');
    expect(value('performance-physics-hz').textContent).toBe('100 Hz');
    expect(value('performance-memory-mb').textContent).toBe('64 MB');
    expect(value('performance-cpu-percent').textContent).toBe('35.3%');
    expect(value('performance-memory-mb').classList.contains('state-display-warning')).toBe(false);
    expect(value('performance-cpu-percent').classList.contains('state-display-warning')).toBe(false);
  });

  it('applies warning-threshold styling when CPU or memory exceeds 80%', () => {
    const panels = new StateDisplayPanels('state');
    panels.updatePerformanceMetrics(snapshot({ memoryMb: 81, cpuPercent: 80.1 }));

    expect(value('performance-memory-mb').classList.contains('state-display-warning')).toBe(true);
    expect(value('performance-cpu-percent').classList.contains('state-display-warning')).toBe(true);

    panels.updatePerformanceMetrics(snapshot({ memoryMb: 80, cpuPercent: 80 }));
    expect(value('performance-memory-mb').classList.contains('state-display-warning')).toBe(false);
    expect(value('performance-cpu-percent').classList.contains('state-display-warning')).toBe(false);
  });
});
