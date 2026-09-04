// Emergency Vehicle Controller (TASK-038-041).
// Owns emergency spawn timing, signal override, and regular-vehicle yielding effects.
import type { Direction, EmergencyVehicleType, SignalState, VehicleState } from '../../domain/types';
import type { EmergencyConfig } from '../ConfigurationManager/configuration-manager.interface';
import type {
  EmergencyVehicleSpawnedEvent,
  IEmergencyVehicleController,
  YieldingEffect
} from './emergency-vehicle-controller.interface';

interface EmergencyVehicleControllerOptions {
  readonly rng?: () => number;
  readonly emergencyDetectionRangeMeters?: number;
  readonly maxSpeedReductionFactor?: number;
  readonly emergencySlowdownFactor?: number;
  readonly safeLaneChangeDistanceMeters?: number;
  readonly spawnVehicle?: (direction: Direction, exitDirection: Direction) => string;
}

interface SpawnTimerState {
  elapsedMs: number;
  nextSpawnInMs: number;
}

const EMERGENCY_TYPES: readonly EmergencyVehicleType[] = ['AMBULANCE', 'POLICE', 'FIRE_BRIGADE'];
const DIRECTIONS: readonly Direction[] = ['NORTH', 'SOUTH', 'EAST', 'WEST'];
const DIRECTION_PRIORITY: Record<Direction, number> = { NORTH: 0, SOUTH: 1, EAST: 2, WEST: 3 };
const TYPE_PRIORITY: Record<EmergencyVehicleType, number> = { AMBULANCE: 0, POLICE: 1, FIRE_BRIGADE: 2 };
const DEFAULT_SPAWN_SPEED_KMH = 45;

/** TASK-038-041 implementation of docs/INTERFACES.md §7. */
export class EmergencyVehicleController implements IEmergencyVehicleController {
  private emergencyConfig: EmergencyConfig;
  private readonly rng: () => number;
  private readonly emergencyDetectionRangeMeters: number;
  private readonly maxSpeedReductionFactor: number;
  private readonly emergencySlowdownFactor: number;
  private readonly safeLaneChangeDistanceMeters: number;
  private readonly spawnVehicle?: (direction: Direction, exitDirection: Direction) => string;
  private readonly listeners: Array<(event: EmergencyVehicleSpawnedEvent) => void> = [];
  private readonly spawnTimers = new Map<EmergencyVehicleType, SpawnTimerState>();
  private readonly activeEmergencyVehicles = new Map<string, VehicleState>();

  private currentTimeMs = 0;
  private emergencyVehicleCounter = 0;
  private directionCursor = 0;

  constructor(emergencyConfig: EmergencyConfig, options: EmergencyVehicleControllerOptions = {}) {
    this.emergencyConfig = emergencyConfig;
    this.rng = options.rng ?? Math.random;
    this.emergencyDetectionRangeMeters = options.emergencyDetectionRangeMeters ?? 50;
    this.maxSpeedReductionFactor = options.maxSpeedReductionFactor ?? 0.5;
    this.emergencySlowdownFactor = options.emergencySlowdownFactor ?? 0.8;
    this.safeLaneChangeDistanceMeters = options.safeLaneChangeDistanceMeters ?? 10;
    this.spawnVehicle = options.spawnVehicle;

    for (const emergencyType of EMERGENCY_TYPES) {
      this.spawnTimers.set(emergencyType, {
        elapsedMs: 0,
        nextSpawnInMs: this.sampleNextSpawnIntervalMs(emergencyType)
      });
    }
  }

  /** TASK-039: Advance independent per-type Poisson spawn timers. */
  tick(deltaMs: number): void {
    const dueSpawns: Array<{ readonly emergencyType: EmergencyVehicleType; readonly direction: Direction }> = [];

    if (this.emergencyConfig.enabled) {
      for (const emergencyType of EMERGENCY_TYPES) {
        const timer = this.getSpawnTimer(emergencyType);
        timer.elapsedMs += deltaMs;

        while (timer.nextSpawnInMs !== Number.POSITIVE_INFINITY && timer.elapsedMs >= timer.nextSpawnInMs) {
          timer.elapsedMs -= timer.nextSpawnInMs;
          dueSpawns.push({ emergencyType, direction: this.nextDirection() });
          timer.nextSpawnInMs = this.sampleNextSpawnIntervalMs(emergencyType);
        }
      }
    }

    dueSpawns
      .sort((a, b) => DIRECTION_PRIORITY[a.direction] - DIRECTION_PRIORITY[b.direction] || TYPE_PRIORITY[a.emergencyType] - TYPE_PRIORITY[b.emergencyType])
      .forEach((spawn) => this.emitEmergencySpawn(spawn.emergencyType, spawn.direction));

    this.currentTimeMs += deltaMs;
  }

  /** TASK-040: Emergency vehicles proceed regardless of signal state. */
  evaluateSignalOverride(_vehicle: VehicleState, _signalState: SignalState, _intersectionOccupied: boolean): 'PROCEED' {
    return 'PROCEED';
  }

  /** TASK-040 helper for the Physics Engine's occupied-intersection slowdown decision. */
  getSignalOverrideSpeedFactor(vehicle: VehicleState, intersectionOccupied: boolean): number {
    return vehicle.isEmergency && intersectionOccupied ? this.emergencySlowdownFactor : 1;
  }

  /** TASK-041: Compute speed reduction and safe lane-change hints around emergency vehicles. */
  computeYieldingEffects(vehicles: VehicleState[]): Map<string, YieldingEffect> {
    const emergencyVehicles = vehicles.filter((vehicle) => vehicle.isEmergency);
    const regularVehicles = vehicles.filter((vehicle) => !vehicle.isEmergency);
    const effects = new Map<string, YieldingEffect>();

    for (const regularVehicle of regularVehicles) {
      const nearest = this.findNearestEmergencyWithinRange(regularVehicle, emergencyVehicles);
      if (!nearest) {
        continue;
      }

      effects.set(regularVehicle.id, {
        targetSpeedFactor: this.computeTargetSpeedFactor(nearest.distanceMeters),
        laneChangeDirection: this.computeLaneChangeDirection(regularVehicle, nearest.vehicle, vehicles)
      });
    }

    return effects;
  }

  /** TASK-039 event hook for Vehicle Manager / Telemetry integration. */
  onEmergencyVehicleSpawned(listener: (event: EmergencyVehicleSpawnedEvent) => void): void {
    this.listeners.push(listener);
  }

  /** REQ-NEW-E5 runtime rate changes take effect on the next spawn interval. */
  updateEmergencyConfig(emergencyConfig: EmergencyConfig): void {
    this.emergencyConfig = emergencyConfig;
    for (const emergencyType of EMERGENCY_TYPES) {
      const timer = this.getSpawnTimer(emergencyType);
      timer.elapsedMs = 0;
      timer.nextSpawnInMs = this.sampleNextSpawnIntervalMs(emergencyType);
    }
  }

  getActiveEmergencyVehicles(): VehicleState[] {
    return Array.from(this.activeEmergencyVehicles.values());
  }

  private getSpawnTimer(emergencyType: EmergencyVehicleType): SpawnTimerState {
    return this.spawnTimers.get(emergencyType)!;
  }

  private sampleNextSpawnIntervalMs(emergencyType: EmergencyVehicleType): number {
    const ratePerMinute = this.clampRate(this.emergencyConfig.spawnRatePerMinute[emergencyType]);
    if (!this.emergencyConfig.enabled || ratePerMinute === 0) {
      return Number.POSITIVE_INFINITY;
    }

    const lambdaPerMs = ratePerMinute / 60_000;
    const randomValue = Math.min(Math.max(this.rng(), Number.EPSILON), 1 - Number.EPSILON);
    return -Math.log(1 - randomValue) / lambdaPerMs;
  }

  private clampRate(ratePerMinute: number): number {
    return Math.min(20, Math.max(0, ratePerMinute));
  }

  private emitEmergencySpawn(emergencyType: EmergencyVehicleType, direction: Direction): void {
    const exitDirection = this.oppositeDirection(direction);
    const fallbackVehicleId = `emergency-${++this.emergencyVehicleCounter}`;
    const vehicleId = this.spawnVehicle?.(direction, exitDirection) ?? fallbackVehicleId;
    const vehicle = this.createEmergencyVehicle(vehicleId, emergencyType, direction, exitDirection);
    const event: EmergencyVehicleSpawnedEvent = {
      vehicleId,
      emergencyType,
      direction,
      exitDirection,
      timestampMs: this.currentTimeMs,
      vehicle
    };

    this.activeEmergencyVehicles.set(vehicle.id, vehicle);
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  private createEmergencyVehicle(
    vehicleId: string,
    emergencyType: EmergencyVehicleType,
    direction: Direction,
    exitDirection: Direction
  ): VehicleState {
    return {
      id: vehicleId,
      direction,
      exitDirection,
      lane: 2,
      position: this.computeSpawnPosition(direction),
      speedKmh: DEFAULT_SPAWN_SPEED_KMH,
      speedMs: DEFAULT_SPAWN_SPEED_KMH / 3.6,
      isEmergency: true,
      emergencyType,
      yieldingActive: false
    };
  }

  private computeSpawnPosition(direction: Direction): { readonly x: number; readonly y: number } {
    switch (direction) {
      case 'NORTH':
        return { x: 0, y: -60 };
      case 'SOUTH':
        return { x: 0, y: 60 };
      case 'EAST':
        return { x: -60, y: 0 };
      case 'WEST':
        return { x: 60, y: 0 };
    }
  }

  private nextDirection(): Direction {
    const direction = DIRECTIONS[this.directionCursor % DIRECTIONS.length];
    this.directionCursor++;
    return direction;
  }

  private oppositeDirection(direction: Direction): Direction {
    switch (direction) {
      case 'NORTH':
        return 'SOUTH';
      case 'SOUTH':
        return 'NORTH';
      case 'EAST':
        return 'WEST';
      case 'WEST':
        return 'EAST';
    }
  }

  private findNearestEmergencyWithinRange(
    regularVehicle: VehicleState,
    emergencyVehicles: VehicleState[]
  ): { readonly vehicle: VehicleState; readonly distanceMeters: number } | undefined {
    let nearest: { readonly vehicle: VehicleState; readonly distanceMeters: number } | undefined;

    for (const emergencyVehicle of emergencyVehicles) {
      const distanceMeters = this.distanceBetween(regularVehicle.position, emergencyVehicle.position);
      if (distanceMeters <= this.emergencyDetectionRangeMeters && (!nearest || distanceMeters < nearest.distanceMeters)) {
        nearest = { vehicle: emergencyVehicle, distanceMeters };
      }
    }

    return nearest;
  }

  private computeTargetSpeedFactor(distanceMeters: number): number {
    const clampedDistance = Math.min(this.emergencyDetectionRangeMeters, Math.max(0, distanceMeters));
    const proximity = 1 - clampedDistance / this.emergencyDetectionRangeMeters;
    return 1 - this.maxSpeedReductionFactor * proximity;
  }

  private computeLaneChangeDirection(regularVehicle: VehicleState, emergencyVehicle: VehicleState, vehicles: VehicleState[]): 'LEFT' | 'RIGHT' | 'NONE' {
    const preferredDirection = this.preferredLaneChangeDirection(regularVehicle, emergencyVehicle);
    if (preferredDirection !== 'NONE' && this.isLaneChangeSafe(regularVehicle, preferredDirection, vehicles)) {
      return preferredDirection;
    }

    const fallbackDirection = preferredDirection === 'LEFT' ? 'RIGHT' : 'LEFT';
    if (this.isLaneChangeSafe(regularVehicle, fallbackDirection, vehicles)) {
      return fallbackDirection;
    }

    return 'NONE';
  }

  private preferredLaneChangeDirection(regularVehicle: VehicleState, emergencyVehicle: VehicleState): 'LEFT' | 'RIGHT' | 'NONE' {
    if (regularVehicle.lane < emergencyVehicle.lane) {
      return 'LEFT';
    }
    if (regularVehicle.lane > emergencyVehicle.lane) {
      return 'RIGHT';
    }
    return regularVehicle.lane < 3 ? 'RIGHT' : 'LEFT';
  }

  private isLaneChangeSafe(regularVehicle: VehicleState, laneChangeDirection: 'LEFT' | 'RIGHT', vehicles: VehicleState[]): boolean {
    const targetLane = laneChangeDirection === 'LEFT' ? regularVehicle.lane - 1 : regularVehicle.lane + 1;
    if (targetLane < 1 || targetLane > 3) {
      return false;
    }

    return vehicles.every((otherVehicle) => {
      if (otherVehicle.id === regularVehicle.id || otherVehicle.lane !== targetLane || otherVehicle.direction !== regularVehicle.direction) {
        return true;
      }
      return this.distanceBetween(regularVehicle.position, otherVehicle.position) > this.safeLaneChangeDistanceMeters;
    });
  }

  private distanceBetween(first: { readonly x: number; readonly y: number }, second: { readonly x: number; readonly y: number }): number {
    return Math.hypot(first.x - second.x, first.y - second.y);
  }
}
