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

describe('TASK-055 UIController radio controls', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
  });

  it('preselects defaults on load', () => {
    const controller = new UIController();
    controller.bind(new ConfigurationManager(), createOrchestrator());

    expect(select<HTMLInputElement>('input[name="targetFrameRate"][value="60"]').checked).toBe(true);
    expect(select<HTMLInputElement>('input[name="signalCoordinationMode"][value="STRICT_MUTUAL_EXCLUSION"]').checked).toBe(true);
    expect(select<HTMLInputElement>('input[name="laneSelectionStrategy"][value="RANDOM"]').checked).toBe(true);
  });

  it('updates configuration and orchestrator frame rate from radio changes', () => {
    const manager = new ConfigurationManager();
    const orchestrator = createOrchestrator();
    const controller = new UIController();
    controller.bind(manager, orchestrator);

    const fps30 = select<HTMLInputElement>('input[name="targetFrameRate"][value="30"]');
    fps30.checked = true;
    fps30.dispatchEvent(new Event('change', { bubbles: true }));

    expect(manager.getSnapshot().targetFrameRate).toBe(30);
    expect(orchestrator.setTargetFrameRate).toHaveBeenCalledWith(30);

    const opposing = select<HTMLInputElement>('input[name="signalCoordinationMode"][value="OPPOSING_SIMULTANEOUS"]');
    opposing.checked = true;
    opposing.dispatchEvent(new Event('change', { bubbles: true }));
    expect(manager.getSnapshot().signalCoordinationMode).toBe('OPPOSING_SIMULTANEOUS');

    const intelligent = select<HTMLInputElement>('input[name="laneSelectionStrategy"][value="INTELLIGENT"]');
    intelligent.checked = true;
    intelligent.dispatchEvent(new Event('change', { bubbles: true }));
    expect(manager.getSnapshot().laneSelectionStrategy).toBe('INTELLIGENT');
  });

  it('visually locks startup-only controls while running', () => {
    const controller = new UIController();
    controller.bind(new ConfigurationManager(), createOrchestrator());

    controller.setRunState('RUNNING');
    expect(select<HTMLInputElement>('input[name="signalCoordinationMode"][value="STRICT_MUTUAL_EXCLUSION"]').disabled).toBe(true);
    expect(select<HTMLInputElement>('input[name="laneSelectionStrategy"][value="RANDOM"]').disabled).toBe(true);

    controller.setRunState('PAUSED');
    expect(select<HTMLInputElement>('input[name="signalCoordinationMode"][value="STRICT_MUTUAL_EXCLUSION"]').disabled).toBe(false);
    expect(select<HTMLInputElement>('input[name="laneSelectionStrategy"][value="RANDOM"]').disabled).toBe(false);
  });
});
