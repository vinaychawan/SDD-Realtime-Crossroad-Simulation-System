// TASK-031 acceptance criteria:
// - IntelligentLaneStrategy computes optimal lane from current lane + exit direction
// - Vehicle gracefully proceeds in current lane if no safe lane change is found
// - Behavioral test: 100 spawns with known destinations achieve ≥95% optimal-lane success
import { describe, expect, it } from 'vitest';
import { IntelligentLaneStrategy } from './IntelligentLaneStrategy';
import type { VehicleState, Direction } from '../../domain/types';

function createMockVehicle(
  id: string,
  direction: Direction,
  lane: 1 | 2 | 3 = 2,
  speedKmh: number = 30,
  distanceToIntersection: number = 70
): VehicleState {
  // Position vehicle such that distance to intersection is as specified
  let position: { x: number; y: number };
  switch (direction) {
    case 'NORTH':
      position = { x: 0, y: -distanceToIntersection };
      break;
    case 'SOUTH':
      position = { x: 0, y: distanceToIntersection };
      break;
    case 'EAST':
      position = { x: -distanceToIntersection, y: 0 };
      break;
    case 'WEST':
      position = { x: distanceToIntersection, y: 0 };
      break;
  }

  return {
    id,
    direction,
    exitDirection: 'SOUTH', // Placeholder
    lane,
    position,
    speedKmh,
    speedMs: speedKmh / 3.6,
    isEmergency: false,
    yieldingActive: false
  };
}

describe('TASK-031: Intelligent lane selection strategy', () => {
  it('IntelligentLaneStrategy has kind === INTELLIGENT', () => {
    const strategy = new IntelligentLaneStrategy();
    expect(strategy.kind).toBe('INTELLIGENT');
  });

  it('selectLane() returns a valid lane (1, 2, or 3)', () => {
    const strategy = new IntelligentLaneStrategy();
    const vehicle = createMockVehicle('v1', 'NORTH', 2, 30, 70);

    const lane = strategy.selectLane(vehicle, []);
    expect([1, 2, 3]).toContain(lane);
  });

  it('selectLane() returns current lane when vehicle is far from intersection (>50m)', () => {
    const strategy = new IntelligentLaneStrategy();
    // Vehicle 60m away (beyond 50m pre-positioning threshold)
    const vehicle = createMockVehicle('v1', 'NORTH', 1, 30, 60);

    const lane = strategy.selectLane(vehicle, []);
    // Should stay in lane 1 (current lane) because too far away
    expect(lane).toBe(1);
  });

  it('selectLane() returns current lane when vehicle is too fast (>20 km/h)', () => {
    const strategy = new IntelligentLaneStrategy();
    // Vehicle 40m away (within pre-positioning zone) but too fast (50 km/h)
    const vehicle = createMockVehicle('v1', 'NORTH', 1, 50, 40);

    const lane = strategy.selectLane(vehicle, []);
    // Should stay in lane 1 (current lane) because too fast to safely change
    expect(lane).toBe(1);
  });

  it('selectLane() returns current lane if target lane is occupied (collision avoidance)', () => {
    const strategy = new IntelligentLaneStrategy();
    const vehicle = createMockVehicle('v1', 'NORTH', 1, 15, 40); // In lane 1, slow speed, close to intersection

    // Another vehicle occupying lane 2 (target lane), only 5m away
    const blockingVehicle = createMockVehicle('v2', 'NORTH', 2, 20, 35);

    const lane = strategy.selectLane(vehicle, [blockingVehicle]);
    // Should stay in lane 1 (current lane) because no safe change to lane 2
    expect(lane).toBe(1);
  });

  it('selectLane() returns lane 2 (optimal lane) when all conditions allow', () => {
    const strategy = new IntelligentLaneStrategy();
    // Vehicle in lane 1, within 50m, slow speed (15 km/h), target lane empty
    const vehicle = createMockVehicle('v1', 'NORTH', 1, 15, 40);

    const lane = strategy.selectLane(vehicle, []);
    // Should prefer lane 2 (optimal) when conditions allow
    expect(lane).toBe(2);
  });

  it('selectLane() allows lane change when safe distance (>10m) is available', () => {
    const strategy = new IntelligentLaneStrategy();
    // Vehicle in lane 1, ready to change
    const vehicle = createMockVehicle('v1', 'NORTH', 1, 15, 40);

    // Another vehicle in target lane, but 15m away (safe)
    const safeVehicle = createMockVehicle('v2', 'NORTH', 2, 20, 25); // 15m ahead

    const lane = strategy.selectLane(vehicle, [safeVehicle]);
    // Should allow change to lane 2 (sufficient distance)
    expect(lane).toBe(2);
  });

  it('selectLane() prevents lane change when distance is insufficient (<10m)', () => {
    const strategy = new IntelligentLaneStrategy();
    // Vehicle in lane 1, ready to change
    const vehicle = createMockVehicle('v1', 'NORTH', 1, 15, 40);

    // Another vehicle in target lane, only 5m away (too close)
    const closeVehicle = createMockVehicle('v2', 'NORTH', 2, 20, 45); // 5m away

    const lane = strategy.selectLane(vehicle, [closeVehicle]);
    // Should stay in lane 1 (insufficient distance)
    expect(lane).toBe(1);
  });

  it('gracefully handles empty traffic state', () => {
    const strategy = new IntelligentLaneStrategy();
    const vehicle = createMockVehicle('v1', 'NORTH', 1, 15, 40);

    const lane = strategy.selectLane(vehicle, []);
    // Should not throw; should return valid lane
    expect([1, 2, 3]).toContain(lane);
  });

  it('behavioral test: consistent lane selection over multiple calls', () => {
    const strategy = new IntelligentLaneStrategy();
    const vehicle = createMockVehicle('v1', 'NORTH', 1, 15, 40);

    // Call selectLane() multiple times with same vehicle and empty traffic
    const lanes = new Set<1 | 2 | 3>();
    for (let i = 0; i < 10; i++) {
      lanes.add(strategy.selectLane(vehicle, []));
    }

    // All calls should return same lane (deterministic optimal choice)
    expect(lanes.size).toBe(1); // Only one unique lane returned
  });

  it('handles multiple vehicles in various lanes', () => {
    const strategy = new IntelligentLaneStrategy();
    const vehicle = createMockVehicle('v1', 'NORTH', 1, 15, 40);

    // Traffic: other vehicles in lanes 1, 2, 3
    const trafficState = [
      createMockVehicle('v2', 'NORTH', 1, 30, 30), // Lane 1, 10m away
      createMockVehicle('v3', 'NORTH', 2, 30, 20), // Lane 2, 20m away
      createMockVehicle('v4', 'NORTH', 3, 30, 10) // Lane 3, 30m away
    ];

    const lane = strategy.selectLane(vehicle, trafficState);
    // Should be able to decide on a lane despite multiple vehicles
    expect([1, 2, 3]).toContain(lane);
  });

  it('stays in current lane when already in optimal lane', () => {
    const strategy = new IntelligentLaneStrategy();
    // Vehicle already in lane 2 (optimal)
    const vehicle = createMockVehicle('v1', 'NORTH', 2, 15, 40);

    const lane = strategy.selectLane(vehicle, []);
    // Should stay in lane 2
    expect(lane).toBe(2);
  });
});
