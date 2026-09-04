// TASK-046 acceptance criteria:
// - collisionFreeRatioPercent = (simulationDurationMs − totalCollisionTimeMs) / simulationDurationMs × 100
// - totalCollisionTimeMs accumulated from active collision durations
// - Unit tests verify ratio against synthetic start/end timelines
import { describe, expect, it } from 'vitest';
import { MetricsCollector } from './MetricsCollector';
import type { CollisionEvent } from '../CollisionDetectionSystem/collision-detection-system.interface';

function collision(a: string, b: string, timestampMs: number): CollisionEvent {
  return {
    vehicleIds: [a, b],
    position: { x: 0, y: 0 },
    timestampMs,
  };
}

describe('TASK-046: Metrics Collector collision-free ratio', () => {
  it('reports 100% when no simulation time has elapsed', () => {
    const collector = new MetricsCollector();

    collector.updateTime(1_000);
    collector.tick();

    expect(collector.getSnapshot().collisionFreeRatioPercent).toBe(100);
  });

  it('reports 100% when time elapsed with zero collisions', () => {
    const collector = new MetricsCollector();

    collector.updateTime(0);
    collector.tick();
    collector.updateTime(10_000);
    collector.tick();

    expect(collector.getSnapshot().collisionFreeRatioPercent).toBe(100);
    expect(collector.getSnapshot().totalCollisions).toBe(0);
    expect(collector.getSnapshot().activeCollisions).toBe(0);
  });

  it('accumulates active collision duration until resolved', () => {
    const collector = new MetricsCollector();

    collector.updateTime(0);
    collector.recordCollision(collision('v1', 'v2', 1_000));
    collector.updateTime(3_000);
    collector.tick();

    expect(collector.getSnapshot().totalCollisions).toBe(1);
    expect(collector.getSnapshot().activeCollisions).toBe(1);
    expect(collector.getSnapshot().collisionFreeRatioPercent).toBeCloseTo(33.3333333, 6);

    collector.resolveCollision(collision('v1', 'v2', 4_000));
    collector.updateTime(5_000);
    collector.tick();

    expect(collector.getSnapshot().activeCollisions).toBe(0);
    expect(collector.getSnapshot().collisionFreeRatioPercent).toBe(40);
  });

  it('uses stable collision keys regardless of vehicle id order', () => {
    const collector = new MetricsCollector();

    collector.updateTime(0);
    collector.recordCollision(collision('b', 'a', 1_000));
    collector.recordCollision(collision('a', 'b', 2_000));
    collector.resolveCollision(collision('a', 'b', 3_000));
    collector.updateTime(4_000);
    collector.tick();

    expect(collector.getSnapshot().totalCollisions).toBe(1);
    expect(collector.getSnapshot().activeCollisions).toBe(0);
    expect(collector.getSnapshot().collisionFreeRatioPercent).toBe(50);
  });

  it('counts overlapping collision intervals once because the metric is time-based', () => {
    const collector = new MetricsCollector();

    collector.updateTime(0);
    collector.recordCollision(collision('v1', 'v2', 1_000));
    collector.recordCollision(collision('v3', 'v4', 2_000));
    collector.resolveCollision(collision('v1', 'v2', 5_000));
    collector.resolveCollision(collision('v3', 'v4', 6_000));
    collector.updateTime(10_000);
    collector.tick();

    // Collision-active union is [1000, 6000] = 5000ms, not 8000ms per-pair sum.
    expect(collector.getSnapshot().totalCollisions).toBe(2);
    expect(collector.getSnapshot().collisionFreeRatioPercent).toBe(50);
  });

  it('adds separated collision intervals independently', () => {
    const collector = new MetricsCollector();

    collector.updateTime(0);
    collector.recordCollision(collision('v1', 'v2', 1_000));
    collector.resolveCollision(collision('v1', 'v2', 2_000));
    collector.recordCollision(collision('v3', 'v4', 5_000));
    collector.resolveCollision(collision('v3', 'v4', 7_000));
    collector.updateTime(10_000);
    collector.tick();

    // Active collision intervals are [1000, 2000] and [5000, 7000] = 3000ms.
    expect(collector.getSnapshot().totalCollisions).toBe(2);
    expect(collector.getSnapshot().collisionFreeRatioPercent).toBe(70);
  });

  it('supports infrastructure collision duration tracking', () => {
    const collector = new MetricsCollector();
    const event: CollisionEvent = {
      vehicleIds: ['off-road', 'INFRASTRUCTURE'],
      position: { x: 80, y: 0 },
      timestampMs: 2_000,
    };

    collector.updateTime(0);
    collector.recordCollision(event);
    collector.updateTime(4_000);
    collector.tick();

    expect(collector.getSnapshot().activeCollisions).toBe(1);
    expect(collector.getSnapshot().collisionFreeRatioPercent).toBe(50);
  });
});
