// Unit conversion helpers (NF-001: display speed in km/h, physics in m/s).
// Kept separate from src/domain/types.ts so that module stays pure.

/** m/s → km/h conversion factor. */
export const MS_TO_KMH = 3.6;

export function speedMsToKmh(speedMs: number): number {
  return speedMs * MS_TO_KMH;
}

export function speedKmhToMs(speedKmh: number): number {
  return speedKmh / MS_TO_KMH;
}
