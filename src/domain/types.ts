// Shared domain types (TASK-002). Pure type declarations — no runtime logic.
// See docs/INTERFACES.md §1 for the authoritative contract.

export type Direction = 'NORTH' | 'SOUTH' | 'EAST' | 'WEST';

// MF-004: signal states use uppercase string literals.
export type SignalState = 'RED' | 'GREEN' | 'AMBER';

// REQ-005
export type SignalCoordinationMode = 'STRICT_MUTUAL_EXCLUSION' | 'OPPOSING_SIMULTANEOUS';

// REQ-007
export type LaneSelectionStrategyKind = 'RANDOM' | 'INTELLIGENT';

// REQ-NEW-E1
export type EmergencyVehicleType = 'AMBULANCE' | 'POLICE' | 'FIRE_BRIGADE';

export type VehicleId = string; // UUID

export type Lane = 1 | 2 | 3;

// meters, intersection-center origin
export interface Vector2 {
  readonly x: number;
  readonly y: number;
}

export interface VehicleState {
  readonly id: VehicleId;
  readonly direction: Direction; // origin direction
  readonly exitDirection: Direction; // desired exit direction
  readonly lane: Lane;
  readonly position: Vector2;
  readonly speedKmh: number; // display unit — NF-001
  readonly speedMs: number; // physics unit — NF-001
  readonly isEmergency: boolean;
  readonly emergencyType?: EmergencyVehicleType;
  readonly yieldingActive: boolean; // REQ-NEW-E4
}

export interface SignalDirectionState {
  readonly direction: Direction;
  readonly state: SignalState;
  readonly secondsRemaining: number;
}
