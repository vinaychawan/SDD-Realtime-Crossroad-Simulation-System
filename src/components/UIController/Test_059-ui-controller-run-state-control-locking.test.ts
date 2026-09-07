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

describe('TASK-059 UIController run-state locking', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
  });

  it('cycles Configure → Run → Pause → Run → Reset with expected control availability', () => {
    const orchestrator = createOrchestrator();
    const controller = new UIController();
    controller.bind(new ConfigurationManager(), orchestrator);

    const play = select<HTMLButtonElement>('[data-ui-control="play"]');
    const pause = select<HTMLButtonElement>('[data-ui-control="pause"]');
    const reset = select<HTMLButtonElement>('[data-ui-control="reset"]');
    const strict = select<HTMLInputElement>('input[name="signalCoordinationMode"][value="STRICT_MUTUAL_EXCLUSION"]');
    const random = select<HTMLInputElement>('input[name="laneSelectionStrategy"][value="RANDOM"]');
    const spawn = select<HTMLInputElement>('[data-ui-control="traffic-NORTH-spawn"]');

    expect(play.disabled).toBe(false);
    expect(pause.disabled).toBe(true);
    expect(reset.disabled).toBe(false);
    expect(strict.disabled).toBe(false);
    expect(random.disabled).toBe(false);
    expect(spawn.disabled).toBe(false);

    play.click();
    expect(play.disabled).toBe(true);
    expect(pause.disabled).toBe(false);
    expect(strict.disabled).toBe(true);
    expect(random.disabled).toBe(true);
    expect(spawn.disabled).toBe(false);

    pause.click();
    expect(play.disabled).toBe(false);
    expect(pause.disabled).toBe(true);
    expect(strict.disabled).toBe(false);
    expect(random.disabled).toBe(false);

    play.click();
    expect(strict.disabled).toBe(true);
    expect(random.disabled).toBe(true);

    reset.click();
    expect(play.disabled).toBe(false);
    expect(pause.disabled).toBe(true);
    expect(strict.disabled).toBe(false);
    expect(random.disabled).toBe(false);
  });
});
