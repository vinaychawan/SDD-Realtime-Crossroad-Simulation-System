// Application entry point. Full cross-component wiring lands in TASK-067.
// TASK-053..059 expose the configuration UI against the existing public interfaces.
import { ConfigurationManager } from './components/ConfigurationManager/ConfigurationManager';
import { PhysicsEngine } from './components/PhysicsEngine/PhysicsEngine';
import { SimulationOrchestrator } from './components/SimulationOrchestrator/SimulationOrchestrator';
import { StateDisplayPanels } from './components/StateDisplayPanels/StateDisplayPanels';
import { UIController } from './components/UIController/UIController';

const configManager = new ConfigurationManager();
const orchestrator = new SimulationOrchestrator({
  physicsEngine: new PhysicsEngine(),
  configManager
});

const uiController = new UIController('app');
const stateDisplayRoot = document.createElement('div');
stateDisplayRoot.id = 'state-display';
document.getElementById('app')?.after(stateDisplayRoot);

const stateDisplayPanels = new StateDisplayPanels(stateDisplayRoot);
uiController.bind(configManager, orchestrator, stateDisplayPanels);
