// Error taxonomy (TASK-003, cross-cutting). See docs/INTERFACES.md §11.

export abstract class DomainError extends Error {
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Raised by Configuration Manager when a parameter is outside its documented range. */
export class InvalidConfigurationError extends DomainError {
  readonly code = 'INVALID_CONFIGURATION';

  constructor(
    public readonly field: string,
    public readonly value: unknown,
    message = `Invalid value for "${String(field)}": ${JSON.stringify(value)}`
  ) {
    super(message);
  }
}

/** Raised by Configuration Manager when a startup-only field is changed after start(). */
export class StartupOnlyFieldError extends DomainError {
  readonly code = 'STARTUP_ONLY_FIELD';

  constructor(
    public readonly field: string,
    message = `Field "${String(field)}" can only be changed before the simulation starts`
  ) {
    super(message);
  }
}

/** Raised by Vehicle Manager when the entry queue is full for a direction. */
export class SpawnCapacityExceededError extends DomainError {
  readonly code = 'SPAWN_CAPACITY_EXCEEDED';

  constructor(
    public readonly direction: string,
    message = `Spawn capacity exceeded for direction "${String(direction)}"`
  ) {
    super(message);
  }
}
