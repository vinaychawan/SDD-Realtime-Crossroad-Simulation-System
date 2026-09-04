// Shared domain constants derived from the types in ./types.ts (TASK-002).
// Kept separate from types.ts so that module stays pure (types only, zero
// runtime logic) per its acceptance criteria.
import type { Direction, EmergencyVehicleType } from './types';

export const ALL_DIRECTIONS: readonly Direction[] = ['NORTH', 'SOUTH', 'EAST', 'WEST'];

export const ALL_EMERGENCY_TYPES: readonly EmergencyVehicleType[] = ['AMBULANCE', 'POLICE', 'FIRE_BRIGADE'];
