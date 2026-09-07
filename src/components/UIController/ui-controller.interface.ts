// UI Controller public contract (TASK-053).
// Mirrors docs/INTERFACES.md §10 for the browser DOM controls layer.
import type { ConfigRunState, IConfigurationManager } from '../ConfigurationManager/configuration-manager.interface';
import type { ISimulationOrchestrator } from '../SimulationOrchestrator/simulation-orchestrator.interface';

export interface IUIController {
  /** Wires scenario dropdown, radio buttons, sliders, and playback buttons to IConfigurationManager. */
  bind(configManager: IConfigurationManager, orchestrator: ISimulationOrchestrator): void;

  /**
   * Enables/disables controls based on orchestrator run state, per REQ-027 §"UI State Machine":
   * CONFIGURATION_ACTIVE → all editable; RUNNING → mode/strategy locked; PAUSED → all editable.
   */
  setRunState(state: ConfigRunState): void;
}
