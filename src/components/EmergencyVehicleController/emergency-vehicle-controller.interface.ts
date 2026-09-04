// Emergency Vehicle Controller public contract (TASK-038).
// Mirrors docs/INTERFACES.md §7 and adds event payloads for TASK-039 acceptance tests.
import type { Direction, EmergencyVehicleType, SignalState, VehicleId, VehicleState } from '../../domain/types';

export interface YieldingEffect {
  readonly targetSpeedFactor: number;
  readonly laneChangeDirection: 'LEFT' | 'RIGHT' | 'NONE';
}

export interface EmergencyVehicleSpawnedEvent {
  readonly vehicleId: VehicleId;
  readonly emergencyType: EmergencyVehicleType;
  readonly direction: Direction;
  readonly exitDirection: Direction;
  readonly timestampMs: number;
  readonly vehicle: VehicleState;
}

export interface IEmergencyVehicleController {
  /** Advances the per-type Poisson spawn processes by one deterministic physics tick. */
  tick(deltaMs: number): void;

  /** Signal-override decision for an emergency vehicle approaching any signal state. */
  evaluateSignalOverride(vehicle: VehicleState, signalState: SignalState, intersectionOccupied: boolean): 'PROCEED';

  /** Computes regular-vehicle yielding effects near active emergency vehicles. */
  computeYieldingEffects(vehicles: VehicleState[]): Map<VehicleId, YieldingEffect>;
}
