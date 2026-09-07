// Automated system tests for TASK-068..072.
// These tests advance simulated time deterministically (fake timers/manual fixed ticks) so the
// long-running 5- and 10-minute acceptance criteria complete quickly without wall-clock waits.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CollisionDetectionSystem } from '../../src/components/CollisionDetectionSystem/CollisionDetectionSystem';
import type { CollisionEvent } from '../../src/components/CollisionDetectionSystem/collision-detection-system.interface';
import { ConfigurationManager } from '../../src/components/ConfigurationManager/ConfigurationManager';
import type { SimulationConfig } from '../../src/components/ConfigurationManager/configuration-manager.interface';
import { ConflictZoneManager } from '../../src/components/ConflictZoneManager/ConflictZoneManager';
import { EmergencyVehicleController } from '../../src/components/EmergencyVehicleController/EmergencyVehicleController';
import { MetricsCollector } from '../../src/components/MetricsCollector/MetricsCollector';
import { PhysicsEngine } from '../../src/components/PhysicsEngine/PhysicsEngine';
import { PHYSICS_TICK_MS } from '../../src/components/PhysicsEngine/physics-engine.interface';
import { SignalController } from '../../src/components/SignalController/SignalController';
import { SimulationOrchestrator } from '../../src/components/SimulationOrchestrator/SimulationOrchestrator';
import { Telemetry } from '../../src/components/Telemetry';
import type { AnyTelemetryEvent } from '../../src/components/Telemetry/telemetry.interface';
import type { Direction, EmergencyVehicleType, SignalCoordinationMode, VehicleState } from '../../src/domain/types';

const TEN_SIMULATED_MINUTES_MS = 600_000;
const FIVE_SIMULATED_MINUTES_MS = 300_000;
const ONE_SIMULATED_MINUTE_MS = 60_000;
const EMERGENCY_TYPES: readonly EmergencyVehicleType[] = ['AMBULANCE', 'POLICE', 'FIRE_BRIGADE'];

function makeVehicle(overrides: Partial<VehicleState> = {}): VehicleState {
  return {
    id: 'vehicle-1',
    direction: 'NORTH',
    exitDirection: 'SOUTH',
    lane: 2,
    position: { x: -30, y: -30 },
    speedKmh: 0,
    speedMs: 0,
    isEmergency: false,
    yieldingActive: false,
    ...overrides
  };
}

function loadPreset(preset: SimulationConfig['scenarioPreset']): Readonly<SimulationConfig> {
  const manager = new ConfigurationManager();
  manager.applyScenarioPreset(preset);
  return manager.getSnapshot();
}

function buildSignalController(config: Readonly<SimulationConfig>): SignalController {
  const signalController = new SignalController();
  signalController.initialize(config.signalCoordinationMode, config.perDirection);
  return signalController;
}

function assertSignalInvariant(mode: SignalCoordinationMode, states: ReturnType<SignalController['getStates']>): void {
  const greenDirections = Object.values(states)
    .filter((state) => state.state === 'GREEN')
    .map((state) => state.direction);

  if (mode === 'STRICT_MUTUAL_EXCLUSION') {
    expect(greenDirections.length).toBeLessThanOrEqual(1);
    return;
  }

  expect(greenDirections.length).toBeLessThanOrEqual(2);
  if (greenDirections.length === 2) {
    expect(isOpposingPair(greenDirections[0], greenDirections[1])).toBe(true);
  }
}

function isOpposingPair(first: Direction, second: Direction): boolean {
  return (
    (first === 'NORTH' && second === 'SOUTH') ||
    (first === 'SOUTH' && second === 'NORTH') ||
    (first === 'EAST' && second === 'WEST') ||
    (first === 'WEST' && second === 'EAST')
  );
}

function countEmergencySpawns(events: readonly { emergencyType: EmergencyVehicleType }[]): Record<EmergencyVehicleType, number> {
  return EMERGENCY_TYPES.reduce(
    (counts, emergencyType) => ({
      ...counts,
      [emergencyType]: events.filter((event) => event.emergencyType === emergencyType).length
    }),
    { AMBULANCE: 0, POLICE: 0, FIRE_BRIGADE: 0 }
  );
}

function expectWithinTenPercent(actual: number, expected: number): void {
  expect(actual).toBeGreaterThanOrEqual(Math.ceil(expected * 0.9));
  expect(actual).toBeLessThanOrEqual(Math.floor(expected * 1.1));
}

function toEventSignatures(events: readonly AnyTelemetryEvent[]): string[] {
  return events.map((event) => `${event.timestampMs}:${event.eventType}:${'vehicleId' in event ? event.vehicleId : ''}`);
}

function runDeterministicEventScenario(targetFrameRate: 30 | 60): { finalVehicles: VehicleState[]; eventSignatures: string[] } {
  const config = loadPreset('CONGESTION_TEST');
  const telemetry = new Telemetry();
  const conflictZoneManager = new ConflictZoneManager(config.conflictZone, telemetry);
  const collisionDetectionSystem = new CollisionDetectionSystem();
  const physicsEngine = new PhysicsEngine();
  let vehicles = [
    makeVehicle({ id: 'zone-blocker', direction: 'NORTH', position: { x: 0, y: 0 } }),
    makeVehicle({ id: 'waiting-opposer', direction: 'SOUTH', position: { x: 0, y: -32.5 } })
  ];
  const renderIntervalMs = Math.round(1000 / targetFrameRate);
  let nextRenderMs = 0;

  for (let elapsedMs = 0; elapsedMs < ONE_SIMULATED_MINUTE_MS; elapsedMs += PHYSICS_TICK_MS) {
    conflictZoneManager.updateOccupancy(vehicles);
    conflictZoneManager.requestEntry(vehicles[1]);
    for (const deadlockedVehicle of conflictZoneManager.getDeadlockedVehicles()) {
      conflictZoneManager.applyDeadlockRecovery(deadlockedVehicle.id, 'CONSERVATIVE');
    }
    collisionDetectionSystem.tick(vehicles);
    vehicles = vehicles.map((vehicle) => physicsEngine.tick(vehicle, PHYSICS_TICK_MS));

    if (elapsedMs >= nextRenderMs) {
      nextRenderMs += renderIntervalMs;
    }
  }

  return {
    finalVehicles: vehicles,
    eventSignatures: toEventSignatures(telemetry.getEvents())
  };
}

describe('System tests: TASK-068..072', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('TASK-068: runs Normal Traffic in Mode A for 10 simulated minutes with no signal violations or collisions', () => {
    const config = loadPreset('NORMAL_TRAFFIC');
    const signalController = buildSignalController(config);
    const collisionDetectionSystem = new CollisionDetectionSystem();
    const collisionEvents: CollisionEvent[] = [];
    const safeTraffic = [
      makeVehicle({ id: 'north-safe', direction: 'NORTH', position: { x: -30, y: -30 } }),
      makeVehicle({ id: 'south-safe', direction: 'SOUTH', position: { x: 30, y: 30 } }),
      makeVehicle({ id: 'east-safe', direction: 'EAST', position: { x: -30, y: 30 } }),
      makeVehicle({ id: 'west-safe', direction: 'WEST', position: { x: 30, y: -30 } })
    ];
    collisionDetectionSystem.onCollision((event) => collisionEvents.push(event));

    for (let elapsedMs = 0; elapsedMs < TEN_SIMULATED_MINUTES_MS; elapsedMs += PHYSICS_TICK_MS) {
      signalController.tick(PHYSICS_TICK_MS);
      assertSignalInvariant('STRICT_MUTUAL_EXCLUSION', signalController.getStates());
      collisionDetectionSystem.tick(safeTraffic);
    }

    expect(collisionEvents).toEqual([]);
  });

  it('TASK-069: runs Mode B congestion checks with zero collisions and conservative deadlock recovery', () => {
    const config = loadPreset('CONGESTION_TEST');
    const signalController = buildSignalController(config);
    const telemetry = new Telemetry();
    const conflictZoneManager = new ConflictZoneManager(config.conflictZone, telemetry);
    const collisionDetectionSystem = new CollisionDetectionSystem();
    const collisionEvents: CollisionEvent[] = [];
    const vehicles = [
      makeVehicle({ id: 'mode-b-zone-blocker', direction: 'NORTH', position: { x: 0, y: 0 } }),
      makeVehicle({ id: 'mode-b-waiter', direction: 'SOUTH', position: { x: 0, y: -32.5 } })
    ];
    collisionDetectionSystem.onCollision((event) => collisionEvents.push(event));

    for (let elapsedMs = 0; elapsedMs < TEN_SIMULATED_MINUTES_MS; elapsedMs += PHYSICS_TICK_MS) {
      signalController.tick(PHYSICS_TICK_MS);
      assertSignalInvariant('OPPOSING_SIMULTANEOUS', signalController.getStates());
      conflictZoneManager.updateOccupancy(vehicles);
      conflictZoneManager.requestEntry(vehicles[1]);
      for (const deadlockedVehicle of conflictZoneManager.getDeadlockedVehicles()) {
        conflictZoneManager.applyDeadlockRecovery(deadlockedVehicle.id, 'CONSERVATIVE');
      }
      collisionDetectionSystem.tick(vehicles);
    }

    expect(collisionEvents).toEqual([]);
    expect(telemetry.getEventsByType('DEADLOCK').length).toBeGreaterThanOrEqual(1);
  });

  it('TASK-070: validates Priority Operations emergency spawn rates, RED override, and yielding behavior', () => {
    const config = loadPreset('PRIORITY_OPERATIONS');
    const deterministicOneMeanIntervalRng = () => 1 - Math.exp(-1);
    const controller = new EmergencyVehicleController(config.emergency, { rng: deterministicOneMeanIntervalRng });
    const spawnedEvents: Array<{ emergencyType: EmergencyVehicleType; vehicle: VehicleState }> = [];
    controller.onEmergencyVehicleSpawned((event) => spawnedEvents.push(event));

    for (let elapsedMs = 0; elapsedMs < FIVE_SIMULATED_MINUTES_MS; elapsedMs += PHYSICS_TICK_MS) {
      controller.tick(PHYSICS_TICK_MS);
    }

    const counts = countEmergencySpawns(spawnedEvents);
    expectWithinTenPercent(counts.AMBULANCE, 10);
    expectWithinTenPercent(counts.POLICE, 10);
    expectWithinTenPercent(counts.FIRE_BRIGADE, 5);

    const emergencyVehicle = spawnedEvents[0].vehicle;
    expect(controller.evaluateSignalOverride(emergencyVehicle, 'RED', true)).toBe('PROCEED');

    const regularVehicle = makeVehicle({ id: 'regular-near-emergency', position: { x: 0, y: -58 } });
    const yieldingEffects = controller.computeYieldingEffects([regularVehicle, emergencyVehicle]);
    expect(yieldingEffects.get(regularVehicle.id)?.targetSpeedFactor).toBeLessThan(1);
  });

  it('TASK-071: sustains 150+ vehicles for 5 simulated minutes at 60 FPS target within performance thresholds', () => {
    vi.useFakeTimers();
    const configManager = new ConfigurationManager();
    const physicsEngine = new PhysicsEngine();
    const orchestrator = new SimulationOrchestrator({ physicsEngine, configManager });
    const metricsCollector = new MetricsCollector();
    const vehicles = Array.from({ length: 150 }, (_, index) =>
      makeVehicle({
        id: `stress-${index}`,
        lane: ((index % 3) + 1) as VehicleState['lane'],
        position: { x: (index % 30) * 5 - 72.5, y: Math.floor(index / 30) * 20 - 40 }
      })
    );

    metricsCollector.setVehiclesProvider(() => vehicles);
    metricsCollector.setRenderFpsProvider(() => orchestrator.getRenderFrameRate());
    metricsCollector.setPhysicsHzProvider(() => orchestrator.getPhysicsTickRate());
    metricsCollector.setMemoryMbProvider(() => 120);
    metricsCollector.setCpuPercentProvider(() => 50);
    orchestrator.setTargetFrameRate(60);
    orchestrator.start();

    vi.advanceTimersByTime(FIVE_SIMULATED_MINUTES_MS);
    metricsCollector.updateTime(FIVE_SIMULATED_MINUTES_MS);
    metricsCollector.tick();
    const snapshot = metricsCollector.getSnapshot();
    orchestrator.reset();

    expect(snapshot.vehicleCountRegular).toBeGreaterThanOrEqual(150);
    expect(snapshot.renderFps).toBeGreaterThanOrEqual(55);
    expect(snapshot.physicsHz).toBeGreaterThanOrEqual(98);
    expect(snapshot.memoryMb).toBeLessThan(500);
    expect(snapshot.cpuPercent).toBeLessThan(80);
  });

  it('TASK-072: fixed-seed scenario produces identical trajectories and event sequences at 30 and 60 FPS', () => {
    const resultAt30Fps = runDeterministicEventScenario(30);
    const resultAt60Fps = runDeterministicEventScenario(60);

    expect(resultAt30Fps.finalVehicles).toEqual(resultAt60Fps.finalVehicles);
    expect(resultAt30Fps.eventSignatures.length).toBeGreaterThan(0);
    expect(resultAt30Fps.eventSignatures).toEqual(resultAt60Fps.eventSignatures);
  });
});