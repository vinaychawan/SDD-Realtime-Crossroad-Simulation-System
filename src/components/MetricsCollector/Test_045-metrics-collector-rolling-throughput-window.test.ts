// TASK-045 acceptance criteria:
// - throughputPerMinute counts despawn events in a trailing rolling 60-second window
// - Window correctly evicts events older than 60s each tick
// - Unit tests inject exit events at known times and assert counts at multiple offsets
import { describe, expect, it } from 'vitest';
import { MetricsCollector } from './MetricsCollector';

describe('TASK-045: Metrics Collector rolling 60s throughput window', () => {
  it('returns 0 veh/min when no despawn events were recorded', () => {
    const collector = new MetricsCollector();

    collector.updateTime(30_000);
    collector.tick();

    expect(collector.getSnapshot().throughputPerMinute).toBe(0);
  });

  it('counts despawn events inside the trailing 60-second window', () => {
    const collector = new MetricsCollector();

    collector.recordDespawn(1_000);
    collector.recordDespawn(10_000);
    collector.recordDespawn(59_999);
    collector.updateTime(60_000);
    collector.tick();

    expect(collector.getSnapshot().throughputPerMinute).toBe(3);
  });

  it('evicts events older than 60 seconds on each tick', () => {
    const collector = new MetricsCollector();

    collector.recordDespawn(1_000);
    collector.recordDespawn(20_000);
    collector.recordDespawn(61_000);

    collector.updateTime(62_000);
    collector.tick();
    expect(collector.getSnapshot().throughputPerMinute).toBe(2);

    collector.updateTime(81_001);
    collector.tick();
    expect(collector.getSnapshot().throughputPerMinute).toBe(1);
  });

  it('excludes events exactly at the window start boundary', () => {
    const collector = new MetricsCollector();

    collector.recordDespawn(0);
    collector.recordDespawn(1);
    collector.updateTime(60_000);
    collector.tick();

    expect(collector.getSnapshot().throughputPerMinute).toBe(1);
  });

  it('handles multiple exits at the same timestamp', () => {
    const collector = new MetricsCollector();

    collector.recordDespawn(10_000);
    collector.recordDespawn(10_000);
    collector.recordDespawn(10_000);
    collector.updateTime(20_000);
    collector.tick();

    expect(collector.getSnapshot().throughputPerMinute).toBe(3);
  });

  it('keeps rolling-window state across repeated 10 Hz display ticks', () => {
    const collector = new MetricsCollector();

    collector.recordDespawn(10_000);
    collector.recordDespawn(20_000);

    collector.updateTime(20_000);
    collector.tick();
    expect(collector.getSnapshot().throughputPerMinute).toBe(2);

    collector.updateTime(20_100);
    collector.tick();
    expect(collector.getSnapshot().throughputPerMinute).toBe(2);

    collector.updateTime(70_001);
    collector.tick();
    expect(collector.getSnapshot().throughputPerMinute).toBe(1);
  });
});
