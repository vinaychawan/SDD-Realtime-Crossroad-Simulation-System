import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfigurationManager } from '../ConfigurationManager/ConfigurationManager';
import { UIController } from './UIController';
import type { ISimulationOrchestrator } from '../SimulationOrchestrator/simulation-orchestrator.interface';

function createOrchestrator(): ISimulationOrchestrator {
  return {
    start: vi.fn(),
    pause: vi.fn(),
    reset: vi.fn(),
    setTargetFrameRate: vi.fn(),
    getPhysicsTickRate: vi.fn(() => 0),
    getRenderFrameRate: vi.fn(() => 0)
  };
}

function select<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing ${selector}`);
  return element;
}

describe('TASK-056 UIController per-direction traffic sliders', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
  });

  it('creates spawn/green/red sliders with documented ranges for all directions', () => {
    const controller = new UIController();
    controller.bind(new ConfigurationManager(), createOrchestrator());

    for (const direction of ['NORTH', 'SOUTH', 'EAST', 'WEST']) {
      const spawn = select<HTMLInputElement>(`[data-ui-control="traffic-${direction}-spawn"]`);
      const green = select<HTMLInputElement>(`[data-ui-control="traffic-${direction}-green"]`);
      const red = select<HTMLInputElement>(`[data-ui-control="traffic-${direction}-red"]`);
      expect([spawn.min, spawn.max]).toEqual(['0', '60']);
      expect([green.min, green.max]).toEqual(['10', '60']);
      expect([red.min, red.max]).toEqual(['10', '60']);
    }
  });

  it('propagates slider input to Configuration Manager immediately', () => {
    const manager = new ConfigurationManager();
    const update = vi.spyOn(manager, 'update');
    const controller = new UIController();
    controller.bind(manager, createOrchestrator());

    const westSpawn = select<HTMLInputElement>('[data-ui-control="traffic-WEST-spawn"]');
    westSpawn.value = '44';
    westSpawn.dispatchEvent(new Event('input', { bubbles: true }));

    expect(update).toHaveBeenCalled();
    expect(manager.getSnapshot().perDirection.WEST.spawnRatePerMinute).toBe(44);
    expect(select<HTMLOutputElement>('[data-ui-output="traffic-WEST-spawn"]').value).toBe('44 veh/min');
  });
});
