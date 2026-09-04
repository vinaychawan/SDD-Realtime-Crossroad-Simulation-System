// Vehicle Manager (TASK-028-029). Manages vehicle lifecycle: spawn, despawn, lane selection.
// REQ-007, ADR-005, MF-002 (serialized spawn ordering).
import type { Direction, VehicleId, VehicleState } from '../../domain/types';
import { SpawnCapacityExceededError } from '../../domain/errors';
import type { SimulationConfig } from '../ConfigurationManager/configuration-manager.interface';
import type { IVehicleManager, ILaneSelectionStrategy } from './vehicle-manager.interface';

/** Spawn queue entry for serialized ordering (TASK-029). */
interface PendingSpawn {
  readonly vehicleId: VehicleId;
  readonly direction: Direction;
  readonly exitDirection: Direction;
  readonly lane: 1 | 2 | 3;
  readonly spawnTimeMs: number;
}

/** Vehicle lifecycle tracking. */
interface VehicleRecord {
  readonly vehicle: VehicleState;
  readonly spawnTimeMs: number;
  readonly despawnTimeMs?: number; // undefined while active
}

/**
 * TASK-028-029: Vehicle lifecycle manager with serialized spawn ordering (MF-002).
 * REQ-007: Delegates lane selection to pluggable strategy (ADR-005).
 */
export class VehicleManager implements IVehicleManager {
  // Default spawn speed (km/h) — may be overridden by config in future
  private readonly DEFAULT_SPAWN_SPEED_KMH = 30;

  private readonly strategy: ILaneSelectionStrategy;

  /** Active vehicles: VehicleId → VehicleRecord */
  private vehicleRecords: Map<VehicleId, VehicleRecord> = new Map();

  /** Global vehicle counter for VehicleId generation */
  private vehicleIdCounter = 0;

  /** Pending spawn queue (TASK-029): serialized N→S→E→W ordering */
  private readonly spawnQueue: PendingSpawn[] = [];

  /** Maximum queue size per direction (MF-002 capacity limit) */
  private readonly maxQueueSizePerDirection: number = 10;

  /** Current simulation time (ms) */
  private currentTimeMs = 0;

  constructor(_config: SimulationConfig, strategy: ILaneSelectionStrategy) {
    this.strategy = strategy;
    // _config stored for potential future use in spawn rate configuration
  }

  /** TASK-029: Spawn a regular vehicle with serialized ordering (N→S→E→W priority). */
  spawnVehicle(direction: Direction, exitDirection: Direction): VehicleId {
    // Check entry queue capacity per direction (MF-002)
    const directionsInQueue = this.spawnQueue.filter((s) => s.direction === direction).length;
    if (directionsInQueue >= this.maxQueueSizePerDirection) {
      throw new SpawnCapacityExceededError(
        `Vehicle spawn queue full for direction ${direction} (${this.maxQueueSizePerDirection} pending)`
      );
    }

    // Generate unique VehicleId
    const vehicleId = `vehicle-${++this.vehicleIdCounter}`;

    // Lane selection via strategy (TASK-030/031)
    const selectedLane = this.strategy.selectLane(
      this.createSpawningVehicle(vehicleId, direction, exitDirection),
      this.getActiveVehicles()
    ) as 1 | 2 | 3;

    // Add to spawn queue for serialized processing
    this.spawnQueue.push({
      vehicleId,
      direction,
      exitDirection,
      lane: selectedLane,
      spawnTimeMs: this.currentTimeMs
    });

    // Sort queue by direction priority (TASK-029): N→S→E→W
    this.sortSpawnQueue();

    return vehicleId;
  }

  /** TASK-029: Process spawn queue, applying MF-002 serialization order. */
  processSpawns(): void {
    // Drain queue in priority order (N→S→E→W)
    while (this.spawnQueue.length > 0) {
      const spawn = this.spawnQueue.shift()!;

      // Create actual vehicle with spawn position calculated
      const position = this.computeSpawnPosition(spawn.direction, spawn.lane);

      const vehicle: VehicleState = {
        id: spawn.vehicleId,
        direction: spawn.direction,
        exitDirection: spawn.exitDirection,
        lane: spawn.lane,
        position,
        speedKmh: this.DEFAULT_SPAWN_SPEED_KMH,
        speedMs: this.DEFAULT_SPAWN_SPEED_KMH / 3.6,
        isEmergency: false,
        yieldingActive: false
      };

      this.vehicleRecords.set(spawn.vehicleId, {
        vehicle,
        spawnTimeMs: spawn.spawnTimeMs
      });
    }
  }

  /** TASK-029: Despawn a vehicle (remove when exiting bounds). */
  despawnVehicle(id: VehicleId): void {
    this.vehicleRecords.delete(id);
  }

  /** Returns all active vehicles (not despawned). */
  getActiveVehicles(): VehicleState[] {
    return Array.from(this.vehicleRecords.values())
      .filter((record) => record.despawnTimeMs === undefined)
      .map((record) => record.vehicle);
  }

  /** Advance simulation time by one tick (called by Simulation Orchestrator). */
  tick(deltaMs: number): void {
    this.currentTimeMs += deltaMs;
    this.processSpawns();
  }

  // --- Private helpers ---

  /** Sort spawn queue by direction priority (TASK-029): N→S→E→W. */
  private sortSpawnQueue(): void {
    const directionPriority: Record<Direction, number> = { NORTH: 0, SOUTH: 1, EAST: 2, WEST: 3 };
    this.spawnQueue.sort((a, b) => directionPriority[a.direction] - directionPriority[b.direction]);
  }

  /** Compute spawn position for a vehicle in a given direction and lane. */
  private computeSpawnPosition(direction: Direction, lane: 1 | 2 | 3): { x: number; y: number } {
    // Spawn point is 60m before intersection center (at -Y for NORTH, etc.)
    // Lanes are offset perpendicular to travel direction
    // Lane 1 (left): -5m offset, Lane 2 (center): 0m offset, Lane 3 (right): +5m offset
    const laneOffsets: Record<1 | 2 | 3, number> = { 1: -5, 2: 0, 3: 5 };
    const laneOffset = laneOffsets[lane];

    switch (direction) {
      case 'NORTH':
        return { x: laneOffset, y: -60 }; // South of intersection
      case 'SOUTH':
        return { x: laneOffset, y: 60 }; // North of intersection
      case 'EAST':
        return { x: -60, y: laneOffset }; // West of intersection
      case 'WEST':
        return { x: 60, y: laneOffset }; // East of intersection
    }
  }

  /** Create a placeholder vehicle for strategy.selectLane() to inspect (at spawn point). */
  private createSpawningVehicle(id: VehicleId, direction: Direction, exitDirection: Direction): VehicleState {
    return {
      id,
      direction,
      exitDirection,
      lane: 2, // Placeholder; strategy may change this
      position: this.computeSpawnPosition(direction, 2),
      speedKmh: this.DEFAULT_SPAWN_SPEED_KMH,
      speedMs: this.DEFAULT_SPAWN_SPEED_KMH / 3.6,
      isEmergency: false,
      yieldingActive: false
    };
  }
}
