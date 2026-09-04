// Covers TASK-010 acceptance criteria only. See tasks/Tasks_010-physics-engine-initialize-module-structure.md
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { PhysicsEngine } from './PhysicsEngine';
import { PHYSICS_TICK_MS, type IPhysicsEngine } from './physics-engine.interface';

const moduleDir = path.dirname(fileURLToPath(import.meta.url));

describe('TASK-010: Physics Engine — module structure', () => {
  it('exposes PHYSICS_TICK_MS as the 100 Hz invariant (10ms)', () => {
    expect(PHYSICS_TICK_MS).toBe(10);
  });

  it('PhysicsEngine implements the IPhysicsEngine tick(vehicle, deltaMs) contract', () => {
    const engine: IPhysicsEngine = new PhysicsEngine();
    expect(typeof engine.tick).toBe('function');
  });

  it('README.md documents the 100 Hz invariant and the never-skip-a-tick contract', () => {
    const readme = readFileSync(path.join(moduleDir, 'README.md'), 'utf-8');
    expect(readme).toMatch(/100 Hz/);
    expect(readme).toMatch(/never skip a tick/i);
  });

  it('contains no `any` types in the module source files (static analysis)', () => {
    const files = ['PhysicsEngine.ts', 'physics-engine.interface.ts'];
    for (const file of files) {
      const source = readFileSync(path.join(moduleDir, file), 'utf-8');
      expect(source, `${file} should not contain ": any"`).not.toMatch(/:\s*any\b/);
      expect(source, `${file} should not contain "as any"`).not.toMatch(/as\s+any\b/);
    }
  });
});
