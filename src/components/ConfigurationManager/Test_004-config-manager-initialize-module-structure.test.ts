// Covers TASK-004 acceptance criteria only. See tasks/Tasks_004-config-manager-initialize-module-structure.md
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { ConfigurationManager } from './ConfigurationManager';

const moduleDir = path.dirname(fileURLToPath(import.meta.url));

describe('TASK-004: Config Manager — module structure', () => {
  it('constructs with a fully-populated NORMAL_TRAFFIC config by default', () => {
    const manager = new ConfigurationManager();
    const snapshot = manager.getSnapshot();
    expect(snapshot.scenarioPreset).toBe('NORMAL_TRAFFIC');
    expect(snapshot.perDirection.NORTH.spawnRatePerMinute).toBe(20);
  });

  it('tracks run state via setRunState()/getRunState()', () => {
    const manager = new ConfigurationManager();
    expect(manager.getRunState()).toBe('CONFIGURATION_ACTIVE');
    manager.setRunState('RUNNING');
    expect(manager.getRunState()).toBe('RUNNING');
  });

  it('SimulationConfig snapshot exposes every field documented in INTERFACES.md §3', () => {
    const snapshot = new ConfigurationManager().getSnapshot();
    const expectedTopLevelFields = [
      'scenarioPreset',
      'targetFrameRate',
      'signalCoordinationMode',
      'laneSelectionStrategy',
      'perDirection',
      'emergency',
      'conflictZone',
      'simulationSpeedMultiplier'
    ];
    for (const field of expectedTopLevelFields) {
      expect(snapshot).toHaveProperty(field);
    }
  });

  it('README.md exists and documents the module responsibility', () => {
    const readme = readFileSync(path.join(moduleDir, 'README.md'), 'utf-8');
    expect(readme).toMatch(/Configuration Manager/);
    expect(readme).toMatch(/REQ-027/);
  });

  it('contains no `any` types in the module source files (static analysis)', () => {
    const files = [
      'ConfigurationManager.ts',
      'configuration-manager.interface.ts',
      'validation.ts',
      'scenarioPresets.ts'
    ];
    for (const file of files) {
      const source = readFileSync(path.join(moduleDir, file), 'utf-8');
      expect(source, `${file} should not contain ": any"`).not.toMatch(/:\s*any\b/);
      expect(source, `${file} should not contain "as any"`).not.toMatch(/as\s+any\b/);
    }
  });
});
