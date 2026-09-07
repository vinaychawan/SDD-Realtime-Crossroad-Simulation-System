// Conflict Zone Manager (TASK-022-026, TASK-066). Prevents vehicle-vehicle collisions when Mode B
// (Opposing Simultaneous) signals allow both NORTH+SOUTH or EAST+WEST to be GREEN.
import type { Direction, VehicleId, VehicleState, Vector2 } from '../../domain/types';
import type { SimulationConfig } from '../ConfigurationManager/configuration-manager.interface';
import type {
  IConflictZoneManager,
  EntryDecision,
  DeadlockRecoveryProcedure
} from './conflict-zone-manager.interface';
import type { ITelemetry, DeadlockEvent } from '../Telemetry';

// Per-vehicle wait tracking for deadlock detection (TASK-025).
interface WaitingVehicle {
  readonly vehicle: VehicleState; // Store full VehicleState for deadlock detection
  readonly waitStartMs: number; // timestamp when vehicle first STOPped
  readonly stopLinePosition: Vector2;
}

/** Maps VehicleId to its wait record; removed when vehicle proceeds. */
type WaitingQueue = Map<VehicleId, WaitingVehicle>;

/** REQ-NEW-COLLISION-PREVENTION-1, ADR-004. */
export class ConflictZoneManager implements IConflictZoneManager {
  private readonly zoneSizeMeters: number;
  private readonly maxWaitMs: number;
  private readonly stopLineDistanceMeters: number;
  private readonly telemetry?: ITelemetry; // TASK-066: optional telemetry integration

  /** Vehicles currently inside the conflict zone, updated via updateOccupancy(). */
  private occupants: VehicleState[] = [];

  /** Vehicles waiting at stop line, keyed by VehicleId. */
  private waitingQueue: WaitingQueue = new Map();

  /** Current simulation time (physics ticks × 10ms), for deadlock timer calculations. */
  private currentTimeMs = 0;

  constructor(config: SimulationConfig['conflictZone'], telemetry?: ITelemetry) {
    this.zoneSizeMeters = config.sizeMeters;
    this.maxWaitMs = config.maxWaitSeconds * 1000;
    this.stopLineDistanceMeters = config.stopLineDistanceMeters;
    this.telemetry = telemetry;
  }

  /** TASK-024: Entry decision logic. */
  requestEntry(vehicle: VehicleState): EntryDecision {
    // Check if an opposing-direction vehicle currently occupies the zone.
    const opposingOccupant = this.occupants.find((v) => this.isOpposing(vehicle.direction, v.direction));

    if (opposingOccupant) {
      // STOP: opposing vehicle in zone.
      const stopLine = this.computeStopLinePosition(vehicle);
      this.recordWait(vehicle, stopLine);
      return { vehicleId: vehicle.id, decision: 'STOP', stopLinePosition: stopLine };
    }

    // PROCEED: zone clear or only same/perpendicular vehicles present.
    this.clearWait(vehicle.id);
    return { vehicleId: vehicle.id, decision: 'PROCEED' };
  }

  /** TASK-023: Occupancy tracking. Called every physics tick with all vehicles in simulation. */
  updateOccupancy(vehicles: VehicleState[]): void {
    // Filter to vehicles whose position is within the conflict zone bounds.
    this.occupants = vehicles.filter((v) => this.isInZone(v.position));
    // Advance simulation time (called once per tick = 10ms).
    this.currentTimeMs += 10;
  }

  getOccupants(): VehicleState[] {
    return [...this.occupants];
  }

  /** TASK-025: Deadlock detection. */
  getDeadlockedVehicles(): VehicleState[] {
    const deadlocked: VehicleState[] = [];
    for (const [, waitRecord] of this.waitingQueue.entries()) {
      const waitDurationMs = this.currentTimeMs - waitRecord.waitStartMs;
      if (waitDurationMs >= this.maxWaitMs) {
        deadlocked.push(waitRecord.vehicle);
      }
    }
    return deadlocked;
  }

  /** TASK-026: Deadlock recovery (ADR-004 Conservative). */
  applyDeadlockRecovery(vehicleId: VehicleId, procedure: DeadlockRecoveryProcedure): void {
    if (procedure !== 'CONSERVATIVE') {
      console.warn(`ConflictZoneManager: unsupported recovery procedure "${procedure}" — using CONSERVATIVE`);
    }

    // Get the wait record to compute wait duration.
    const waitRecord = this.waitingQueue.get(vehicleId);
    const waitDurationMs = waitRecord ? this.currentTimeMs - waitRecord.waitStartMs : 0;

    // TASK-066: Emit DeadlockEvent to Telemetry.
    if (this.telemetry) {
      const event: DeadlockEvent = {
        timestampMs: this.currentTimeMs,
        eventType: 'DEADLOCK',
        level: 'WARN',
        vehicleId,
        waitDurationMs,
        recoveryProcedure: 'CONSERVATIVE'
      };
      this.telemetry.logEvent(event);
    }

    // Remove from waiting queue (vehicle is now in forced-exit state).
    this.waitingQueue.delete(vehicleId);

    // In a full integration, this would:
    // 1. ✅ Emit DeadlockEvent to Telemetry (TASK-066 complete).
    // 2. Set vehicle.speedMs = vehicle.speedMs * 0.5 (50% speed).
    // 3. Vehicle Manager checks Collision Detection on each subsequent tick; if collision
    //    imminent, vehicle re-enters STOP state and re-calls requestEntry().
    //
    // For TASK-026 unit tests, we'll verify the waitingQueue removal and that the method
    // doesn't throw; full integration deferred to TASK-067.

    // Placeholder log for now (will be replaced by full integration in TASK-067).
    console.log(
      `ConflictZoneManager: Applying CONSERVATIVE deadlock recovery to vehicle ${vehicleId} (50% speed, collision-checked)`
    );
  }

  // --- Private helpers ---

  /** NORTH opposes SOUTH; EAST opposes WEST. */
  private isOpposing(dir1: Direction, dir2: Direction): boolean {
    return (
      (dir1 === 'NORTH' && dir2 === 'SOUTH') ||
      (dir1 === 'SOUTH' && dir2 === 'NORTH') ||
      (dir1 === 'EAST' && dir2 === 'WEST') ||
      (dir1 === 'WEST' && dir2 === 'EAST')
    );
  }

  /** Rectangular zone: [-size/2, +size/2] on both X and Y. */
  private isInZone(pos: Vector2): boolean {
    const halfSize = this.zoneSizeMeters / 2;
    return Math.abs(pos.x) <= halfSize && Math.abs(pos.y) <= halfSize;
  }

  /** Stop line position is `stopLineDistanceMeters` before the zone boundary, in vehicle's travel direction. */
  private computeStopLinePosition(vehicle: VehicleState): Vector2 {
    const halfZone = this.zoneSizeMeters / 2;
    const stopDistance = halfZone + this.stopLineDistanceMeters;

    switch (vehicle.direction) {
      case 'NORTH':
        return { x: vehicle.position.x, y: -stopDistance }; // South of zone (NORTH travels toward +Y)
      case 'SOUTH':
        return { x: vehicle.position.x, y: stopDistance }; // North of zone (SOUTH travels toward -Y)
      case 'EAST':
        return { x: -stopDistance, y: vehicle.position.y }; // West of zone (EAST travels toward +X)
      case 'WEST':
        return { x: stopDistance, y: vehicle.position.y }; // East of zone (WEST travels toward -X)
    }
  }

  /** Record a vehicle as waiting (or update its wait record if already waiting). */
  private recordWait(vehicle: VehicleState, stopLine: Vector2): void {
    if (!this.waitingQueue.has(vehicle.id)) {
      this.waitingQueue.set(vehicle.id, {
        vehicle,
        waitStartMs: this.currentTimeMs,
        stopLinePosition: stopLine
      });
    }
    // Else: already waiting; don't reset the timer (wait start time stays the same).
  }

  /** Remove vehicle from waiting queue (called when PROCEED decision is given). */
  private clearWait(vehicleId: VehicleId): void {
    this.waitingQueue.delete(vehicleId);
  }
}
