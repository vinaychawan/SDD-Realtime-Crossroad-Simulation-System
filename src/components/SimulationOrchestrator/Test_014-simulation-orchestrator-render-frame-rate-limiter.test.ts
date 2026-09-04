// Covers TASK-014 acceptance criteria only. See tasks/Tasks_014-simulation-orchestrator-render-frame-rate-limiter.md
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SimulationOrchestrator } from './SimulationOrchestrator';
import { ConfigurationManager } from '../ConfigurationManager/ConfigurationManager';
import { PhysicsEngine } from '../PhysicsEngine/PhysicsEngine';
import { InvalidConfigurationError } from '../../domain/errors';

function makeOrchestrator(): SimulationOrchestrator {
  return new SimulationOrchestrator({
    physicsEngine: new PhysicsEngine(),
    configManager: new ConfigurationManager()
  });
}

describe('TASK-014: Simulation Orchestrator — render frame-rate limiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('gates render callbacks to 60 FPS within the documented ±2ms tolerance', () => {
    const orchestrator = makeOrchestrator();
    const timestamps: number[] = [];
    orchestrator.onRenderFrame(() => timestamps.push(Date.now()));
    orchestrator.setTargetFrameRate(60);
    orchestrator.start();

    vi.advanceTimersByTime(200);
    orchestrator.reset();

    const nominal = 1000 / 60;
    const intervals = timestamps.slice(1).map((t, i) => t - timestamps[i]);
    expect(intervals.length).toBeGreaterThan(0);
    for (const interval of intervals) {
      expect(Math.abs(interval - nominal)).toBeLessThanOrEqual(2);
    }
  });

  it('gates render callbacks to 30 FPS within the documented ±3ms tolerance', () => {
    const orchestrator = makeOrchestrator();
    const timestamps: number[] = [];
    orchestrator.onRenderFrame(() => timestamps.push(Date.now()));
    orchestrator.setTargetFrameRate(30);
    orchestrator.start();

    vi.advanceTimersByTime(300);
    orchestrator.reset();

    const nominal = 1000 / 30;
    const intervals = timestamps.slice(1).map((t, i) => t - timestamps[i]);
    expect(intervals.length).toBeGreaterThan(0);
    for (const interval of intervals) {
      expect(Math.abs(interval - nominal)).toBeLessThanOrEqual(3);
    }
  });

  it('throws InvalidConfigurationError for an unsupported frame rate (e.g. 45)', () => {
    const orchestrator = makeOrchestrator();
    expect(() => orchestrator.setTargetFrameRate(45 as 30 | 60)).toThrow(InvalidConfigurationError);
  });

  it('applies a runtime frame-rate change within one frame (no stale-interval delay)', () => {
    const orchestrator = makeOrchestrator();
    const timestamps: number[] = [];
    orchestrator.onRenderFrame(() => timestamps.push(Date.now()));
    orchestrator.setTargetFrameRate(60);
    orchestrator.start();

    vi.advanceTimersByTime(50); // let a few 60 FPS frames fire

    const switchTime = Date.now();
    orchestrator.setTargetFrameRate(30);
    vi.advanceTimersByTime(35); // just over one new-interval (33ms) period

    orchestrator.reset();

    const framesAfterSwitch = timestamps.filter((t) => t > switchTime);
    expect(framesAfterSwitch.length).toBeGreaterThanOrEqual(1);
    expect(framesAfterSwitch[0] - switchTime).toBeLessThanOrEqual(35);
  });

  it('postcondition: physics tick rate stays ~100 Hz regardless of the selected render rate', () => {
    const orchestrator30 = makeOrchestrator();
    orchestrator30.setTargetFrameRate(30);
    orchestrator30.start();
    vi.advanceTimersByTime(10_000);
    const rate30 = orchestrator30.getPhysicsTickRate();
    orchestrator30.reset();

    const orchestrator60 = makeOrchestrator();
    orchestrator60.setTargetFrameRate(60);
    orchestrator60.start();
    vi.advanceTimersByTime(10_000);
    const rate60 = orchestrator60.getPhysicsTickRate();
    orchestrator60.reset();

    expect(rate30).toBeGreaterThanOrEqual(98);
    expect(rate30).toBeLessThanOrEqual(102);
    expect(rate60).toBeGreaterThanOrEqual(98);
    expect(rate60).toBeLessThanOrEqual(102);
  });
});
