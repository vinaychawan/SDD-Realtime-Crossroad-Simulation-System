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

describe('TASK-058 UIController playback controls', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
  });

  it('wires play, pause, and reset buttons to the orchestrator', () => {
    const orchestrator = createOrchestrator();
    const controller = new UIController();
    controller.bind(new ConfigurationManager(), orchestrator);

    select<HTMLButtonElement>('[data-ui-control="play"]').click();
    expect(orchestrator.start).toHaveBeenCalledTimes(1);
    expect(select<HTMLButtonElement>('[data-ui-control="play"]').disabled).toBe(true);
    expect(select<HTMLButtonElement>('[data-ui-control="pause"]').disabled).toBe(false);

    select<HTMLButtonElement>('[data-ui-control="pause"]').click();
    expect(orchestrator.pause).toHaveBeenCalledTimes(1);
    expect(select<HTMLButtonElement>('[data-ui-control="play"]').disabled).toBe(false);

    select<HTMLButtonElement>('[data-ui-control="reset"]').click();
    expect(orchestrator.reset).toHaveBeenCalledTimes(1);
    expect(select<HTMLButtonElement>('[data-ui-control="reset"]').disabled).toBe(false);
  });

  it('invokes the reset integration callback after orchestrator reset', () => {
    const orchestrator = createOrchestrator();
    const onReset = vi.fn();
    const controller = new UIController();
    controller.bind(new ConfigurationManager(), orchestrator, undefined, onReset);

    select<HTMLButtonElement>('[data-ui-control="reset"]').click();

    expect(orchestrator.reset).toHaveBeenCalledTimes(1);
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('updates simulation speed multiplier dropdown', () => {
    const manager = new ConfigurationManager();
    const controller = new UIController();
    controller.bind(manager, createOrchestrator());

    const speed = select<HTMLSelectElement>('[data-ui-control="simulationSpeedMultiplier"]');
    speed.value = '4';
    speed.dispatchEvent(new Event('change', { bubbles: true }));

    expect(manager.getSnapshot().simulationSpeedMultiplier).toBe(4);
  });
});
