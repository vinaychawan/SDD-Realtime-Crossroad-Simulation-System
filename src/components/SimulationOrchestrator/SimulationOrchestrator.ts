// Concrete ISimulationOrchestrator implementation (TASK-012..015).
// Implements the fixed-timestep-with-accumulator pattern decided in ADR-002.
import { InvalidConfigurationError } from '../../domain/errors';
import type { IConfigurationManager } from '../ConfigurationManager/configuration-manager.interface';
import type { IPhysicsEngine } from '../PhysicsEngine/physics-engine.interface';
import { PHYSICS_TICK_MS } from '../PhysicsEngine/physics-engine.interface';
import type { ISimulationOrchestrator } from './simulation-orchestrator.interface';

/** ADR-002: caps catch-up ticks per frame to avoid the "spiral of death" under heavy load. */
export const MAX_CATCHUP_TICKS_PER_FRAME = 5;

const VALID_FRAME_RATES = [30, 60] as const;
type ValidFrameRate = (typeof VALID_FRAME_RATES)[number];

/** Invoked once per fixed 10ms physics step while the orchestrator is running. */
export type PhysicsTickListener = (deltaMs: number) => void;

/**
 * Invoked once per scheduled render frame. `interpolationAlpha` (0..1) is the leftover
 * accumulator fraction toward the next physics tick, for the Rendering Engine (TASK-054+) to
 * interpolate between the last two physics states — display-only, never fed back into physics.
 */
export type RenderFrameListener = (interpolationAlpha: number) => void;

export interface SimulationOrchestratorDeps {
  physicsEngine: IPhysicsEngine;
  /** Optional at construction time; must be attached (here or via `setConfigurationManager`) before `start()`. */
  configManager?: IConfigurationManager;
}

/**
 * Owns the fixed-timestep loop: ticks at exactly 100 Hz (`PHYSICS_TICK_MS`), independent of the
 * render frame rate, per ADR-002 / REQ-020. Does not own the vehicle list (Vehicle Manager,
 * a later task, does) — external collaborators subscribe via `onPhysicsTick()` /
 * `onRenderFrame()` to react to each fixed step / render frame using the shared `IPhysicsEngine`
 * instance injected at construction.
 */
export class SimulationOrchestrator implements ISimulationOrchestrator {
  private readonly physicsEngine: IPhysicsEngine;
  private configManager: IConfigurationManager | undefined;

  private running = false;
  private targetFrameRate: ValidFrameRate = 60;
  private frameIntervalMs = Math.round(1000 / 60);
  private frameTimer: ReturnType<typeof setInterval> | undefined;

  private accumulatorMs = 0;
  private lastFrameTimeMs = 0;

  private physicsTickCount = 0;
  private physicsElapsedMs = 0;
  private renderFrameCount = 0;
  private renderElapsedMs = 0;

  private readonly physicsTickListeners: PhysicsTickListener[] = [];
  private readonly renderFrameListeners: RenderFrameListener[] = [];

  constructor(deps: SimulationOrchestratorDeps) {
    this.physicsEngine = deps.physicsEngine;
    this.configManager = deps.configManager;
  }

  /** Extension beyond `ISimulationOrchestrator` — attaches (or replaces) the Configuration Manager. */
  setConfigurationManager(configManager: IConfigurationManager): void {
    this.configManager = configManager;
  }

  /** Extension beyond `ISimulationOrchestrator` — the shared `IPhysicsEngine` instance ticked by this loop. */
  getPhysicsEngine(): IPhysicsEngine {
    return this.physicsEngine;
  }

  /** Extension beyond `ISimulationOrchestrator` — subscribe to each fixed 10ms physics step. */
  onPhysicsTick(listener: PhysicsTickListener): void {
    this.physicsTickListeners.push(listener);
  }

  /** Extension beyond `ISimulationOrchestrator` — subscribe to each scheduled render frame. */
  onRenderFrame(listener: RenderFrameListener): void {
    this.renderFrameListeners.push(listener);
  }

  /** Extension beyond `ISimulationOrchestrator` — true while the fixed-timestep loop is active. */
  isRunning(): boolean {
    return this.running;
  }

  /** Extension beyond `ISimulationOrchestrator` — the currently configured target render frame rate. */
  getTargetFrameRate(): ValidFrameRate {
    return this.targetFrameRate;
  }

  start(): void {
    if (!this.configManager) {
      throw new InvalidConfigurationError(
        'configManager',
        undefined,
        'SimulationOrchestrator.start(): no SimulationConfig is set — attach an IConfigurationManager ' +
          '(constructor `configManager` dep or `setConfigurationManager()`) before starting'
      );
    }
    // Defensive: confirm the attached manager actually has a resolvable snapshot. Every
    // IConfigurationManager implementation to date (ConfigurationManager, TASK-004) always has
    // one post-construction (defaults to NORMAL_TRAFFIC), but this guards any future
    // implementation that might not.
    this.configManager.getSnapshot();

    if (this.running) {
      return; // no-op if already running
    }

    this.running = true;
    this.accumulatorMs = 0;
    this.lastFrameTimeMs = Date.now();
    this.scheduleFrameTimer();
  }

  pause(): void {
    this.running = false;
    this.stopFrameTimer();
  }

  reset(): void {
    this.pause();
    this.accumulatorMs = 0;
    this.physicsTickCount = 0;
    this.physicsElapsedMs = 0;
    this.renderFrameCount = 0;
    this.renderElapsedMs = 0;
  }

  setTargetFrameRate(fps: 30 | 60): void {
    if (fps !== 30 && fps !== 60) {
      throw new InvalidConfigurationError(
        'targetFrameRate',
        fps,
        `Invalid target frame rate: ${JSON.stringify(fps)}. Must be 30 or 60.`
      );
    }

    this.targetFrameRate = fps;
    this.frameIntervalMs = Math.round(1000 / fps);

    // Postcondition: physics tick rate stays 100Hz regardless of fps (accumulator arithmetic is
    // independent of frameIntervalMs). Transition within 1 frame: restart the timer immediately
    // at the new interval rather than waiting for the old interval to elapse.
    if (this.running) {
      this.stopFrameTimer();
      this.lastFrameTimeMs = Date.now();
      this.scheduleFrameTimer();
    }
  }

  getPhysicsTickRate(): number {
    if (this.physicsElapsedMs === 0) {
      return 0;
    }
    return (this.physicsTickCount * 1000) / this.physicsElapsedMs;
  }

  getRenderFrameRate(): number {
    if (this.renderElapsedMs === 0) {
      return 0;
    }
    return (this.renderFrameCount * 1000) / this.renderElapsedMs;
  }

  private scheduleFrameTimer(): void {
    this.frameTimer = setInterval(() => this.onFrame(), this.frameIntervalMs);
  }

  private stopFrameTimer(): void {
    if (this.frameTimer !== undefined) {
      clearInterval(this.frameTimer);
      this.frameTimer = undefined;
    }
  }

  private onFrame(): void {
    const now = Date.now();
    const elapsed = now - this.lastFrameTimeMs;
    this.lastFrameTimeMs = now;

    this.accumulatorMs += elapsed;
    this.renderElapsedMs += elapsed;
    this.renderFrameCount++;

    let catchUpTicks = 0;
    while (this.accumulatorMs >= PHYSICS_TICK_MS && catchUpTicks < MAX_CATCHUP_TICKS_PER_FRAME) {
      for (const listener of this.physicsTickListeners) {
        listener(PHYSICS_TICK_MS);
      }
      this.accumulatorMs -= PHYSICS_TICK_MS;
      this.physicsTickCount++;
      this.physicsElapsedMs += PHYSICS_TICK_MS;
      catchUpTicks++;
    }

    if (catchUpTicks === MAX_CATCHUP_TICKS_PER_FRAME && this.accumulatorMs >= PHYSICS_TICK_MS) {
      // REQ-020 "never skip a tick": the surplus is NOT discarded — it remains in the
      // accumulator and is processed on subsequent frames. This log is the "logged if cap
      // reached" acceptance criterion (TASK-013) for observability under sustained overload.
      // eslint-disable-next-line no-console
      console.warn(
        `SimulationOrchestrator: catch-up tick cap (${MAX_CATCHUP_TICKS_PER_FRAME}) reached this frame; ` +
          `${this.accumulatorMs.toFixed(2)}ms carried over to the next frame (no tick dropped).`
      );
    }

    const interpolationAlpha = this.accumulatorMs / PHYSICS_TICK_MS;
    for (const listener of this.renderFrameListeners) {
      listener(interpolationAlpha);
    }
  }
}
