import { describe, it, expect } from 'vitest';
import { speedKmhToMs, speedMsToKmh } from './unitConversion';

describe('unit conversion (NF-001)', () => {
  it('converts m/s to km/h', () => {
    expect(speedMsToKmh(10)).toBeCloseTo(36, 5);
  });

  it('converts km/h to m/s', () => {
    expect(speedKmhToMs(36)).toBeCloseTo(10, 5);
  });

  it('round-trips without drift', () => {
    expect(speedKmhToMs(speedMsToKmh(13.4))).toBeCloseTo(13.4, 5);
  });
});
