// TASK-047 acceptance criteria:
// - All MF-001 formulas verified against documented examples
// - ≥90% statement coverage for MetricsCollector
// - Remaining MetricsSnapshot fields wired from source providers/events
import { describe, expect, it } from 'vitest';
import { MetricsCollector } from './MetricsCollector';
import type { CollisionEvent } from '../CollisionDetectionSystem/collision-detection-system.interface';
import type { VehicleState } from '../../domain/types';

function vehicle(id: string, speedKmh: number, isEmergency = false): VehicleState {
  return {
    id,
    direction: 'EAST',
    exitDirection: 'WEST',
    lane: 1,
    position: { x: 0, y: 0 },
    speedKmh,
    speedMs: speedKmh / 3.6,
    isEmergency,
    emergencyType: isEmergency ? 'FIRE_BRIGADE' : undefined,
    yieldingActive: false,
  };
}

function collision(timestampMs: number): CollisionEvent {
  return {
    vehicleIds: ['v1', 'v2'],
    position: { x: 3, y: 4 },
    timestampMs,
  };
}

describe('TASK-047: Metrics Collector full MF-001 acceptance suite', () => {
  it('matches MF-001 average-speed documented example: [60, 30, 0] => 30 km/h', () => {
    const collector = new MetricsCollector();
    collector.setVehiclesProvider(() => [vehicle('fast', 60), vehicle('slow', 30), vehicle('stopped', 0)]);

    collector.tick();

    expect(collector.getSnapshot().averageSpeedKmh).toBe(30);
  });

  it('matches ADR-008 throughput contract: count despawn events in trailing 60s', () => {
    const collector = new MetricsCollector();

    for (let timestampMs = 1_000; timestampMs <= 10_000; timestampMs += 1_000) {
      collector.recordDespawn(timestampMs);
    }

    collector.updateTime(30_000);
    collector.tick();

    expect(collector.getSnapshot().throughputPerMinute).toBe(10);
  });

  it('matches MF-001 collision-free example: 2s of 600s collision time => 99.67%', () => {
    const collector = new MetricsCollector();

    collector.updateTime(0);
    collector.recordCollision(collision(10_000));
    collector.resolveCollision(collision(12_000));
    collector.updateTime(600_000);
    collector.tick();

    expect(collector.getSnapshot().collisionFreeRatioPercent).toBeCloseTo(99.6666667, 6);
  });

  it('wires vehicle counts, deadlocks, FPS, physics Hz, memory, and CPU from source components', () => {
    const collector = new MetricsCollector();
    collector.setVehiclesProvider(() => [vehicle('r1', 50), vehicle('r2', 40), vehicle('e1', 90, true)]);
    collector.setRenderFpsProvider(() => 60);
    collector.setPhysicsHzProvider(() => 100);
    collector.setMemoryMbProvider(() => 128.5);
    collector.setCpuPercentProvider(() => 4.2);
    collector.recordDeadlock();
    collector.recordDeadlock();

    collector.tick();

    expect(collector.getSnapshot()).toMatchObject({
      vehicleCountRegular: 2,
      vehicleCountEmergency: 1,
      deadlockCount: 2,
      renderFps: 60,
      physicsHz: 100,
      memoryMb: 128.5,
      cpuPercent: 4.2,
    });
  });

  it('reset clears all event histories, counts, and provider-derived snapshot values', () => {
    const collector = new MetricsCollector();
    collector.setVehiclesProvider(() => [vehicle('v1', 70)]);
    collector.setRenderFpsProvider(() => 30);
    collector.recordDespawn(1_000);
    collector.recordDeadlock();
    collector.updateTime(0);
    collector.recordCollision(collision(1_000));
    collector.updateTime(2_000);
    collector.tick();

    expect(collector.getSnapshot().vehicleCountRegular).toBe(1);
    expect(collector.getSnapshot().throughputPerMinute).toBe(1);
    expect(collector.getSnapshot().activeCollisions).toBe(1);

    collector.reset();

    expect(collector.getSnapshot()).toEqual({
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
});
