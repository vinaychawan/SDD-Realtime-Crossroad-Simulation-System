// Covers TASK-012 acceptance criteria only. See tasks/Tasks_012-simulation-orchestrator-initialize-module-structure.md
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { vi } from 'vitest';
import { SimulationOrchestrator } from './SimulationOrchestrator';
import type { ISimulationOrchestrator } from './simulation-orchestrator.interface';
import { ConfigurationManager } from '../ConfigurationManager/ConfigurationManager';
import { PhysicsEngine } from '../PhysicsEngine/PhysicsEngine';
import { InvalidConfigurationError } from '../../domain/errors';

const moduleDir = path.dirname(fileURLToPath(import.meta.url));

describe('TASK-012: Simulation Orchestrator — module structure', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('implements the ISimulationOrchestrator contract matching INTERFACES.md §2', () => {
    const orchestrator: ISimulationOrchestrator = new SimulationOrchestrator({
      physicsEngine: new PhysicsEngine(),
      configManager: new ConfigurationManager()
    });
    expect(typeof orchestrator.start).toBe('function');
    expect(typeof orchestrator.pause).toBe('function');
    expect(typeof orchestrator.reset).toBe('function');
    expect(typeof orchestrator.setTargetFrameRate).toBe('function');
    expect(typeof orchestrator.getPhysicsTickRate).toBe('function');
    expect(typeof orchestrator.getRenderFrameRate).toBe('function');
  });

  it('start() throws InvalidConfigurationError when no IConfigurationManager is attached', () => {
    const orchestrator = new SimulationOrchestrator({ physicsEngine: new PhysicsEngine() });
    expect(() => orchestrator.start()).toThrow(InvalidConfigurationError);
  });

  it('start() succeeds once a IConfigurationManager is attached via the constructor', () => {
    const orchestrator = new SimulationOrchestrator({
      physicsEngine: new PhysicsEngine(),
      configManager: new ConfigurationManager()
    });
    expect(() => orchestrator.start()).not.toThrow();
    orchestrator.reset();
  });

  it('start() succeeds once a IConfigurationManager is attached via setConfigurationManager()', () => {
    const orchestrator = new SimulationOrchestrator({ physicsEngine: new PhysicsEngine() });
    orchestrator.setConfigurationManager(new ConfigurationManager());
    expect(() => orchestrator.start()).not.toThrow();
    orchestrator.reset();
  });

  it('start() is a no-op if already running (does not restart or throw)', () => {
    const orchestrator = new SimulationOrchestrator({
      physicsEngine: new PhysicsEngine(),
      configManager: new ConfigurationManager()
    });
    orchestrator.start();
    expect(orchestrator.isRunning()).toBe(true);
    expect(() => orchestrator.start()).not.toThrow();
    expect(orchestrator.isRunning()).toBe(true);
    orchestrator.reset();
  });

  it('getPhysicsTickRate()/getRenderFrameRate() report 0 before any ticks or frames have occurred', () => {
    const orchestrator = new SimulationOrchestrator({
      physicsEngine: new PhysicsEngine(),
      configManager: new ConfigurationManager()
    });
    expect(orchestrator.getPhysicsTickRate()).toBe(0);
    expect(orchestrator.getRenderFrameRate()).toBe(0);
  });

  it('getPhysicsEngine() returns the shared IPhysicsEngine instance injected at construction', () => {
    const physicsEngine = new PhysicsEngine();
    const orchestrator = new SimulationOrchestrator({ physicsEngine, configManager: new ConfigurationManager() });
    expect(orchestrator.getPhysicsEngine()).toBe(physicsEngine);
  });

  it('getTargetFrameRate() reflects the configured target frame rate (default 60)', () => {
    const orchestrator = new SimulationOrchestrator({
      physicsEngine: new PhysicsEngine(),
      configManager: new ConfigurationManager()
    });
    expect(orchestrator.getTargetFrameRate()).toBe(60);
    orchestrator.setTargetFrameRate(30);
    expect(orchestrator.getTargetFrameRate()).toBe(30);
  });

  it('README.md documents the 100 Hz invariant and the never-skip-a-tick contract', () => {
    const readme = readFileSync(path.join(moduleDir, 'README.md'), 'utf-8');
    expect(readme).toMatch(/100 Hz/);
    expect(readme).toMatch(/never skip a tick/i);
  });

  it('contains no `any` types in the module source files (static analysis)', () => {
    const files = ['SimulationOrchestrator.ts', 'simulation-orchestrator.interface.ts'];
    for (const file of files) {
      const source = readFileSync(path.join(moduleDir, file), 'utf-8');
      expect(source, `${file} should not contain ": any"`).not.toMatch(/:\s*any\b/);
      expect(source, `${file} should not contain "as any"`).not.toMatch(/as\s+any\b/);
    }
  });
});
