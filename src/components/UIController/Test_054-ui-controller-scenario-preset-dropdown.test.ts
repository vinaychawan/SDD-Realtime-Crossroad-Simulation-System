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

describe('TASK-054 UIController scenario preset dropdown', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
  });

  it('lists all five scenario presets', () => {
    const controller = new UIController();
    controller.bind(new ConfigurationManager(), createOrchestrator());

    const options = Array.from(select<HTMLSelectElement>('[data-ui-control="scenarioPreset"]').options).map(o => o.value);
    expect(options).toEqual(['NORMAL_TRAFFIC', 'CONGESTION_TEST', 'SPARSE_TRAFFIC', 'PRIORITY_OPERATIONS', 'CUSTOM']);
  });

  it('applies selected preset and updates dependent controls within the same input turn', () => {
    const manager = new ConfigurationManager();
    const applyScenarioPreset = vi.spyOn(manager, 'applyScenarioPreset');
    const controller = new UIController();
    controller.bind(manager, createOrchestrator());

    const dropdown = select<HTMLSelectElement>('[data-ui-control="scenarioPreset"]');
    dropdown.value = 'CONGESTION_TEST';
    dropdown.dispatchEvent(new Event('change', { bubbles: true }));

    expect(applyScenarioPreset).toHaveBeenCalledWith('CONGESTION_TEST');
    expect(manager.getSnapshot().scenarioPreset).toBe('CONGESTION_TEST');
    expect(select<HTMLInputElement>('input[name="targetFrameRate"][value="30"]').checked).toBe(true);
    expect(select<HTMLInputElement>('input[name="signalCoordinationMode"][value="OPPOSING_SIMULTANEOUS"]').checked).toBe(true);
    expect(select<HTMLInputElement>('input[name="laneSelectionStrategy"][value="INTELLIGENT"]').checked).toBe(true);
    expect(select<HTMLInputElement>('[data-ui-control="traffic-NORTH-spawn"]').value).toBe('60');
  });
});
