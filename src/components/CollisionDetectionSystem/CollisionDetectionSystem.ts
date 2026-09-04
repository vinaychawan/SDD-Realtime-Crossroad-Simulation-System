// Collision Detection System (TASK-033-036).
// Uses spatial-grid broad phase plus AABB narrow phase to detect vehicle-vehicle
// and vehicle-infrastructure collisions every physics tick.
import type { Direction, VehicleState, Vector2 } from '../../domain/types';
import type { CollisionEvent, ICollisionDetectionSystem } from './collision-detection-system.interface';

interface CollisionDetectionOptions {
  readonly cellSizeMeters?: number;
  readonly vehicleLengthMeters?: number;
  readonly vehicleWidthMeters?: number;
  readonly infrastructureBoundaryMeters?: number;
  readonly tickDurationMs?: number;
}

interface Aabb {
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
}

interface VehicleAabb {
  readonly vehicle: VehicleState;
  readonly aabb: Aabb;
}

interface GridCellRange {
  readonly minCellX: number;
  readonly maxCellX: number;
  readonly minCellY: number;
  readonly maxCellY: number;
}

/** TASK-033-036 implementation of docs/INTERFACES.md §8. */
export class CollisionDetectionSystem implements ICollisionDetectionSystem {
  private readonly cellSizeMeters: number;
  private readonly vehicleLengthMeters: number;
  private readonly vehicleWidthMeters: number;
  private readonly infrastructureBoundaryMeters: number;
  private readonly tickDurationMs: number;

  private readonly listeners: Array<(event: CollisionEvent) => void> = [];
  private currentTimeMs = 0;
  private lastBroadPhaseCandidateCount = 0;
  private lastGridCellCount = 0;

  constructor(options: CollisionDetectionOptions = {}) {
    this.cellSizeMeters = options.cellSizeMeters ?? 25;
    this.vehicleLengthMeters = options.vehicleLengthMeters ?? 4.5;
    this.vehicleWidthMeters = options.vehicleWidthMeters ?? 2;
    this.infrastructureBoundaryMeters = options.infrastructureBoundaryMeters ?? 75;
    this.tickDurationMs = options.tickDurationMs ?? 10;
  }

  /** TASK-035: Detect all collisions for the current physics tick. */
  tick(vehicles: VehicleState[]): CollisionEvent[] {
    const vehicleAabbs = vehicles.map((vehicle) => ({ vehicle, aabb: this.computeVehicleAabb(vehicle) }));
    const candidatePairs = this.computeBroadPhaseCandidatePairs(vehicleAabbs);
    const events: CollisionEvent[] = [];

    for (const [first, second] of candidatePairs) {
      if (this.aabbOverlaps(first.aabb, second.aabb)) {
        events.push(this.createVehicleCollisionEvent(first.vehicle, second.vehicle));
      }
    }

    for (const entry of vehicleAabbs) {
      if (this.collidesWithInfrastructure(entry.aabb)) {
        events.push(this.createInfrastructureCollisionEvent(entry.vehicle));
      }
    }

    for (const event of events) {
      this.notifyCollision(event);
    }

    this.currentTimeMs += this.tickDurationMs;
    return events;
  }

  /** TASK-036: Register downstream Telemetry/Metrics listeners. */
  onCollision(listener: (event: CollisionEvent) => void): void {
    this.listeners.push(listener);
  }

  /** Test/diagnostic accessor: verifies broad phase avoided a full O(n²) candidate set. */
  getLastBroadPhaseCandidateCount(): number {
    return this.lastBroadPhaseCandidateCount;
  }

  /** Test/diagnostic accessor: verifies spatial grid partitioning is active. */
  getLastGridCellCount(): number {
    return this.lastGridCellCount;
  }

  private computeBroadPhaseCandidatePairs(vehicleAabbs: VehicleAabb[]): Array<[VehicleAabb, VehicleAabb]> {
    const grid = new Map<string, VehicleAabb[]>();

    for (const entry of vehicleAabbs) {
      const range = this.computeGridCellRange(entry.aabb);
      for (let cellX = range.minCellX; cellX <= range.maxCellX; cellX++) {
        for (let cellY = range.minCellY; cellY <= range.maxCellY; cellY++) {
          const key = this.gridKey(cellX, cellY);
          const cell = grid.get(key) ?? [];
          cell.push(entry);
          grid.set(key, cell);
        }
      }
    }

    this.lastGridCellCount = grid.size;

    const candidatePairKeys = new Set<string>();
    const candidatePairs: Array<[VehicleAabb, VehicleAabb]> = [];

    for (const cellEntries of grid.values()) {
      for (let i = 0; i < cellEntries.length; i++) {
        for (let j = i + 1; j < cellEntries.length; j++) {
          const first = cellEntries[i];
          const second = cellEntries[j];
          const pairKey = this.pairKey(first.vehicle.id, second.vehicle.id);
          if (!candidatePairKeys.has(pairKey)) {
            candidatePairKeys.add(pairKey);
            candidatePairs.push([first, second]);
          }
        }
      }
    }

    this.lastBroadPhaseCandidateCount = candidatePairs.length;
    return candidatePairs;
  }

  private computeVehicleAabb(vehicle: VehicleState): Aabb {
    const dimensions = this.computeVehicleDimensions(vehicle.direction);
    const halfWidth = dimensions.width / 2;
    const halfLength = dimensions.length / 2;

    return {
      minX: vehicle.position.x - halfWidth,
      maxX: vehicle.position.x + halfWidth,
      minY: vehicle.position.y - halfLength,
      maxY: vehicle.position.y + halfLength
    };
  }

  private computeVehicleDimensions(direction: Direction): { readonly width: number; readonly length: number } {
    switch (direction) {
      case 'NORTH':
      case 'SOUTH':
        return { width: this.vehicleWidthMeters, length: this.vehicleLengthMeters };
      case 'EAST':
      case 'WEST':
        return { width: this.vehicleLengthMeters, length: this.vehicleWidthMeters };
    }
  }

  private computeGridCellRange(aabb: Aabb): GridCellRange {
    return {
      minCellX: Math.floor(aabb.minX / this.cellSizeMeters),
      maxCellX: Math.floor(aabb.maxX / this.cellSizeMeters),
      minCellY: Math.floor(aabb.minY / this.cellSizeMeters),
      maxCellY: Math.floor(aabb.maxY / this.cellSizeMeters)
    };
  }

  private aabbOverlaps(first: Aabb, second: Aabb): boolean {
    return first.minX <= second.maxX && first.maxX >= second.minX && first.minY <= second.maxY && first.maxY >= second.minY;
  }

  private collidesWithInfrastructure(aabb: Aabb): boolean {
    return (
      aabb.minX < -this.infrastructureBoundaryMeters ||
      aabb.maxX > this.infrastructureBoundaryMeters ||
      aabb.minY < -this.infrastructureBoundaryMeters ||
      aabb.maxY > this.infrastructureBoundaryMeters
    );
  }

  private createVehicleCollisionEvent(first: VehicleState, second: VehicleState): CollisionEvent {
    return {
      vehicleIds: this.orderVehicleIds(first.id, second.id),
      position: this.midpoint(first.position, second.position),
      timestampMs: this.currentTimeMs
    };
  }

  private createInfrastructureCollisionEvent(vehicle: VehicleState): CollisionEvent {
    return {
      vehicleIds: [vehicle.id, 'INFRASTRUCTURE'],
      position: { ...vehicle.position },
      timestampMs: this.currentTimeMs
    };
  }

  private notifyCollision(event: CollisionEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  private midpoint(first: Vector2, second: Vector2): Vector2 {
    return {
      x: (first.x + second.x) / 2,
      y: (first.y + second.y) / 2
    };
  }

  private orderVehicleIds(firstId: string, secondId: string): [string, string] {
    return firstId <= secondId ? [firstId, secondId] : [secondId, firstId];
  }

  private pairKey(firstId: string, secondId: string): string {
    const ordered = this.orderVehicleIds(firstId, secondId);
    return `${ordered[0]}|${ordered[1]}`;
  }

  private gridKey(cellX: number, cellY: number): string {
    return `${cellX},${cellY}`;
  }
}
