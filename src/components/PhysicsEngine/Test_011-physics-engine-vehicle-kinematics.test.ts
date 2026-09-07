// Covers TASK-011 acceptance criteria only. See tasks/Tasks_011-physics-engine-vehicle-kinematics.md
import { describe, it, expect } from 'vitest';
import { PhysicsEngine } from './PhysicsEngine';
import { PHYSICS_TICK_MS } from './physics-engine.interface';
import type { VehicleState } from '../../domain/types';

function makeVehicle(overrides: Partial<VehicleState> = {}): VehicleState {
  return {
    id: 'v-1',
    direction: 'NORTH',
    exitDirection: 'SOUTH',
    lane: 1,
    position: { x: 0, y: 100 },
    speedKmh: 0,
    speedMs: 10,
    isEmergency: false,
    yieldingActive: false,
    ...overrides
  };
}

describe('TASK-011: Physics Engine — vehicle kinematics update', () => {
  it('advances position deterministically by speedMs * (deltaMs / 1000) along the direction of travel', () => {
    const engine = new PhysicsEngine();
    const vehicle = makeVehicle({ direction: 'NORTH', position: { x: 0, y: 100 }, speedMs: 10 });
    const next = engine.tick(vehicle, PHYSICS_TICK_MS);
    // NORTH-origin vehicles spawn south of the intersection and travel toward +y.
    expect(next.position).toEqual({ x: 0, y: 100.1 });
  });

  it.each([
    ['NORTH', { x: 0, y: 1 }],
    ['SOUTH', { x: 0, y: -1 }],
    ['EAST', { x: 1, y: 0 }],
    ['WEST', { x: -1, y: 0 }]
  ] as const)('moves a %s-origin vehicle along its documented travel vector', (direction, unit) => {
    const engine = new PhysicsEngine();
    const vehicle = makeVehicle({ direction, position: { x: 0, y: 0 }, speedMs: 20 });
    const next = engine.tick(vehicle, PHYSICS_TICK_MS);
    expect(next.position.x).toBeCloseTo(unit.x * 20 * 0.01);
    expect(next.position.y).toBeCloseTo(unit.y * 20 * 0.01);
  });

  it('re-derives speedKmh from speedMs on every tick (NF-001 unit consistency)', () => {
    const engine = new PhysicsEngine();
    const vehicle = makeVehicle({ speedMs: 15, speedKmh: 0 });
    const next = engine.tick(vehicle, PHYSICS_TICK_MS);
    expect(next.speedKmh).toBeCloseTo(54); // 15 m/s * 3.6
  });

  it('rejects a non-fixed timestep (never varies the 100 Hz tick)', () => {
    const engine = new PhysicsEngine();
    const vehicle = makeVehicle();
    expect(() => engine.tick(vehicle, 16)).toThrow(RangeError);
  });

  it('is a pure function: does not mutate the input vehicle object', () => {
    const engine = new PhysicsEngine();
    const vehicle = makeVehicle();
    const before = JSON.stringify(vehicle);
    engine.tick(vehicle, PHYSICS_TICK_MS);
    expect(JSON.stringify(vehicle)).toBe(before);
  });

  it('determinism: an identical 1000-tick input sequence produces byte-identical output on repeated runs', () => {
    const runOnce = (): VehicleState => {
      const engine = new PhysicsEngine();
      let vehicle = makeVehicle({ direction: 'EAST', position: { x: 500, y: 0 }, speedMs: 13.7 });
      for (let i = 0; i < 1000; i++) {
        vehicle = engine.tick(vehicle, PHYSICS_TICK_MS);
      }
      return vehicle;
    };

    const runA = JSON.stringify(runOnce());
    const runB = JSON.stringify(runOnce());
    expect(runA).toBe(runB);
  });
});
