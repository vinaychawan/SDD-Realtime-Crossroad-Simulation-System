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

describe('TASK-057 UIController emergency sliders', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
  });

  it('creates independent 0-20 sliders that are hidden until emergency is enabled', () => {
    const controller = new UIController();
    controller.bind(new ConfigurationManager(), createOrchestrator());

    expect(select<HTMLElement>('[data-ui-emergency-rates]').hidden).toBe(true);
    for (const type of ['AMBULANCE', 'POLICE', 'FIRE_BRIGADE']) {
      const slider = select<HTMLInputElement>(`[data-ui-control="emergency-${type}"]`);
      expect([slider.min, slider.max]).toEqual(['0', '20']);
    }
  });

  it('updates emergency enablement and per-type rates independently', () => {
    const manager = new ConfigurationManager();
    const controller = new UIController();
    controller.bind(manager, createOrchestrator());

    const enabled = select<HTMLInputElement>('[data-ui-control="emergency-enabled"]');
    enabled.checked = true;
    enabled.dispatchEvent(new Event('change', { bubbles: true }));
    expect(manager.getSnapshot().emergency.enabled).toBe(true);
    expect(select<HTMLElement>('[data-ui-emergency-rates]').hidden).toBe(false);

    const ambulance = select<HTMLInputElement>('[data-ui-control="emergency-AMBULANCE"]');
    ambulance.value = '7';
    ambulance.dispatchEvent(new Event('input', { bubbles: true }));

    const police = select<HTMLInputElement>('[data-ui-control="emergency-POLICE"]');
    police.value = '3';
    police.dispatchEvent(new Event('input', { bubbles: true }));

    expect(manager.getSnapshot().emergency.spawnRatePerMinute).toEqual({
      AMBULANCE: 7,
      POLICE: 3,
      FIRE_BRIGADE: 0
    });
  });
});
