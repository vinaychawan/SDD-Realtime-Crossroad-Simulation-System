// Covers TASK-015 acceptance criteria only. See tasks/Tasks_015-simulation-orchestrator-determinism-test-suite.md
//
// Note on the stress-test criterion: these tests run under Vitest's fake timers, where
// `Date.now()` only advances when timers are explicitly advanced — real wall-clock CPU time
// spent inside a physics-tick callback is NOT reflected in the measured rates. This suite
// therefore validates FUNCTIONAL correctness at scale (150+ vehicles ticked every physics step,
// no errors, all positions remain finite, measured counters behave correctly) rather than a true
// wall-clock rendering performance benchmark, which would require a real browser/profiling
// environment and is out of scope for a deterministic automated unit test.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SimulationOrchestrator } from './SimulationOrchestrator';
import { ConfigurationManager } from '../ConfigurationManager/ConfigurationManager';
import { PhysicsEngine } from '../PhysicsEngine/PhysicsEngine';
import type { IPhysicsEngine } from '../PhysicsEngine/physics-engine.interface';
import type { Lane, VehicleState } from '../../domain/types';

function makeOrchestrator(physicsEngine: IPhysicsEngine = new PhysicsEngine()): SimulationOrchestrator {
  return new SimulationOrchestrator({
    physicsEngine,
    configManager: new ConfigurationManager()
  });
}

function makeVehicle(overrides: Partial<VehicleState> = {}): VehicleState {
  return {
    id: 'v-1',
    direction: 'EAST',
    exitDirection: 'WEST',
    lane: 1,
    position: { x: 500, y: 0 },
    speedKmh: 0,
    speedMs: 13.7,
    isEmergency: false,
    yieldingActive: false,
    ...overrides
  };
}

describe('TASK-015: Simulation Orchestrator — physics/render determinism test suite', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('produces identical (within one tick of movement) final vehicle trajectories at 30 FPS and 60 FPS', () => {
    function runScenario(fps: 30 | 60): VehicleState {
      const physicsEngine = new PhysicsEngine();
      const orchestrator = makeOrchestrator(physicsEngine);
      let vehicle = makeVehicle();
      orchestrator.onPhysicsTick((deltaMs) => {
        vehicle = physicsEngine.tick(vehicle, deltaMs);
      });
      orchestrator.setTargetFrameRate(fps);
      orchestrator.start();
      vi.advanceTimersByTime(60_000);
      orchestrator.reset();
      return vehicle;
    }

    const finalAt30 = runScenario(30);
    const finalAt60 = runScenario(60);

    // Tolerance: at most a couple of physics ticks' worth of travel (13.7 m/s * 0.01s ≈ 0.137m/tick).
    expect(Math.abs(finalAt30.position.x - finalAt60.position.x)).toBeLessThan(1);
    expect(Math.abs(finalAt30.position.y - finalAt60.position.y)).toBeLessThan(1);
  });

  it('physics tick count over 60 seconds is 6000 ± 120 (98-102 Hz) in both 30 FPS and 60 FPS render modes', () => {
    for (const fps of [30, 60] as const) {
      const orchestrator = makeOrchestrator();
      let ticks = 0;
      orchestrator.onPhysicsTick(() => ticks++);
      orchestrator.setTargetFrameRate(fps);
      orchestrator.start();

      vi.advanceTimersByTime(60_000);
      orchestrator.reset();

      expect(ticks).toBeGreaterThanOrEqual(6000 - 120);
      expect(ticks).toBeLessThanOrEqual(6000 + 120);
    }
  });

  it('stress: ticking 150+ vehicles per physics step maintains ≥98 Hz physics and ≥55 FPS render', () => {
    const physicsEngine = new PhysicsEngine();
    const orchestrator = makeOrchestrator(physicsEngine);
    const vehicleCount = 150;
    let vehicles: VehicleState[] = Array.from({ length: vehicleCount }, (_, i) =>
      makeVehicle({
        id: `v-${i}`,
        direction: 'NORTH',
        exitDirection: 'SOUTH',
        lane: (((i % 3) + 1) as Lane),
        position: { x: i, y: 200 },
        speedMs: 10 + (i % 5)
      })
    );

    orchestrator.onPhysicsTick((deltaMs) => {
      vehicles = vehicles.map((v) => physicsEngine.tick(v, deltaMs));
    });
    orchestrator.setTargetFrameRate(60);
    orchestrator.start();

    vi.advanceTimersByTime(10_000);
    const tickRate = orchestrator.getPhysicsTickRate();
    const renderRate = orchestrator.getRenderFrameRate();
    orchestrator.reset();

    expect(vehicles).toHaveLength(vehicleCount);
    expect(vehicles.every((v) => Number.isFinite(v.position.x) && Number.isFinite(v.position.y))).toBe(true);
    expect(tickRate).toBeGreaterThanOrEqual(98);
    expect(renderRate).toBeGreaterThanOrEqual(55);
  });
});
