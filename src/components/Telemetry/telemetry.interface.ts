// Telemetry public contract (TASK-065).
// Mirrors docs/INTERFACES.md for structured event logging.
import type { VehicleId, Vector2 } from '../../domain/types';

/** Structured log entry format (TASK-065): timestamp, event type, payload. */
export type LogLevel = 'INFO' | 'WARN' | 'ERROR';

export type EventType = 
  | 'DEADLOCK'
  | 'COLLISION'
  | 'SYSTEM_START'
  | 'SYSTEM_STOP'
  | 'CONFIG_CHANGE';

/** Base interface for all telemetry events. */
export interface TelemetryEvent {
  readonly timestampMs: number;
  readonly eventType: EventType;
  readonly level: LogLevel;
}

/** Deadlock event (BF-003, ADR-004). */
export interface DeadlockEvent extends TelemetryEvent {
  readonly eventType: 'DEADLOCK';
  readonly vehicleId: VehicleId;
  readonly waitDurationMs: number;
  readonly recoveryProcedure: 'CONSERVATIVE';
}

/** Collision event (REQ-NEW-COLLISION-PREVENTION-1). */
export interface CollisionEvent extends TelemetryEvent {
  readonly eventType: 'COLLISION';
  readonly vehicleIds: [VehicleId, VehicleId] | [VehicleId, 'INFRASTRUCTURE'];
  readonly position: Vector2;
}

/** System lifecycle events. */
export interface SystemEvent extends TelemetryEvent {
  readonly eventType: 'SYSTEM_START' | 'SYSTEM_STOP';
  readonly message?: string;
}

/** Configuration change event. */
export interface ConfigChangeEvent extends TelemetryEvent {
  readonly eventType: 'CONFIG_CHANGE';
  readonly field: string;
  readonly oldValue: unknown;
  readonly newValue: unknown;
}

export type AnyTelemetryEvent = 
  | DeadlockEvent
  | CollisionEvent
  | SystemEvent
  | ConfigChangeEvent;

/** Telemetry logging interface. */
export interface ITelemetry {
  /** Log a structured event. */
  logEvent(event: AnyTelemetryEvent): void;

  /** Retrieve all logged events (for testing/debugging). */
  getEvents(): readonly AnyTelemetryEvent[];

  /** Get events of a specific type. */
  getEventsByType<T extends EventType>(eventType: T): readonly AnyTelemetryEvent[];

  /** Clear all logged events (for testing or memory management). */
  clear(): void;

  /** Get the number of logged events. */
  getEventCount(): number;
}
