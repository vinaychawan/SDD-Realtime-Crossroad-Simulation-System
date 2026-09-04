// Covers TASK-006 acceptance criteria only. See tasks/Tasks_006-config-manager-startup-only-field-enforcement.md
import { describe, it, expect } from 'vitest';
import { StartupOnlyFieldError } from '../../domain/errors';
import { ConfigurationManager } from './ConfigurationManager';

describe('TASK-006: Config Manager — startup-only field enforcement', () => {
  it('allows changing signalCoordinationMode and laneSelectionStrategy while CONFIGURATION_ACTIVE', () => {
    const manager = new ConfigurationManager();
    expect(() => manager.update({ signalCoordinationMode: 'OPPOSING_SIMULTANEOUS' })).not.toThrow();
    expect(() => manager.update({ laneSelectionStrategy: 'INTELLIGENT' })).not.toThrow();
  });

  it.each(['RUNNING', 'PAUSED'] as const)('rejects signalCoordinationMode changes while %s', (state) => {
    const manager = new ConfigurationManager();
    manager.setRunState(state);
    expect(() => manager.update({ signalCoordinationMode: 'OPPOSING_SIMULTANEOUS' })).toThrow(StartupOnlyFieldError);
  });

  it.each(['RUNNING', 'PAUSED'] as const)('rejects laneSelectionStrategy changes while %s', (state) => {
    const manager = new ConfigurationManager();
    manager.setRunState(state);
    expect(() => manager.update({ laneSelectionStrategy: 'INTELLIGENT' })).toThrow(StartupOnlyFieldError);
  });

  it('still allows non-startup-only fields to change while RUNNING', () => {
    const manager = new ConfigurationManager();
    manager.setRunState('RUNNING');
    expect(() => manager.update({ targetFrameRate: 30 })).not.toThrow();
  });

  it('re-allows startup-only field changes after returning to CONFIGURATION_ACTIVE', () => {
    const manager = new ConfigurationManager();
    manager.setRunState('RUNNING');
    expect(() => manager.update({ laneSelectionStrategy: 'INTELLIGENT' })).toThrow(StartupOnlyFieldError);
    manager.setRunState('CONFIGURATION_ACTIVE');
    expect(() => manager.update({ laneSelectionStrategy: 'INTELLIGENT' })).not.toThrow();
  });
});
