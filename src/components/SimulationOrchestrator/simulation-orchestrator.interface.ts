// Simulation Orchestrator public contract (TASK-012).
// Mirrors docs/INTERFACES.md §2 exactly.
export interface ISimulationOrchestrator {
  /** Starts the fixed-timestep loop. No-op if already running. */
  start(): void;

  /** Pauses physics ticks; rendering continues showing last state. */
  pause(): void;

  /** Stops and clears all simulation state (vehicles, signals reset). */
  reset(): void;

  /**
   * Changes target render frame rate.
   * @param fps 30 or 60 only.
   * @throws {InvalidConfigurationError} if fps is not 30 or 60.
   * @postcondition Physics tick rate remains 100 Hz ± 2 Hz regardless of fps.
   */
  setTargetFrameRate(fps: 30 | 60): void;

  /** @returns current measured physics tick rate (Hz), for REQ-028 Performance panel. */
  getPhysicsTickRate(): number;

  /** @returns current measured render frame rate (FPS), for REQ-028 Performance panel. */
  getRenderFrameRate(): number;
}
