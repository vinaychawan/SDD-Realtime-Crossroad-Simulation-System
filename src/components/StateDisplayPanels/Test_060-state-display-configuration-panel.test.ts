import { beforeEach, describe, expect, it } from 'vitest';
import { ConfigurationManager } from '../ConfigurationManager/ConfigurationManager';
import { StateDisplayPanels } from './StateDisplayPanels';
import { StateDisplayPanels as ExportedStateDisplayPanels } from './index';

function text(key: string): string {
  const element = document.querySelector(`[data-state-value="${key}"]`);
  if (!element) throw new Error(`missing ${key}`);
  return element.textContent ?? '';
}

describe('TASK-060 State Display configuration panel', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="state"></div>';
  });

  it('creates the state display module and configuration panel scaffold', () => {
    const panels = new StateDisplayPanels('state');
    expect(panels.updateConfiguration).toBeTypeOf('function');
    expect(new ExportedStateDisplayPanels('state')).toBeInstanceOf(StateDisplayPanels);
    expect(new StateDisplayPanels(document.getElementById('state')!)).toBeInstanceOf(StateDisplayPanels);
    expect(document.querySelector('[data-state-panel="configuration"]')).not.toBeNull();
  });

  it('displays active configuration and updates from ConfigurationManager onChange events', () => {
    const configManager = new ConfigurationManager();
    const panels = new StateDisplayPanels('state');
    configManager.onChange(config => panels.updateConfiguration(config));
    panels.updateConfiguration(configManager.getSnapshot());

    expect(text('config-scenario')).toBe('Normal Traffic');
    expect(text('config-frame-rate')).toBe('60 FPS');
    expect(text('config-signal-mode')).toBe('Strict Mutual Exclusion');
    expect(text('config-lane-strategy')).toBe('Random');

    configManager.update({
      targetFrameRate: 30,
      signalCoordinationMode: 'OPPOSING_SIMULTANEOUS',
      laneSelectionStrategy: 'INTELLIGENT'
    });

    expect(text('config-frame-rate')).toBe('30 FPS');
    expect(text('config-signal-mode')).toBe('Opposing Simultaneous');
    expect(text('config-lane-strategy')).toBe('Intelligent');
  });

  it('reports missing root and internal scaffold errors', () => {
    expect(() => new StateDisplayPanels('missing-root')).toThrow('StateDisplayPanels root element not found');

    const panels = new StateDisplayPanels('state') as unknown as { updateConfiguration(config: ReturnType<ConfigurationManager['getSnapshot']>): void };
    document.querySelector('[data-state-value="config-scenario"]')?.remove();
    expect(() => panels.updateConfiguration(new ConfigurationManager().getSnapshot())).toThrow('Missing StateDisplayPanels element');
  });
});
