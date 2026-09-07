// Application entry point (TASK-067: Full cross-component integration).
// Wires all system components together per ARCHITECTURE.md component map.
import { ConfigurationManager } from './components/ConfigurationManager/ConfigurationManager';
import { PhysicsEngine } from './components/PhysicsEngine/PhysicsEngine';
import { SimulationOrchestrator } from './components/SimulationOrchestrator/SimulationOrchestrator';
import { SignalController } from './components/SignalController/SignalController';
import { ConflictZoneManager } from './components/ConflictZoneManager/ConflictZoneManager';
import { VehicleManager } from './components/VehicleManager/VehicleManager';
import { RandomLaneStrategy } from './components/VehicleManager/RandomLaneStrategy';
import { IntelligentLaneStrategy } from './components/VehicleManager/IntelligentLaneStrategy';
import { CollisionDetectionSystem } from './components/CollisionDetectionSystem/CollisionDetectionSystem';
import { EmergencyVehicleController } from './components/EmergencyVehicleController/EmergencyVehicleController';
import { MetricsCollector } from './components/MetricsCollector/MetricsCollector';
import { Telemetry } from './components/Telemetry/Telemetry';
import { RenderingEngine } from './components/RenderingEngine/RenderingEngine';
import { StateDisplayPanels } from './components/StateDisplayPanels/StateDisplayPanels';
import { UIController } from './components/UIController/UIController';
import { ALL_DIRECTIONS } from './domain/constants';
import type { CollisionEvent as CdsCollisionEvent } from './components/CollisionDetectionSystem/collision-detection-system.interface';
import type { CollisionEvent as TelemetryCollisionEvent } from './components/Telemetry/telemetry.interface';
import type { Direction } from './domain/types';

// --- 1. Configuration Manager (foundation) ---
const configManager = new ConfigurationManager();
let config = configManager.getSnapshot();

// --- 2. Telemetry (logging) ---
const telemetry = new Telemetry();

// --- 3. Core simulation components ---
const physicsEngine = new PhysicsEngine();

// Signal Controller - needs initialization with mode and timing
const signalController = new SignalController();
signalController.initialize(config.signalCoordinationMode, config.perDirection);

// Conflict Zone Manager
const conflictZoneManager = new ConflictZoneManager(config.conflictZone, telemetry);

// Vehicle Manager - needs a lane selection strategy
const laneStrategy = config.laneSelectionStrategy === 'RANDOM' 
  ? new RandomLaneStrategy() 
  : new IntelligentLaneStrategy();
const vehicleManager = new VehicleManager(config, laneStrategy);

// Collision Detection, Emergency Vehicles, Metrics
const collisionDetectionSystem = new CollisionDetectionSystem();
const emergencyVehicleController = new EmergencyVehicleController(config.emergency);
const metricsCollector = new MetricsCollector();

function getSimulationVehicles() {
  return [
    ...vehicleManager.getActiveVehicles(),
    ...emergencyVehicleController.getActiveEmergencyVehicles()
  ];
}

function getOppositeDirection(direction: Direction): Direction {
  switch (direction) {
    case 'NORTH':
      return 'SOUTH';
    case 'SOUTH':
      return 'NORTH';
    case 'EAST':
      return 'WEST';
    case 'WEST':
      return 'EAST';
  }
}

function despawnExitedRegularVehicles(timestampMs: number): void {
  for (const vehicle of vehicleManager.getActiveVehicles()) {
    if (Math.abs(vehicle.position.x) > 70 || Math.abs(vehicle.position.y) > 70) {
      vehicleManager.despawnVehicle(vehicle.id);
      metricsCollector.recordDespawn(timestampMs);
    }
  }
}

// --- 4. Rendering Engine ---
const canvasElement = document.createElement('canvas');
canvasElement.id = 'simulation-canvas';
canvasElement.width = 800;
canvasElement.height = 800;
document.getElementById('app')?.prepend(canvasElement);

const renderingEngine = new RenderingEngine({
  canvas: canvasElement,
  conflictZoneSizeMeters: config.conflictZone.sizeMeters,
  signalMode: config.signalCoordinationMode
});

// --- 5. Simulation Orchestrator (main loop) ---
const orchestrator = new SimulationOrchestrator({
  physicsEngine,
  configManager
});

// --- 6. Wire Metrics Providers ---
metricsCollector.setVehiclesProvider(getSimulationVehicles);
metricsCollector.setRenderFpsProvider(() => orchestrator.getRenderFrameRate());
metricsCollector.setPhysicsHzProvider(() => orchestrator.getPhysicsTickRate());
metricsCollector.setMemoryMbProvider(() => (performance as any).memory?.usedJSHeapSize / (1024 * 1024) || 0);
metricsCollector.setCpuPercentProvider(() => 0); // Not available in browser

// --- 7. Wire Collision Detection → Telemetry ---
collisionDetectionSystem.onCollision((cdsEvent: CdsCollisionEvent) => {
  const telemetryEvent: TelemetryCollisionEvent = {
    timestampMs: cdsEvent.timestampMs,
    eventType: 'COLLISION',
    level: 'ERROR',
    vehicleIds: cdsEvent.vehicleIds,
    position: cdsEvent.position
  };
  telemetry.logEvent(telemetryEvent);
});

// --- 8. Wire Collision Detection → Metrics Collector ---
collisionDetectionSystem.onCollision((event) => {
  metricsCollector.recordCollision(event);
});

// --- 9. Wire Configuration Changes ---
configManager.onChange((snapshot) => {
  // Note: Signal mode cannot be changed at runtime (StartupOnlyFieldError)
  // but other config changes can be applied
  telemetry.logEvent({
    timestampMs: Date.now(),
    eventType: 'CONFIG_CHANGE',
    level: 'INFO',
    field: 'config',
    oldValue: config,
    newValue: snapshot
  });
  config = snapshot;
  emergencyVehicleController.updateEmergencyConfig(snapshot.emergency);
});

let simulationTimeMs = 0;
const regularSpawnAccumulatorsMs: Record<Direction, number> = {
  NORTH: 0,
  SOUTH: 0,
  EAST: 0,
  WEST: 0
};

// --- 10. Wire Physics Tick (100 Hz fixed timestep) ---
orchestrator.onPhysicsTick((deltaMs) => {
  simulationTimeMs += deltaMs;

  // 10a. Update signal controller timing
  signalController.tick(deltaMs);

  // 10b. Schedule regular traffic from configured per-direction rates
  for (const direction of ALL_DIRECTIONS) {
    const spawnRatePerMinute = config.perDirection[direction].spawnRatePerMinute;
    if (spawnRatePerMinute <= 0) {
      regularSpawnAccumulatorsMs[direction] = 0;
      continue;
    }

    const spawnIntervalMs = 60_000 / spawnRatePerMinute;
    regularSpawnAccumulatorsMs[direction] += deltaMs;
    while (regularSpawnAccumulatorsMs[direction] >= spawnIntervalMs) {
      regularSpawnAccumulatorsMs[direction] -= spawnIntervalMs;
      vehicleManager.spawnVehicle(direction, getOppositeDirection(direction));
    }
  }
  
  // 10c. Spawn emergency vehicles (Poisson process)
  emergencyVehicleController.tick(deltaMs);

  // 10d. Process queued regular-vehicle spawns
  vehicleManager.tick(deltaMs);
  
  // 10e. Remove regular vehicles that left the simulation boundary
  despawnExitedRegularVehicles(simulationTimeMs);

  // 10f. Get all active vehicles
  const vehicles = getSimulationVehicles();
  
  // 10g. Apply regular-vehicle yielding near emergency vehicles
  const yieldingEffects = emergencyVehicleController.computeYieldingEffects(vehicles);
  for (const vehicle of vehicles) {
    const effect = yieldingEffects.get(vehicle.id);
    if (effect) {
      Object.assign(vehicle, {
        speedMs: vehicle.speedMs * effect.targetSpeedFactor,
        speedKmh: vehicle.speedKmh * effect.targetSpeedFactor,
        yieldingActive: true
      });
    }
  }

  // 10h. Update conflict zone occupancy
  conflictZoneManager.updateOccupancy(vehicles);
  
  // 10i. Request conflict zone entry decisions
  for (const vehicle of vehicles) {
    conflictZoneManager.requestEntry(vehicle);
  }
  
  // 10j. Check for deadlocked vehicles and apply recovery
  const deadlockedVehicles = conflictZoneManager.getDeadlockedVehicles();
  for (const vehicle of deadlockedVehicles) {
    conflictZoneManager.applyDeadlockRecovery(vehicle.id, 'CONSERVATIVE');
    metricsCollector.recordDeadlock();
  }
  
  // 10k. Update vehicle physics (one at a time)
  for (const vehicle of vehicles) {
    Object.assign(vehicle, physicsEngine.tick(vehicle, deltaMs));
  }
  
  // 10l. Collision detection
  collisionDetectionSystem.tick(vehicles);

  // 10m. Update metrics clock
  metricsCollector.updateTime(simulationTimeMs);
  
  // 10n. Update metrics snapshot (called at 10 Hz from separate interval below)
});

// --- 11. Wire Render Frame (30 or 60 Hz) ---
orchestrator.onRenderFrame(() => {
  const vehicles = getSimulationVehicles();
  const signalStates = signalController.getStates();
  const conflictZoneOccupants = conflictZoneManager.getOccupants();
  
  // Render the simulation
  renderingEngine.renderFrame(
    vehicles,
    signalStates,
    conflictZoneOccupants.map(v => v.id)
  );
});

// --- 12. UI Controller & State Display Panels ---
const uiController = new UIController('app');
const stateDisplayRoot = document.createElement('div');
stateDisplayRoot.id = 'state-display';
document.getElementById('app')?.after(stateDisplayRoot);

const stateDisplayPanels = new StateDisplayPanels(stateDisplayRoot);
uiController.bind(configManager, orchestrator, stateDisplayPanels);

// --- 13. Wire Metrics Update (10 Hz) ---
setInterval(() => {
  metricsCollector.tick();
}, 100); // 10 Hz metrics update

// --- 14. Wire Metrics → State Display (10 Hz updates) ---
setInterval(() => {
  const snapshot = metricsCollector.getSnapshot();
  const signalStates = signalController.getStates();
  
  stateDisplayPanels.updateConfiguration(config);
  stateDisplayPanels.updateSignalStatus(signalStates);
  stateDisplayPanels.refreshMetrics(snapshot);
}, 100); // 10 Hz

// --- 15. Log system start ---
telemetry.logEvent({
  timestampMs: Date.now(),
  eventType: 'SYSTEM_START',
  level: 'INFO',
  message: 'Simulation system initialized'
});

// --- 16. Expose for debugging (optional) ---
(window as any).__simulation = {
  configManager,
  orchestrator,
  vehicleManager,
  signalController,
  conflictZoneManager,
  collisionDetectionSystem,
  emergencyVehicleController,
  metricsCollector,
  telemetry,
  renderingEngine
};
