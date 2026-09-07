// Covers TASK-013 acceptance criteria only. See tasks/Tasks_013-simulation-orchestrator-fixed-timestep-loop.md
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SimulationOrchestrator, MAX_CATCHUP_TICKS_PER_FRAME } from './SimulationOrchestrator';
import { ConfigurationManager } from '../ConfigurationManager/ConfigurationManager';
import { PhysicsEngine } from '../PhysicsEngine/PhysicsEngine';
import { PHYSICS_TICK_MS } from '../PhysicsEngine/physics-engine.interface';

function makeOrchestrator(): SimulationOrchestrator {
  return new SimulationOrchestrator({
    physicsEngine: new PhysicsEngine(),
    configManager: new ConfigurationManager()
  });
}

describe('TASK-013: Simulation Orchestrator — fixed-timestep accumulator loop', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('ticks physics with an exact 10ms deltaMs every step, regardless of wall-clock frame timing', () => {
    const deltas: number[] = [];
    const orchestrator = makeOrchestrator();
    orchestrator.onPhysicsTick((deltaMs) => deltas.push(deltaMs));
    orchestrator.setTargetFrameRate(60); // 17ms render interval — not an even multiple of 10ms
    orchestrator.start();

    vi.advanceTimersByTime(1000);
    orchestrator.reset();

    expect(deltas.length).toBeGreaterThan(0);
    expect(deltas.every((d) => d === PHYSICS_TICK_MS)).toBe(true);
  });

  it('caps catch-up ticks at 5 per frame and logs a warning when the cap is reached', () => {
    const orchestrator = makeOrchestrator();
    let tickCountThisFrame = 0;
    orchestrator.onPhysicsTick(() => tickCountThisFrame++);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    orchestrator.setTargetFrameRate(60);
    orchestrator.start();

    // Simulate a large lag (e.g. tab backgrounded) before the next scheduled frame fires: jump
    // the fake clock itself forward well beyond what MAX_CATCHUP_TICKS_PER_FRAME can drain in
    // one frame, then advance just enough to trigger the now-overdue scheduled callback.
    vi.setSystemTime(Date.now() + 1000);
    vi.advanceTimersByTime(17);

    expect(tickCountThisFrame).toBeLessThanOrEqual(MAX_CATCHUP_TICKS_PER_FRAME);
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
    orchestrator.reset();
  });

  it('never drops a tick: surplus time beyond the catch-up cap is carried over to later frames', () => {
    const orchestrator = makeOrchestrator();
    let tickCount = 0;
    orchestrator.onPhysicsTick(() => tickCount++);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    orchestrator.setTargetFrameRate(60);
    orchestrator.start();

    vi.setSystemTime(Date.now() + 1000);
    vi.advanceTimersByTime(17); // fires the now-overdue scheduled callback with a huge elapsed gap
    const tickCountAfterFirstFrame = tickCount;

    // Subsequent normal frames continue draining the carried-over backlog rather than losing it.
    vi.advanceTimersByTime(17);
    expect(tickCount).toBeGreaterThan(tickCountAfterFirstFrame);

    orchestrator.reset();
  });

  it('getPhysicsTickRate() reports 98-102 Hz under normal load over a simulated 30 seconds', () => {
    const orchestrator = makeOrchestrator();
    orchestrator.setTargetFrameRate(60);
    orchestrator.start();

    vi.advanceTimersByTime(30_000);
    const rate = orchestrator.getPhysicsTickRate();

    orchestrator.reset();

    expect(rate).toBeGreaterThanOrEqual(98);
    expect(rate).toBeLessThanOrEqual(102);
  });
});
