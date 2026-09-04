/**
 * Metrics Collector Public Interface
 * Specification: INTERFACES.md §9
 * Linked Requirements: REQ-028, MF-001
 */

export interface MetricsSnapshot {
  vehicleCountRegular: number;
  vehicleCountEmergency: number;
  averageSpeedKmh: number;         // 0 if no vehicles (MF-001)
  throughputPerMinute: number;     // rolling 60s window (MF-001)
  totalCollisions: number;
  activeCollisions: number;
  collisionFreeRatioPercent: number; // time-based ratio (MF-001)
  deadlockCount: number;
  renderFps: number;
  physicsHz: number;
  memoryMb: number;
  cpuPercent: number;
}

export interface IMetricsCollector {
  /** Recomputes the snapshot; called at 10 Hz (independent of 100 Hz physics). */
  tick(): void;

  getSnapshot(): Readonly<MetricsSnapshot>;
}
