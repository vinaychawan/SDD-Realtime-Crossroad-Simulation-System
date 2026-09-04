import { describe, it, expect } from 'vitest';
import { ALL_DIRECTIONS, ALL_EMERGENCY_TYPES } from './constants';

describe('domain constants', () => {
  it('defines all four directions', () => {
    expect(ALL_DIRECTIONS).toEqual(['NORTH', 'SOUTH', 'EAST', 'WEST']);
  });

  it('defines all three emergency vehicle types', () => {
    expect(ALL_EMERGENCY_TYPES).toEqual(['AMBULANCE', 'POLICE', 'FIRE_BRIGADE']);
  });
});
