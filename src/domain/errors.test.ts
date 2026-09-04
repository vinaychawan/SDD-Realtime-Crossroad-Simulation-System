import { describe, it, expect } from 'vitest';
import { InvalidConfigurationError, SpawnCapacityExceededError, StartupOnlyFieldError } from './errors';

describe('error taxonomy', () => {
  it('InvalidConfigurationError carries a machine-readable code and is an Error', () => {
    const err = new InvalidConfigurationError('spawnRatePerMinute', 999);
    expect(err).toBeInstanceOf(Error);
    expect(err.code).toBe('INVALID_CONFIGURATION');
    expect(err.field).toBe('spawnRatePerMinute');
    expect(err.message).toContain('spawnRatePerMinute');
  });

  it('StartupOnlyFieldError carries a machine-readable code and is an Error', () => {
    const err = new StartupOnlyFieldError('signalCoordinationMode');
    expect(err).toBeInstanceOf(Error);
    expect(err.code).toBe('STARTUP_ONLY_FIELD');
    expect(err.field).toBe('signalCoordinationMode');
  });

  it('SpawnCapacityExceededError carries a machine-readable code and is an Error', () => {
    const err = new SpawnCapacityExceededError('NORTH');
    expect(err).toBeInstanceOf(Error);
    expect(err.code).toBe('SPAWN_CAPACITY_EXCEEDED');
    expect(err.direction).toBe('NORTH');
  });

  it('each error type is distinguishable via instanceof', () => {
    const errors: Error[] = [
      new InvalidConfigurationError('x', 1),
      new StartupOnlyFieldError('y'),
      new SpawnCapacityExceededError('EAST')
    ];
    expect(errors[0]).toBeInstanceOf(InvalidConfigurationError);
    expect(errors[0]).not.toBeInstanceOf(StartupOnlyFieldError);
    expect(errors[1]).toBeInstanceOf(StartupOnlyFieldError);
    expect(errors[2]).toBeInstanceOf(SpawnCapacityExceededError);
  });
});
