// TASK-043 acceptance criteria:
// - Module structure created at src/components/MetricsCollector/
// - IMetricsCollector and MetricsSnapshot implemented per INTERFACES.md §9
// - Collector exposes tick() for independent 10 Hz scheduling by orchestrator
import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { MetricsCollector } from './MetricsCollector';
import { MetricsCollector as ExportedMetricsCollector } from './index';
import type { IMetricsCollector, MetricsSnapshot } from './metrics-collector.interface';

describe('TASK-043: Metrics Collector module structure', () => {
  it('module directory contains the expected files', () => {
    const modulePath = 'src/components/MetricsCollector';

    expect(existsSync(join(process.cwd(), modulePath, 'MetricsCollector.ts'))).toBe(true);
    expect(existsSync(join(process.cwd(), modulePath, 'metrics-collector.interface.ts'))).toBe(true);
    expect(existsSync(join(process.cwd(), modulePath, 'index.ts'))).toBe(true);
  });

  it('MetricsCollector implements IMetricsCollector methods', () => {
    const collector: IMetricsCollector = new MetricsCollector();

    expect(typeof collector.tick).toBe('function');
    expect(typeof collector.getSnapshot).toBe('function');
    expect(new ExportedMetricsCollector()).toBeInstanceOf(MetricsCollector);
  });

  it('initializes MetricsSnapshot with safe defaults matching INTERFACES.md §9', () => {
    const collector = new MetricsCollector();
    const snapshot: Readonly<MetricsSnapshot> = collector.getSnapshot();

    expect(snapshot).toEqual({
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
    });
  });

  it('returns a read-only snapshot copy that cannot mutate collector state', () => {
    const collector = new MetricsCollector();
    const snapshot = collector.getSnapshot();

    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(() => {
      (snapshot as MetricsSnapshot).vehicleCountRegular = 99;
    }).toThrow(TypeError);
    expect(collector.getSnapshot().vehicleCountRegular).toBe(0);
  });

  it('tick() can be scheduled independently and recomputes only when called', () => {
    let providerCalls = 0;
    const collector = new MetricsCollector();
    collector.setVehiclesProvider(() => {
      providerCalls++;
      return [];
    });

    collector.updateTime(100);
    expect(providerCalls).toBe(0);

    collector.tick();
    collector.tick();

    expect(providerCalls).toBe(2);
  });
});
