import { beforeEach, describe, expect, it, vi } from 'vitest';
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

describe('TASK-061 State Display traffic metrics panel', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="state"></div>';
  });

  it('displays vehicle counts, average speed, and throughput from MetricsSnapshot only', () => {
    const panels = new StateDisplayPanels('state');
    const getSnapshot = vi.fn(() => snapshot({
      vehicleCountRegular: 42,
      vehicleCountEmergency: 2,
      averageSpeedKmh: 38.25,
      throughputPerMinute: 18.5
    }));

    panels.updateTrafficMetrics(getSnapshot());

    expect(getSnapshot).toHaveBeenCalledTimes(1);
    expect(text('traffic-regular-count')).toBe('42');
    expect(text('traffic-emergency-count')).toBe('2');
    expect(text('traffic-average-speed')).toBe('38.3 km/h');
    expect(text('traffic-throughput')).toBe('18.5 veh/min');
  });

  it('marks each refresh so callers can drive the panel at the 10 Hz metrics cadence', () => {
    vi.useFakeTimers();
    const panels = new StateDisplayPanels('state');
    const root = document.getElementById('state');
    if (!root) throw new Error('missing root');

    vi.setSystemTime(100);
    panels.updateTrafficMetrics(snapshot());
    expect(root.dataset.metricsLastRefreshed).toBe('100');

    vi.setSystemTime(200);
    panels.refreshMetrics(snapshot({ vehicleCountRegular: 1 }));
    expect(root.dataset.metricsLastRefreshed).toBe('200');
    expect(text('traffic-regular-count')).toBe('1');
    vi.useRealTimers();
  });
});
