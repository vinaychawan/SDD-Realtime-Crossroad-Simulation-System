import { beforeEach, describe, expect, it } from 'vitest';
import type { Direction, SignalDirectionState } from '../../domain/types';
import { StateDisplayPanels } from './StateDisplayPanels';

function signal(direction: Direction, state: SignalDirectionState['state'], secondsRemaining: number): SignalDirectionState {
  return { direction, state, secondsRemaining };
}

function text(key: string): string {
  const element = document.querySelector(`[data-state-value="${key}"]`);
  if (!element) throw new Error(`missing ${key}`);
  return element.textContent ?? '';
}

describe('TASK-062 State Display signal status panel', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="state"></div>';
  });

  it('displays all four directions with color indicators and ±1 second rounded timing', () => {
    const panels = new StateDisplayPanels('state');
    panels.updateSignalStatus({
      NORTH: signal('NORTH', 'GREEN', 24.6),
      SOUTH: signal('SOUTH', 'RED', 45.4),
      EAST: signal('EAST', 'AMBER', 2.49),
      WEST: signal('WEST', 'RED', 0.4)
    });

    expect(text('signal-NORTH-state')).toBe('Green');
    expect(text('signal-NORTH-time')).toBe('25 sec');
    expect(text('signal-SOUTH-time')).toBe('45 sec');
    expect(text('signal-EAST-time')).toBe('2 sec');
    expect(text('signal-WEST-time')).toBe('0 sec');

    expect(document.querySelector('[data-state-signal-row="NORTH"]')?.classList.contains('state-display-signal--green')).toBe(true);
    expect(document.querySelector('[data-state-signal-row="EAST"]')?.classList.contains('state-display-signal--amber')).toBe(true);
    expect(document.querySelector('[data-state-signal-indicator="WEST"]')?.getAttribute('aria-label')).toBe('WEST RED');
  });
});
