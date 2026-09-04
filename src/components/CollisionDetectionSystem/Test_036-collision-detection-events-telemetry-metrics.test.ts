// TASK-036 acceptance criteria:
// - onCollision() listeners registered by Telemetry and Metrics Collector
// - Collision events include timestamp and position for downstream metrics
import { describe, expect, it } from 'vitest';
import { CollisionDetectionSystem } from './CollisionDetectionSystem';
import type { CollisionEvent } from './collision-detection-system.interface';
import type { VehicleState } from '../../domain/types';

function vehicle(id: string, x: number, y: number): VehicleState {
  return {
    id,
    direction: 'NORTH',
    exitDirection: 'SOUTH',
    lane: 2,
    position: { x, y },
    speedKmh: 30,
    speedMs: 30 / 3.6,
    isEmergency: false,
    yieldingActive: false
  };
}

describe('TASK-036: Collision Detection event wiring for Telemetry and Metrics', () => {
  it('invokes multiple registered listeners for each detected collision', () => {
    const system = new CollisionDetectionSystem({ infrastructureBoundaryMeters: 10_000 });
    const telemetryEvents: CollisionEvent[] = [];
    const metricsEvents: CollisionEvent[] = [];

    system.onCollision((event) => telemetryEvents.push(event));
    system.onCollision((event) => metricsEvents.push(event));

    const returnedEvents = system.tick([vehicle('v1', 0, 0), vehicle('v2', 0, 0)]);

    expect(returnedEvents).toHaveLength(1);
    expect(telemetryEvents).toEqual(returnedEvents);
    expect(metricsEvents).toEqual(returnedEvents);
  });

  it('does not invoke listeners when no collision is detected', () => {
    const system = new CollisionDetectionSystem({ infrastructureBoundaryMeters: 10_000 });
    const observed: CollisionEvent[] = [];

    system.onCollision((event) => observed.push(event));
    const returnedEvents = system.tick([vehicle('v1', 0, 0), vehicle('v2', 100, 100)]);

    expect(returnedEvents).toEqual([]);
    expect(observed).toEqual([]);
  });

  it('emits timestamp and midpoint position needed for collision-free-ratio metrics', () => {
    const system = new CollisionDetectionSystem({ infrastructureBoundaryMeters: 10_000 });
    const observed: CollisionEvent[] = [];

    system.onCollision((event) => observed.push(event));
    system.tick([vehicle('v1', 2, 2), vehicle('v2', 4, 6)]);

    expect(observed).toHaveLength(1);
    expect(observed[0].timestampMs).toBe(0);
    expect(observed[0].position).toEqual({ x: 3, y: 4 });
  });

  it('emits infrastructure collision events with vehicle position and timestamp', () => {
    const system = new CollisionDetectionSystem({ infrastructureBoundaryMeters: 75 });
    const observed: CollisionEvent[] = [];

    system.onCollision((event) => observed.push(event));
    const returnedEvents = system.tick([vehicle('off-road', 80, 5)]);

    expect(returnedEvents).toEqual(observed);
    expect(observed[0]).toEqual({
      vehicleIds: ['off-road', 'INFRASTRUCTURE'],
      position: { x: 80, y: 5 },
      timestampMs: 0
    });
  });

  it('supports listener registration after earlier ticks', () => {
    const system = new CollisionDetectionSystem({ infrastructureBoundaryMeters: 10_000 });
    const observed: CollisionEvent[] = [];

    system.tick([vehicle('early-a', 0, 0), vehicle('early-b', 0, 0)]);
    system.onCollision((event) => observed.push(event));
    system.tick([vehicle('late-a', 0, 0), vehicle('late-b', 0, 0)]);

    expect(observed).toHaveLength(1);
    expect(observed[0].vehicleIds).toEqual(['late-a', 'late-b']);
    expect(observed[0].timestampMs).toBe(10);
  });
});
