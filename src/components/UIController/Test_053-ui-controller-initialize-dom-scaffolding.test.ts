import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfigurationManager } from '../ConfigurationManager/ConfigurationManager';
import * as publicApi from './index';
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

describe('TASK-053 UIController DOM scaffolding', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
  });

  it('creates the module and implements the bind/setRunState interface', () => {
    const controller = new UIController();
    expect(controller.bind).toBeTypeOf('function');
    expect(controller.setRunState).toBeTypeOf('function');
    expect(publicApi.UIController).toBe(UIController);
  });

  it('scaffolds all REQ-027 control sections', () => {
    const controller = new UIController();
    controller.bind(new ConfigurationManager(), createOrchestrator());

    for (const section of ['scenario', 'startup-only', 'traffic', 'emergency', 'playback']) {
      expect(document.querySelector(`[data-ui-section="${section}"]`)).not.toBeNull();
    }

    expect(document.querySelector('[data-ui-control="scenarioPreset"]')).not.toBeNull();
    expect(document.querySelectorAll('input[name="targetFrameRate"]')).toHaveLength(2);
    expect(document.querySelectorAll('input[name="signalCoordinationMode"]')).toHaveLength(2);
    expect(document.querySelectorAll('input[name="laneSelectionStrategy"]')).toHaveLength(2);
    expect(document.querySelector('[data-ui-control="play"]')).not.toBeNull();
    expect(document.querySelector('[data-ui-control="pause"]')).not.toBeNull();
    expect(document.querySelector('[data-ui-control="reset"]')).not.toBeNull();
  });

  it('reports missing roots and internal scaffold integrity errors', () => {
    expect(() => new UIController('missing-root')).toThrow('UIController root element not found');

    const controller = new UIController();
    const internals = controller as unknown as {
      control(key: string): Element;
      requiredControl(key: string): Element;
      requiredRadio(name: string, value: string): HTMLInputElement;
      setSliderValue(key: string, value: number, unit: string): void;
    };

    expect(() => internals.control('unknown-control')).toThrow('UI control not cached');
    expect(() => internals.requiredControl('unknown-control')).toThrow('Missing UI control');
    expect(() => internals.requiredRadio('missing-radio', 'x')).toThrow('Missing UI radio');

    document.querySelector('[data-ui-output="traffic-NORTH-spawn"]')?.remove();
    internals.setSliderValue('traffic-NORTH-spawn', 11, 'veh/min');
    expect((internals.control('traffic-NORTH-spawn') as HTMLInputElement).value).toBe('11');
  });

  it('reuses an existing stylesheet on repeated construction', () => {
    new UIController();
    const stylesBefore = document.querySelectorAll('#ui-controller-styles').length;
    new UIController();
    expect(document.querySelectorAll('#ui-controller-styles')).toHaveLength(stylesBefore);
  });

  it('supports direct HTMLElement roots and ignores slider input before binding', () => {
    const root = document.getElementById('app');
    if (!root) throw new Error('missing test root');
    const controller = new UIController(root);
    const internals = controller as unknown as { bindEvents(): void };

    internals.bindEvents();
    const traffic = document.querySelector<HTMLInputElement>('[data-ui-control="traffic-NORTH-spawn"]');
    const emergency = document.querySelector<HTMLInputElement>('[data-ui-control="emergency-AMBULANCE"]');
    if (!traffic || !emergency) throw new Error('missing test sliders');

    traffic.dispatchEvent(new Event('input', { bubbles: true }));
    emergency.dispatchEvent(new Event('input', { bubbles: true }));

    expect(root.querySelector('[data-ui-section="traffic"]')).not.toBeNull();
  });

  it('can bind an optional state display panel and push initial configuration state', () => {
    const controller = new UIController();
    const configManager = new ConfigurationManager();
    const stateDisplayPanels = { updateConfiguration: vi.fn() };

    controller.bind(configManager, createOrchestrator(), stateDisplayPanels as never);
    configManager.update({ targetFrameRate: 30 });

    expect(stateDisplayPanels.updateConfiguration).toHaveBeenCalledTimes(2);
    expect(stateDisplayPanels.updateConfiguration.mock.calls[0][0].scenarioPreset).toBe('NORMAL_TRAFFIC');
    expect(stateDisplayPanels.updateConfiguration.mock.calls[1][0].targetFrameRate).toBe(30);
  });
});
