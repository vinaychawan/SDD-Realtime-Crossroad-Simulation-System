// TASK-066: Telemetry — Wire deadlock and collision event logging
// Verification: Integration test asserting log entries after synthetic deadlock/collision injection
import { describe, it, expect, beforeEach } from 'vitest';
import { ConflictZoneManager } from '../ConflictZoneManager/ConflictZoneManager';
import { CollisionDetectionSystem } from '../CollisionDetectionSystem/CollisionDetectionSystem';
import { Telemetry } from './Telemetry';
import type { VehicleState } from '../../domain/types';
import type { CollisionEvent as CdsCollisionEvent } from '../CollisionDetectionSystem/collision-detection-system.interface';
import type { DeadlockEvent, CollisionEvent } from './telemetry.interface';

describe('TASK-066: Telemetry wiring for deadlock and collision events', () => {
  let telemetry: Telemetry;

  beforeEach(() => {
    telemetry = new Telemetry();
  });

  describe('Deadlock event logging', () => {
    it('logs DeadlockEvent when ConflictZoneManager applies deadlock recovery', () => {
      const conflictZoneManager = new ConflictZoneManager(
        {
          sizeMeters: 20,
          maxWaitSeconds: 5,
          stopLineDistanceMeters: 10
        },
        telemetry
      );

      // Simulate a vehicle waiting for more than 5 seconds.
      const vehicle: VehicleState = {
        id: 'v-001',
        direction: 'NORTH',
        exitDirection: 'NORTH',
        lane: 2,
        position: { x: 0, y: -30 },
        speedKmh: 50,
        speedMs: 13.89,
        isEmergency: false,
        yieldingActive: false
      };

      // Occupy zone with opposing vehicle to force STOP.
      const opposingVehicle: VehicleState = {
        id: 'v-002',
        direction: 'SOUTH',
        exitDirection: 'SOUTH',
        lane: 2,
        position: { x: 0, y: 5 },
        speedKmh: 50,
        speedMs: 13.89,
        isEmergency: false,
        yieldingActive: false
      };

      conflictZoneManager.updateOccupancy([opposingVehicle]);

      // Request entry (should STOP).
      const decision = conflictZoneManager.requestEntry(vehicle);
      expect(decision.decision).toBe('STOP');

      // Advance time past maxWaitSeconds (5000ms = 500 ticks at 10ms/tick).
      for (let i = 0; i < 500; i++) {
        conflictZoneManager.updateOccupancy([opposingVehicle]);
      }

      // Verify vehicle is deadlocked.
      const deadlockedVehicles = conflictZoneManager.getDeadlockedVehicles();
      expect(deadlockedVehicles).toHaveLength(1);
      expect(deadlockedVehicles[0].id).toBe('v-001');

      // Apply deadlock recovery.
      conflictZoneManager.applyDeadlockRecovery('v-001', 'CONSERVATIVE');

      // Verify telemetry logged the deadlock event.
      const events = telemetry.getEventsByType('DEADLOCK');
      expect(events).toHaveLength(1);

      const deadlockEvent = events[0] as DeadlockEvent;
      expect(deadlockEvent.eventType).toBe('DEADLOCK');
      expect(deadlockEvent.level).toBe('WARN');
      expect(deadlockEvent.vehicleId).toBe('v-001');
      expect(deadlockEvent.waitDurationMs).toBeGreaterThanOrEqual(5000);
      expect(deadlockEvent.recoveryProcedure).toBe('CONSERVATIVE');
      expect(deadlockEvent.timestampMs).toBeGreaterThanOrEqual(5000);
    });

    it('does not log DeadlockEvent if telemetry is not provided', () => {
      const conflictZoneManager = new ConflictZoneManager({
        sizeMeters: 20,
        maxWaitSeconds: 5,
        stopLineDistanceMeters: 10
      }); // no telemetry

      // Apply deadlock recovery (should not throw).
      conflictZoneManager.applyDeadlockRecovery('v-001', 'CONSERVATIVE');

      // Verify telemetry has no events (since we didn't wire it).
      expect(telemetry.getEventCount()).toBe(0);
    });
  });

  describe('Collision event logging', () => {
    it('logs CollisionEvent when CollisionDetectionSystem detects a collision', () => {
      const collisionDetectionSystem = new CollisionDetectionSystem();

      // Wire collision detection to telemetry.
      collisionDetectionSystem.onCollision((cdsEvent: CdsCollisionEvent) => {
        const telemetryEvent: CollisionEvent = {
          timestampMs: cdsEvent.timestampMs,
          eventType: 'COLLISION',
          level: 'ERROR',
          vehicleIds: cdsEvent.vehicleIds,
          position: cdsEvent.position
        };
        telemetry.logEvent(telemetryEvent);
      });

      // Create two overlapping vehicles.
      const vehicle1: VehicleState = {
        id: 'v-001',
        direction: 'NORTH',
        exitDirection: 'NORTH',
        lane: 2,
        position: { x: 0, y: 0 },
        speedKmh: 50,
        speedMs: 13.89,
        isEmergency: false,
        yieldingActive: false
      };

      const vehicle2: VehicleState = {
        id: 'v-002',
        direction: 'SOUTH',
        exitDirection: 'SOUTH',
        lane: 2,
        position: { x: 0.5, y: 0.5 }, // overlapping with v-001
        speedKmh: 50,
        speedMs: 13.89,
        isEmergency: false,
        yieldingActive: false
      };

      // Run collision detection.
      const collisions = collisionDetectionSystem.tick([vehicle1, vehicle2]);
      expect(collisions).toHaveLength(1);

      // Verify telemetry logged the collision event.
      const events = telemetry.getEventsByType('COLLISION');
      expect(events).toHaveLength(1);

      const collisionEvent = events[0] as CollisionEvent;
      expect(collisionEvent.eventType).toBe('COLLISION');
      expect(collisionEvent.level).toBe('ERROR');
      expect(collisionEvent.vehicleIds).toEqual(['v-001', 'v-002']);
      expect(collisionEvent.position).toEqual({ x: 0.25, y: 0.25 }); // midpoint
      expect(collisionEvent.timestampMs).toBe(0); // first tick
    });

    it('logs multiple CollisionEvents in a single tick', () => {
      const collisionDetectionSystem = new CollisionDetectionSystem();

      collisionDetectionSystem.onCollision((cdsEvent: CdsCollisionEvent) => {
        const telemetryEvent: CollisionEvent = {
          timestampMs: cdsEvent.timestampMs,
          eventType: 'COLLISION',
          level: 'ERROR',
          vehicleIds: cdsEvent.vehicleIds,
          position: cdsEvent.position
        };
        telemetry.logEvent(telemetryEvent);
      });

      // Create three overlapping vehicles (3 collisions).
      const vehicle1: VehicleState = {
        id: 'v-001',
        direction: 'NORTH',
        exitDirection: 'NORTH',
        lane: 2,
        position: { x: 0, y: 0 },
        speedKmh: 50,
        speedMs: 13.89,
        isEmergency: false,
        yieldingActive: false
      };

      const vehicle2: VehicleState = {
        id: 'v-002',
        direction: 'SOUTH',
        exitDirection: 'SOUTH',
        lane: 2,
        position: { x: 0.5, y: 0.5 },
        speedKmh: 50,
        speedMs: 13.89,
        isEmergency: false,
        yieldingActive: false
      };

      const vehicle3: VehicleState = {
        id: 'v-003',
        direction: 'EAST',
        exitDirection: 'EAST',
        lane: 2,
        position: { x: 0.3, y: 0.3 },
        speedKmh: 50,
        speedMs: 13.89,
        isEmergency: false,
        yieldingActive: false
      };

      collisionDetectionSystem.tick([vehicle1, vehicle2, vehicle3]);

      // Verify telemetry logged all collision events.
      const events = telemetry.getEventsByType('COLLISION');
      expect(events.length).toBeGreaterThanOrEqual(3); // at least 3 collisions
    });
  });

  describe('Log volume management', () => {
    it('caps log volume to prevent unbounded memory growth', () => {
      const smallTelemetry = new Telemetry(100); // max 100 events

      // Generate 150 collision events.
      for (let i = 0; i < 150; i++) {
        const event: CollisionEvent = {
          timestampMs: i * 10,
          eventType: 'COLLISION',
          level: 'ERROR',
          vehicleIds: [`v-${i}`, `v-${i + 1}`],
          position: { x: 0, y: 0 }
        };
        smallTelemetry.logEvent(event);
      }

      // Verify only the last 100 events are retained.
      expect(smallTelemetry.getEventCount()).toBe(100);

      const events = smallTelemetry.getEvents();
      expect(events).toHaveLength(100);

      // Verify oldest events were evicted (first event should be timestampMs = 500).
      expect(events[0].timestampMs).toBe(500); // event 50
      expect(events[99].timestampMs).toBe(1490); // event 149
    });

    it('handles mixed event types in circular buffer', () => {
      const smallTelemetry = new Telemetry(5); // max 5 events

      const collision1: CollisionEvent = {
        timestampMs: 0,
        eventType: 'COLLISION',
        level: 'ERROR',
        vehicleIds: ['v-001', 'v-002'],
        position: { x: 0, y: 0 }
      };

      const deadlock1: DeadlockEvent = {
        timestampMs: 10,
        eventType: 'DEADLOCK',
        level: 'WARN',
        vehicleId: 'v-003',
        waitDurationMs: 5100,
        recoveryProcedure: 'CONSERVATIVE'
      };

      const collision2: CollisionEvent = {
        timestampMs: 20,
        eventType: 'COLLISION',
        level: 'ERROR',
        vehicleIds: ['v-004', 'v-005'],
        position: { x: 10, y: 10 }
      };

      smallTelemetry.logEvent(collision1);
      smallTelemetry.logEvent(deadlock1);
      smallTelemetry.logEvent(collision2);
      smallTelemetry.logEvent(collision1);
      smallTelemetry.logEvent(deadlock1);

      expect(smallTelemetry.getEventCount()).toBe(5);

      // Add one more event (should evict collision1).
      smallTelemetry.logEvent(collision2);
      expect(smallTelemetry.getEventCount()).toBe(5);

      const events = smallTelemetry.getEvents();
      expect(events[0]).toEqual(deadlock1); // collision1 evicted
    });
  });
});
