// TASK-065: Telemetry — Initialize logging module
// Verification: Code review (module structure + structured log format)
import { describe, it, expect, beforeEach } from 'vitest';
import { Telemetry } from './Telemetry';
import type { DeadlockEvent, CollisionEvent, SystemEvent } from './telemetry.interface';

describe('TASK-065: Telemetry module initialization', () => {
  let telemetry: Telemetry;

  beforeEach(() => {
    telemetry = new Telemetry();
  });

  it('initializes with zero events', () => {
    expect(telemetry.getEventCount()).toBe(0);
    expect(telemetry.getEvents()).toEqual([]);
  });

  it('logs a DeadlockEvent with required fields', () => {
    const event: DeadlockEvent = {
      timestampMs: 5000,
      eventType: 'DEADLOCK',
      level: 'WARN',
      vehicleId: 'v-001',
      waitDurationMs: 5100,
      recoveryProcedure: 'CONSERVATIVE'
    };

    telemetry.logEvent(event);

    expect(telemetry.getEventCount()).toBe(1);
    const logged = telemetry.getEvents();
    expect(logged).toHaveLength(1);
    expect(logged[0]).toEqual(event);
  });

  it('logs a CollisionEvent with required fields', () => {
    const event: CollisionEvent = {
      timestampMs: 10000,
      eventType: 'COLLISION',
      level: 'ERROR',
      vehicleIds: ['v-001', 'v-002'],
      position: { x: 10, y: 20 }
    };

    telemetry.logEvent(event);

    expect(telemetry.getEventCount()).toBe(1);
    const logged = telemetry.getEvents();
    expect(logged).toHaveLength(1);
    expect(logged[0]).toEqual(event);
  });

  it('logs a SystemEvent with required fields', () => {
    const event: SystemEvent = {
      timestampMs: 0,
      eventType: 'SYSTEM_START',
      level: 'INFO',
      message: 'Simulation initialized'
    };

    telemetry.logEvent(event);

    expect(telemetry.getEventCount()).toBe(1);
    const logged = telemetry.getEvents();
    expect(logged).toHaveLength(1);
    expect(logged[0]).toEqual(event);
  });

  it('retrieves events by type', () => {
    const deadlockEvent: DeadlockEvent = {
      timestampMs: 5000,
      eventType: 'DEADLOCK',
      level: 'WARN',
      vehicleId: 'v-001',
      waitDurationMs: 5100,
      recoveryProcedure: 'CONSERVATIVE'
    };

    const collisionEvent: CollisionEvent = {
      timestampMs: 10000,
      eventType: 'COLLISION',
      level: 'ERROR',
      vehicleIds: ['v-002', 'v-003'],
      position: { x: 5, y: 5 }
    };

    telemetry.logEvent(deadlockEvent);
    telemetry.logEvent(collisionEvent);
    telemetry.logEvent(deadlockEvent); // log deadlock again

    expect(telemetry.getEventCount()).toBe(3);
    const deadlocks = telemetry.getEventsByType('DEADLOCK');
    expect(deadlocks).toHaveLength(2);
    expect(deadlocks.every((e) => e.eventType === 'DEADLOCK')).toBe(true);

    const collisions = telemetry.getEventsByType('COLLISION');
    expect(collisions).toHaveLength(1);
    expect(collisions[0]).toEqual(collisionEvent);
  });

  it('clears all events', () => {
    const event: SystemEvent = {
      timestampMs: 0,
      eventType: 'SYSTEM_START',
      level: 'INFO'
    };

    telemetry.logEvent(event);
    expect(telemetry.getEventCount()).toBe(1);

    telemetry.clear();
    expect(telemetry.getEventCount()).toBe(0);
    expect(telemetry.getEvents()).toEqual([]);
  });

  it('enforces max event limit (circular buffer)', () => {
    const smallTelemetry = new Telemetry(3); // max 3 events

    const event1: SystemEvent = { timestampMs: 0, eventType: 'SYSTEM_START', level: 'INFO' };
    const event2: SystemEvent = { timestampMs: 1, eventType: 'SYSTEM_START', level: 'INFO' };
    const event3: SystemEvent = { timestampMs: 2, eventType: 'SYSTEM_START', level: 'INFO' };
    const event4: SystemEvent = { timestampMs: 3, eventType: 'SYSTEM_START', level: 'INFO' };

    smallTelemetry.logEvent(event1);
    smallTelemetry.logEvent(event2);
    smallTelemetry.logEvent(event3);
    expect(smallTelemetry.getEventCount()).toBe(3);

    // Adding a 4th event should evict event1.
    smallTelemetry.logEvent(event4);
    expect(smallTelemetry.getEventCount()).toBe(3);

    const events = smallTelemetry.getEvents();
    expect(events).toHaveLength(3);
    expect(events[0]).toEqual(event2); // event1 removed
    expect(events[1]).toEqual(event3);
    expect(events[2]).toEqual(event4);
  });

  it('does not include sensitive data in log entries', () => {
    // Acceptance criteria: "no sensitive data logged".
    // Our events only contain: timestamps, vehicle IDs (UUIDs), positions, event types.
    // No user data, secrets, or PII are included.
    const event: DeadlockEvent = {
      timestampMs: 5000,
      eventType: 'DEADLOCK',
      level: 'WARN',
      vehicleId: 'v-001',
      waitDurationMs: 5100,
      recoveryProcedure: 'CONSERVATIVE'
    };

    telemetry.logEvent(event);
    const logged = telemetry.getEvents()[0];

    // Verify no unexpected fields (type guards ensure only known fields exist).
    expect(logged).toHaveProperty('timestampMs');
    expect(logged).toHaveProperty('eventType');
    expect(logged).toHaveProperty('level');
    expect(logged).toHaveProperty('vehicleId');
    expect(logged).toHaveProperty('waitDurationMs');
    expect(logged).toHaveProperty('recoveryProcedure');
    expect(Object.keys(logged).length).toBe(6); // exactly 6 fields, no extras
  });
});
