/**
 * Metrics Collector Implementation
 * Specification: ADR-008, INTERFACES.md §9
 * Linked Requirements: REQ-028, MF-001
 *
 * Computes MetricsSnapshot at 10 Hz with precise formulas:
 * - averageSpeedKmh: sum(speedKmh) / count, or 0 when count === 0
 * - throughputPerMinute: count of despawn events in trailing 60s window
 * - collisionFreeRatioPercent: (simulationMs - collisionMs) / simulationMs × 100
 */

import type { VehicleState } from '../../domain/types';
import type { CollisionEvent } from '../CollisionDetectionSystem/collision-detection-system.interface';
import type { IMetricsCollector, MetricsSnapshot } from './metrics-collector.interface';

interface DespawnEvent {
  timestampMs: number;
}

interface CollisionDuration {
  startMs: number;
  endMs: number | null; // null = still active
}

export class MetricsCollector implements IMetricsCollector {
  private snapshot: MetricsSnapshot;
  private despawnEvents: DespawnEvent[] = [];
  private collisionDurations: Map<string, CollisionDuration> = new Map();
  private simulationStartMs: number = 0;
  private currentTimeMs: number = 0;
  private hasSimulationStarted: boolean = false;
  private deadlockCount: number = 0;

  // Data providers (set by orchestrator or system integrators)
  private vehiclesProvider: (() => VehicleState[]) | null = null;
  private renderFpsProvider: (() => number) | null = null;
  private physicsHzProvider: (() => number) | null = null;
  private memoryMbProvider: (() => number) | null = null;
  private cpuPercentProvider: (() => number) | null = null;

  constructor() {
    this.snapshot = this.createEmptySnapshot();
  }

  /**
   * Set the vehicle provider function (e.g., from VehicleManager.getAllVehicles())
   */
  setVehiclesProvider(provider: () => VehicleState[]): void {
    this.vehiclesProvider = provider;
  }

  /**
   * Set performance metric providers
   */
  setRenderFpsProvider(provider: () => number): void {
    this.renderFpsProvider = provider;
  }

  setPhysicsHzProvider(provider: () => number): void {
    this.physicsHzProvider = provider;
  }

  setMemoryMbProvider(provider: () => number): void {
    this.memoryMbProvider = provider;
  }

  setCpuPercentProvider(provider: () => number): void {
    this.cpuPercentProvider = provider;
  }

  /**
   * Record a vehicle exit (despawn) event for throughput calculation
   */
  recordDespawn(timestampMs: number): void {
    this.despawnEvents.push({ timestampMs });
  }

  /**
   * Record a collision event from CollisionDetectionSystem
   */
  recordCollision(event: CollisionEvent): void {
    const key = this.makeCollisionKey(event);
    
    if (!this.collisionDurations.has(key)) {
      this.collisionDurations.set(key, {
        startMs: event.timestampMs,
        endMs: null,
      });
    }
  }

  /**
   * Mark a collision as resolved (vehicles no longer overlapping)
   */
  resolveCollision(event: CollisionEvent): void {
    const key = this.makeCollisionKey(event);
    const duration = this.collisionDurations.get(key);
    
    if (duration && duration.endMs === null) {
      duration.endMs = event.timestampMs;
    }
  }

  /**
   * Record a deadlock event from ConflictZoneManager
   */
  recordDeadlock(): void {
    this.deadlockCount++;
  }

  /**
   * Update simulation time reference (called by orchestrator each tick)
   */
  updateTime(timestampMs: number): void {
    this.currentTimeMs = timestampMs;
    if (!this.hasSimulationStarted) {
      this.simulationStartMs = timestampMs;
      this.hasSimulationStarted = true;
    }
  }

  /**
   * Reset metrics (e.g., on simulation restart)
   */
  reset(): void {
    this.snapshot = this.createEmptySnapshot();
    this.despawnEvents = [];
    this.collisionDurations.clear();
    this.simulationStartMs = 0;
    this.currentTimeMs = 0;
    this.hasSimulationStarted = false;
    this.deadlockCount = 0;
  }

  /**
   * Recompute snapshot at 10 Hz (called by orchestrator)
   */
  tick(): void {
    const vehicles = this.vehiclesProvider ? this.vehiclesProvider() : [];
    
    // Vehicle counts
    const regularVehicles = vehicles.filter(v => !v.isEmergency);
    const emergencyVehicles = vehicles.filter(v => v.isEmergency);
    
    // MF-001 Formula 1: Average Speed
    // averageSpeedKmh = sum(speedKmh) / count, or 0 when count === 0
    const averageSpeedKmh = this.computeAverageSpeed(vehicles);
    
    // MF-001 Formula 2: Throughput (rolling 60s window)
    const throughputPerMinute = this.computeThroughput();
    
    // Collision statistics
    const { totalCollisions, activeCollisions } = this.getCollisionCounts();
    
    // MF-001 Formula 3: Collision-Free Ratio (time-based)
    const collisionFreeRatioPercent = this.computeCollisionFreeRatio();
    
    // Performance metrics (from providers)
    const renderFps = this.renderFpsProvider ? this.renderFpsProvider() : 0;
    const physicsHz = this.physicsHzProvider ? this.physicsHzProvider() : 0;
    
    const memoryMb = this.memoryMbProvider ? this.memoryMbProvider() : 0;
    const cpuPercent = this.cpuPercentProvider ? this.cpuPercentProvider() : 0;

    this.snapshot = {
      vehicleCountRegular: regularVehicles.length,
      vehicleCountEmergency: emergencyVehicles.length,
      averageSpeedKmh,
      throughputPerMinute,
      totalCollisions,
      activeCollisions,
      collisionFreeRatioPercent,
      deadlockCount: this.deadlockCount,
      renderFps,
      physicsHz,
      memoryMb,
      cpuPercent,
    };
  }

  getSnapshot(): Readonly<MetricsSnapshot> {
    return Object.freeze({ ...this.snapshot });
  }

  /**
   * MF-001 Formula 1: Average Speed
   * averageSpeedKmh = sum(speedKmh) / count, or 0 when count === 0
   */
  private computeAverageSpeed(vehicles: VehicleState[]): number {
    if (vehicles.length === 0) {
      return 0;
    }
    
    const totalSpeed = vehicles.reduce((sum, v) => sum + v.speedKmh, 0);
    return totalSpeed / vehicles.length;
  }

  /**
   * MF-001 Formula 2: Throughput
   * Count of despawn events in trailing 60-second window
   */
  private computeThroughput(): number {
    const windowStartMs = this.currentTimeMs - 60_000; // 60 seconds ago
    
    // Evict old events outside the rolling window
    this.despawnEvents = this.despawnEvents.filter(
      e => e.timestampMs > windowStartMs
    );
    
    return this.despawnEvents.length;
  }

  /**
   * MF-001 Formula 3: Collision-Free Ratio
   * (simulationDurationMs - totalCollisionTimeMs) / simulationDurationMs × 100
   */
  private computeCollisionFreeRatio(): number {
    const simulationDurationMs = this.currentTimeMs - this.simulationStartMs;
    
    if (simulationDurationMs === 0) {
      return 100; // No time elapsed = no collisions
    }
    
    const totalCollisionTimeMs = this.computeTotalCollisionTime();
    const collisionFreeTimeMs = simulationDurationMs - totalCollisionTimeMs;
    
    return (Math.max(0, collisionFreeTimeMs) / simulationDurationMs) * 100;
  }

  /**
   * Sum active-collision time as the union of all collision intervals.
   * Overlapping collision pairs are counted once because MF-001 defines the
   * ratio as time with/without active collisions, not per-pair collision time.
   */
  private computeTotalCollisionTime(): number {
    const intervals = Array.from(this.collisionDurations.values())
      .map(duration => ({
        startMs: duration.startMs,
        endMs: duration.endMs ?? this.currentTimeMs,
      }))
      .filter(interval => interval.endMs > interval.startMs)
      .sort((a, b) => a.startMs - b.startMs);
    
    if (intervals.length === 0) {
      return 0;
    }

    let totalMs = 0;
    let activeStartMs = intervals[0].startMs;
    let activeEndMs = intervals[0].endMs;

    for (const interval of intervals.slice(1)) {
      if (interval.startMs <= activeEndMs) {
        activeEndMs = Math.max(activeEndMs, interval.endMs);
      } else {
        totalMs += activeEndMs - activeStartMs;
        activeStartMs = interval.startMs;
        activeEndMs = interval.endMs;
      }
    }

    totalMs += activeEndMs - activeStartMs;
    
    return totalMs;
  }

  /**
   * Get collision counts (total and currently active)
   */
  private getCollisionCounts(): { totalCollisions: number; activeCollisions: number } {
    const totalCollisions = this.collisionDurations.size;
    const activeCollisions = Array.from(this.collisionDurations.values()).filter(
      d => d.endMs === null
    ).length;
    
    return { totalCollisions, activeCollisions };
  }

  /**
   * Create a unique key for a collision event
   */
  private makeCollisionKey(event: CollisionEvent): string {
    const ids = [...event.vehicleIds].sort();
    return ids.join('|');
  }

  private createEmptySnapshot(): MetricsSnapshot {
    return {
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
    };
  }
}
