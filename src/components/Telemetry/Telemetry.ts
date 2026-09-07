// Telemetry logging module (TASK-065).
// Implements structured event logging with memory-bounded storage (TASK-066).
import type {
  ITelemetry,
  AnyTelemetryEvent,
  EventType
} from './telemetry.interface';

/** Default maximum number of events to store (prevents unbounded memory growth). */
const DEFAULT_MAX_EVENTS = 10000;

/** REQ-NEW-COLLISION-PREVENTION-1, BF-003, ADR-004. */
export class Telemetry implements ITelemetry {
  private events: AnyTelemetryEvent[] = [];
  private readonly maxEvents: number;

  constructor(maxEvents: number = DEFAULT_MAX_EVENTS) {
    this.maxEvents = maxEvents;
  }

  logEvent(event: AnyTelemetryEvent): void {
    // Add event to the log.
    this.events.push(event);

    // Enforce circular buffer: if we exceed maxEvents, remove oldest entries.
    // This prevents unbounded memory growth in long-running sessions (TASK-066).
    if (this.events.length > this.maxEvents) {
      const overflow = this.events.length - this.maxEvents;
      this.events.splice(0, overflow);
    }
  }

  getEvents(): readonly AnyTelemetryEvent[] {
    return [...this.events];
  }

  getEventsByType<T extends EventType>(eventType: T): readonly AnyTelemetryEvent[] {
    return this.events.filter((e) => e.eventType === eventType);
  }

  clear(): void {
    this.events = [];
  }

  getEventCount(): number {
    return this.events.length;
  }
}
