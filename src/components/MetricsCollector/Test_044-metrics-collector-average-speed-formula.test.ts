// TASK-044 acceptance criteria:
// - averageSpeedKmh = sum(speedKmh) / count
// - returns 0 when vehicle count is 0
// - Unit tests cover zero, single, and multi-vehicle cases
import { describe, expect, it } from 'vitest';
import { MetricsCollector } from './MetricsCollector';
import type { Direction, VehicleState } from '../../domain/types';

function vehicle(id: string, speedKmh: number, isEmergency = false): VehicleState {
  return {
    id,
    direction: 'NORTH' as Direction,
    exitDirection: 'SOUTH' as Direction,
    lane: 2,
    position: { x: 0, y: 0 },
    speedKmh,
    speedMs: speedKmh / 3.6,
    isEmergency,
    emergencyType: isEmergency ? 'AMBULANCE' : undefined,
    yieldingActive: false,
  };
}

describe('TASK-044: Metrics Collector average speed formula', () => {
  it('returns 0 when there are zero vehicles', () => {
    const collector = new MetricsCollector();
    collector.setVehiclesProvider(() => []);

    collector.tick();

    expect(collector.getSnapshot().averageSpeedKmh).toBe(0);
  });

  it('returns the exact speed for a single vehicle', () => {
    const collector = new MetricsCollector();
    collector.setVehiclesProvider(() => [vehicle('v1', 42.5)]);

    collector.tick();

    expect(collector.getSnapshot().averageSpeedKmh).toBe(42.5);
  });

  it('computes sum(speedKmh) / count for multiple vehicles', () => {
    const collector = new MetricsCollector();
    collector.setVehiclesProvider(() => [vehicle('v1', 60), vehicle('v2', 30), vehicle('v3', 0)]);

    collector.tick();

    expect(collector.getSnapshot().averageSpeedKmh).toBe(30);
  });

  it('includes stationary vehicles in the average', () => {
    const collector = new MetricsCollector();
    collector.setVehiclesProvider(() => [vehicle('moving', 80), vehicle('stopped-a', 0), vehicle('stopped-b', 0)]);

    collector.tick();

    expect(collector.getSnapshot().averageSpeedKmh).toBeCloseTo(26.6666667, 6);
  });

  it('includes emergency vehicles equally in the average', () => {
    const collector = new MetricsCollector();
    collector.setVehiclesProvider(() => [vehicle('regular', 20), vehicle('emergency', 100, true)]);

    collector.tick();

    expect(collector.getSnapshot().averageSpeedKmh).toBe(60);
    expect(collector.getSnapshot().vehicleCountRegular).toBe(1);
    expect(collector.getSnapshot().vehicleCountEmergency).toBe(1);
  });
});
